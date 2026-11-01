const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/products
 * Fetch all products or search by query/category/brand/barcode
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { search, categoryId, brandId, barcode, sku, page = 1, limit = 50 } = req.query;

    const where = { status: 'ACTIVE' };

    if (categoryId && categoryId !== 'ALL') {
      where.categoryId = categoryId;
    }
    if (brandId && brandId !== 'ALL') {
      where.brandId = brandId;
    }

    if (barcode || sku) {
      const code = (barcode || sku).trim();
      const variant = await prisma.productVariant.findFirst({
        where: {
          OR: [
            { barcode: code },
            { sku: code },
            { barcodes: { some: { barcode: code } } },
          ],
        },
        include: {
          product: { include: { category: true, brand: true } },
          size: true,
          color: true,
          barcodes: true,
        },
      });

      if (!variant) {
        return res.status(404).json({ error: `Garment with barcode / SKU "${code}" not found.` });
      }
      return res.json({ variant, product: variant.product });
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
        {
          variants: {
            some: {
              OR: [
                { sku: { contains: q } },
                { barcode: { contains: q } },
                { fabric: { contains: q } },
                { color: { name: { contains: q } } },
                { size: { name: { contains: q } } },
              ],
            },
          },
        },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          brand: true,
          variants: {
            where: { status: 'ACTIVE' },
            include: { size: true, color: true, barcodes: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      products,
      totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/:id
 */
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        brand: true,
        variants: {
          include: { size: true, color: true, barcodes: true },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/products
 * Create product with variants matrix in an ACID transaction
 */
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const {
      name,
      categoryId,
      brandId,
      description,
      image,
      basePrice,
      variants = [], // Array of variant combinations
    } = req.body;

    if (!name || !categoryId) {
      return res.status(400).json({ error: 'Product name and category are required.' });
    }

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create main Product
      const product = await tx.product.create({
        data: {
          name,
          slug,
          categoryId,
          brandId: brandId || null,
          description: description || null,
          image:
            image ||
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80',
          basePrice: parseFloat(basePrice) || 0,
        },
      });

      // 2. Generate or process variants
      const createdVariants = [];
      const branch = req.user.branchId
        ? await tx.branch.findUnique({ where: { id: req.user.branchId } })
        : await tx.branch.findFirst();

      const variantsList = variants.length > 0 ? variants : [
        {
          sizeId: null,
          colorId: null,
          fabric: 'Standard',
          pattern: 'Solid',
          season: 'All Season',
          sellingPrice: parseFloat(basePrice) || 1000,
          purchasePrice: (parseFloat(basePrice) || 1000) * 0.6,
          stockQuantity: 10,
        },
      ];

      for (let i = 0; i < variantsList.length; i++) {
        const v = variantsList[i];
        const uniqueSuffix = `${Date.now().toString().slice(-5)}${i}`;
        const autoBarcode = v.barcode ? v.barcode.trim() : `890${Date.now().toString().slice(-9)}${i}`;
        const autoSku = v.sku ? v.sku.trim() : `SKU-${Date.now().toString().slice(-6)}-${i}`;

        const variant = await tx.productVariant.create({
          data: {
            productId: product.id,
            sizeId: v.sizeId || null,
            colorId: v.colorId || null,
            fabric: v.fabric || null,
            pattern: v.pattern || null,
            season: v.season || 'All Season',
            sku: autoSku,
            barcode: autoBarcode,
            purchasePrice: parseFloat(v.purchasePrice) || 0,
            sellingPrice: parseFloat(v.sellingPrice) || parseFloat(basePrice) || 0,
            wholesalePrice: parseFloat(v.wholesalePrice) || (parseFloat(v.sellingPrice) || 0) * 0.85,
            stockQuantity: parseInt(v.stockQuantity) || 0,
            minStockAlert: parseInt(v.minStockAlert) || 5,
          },
        });

        // Barcode index
        await tx.barcode.create({
          data: {
            variantId: variant.id,
            barcode: autoBarcode,
            format: 'CODE128',
            isPrimary: true,
          },
        });

        // Stock movement if initial stock > 0
        if (parseInt(v.stockQuantity) > 0) {
          await tx.stockMovement.create({
            data: {
              variantId: variant.id,
              branchId: branch?.id || null,
              movementType: 'OPENING_STOCK',
              quantity: parseInt(v.stockQuantity),
              costPrice: parseFloat(v.purchasePrice) || 0,
              notes: 'Initial inventory creation',
              createdBy: req.user.id,
            },
          });
        }

        createdVariants.push(variant);
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'CREATE_PRODUCT',
          module: 'PRODUCTS',
          recordId: product.id,
          details: `Created product "${product.name}" with ${createdVariants.length} variants`,
          ipAddress: req.ip,
        },
      });

      return { product, variants: createdVariants };
    });

    res.status(201).json({
      message: 'Product and variants created successfully.',
      product: result.product,
      variants: result.variants,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/products/:id
 */
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { name, categoryId, brandId, description, image, basePrice, status } = req.body;

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(categoryId && { categoryId }),
        ...(brandId !== undefined && { brandId }),
        ...(description !== undefined && { description }),
        ...(image && { image }),
        ...(basePrice !== undefined && { basePrice: parseFloat(basePrice) }),
        ...(status && { status }),
      },
    });

    res.json({ message: 'Product updated successfully.', product });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/products/:id
 */
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    // Soft delete / archive
    await prisma.product.update({
      where: { id: req.params.id },
      data: { status: 'ARCHIVED' },
    });

    res.json({ message: 'Product archived successfully.' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/products/variants/:id/barcode
 * Add or regenerate barcode for variant
 */
router.post('/variants/:id/barcode', authenticateToken, async (req, res, next) => {
  try {
    const { barcode, format = 'CODE128', isPrimary = false } = req.body;
    const newBarcode = barcode || `890${Date.now()}`;

    const created = await prisma.barcode.create({
      data: {
        variantId: req.params.id,
        barcode: newBarcode,
        format,
        isPrimary,
      },
    });

    res.json({ message: 'Barcode created successfully', barcode: created });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
