const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/sales/scan
 * Instant Barcode Scanner Lookup for POS
 */
router.get('/scan', authenticateToken, async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ error: 'Barcode or SKU code is required.' });
    }

    const cleanCode = code.trim();

    const variant = await prisma.productVariant.findFirst({
      where: {
        OR: [
          { barcode: cleanCode },
          { sku: cleanCode },
          { barcodes: { some: { barcode: cleanCode } } },
        ],
        status: 'ACTIVE',
      },
      include: {
        product: {
          include: { category: true, brand: true },
        },
        size: true,
        color: true,
      },
    });

    if (!variant) {
      return res.status(404).json({
        error: `No garment found matching Barcode / SKU "${cleanCode}"`,
      });
    }

    res.json({
      variant: {
        id: variant.id,
        productId: variant.productId,
        name: variant.product.name,
        category: variant.product.category?.name || 'Pret',
        brand: variant.product.brand?.name || 'Boutique',
        size: variant.size?.code || 'Free',
        color: variant.color?.name || 'Assorted',
        colorHex: variant.color?.hexCode || '#000000',
        fabric: variant.fabric || 'Standard',
        season: variant.season || 'All Season',
        sku: variant.sku,
        barcode: variant.barcode,
        price: Number(variant.sellingPrice),
        costPrice: Number(variant.purchasePrice),
        stock: variant.stockQuantity,
        minStockAlert: variant.minStockAlert,
        image: variant.product.image,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sales
 * Complete POS Sale Checkout with ACID SQL Transaction & Stock Deduction
 */
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const {
      customerId,
      items = [], // [{ variantId, quantity, unitPrice, discountAmount }]
      subtotal,
      discountAmount = 0,
      discountPercent = 0,
      taxAmount = 0,
      taxPercent = 5,
      grandTotal,
      paidAmount,
      payments = [], // [{ paymentMethod: 'CASH'|'CARD'|'JAZZCASH'|'EASYPAISA'|'BANK_TRANSFER', amount }]
      orderNotes,
      allowOversell = false,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Sale cart cannot be empty.' });
    }

    const branchId = req.user.branchId || (await prisma.branch.findFirst())?.id;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map((n) => n.toString().padStart(2, '0'))
      .join('');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${dateStr}-${timeStr}-${randomSuffix}`;

    const parsedGrandTotal = parseFloat(grandTotal) || 0;
    const parsedPaidAmount = parseFloat(paidAmount) || parsedGrandTotal;
    const changeAmount = Math.max(0, parsedPaidAmount - parsedGrandTotal);
    const balanceDue = Math.max(0, parsedGrandTotal - parsedPaidAmount);
    const paymentStatus = balanceDue === 0 ? 'PAID' : parsedPaidAmount > 0 ? 'PARTIAL' : 'DUE';

    // Execute atomic transaction
    const saleResult = await prisma.$transaction(async (tx) => {
      // 1. Verify and deduct stock for each variant
      for (const item of items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true },
        });

        if (!variant) {
          throw new Error(`Variant ID ${item.variantId} was not found.`);
        }

        if (variant.stockQuantity < item.quantity && !allowOversell) {
          throw new Error(
            `Insufficient stock for "${variant.product.name}" (${variant.sku}). Available: ${variant.stockQuantity}, Requested: ${item.quantity}`
          );
        }

        // Deduct stock
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });

        // Log Stock Movement
        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            branchId,
            movementType: 'SALE',
            quantity: -item.quantity,
            referenceId: invoiceNumber,
            referenceType: 'SALE',
            costPrice: variant.purchasePrice,
            notes: `Sold via POS Invoice ${invoiceNumber}`,
            createdBy: req.user.id,
          },
        });
      }

      // 2. Create Sale Record
      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          branchId,
          customerId: customerId || null,
          userId: req.user.id,
          saleDate: now,
          subtotal: parseFloat(subtotal) || parsedGrandTotal,
          discountAmount: parseFloat(discountAmount) || 0,
          discountPercent: parseFloat(discountPercent) || 0,
          taxAmount: parseFloat(taxAmount) || 0,
          taxPercent: parseFloat(taxPercent) || 0,
          grandTotal: parsedGrandTotal,
          paidAmount: parsedPaidAmount,
          changeAmount,
          balanceDue,
          paymentStatus,
          status: 'COMPLETED',
          orderNotes: orderNotes || null,
        },
      });

      // 3. Create Sale Items
      for (const item of items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
        });

        const itemSubtotal = (parseFloat(item.unitPrice) || 0) * item.quantity;
        const itemDiscount = parseFloat(item.discountAmount) || 0;
        const itemTotal = itemSubtotal - itemDiscount;

        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: parseFloat(item.unitPrice) || 0,
            costPrice: variant ? variant.purchasePrice : 0,
            discountAmount: itemDiscount,
            taxAmount: 0,
            subtotal: itemSubtotal,
            total: itemTotal,
          },
        });
      }

      // 4. Create Sale Payments
      if (payments && payments.length > 0) {
        for (const p of payments) {
          await tx.salePayment.create({
            data: {
              saleId: sale.id,
              paymentMethod: p.paymentMethod || 'CASH',
              amount: parseFloat(p.amount) || parsedPaidAmount,
              receivedAmount: parseFloat(p.receivedAmount) || parseFloat(p.amount) || parsedPaidAmount,
              changeAmount: parseFloat(p.changeAmount) || changeAmount,
              transactionRef: p.transactionRef || null,
              notes: p.notes || null,
            },
          });
        }
      } else {
        await tx.salePayment.create({
          data: {
            saleId: sale.id,
            paymentMethod: req.body.paymentMethod || 'CASH',
            amount: parsedPaidAmount,
            receivedAmount: parsedPaidAmount + changeAmount,
            changeAmount,
          },
        });
      }

      // 5. If Customer & Credit balance due or loyalty points
      if (customerId) {
        const pointsEarned = Math.floor(parsedGrandTotal / 100); // 1 point per 100 PKR
        await tx.customer.update({
          where: { id: customerId },
          data: {
            loyaltyPoints: { increment: pointsEarned },
            totalSpent: { increment: parsedGrandTotal },
            ...(balanceDue > 0 && { balance: { increment: balanceDue } }),
          },
        });

        if (balanceDue > 0) {
          await tx.customerLedger.create({
            data: {
              customerId,
              transactionType: 'SALE_CREDIT',
              referenceId: sale.id,
              debit: parsedGrandTotal,
              credit: parsedPaidAmount,
              balance: balanceDue,
              description: `Invoice ${invoiceNumber} partial payment; balance due Rs. ${balanceDue}`,
            },
          });
        }
      }

      // 6. Update Cash Register Shift if open
      const activeShift = await tx.cashRegister.findFirst({
        where: { userId: req.user.id, status: 'OPEN' },
      });
      if (activeShift) {
        let netCash = 0;
        let netCard = 0;
        let netOther = 0;

        if (payments && payments.length > 0) {
          const cashPayments = payments.filter((p) => (p.paymentMethod || 'CASH') === 'CASH');
          const cardPayments = payments.filter((p) => p.paymentMethod === 'CARD');
          const otherPayments = payments.filter((p) => !['CASH', 'CARD'].includes(p.paymentMethod));

          const rawCash = cashPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
          netCash = Math.max(0, rawCash - changeAmount);
          netCard = cardPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
          netOther = otherPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        } else {
          const method = req.body.paymentMethod || 'CASH';
          if (method === 'CASH') {
            netCash = Math.max(0, parsedPaidAmount - changeAmount);
          } else if (method === 'CARD') {
            netCard = parsedPaidAmount;
          } else {
            netOther = parsedPaidAmount;
          }
        }

        await tx.cashRegister.update({
          where: { id: activeShift.id },
          data: {
            cashSales: { increment: netCash },
            cardSales: { increment: netCard },
            otherSales: { increment: netOther },
          },
        });
      }

      // 7. Audit Log
      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'COMPLETE_SALE',
          module: 'POS',
          recordId: sale.id,
          details: `Invoice ${invoiceNumber} for Rs. ${parsedGrandTotal} completed`,
          ipAddress: req.ip,
        },
      });

      // Return fully loaded sale for receipt
      return tx.sale.findUnique({
        where: { id: sale.id },
        include: {
          customer: true,
          items: {
            include: {
              variant: {
                include: { product: true, size: true, color: true },
              },
            },
          },
          payments: true,
          branch: { include: { store: true } },
          user: { select: { name: true } },
        },
      });
    });

    // Real-time WebSocket emission
    const io = req.app.get('io');
    if (io) {
      io.emit('sale:completed', {
        invoiceNumber: saleResult.invoiceNumber,
        grandTotal: saleResult.grandTotal,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(201).json({
      message: 'Sale completed successfully.',
      sale: saleResult,
    });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to complete sale.' });
  }
});

/**
 * GET /api/sales
 * List invoices with filters and search
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const {
      search,
      status,
      paymentStatus,
      startDate,
      endDate,
      page = 1,
      limit = 25,
    } = req.query;

    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (paymentStatus && paymentStatus !== 'ALL') {
      where.paymentStatus = paymentStatus;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { invoiceNumber: { contains: q } },
        { customer: { name: { contains: q } } },
        { customer: { phone: { contains: q } } },
      ];
    }

    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) where.saleDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.saleDate.lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [sales, totalCount] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { saleDate: 'desc' },
        include: {
          customer: { select: { name: true, phone: true } },
          user: { select: { name: true } },
          payments: true,
          items: {
            include: {
              variant: {
                include: { product: { select: { name: true } }, size: true, color: true },
              },
            },
          },
        },
      }),
      prisma.sale.count({ where }),
    ]);

    res.json({
      sales,
      totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sales/:id
 */
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const sale = await prisma.sale.findFirst({
      where: {
        OR: [{ id: req.params.id }, { invoiceNumber: req.params.id }],
      },
      include: {
        customer: true,
        user: { select: { name: true, email: true } },
        branch: { include: { store: true } },
        payments: true,
        returns: { include: { items: true } },
        items: {
          include: {
            variant: {
              include: { product: true, size: true, color: true },
            },
          },
        },
      },
    });

    if (!sale) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    res.json(sale);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sales/:id/cancel
 * Cancel Sale & Restore Stock
 */
router.post('/:id/cancel', authenticateToken, async (req, res, next) => {
  try {
    const { reason = 'Customer cancelled before dispatch' } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: req.params.id },
        include: { items: true },
      });

      if (!sale) throw new Error('Sale not found.');
      if (sale.status === 'CANCELLED') throw new Error('Sale is already cancelled.');

      // Restore stock for all variants
      for (const item of sale.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stockQuantity: { increment: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            branchId: sale.branchId,
            movementType: 'SALE_CANCEL',
            quantity: item.quantity,
            referenceId: sale.invoiceNumber,
            referenceType: 'SALE_CANCEL',
            notes: `Cancelled sale: ${reason}`,
            createdBy: req.user.id,
          },
        });
      }

      const updatedSale = await tx.sale.update({
        where: { id: sale.id },
        data: {
          status: 'CANCELLED',
          orderNotes: `${sale.orderNotes ? sale.orderNotes + ' | ' : ''}CANCELLED: ${reason}`,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'CANCEL_SALE',
          module: 'POS',
          recordId: sale.id,
          details: `Invoice ${sale.invoiceNumber} cancelled. Reason: ${reason}`,
          ipAddress: req.ip,
        },
      });

      return updatedSale;
    });

    res.json({ message: 'Sale cancelled and stock restored successfully.', sale: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
