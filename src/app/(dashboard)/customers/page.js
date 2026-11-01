'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  UserPlus,
  Phone,
  Mail,
  Award,
  X,
  CreditCard,
  ShoppingBag,
  RotateCcw,
  Sparkles,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../../lib/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // New Customer Form State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');

  async function loadCustomers() {
    try {
      setLoading(true);
      const res = await api.getCustomers();
      setCustomers(res.customers || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const res = await api.getCustomers();
        if (isMounted) {
          setCustomers(res.customers || []);
        }
      } catch (err) {
        console.error('Failed to load customers:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleRegister(e) {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setSubmitting(true);
      await api.createCustomer({
        name: newName.trim(),
        phone: newPhone.trim() || undefined,
        email: newEmail.trim() || undefined,
        address: newAddress.trim() || undefined,
      });

      setIsAddModalOpen(false);
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setNewAddress('');
      loadCustomers();
    } catch (err) {
      alert(err.message || 'Failed to add customer.');
    } finally {
      setSubmitting(false);
    }
  }

  async function viewCustomerDetails(id) {
    try {
      const details = await api.getCustomerById(id);
      setSelectedCustomer(details);
    } catch (err) {
      alert('Failed to load customer profile.');
    }
  }

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Customer Management & Loyalty CRM</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold">
              {customers.length} Clients
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Maintain boutique client profiles, repeat order loyalty points, and outstanding credit balances.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 via-rose-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 transition self-start sm:self-auto active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search customer by name, mobile #, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
        />
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/80 dark:bg-zinc-850/60 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 font-bold text-[11px]">
              <tr>
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Mobile Number</th>
                <th className="py-3 px-4">Loyalty Points</th>
                <th className="py-3 px-4">Total Spending</th>
                <th className="py-3 px-4">Credit Balance Due</th>
                <th className="py-3 px-4 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    No customers found matching search query.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30 transition group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-rose-500 text-white font-extrabold flex items-center justify-center text-xs">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-zinc-100">{c.name}</p>
                          <p className="text-[10px] text-zinc-400">{c.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-medium text-zinc-600 dark:text-zinc-300">
                      {c.phone || '—'}
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-bold font-mono text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-lg border border-purple-500/20">
                        <Award className="w-3.5 h-3.5" />
                        <span>{c.loyaltyPoints} pts</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 font-extrabold font-mono text-zinc-900 dark:text-zinc-100">
                      ₨ {Number(c.totalSpent).toLocaleString()}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      {Number(c.balance) > 0 ? (
                        <span className="text-amber-600 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                          ₨ {Number(c.balance).toLocaleString()} Due
                        </span>
                      ) : (
                        <span className="text-emerald-500 font-bold">Clear (₨ 0)</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => viewCustomerDetails(c.id)}
                        className="px-3 py-1 rounded-xl text-xs font-bold text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition"
                      >
                        History →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CUSTOMER PROFILE & PURCHASE HISTORY MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 my-auto animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-extrabold flex items-center justify-center text-sm">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                    {selectedCustomer.name}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {selectedCustomer.phone} • {selectedCustomer.address || 'Lahore'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Spending & Balance Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-center">
                <span className="text-[10px] text-zinc-400 font-semibold block">Total Orders</span>
                <span className="text-lg font-black font-mono text-zinc-900 dark:text-zinc-100">
                  {selectedCustomer.sales?.length || 0}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-center">
                <span className="text-[10px] text-zinc-400 font-semibold block">Loyalty Points</span>
                <span className="text-lg font-black font-mono text-purple-600">
                  {selectedCustomer.loyaltyPoints}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-center">
                <span className="text-[10px] text-zinc-400 font-semibold block">Credit Balance</span>
                <span
                  className={`text-lg font-black font-mono ${
                    Number(selectedCustomer.balance) > 0 ? 'text-amber-600' : 'text-emerald-500'
                  }`}
                >
                  ₨ {Number(selectedCustomer.balance).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Past Invoices */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                Recent Purchase Invoices:
              </span>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(!selectedCustomer.sales || selectedCustomer.sales.length === 0) ? (
                  <p className="text-xs text-zinc-400 py-3 text-center">No purchases yet.</p>
                ) : (
                  selectedCustomer.sales.map((s) => (
                    <div
                      key={s.id}
                      className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-purple-600">{s.invoiceNumber}</span>
                        <span className="text-zinc-400 text-[10px] ml-2 font-mono">
                          {new Date(s.saleDate).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        ₨ {Number(s.grandTotal).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD CUSTOMER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleRegister}
            className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 space-y-3.5 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-purple-600" />
                <span>Register Boutique Client</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                Client Full Name *
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Mrs. Mariam Tariq"
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                Phone Number (WhatsApp)
              </label>
              <input
                type="text"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+92 321 4455667"
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-500 block mb-1">Email Address</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="client@gmail.com"
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-500 block mb-1">Address / Area</label>
              <input
                type="text"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="Gulberg III, Lahore"
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition"
              >
                {submitting ? 'Registering...' : 'Save Client'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
