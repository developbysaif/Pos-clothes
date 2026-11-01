'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  Sparkles,
  PieChart,
  Boxes,
  FileSpreadsheet,
  RefreshCw,
  Receipt,
  ArrowUpRight,
  TrendingDown,
} from 'lucide-react';
import { api, API_BASE } from '@/lib/api';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('SALES'); // 'SALES' | 'PROFIT_LOSS' | 'INVENTORY_VALUATION'
  const [range, setRange] = useState('MONTH'); // 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR'
  const [salesReport, setSalesReport] = useState(null);
  const [plReport, setPlReport] = useState(null);
  const [invValuation, setInvValuation] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadReportData() {
    try {
      setLoading(true);
      const [salesRes, plRes, invRes] = await Promise.all([
        api.getSalesReport({ range }),
        api.getProfitLossReport(),
        api.getInventoryValuation(),
      ]);

      setSalesReport(salesRes);
      setPlReport(plRes);
      setInvValuation(invRes);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    async function fetchReports() {
      try {
        const [salesRes, plRes, invRes] = await Promise.all([
          api.getSalesReport({ range }),
          api.getProfitLossReport(),
          api.getInventoryValuation(),
        ]);
        if (isMounted) {
          setSalesReport(salesRes);
          setPlReport(plRes);
          setInvValuation(invRes);
        }
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchReports();
    return () => {
      isMounted = false;
    };
  }, [range]);

  function handleExportCsv(type) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('boutique_token') : '';
    const url = `${API_BASE}/reports/export-csv?type=${type}&token=${token}`;
    window.open(url, '_blank');
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Financial Reports & Analytics</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold">
              PKR (₨)
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time Profit & Loss statement, sales volume, COGS, inventory valuation, and Excel exports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportCsv(activeTab === 'INVENTORY_VALUATION' ? 'inventory' : 'sales')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export to CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* Main Tab Segmented Switcher */}
      <div className="flex rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-1 gap-1 max-w-lg">
        {[
          { id: 'SALES', label: 'Sales Reports' },
          { id: 'PROFIT_LOSS', label: 'Profit & Loss (P&L)' },
          { id: 'INVENTORY_VALUATION', label: 'Inventory Valuation' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition ${
              activeTab === tab.id
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: SALES REPORTS */}
      {activeTab === 'SALES' && (
        <div className="space-y-5">
          {/* Range Filter */}
          <div className="flex gap-2">
            {[
              { id: 'TODAY', label: "Today's Sales" },
              { id: 'WEEK', label: 'Past 7 Days' },
              { id: 'MONTH', label: 'This Month' },
              { id: 'YEAR', label: 'Annual (YTD)' },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  range === r.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <span className="text-xs text-zinc-400 font-semibold">Total Revenue</span>
              <p className="text-2xl font-black text-purple-700 dark:text-purple-400 font-mono mt-1">
                ₨ {(salesReport?.summary?.totalRevenue || 0).toLocaleString()}
              </p>
              <span className="text-[11px] text-zinc-400">Total gross billings</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <span className="text-xs text-zinc-400 font-semibold">Orders Processed</span>
              <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 font-mono mt-1">
                {salesReport?.summary?.totalOrders || 0}
              </p>
              <span className="text-[11px] text-zinc-400">Cashier tickets</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <span className="text-xs text-zinc-400 font-semibold">Average Basket Value</span>
              <p className="text-2xl font-black text-emerald-600 font-mono mt-1">
                ₨ {Math.round(salesReport?.summary?.averageOrderValue || 0).toLocaleString()}
              </p>
              <span className="text-[11px] text-zinc-400">Per transaction</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <span className="text-xs text-zinc-400 font-semibold">Sales Tax Collected</span>
              <p className="text-2xl font-black text-amber-600 font-mono mt-1">
                ₨ {(salesReport?.summary?.totalTax || 0).toLocaleString()}
              </p>
              <span className="text-[11px] text-zinc-400">5% Sales Tax</span>
            </div>
          </div>

          {/* Sales Invoices Table */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden p-4 space-y-3">
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
              Completed Sales Invoices
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 text-[11px] font-bold">
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Subtotal</th>
                    <th className="py-2.5 px-3">Discount</th>
                    <th className="py-2.5 px-3">Grand Total</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                  {(salesReport?.sales || []).map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-purple-600">
                        {s.invoiceNumber}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-500">
                        {new Date(s.saleDate).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 font-semibold">{s.customer?.name || 'Walk-in'}</td>
                      <td className="py-2.5 px-3 font-mono">₨ {Number(s.subtotal).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono text-rose-500">
                        ₨ {Number(s.discountAmount).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
                        ₨ {Number(s.grandTotal).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-600">
                          {s.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROFIT & LOSS STATEMENT */}
      {activeTab === 'PROFIT_LOSS' && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 space-y-6">
          <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                Income & Expenditure Statement (P&L)
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Automatically calculated from database Sales, Purchase Costs (COGS), and Expenses
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-xl">
              Net Margin: {plReport?.netMargin || 0}%
            </span>
          </div>

          <div className="space-y-4 max-w-2xl text-xs sm:text-sm">
            {/* Revenue */}
            <div className="flex justify-between items-center py-2 border-b border-zinc-200 dark:border-zinc-800 font-bold">
              <span>Gross Sales Revenue (A)</span>
              <span className="font-mono text-base text-zinc-900 dark:text-zinc-100">
                ₨ {(plReport?.totalSalesRevenue || 0).toLocaleString()}
              </span>
            </div>

            {/* COGS */}
            <div className="flex justify-between items-center py-2 border-b border-zinc-200 dark:border-zinc-800 text-rose-600">
              <span>Less: Cost of Goods Sold (COGS) (B)</span>
              <span className="font-mono font-bold">
                -₨ {(plReport?.totalCOGS || 0).toLocaleString()}
              </span>
            </div>

            {/* Gross Profit */}
            <div className="flex justify-between items-center py-2.5 border-b-2 border-purple-500 font-extrabold text-sm sm:text-base text-purple-700 dark:text-purple-400">
              <span>Gross Profit (A - B)</span>
              <span className="font-mono">
                ₨ {(plReport?.grossProfit || 0).toLocaleString()} ({plReport?.grossMargin || 0}%)
              </span>
            </div>

            {/* Operating Expenses */}
            <div className="pt-2 space-y-2">
              <span className="font-bold text-zinc-500 text-xs uppercase tracking-wider block">
                Operating Expenses Breakdown:
              </span>
              {Object.entries(plReport?.expensesByCategory || {}).map(([cat, amt]) => (
                <div key={cat} className="flex justify-between text-zinc-600 dark:text-zinc-400 text-xs">
                  <span>{cat}</span>
                  <span className="font-mono">₨ {amt.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold pt-1 text-rose-600 border-t border-dashed border-zinc-300 dark:border-zinc-700">
                <span>Total Operating Expenses (C)</span>
                <span className="font-mono">-₨ {(plReport?.totalExpenses || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Net Profit */}
            <div className="flex justify-between items-center py-4 p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-rose-50 to-emerald-50 dark:from-purple-950/40 dark:via-rose-950/30 dark:to-emerald-950/40 border border-purple-200 dark:border-purple-800 font-black text-lg text-zinc-900 dark:text-zinc-100">
              <span>Net Boutique Profit</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                ₨ {(plReport?.netProfit || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INVENTORY VALUATION */}
      {activeTab === 'INVENTORY_VALUATION' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <span className="text-xs text-zinc-400 font-semibold">Inventory Valuation at Cost</span>
              <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 font-mono mt-1">
                ₨ {(invValuation?.totalCostValue || 0).toLocaleString()}
              </p>
              <span className="text-[11px] text-zinc-400">Capital invested in stock</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <span className="text-xs text-zinc-400 font-semibold">Valuation at Retail Price</span>
              <p className="text-2xl font-black text-purple-700 dark:text-purple-400 font-mono mt-1">
                ₨ {(invValuation?.totalRetailValue || 0).toLocaleString()}
              </p>
              <span className="text-[11px] text-zinc-400">Potential retail realization</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <span className="text-xs text-zinc-400 font-semibold">Unrealized Potential Profit</span>
              <p className="text-2xl font-black text-emerald-600 font-mono mt-1">
                ₨ {(invValuation?.totalPotentialProfit || 0).toLocaleString()}
              </p>
              <span className="text-[11px] text-zinc-400">Projected inventory margin</span>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 text-[11px] font-bold">
                    <th className="py-2.5 px-3">Garment Item</th>
                    <th className="py-2.5 px-3">Size & Color</th>
                    <th className="py-2.5 px-3">Stock Units</th>
                    <th className="py-2.5 px-3">Cost / Unit</th>
                    <th className="py-2.5 px-3">Retail / Unit</th>
                    <th className="py-2.5 px-3">Total Cost</th>
                    <th className="py-2.5 px-3 text-right">Potential Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                  {(invValuation?.items || []).map((it) => (
                    <tr key={it.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/40">
                      <td className="py-2.5 px-3 font-bold text-zinc-800 dark:text-zinc-200">
                        {it.name}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-500">
                        [{it.size}] • {it.color}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">{it.stock}</td>
                      <td className="py-2.5 px-3 font-mono text-zinc-500">
                        ₨ {it.costPrice.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-purple-600">
                        ₨ {it.sellingPrice.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">
                        ₨ {it.costTotal.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                        ₨ {it.potentialProfit.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
