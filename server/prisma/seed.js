const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING LADIES BOUTIQUE DATABASE ---');

  // 1. Roles
  const superAdminRole = await prisma.role.upsert({
    where: { slug: 'SUPER_ADMIN' },
    update: {},
    create: {
      name: 'Super Admin',
      slug: 'SUPER_ADMIN',
      description: 'Full access to all boutique systems, settings, and financials',
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { slug: 'STORE_MANAGER' },
    update: {},
    create: {
      name: 'Store Manager',
      slug: 'STORE_MANAGER',
      description: 'Manages sales, inventory, purchases, staff, and branch reports',
    },
  });

  const cashierRole = await prisma.role.upsert({
    where: { slug: 'CASHIER' },
    update: {},
    create: {
      name: 'Cashier',
      slug: 'CASHIER',
      description: 'Operates POS terminal, scans barcodes, takes payments, and prints bills',
    },
  });

  const inventoryRole = await prisma.role.upsert({
    where: { slug: 'INVENTORY_MANAGER' },
    update: {},
    create: {
      name: 'Inventory Manager',
      slug: 'INVENTORY_MANAGER',
      description: 'Oversees warehouse stock, receiving, stock adjustments and branch transfers',
    },
  });

  // 2. Permissions
  const permissionsList = [
    { name: 'Access POS', slug: 'pos.access', module: 'POS' },
    { name: 'Apply Discount', slug: 'pos.discount', module: 'POS' },
    { name: 'Process Refund/Return', slug: 'pos.refund', module: 'POS' },
    { name: 'Cancel Invoice', slug: 'pos.cancel', module: 'POS' },
    { name: 'View Cost & Profits', slug: 'reports.profit', module: 'REPORTS' },
    { name: 'Manage Products', slug: 'products.manage', module: 'PRODUCTS' },
    { name: 'Manage Inventory', slug: 'inventory.manage', module: 'INVENTORY' },
    { name: 'Manage Purchases', slug: 'purchases.manage', module: 'PURCHASES' },
    { name: 'View Analytics', slug: 'reports.view', module: 'REPORTS' },
    { name: 'Manage Settings', slug: 'settings.manage', module: 'SETTINGS' },
  ];

  for (const perm of permissionsList) {
    const p = await prisma.permission.upsert({
      where: { slug: perm.slug },
      update: {},
      create: perm,
    });
    // Link to super admin
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: p.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: p.id,
      },
    });
  }

  // 3. Store & Branches
  const store = await prisma.store.create({
    data: {
      name: 'MR BILAL LADIES WEAR & COUTURE',
      code: 'MRB-HQ',
      logo: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&q=80',
      address: 'Plot 45-C, Fashion Boulevard, Gulberg III, Lahore, Pakistan',
      phone: '+92 42 35789000',
      email: 'contact@mrbilalwear.com',
      taxNumber: 'STRN-98765432-1',
      currency: 'PKR',
      receiptHeader: 'MR BILAL LADIES WEAR & COUTURE\nExquisite Eastern & Western Fashion\nMM Alam Road, Gulberg III, Lahore\nTel: +92 42 35789000 | GST#: 98765432-1',
      receiptFooter: 'Thank you for shopping at MR BILAL!\nExchange allowed within 7 days with original tag and receipt.\nNo refunds on stitched couture or sale items.',
    },
  });

  const branchLhr = await prisma.branch.create({
    data: {
      storeId: store.id,
      name: 'Gulberg Flagship - Lahore',
      code: 'LHR-01',
      address: 'Shop 12-14, Mall One, MM Alam Road, Gulberg III, Lahore',
      phone: '+92 42 35789001',
      isMain: true,
      status: 'ACTIVE',
    },
  });

  const branchKhi = await prisma.branch.create({
    data: {
      storeId: store.id,
      name: 'DHA Phase 5 Outlet - Karachi',
      code: 'KHI-01',
      address: '26th Street, Badar Commercial, DHA Phase 5, Karachi',
      phone: '+92 21 35345678',
      isMain: false,
      status: 'ACTIVE',
    },
  });

  const branchIsb = await prisma.branch.create({
    data: {
      storeId: store.id,
      name: 'F-7 Markaz Boutique - Islamabad',
      code: 'ISB-01',
      address: 'Shop 4, Beverly Centre, F-7 Markaz, Islamabad',
      phone: '+92 51 2876543',
      isMain: false,
      status: 'ACTIVE',
    },
  });

  // 4. Default Users
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const managerPassword = await bcrypt.hash('manager123', 10);
  const cashierPassword = await bcrypt.hash('cashier123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@boutique.com' },
    update: {},
    create: {
      name: 'Saif Super Admin',
      email: 'admin@boutique.com',
      password: hashedPassword,
      roleId: superAdminRole.id,
      branchId: branchLhr.id,
      phone: '+92 300 0000001',
      status: 'ACTIVE',
    },
  });

  await prisma.user.upsert({
    where: { email: 'manager@boutique.com' },
    update: {},
    create: {
      name: 'Bilal Store Manager',
      email: 'manager@boutique.com',
      password: managerPassword,
      roleId: managerRole.id,
      branchId: branchLhr.id,
      phone: '+92 300 0000002',
      status: 'ACTIVE',
    },
  });

  const cashierUser = await prisma.user.upsert({
    where: { email: 'cashier@boutique.com' },
    update: {},
    create: {
      name: 'Zainab Cashier #01',
      email: 'cashier@boutique.com',
      password: cashierPassword,
      roleId: cashierRole.id,
      branchId: branchLhr.id,
      phone: '+92 300 0000003',
      status: 'ACTIVE',
    },
  });

  // 5. Sizes
  const sizeData = [
    { name: 'XS (Extra Small)', code: 'XS', sortOrder: 1 },
    { name: 'S (Small)', code: 'S', sortOrder: 2 },
    { name: 'M (Medium)', code: 'M', sortOrder: 3 },
    { name: 'L (Large)', code: 'L', sortOrder: 4 },
    { name: 'XL (Extra Large)', code: 'XL', sortOrder: 5 },
    { name: 'XXL (Double XL)', code: 'XXL', sortOrder: 6 },
    { name: 'Free Size', code: 'FREE', sortOrder: 7 },
  ];
  const sizes = {};
  for (const s of sizeData) {
    sizes[s.code] = await prisma.size.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
  }

  // 6. Colors
  const colorData = [
    { name: 'Rose Pink', hexCode: '#F43F5E' },
    { name: 'Dusty Lilac', hexCode: '#A855F7' },
    { name: 'Emerald Green', hexCode: '#10B981' },
    { name: 'Royal Blue', hexCode: '#2563EB' },
    { name: 'Jet Black', hexCode: '#18181B' },
    { name: 'Ivory Beige', hexCode: '#E4D4C8' },
    { name: 'Crimson Red', hexCode: '#E11D48' },
    { name: 'Mustard Gold', hexCode: '#EAB308' },
    { name: 'Charcoal Grey', hexCode: '#4B5563' },
    { name: 'Peach Coral', hexCode: '#FB7185' },
  ];
  const colors = {};
  for (const c of colorData) {
    const existing = await prisma.color.findFirst({ where: { name: c.name } });
    if (existing) {
      colors[c.name] = existing;
    } else {
      colors[c.name] = await prisma.color.create({ data: c });
    }
  }

  // 7. Categories
  const categoryData = [
    { name: 'Kurtis & Tunics', slug: 'kurtis-tunics', description: 'Casual, formal, and daily wear tops and kurtis' },
    { name: 'Luxury Pret & 3-Piece', slug: 'luxury-pret', description: 'Stitched lawn, chiffon and organza luxury suits' },
    { name: 'Bridal & Festive Lehenga', slug: 'bridal-festive', description: 'Heavy zardozi, gota, tilla hand-embroidered wedding wear' },
    { name: 'Unstitched Fabric', slug: 'unstitched', description: 'Premium 2pc and 3pc unstitched seasonal collections' },
    { name: 'Dupattas & Shawls', slug: 'dupattas-shawls', description: 'Pure silk, velvet, pashmina and organza wraps' },
    { name: 'Bottoms & Trousers', slug: 'bottoms-trousers', description: 'Cigarette pants, bell bottoms, tulip shalwars, culottes' },
    { name: 'Abayas & Modest Wear', slug: 'abayas-modest', description: 'Nida fabric luxury abayas, capes, and instant hijabs' },
  ];
  const categories = {};
  for (const cat of categoryData) {
    categories[cat.slug] = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // 8. Brands
  const brandData = [
    { name: 'Khaadi', slug: 'khaadi', description: 'Vibrant handwoven and contemporary Eastern wear' },
    { name: 'Sana Safinaz', slug: 'sana-safinaz', description: 'High-end luxury pret and statement silhouettes' },
    { name: 'Maria.B', slug: 'maria-b', description: 'Iconic designer couture, unstitched luxury and linen' },
    { name: 'Gul Ahmed', slug: 'gul-ahmed', description: 'Heritage fine lawn, jacquard and festive silks' },
    { name: 'Nishat Linen', slug: 'nishat-linen', description: 'Modern daily wear, fusion kurtis and winter blends' },
    { name: 'Bareeze', slug: 'bareeze', description: 'Pure chiffon, shadow work and traditional handcraft' },
  ];
  const brands = {};
  for (const b of brandData) {
    brands[b.slug] = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: {},
      create: b,
    });
  }

  // 9. Suppliers
  const sup1 = await prisma.supplier.create({
    data: {
      name: 'Al-Karam Textile Mills',
      companyName: 'Al-Karam Studio Wholesale',
      email: 'wholesale@alkaram.com',
      phone: '+92 21 111 255 272',
      address: 'HT-11, Landhi Industrial Area, Karachi',
      taxNumber: 'NTN-0786543-9',
      balance: 145000.0,
      status: 'ACTIVE',
    },
  });

  const sup2 = await prisma.supplier.create({
    data: {
      name: 'Sana Safinaz Designer Warehouse',
      companyName: 'SS Fashion Distribution',
      email: 'b2b@sanasafinaz.com',
      phone: '+92 21 35878901',
      address: 'Plot 18, Sector 15, Korangi Industrial Area, Karachi',
      taxNumber: 'NTN-1298374-2',
      balance: 85000.0,
      status: 'ACTIVE',
    },
  });

  const sup3 = await prisma.supplier.create({
    data: {
      name: 'Faisalabad Loom Crafts',
      companyName: 'Master Weavers Faisalabad',
      email: 'sales@masterweavers.pk',
      phone: '+92 41 8765432',
      address: 'Rail Bazaar, Factory Area, Faisalabad',
      taxNumber: 'NTN-4567891-0',
      balance: 0.0,
      status: 'ACTIVE',
    },
  });

  // 10. Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Ayesha Malik',
      phone: '+92 300 4567890',
      email: 'ayesha.m@example.com',
      address: 'House 42, Street 8, Phase 4, DHA Lahore',
      loyaltyPoints: 340,
      balance: 0.0,
      totalSpent: 48500.0,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Fatima Zahra',
      phone: '+92 321 9876543',
      email: 'fatima.zahra@example.com',
      address: 'Apartment 12-B, Askari 10, Lahore Cantt',
      loyaltyPoints: 190,
      balance: 2500.0, // Outstanding balance (credit sale)
      totalSpent: 32000.0,
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Zainab Qasim',
      phone: '+92 333 1122334',
      email: 'zainab.q@example.com',
      address: 'Model Town Block C, Lahore',
      loyaltyPoints: 75,
      balance: 0.0,
      totalSpent: 14200.0,
    },
  });

  // 11. Products and Variants
  const productsToCreate = [
    {
      name: 'Pure Lawn Embroidered 3-Piece Festive Suit',
      slug: 'pure-lawn-embroidered-3pc-festive',
      categorySlug: 'luxury-pret',
      brandSlug: 'sana-safinaz',
      description: 'Heavily embroidered front with zari schiffli work, digital silk dupatta, and dyed cambric trouser.',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80',
      basePrice: 8950.0,
      variants: [
        { size: 'S', color: 'Rose Pink', fabric: 'Lawn', season: 'Summer', sku: 'SS-LAWN-PK-S', barcode: '890123456001', purchase: 5200, price: 8950, stock: 15 },
        { size: 'M', color: 'Rose Pink', fabric: 'Lawn', season: 'Summer', sku: 'SS-LAWN-PK-M', barcode: '890123456002', purchase: 5200, price: 8950, stock: 22 },
        { size: 'L', color: 'Rose Pink', fabric: 'Lawn', season: 'Summer', sku: 'SS-LAWN-PK-L', barcode: '890123456003', purchase: 5200, price: 8950, stock: 8 },
        { size: 'M', color: 'Dusty Lilac', fabric: 'Lawn', season: 'Summer', sku: 'SS-LAWN-LL-M', barcode: '890123456004', purchase: 5200, price: 8950, stock: 12 },
        { size: 'L', color: 'Dusty Lilac', fabric: 'Lawn', season: 'Summer', sku: 'SS-LAWN-LL-L', barcode: '890123456005', purchase: 5200, price: 8950, stock: 5 },
      ],
    },
    {
      name: 'Handcrafted Chiffon Anarkali Gown with Zardozi',
      slug: 'handcrafted-chiffon-anarkali-gown',
      categorySlug: 'bridal-festive',
      brandSlug: 'maria-b',
      description: 'Floor-length flared Anarkali silhouette with hand-embellished dabka, kora and pearl accents on pure crinkle chiffon.',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80',
      basePrice: 28500.0,
      variants: [
        { size: 'S', color: 'Crimson Red', fabric: 'Chiffon', season: 'Festive', sku: 'MB-ANAR-RD-S', barcode: '890123456006', purchase: 17500, price: 28500, stock: 4 },
        { size: 'M', color: 'Crimson Red', fabric: 'Chiffon', season: 'Festive', sku: 'MB-ANAR-RD-M', barcode: '890123456007', purchase: 17500, price: 28500, stock: 6 },
        { size: 'L', color: 'Emerald Green', fabric: 'Chiffon', season: 'Festive', sku: 'MB-ANAR-GR-L', barcode: '890123456008', purchase: 17500, price: 28500, stock: 3 },
      ],
    },
    {
      name: 'Contemporary Fusion Cotton Kurti',
      slug: 'contemporary-fusion-cotton-kurti',
      categorySlug: 'kurtis-tunics',
      brandSlug: 'khaadi',
      description: 'Daily wear breathable 100% combed cotton kurti with block print motifs and wooden button placket.',
      image: 'https://images.unsplash.com/photo-1596783049581-fd136ea5461c?w=600&q=80',
      basePrice: 3450.0,
      variants: [
        { size: 'XS', color: 'Mustard Gold', fabric: 'Cotton', season: 'All Season', sku: 'KH-KURT-YL-XS', barcode: '890123456009', purchase: 1800, price: 3450, stock: 14 },
        { size: 'S', color: 'Mustard Gold', fabric: 'Cotton', season: 'All Season', sku: 'KH-KURT-YL-S', barcode: '890123456010', purchase: 1800, price: 3450, stock: 25 },
        { size: 'M', color: 'Mustard Gold', fabric: 'Cotton', season: 'All Season', sku: 'KH-KURT-YL-M', barcode: '890123456011', purchase: 1800, price: 3450, stock: 30 },
        { size: 'L', color: 'Mustard Gold', fabric: 'Cotton', season: 'All Season', sku: 'KH-KURT-YL-L', barcode: '890123456012', purchase: 1800, price: 3450, stock: 18 },
        { size: 'M', color: 'Jet Black', fabric: 'Cotton', season: 'All Season', sku: 'KH-KURT-BK-M', barcode: '890123456013', purchase: 1800, price: 3450, stock: 2 }, // Low stock item
      ],
    },
    {
      name: 'Digital Printed Pure Raw Silk Tunic',
      slug: 'digital-printed-pure-raw-silk-tunic',
      categorySlug: 'kurtis-tunics',
      brandSlug: 'sana-safinaz',
      description: 'Lustrous raw silk with abstract modern floral composition and lace-trimmed sleeves.',
      image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&q=80',
      basePrice: 6200.0,
      variants: [
        { size: 'S', color: 'Royal Blue', fabric: 'Silk', season: 'Festive', sku: 'SS-SILK-BL-S', barcode: '890123456014', purchase: 3600, price: 6200, stock: 9 },
        { size: 'M', color: 'Royal Blue', fabric: 'Silk', season: 'Festive', sku: 'SS-SILK-BL-M', barcode: '890123456015', purchase: 3600, price: 6200, stock: 14 },
        { size: 'L', color: 'Royal Blue', fabric: 'Silk', season: 'Festive', sku: 'SS-SILK-BL-L', barcode: '890123456016', purchase: 3600, price: 6200, stock: 0 }, // Out of stock item
      ],
    },
    {
      name: 'Embroidered Kashmiri Shawl & Velvet Wrap',
      slug: 'embroidered-kashmiri-shawl-velvet-wrap',
      categorySlug: 'dupattas-shawls',
      brandSlug: 'bareeze',
      description: 'Micro-velvet 9000 shawl with intricate multi-color tilla thread border and floral jaal center.',
      image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&q=80',
      basePrice: 16500.0,
      variants: [
        { size: 'FREE', color: 'Jet Black', fabric: 'Velvet', season: 'Winter', sku: 'BZ-SHWL-BK-FR', barcode: '890123456017', purchase: 9800, price: 16500, stock: 11 },
        { size: 'FREE', color: 'Charcoal Grey', fabric: 'Velvet', season: 'Winter', sku: 'BZ-SHWL-CH-FR', barcode: '890123456018', purchase: 9800, price: 16500, stock: 7 },
      ],
    },
    {
      name: 'Luxury Nida Front-Open Abaya with Pearls',
      slug: 'luxury-nida-front-open-abaya',
      categorySlug: 'abayas-modest',
      brandSlug: 'nishat-linen',
      description: 'Korean imported premium Nida abaya featuring crystal sleeve cuffs and matching chiffon shayla.',
      image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80',
      basePrice: 7800.0,
      variants: [
        { size: 'S', color: 'Jet Black', fabric: 'Nida', season: 'All Season', sku: 'NL-ABY-BK-S', barcode: '890123456019', purchase: 4400, price: 7800, stock: 10 },
        { size: 'M', color: 'Jet Black', fabric: 'Nida', season: 'All Season', sku: 'NL-ABY-BK-M', barcode: '890123456020', purchase: 4400, price: 7800, stock: 16 },
        { size: 'L', color: 'Jet Black', fabric: 'Nida', season: 'All Season', sku: 'NL-ABY-BK-L', barcode: '890123456021', purchase: 4400, price: 7800, stock: 8 },
        { size: 'M', color: 'Ivory Beige', fabric: 'Nida', season: 'All Season', sku: 'NL-ABY-BG-M', barcode: '890123456022', purchase: 4400, price: 7800, stock: 3 }, // Low stock item
      ],
    },
    {
      name: 'Embroidered Raw Silk Cigarette Pants',
      slug: 'embroidered-raw-silk-cigarette-pants',
      categorySlug: 'bottoms-trousers',
      brandSlug: 'gul-ahmed',
      description: 'Straight-cut cigarette trousers with scallop organza hem and delicate pearl buttons.',
      image: 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=600&q=80',
      basePrice: 2450.0,
      variants: [
        { size: 'S', color: 'Ivory Beige', fabric: 'Silk', season: 'All Season', sku: 'GA-PNT-BG-S', barcode: '890123456023', purchase: 1250, price: 2450, stock: 20 },
        { size: 'M', color: 'Ivory Beige', fabric: 'Silk', season: 'All Season', sku: 'GA-PNT-BG-M', barcode: '890123456024', purchase: 1250, price: 2450, stock: 28 },
        { size: 'L', color: 'Ivory Beige', fabric: 'Silk', season: 'All Season', sku: 'GA-PNT-BG-L', barcode: '890123456025', purchase: 1250, price: 2450, stock: 15 },
        { size: 'M', color: 'Jet Black', fabric: 'Silk', season: 'All Season', sku: 'GA-PNT-BK-M', barcode: '890123456026', purchase: 1250, price: 2450, stock: 35 },
      ],
    },
  ];

  const createdVariants = [];

  for (const prodItem of productsToCreate) {
    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        categoryId: categories[prodItem.categorySlug].id,
        brandId: brands[prodItem.brandSlug].id,
        name: prodItem.name,
        slug: prodItem.slug,
        description: prodItem.description,
        image: prodItem.image,
        basePrice: prodItem.basePrice,
        status: 'ACTIVE',
      },
    });

    for (const v of prodItem.variants) {
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sizeId: sizes[v.size]?.id,
          colorId: colors[v.color]?.id,
          fabric: v.fabric,
          pattern: 'Embroidered',
          season: v.season,
          sku: v.sku,
          barcode: v.barcode,
          purchasePrice: v.purchase,
          sellingPrice: v.price,
          wholesalePrice: v.price * 0.85,
          stockQuantity: v.stock,
          minStockAlert: 5,
          status: 'ACTIVE',
        },
      });

      // Barcode table entry
      await prisma.barcode.create({
        data: {
          variantId: variant.id,
          barcode: v.barcode,
          format: 'CODE128',
          isPrimary: true,
        },
      });

      // Stock movement entry
      await prisma.stockMovement.create({
        data: {
          variantId: variant.id,
          branchId: branchLhr.id,
          movementType: 'OPENING_STOCK',
          quantity: v.stock,
          costPrice: v.purchase,
          notes: 'Initial inventory load for Gulberg Flagship',
          createdBy: adminUser.id,
        },
      });

      createdVariants.push({ ...variant, name: prodItem.name });
    }
  }

  // 12. Create Completed Sample Sales
  console.log('Creating sample sales transactions...');
  const sale1 = await prisma.sale.create({
    data: {
      invoiceNumber: 'INV-20261101-001',
      branchId: branchLhr.id,
      customerId: customer1.id,
      userId: cashierUser.id,
      subtotal: 17900.0,
      discountAmount: 900.0,
      discountPercent: 5.0,
      taxAmount: 850.0,
      taxPercent: 5.0,
      grandTotal: 17850.0,
      paidAmount: 18000.0,
      changeAmount: 150.0,
      balanceDue: 0.0,
      paymentStatus: 'PAID',
      status: 'COMPLETED',
      orderNotes: 'VIP Customer - 5% Seasonal Loyalty Discount applied',
      items: {
        create: [
          {
            variantId: createdVariants[0].id, // Lawn suit S
            quantity: 2,
            unitPrice: 8950.0,
            costPrice: 5200.0,
            discountAmount: 900.0,
            taxAmount: 850.0,
            subtotal: 17900.0,
            total: 17850.0,
          },
        ],
      },
      payments: {
        create: [
          {
            paymentMethod: 'CASH',
            amount: 17850.0,
            receivedAmount: 18000.0,
            changeAmount: 150.0,
            notes: 'Cash at POS counter #01',
          },
        ],
      },
    },
  });

  const sale2 = await prisma.sale.create({
    data: {
      invoiceNumber: 'INV-20261101-002',
      branchId: branchLhr.id,
      customerId: customer2.id,
      userId: cashierUser.id,
      subtotal: 9650.0,
      discountAmount: 0.0,
      discountPercent: 0.0,
      taxAmount: 482.5,
      taxPercent: 5.0,
      grandTotal: 10132.5,
      paidAmount: 7632.5,
      changeAmount: 0.0,
      balanceDue: 2500.0, // Partial credit sale
      paymentStatus: 'PARTIAL',
      status: 'COMPLETED',
      orderNotes: 'Credit sale: Rs. 2,500 due on next visit',
      items: {
        create: [
          {
            variantId: createdVariants[5].id, // Kurti
            quantity: 1,
            unitPrice: 3450.0,
            costPrice: 1800.0,
            subtotal: 3450.0,
            total: 3622.5,
          },
          {
            variantId: createdVariants[10].id, // Silk tunic
            quantity: 1,
            unitPrice: 6200.0,
            costPrice: 3600.0,
            subtotal: 6200.0,
            total: 6510.0,
          },
        ],
      },
      payments: {
        create: [
          {
            paymentMethod: 'CARD',
            amount: 7632.5,
            receivedAmount: 7632.5,
            transactionRef: 'TXN-HBL-998811',
            notes: 'HBL Debit Card Swipe',
          },
        ],
      },
    },
  });

  // 13. Customer Ledgers
  await prisma.customerLedger.create({
    data: {
      customerId: customer2.id,
      transactionType: 'SALE_CREDIT',
      referenceId: sale2.id,
      debit: 10132.5,
      credit: 7632.5,
      balance: 2500.0,
      description: 'Invoice INV-20261101-002 partial payment, balance due Rs. 2,500',
    },
  });

  // 14. Cash Register Shift
  await prisma.cashRegister.create({
    data: {
      branchId: branchLhr.id,
      userId: cashierUser.id,
      openingBalance: 15000.0,
      cashSales: 17850.0,
      cardSales: 7632.5,
      otherSales: 0.0,
      totalCashIn: 17850.0,
      totalCashOut: 0.0,
      status: 'OPEN',
      notes: 'Morning shift opening float Rs. 15,000 verified in cash drawer',
    },
  });

  // 15. Operational Expenses
  const expenseEntries = [
    { title: 'Store Generator High-Octane Diesel', category: 'ELECTRICITY', amount: 8500.0, method: 'CASH' },
    { title: 'Branded Pink Paper Bags & Ribbons Packaging', category: 'PACKAGING', amount: 14500.0, method: 'BANK_TRANSFER' },
    { title: 'Store Staff Tea & Refreshments', category: 'REFRESHMENT', amount: 1800.0, method: 'CASH' },
    { title: 'Instagram Spring Collection Ad Campaign', category: 'MARKETING', amount: 25000.0, method: 'BANK_TRANSFER' },
  ];

  for (const exp of expenseEntries) {
    await prisma.expense.create({
      data: {
        branchId: branchLhr.id,
        category: exp.category,
        title: exp.title,
        amount: exp.amount,
        paymentMethod: exp.method,
        createdBy: adminUser.id,
        notes: 'Approved boutique expenditure',
      },
    });
  }

  // 16. Default System Settings
  const settingsEntries = [
    { key: 'STORE_NAME', value: 'MR BILAL LADIES WEAR & COUTURE', groupName: 'GENERAL' },
    { key: 'CURRENCY', value: 'PKR', groupName: 'GENERAL' },
    { key: 'CURRENCY_SYMBOL', value: '₨', groupName: 'GENERAL' },
    { key: 'TAX_PERCENT', value: '5', groupName: 'TAX' },
    { key: 'DEFAULT_PRINTER', value: '80mm', groupName: 'RECEIPT' },
    { key: 'BARCODE_LABEL_FORMAT', value: '50x30mm', groupName: 'BARCODE' },
    { key: 'LOW_STOCK_THRESHOLD', value: '10', groupName: 'INVENTORY' },
    { key: 'ALLOW_OVERSELL', value: 'false', groupName: 'POS' },
    { key: 'EXCHANGE_POLICY_DAYS', value: '7', groupName: 'POS' },
  ];

  for (const set of settingsEntries) {
    await prisma.setting.upsert({
      where: { key: set.key },
      update: { value: set.value },
      create: set,
    });
  }

  console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
