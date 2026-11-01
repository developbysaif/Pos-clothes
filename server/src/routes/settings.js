const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');

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
 * Database snapshot backup (Super Admin only)
 */
router.get('/backup', authenticateToken, requireRole(['SUPER_ADMIN']), async (req, res, next) => {
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

/**
 * POST /api/settings/restore
 * Restore configuration and core records from snapshot (Super Admin only)
 */
router.post('/restore', authenticateToken, requireRole(['SUPER_ADMIN']), async (req, res, next) => {
  try {
    const { backupData } = req.body;
    if (!backupData || !backupData.data) {
      return res.status(400).json({ error: 'Invalid backup file structure.' });
    }

    const { customers = [], suppliers = [], settings = [] } = backupData.data;

    await prisma.$transaction(async (tx) => {
      // Upsert customers
      for (const c of customers) {
        if (c.id && c.name) {
          await tx.customer.upsert({
            where: { id: c.id },
            update: {
              name: c.name,
              phone: c.phone || null,
              email: c.email || null,
              address: c.address || null,
              notes: c.notes || null,
            },
            create: {
              id: c.id,
              name: c.name,
              phone: c.phone || null,
              email: c.email || null,
              address: c.address || null,
              notes: c.notes || null,
            },
          });
        }
      }

      // Upsert suppliers
      for (const s of suppliers) {
        if (s.id && s.name) {
          await tx.supplier.upsert({
            where: { id: s.id },
            update: {
              name: s.name,
              companyName: s.companyName || null,
              phone: s.phone || null,
              email: s.email || null,
              address: s.address || null,
            },
            create: {
              id: s.id,
              name: s.name,
              companyName: s.companyName || null,
              phone: s.phone || null,
              email: s.email || null,
              address: s.address || null,
            },
          });
        }
      }

      // Upsert settings
      for (const set of settings) {
        if (set.key && set.value !== undefined) {
          await tx.setting.upsert({
            where: { key: set.key },
            update: { value: String(set.value) },
            create: { key: set.key, value: String(set.value), groupName: set.groupName || 'GENERAL' },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'RESTORE_BACKUP',
          module: 'SETTINGS',
          details: `Database snapshot restored by ${req.user.email}`,
          ipAddress: req.ip,
        },
      });
    });

    res.json({ message: 'Database backup restored successfully without schema disruption.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
