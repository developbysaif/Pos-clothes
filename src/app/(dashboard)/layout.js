'use client';

import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { CartProvider } from '../../context/CartContext';

export default function DashboardLayout({ children }) {
  return (
    <CartProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </CartProvider>
  );
}
