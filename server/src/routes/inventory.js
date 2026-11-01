const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/inventory
 * Complete variant inventory overview with filters
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { search, categoryId, status = 'ALL', sizeId, colorId } = req.query;

    const where = { status: 'ACTIVE' };

    if (categoryId && categoryId !== 'ALL') {
      where.product = { categoryId };
    }
    if (sizeId && sizeId !== 'ALL') {
      where.sizeId = sizeId;
    }
    if (colorId && colorId !== 'ALL') {
      where.colorId = colorId;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { sku: { contains: q } },
        { barcode: { contains: q } },
        { fabric: { contains: q } },
        { product: { name: { contains: q } } },
      ];
    }

    let variants = await prisma.productVariant.findMany({
      where,
      orderBy: [{ stockQuantity: 'asc' }, { updatedAt: 'desc' }],
      include: {
        product: { include: { category: true, brand: true } },
        size: true,
        color: true,
        barcodes: true,
      },
    });

    if (status === 'LOW_STOCK') {
      variants = variants.filter((v) => v.stockQuantity > 0 && v.stockQuantity <= v.minStockAlert);
    } else if (status === 'OUT_OF_STOCK') {
      variants = variants.filter((v) => v.stockQuantity <= 0);
    }

    const summary = {
      totalItems: variants.length,
      totalQuantity: variants.reduce((sum, v) => sum + v.stockQuantity, 0),
      totalValuationCost: variants.reduce((sum, v) => sum + v.stockQuantity * Number(v.purchasePrice), 0),
      totalValuationRetail: variants.reduce((sum, v) => sum + v.stockQuantity * Number(v.sellingPrice), 0),
      lowStockCount: variants.filter((v) => v.stockQuantity > 0 && v.stockQuantity <= v.minStockAlert).length,
      outOfStockCount: variants.filter((v) => v.stockQuantity <= 0).length,
    };

    res.json({ variants, summary });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/inventory/adjust
 * Adjust stock for physical count reconciliation, damages, or lost stock
 */
router.post('/adjust', authenticateToken, async (req, res, next) => {
  try {
    const {
      variantId,
      adjustmentType, // 'ADD' (Stock In), 'SUBTRACT' (Stock Out), 'SET' (Count reconciliation)
      quantity,
      reason = 'COUNT_RECONCILIATION', // 'DAMAGE', 'LOST', 'COUNT_RECONCILIATION', 'SAMPLE', 'OTHER'
      notes,
    } = req.body;

    if (!variantId || quantity === undefined) {
      return res.status(400).json({ error: 'Variant ID and quantity are required.' });
    }

    const branchId = req.user.branchId || (await prisma.branch.findFirst())?.id;
    const qty = parseInt(quantity);

    const result = await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
        include: { product: true },
      });

      if (!variant) throw new Error('Variant not found.');

      let newStock = variant.stockQuantity;
      let diff = 0;

      if (adjustmentType === 'ADD') {
        newStock += qty;
        diff = qty;
      } else if (adjustmentType === 'SUBTRACT') {
        newStock = Math.max(0, newStock - qty);
        diff = -qty;
      } else if (adjustmentType === 'SET') {
        diff = qty - variant.stockQuantity;
        newStock = qty;
      }

      const updated = await tx.productVariant.update({
        where: { id: variantId },
        data: { stockQuantity: newStock },
      });

      await tx.stockMovement.create({
        data: {
          variantId,
          branchId,
          movementType: `ADJUST_${reason}`,
          quantity: diff,
          costPrice: variant.purchasePrice,
          notes: notes || `Manual stock adjustment: ${adjustmentType} ${qty} (${reason})`,
          createdBy: req.user.id,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'STOCK_ADJUSTMENT',
          module: 'INVENTORY',
          recordId: variantId,
          details: `Adjusted "${variant.product.name}" (${variant.sku}) stock from ${variant.stockQuantity} to ${newStock}`,
          ipAddress: req.ip,
        },
      });

      return updated;
    });

    res.json({ message: 'Stock adjusted successfully.', variant: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/inventory/movements
 * Full stock movements audit ledger
 */
router.get('/movements', authenticateToken, async (req, res, next) => {
  try {
    const { variantId, page = 1, limit = 50 } = req.query;
    const where = {};
    if (variantId) where.variantId = variantId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [movements, totalCount] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          variant: {
            include: { product: { select: { name: true } }, size: true, color: true },
          },
          branch: { select: { name: true } },
          user: { select: { name: true } },
        },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    res.json({ movements, totalCount });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/inventory/transfers
 * Inter-branch transfers list
 */
router.get('/transfers', authenticateToken, async (req, res, next) => {
  try {
    const transfers = await prisma.stockTransfer.findMany({
      orderBy: { transferDate: 'desc' },
      include: {
        fromBranch: { select: { name: true } },
        toBranch: { select: { name: true } },
      },
    });
    res.json({ transfers });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/inventory/transfers
 * Create inter-branch stock transfer
 */
router.post('/transfers', authenticateToken, async (req, res, next) => {
  try {
    const { fromBranchId, toBranchId, notes } = req.body;
    if (!fromBranchId || !toBranchId) {
      return res.status(400).json({ error: 'Source and destination branches are required.' });
    }

    const transferNumber = `TRF-${Date.now().toString().slice(-6)}`;
    const transfer = await prisma.stockTransfer.create({
      data: {
        transferNumber,
        fromBranchId,
        toBranchId,
        status: 'PENDING',
        notes: notes || null,
        createdBy: req.user.id,
      },
      include: { fromBranch: true, toBranch: true },
    });

    res.status(201).json({ message: 'Stock transfer initiated.', transfer });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
