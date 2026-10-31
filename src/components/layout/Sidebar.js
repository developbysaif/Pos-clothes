'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Shirt,
  FolderTree,
  Users,
  BarChart3,
  Settings,
  Sparkles,
  X,
  Barcode,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Cashier POS', href: '/pos', icon: ShoppingCart, highlight: true },
  { name: 'Products', href: '/products', icon: Shirt },
  { name: 'Categories', href: '/categories', icon: FolderTree },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Sales & Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800 text-zinc-300">
      {/* Brand Logo & Mobile Close */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-zinc-800">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-600 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/25 group-hover:scale-105 transition">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-base tracking-tight leading-tight">
              MR BILAL
            </h1>
            <span className="text-[10px] text-pink-400 font-medium tracking-wider uppercase">
              Ladies Wear POS
            </span>
          </div>
        </Link>

        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 tracking-wider uppercase">
          Terminal Menu
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-lg shadow-pink-500/20 font-bold'
                  : item.highlight
                  ? 'text-pink-400 hover:bg-zinc-800/80 hover:text-pink-300'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
              {item.highlight && (
                <span className="ml-auto text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30">
                  Live
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Barcode Quick Info Card */}
      <div className="px-3.5 pb-2">
        <div className="p-3 rounded-2xl bg-zinc-800/40 border border-zinc-800 flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Barcode className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-zinc-200">Scanner Engine</p>
            <p className="text-[10px] text-zinc-400 truncate">USB HID & HD Camera</p>
          </div>
        </div>
      </div>

      {/* Cashier Status Footer */}
      <div className="p-3.5 border-t border-zinc-800">
        <div className="p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 text-white flex items-center justify-center font-bold text-xs shadow">
            SB
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-200 truncate">Saif Cashier</p>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Terminal #01 Online
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (with backdrop) */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        ></div>

        {/* Sliding Drawer */}
        <div
          className={`absolute top-0 bottom-0 left-0 w-72 max-w-[85vw] shadow-2xl transition-transform duration-300 ease-out transform ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </div>
      </div>
    </>
  );
}
