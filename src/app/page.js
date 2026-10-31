import Link from 'next/link';
import { ShoppingCart, LayoutDashboard, Sparkles, Barcode, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between p-6 sm:p-12">
      <header className="flex items-center justify-between max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">NOOR LADIES BOUTIQUE</h1>
            <p className="text-xs text-zinc-400">Enterprise Point of Sale & Inventory</p>
          </div>
        </div>

        <Link
          href="/login"
          className="text-xs text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-900 transition"
        >
          Staff Login
        </Link>
      </header>

      <main className="max-w-4xl w-full mx-auto text-center space-y-8 my-auto py-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" /> Next.js 16 + Tailwind CSS + Hardware Scanner Engine
        </div>

        <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
          Next-Generation POS <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-indigo-400 to-purple-400">
            for Modern Boutiques
          </span>
        </h2>

        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Lightning-fast cashier checkout, USB hardware & mobile camera barcode scanning,
          real-time stock management, and thermal receipt generation built with React Server & Client components.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/pos"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-pink-500/20 transition active:scale-95"
          >
            <ShoppingCart className="w-5 h-5" /> Launch Cashier POS Terminal
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-2xl font-semibold text-sm transition"
          >
            <LayoutDashboard className="w-5 h-5 text-indigo-400" /> View Analytics Dashboard
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 text-left">
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
            <Barcode className="w-5 h-5 text-indigo-400 mb-2" />
            <h3 className="text-xs font-bold text-zinc-200">Dual Barcode Modes</h3>
            <p className="text-[11px] text-zinc-400 mt-1">
              Supports plug-and-play USB HID handheld barcode scanners with sub-50ms debounce and webcam video recognition.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
            <ShoppingCart className="w-5 h-5 text-pink-400 mb-2" />
            <h3 className="text-xs font-bold text-zinc-200">Cart & Order Management</h3>
            <p className="text-[11px] text-zinc-400 mt-1">
              Order holding/recall, item discounts, 5% VAT automatic calculation, and multi-mode payment settlement.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
            <Shield className="w-5 h-5 text-emerald-400 mb-2" />
            <h3 className="text-xs font-bold text-zinc-200">Full Relational DDL</h3>
            <p className="text-[11px] text-zinc-400 mt-1">
              PostgreSQL schema with ACID transaction sales decrement, foreign keys, and indexes on SKUs.
            </p>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-zinc-600 max-w-6xl w-full mx-auto">
        Noor Boutique POS System • Built with Next.js & Express
      </footer>
    </div>
  );
}
