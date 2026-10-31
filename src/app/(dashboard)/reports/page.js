'use client';

import { useState } from 'react';
import { BarChart3, Download, Calendar, DollarSign, TrendingUp, CreditCard, Sparkles } from 'lucide-react';

export default function ReportsPage() {
  const [period, setPeriod] = useState('Today');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Sales & Analytics Reports</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 font-bold">
              Boutique Summary
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Track daily gross revenue, tax collection (5% VAT), payment method breakdown, and margins.
          </p>
        </div>
        <button
          onClick={() => alert('Exporting Boutique CSV Sales Report...')}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-2xl text-xs font-bold transition self-start sm:self-auto shadow-sm"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      {/* Period Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {['Today', 'This Week', 'This Month', 'Year-to-Date'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              period === p
                ? 'bg-gradient-to-r from-pink-600 to-indigo-600 text-white shadow-md shadow-pink-500/20'
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">Net Boutique Sales</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-2">$2,845.50</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-bold">+14.2% higher vs yesterday</p>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">VAT / Tax Collected</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-2">$142.28</p>
          <p className="text-xs text-zinc-500 mt-1 font-medium">Standard 5% Rate Applied</p>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">Garments Sold</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-2">67 Units</p>
          <p className="text-xs text-pink-600 dark:text-pink-400 mt-1 font-bold">Avg 1.4 items per ticket</p>
        </div>
      </div>

      {/* Payment Modes Breakdown */}
      <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
          Payment Method Share & Settlement
        </h3>
        <div className="space-y-4">
          {[
            { mode: 'Cash at Counter', amount: '$1,420.00', pct: 50, color: 'bg-emerald-500' },
            { mode: 'Credit / Debit POS Terminal', amount: '$1,138.20', pct: 40, color: 'bg-indigo-500' },
            { mode: 'Mobile Raast / JazzCash QR Pay', amount: '$287.30', pct: 10, color: 'bg-pink-500' },
          ].map((item, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{item.mode}</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {item.amount} ({item.pct}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full ${item.color} rounded-full transition-all duration-700`}
                  style={{ width: `${item.pct}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
