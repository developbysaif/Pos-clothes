const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/suppliers
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { purchases: true } },
      },
    });
    res.json({ suppliers });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/suppliers
 */
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { name, companyName, email, phone, address, taxNumber } = req.body;
    if (!name || !companyName) {
      return res.status(400).json({ error: 'Supplier name and company name are required.' });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: name.trim(),
        companyName: companyName.trim(),
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : null,
        address: address || null,
        taxNumber: taxNumber || null,
      },
    });

    res.status(201).json({ message: 'Supplier created successfully.', supplier });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/suppliers/:id
 */
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: req.params.id },
      include: {
        purchases: { take: 20, orderBy: { purchaseDate: 'desc' } },
        payments: { take: 20, orderBy: { paymentDate: 'desc' } },
        ledger: { take: 20, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!supplier) return res.status(404).json({ error: 'Supplier not found.' });
    res.json(supplier);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/suppliers/:id/pay
 * Record supplier balance payment
 */
router.post('/:id/pay', authenticateToken, async (req, res, next) => {
  try {
    const { amount, paymentMethod = 'BANK_TRANSFER', referenceNo, notes } = req.body;
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Valid positive payment amount required.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findUnique({ where: { id: req.params.id } });
      if (!supplier) throw new Error('Supplier not found.');

      const payment = await tx.purchasePayment.create({
        data: {
          supplierId: supplier.id,
          amount: parsedAmount,
          paymentMethod,
          paymentDate: new Date(),
          referenceNo: referenceNo || null,
          notes: notes || 'Account clearance payment',
          createdBy: req.user.id,
        },
      });

      const updatedSupplier = await tx.supplier.update({
        where: { id: supplier.id },
        data: { balance: { decrement: parsedAmount } },
      });

      await tx.supplierLedger.create({
        data: {
          supplierId: supplier.id,
          transactionType: 'PAYMENT_CLEARANCE',
          referenceId: payment.id,
          debit: parsedAmount,
          credit: 0,
          balance: Number(updatedSupplier.balance),
          description: `Supplier payment of Rs. ${parsedAmount} via ${paymentMethod}`,
        },
      });

      return { payment, supplier: updatedSupplier };
    });

    res.json({ message: 'Supplier payment recorded successfully.', result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
