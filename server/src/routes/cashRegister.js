const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/cash-register/current
 * Check current open shift for logged-in cashier
 */
router.get('/current', authenticateToken, async (req, res, next) => {
  try {
    const shift = await prisma.cashRegister.findFirst({
      where: {
        userId: req.user.id,
        status: 'OPEN',
      },
      include: {
        user: { select: { name: true, email: true } },
        branch: true,
      },
      orderBy: { openedAt: 'desc' },
    });

    if (!shift) {
      return res.json({ isOpen: false, shift: null });
    }

    const expectedCash =
      Number(shift.openingBalance) +
      Number(shift.cashSales) +
      Number(shift.totalCashIn) -
      Number(shift.totalCashOut);

    res.json({
      isOpen: true,
      shift: {
        ...shift,
        expectedCash,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/cash-register/open
 * Open a new cashier shift with opening float
 */
router.post('/open', authenticateToken, async (req, res, next) => {
  try {
    const { openingBalance = 0, notes } = req.body;

    const existing = await prisma.cashRegister.findFirst({
      where: { userId: req.user.id, status: 'OPEN' },
    });
    if (existing) {
      return res.status(400).json({ error: 'You already have an active open shift.' });
    }

    const branchId = req.user.branchId || (await prisma.branch.findFirst())?.id;

    const shift = await prisma.cashRegister.create({
      data: {
        branchId,
        userId: req.user.id,
        openingBalance: parseFloat(openingBalance) || 0,
        status: 'OPEN',
        notes: notes || 'Shift opened',
      },
    });

    res.status(201).json({ message: 'Cash register shift opened.', shift });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/cash-register/close
 * Close current shift and calculate cash reconciliation difference
 */
router.post('/close', authenticateToken, async (req, res, next) => {
  try {
    const { closingBalance, notes } = req.body;

    const shift = await prisma.cashRegister.findFirst({
      where: { userId: req.user.id, status: 'OPEN' },
    });
    if (!shift) {
      return res.status(400).json({ error: 'No active open shift found to close.' });
    }

    const actualClosing = parseFloat(closingBalance) || 0;
    const expectedClosing =
      Number(shift.openingBalance) +
      Number(shift.cashSales) +
      Number(shift.totalCashIn) -
      Number(shift.totalCashOut);
    const difference = actualClosing - expectedClosing; // positive = over, negative = short

    const updated = await prisma.cashRegister.update({
      where: { id: shift.id },
      data: {
        closedAt: new Date(),
        closingBalance: actualClosing,
        expectedClosing,
        difference,
        status: 'CLOSED',
        notes: notes || `${shift.notes || ''} | Shift closed with difference: Rs. ${difference}`,
      },
    });

    res.json({
      message: 'Cash register closed successfully.',
      shift: updated,
      reconciliation: {
        openingBalance: Number(shift.openingBalance),
        cashSales: Number(shift.cashSales),
        expectedClosing,
        actualClosing,
        difference,
        isBalanced: difference === 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/cash-register/history
 */
router.get('/history', authenticateToken, async (req, res, next) => {
  try {
    const shifts = await prisma.cashRegister.findMany({
      orderBy: { openedAt: 'desc' },
      take: 30,
      include: {
        user: { select: { name: true } },
        branch: { select: { name: true } },
      },
    });
    res.json({ shifts });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
