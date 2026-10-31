'use client';

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
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { INITIAL_PRODUCTS } from '../../../lib/data';
import CameraScannerModal from '../../../components/pos/CameraScannerModal';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const lowStockProducts = INITIAL_PRODUCTS.filter((p) => p.stock < 10);

  function handleBarcodeDetected(code) {
    setIsCameraOpen(false);
    router.push(`/pos?scan=${encodeURIComponent(code)}`);
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Store Performance & POS Analytics</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Live Feed
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time ladies boutique revenue, garment stock alerts, and cashier terminal activity.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Quick Scanner */}
          <button
            onClick={() => setIsCameraOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 rounded-2xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 transition shadow-sm"
          >
            <Camera className="w-4 h-4 text-pink-500" />
            <span>Scan Garment</span>
          </button>

          {/* Open POS */}
          <Link
            href="/pos"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-pink-500/20 transition active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Launch POS Terminal</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Today's Gross Sales",
            value: '$2,845.50',
            change: '+14.2% vs yesterday',
            isPositive: true,
            icon: DollarSign,
            color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
          },
          {
            title: 'Orders Processed',
            value: '48 Orders',
            change: '+8 new in last hour',
            isPositive: true,
            icon: ShoppingBag,
            color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
          },
          {
            title: 'Average Basket Value',
            value: '$59.28',
            change: '+3.1% higher margin',
            isPositive: true,
            icon: TrendingUp,
            color: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
          },
          {
            title: 'Low Stock Restock Alerts',
            value: `${lowStockProducts.length} Garments`,
            change: 'Needs immediate reorder',
            isPositive: false,
            icon: AlertTriangle,
            color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
          },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  {kpi.title}
                </span>
                <span className={`p-2.5 rounded-2xl border ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                  {kpi.value}
                </p>
                <p
                  className={`text-xs font-semibold mt-1 flex items-center gap-1 ${
                    kpi.isPositive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>{kpi.change}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Low Stock Warning + Recent Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Low Stock Watchlist (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Low Inventory Watchlist</span>
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Garments running low (under 10 items in stock)
              </p>
            </div>
            <Link
              href="/products"
              className="text-xs font-bold text-pink-600 dark:text-pink-400 hover:underline"
            >
              View All ({INITIAL_PRODUCTS.length}) →
            </Link>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[300px]">
            {lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-750 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {p.name}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono mt-0.5">
                    <span>SKU: {p.sku}</span>
                    <span>• {p.category}</span>
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">
                      Size: {p.size}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    {p.stock} left
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Boutique Actions & Scanner Panel (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-pink-950/30 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-pink-500 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Smart Barcode Station</span>
            </div>
            <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-100 mt-1">
              Ready to Scan & Sell
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">
              Connect any standard USB handheld laser barcode scanner, or use your device camera to instantly identify garments and add them to order receipts.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => setIsCameraOpen(true)}
              className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold text-xs flex items-center justify-between transition shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-pink-500" />
                <span>Open Live Camera Scanner</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-zinc-400" />
            </button>

            <Link
              href="/products"
              className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold text-xs flex items-center justify-between transition shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Barcode className="w-4 h-4 text-indigo-500" />
                <span>Generate & Print Garment Tags</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-zinc-400" />
            </Link>

            <Link
              href="/reports"
              className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold text-xs flex items-center justify-between transition shadow-sm"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>View Sales & VAT Tax Reports</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-zinc-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* Camera Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onDetected={handleBarcodeDetected}
      />
    </div>
  );
}
