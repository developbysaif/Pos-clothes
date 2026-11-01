const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/purchases
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const purchases = await prisma.purchase.findMany({
      orderBy: { purchaseDate: 'desc' },
      include: {
        supplier: true,
        items: {
          include: {
            variant: {
              include: { product: { select: { name: true } }, size: true, color: true },
            },
          },
        },
        payments: true,
      },
    });
    res.json({ purchases });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/purchases
 * Create purchase invoice & automatically increment variant stock in ACID transaction
 */
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const {
      supplierId,
      items = [], // [{ variantId, quantity, unitCost }]
      discountAmount = 0,
      taxAmount = 0,
      paidAmount = 0,
      paymentMethod = 'CASH',
      notes,
    } = req.body;

    if (!supplierId || items.length === 0) {
      return res.status(400).json({ error: 'Supplier and items are required.' });
    }

    const branchId = req.user.branchId || (await prisma.branch.findFirst())?.id;
    const now = new Date();
    const invoiceNumber = `PO-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const totalCost = items.reduce(
      (sum, item) => sum + (parseFloat(item.unitCost) || 0) * item.quantity,
      0
    );
    const netAmount = totalCost - (parseFloat(discountAmount) || 0) + (parseFloat(taxAmount) || 0);
    const parsedPaid = parseFloat(paidAmount) || 0;
    const balanceAmount = Math.max(0, netAmount - parsedPaid);
    const paymentStatus = balanceAmount === 0 ? 'PAID' : parsedPaid > 0 ? 'PARTIAL' : 'PENDING';

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Purchase
      const purchase = await tx.purchase.create({
        data: {
          invoiceNumber,
          supplierId,
          branchId,
          purchaseDate: now,
          totalAmount: totalCost,
          discountAmount: parseFloat(discountAmount) || 0,
          taxAmount: parseFloat(taxAmount) || 0,
          netAmount,
          paidAmount: parsedPaid,
          balanceAmount,
          paymentStatus,
          status: 'RECEIVED',
          notes: notes || null,
          createdBy: req.user.id,
        },
      });

      // 2. Create Items & Auto-Increment Inventory Stock
      for (const item of items) {
        const itemSubtotal = (parseFloat(item.unitCost) || 0) * item.quantity;

        await tx.purchaseItem.create({
          data: {
            purchaseId: purchase.id,
            variantId: item.variantId,
            quantity: item.quantity,
            unitCost: parseFloat(item.unitCost) || 0,
            subtotal: itemSubtotal,
            taxAmount: 0,
            totalCost: itemSubtotal,
          },
        });

        // Automatically increase stock
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stockQuantity: { increment: item.quantity },
            purchasePrice: parseFloat(item.unitCost) || undefined,
          },
        });

        // Log Stock Movement
        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            branchId,
            movementType: 'PURCHASE_RECEIVE',
            quantity: item.quantity,
            referenceId: invoiceNumber,
            referenceType: 'PURCHASE',
            costPrice: parseFloat(item.unitCost) || 0,
            notes: `Stock received via Purchase Invoice ${invoiceNumber}`,
            createdBy: req.user.id,
          },
        });
      }

      // 3. Record Initial Payment if made
      if (parsedPaid > 0) {
        await tx.purchasePayment.create({
          data: {
            purchaseId: purchase.id,
            supplierId,
            amount: parsedPaid,
            paymentMethod,
            paymentDate: now,
            notes: 'Payment on order receipt',
            createdBy: req.user.id,
          },
        });
      }

      // 4. Update Supplier Balance & Ledger
      if (balanceAmount > 0) {
        await tx.supplier.update({
          where: { id: supplierId },
          data: { balance: { increment: balanceAmount } },
        });

        await tx.supplierLedger.create({
          data: {
            supplierId,
            transactionType: 'PURCHASE_INVOICE',
            referenceId: purchase.id,
            debit: parsedPaid,
            credit: netAmount,
            balance: balanceAmount,
            description: `PO ${invoiceNumber} received; Net: Rs. ${netAmount}, Paid: Rs. ${parsedPaid}`,
          },
        });
      }

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'CREATE_PURCHASE',
          module: 'PURCHASES',
          recordId: purchase.id,
          details: `Created Purchase ${invoiceNumber} for Rs. ${netAmount}`,
          ipAddress: req.ip,
        },
      });

      return tx.purchase.findUnique({
        where: { id: purchase.id },
        include: { supplier: true, items: { include: { variant: { include: { product: true } } } } },
      });
    });

    res.status(201).json({
      message: 'Purchase created and stock updated successfully.',
      purchase: result,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
