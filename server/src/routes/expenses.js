const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/expenses
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { category, startDate, endDate } = req.query;
    const where = {};

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.expenseDate.lte = end;
      }
    }

    const [expenses, totalAgg] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { expenseDate: 'desc' },
        include: {
          user: { select: { name: true } },
          branch: { select: { name: true } },
        },
      }),
      prisma.expense.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    res.json({
      expenses,
      totalAmount: Number(totalAgg._sum.amount || 0),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/expenses
 */
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { category, title, amount, expenseDate, paymentMethod = 'CASH', notes } = req.body;
    if (!title || !amount) {
      return res.status(400).json({ error: 'Expense title and amount are required.' });
    }

    const branchId = req.user.branchId || (await prisma.branch.findFirst())?.id;

    const expense = await prisma.expense.create({
      data: {
        branchId,
        category: category || 'OTHER',
        title: title.trim(),
        amount: parseFloat(amount) || 0,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        paymentMethod,
        notes: notes || null,
        createdBy: req.user.id,
      },
    });

    // If paid via cash, reflect in open cash register shift as cash out
    if (paymentMethod === 'CASH') {
      const activeShift = await prisma.cashRegister.findFirst({
        where: { userId: req.user.id, status: 'OPEN' },
      });
      if (activeShift) {
        await prisma.cashRegister.update({
          where: { id: activeShift.id },
          data: { totalCashOut: { increment: parseFloat(amount) } },
        });
      }
    }

    res.status(201).json({ message: 'Expense recorded successfully.', expense });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/expenses/:id
 */
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ message: 'Expense deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
