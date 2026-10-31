'use client';

import { useState } from 'react';
import { Search, Plus, UserPlus, Phone, Mail, Award } from 'lucide-react';
import { INITIAL_CUSTOMERS } from '../../../lib/data';

export default function CustomersPage() {
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [search, setSearch] = useState('');

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Customer Directory & Loyalty
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Maintain customer purchase records, contact info, and repeat boutique visit history.
          </p>
        </div>
        <button
          onClick={() => {
            const name = prompt('Customer Name:');
            const phone = prompt('Customer Phone:');
            if (name) {
              setCustomers([
                ...customers,
                { id: `cust-${Date.now()}`, name, phone: phone || 'N/A', email: 'N/A', visits: 1 },
              ]);
            }
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" /> Register Customer
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by name, phone or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="py-3 px-4 font-semibold">Customer Name</th>
              <th className="py-3 px-4 font-semibold">Contact Phone</th>
              <th className="py-3 px-4 font-semibold">Email</th>
              <th className="py-3 px-4 font-semibold text-center">Store Visits</th>
              <th className="py-3 px-4 font-semibold text-right">Loyalty Tier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition">
                <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                  {c.name}
                </td>
                <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 font-mono">
                  {c.phone}
                </td>
                <td className="py-3 px-4 text-zinc-500">{c.email}</td>
                <td className="py-3 px-4 text-center font-bold text-zinc-700 dark:text-zinc-300">
                  {c.visits} orders
                </td>
                <td className="py-3 px-4 text-right">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      c.visits > 10
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    <Award className="w-3 h-3" />
                    {c.visits > 10 ? 'VIP Gold' : 'Standard'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
