'use client';

import { useState, useEffect } from 'react';
import {
  Boxes,
  AlertTriangle,
  Package,
  TrendingDown,
  ArrowRightLeft,
  Search,
  Plus,
  Minus,
  RotateCcw,
  RefreshCw,
  Building2,
  CheckCircle,
  Clock,
  Shirt,
  X,
} from 'lucide-react';
import { api } from '../../../lib/api';

export default function InventoryPage() {
  const [variants, setVariants] = useState([]);
  const [summary, setSummary] = useState(null);
  const [movements, setMovements] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'MOVEMENTS' | 'TRANSFERS'
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Stock Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [targetVariant, setTargetVariant] = useState(null);
  const [adjustType, setAdjustType] = useState('ADD'); // 'ADD' | 'SUBTRACT' | 'SET'
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('COUNT_RECONCILIATION');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const [invRes, movRes, trfRes] = await Promise.all([
        api.getInventory(),
        api.getStockMovements({ limit: 50 }),
        api.getTransfers(),
      ]);

      setVariants(invRes.variants || []);
      setSummary(invRes.summary || null);
      setMovements(movRes.movements || []);
      setTransfers(trfRes.transfers || []);
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAdjustSubmit(e) {
    e.preventDefault();
    if (!targetVariant || !adjustQty) return;
    try {
      setSubmitting(true);
      await api.adjustStock({
        variantId: targetVariant.id,
        adjustmentType: adjustType,
        quantity: parseInt(adjustQty),
        reason: adjustReason,
        notes: adjustNotes || undefined,
      });

      setAdjustModalOpen(false);
      setAdjustQty('');
      setAdjustNotes('');
      setTargetVariant(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to adjust stock');
    } finally {
      setSubmitting(false);
    }
  }

  const displayedVariants = variants.filter((v) => {
    const q = search.toLowerCase();
    const matchesSearch =
      v.product.name.toLowerCase().includes(q) ||
      v.sku.toLowerCase().includes(q) ||
      v.barcode.includes(q) ||
      (v.color?.name && v.color.name.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (activeTab === 'LOW_STOCK') {
      return v.stockQuantity > 0 && v.stockQuantity <= v.minStockAlert;
    }
    if (activeTab === 'OUT_OF_STOCK') {
      return v.stockQuantity <= 0;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Inventory Management & Stock Central</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Auto Sync
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Track garments across branches, log stock adjustments, reconcile counts, and audit movements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Total Stock Units</span>
            <Boxes className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 font-mono">
            {(summary?.totalQuantity || 0).toLocaleString()}
          </p>
          <span className="text-[11px] text-zinc-400">
            {summary?.totalItems || 0} unique variant SKUs
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Valuation at Retail</span>
            <span className="text-[10px] font-mono font-bold text-rose-500">PKR</span>
          </div>
          <p className="text-2xl font-black text-purple-700 dark:text-purple-400 font-mono">
            ₨ {(summary?.totalValuationRetail || 0).toLocaleString()}
          </p>
          <span className="text-[11px] text-zinc-400">Inventory selling worth</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Low-Stock Watchlist</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 font-mono">
            {summary?.lowStockCount || 0}
          </p>
          <span className="text-[11px] text-zinc-400">Below threshold (10 left)</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Out of Stock</span>
            <Package className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-black text-red-600 font-mono">
            {summary?.outOfStockCount || 0}
          </p>
          <span className="text-[11px] text-zinc-400">Zero inventory remaining</span>
        </div>
      </div>

      {/* Segmented Filter Tabs */}
      <div className="flex rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-1 gap-1 max-w-xl">
        {[
          { id: 'ALL', label: `All Items (${variants.length})` },
          { id: 'LOW_STOCK', label: `Low Stock (${summary?.lowStockCount || 0})` },
          { id: 'OUT_OF_STOCK', label: `Out of Stock (${summary?.outOfStockCount || 0})` },
          { id: 'MOVEMENTS', label: 'Stock Movement Audit' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-xl transition ${
              activeTab === tab.id
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area based on Tab */}
      {activeTab !== 'MOVEMENTS' ? (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search inventory garments, SKU, barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>
            <span className="text-xs text-zinc-400 font-mono">
              Showing {displayedVariants.length} items
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 text-[11px] font-bold">
                  <th className="py-2.5 px-3">Garment Item</th>
                  <th className="py-2.5 px-3">Size & Color</th>
                  <th className="py-2.5 px-3">SKU & Barcode</th>
                  <th className="py-2.5 px-3">Cost Price</th>
                  <th className="py-2.5 px-3">Retail Price</th>
                  <th className="py-2.5 px-3">Current Stock</th>
                  <th className="py-2.5 px-3 text-right">Quick Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                {displayedVariants.map((v) => {
                  const isLow = v.stockQuantity > 0 && v.stockQuantity <= v.minStockAlert;
                  const isOut = v.stockQuantity <= 0;
                  return (
                    <tr key={v.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/40">
                      <td className="py-2.5 px-3 font-bold text-zinc-800 dark:text-zinc-200">
                        {v.product?.name}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
                          {v.size?.code || 'Free'}
                        </span>{' '}
                        • {v.color?.name || 'Assorted'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        <div>{v.sku}</div>
                        <div className="text-zinc-400 text-[10px]">{v.barcode}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-zinc-500">
                        ₨ {Number(v.purchasePrice).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-extrabold text-purple-700 dark:text-purple-400">
                        ₨ {Number(v.sellingPrice).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                            isOut
                              ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                              : isLow
                              ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-600'
                          }`}
                        >
                          {v.stockQuantity} in stock
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            setTargetVariant(v);
                            setAdjustQty(v.stockQuantity.toString());
                            setAdjustModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-purple-600 text-purple-600 transition"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* STOCK MOVEMENTS AUDIT LEDGER */
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
              Audit Trail of Stock Movements
            </h3>
            <span className="text-xs text-zinc-400 font-mono">
              {movements.length} logged events
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 text-[11px] font-bold">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Garment Item</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3">Notes & Reason</th>
                  <th className="py-2.5 px-3">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                {movements.map((m) => {
                  const isPos = m.quantity > 0;
                  return (
                    <tr key={m.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/40">
                      <td className="py-2.5 px-3 font-mono text-zinc-500 text-[11px]">
                        {new Date(m.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-zinc-800 dark:text-zinc-200">
                        {m.variant?.product?.name || 'Garment'}{' '}
                        <span className="font-mono text-zinc-400 text-[10px]">
                          [{m.variant?.size?.code || ''}]
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {m.movementType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        <span className={isPos ? 'text-emerald-500' : 'text-rose-500'}>
                          {isPos ? `+${m.quantity}` : m.quantity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-500 text-[11px]">{m.notes || '—'}</td>
                      <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                        {m.user?.name || 'POS Cashier'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STOCK ADJUSTMENT MODAL */}
      {adjustModalOpen && targetVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <form
            onSubmit={handleAdjustSubmit}
            className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 space-y-3.5 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                  Stock Adjustment
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {targetVariant.product?.name} [{targetVariant.size?.code}]
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAdjustModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                Adjustment Action:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'ADD', label: '+ Stock In' },
                  { id: 'SUBTRACT', label: '- Stock Out' },
                  { id: 'SET', label: '= Set Count' },
                ].map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => setAdjustType(act.id)}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition ${
                      adjustType === act.id
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                Quantity Units *
              </label>
              <input
                type="number"
                required
                min="0"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                placeholder="e.g. 10"
                className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                Reason Category:
              </label>
              <select
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-medium"
              >
                <option value="COUNT_RECONCILIATION">Physical Count Reconciliation</option>
                <option value="DAMAGE">Damaged / Stained Fabric</option>
                <option value="LOST">Lost / Missing</option>
                <option value="FOUND">Found Stock</option>
                <option value="SAMPLE">Display / Sample Given</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                Audit Notes:
              </label>
              <input
                type="text"
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                placeholder="e.g. Annual audit count correction"
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdjustModalOpen(false)}
                className="py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition"
              >
                {submitting ? 'Applying...' : 'Apply Adjustment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
