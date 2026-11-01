const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/dashboard/stats
 * Real-time SQL business analytics
 */
router.get('/stats', authenticateToken, async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Today's sales
    const todaySales = await prisma.sale.aggregate({
      where: {
        saleDate: { gte: todayStart, lte: todayEnd },
        status: { in: ['COMPLETED', 'PARTIALLY_RETURNED'] },
      },
      _sum: { grandTotal: true },
      _count: { id: true },
    });

    // 2. All-time Total Revenue
    const totalRevenueAgg = await prisma.sale.aggregate({
      where: { status: { in: ['COMPLETED', 'PARTIALLY_RETURNED'] } },
      _sum: { grandTotal: true },
    });

    // 3. Today's profit: sum( (unitPrice - costPrice) * quantity ) from today's saleItems
    const todaySaleItems = await prisma.saleItem.findMany({
      where: {
        sale: {
          saleDate: { gte: todayStart, lte: todayEnd },
          status: { in: ['COMPLETED', 'PARTIALLY_RETURNED'] },
        },
      },
    });
    const todayProfit = todaySaleItems.reduce((acc, item) => {
      const price = Number(item.unitPrice) || 0;
      const cost = Number(item.costPrice) || 0;
      return acc + (price - cost) * item.quantity;
    }, 0);

    // 4. Total Expenses
    const totalExpensesAgg = await prisma.expense.aggregate({
      _sum: { amount: true },
    });

    // 5. Total Products & Variants
    const totalProductsCount = await prisma.product.count({ where: { status: 'ACTIVE' } });
    const totalVariantsCount = await prisma.productVariant.count({ where: { status: 'ACTIVE' } });

    // 6. Low-stock & Out-of-stock products
    const variants = await prisma.productVariant.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, stockQuantity: true, minStockAlert: true },
    });
    const lowStockCount = variants.filter(
      (v) => v.stockQuantity > 0 && v.stockQuantity <= v.minStockAlert
    ).length;
    const outOfStockCount = variants.filter((v) => v.stockQuantity <= 0).length;

    // 7. Total Customers
    const totalCustomersCount = await prisma.customer.count({ where: { status: 'ACTIVE' } });

    // 8. Pending Payments (unpaid sales balances + customer credit balances)
    const pendingSalesDue = await prisma.sale.aggregate({
      where: { balanceDue: { gt: 0 }, status: { in: ['COMPLETED', 'PARTIALLY_RETURNED'] } },
      _sum: { balanceDue: true },
    });
    const customerBalances = await prisma.customer.aggregate({
      where: { balance: { gt: 0 } },
      _sum: { balance: true },
    });
    const pendingPaymentsTotal =
      Number(pendingSalesDue._sum.balanceDue || 0) + Number(customerBalances._sum.balance || 0);

    // 9. Best Selling Products (Top 5 variants)
    const topSaleItems = await prisma.saleItem.groupBy({
      by: ['variantId'],
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 6,
    });

    const topVariantIds = topSaleItems.map((item) => item.variantId);
    const topVariantsDetails = await prisma.productVariant.findMany({
      where: { id: { in: topVariantIds } },
      include: {
        product: { select: { name: true, image: true, category: { select: { name: true } } } },
        size: true,
        color: true,
      },
    });

    const bestSelling = topSaleItems.map((group) => {
      const v = topVariantsDetails.find((item) => item.id === group.variantId);
      return {
        variantId: group.variantId,
        productName: v?.product.name || 'Garment',
        category: v?.product.category?.name || 'Pret',
        size: v?.size?.code || 'Free',
        color: v?.color?.name || 'Assorted',
        sku: v?.sku || '',
        price: Number(v?.sellingPrice || 0),
        soldQuantity: group._sum.quantity || 0,
        totalRevenue: Number(group._sum.total || 0),
        image: v?.product.image,
      };
    });

    // 10. Recent Transactions
    const recentTransactions = await prisma.sale.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true, phone: true } },
        payments: { select: { paymentMethod: true } },
        items: {
          take: 3,
          include: {
            variant: {
              include: { product: { select: { name: true } }, size: true, color: true },
            },
          },
        },
      },
    });

    // 11. Recent Stock Activities
    const recentStockMovements = await prisma.stockMovement.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        variant: {
          include: { product: { select: { name: true } }, size: true, color: true },
        },
        user: { select: { name: true } },
        branch: { select: { name: true } },
      },
    });

    // 12. Weekly Revenue Chart (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklySales = await prisma.sale.findMany({
      where: {
        saleDate: { gte: sevenDaysAgo },
        status: { in: ['COMPLETED', 'PARTIALLY_RETURNED'] },
      },
      select: { saleDate: true, grandTotal: true },
    });

    const daysMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateKey = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      daysMap[dateKey] = { date: dateKey, day: dayLabel, revenue: 0, count: 0 };
    }

    weeklySales.forEach((s) => {
      const key = new Date(s.saleDate).toISOString().split('T')[0];
      if (daysMap[key]) {
        daysMap[key].revenue += Number(s.grandTotal);
        daysMap[key].count += 1;
      }
    });

    const weeklyChart = Object.values(daysMap);

    // 13. Monthly Sales Graph (Last 6 months calculated from database)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const sixMonthSales = await prisma.sale.findMany({
      where: {
        saleDate: { gte: sixMonthsAgo },
        status: { in: ['COMPLETED', 'PARTIALLY_RETURNED'] },
      },
      select: { saleDate: true, grandTotal: true },
    });

    const monthsMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const mLabel = d.toLocaleDateString('en-US', { month: 'short' });
      monthsMap[mKey] = { month: mLabel, sales: 0, orders: 0 };
    }

    sixMonthSales.forEach((s) => {
      const d = new Date(s.saleDate);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthsMap[mKey]) {
        monthsMap[mKey].sales += Number(s.grandTotal);
        monthsMap[mKey].orders += 1;
      }
    });

    const monthlySales = Object.values(monthsMap);

    res.json({
      todaySales: Number(todaySales._sum.grandTotal || 0),
      todayOrdersCount: todaySales._count.id || 0,
      totalRevenue: Number(totalRevenueAgg._sum.grandTotal || 0),
      todayProfit,
      totalExpenses: Number(totalExpensesAgg._sum.amount || 0),
      totalProducts: totalProductsCount,
      totalVariants: totalVariantsCount,
      lowStockProducts: lowStockCount,
      outOfStockProducts: outOfStockCount,
      totalCustomers: totalCustomersCount,
      pendingPayments: pendingPaymentsTotal,
      weeklyChart,
      monthlySales,
      bestSelling,
      recentTransactions,
      recentStockMovements,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
