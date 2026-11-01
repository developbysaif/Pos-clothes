'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  ArrowUpRight,
  Shirt,
  ShoppingBag,
  Barcode,
  Camera,
  Users,
  Clock,
  Sparkles,
  RefreshCw,
  Boxes,
  Receipt,
  CreditCard,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import CameraScannerModal from '../../../components/pos/CameraScannerModal';
import ReceiptModal from '../../../components/pos/ReceiptModal';

export default function DashboardPage() {
  const router = useRouter();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedReceiptSale, setSelectedReceiptSale] = useState(null);

  async function loadStats() {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const data = await api.getDashboardStats();
        if (isMounted) {
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  function handleBarcodeDetected(code) {
    setIsCameraOpen(false);
    router.push(`/pos?scan=${encodeURIComponent(code)}`);
  }

  const kpis = [
    {
      title: "Today's Total Sales",
      value: `₨ ${(stats?.todaySales || 0).toLocaleString()}`,
      sub: `${stats?.todayOrdersCount || 0} Orders Today`,
      change: '+14.2% vs avg',
      isPositive: true,
      icon: DollarSign,
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    },
    {
      title: 'Total Revenue',
      value: `₨ ${(stats?.totalRevenue || 0).toLocaleString()}`,
      sub: 'All completed orders',
      change: 'Lifetime store volume',
      isPositive: true,
      icon: TrendingUp,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    },
    {
      title: "Today's Net Profit",
      value: `₨ ${(stats?.todayProfit || 0).toLocaleString()}`,
      sub: 'Gross Margin calculated',
      change: 'Profit after cost of goods',
      isPositive: true,
      icon: ShoppingBag,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Total Expenses',
      value: `₨ ${(stats?.totalExpenses || 0).toLocaleString()}`,
      sub: 'Operational & utilities',
      change: 'Tracked in ledger',
      isPositive: false,
      icon: Receipt,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'Total Garment SKUs',
      value: `${stats?.totalVariants || 0} Variants`,
      sub: `${stats?.totalProducts || 0} Styles Cataloged`,
      change: 'Active in Boutique',
      isPositive: true,
      icon: Shirt,
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      title: 'Low-Stock Alerts',
      value: `${stats?.lowStockProducts || 0} Garments`,
      sub: 'Stock below threshold',
      change: 'Reorder recommended',
      isPositive: false,
      icon: AlertTriangle,
      color: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    },
    {
      title: 'Out of Stock',
      value: `${stats?.outOfStockProducts || 0} Items`,
      sub: '0 quantity remaining',
      change: 'Immediate replenishment',
      isPositive: false,
      icon: Package,
      color: 'text-red-500 bg-red-500/10 border-red-500/20',
    },
    {
      title: 'Pending Receivables',
      value: `₨ ${(stats?.pendingPayments || 0).toLocaleString()}`,
      sub: `${stats?.totalCustomers || 0} Registered Clients`,
      change: 'Customer credit ledger',
      isPositive: false,
      icon: Users,
      color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Store Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Ladies Boutique Analytics</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Live SQL Data
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time fashion store sales, stock movement, profit margins, and counter terminals.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadStats}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 transition"
            title="Refresh database numbers"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={() => setIsCameraOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 transition shadow-sm"
          >
            <Camera className="w-3.5 h-3.5 text-rose-500" />
            <span>Scan Tag</span>
          </button>

          <Link
            href="/pos"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 via-rose-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-rose-500/20 transition active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Launch POS</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  {kpi.title}
                </span>
                <span className={`p-2 rounded-xl border ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <p className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                  {loading ? '...' : kpi.value}
                </p>
                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <span className="text-zinc-400">{kpi.sub}</span>
                  <span
                    className={`font-semibold ${
                      kpi.isPositive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {kpi.change}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section: Weekly Revenue + Monthly Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Weekly Revenue Visualizer (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-rose-500" />
                <span>Weekly Revenue Trend</span>
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Past 7 days revenue (PKR) calculated from finalized sales
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-lg">
              PKR (₨)
            </span>
          </div>

          {/* Bar Chart Representation */}
          <div className="h-48 flex items-end justify-between gap-2 pt-6 pb-2 px-2">
            {(stats?.weeklyChart || []).map((day, idx) => {
              const maxVal = Math.max(...(stats?.weeklyChart || []).map((d) => d.revenue), 30000);
              const heightPct = Math.max(12, Math.round((day.revenue / maxVal) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="opacity-0 group-hover:opacity-100 text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300 transition -mb-1">
                    ₨{Math.round(day.revenue).toLocaleString()}
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full max-w-[42px] rounded-t-xl transition-all duration-300 ${
                      day.revenue > 0
                        ? 'bg-gradient-to-t from-purple-600 via-rose-500 to-rose-400 group-hover:brightness-110 shadow-sm'
                        : 'bg-zinc-200 dark:bg-zinc-800'
                    }`}
                  ></div>
                  <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 truncate max-w-full">
                    {day.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Performance Bars (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 space-y-4 flex flex-col justify-between">
          <div className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-purple-500" />
              <span>Monthly Volume Overview</span>
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">Seasonal sales progression</p>
          </div>

          <div className="space-y-3 py-1">
            {(stats?.monthlySales || []).map((m, idx) => {
              const maxMonthly = 800000;
              const pct = Math.min(100, Math.round((m.sales / maxMonthly) * 100));
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">{m.month}</span>
                    <span className="font-mono text-zinc-500 dark:text-zinc-400">
                      ₨ {m.sales.toLocaleString()} ({m.orders} bills)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-rose-500 transition-all duration-500"
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Branch: Gulberg Flagship (LHR-01)</span>
            <Link href="/reports" className="text-rose-500 font-bold hover:underline">
              Detailed Reports →
            </Link>
          </div>
        </div>
      </div>

      {/* Two Columns: Best-Selling Garments & Recent POS Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Best Selling Products (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-500" />
                <span>Top Selling Ladies Wear</span>
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">Ranked by units sold at POS</p>
            </div>
            <Link href="/products" className="text-xs font-bold text-rose-500 hover:underline">
              All Garments →
            </Link>
          </div>

          <div className="space-y-3">
            {(!stats?.bestSelling || stats.bestSelling.length === 0) ? (
              <p className="text-xs text-zinc-400 py-4 text-center">No sales registered yet.</p>
            ) : (
              stats.bestSelling.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-850/40 border border-zinc-200 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=200'}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {item.productName}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                        <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
                          {item.size}
                        </span>
                        <span>• {item.color}</span>
                        <span>• ₨ {item.price.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      {item.soldQuantity} sold
                    </span>
                    <p className="text-[10px] font-mono text-zinc-400 mt-1">
                      ₨ {item.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions & Invoices (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-purple-500" />
                <span>Recent Invoices</span>
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">Live checkout transactions</p>
            </div>
            <Link href="/reports" className="text-xs font-bold text-purple-500 hover:underline">
              View History →
            </Link>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[340px]">
            {(!stats?.recentTransactions || stats.recentTransactions.length === 0) ? (
              <p className="text-xs text-zinc-400 py-4 text-center">No transactions found.</p>
            ) : (
              stats.recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => setSelectedReceiptSale(tx)}
                  className="p-3 rounded-2xl bg-zinc-50/80 dark:bg-zinc-850/50 border border-zinc-200 dark:border-zinc-800 hover:border-purple-500 dark:hover:border-purple-500 cursor-pointer transition flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-purple-600 dark:text-purple-400">
                        {tx.invoiceNumber}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                        {tx.payments?.[0]?.paymentMethod || 'CASH'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Client: {tx.customer?.name || 'Walk-in'} • {new Date(tx.saleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 group-hover:text-rose-500 transition">
                      ₨ {Number(tx.grandTotal).toLocaleString()}
                    </p>
                    <span className="text-[10px] text-emerald-500 font-bold flex items-center justify-end gap-1">
                      <CheckCircle className="w-3 h-3" /> Paid
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Inventory Stock Movements Audit Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-emerald-500" />
              <span>Recent Inventory Movements (Audit Log)</span>
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Every garment sold, received, or adjusted is tracked with SQL ledger entries
            </p>
          </div>
          <Link href="/inventory" className="text-xs font-bold text-emerald-500 hover:underline">
            Inventory Central →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 text-[11px]">
                <th className="py-2.5 font-semibold">Time</th>
                <th className="py-2.5 font-semibold">Garment Style</th>
                <th className="py-2.5 font-semibold">Size & Color</th>
                <th className="py-2.5 font-semibold">Action Type</th>
                <th className="py-2.5 font-semibold text-right">Quantity</th>
                <th className="py-2.5 font-semibold">Initiated By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
              {(!stats?.recentStockMovements || stats.recentStockMovements.length === 0) ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-zinc-400">
                    No recent stock movements recorded.
                  </td>
                </tr>
              ) : (
                stats.recentStockMovements.map((mov) => {
                  const isPositive = mov.quantity > 0;
                  return (
                    <tr key={mov.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/40">
                      <td className="py-2.5 text-zinc-500 font-mono text-[11px]">
                        {new Date(mov.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 font-bold text-zinc-800 dark:text-zinc-200">
                        {mov.variant?.product?.name || 'Garment'}
                      </td>
                      <td className="py-2.5 text-zinc-500">
                        <span className="font-mono text-xs">{mov.variant?.size?.code || ''}</span> • {mov.variant?.color?.name || ''}
                      </td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {mov.movementType}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-extrabold font-mono">
                        <span className={isPositive ? 'text-emerald-500' : 'text-rose-500'}>
                          {isPositive ? `+${mov.quantity}` : mov.quantity}
                        </span>
                      </td>
                      <td className="py-2.5 text-zinc-400 text-[11px]">
                        {mov.user?.name || 'System POS'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Camera Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onDetected={handleBarcodeDetected}
      />

      {/* Sale Receipt Modal */}
      {selectedReceiptSale && (
        <ReceiptModal
          isOpen={!!selectedReceiptSale}
          onClose={() => setSelectedReceiptSale(null)}
          saleData={selectedReceiptSale}
        />
      )}
    </div>
  );
}
