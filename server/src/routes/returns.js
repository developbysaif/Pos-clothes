const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/returns
 * List all returns and exchanges
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const returns = await prisma.return.findMany({
      orderBy: { returnDate: 'desc' },
      include: {
        sale: { select: { invoiceNumber: true, saleDate: true } },
        customer: { select: { name: true, phone: true } },
        items: {
          include: {
            variant: {
              include: { product: { select: { name: true } }, size: true, color: true },
            },
            exchangeVariant: {
              include: { product: { select: { name: true } }, size: true, color: true },
            },
          },
        },
      },
    });

    res.json({ returns });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/returns
 * Process Return & Clothing Size/Color Exchange with SQL Transaction
 */
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const {
      saleId,
      customerId,
      returnReason,
      notes,
      items = [], // [{ saleItemId, variantId, quantity, unitPrice, conditionStatus: 'GOOD'|'DAMAGED', restock: true, exchangeVariantId: optional }]
      totalRefundAmount = 0,
      exchangeDifference = 0, // > 0: customer owes more; < 0: boutique owes refund
    } = req.body;

    if (!saleId || items.length === 0) {
      return res.status(400).json({ error: 'Sale ID and items to return/exchange are required.' });
    }

    const branchId = req.user.branchId || (await prisma.branch.findFirst())?.id;
    const now = new Date();
    const returnNumber = `RET-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await prisma.$transaction(async (tx) => {
      const originalSale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { items: true },
      });

      if (!originalSale) {
        throw new Error('Original sale invoice not found.');
      }

      // 1. Create Return record
      const returnRecord = await tx.return.create({
        data: {
          returnNumber,
          saleId,
          customerId: customerId || originalSale.customerId,
          branchId,
          userId: req.user.id,
          returnDate: now,
          totalRefundAmount: parseFloat(totalRefundAmount) || 0,
          returnReason: returnReason || 'SIZE_EXCHANGE',
          exchangeDifference: parseFloat(exchangeDifference) || 0,
          status: 'COMPLETED',
          notes: notes || null,
        },
      });

      // 2. Process each returned item
      for (const item of items) {
        const restock = item.restock !== false && item.conditionStatus !== 'DAMAGED';

        // Create Return Item record
        await tx.returnItem.create({
          data: {
            returnId: returnRecord.id,
            saleItemId: item.saleItemId || null,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: parseFloat(item.unitPrice) || 0,
            refundAmount: (parseFloat(item.unitPrice) || 0) * item.quantity,
            conditionStatus: item.conditionStatus || 'GOOD',
            restockStatus: restock,
            exchangeVariantId: item.exchangeVariantId || null,
          },
        });

        // If Restockable, restore stock to inventory
        if (restock) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { increment: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              branchId,
              movementType: 'RETURN_RESTOCK',
              quantity: item.quantity,
              referenceId: returnNumber,
              referenceType: 'RETURN',
              notes: `Restocked from return ${returnNumber} (${item.conditionStatus || 'GOOD'})`,
              createdBy: req.user.id,
            },
          });
        } else {
          // Log damaged product stock movement
          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              branchId,
              movementType: 'DAMAGED_RETURN',
              quantity: 0,
              referenceId: returnNumber,
              referenceType: 'RETURN_DAMAGED',
              notes: `Item returned in DAMAGED condition - not returned to active inventory`,
              createdBy: req.user.id,
            },
          });
        }

        // If this is a Size / Color Exchange: deduct new variant stock
        if (item.exchangeVariantId) {
          const exchangeVar = await tx.productVariant.findUnique({
            where: { id: item.exchangeVariantId },
          });

          if (!exchangeVar) {
            throw new Error(`Exchange variant ${item.exchangeVariantId} not found.`);
          }

          if (exchangeVar.stockQuantity < item.quantity) {
            throw new Error(
              `Exchange item "${exchangeVar.sku}" is out of stock (Available: ${exchangeVar.stockQuantity}).`
            );
          }

          await tx.productVariant.update({
            where: { id: item.exchangeVariantId },
            data: { stockQuantity: { decrement: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              variantId: item.exchangeVariantId,
              branchId,
              movementType: 'EXCHANGE_OUT',
              quantity: -item.quantity,
              referenceId: returnNumber,
              referenceType: 'EXCHANGE',
              notes: `Issued in exchange for return ${returnNumber}`,
              createdBy: req.user.id,
            },
          });
        }
      }

      // 3. Update Original Sale status
      await tx.sale.update({
        where: { id: saleId },
        data: {
          status: 'PARTIALLY_RETURNED',
          orderNotes: `${originalSale.orderNotes ? originalSale.orderNotes + ' | ' : ''}Return processed: ${returnNumber}`,
        },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'PROCESS_RETURN',
          module: 'RETURNS',
          recordId: returnRecord.id,
          details: `Return ${returnNumber} processed for Invoice ${originalSale.invoiceNumber}`,
          ipAddress: req.ip,
        },
      });

      return tx.return.findUnique({
        where: { id: returnRecord.id },
        include: {
          sale: true,
          items: {
            include: {
              variant: { include: { product: true, size: true, color: true } },
              exchangeVariant: { include: { product: true, size: true, color: true } },
            },
          },
        },
      });
    });

    res.status(201).json({
      message: 'Return / Exchange processed successfully.',
      returnRecord: result,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
