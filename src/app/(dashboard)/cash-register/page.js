'use client';

import { useState, useEffect } from 'react';
import {
  Wallet,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Building2,
  RefreshCw,
  X,
  CreditCard,
  Banknote,
  Receipt,
} from 'lucide-react';
import { api } from '../../../lib/api';

export default function CashRegisterPage() {
  const [shiftData, setShiftData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Open Shift Form
  const [openingBalance, setOpeningBalance] = useState('15000');
  const [openNotes, setOpenNotes] = useState('');

  // Close Shift Form
  const [countedCash, setCountedCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const [curRes, histRes] = await Promise.all([
        api.getCurrentShift(),
        api.getShiftHistory(),
      ]);
      setShiftData(curRes);
      setHistory(histRes.shifts || []);
      if (curRes.isOpen && curRes.shift) {
        setCountedCash(curRes.shift.expectedCash?.toString() || '');
      }
    } catch (err) {
      console.error('Failed to load cash register shifts:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const [curRes, histRes] = await Promise.all([
          api.getCurrentShift(),
          api.getShiftHistory(),
        ]);
        if (isMounted) {
          setShiftData(curRes);
          setHistory(histRes.shifts || []);
          if (curRes.isOpen && curRes.shift) {
            setCountedCash(curRes.shift.expectedCash?.toString() || '');
          }
        }
      } catch (err) {
        console.error('Failed to load cash register shifts:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleOpenShift(e) {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.openShift({
        openingBalance: parseFloat(openingBalance) || 0,
        notes: openNotes || undefined,
      });
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to open shift');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCloseShift(e) {
    e.preventDefault();
    if (!countedCash) return;
    try {
      setSubmitting(true);
      const res = await api.closeShift({
        closingBalance: parseFloat(countedCash),
        notes: closeNotes || undefined,
      });
      setIsCloseModalOpen(false);
      alert(
        `Shift closed successfully!\nExpected Cash: ₨ ${res.reconciliation.expectedClosing.toLocaleString()}\nCounted Cash: ₨ ${res.reconciliation.actualClosing.toLocaleString()}\nDifference: ₨ ${res.reconciliation.difference.toLocaleString()} (${
          res.reconciliation.difference === 0 ? 'Balanced' : res.reconciliation.difference > 0 ? 'Over' : 'Short'
        })`
      );
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to close shift');
    } finally {
      setSubmitting(false);
    }
  }

  const activeShift = shiftData?.shift;
  const expectedCash = activeShift?.expectedCash || 0;
  const difference = (parseFloat(countedCash) || 0) - expectedCash;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Cash Register & Shift Reconciliation</span>
            <span
              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                shiftData?.isOpen
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                  : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
              }`}
            >
              {shiftData?.isOpen ? 'Shift Active (Open)' : 'No Shift Active'}
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Reconcile morning float, cash sales, petty expenses, and drawer reconciliation before handover.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Shifts</span>
        </button>
      </div>

      {/* ACTIVE SHIFT STATUS OR OPEN SHIFT WIDGET */}
      {shiftData?.isOpen ? (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                  Active Cashier Drawer #01
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Opened at: {new Date(activeShift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Cashier: {activeShift.user?.name}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCloseModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 transition active:scale-95"
            >
              Close Shift & Reconcile
            </button>
          </div>

          {/* Shift Financial Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-400 font-semibold">Opening Float</span>
              <p className="text-xl font-black font-mono text-zinc-900 dark:text-zinc-100 mt-1">
                ₨ {Number(activeShift.openingBalance).toLocaleString()}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-400 font-semibold">POS Cash Sales</span>
              <p className="text-xl font-black font-mono text-emerald-600 mt-1">
                ₨ {Number(activeShift.cashSales).toLocaleString()}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-400 font-semibold">Card & Digital Sales</span>
              <p className="text-xl font-black font-mono text-purple-600 mt-1">
                ₨ {Number(activeShift.cardSales + activeShift.otherSales).toLocaleString()}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
              <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">
                Expected Cash in Drawer
              </span>
              <p className="text-xl font-black font-mono text-purple-950 dark:text-purple-100 mt-1">
                ₨ {expectedCash.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* OPEN NEW SHIFT FORM */
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 max-w-lg space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                Start Cashier Shift
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Enter initial float to start processing POS orders and sales.
              </p>
            </div>
          </div>

          <form onSubmit={handleOpenShift} className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Opening Float Cash (PKR ₨) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="15000"
                className="w-full text-base font-mono font-bold px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Shift Notes (Optional)
              </label>
              <input
                type="text"
                value={openNotes}
                onChange={(e) => setOpenNotes(e.target.value)}
                placeholder="e.g. Morning Shift - Counter #01"
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-600/20 transition active:scale-98"
            >
              {submitting ? 'Opening Shift...' : 'Open Cash Drawer & Start POS'}
            </button>
          </form>
        </div>
      )}

      {/* Shift History Log */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 space-y-3">
        <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
          Previous Shift Reconciliations Log
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 text-[11px] font-bold">
                <th className="py-2.5 px-3">Date & Shift</th>
                <th className="py-2.5 px-3">Cashier</th>
                <th className="py-2.5 px-3">Opening Float</th>
                <th className="py-2.5 px-3">Cash Sales</th>
                <th className="py-2.5 px-3">Expected Cash</th>
                <th className="py-2.5 px-3">Counted Closing</th>
                <th className="py-2.5 px-3 text-right">Difference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
              {history.map((sh) => (
                <tr key={sh.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/40">
                  <td className="py-2.5 px-3 font-mono text-[11px]">
                    <div>{new Date(sh.openedAt).toLocaleDateString()}</div>
                    <div className="text-zinc-400 text-[10px]">
                      {new Date(sh.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                      {sh.closedAt && `- ${new Date(sh.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-zinc-800 dark:text-zinc-200">
                    {sh.user?.name}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-zinc-600 dark:text-zinc-400">
                    ₨ {Number(sh.openingBalance).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-emerald-600 font-bold">
                    ₨ {Number(sh.cashSales).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    ₨ {Number(sh.expectedClosing || sh.openingBalance + sh.cashSales).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-purple-600 font-bold">
                    ₨ {Number(sh.closingBalance || 0).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">
                    {sh.difference !== null ? (
                      <span
                        className={
                          Number(sh.difference) === 0
                            ? 'text-emerald-500'
                            : Number(sh.difference) > 0
                            ? 'text-purple-600'
                            : 'text-red-500'
                        }
                      >
                        ₨ {Number(sh.difference).toLocaleString()} (
                        {Number(sh.difference) === 0 ? 'Balanced' : Number(sh.difference) > 0 ? 'Over' : 'Short'})
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-bold">Active Shift</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CLOSE SHIFT RECONCILIATION MODAL */}
      {isCloseModalOpen && activeShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCloseShift}
            className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 space-y-3.5 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-rose-600" />
                <span>Reconcile Cash Drawer & Close Shift</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCloseModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-850 text-xs space-y-1">
              <div className="flex justify-between text-zinc-500">
                <span>Opening Float:</span>
                <span className="font-mono">₨ {Number(activeShift.openingBalance).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>POS Cash Sales:</span>
                <span className="font-mono text-emerald-600 font-bold">
                  ₨ {Number(activeShift.cashSales).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-zinc-200 dark:border-zinc-700 text-purple-700 dark:text-purple-400">
                <span>Expected Cash:</span>
                <span className="font-mono">₨ {expectedCash.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Actual Physical Cash Counted in Drawer (PKR ₨) *
              </label>
              <input
                type="number"
                required
                value={countedCash}
                onChange={(e) => setCountedCash(e.target.value)}
                placeholder="Count cash..."
                className="w-full text-base font-mono font-bold px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>

            {/* Over / Short Difference */}
            <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs flex justify-between items-center">
              <span className="text-zinc-500 font-semibold">Over / Short Diff:</span>
              <span
                className={`font-mono font-extrabold ${
                  difference === 0
                    ? 'text-emerald-500'
                    : difference > 0
                    ? 'text-purple-600'
                    : 'text-red-500'
                }`}
              >
                ₨ {difference.toLocaleString()} ({difference === 0 ? 'Balanced' : difference > 0 ? 'Over' : 'Short'})
              </span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                Shift Closing Remarks:
              </label>
              <input
                type="text"
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                placeholder="e.g. Cash drawer balanced, handed to Evening shift"
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCloseModalOpen(false)}
                className="py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition"
              >
                {submitting ? 'Closing...' : 'Confirm Reconciliation & Close'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
