const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/settings
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const [settingsList, store, branches] = await Promise.all([
      prisma.setting.findMany(),
      prisma.store.findFirst(),
      prisma.branch.findMany({ where: { status: 'ACTIVE' } }),
    ]);

    const settingsObj = {};
    settingsList.forEach((s) => {
      settingsObj[s.key] = s.value;
    });

    res.json({
      settings: settingsObj,
      store,
      branches,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/settings
 * Update store details and key-value configuration
 */
router.put('/', authenticateToken, async (req, res, next) => {
  try {
    const { storeData, settings } = req.body;

    if (storeData) {
      const firstStore = await prisma.store.findFirst();
      if (firstStore) {
        await prisma.store.update({
          where: { id: firstStore.id },
          data: {
            name: storeData.name || firstStore.name,
            phone: storeData.phone !== undefined ? storeData.phone : firstStore.phone,
            email: storeData.email !== undefined ? storeData.email : firstStore.email,
            address: storeData.address !== undefined ? storeData.address : firstStore.address,
            taxNumber: storeData.taxNumber !== undefined ? storeData.taxNumber : firstStore.taxNumber,
            currency: storeData.currency || firstStore.currency,
            receiptHeader: storeData.receiptHeader !== undefined ? storeData.receiptHeader : firstStore.receiptHeader,
            receiptFooter: storeData.receiptFooter !== undefined ? storeData.receiptFooter : firstStore.receiptFooter,
          },
        });
      }
    }

    if (settings && typeof settings === 'object') {
      for (const [key, val] of Object.entries(settings)) {
        await prisma.setting.upsert({
          where: { key },
          update: { value: String(val) },
          create: { key, value: String(val), groupName: 'GENERAL' },
        });
      }
    }

    res.json({ message: 'Settings updated successfully.' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/settings/backup
 * Database snapshot backup
 */
router.get('/backup', authenticateToken, async (req, res, next) => {
  try {
    const [products, variants, customers, suppliers, sales, settings] = await Promise.all([
      prisma.product.findMany(),
      prisma.productVariant.findMany(),
      prisma.customer.findMany(),
      prisma.supplier.findMany(),
      prisma.sale.findMany({ include: { items: true, payments: true } }),
      prisma.setting.findMany(),
    ]);

    const backupData = {
      backupTimestamp: new Date().toISOString(),
      store: 'MR BILAL LADIES WEAR',
      database: 'ladies_pos (MySQL 8.4)',
      version: '1.0.0',
      data: {
        products,
        variants,
        customers,
        suppliers,
        sales,
        settings,
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="ladies_pos_backup.json"');
    res.send(JSON.stringify(backupData, null, 2));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
