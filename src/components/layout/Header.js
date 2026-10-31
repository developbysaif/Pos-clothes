'use client';

import { useState, useEffect } from 'react';
import { Bell, Search, Wifi, LogOut, Moon, Sun } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    setCurrentTime(
      new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    );
  }, []);

  return (
    <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 flex items-center justify-between z-10 shrink-0">
      {/* Search Bar */}
      <div className="relative w-80">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Global search (products, customers, bills)..."
          className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-750 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        />
      </div>

      {/* Quick stats and Actions */}
      <div className="flex items-center gap-4">
        {/* Date / Time */}
        <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium hidden md:block">
          {currentTime}
        </div>

        {/* Network Status */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
          <Wifi className="w-3.5 h-3.5" />
          <span>Connected</span>
        </div>

        {/* Notifications */}
        <button
          className="p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition relative"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-pink-500 absolute top-1.5 right-1.5"></span>
        </button>

        {/* User profile dropdown / Logout link */}
        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800"></div>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 transition"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Switch User</span>
        </Link>
      </div>
    </header>
  );
}
