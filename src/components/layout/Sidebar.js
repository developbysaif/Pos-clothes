'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Shirt,
  Barcode,
  Boxes,
  Truck,
  Users,
  Building2,
  RotateCcw,
  Receipt,
  Wallet,
  BarChart3,
  UserCheck,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    title: 'POS & Catalog',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Cashier POS', href: '/pos', icon: ShoppingCart, highlight: true },
      { name: 'Products & Variants', href: '/products', icon: Shirt },
      { name: 'Barcode Hub', href: '/barcodes', icon: Barcode },
    ],
  },
  {
    title: 'Inventory & Stock',
    items: [
      { name: 'Inventory & Alert', href: '/inventory', icon: Boxes },
      { name: 'Purchases & Stock In', href: '/purchases', icon: Truck },
      { name: 'Returns & Exchange', href: '/returns', icon: RotateCcw },
    ],
  },
  {
    title: 'CRM & Accounts',
    items: [
      { name: 'Customers (CRM)', href: '/customers', icon: Users },
      { name: 'Suppliers', href: '/suppliers', icon: Building2 },
      { name: 'Daily Expenses', href: '/expenses', icon: Receipt },
      { name: 'Cash Register Shifts', href: '/cash-register', icon: Wallet },
    ],
  },
  {
    title: 'Administration',
    items: [
      { name: 'Reports & P&L', href: '/reports', icon: BarChart3 },
      { name: 'Employees & Roles', href: '/employees', icon: UserCheck },
      { name: 'Store Settings', href: '/settings', icon: Settings },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-800 text-zinc-300">
      {/* Brand Logo & Mobile Close */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-zinc-800 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/25 group-hover:scale-105 transition">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-sm tracking-tight leading-tight flex items-center gap-1.5">
              <span>MR BILAL</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 font-mono font-bold">
                PRO
              </span>
            </h1>
            <span className="text-[10px] text-zinc-400 font-medium tracking-wider uppercase">
              Ladies Wear & POS
            </span>
          </div>
        </Link>

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

      {/* Navigation Groups */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold text-zinc-500 tracking-wider uppercase">
              {group.title}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-rose-600 text-white shadow-md shadow-rose-500/20 font-bold'
                      : item.highlight
                      ? 'text-rose-400 hover:bg-zinc-900 hover:text-rose-300'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.name}</span>
                  {item.highlight && (
                    <span className="ml-auto text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      Live
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Branch & Terminal Footer */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/60 shrink-0">
        <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-rose-500 text-white flex items-center justify-center font-bold text-xs shadow">
            MB
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-zinc-200 truncate">Gulberg Flagship</p>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Terminal #01 • Online
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex w-60 shrink-0 flex-col">
        {sidebarContent}
      </aside>

      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
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
