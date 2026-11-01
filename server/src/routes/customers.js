const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/customers
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { search } = req.query;
    const where = { status: 'ACTIVE' };

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { phone: { contains: q } },
        { email: { contains: q } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { sales: true } },
      },
    });

    res.json({ customers });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/customers
 */
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { name, phone, email, address, notes } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Customer name is required.' });
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        phone: phone ? phone.trim() : null,
        email: email ? email.trim() : null,
        address: address || null,
        notes: notes || null,
      },
    });

    res.status(201).json({ message: 'Customer created successfully.', customer });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/customers/:id
 */
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        sales: {
          take: 20,
          orderBy: { saleDate: 'desc' },
          include: {
            items: {
              include: {
                variant: {
                  include: { product: { select: { name: true } }, size: true, color: true },
                },
              },
            },
          },
        },
        ledger: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
        returns: {
          take: 10,
          orderBy: { returnDate: 'desc' },
        },
      },
    });

    if (!customer) return res.status(404).json({ error: 'Customer not found.' });
    res.json(customer);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/customers/:id
 */
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { name, phone, email, address, notes, status } = req.body;
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone ? phone.trim() : null }),
        ...(email !== undefined && { email: email ? email.trim() : null }),
        ...(address !== undefined && { address }),
        ...(notes !== undefined && { notes }),
        ...(status && { status }),
      },
    });
    res.json({ message: 'Customer updated successfully.', customer });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/customers/:id/pay
 * Settle customer outstanding balance / credit account
 */
router.post('/:id/pay', authenticateToken, async (req, res, next) => {
  try {
    const { amount, paymentMethod = 'CASH', notes, referenceNo } = req.body;
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Valid positive payment amount required.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({ where: { id: req.params.id } });
      if (!customer) throw new Error('Customer not found.');

      const newBalance = Math.max(0, Number(customer.balance) - parsedAmount);

      const updatedCustomer = await tx.customer.update({
        where: { id: customer.id },
        data: { balance: newBalance },
      });

      const ledgerEntry = await tx.customerLedger.create({
        data: {
          customerId: customer.id,
          transactionType: 'PAYMENT_RECEIVED',
          debit: 0,
          credit: parsedAmount,
          balance: newBalance,
          description: `Customer credit clearance payment of Rs. ${parsedAmount} via ${paymentMethod}${referenceNo ? ` (Ref: ${referenceNo})` : ''}`,
        },
      });

      // Update cash register if payment made in cash
      if (paymentMethod === 'CASH') {
        const activeShift = await tx.cashRegister.findFirst({
          where: { userId: req.user.id, status: 'OPEN' },
        });
        if (activeShift) {
          await tx.cashRegister.update({
            where: { id: activeShift.id },
            data: {
              totalCashIn: { increment: parsedAmount },
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'CUSTOMER_PAYMENT',
          module: 'CUSTOMERS',
          recordId: customer.id,
          details: `Recorded clearance payment of Rs. ${parsedAmount} for customer ${customer.name}`,
          ipAddress: req.ip,
        },
      });

      return { customer: updatedCustomer, ledgerEntry };
    });

    res.json({ message: 'Customer payment recorded successfully.', result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
