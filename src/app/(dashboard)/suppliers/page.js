'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Phone,
  Mail,
  Receipt,
  DollarSign,
  CreditCard,
  X,
  Search,
  CheckCircle,
  Truck,
} from 'lucide-react';
import { api } from '../../../lib/api';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [taxNumber, setTaxNumber] = useState('');

  // Pay Form State
  const [payAmount, setPayAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [payNotes, setPayNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadSuppliers() {
    try {
      setLoading(true);
      const res = await api.getSuppliers();
      setSuppliers(res.suppliers || []);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const res = await api.getSuppliers();
        if (isMounted) {
          setSuppliers(res.suppliers || []);
        }
      } catch (err) {
        console.error('Failed to load suppliers:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleCreateSupplier(e) {
    e.preventDefault();
    if (!name.trim() || !companyName.trim()) return;

    try {
      setSubmitting(true);
      await api.createSupplier({
        name: name.trim(),
        companyName: companyName.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        taxNumber: taxNumber.trim() || undefined,
      });

      setIsAddModalOpen(false);
      setName('');
      setCompanyName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setTaxNumber('');
      loadSuppliers();
    } catch (err) {
      alert(err.message || 'Failed to add supplier.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePaySupplier(e) {
    e.preventDefault();
    if (!selectedSupplier || !payAmount) return;

    try {
      setSubmitting(true);
      await api.paySupplier(selectedSupplier.id, {
        amount: parseFloat(payAmount),
        paymentMethod,
        notes: payNotes || undefined,
      });

      setIsPayModalOpen(false);
      setPayAmount('');
      setPayNotes('');
      setSelectedSupplier(null);
      loadSuppliers();
      alert('Supplier balance payment recorded successfully.');
    } catch (err) {
      alert(err.message || 'Failed to record supplier payment.');
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = suppliers.filter(
    (s) =>
      s.companyName.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone && s.phone.includes(search))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Supplier & Mill Vendor Accounts</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold">
              {suppliers.length} Vendors
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Track textile mills, wholesale distributors, fabric suppliers, and outstanding payables.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 via-rose-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 transition active:scale-95 self-start sm:self-auto"
        >
          <Building2 className="w-4 h-4" />
          <span>Add New Supplier</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search supplier, textile mill, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
        />
      </div>

      {/* Suppliers Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/80 dark:bg-zinc-850/60 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 font-bold text-[11px]">
              <tr>
                <th className="py-3 px-4">Company / Mill</th>
                <th className="py-3 px-4">Representative</th>
                <th className="py-3 px-4">Phone / WhatsApp</th>
                <th className="py-3 px-4">Total Purchases</th>
                <th className="py-3 px-4">Payable Balance (PKR)</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    No suppliers found.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30">
                    <td className="py-3 px-4">
                      <p className="font-extrabold text-zinc-900 dark:text-zinc-100">{s.companyName}</p>
                      <p className="text-[10px] text-zinc-400">{s.address || 'Karachi SITE'}</p>
                    </td>

                    <td className="py-3 px-4 font-bold text-zinc-700 dark:text-zinc-300">
                      {s.name}
                    </td>

                    <td className="py-3 px-4 font-mono text-zinc-600 dark:text-zinc-300">
                      {s.phone || '—'}
                    </td>

                    <td className="py-3 px-4 font-bold font-mono text-purple-600 dark:text-purple-400">
                      {s._count?.purchases || 0} Orders
                    </td>

                    <td className="py-3 px-4 font-extrabold font-mono text-zinc-900 dark:text-zinc-100">
                      {Number(s.balance) > 0 ? (
                        <span className="text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">
                          ₨ {Number(s.balance).toLocaleString()} Due
                        </span>
                      ) : (
                        <span className="text-emerald-500">₨ 0 (Settled)</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedSupplier(s);
                          setPayAmount(s.balance.toString());
                          setIsPayModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 font-bold hover:bg-purple-100 transition border border-purple-500/20"
                      >
                        Pay Balance
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD SUPPLIER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreateSupplier}
            className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 space-y-3.5 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-600" />
                <span>Register Textile Supplier</span>
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
                Company / Mill Name *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Al-Karam Studio Wholesale"
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                Contact Person Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Haji Rafiq Weavers"
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 21 111 255 272"
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                Factory / Warehouse Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Landhi Industrial Area, Karachi"
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
                {submitting ? 'Saving...' : 'Register Supplier'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PAY SUPPLIER BALANCE MODAL */}
      {isPayModalOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handlePaySupplier}
            className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 space-y-3.5 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                  Pay Supplier Balance
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">{selectedSupplier.companyName}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex justify-between items-center text-xs">
              <span className="text-amber-800 dark:text-amber-400 font-bold">Outstanding Payable:</span>
              <span className="font-mono font-black text-sm text-amber-900 dark:text-amber-200">
                ₨ {Number(selectedSupplier.balance).toLocaleString()}
              </span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                Payment Amount (PKR ₨) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full text-base font-mono font-bold px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                Payment Channel:
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-medium"
              >
                <option value="BANK_TRANSFER">HBL / Meezan Bank Transfer</option>
                <option value="CHEQUE">Bank Cheque</option>
                <option value="CASH">Cash Payment</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                Cheque / Transaction Reference #
              </label>
              <input
                type="text"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="e.g. TXN-998811"
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition"
              >
                {submitting ? 'Recording...' : 'Confirm Supplier Payment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
