'use client';

import {
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  ArrowUpRight,
  Shirt,
  ShoppingBag,
} from 'lucide-react';
import Link from 'next/link';
import { INITIAL_PRODUCTS } from '../../../lib/data';

export default function DashboardPage() {
  const lowStockProducts = INITIAL_PRODUCTS.filter((p) => p.stock < 10);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Store Performance Overview
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time sales, inventory alerts, and boutique performance metrics.
          </p>
        </div>
        <Link
          href="/pos"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition self-start sm:self-auto"
        >
          <ShoppingBag className="w-4 h-4" /> Open Cashier POS
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Today's Gross Revenue",
            value: '$2,845.50',
            change: '+14.2% vs yesterday',
            isPositive: true,
            icon: DollarSign,
            color: 'text-emerald-500 bg-emerald-500/10',
          },
          {
            title: 'Orders Processed',
            value: '48 Transactions',
            change: '+8 new orders this hour',
            isPositive: true,
            icon: ShoppingBag,
            color: 'text-indigo-500 bg-indigo-500/10',
          },
          {
            title: 'Average Ticket Value',
            value: '$59.28',
            change: '+3.1% higher margin',
            isPositive: true,
            icon: TrendingUp,
            color: 'text-pink-500 bg-pink-500/10',
          },
          {
            title: 'Low Stock Alerts',
            value: `${lowStockProducts.length} Items`,
            change: 'Restock needed soon',
            isPositive: false,
            icon: AlertTriangle,
            color: 'text-amber-500 bg-amber-500/10',
          },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {kpi.title}
                </span>
                <span className={`p-2 rounded-xl ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {kpi.value}
                </p>
                <p
                  className={`text-[11px] font-medium mt-1 ${
                    kpi.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {kpi.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid: Recent Orders & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Recent Sales & Cashier Receipts
            </h3>
            <Link
              href="/reports"
              className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline inline-flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="pb-2 font-medium">Receipt #</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Method</th>
                  <th className="pb-2 font-medium text-right">Items</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {[
                  { id: 'INV-49201', cust: 'Ayesha Khan', mode: 'Card', items: 3, total: '$189.98', time: '10 mins ago' },
                  { id: 'INV-49200', cust: 'Walk-in Customer', mode: 'Cash', items: 1, total: '$34.99', time: '22 mins ago' },
                  { id: 'INV-49199', cust: 'Fatima Zahra', mode: 'QR Pay', items: 4, total: '$219.50', time: '45 mins ago' },
                  { id: 'INV-49198', cust: 'Zainab Ahmed', mode: 'Cash', items: 2, total: '$89.99', time: '1 hr ago' },
                ].map((sale) => (
                  <tr key={sale.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition">
                    <td className="py-2.5 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                      {sale.id}
                    </td>
                    <td className="py-2.5 text-zinc-700 dark:text-zinc-300 font-medium">
                      {sale.cust}
                    </td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold uppercase">
                        {sale.mode}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-zinc-500">{sale.items}</td>
                    <td className="py-2.5 text-right font-bold text-zinc-900 dark:text-zinc-100">
                      {sale.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Restock Panel */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Restock Warnings</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-500 font-bold">
                {lowStockProducts.length}
              </span>
            </h3>
            <Link
              href="/products"
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Manage
            </Link>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-1">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    SKU: {p.sku} | Size: {p.size}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                    {p.stock} left
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
