'use client';

import { useState } from 'react';
import { Store, Receipt, Barcode, ShieldCheck, Save, CheckCircle, Volume2, Sparkles } from 'lucide-react';

export default function SettingsPage() {
  const [storeName, setStoreName] = useState('MR BILAL Ladies Wear');
  const [taxRate, setTaxRate] = useState('5');
  const [currency, setCurrency] = useState('USD ($)');
  const [receiptFooter, setReceiptFooter] = useState(
    'Exchange possible within 7 days with original tag attached.'
  );
  const [scannerSound, setScannerSound] = useState(true);
  const [saved, setSaved] = useState(false);

  function handleSave(e) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <span>POS Terminal Configuration</span>
          {saved && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Configure boutique branding, sales tax, hardware scanner audio, and thermal receipts.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Boutique Profile */}
        <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <Store className="w-4 h-4 text-pink-500" />
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Boutique Profile & Regional
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Store / Boutique Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Currency Symbol
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="USD ($)">USD ($)</option>
                <option value="PKR (Rs)">PKR (Rs)</option>
                <option value="EUR (€)">EUR (€)</option>
                <option value="GBP (£)">GBP (£)</option>
                <option value="AED (AED)">AED (AED)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Default Sales Tax / VAT (%)
              </label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>
        </div>

        {/* Barcode & Scanner Hardware Options */}
        <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <Barcode className="w-4 h-4 text-pink-500" />
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Hardware Scanner & Audio Preferences
            </h3>
          </div>

          <label className="flex items-center justify-between text-xs cursor-pointer p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
            <div>
              <span className="font-bold text-zinc-800 dark:text-zinc-200 block">
                Audio Beeper on Barcode Scan
              </span>
              <span className="text-[11px] text-zinc-500">
                Play pleasant high-pitch tone on successful item scan
              </span>
            </div>
            <input
              type="checkbox"
              checked={scannerSound}
              onChange={(e) => setScannerSound(e.target.checked)}
              className="w-4 h-4 accent-pink-600 rounded"
            />
          </label>
        </div>

        {/* Thermal Receipt Settings */}
        <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <Receipt className="w-4 h-4 text-pink-500" />
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Thermal Receipt Policy & Footer
            </h3>
          </div>

          <div className="text-xs">
            <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Receipt Footer Note / Return Policy
            </label>
            <textarea
              rows={2}
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-pink-500/20 transition active:scale-95"
        >
          <Save className="w-4 h-4" /> Save Configuration
        </button>
      </form>
    </div>
  );
}
