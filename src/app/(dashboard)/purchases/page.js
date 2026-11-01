'use client';

import { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Package,
  Boxes,
  X,
  CreditCard,
  Banknote,
  Sparkles,
} from 'lucide-react';
import { api } from '../../../lib/api';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);

  // New PO Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [poItems, setPoItems] = useState([
    { variantId: '', quantity: 10, unitCost: 3500 },
  ]);
  const [paidAmount, setPaidAmount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const [purRes, supRes, invRes] = await Promise.all([
        api.getPurchases(),
        api.getSuppliers(),
        api.getInventory(),
      ]);
      setPurchases(purRes.purchases || []);
      setSuppliers(supRes.suppliers || []);
      setVariants(invRes.variants || []);

      if (supRes.suppliers?.length > 0 && !selectedSupplierId) {
        setSelectedSupplierId(supRes.suppliers[0].id);
      }
    } catch (err) {
      console.error('Failed to load purchases:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleAddItemRow() {
    setPoItems([
      ...poItems,
      {
        variantId: variants[0]?.id || '',
        quantity: 10,
        unitCost: variants[0]?.purchasePrice || 3500,
      },
    ]);
  }

  function handleRemoveItemRow(idx) {
    setPoItems(poItems.filter((_, i) => i !== idx));
  }

  function handleItemChange(idx, field, value) {
    const updated = [...poItems];
    updated[idx][field] = value;
    if (field === 'variantId') {
      const v = variants.find((item) => item.id === value);
      if (v) updated[idx].unitCost = Number(v.purchasePrice);
    }
    setPoItems(updated);
  }

  const computedTotal = poItems.reduce(
    (sum, item) => sum + (parseFloat(item.unitCost) || 0) * (parseInt(item.quantity) || 0),
    0
  );

  async function handleCreatePO(e) {
    e.preventDefault();
    if (!selectedSupplierId || poItems.length === 0) {
      alert('Please select a supplier and add items.');
      return;
    }

    try {
      setSubmitting(true);
      await api.createPurchase({
        supplierId: selectedSupplierId,
        items: poItems.map((item) => ({
          variantId: item.variantId || variants[0]?.id,
          quantity: parseInt(item.quantity) || 1,
          unitCost: parseFloat(item.unitCost) || 0,
        })),
        paidAmount: parseFloat(paidAmount) || 0,
        paymentMethod,
        notes: notes || undefined,
      });

      setIsCreateOpen(false);
      setPaidAmount('0');
      setNotes('');
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to create purchase.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Purchase Management & Receiving</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              Auto Stock-In
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Order wholesale bolts, unstitched collections, and pret stock. Automatically increments inventory upon receipt.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 via-rose-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-purple-500/20 transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Order</span>
        </button>
      </div>

      {/* Purchases List Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-zinc-50/80 dark:bg-zinc-850/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-[11px] font-bold">
                <th className="py-3 px-4">PO Invoice #</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Total Cost</th>
                <th className="py-3 px-4">Paid</th>
                <th className="py-3 px-4">Balance Due</th>
                <th className="py-3 px-4">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    <Truck className="w-8 h-8 mx-auto mb-2 opacity-30 text-purple-400" />
                    No purchases logged yet. Click &ldquo;New Purchase Order&rdquo; to receive stock.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30">
                    <td className="py-3 px-4 font-mono font-extrabold text-purple-600 dark:text-purple-400">
                      {p.invoiceNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-zinc-800 dark:text-zinc-200">
                        {p.supplier?.companyName || p.supplier?.name}
                      </p>
                      <p className="text-[10px] text-zinc-400">{p.supplier?.phone}</p>
                    </td>
                    <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">
                      {new Date(p.purchaseDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-bold font-mono text-zinc-900 dark:text-zinc-100">
                      ₨ {Number(p.netAmount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-600 font-bold">
                      ₨ {Number(p.paidAmount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-600">
                      ₨ {Number(p.balanceAmount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          p.paymentStatus === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : p.paymentStatus === 'PARTIAL'
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-red-500/10 text-red-600'
                        }`}
                      >
                        {p.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE PO MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 my-auto animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-purple-600" />
                  <span>Receive Stock & Create Purchase Order</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Stock will be automatically incremented in MySQL inventory ledger.
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Select Supplier / Mill *
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-medium"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.companyName || s.name} • Balance: ₨ {Number(s.balance).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Garment Variants to Receive:
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-bold text-purple-600 hover:underline"
                  >
                    + Add Line Item
                  </button>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {poItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 flex items-center gap-2"
                    >
                      <select
                        value={item.variantId}
                        onChange={(e) => handleItemChange(idx, 'variantId', e.target.value)}
                        className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      >
                        <option value="">Select Garment Variant...</option>
                        {variants.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.product?.name} [{v.size?.code || 'Free'} - {v.color?.name || 'Assorted'}]
                          </option>
                        ))}
                      </select>

                      <div className="w-20">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full text-xs px-2 py-1.5 font-mono text-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          placeholder="Cost (₨)"
                          value={item.unitCost}
                          onChange={(e) => handleItemChange(idx, 'unitCost', e.target.value)}
                          className="w-full text-xs px-2 py-1.5 font-mono text-right rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="p-1 text-zinc-400 hover:text-rose-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Initial Payment */}
              <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                    Total Order Cost
                  </span>
                  <p className="text-xl font-black text-purple-900 dark:text-purple-200 font-mono">
                    ₨ {computedTotal.toLocaleString()}
                  </p>
                </div>

                <div className="w-48 text-right space-y-1">
                  <label className="text-[10px] text-zinc-500 font-semibold block">
                    Initial Payment (PKR ₨):
                  </label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full text-xs font-mono font-bold px-2.5 py-1 text-right rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-md shadow-purple-500/20 active:scale-95"
                >
                  {submitting ? 'Recording & Incrementing Stock...' : 'Receive Stock & Save PO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
