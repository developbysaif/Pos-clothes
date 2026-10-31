'use client';

import { useState } from 'react';
import { Search, Plus, UserPlus, Phone, Mail, Award, X } from 'lucide-react';
import { INITIAL_CUSTOMERS } from '../../../lib/data';

export default function CustomersPage() {
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  function handleRegister(e) {
    e.preventDefault();
    if (!newCustomer.name) return;

    setCustomers([
      {
        id: `cust-${Date.now()}`,
        name: newCustomer.name,
        phone: newCustomer.phone || '+92 300 0000000',
        email: newCustomer.email || 'customer@gmail.com',
        visits: 1,
      },
      ...customers,
    ]);

    setIsAddModalOpen(false);
    setNewCustomer({ name: '', phone: '', email: '' });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Customer Directory & Loyalty</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 font-bold">
              {customers.length} Clients
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Maintain boutique client profiles, repeat order loyalty, and phone numbers.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold shadow-md shadow-pink-500/20 transition self-start sm:self-auto active:scale-95"
        >
          <UserPlus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by customer name, phone, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
      </div>

      {/* Customers Table / Responsive Container */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[550px]">
            <thead className="bg-zinc-50/80 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">Customer Profile</th>
                <th className="py-3.5 px-4 font-bold">Phone Number</th>
                <th className="py-3.5 px-4 font-bold">Email Address</th>
                <th className="py-3.5 px-4 font-bold text-center">Store Visits</th>
                <th className="py-3.5 px-4 font-bold text-right">Loyalty Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition">
                  <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-pink-500/20 to-indigo-500/20 text-pink-600 dark:text-pink-400 font-extrabold flex items-center justify-center text-[10px]">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{c.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300 font-mono">
                    {c.phone}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-500">{c.email}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-zinc-700 dark:text-zinc-300">
                    {c.visits} orders
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        c.visits > 10
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}
                    >
                      <Award className="w-3 h-3" />
                      {c.visits > 10 ? 'VIP Gold' : 'Regular'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 my-auto animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mb-1">
              Register New Client
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Add client for quick selection during POS checkout.
            </p>

            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ayesha Khan"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+92 301 2345678"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="ayesha@example.com"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 text-white font-bold transition shadow-md shadow-pink-500/20"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
