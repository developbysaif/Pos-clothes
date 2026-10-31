import Link from 'next/link';
import { ShoppingCart, LayoutDashboard, Sparkles, Barcode, Shield, Camera, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between p-4 sm:p-8 lg:p-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <header className="flex items-center justify-between max-w-6xl w-full mx-auto relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-pink-500/25">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-base sm:text-lg tracking-tight">MR BILAL</h1>
            <p className="text-[10px] sm:text-xs text-zinc-400">Ladies Wear POS & Boutique Inventory</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/pos"
            className="text-xs font-bold text-pink-400 hover:text-pink-300 px-3 py-1.5 rounded-xl border border-pink-500/30 hover:bg-pink-500/10 transition flex items-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Open POS</span>
          </Link>

          <Link
            href="/login"
            className="text-xs text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 transition"
          >
            Staff Login
          </Link>
        </div>
      </header>

      {/* Main Hero */}
      <main className="max-w-4xl w-full mx-auto text-center space-y-6 sm:space-y-8 my-auto py-10 sm:py-16 relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold shadow-sm">
          <Sparkles className="w-3.5 h-3.5" /> Next-Gen POS • USB & Live Camera Barcode Scanner
        </div>

        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
          Modern & Responsive POS <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-indigo-400">
            For Ladies Fashion Boutiques
          </span>
        </h2>

        <p className="text-xs sm:text-sm md:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          High-speed cashier checkout, USB hardware & mobile camera barcode recognition,
          clothing tag printing, order holding, and thermal receipts — beautifully responsive across phone, tablet, and desktop.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
          <Link
            href="/pos"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white rounded-2xl font-extrabold text-sm shadow-2xl shadow-pink-500/30 transition active:scale-95"
          >
            <ShoppingCart className="w-5 h-5" /> Launch Cashier POS Terminal
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-2xl font-bold text-sm transition"
          >
            <LayoutDashboard className="w-5 h-5 text-indigo-400" /> Analytics Dashboard
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-8 sm:pt-12 text-left">
          <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 w-fit mb-3">
              <Barcode className="w-5 h-5" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-zinc-200">Dual Barcode Scanner</h3>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Supports plug-and-play USB hardware scanners with instant sub-50ms keystroke debounce, plus live HD camera scanning on phones and laptops.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md">
            <div className="p-2.5 rounded-2xl bg-pink-500/10 text-pink-400 w-fit mb-3">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-zinc-200">Fast Retail Checkout</h3>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Touch-friendly cart, order holding/recall, custom discounts, 5% VAT automatic calculation, and thermal receipts with printed barcodes.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 w-fit mb-3">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-zinc-200">Garment Tag Generator</h3>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Generate and print crisp Code-128 barcode stickers for ladies kurtis, suits, lehengas, and shawls directly from the catalog.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-zinc-600 max-w-6xl w-full mx-auto relative z-10 pt-4">
        Mr Bilal Ladies Wear POS • Responsive Next.js Architecture
      </footer>
    </div>
  );
}
