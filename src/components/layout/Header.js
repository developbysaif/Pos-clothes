'use client';

import { useState, useEffect } from 'react';
import {
  Menu,
  Search,
  Wifi,
  LogOut,
  Moon,
  Sun,
  Camera,
  Barcode,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '../../context/ThemeContext';
import CameraScannerModal from '../pos/CameraScannerModal';
import { useRouter } from 'next/navigation';

export default function Header({ onToggleMobileMenu }) {
  const [currentTime, setCurrentTime] = useState('');
  const { theme, toggleTheme, mounted } = useTheme();
  const [isHeaderScannerOpen, setIsHeaderScannerOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentTime(
        new Date().toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
      );
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  function handleScannerDetected(barcode) {
    // Navigate to POS or search with this barcode
    router.push(`/pos?scan=${encodeURIComponent(barcode)}`);
  }

  return (
    <>
      <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between z-20 shrink-0 sticky top-0">
        {/* Left: Mobile Menu Toggle & Brand / Search */}
        <div className="flex items-center gap-2.5 sm:gap-4 flex-1 max-w-lg">
          {/* Hamburger button on mobile & tablet */}
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Quick Search */}
          <div className="relative flex-1 max-w-xs sm:max-w-sm">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search garments, SKU, customer..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-750 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
            />
          </div>
        </div>

        {/* Right: Quick Barcode Scanner, Theme Toggle, Terminal Status & Logout */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Quick Header Barcode Camera Scanner Button */}
          <button
            onClick={() => setIsHeaderScannerOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-pink-500/10 to-indigo-500/10 hover:from-pink-500/20 hover:to-indigo-500/20 text-pink-600 dark:text-pink-400 border border-pink-500/20 transition shadow-sm"
            title="Scan Barcode with Camera"
          >
            <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-500" />
            <span className="hidden sm:inline">Scan Barcode</span>
          </button>

          {/* Terminal Network Status */}
          <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Online</span>
          </div>

          {/* Date */}
          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium hidden xl:block">
            {currentTime}
          </div>

          {/* Theme Toggle (Dark / Light) */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>
          )}

          <div className="h-5 w-px bg-zinc-200 dark:border-zinc-800 mx-0.5"></div>

          {/* Logout / Switch User */}
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 sm:px-2 sm:py-1 rounded-xl transition"
            title="Switch User / Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-medium">Exit</span>
          </Link>
        </div>
      </header>

      {/* Global Camera Scanner Modal from Header */}
      <CameraScannerModal
        isOpen={isHeaderScannerOpen}
        onClose={() => setIsHeaderScannerOpen(false)}
        onDetected={handleScannerDetected}
      />
    </>
  );
}
