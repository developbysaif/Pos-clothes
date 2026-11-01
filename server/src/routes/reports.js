const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/reports/sales-summary
 */
router.get('/sales-summary', authenticateToken, async (req, res, next) => {
  try {
    const { range = 'MONTH', startDate, endDate } = req.query;

    let start = new Date();
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    if (startDate && endDate) {
      start = new Date(startDate);
      end.setTime(new Date(endDate).getTime());
      end.setHours(23, 59, 59, 999);
    } else if (range === 'TODAY') {
      start.setHours(0, 0, 0, 0);
    } else if (range === 'WEEK') {
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else if (range === 'MONTH') {
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    } else if (range === 'YEAR') {
      start.setFullYear(start.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
    }

    const sales = await prisma.sale.findMany({
      where: {
        saleDate: { gte: start, lte: end },
        status: { in: ['COMPLETED', 'PARTIALLY_RETURNED'] },
      },
      include: {
        items: true,
        customer: { select: { name: true } },
      },
      orderBy: { saleDate: 'desc' },
    });

    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.grandTotal), 0);
    const totalTax = sales.reduce((sum, s) => sum + Number(s.taxAmount), 0);
    const totalDiscount = sales.reduce((sum, s) => sum + Number(s.discountAmount), 0);
    const totalOrders = sales.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    res.json({
      summary: {
        totalRevenue,
        totalTax,
        totalDiscount,
        totalOrders,
        averageOrderValue,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      sales,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/profit-loss
 * Comprehensive P&L Statement from SQL database
 */
router.get('/profit-loss', authenticateToken, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const whereSale = { status: { in: ['COMPLETED', 'PARTIALLY_RETURNED'] } };
    const whereExp = {};

    if (startDate || endDate) {
      whereSale.saleDate = {};
      whereExp.expenseDate = {};
      if (startDate) {
        whereSale.saleDate.gte = new Date(startDate);
        whereExp.expenseDate.gte = new Date(startDate);
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        whereSale.saleDate.lte = e;
        whereExp.expenseDate.lte = e;
      }
    }

    const [sales, expenses] = await Promise.all([
      prisma.sale.findMany({
        where: whereSale,
        include: { items: true },
      }),
      prisma.expense.findMany({
        where: whereExp,
      }),
    ]);

    const totalSalesRevenue = sales.reduce((sum, s) => sum + Number(s.grandTotal), 0);

    // Cost of Goods Sold (COGS)
    let totalCOGS = 0;
    sales.forEach((s) => {
      s.items.forEach((item) => {
        totalCOGS += Number(item.costPrice) * item.quantity;
      });
    });

    const grossProfit = totalSalesRevenue - totalCOGS;
    const grossMargin = totalSalesRevenue > 0 ? (grossProfit / totalSalesRevenue) * 100 : 0;

    // Expenses breakdown
    const expensesByCategory = {};
    let totalExpenses = 0;
    expenses.forEach((exp) => {
      const amt = Number(exp.amount);
      totalExpenses += amt;
      expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + amt;
    });

    const netProfit = grossProfit - totalExpenses;
    const netMargin = totalSalesRevenue > 0 ? (netProfit / totalSalesRevenue) * 100 : 0;

    res.json({
      totalSalesRevenue,
      totalCOGS,
      grossProfit,
      grossMargin: Number(grossMargin.toFixed(2)),
      totalExpenses,
      expensesByCategory,
      netProfit,
      netMargin: Number(netMargin.toFixed(2)),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/inventory-valuation
 */
router.get('/inventory-valuation', authenticateToken, async (req, res, next) => {
  try {
    const variants = await prisma.productVariant.findMany({
      where: { status: 'ACTIVE' },
      include: {
        product: { select: { name: true, category: { select: { name: true } } } },
        size: true,
        color: true,
      },
    });

    let totalUnits = 0;
    let totalCostValue = 0;
    let totalRetailValue = 0;

    const items = variants.map((v) => {
      const cost = Number(v.purchasePrice);
      const retail = Number(v.sellingPrice);
      const costTotal = cost * v.stockQuantity;
      const retailTotal = retail * v.stockQuantity;

      totalUnits += v.stockQuantity;
      totalCostValue += costTotal;
      totalRetailValue += retailTotal;

      return {
        id: v.id,
        name: v.product.name,
        category: v.product.category?.name || 'Pret',
        sku: v.sku,
        barcode: v.barcode,
        size: v.size?.code || 'Free',
        color: v.color?.name || 'Assorted',
        stock: v.stockQuantity,
        costPrice: cost,
        sellingPrice: retail,
        costTotal,
        retailTotal,
        potentialProfit: retailTotal - costTotal,
      };
    });

    res.json({
      totalUnits,
      totalCostValue,
      totalRetailValue,
      totalPotentialProfit: totalRetailValue - totalCostValue,
      items,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/export-csv
 * CSV export utility for sales or inventory
 */
router.get('/export-csv', authenticateToken, async (req, res, next) => {
  try {
    const { type = 'sales' } = req.query;

    if (type === 'sales') {
      const sales = await prisma.sale.findMany({
        orderBy: { saleDate: 'desc' },
        include: { customer: true, payments: true },
      });

      let csv = 'Invoice Number,Date,Customer,Total (PKR),Paid (PKR),Balance Due,Payment Method,Status\n';
      sales.forEach((s) => {
        const method = s.payments.map((p) => p.paymentMethod).join(' / ') || 'CASH';
        csv += `"${s.invoiceNumber}","${s.saleDate.toISOString()}","${s.customer?.name || 'Walk-in'}","${s.grandTotal}","${s.paidAmount}","${s.balanceDue}","${method}","${s.status}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="sales_report.csv"');
      return res.send(csv);
    } else {
      const variants = await prisma.productVariant.findMany({
        where: { status: 'ACTIVE' },
        include: { product: true, size: true, color: true },
      });

      let csv = 'Product Name,SKU,Barcode,Size,Color,Stock Quantity,Cost Price (PKR),Selling Price (PKR)\n';
      variants.forEach((v) => {
        csv += `"${v.product.name}","${v.sku}","${v.barcode}","${v.size?.code || ''}","${v.color?.name || ''}","${v.stockQuantity}","${v.purchasePrice}","${v.sellingPrice}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="inventory_report.csv"');
      return res.send(csv);
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
