'use client';

import { useState, useEffect } from 'react';
import {
  RotateCcw,
  Search,
  CheckCircle,
  AlertTriangle,
  ArrowRightLeft,
  Calendar,
  Receipt,
  Users,
  Shirt,
  X,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { api } from '../../../lib/api';

export default function ReturnsPage() {
  const [returns, setReturns] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isNewReturnOpen, setIsNewReturnOpen] = useState(false);
  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState('');
  const [foundSale, setFoundSale] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [returnReason, setReturnReason] = useState('SIZE_EXCHANGE');
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const [retRes, salesRes, invRes] = await Promise.all([
        api.getReturns(),
        api.getSales({ limit: 50 }),
        api.getInventory(),
      ]);

      setReturns(retRes.returns || []);
      setSalesList(salesRes.sales || []);
      setVariants(invRes.variants || []);
    } catch (err) {
      console.error('Failed to load returns data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const [retRes, salesRes, invRes] = await Promise.all([
          api.getReturns(),
          api.getSales({ limit: 50 }),
          api.getInventory(),
        ]);
        if (isMounted) {
          setReturns(retRes.returns || []);
          setSalesList(salesRes.sales || []);
          setVariants(invRes.variants || []);
        }
      } catch (err) {
        console.error('Failed to load returns data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleFindSale(e) {
    e.preventDefault();
    if (!selectedInvoiceNumber.trim()) return;
    try {
      const sale = await api.getSaleById(selectedInvoiceNumber.trim());
      setFoundSale(sale);
      setReturnItems(
        sale.items.map((item) => ({
          saleItemId: item.id,
          variantId: item.variantId,
          name: item.variant?.product?.name,
          size: item.variant?.size?.code,
          color: item.variant?.color?.name,
          unitPrice: Number(item.unitPrice),
          quantity: item.quantity,
          isReturning: false,
          returnQty: 1,
          condition: 'GOOD',
          restock: true,
          exchangeVariantId: '', // ID of variant to exchange with
        }))
      );
    } catch (err) {
      alert(`Invoice "${selectedInvoiceNumber}" was not found.`);
    }
  }

  // Calculate Exchange Financial Difference
  const returningItemsFiltered = returnItems.filter((i) => i.isReturning);
  const totalReturnCredit = returningItemsFiltered.reduce(
    (sum, i) => sum + i.unitPrice * i.returnQty,
    0
  );

  const totalExchangeDebit = returningItemsFiltered.reduce((sum, i) => {
    if (!i.exchangeVariantId) return sum;
    const exVar = variants.find((v) => v.id === i.exchangeVariantId);
    return sum + (exVar ? Number(exVar.sellingPrice) * i.returnQty : 0);
  }, 0);

  const netExchangeDifference = totalExchangeDebit - totalReturnCredit;
  // If > 0: customer owes extra to store. If < 0: boutique owes refund to customer.

  async function handleSubmitReturn() {
    if (returningItemsFiltered.length === 0) {
      alert('Please check at least one item to return or exchange.');
      return;
    }

    try {
      setSubmitting(true);
      await api.createReturn({
        saleId: foundSale.id,
        customerId: foundSale.customerId,
        returnReason,
        totalRefundAmount: netExchangeDifference < 0 ? Math.abs(netExchangeDifference) : 0,
        exchangeDifference: netExchangeDifference,
        items: returningItemsFiltered.map((i) => ({
          saleItemId: i.saleItemId,
          variantId: i.variantId,
          quantity: i.returnQty,
          unitPrice: i.unitPrice,
          conditionStatus: i.condition,
          restock: i.restock,
          exchangeVariantId: i.exchangeVariantId || undefined,
        })),
      });

      setIsNewReturnOpen(false);
      setFoundSale(null);
      setSelectedInvoiceNumber('');
      loadData();
      alert('Return / Clothing exchange completed successfully and inventory updated!');
    } catch (err) {
      alert(err.message || 'Failed to process return.');
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
            <span>Sales Returns & Clothing Exchanges</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              Audit Tracked
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Exchange sizes, alter colors, process refunds, and auto-restock returned ladies garments into MySQL.
          </p>
        </div>

        <button
          onClick={() => setIsNewReturnOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 via-rose-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-purple-500/20 transition active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Process Return / Exchange</span>
        </button>
      </div>

      {/* Returns History Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden p-4 space-y-3">
        <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
          Processed Returns & Exchanges Log
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 text-[11px] font-bold">
                <th className="py-2.5 px-3">Return #</th>
                <th className="py-2.5 px-3">Original Invoice</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Returned Garment</th>
                <th className="py-2.5 px-3">Exchange Replacement</th>
                <th className="py-2.5 px-3">Reason</th>
                <th className="py-2.5 px-3 text-right">Net Diff (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
              {returns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-30 text-purple-400" />
                    No returns processed yet.
                  </td>
                </tr>
              ) : (
                returns.map((ret) => {
                  const firstItem = ret.items?.[0];
                  return (
                    <tr key={ret.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/40">
                      <td className="py-2.5 px-3 font-mono font-extrabold text-purple-600 dark:text-purple-400">
                        {ret.returnNumber}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-zinc-700 dark:text-zinc-300">
                        {ret.sale?.invoiceNumber}
                      </td>
                      <td className="py-2.5 px-3 font-semibold">
                        {ret.customer?.name || 'Walk-in'}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-zinc-800 dark:text-zinc-200">
                          {firstItem?.variant?.product?.name}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          [{firstItem?.variant?.size?.code}] {firstItem?.variant?.color?.name}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        {firstItem?.exchangeVariant ? (
                          <div className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>
                              [{firstItem.exchangeVariant.size?.code}]{' '}
                              {firstItem.exchangeVariant.color?.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic">No exchange (Refund)</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800">
                          {ret.returnReason}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {Number(ret.exchangeDifference) !== 0 ? (
                          <span
                            className={
                              Number(ret.exchangeDifference) > 0 ? 'text-amber-600' : 'text-rose-600'
                            }
                          >
                            ₨ {Math.abs(Number(ret.exchangeDifference)).toLocaleString()}{' '}
                            {Number(ret.exchangeDifference) > 0 ? '(Client Paid)' : '(Refunded)'}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-bold">₨ 0 (Even Swap)</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PROCESS RETURN / EXCHANGE MODAL */}
      {isNewReturnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 my-auto animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-purple-600" />
                  <span>Process Garment Return & Size/Color Exchange</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Select customer invoice, choose item to return, and pick new size/color replacement.
                </p>
              </div>
              <button
                onClick={() => setIsNewReturnOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step 1: Find Sale by Invoice Number */}
            {!foundSale ? (
              <form onSubmit={handleFindSale} className="space-y-3">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                  Enter Invoice Number (e.g. INV-20261101-001):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={selectedInvoiceNumber}
                    onChange={(e) => setSelectedInvoiceNumber(e.target.value)}
                    placeholder="Type or paste Invoice Number..."
                    className="flex-1 text-xs font-mono px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
                  >
                    Find Invoice
                  </button>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-zinc-400 block mb-1">
                    Or select recent sale:
                  </span>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {salesList.slice(0, 5).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedInvoiceNumber(s.invoiceNumber);
                          setFoundSale(s);
                          setReturnItems(
                            s.items.map((item) => ({
                              saleItemId: item.id,
                              variantId: item.variantId,
                              name: item.variant?.product?.name,
                              size: item.variant?.size?.code,
                              color: item.variant?.color?.name,
                              unitPrice: Number(item.unitPrice),
                              quantity: item.quantity,
                              isReturning: false,
                              returnQty: 1,
                              condition: 'GOOD',
                              restock: true,
                              exchangeVariantId: '',
                            }))
                          );
                        }}
                        className="w-full text-left p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between text-xs"
                      >
                        <span className="font-mono font-bold text-purple-600">{s.invoiceNumber}</span>
                        <span className="text-zinc-500">{s.customer?.name || 'Walk-in'}</span>
                        <span className="font-mono font-bold">₨ {Number(s.grandTotal).toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            ) : (
              /* Step 2: Configure Return & Exchange */
              <div className="space-y-4">
                <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-purple-700 dark:text-purple-400">
                      {foundSale.invoiceNumber}
                    </span>
                    <span className="text-zinc-500 ml-2">
                      ({foundSale.customer?.name || 'Walk-in Customer'})
                    </span>
                  </div>
                  <button
                    onClick={() => setFoundSale(null)}
                    className="text-xs font-bold text-purple-600 hover:underline"
                  >
                    Change Invoice
                  </button>
                </div>

                {/* Return Reason */}
                <div>
                  <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                    Return Reason:
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                  >
                    <option value="SIZE_EXCHANGE">Size Exchange (Garment tight/loose)</option>
                    <option value="COLOR_EXCHANGE">Color Exchange (Customer preferred different tone)</option>
                    <option value="DEFECTIVE">Defective / Stitching Defect</option>
                    <option value="MIND_CHANGED">Customer Changed Mind</option>
                  </select>
                </div>

                {/* Garments on this Invoice */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                    Select Item to Return / Exchange:
                  </span>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {returnItems.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-2xl border transition space-y-2 ${
                          item.isReturning
                            ? 'border-purple-600 bg-purple-50/40 dark:bg-purple-950/20'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.isReturning}
                              onChange={(e) => {
                                const updated = [...returnItems];
                                updated[idx].isReturning = e.target.checked;
                                setReturnItems(updated);
                              }}
                              className="rounded accent-purple-600"
                            />
                            <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                              {item.name} [{item.size}] • {item.color}
                            </span>
                          </label>

                          <span className="font-mono font-bold text-xs">
                            ₨ {item.unitPrice.toLocaleString()}
                          </span>
                        </div>

                        {item.isReturning && (
                          <div className="pt-2 border-t border-purple-200 dark:border-purple-800/60 grid grid-cols-2 gap-2 text-[11px]">
                            {/* Condition */}
                            <div>
                              <span className="text-zinc-500 block mb-1">Item Condition:</span>
                              <select
                                value={item.condition}
                                onChange={(e) => {
                                  const updated = [...returnItems];
                                  updated[idx].condition = e.target.value;
                                  updated[idx].restock = e.target.value === 'GOOD';
                                  setReturnItems(updated);
                                }}
                                className="w-full px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                              >
                                <option value="GOOD">Good (Tags Attached - Restock)</option>
                                <option value="DAMAGED">Damaged / Stained (Do Not Restock)</option>
                              </select>
                            </div>

                            {/* Exchange Variant Picker */}
                            <div>
                              <span className="text-zinc-500 block mb-1">
                                Exchange For (New Size/Color):
                              </span>
                              <select
                                value={item.exchangeVariantId}
                                onChange={(e) => {
                                  const updated = [...returnItems];
                                  updated[idx].exchangeVariantId = e.target.value;
                                  setReturnItems(updated);
                                }}
                                className="w-full px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-medium"
                              >
                                <option value="">No Exchange (Straight Refund)</option>
                                {variants.map((v) => (
                                  <option key={v.id} value={v.id}>
                                    {v.product?.name} [{v.size?.code || 'Free'} - {v.color?.name}] (₨{Number(v.sellingPrice).toLocaleString()})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calculation Preview */}
                <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Return Item Credit:</span>
                    <span className="font-mono font-bold text-rose-600">
                      -₨ {totalReturnCredit.toLocaleString()}
                    </span>
                  </div>
                  {totalExchangeDebit > 0 && (
                    <div className="flex justify-between">
                      <span>New Exchange Garment Price:</span>
                      <span className="font-mono font-bold text-purple-600">
                        +₨ {totalExchangeDebit.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold pt-1 border-t border-zinc-200 dark:border-zinc-700">
                    <span>Net Difference:</span>
                    <span className="font-mono">
                      {netExchangeDifference === 0 ? (
                        <span className="text-emerald-600">₨ 0 (Even Swap)</span>
                      ) : netExchangeDifference > 0 ? (
                        <span className="text-amber-600">
                          Customer Pays: ₨ {netExchangeDifference.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-rose-600">
                          Boutique Refunds: ₨ {Math.abs(netExchangeDifference).toLocaleString()}
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Final Buttons */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewReturnOpen(false)}
                    className="py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={submitting || returningItemsFiltered.length === 0}
                    onClick={handleSubmitReturn}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-md shadow-purple-500/20 active:scale-95 disabled:opacity-40"
                  >
                    {submitting ? 'Updating Database...' : 'Finalize Return / Exchange'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
