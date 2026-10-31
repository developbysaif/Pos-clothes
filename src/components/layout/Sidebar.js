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

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0 text-zinc-300">
      {/* Brand Logo */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-zinc-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base tracking-tight leading-tight">
            NOOR BOUTIQUE
          </h1>
          <span className="text-[11px] text-zinc-400 font-medium">Ladies Wear POS</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 tracking-wider uppercase">
          Menu
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                  : item.highlight
                  ? 'text-pink-400 hover:bg-zinc-800/80 hover:text-pink-300'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850 hover:bg-zinc-800/50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
              {item.highlight && (
                <span className="ml-auto text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30">
                  Live
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Cashier Status Footer */}
      <div className="p-4 border-t border-zinc-800">
        <div className="p-3 rounded-xl bg-zinc-850/80 bg-zinc-800/40 border border-zinc-800/80 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
            SA
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-200 truncate">Saif Cashier</p>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Terminal #01 Online
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
