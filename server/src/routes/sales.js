const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

let salesHistory = [];

// POST /api/sales - Checkout Transaction
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { items, customerId, paymentMethod, orderDiscount = 0, taxRate = 0.05 } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item.' });
    }

    // Compute totals
    let subtotal = 0;
    const processedItems = items.map((item) => {
      const itemSubtotal = item.price * item.quantity;
      const discount = item.discount || 0;
      const lineTotal = itemSubtotal * (1 - discount / 100);
      subtotal += lineTotal;

      return {
        productId: item.id,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.price,
        discountPercent: discount,
        lineTotal,
      };
    });

    const discountedSubtotal = Math.max(0, subtotal - Number(orderDiscount));
    const taxAmount = discountedSubtotal * Number(taxRate);
    const totalAmount = discountedSubtotal + taxAmount;

    const newSale = {
      id: `INV-${Date.now().toString().slice(-6)}`,
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      userId: req.user?.id || 'cashier-default',
      customerId: customerId || null,
      subtotal,
      discountAmount: Number(orderDiscount),
      taxAmount,
      totalAmount,
      status: 'completed',
      paymentMethod: paymentMethod || 'cash',
      items: processedItems,
      createdAt: new Date().toISOString(),
    };

    salesHistory.unshift(newSale);

    // Broadcast sale & inventory updates in real time to all cashier screens
    const io = req.app.get('io');
    if (io) {
      io.emit('sale:created', {
        invoiceNumber: newSale.invoiceNumber,
        total: newSale.totalAmount,
        timestamp: newSale.createdAt,
      });

      // Broadcast stock decrements
      processedItems.forEach((item) => {
        io.emit('stock:decremented', {
          productId: item.productId,
          quantityDecremented: item.quantity,
        });
      });
    }

    res.status(201).json({
      message: 'Sale successfully recorded and inventory decremented',
      sale: newSale,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/sales
router.get('/', authenticateToken, (req, res) => {
  res.json({ count: salesHistory.length, sales: salesHistory });
});

// GET /api/sales/:id
router.get('/:id', authenticateToken, (req, res) => {
  const sale = salesHistory.find((s) => s.id === req.params.id || s.invoiceNumber === req.params.id);
  if (!sale) return res.status(404).json({ error: 'Sale record not found' });
  res.json({ sale });
});

module.exports = router;
