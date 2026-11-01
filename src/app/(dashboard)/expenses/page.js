'use client';

import { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  Calendar,
  Filter,
  DollarSign,
  TrendingDown,
  Building,
  Zap,
  Users,
  Car,
  Megaphone,
  Box,
  Coffee,
  X,
  CreditCard,
  Banknote,
} from 'lucide-react';
import { api } from '../../../lib/api';

const CATEGORIES = [
  { id: 'ELECTRICITY', label: 'Electricity & Generator Diesel', icon: Zap },
  { id: 'RENT', label: 'Store Showroom Rent', icon: Building },
  { id: 'SALARY', label: 'Staff Salaries & Commissions', icon: Users },
  { id: 'PACKAGING', label: 'Bags & Ribbons Packaging', icon: Box },
  { id: 'MARKETING', label: 'Social Media & Influencer Ads', icon: Megaphone },
  { id: 'TRANSPORT', label: 'Stock Courier & Logistics', icon: Car },
  { id: 'REFRESHMENT', label: 'Tea, Coffee & Refreshments', icon: Coffee },
  { id: 'OTHER', label: 'Miscellaneous Expenses', icon: Receipt },
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('ELECTRICITY');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadExpenses() {
    try {
      setLoading(true);
      const res = await api.getExpenses({
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
      });
      setExpenses(res.expenses || []);
      setTotalAmount(res.totalAmount || 0);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExpenses();
  }, [selectedCategory]);

  async function handleCreateExpense(e) {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    try {
      setSubmitting(true);
      await api.createExpense({
        category,
        title: title.trim(),
        amount: parseFloat(amount),
        paymentMethod,
        notes: notes || undefined,
      });

      setIsModalOpen(false);
      setTitle('');
      setAmount('');
      setNotes('');
      loadExpenses();
    } catch (err) {
      alert(err.message || 'Failed to record expense.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.deleteExpense(id);
      loadExpenses();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Daily Store Expenses & Petty Cash</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
              Accounts Ledger
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Track generator fuel, packaging materials, salaries, and operational costs. Integrated with Cash Register shift reconciliation.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 via-rose-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-purple-500/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 font-semibold">Total Expenses Recorded</span>
            <p className="text-2xl font-black text-rose-600 font-mono mt-1">
              ₨ {totalAmount.toLocaleString()}
            </p>
          </div>
          <span className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <Receipt className="w-5 h-5" />
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 font-semibold">Active Operational Costs</span>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 font-mono mt-1">
              {expenses.length} Entries
            </p>
          </div>
          <span className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <TrendingDown className="w-5 h-5" />
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 font-semibold">Accounting Period</span>
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mt-1">
              Current Financial Month
            </p>
          </div>
          <span className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 border border-purple-500/20">
            <Calendar className="w-5 h-5" />
          </span>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            selectedCategory === 'ALL'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold'
              : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
          }`}
        >
          All Categories
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === c.id
                ? 'bg-gradient-to-r from-purple-600 to-rose-600 text-white font-bold'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-zinc-50/80 dark:bg-zinc-850/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-[11px] font-bold">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Expense Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Amount (PKR)</th>
                <th className="py-3 px-4">Recorded By</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    No expenses logged for this filter.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30">
                    <td className="py-3 px-4 font-mono text-zinc-500 text-[11px]">
                      {new Date(exp.expenseDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-zinc-800 dark:text-zinc-200">
                      {exp.title}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-zinc-600 dark:text-zinc-400 text-[11px]">
                      {exp.paymentMethod}
                    </td>
                    <td className="py-3 px-4 font-extrabold font-mono text-rose-600 dark:text-rose-400">
                      ₨ {Number(exp.amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-zinc-400 text-[11px]">
                      {exp.user?.name || 'Administrator'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1 text-zinc-400 hover:text-rose-500"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD EXPENSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreateExpense}
            className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 space-y-3.5 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-purple-600" />
                <span>Record Store Expense</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                Expense Title / Description *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 50 Liters Generator Diesel"
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-medium"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                Amount (PKR ₨) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 8500"
                className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                Payment Method:
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-medium"
              >
                <option value="CASH">Cash Drawer (Petty Cash)</option>
                <option value="BANK_TRANSFER">Bank Online Transfer</option>
                <option value="JAZZCASH">JazzCash / Easypaisa</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition"
              >
                {submitting ? 'Saving...' : 'Record Expense'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
