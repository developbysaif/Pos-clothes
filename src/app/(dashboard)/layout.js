'use client';

import { useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { CartProvider } from '../../context/CartContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Shirt, BarChart3, Settings } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const mobileNav = [
    { name: 'POS', href: '/pos', icon: ShoppingCart },
    { name: 'Garments', href: '/products', icon: Shirt },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <CartProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        {/* Sidebar (Desktop persistent + Mobile Drawer) */}
        <Sidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Header onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)} />

          <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 pb-20 lg:pb-6">
            {children}
          </main>

          {/* Mobile Bottom Navigation Bar (Visible only on screens < lg) */}
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-14 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around px-2">
            {mobileNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const isPOS = item.href === '/pos';

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition text-[10px] font-medium ${
                    isActive
                      ? 'text-pink-600 dark:text-pink-400 font-bold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                  }`}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${isPOS && !isActive ? 'text-indigo-500' : ''}`} />
                    {isPOS && (
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500 absolute -top-0.5 -right-0.5 animate-pulse"></span>
                    )}
                  </div>
                  <span className="mt-0.5">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </CartProvider>
  );
}
