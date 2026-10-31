'use client';

import { useState } from 'react';
import { BarChart3, Download, Calendar, DollarSign, TrendingUp, CreditCard } from 'lucide-react';

export default function ReportsPage() {
  const [period, setPeriod] = useState('Today');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Sales & Analytics Reports
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Track daily gross revenue, payment method breakdowns, and profit margins.
          </p>
        </div>
        <button
          onClick={() => alert('Exporting CSV summary report...')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl text-xs font-semibold transition self-start sm:self-auto shadow-sm"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      {/* Period Filter */}
      <div className="flex gap-2">
        {['Today', 'This Week', 'This Month', 'Year-to-Date'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              period === p
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs text-zinc-500 font-medium">Net Sales</span>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">$2,845.50</p>
          <p className="text-xs text-emerald-600 mt-1 font-medium">+14.2% higher</p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs text-zinc-500 font-medium">VAT / Tax Collected</span>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">$142.28</p>
          <p className="text-xs text-zinc-500 mt-1 font-medium">Standard 5% Rate</p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs text-zinc-500 font-medium">Garments Sold</span>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">67 Units</p>
          <p className="text-xs text-indigo-600 mt-1 font-medium">Average 1.4 items/sale</p>
        </div>
      </div>

      {/* Payment Modes Breakdown */}
      <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
          Payment Method Share
        </h3>
        <div className="space-y-3">
          {[
            { mode: 'Cash at Counter', amount: '$1,420.00', pct: 50, color: 'bg-emerald-500' },
            { mode: 'Credit / Debit Card', amount: '$1,138.20', pct: 40, color: 'bg-indigo-500' },
            { mode: 'Mobile QR Pay (Raast / JazzCash)', amount: '$287.30', pct: 10, color: 'bg-pink-500' },
          ].map((item, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{item.mode}</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {item.amount} ({item.pct}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full ${item.color} rounded-full transition-all duration-500`}
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
