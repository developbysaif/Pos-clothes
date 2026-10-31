'use client';

import { useState } from 'react';
import { Store, Receipt, Barcode, ShieldCheck, Save } from 'lucide-react';

export default function SettingsPage() {
  const [storeName, setStoreName] = useState('Mr Bilal');
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
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          POS Terminal Settings
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Configure boutique details, tax calculations, hardware scanner preferences, and thermal receipts.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Boutique Profile */}
        <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <Store className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              Boutique Profile
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                Store Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                Currency Symbol
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="USD ($)">USD ($)</option>
                <option value="PKR (Rs)">PKR (Rs)</option>
                <option value="EUR (€)">EUR (€)</option>
                <option value="GBP (£)">GBP (£)</option>
              </select>
            </div>

            <div>
              <label className="font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                Default VAT / Tax Rate (%)
              </label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Barcode & Scanner Hardware Options */}
        <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <Barcode className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              Hardware Scanner & Audio
            </h3>
          </div>

          <label className="flex items-center justify-between text-xs cursor-pointer">
            <div>
              <span className="font-medium text-zinc-800 dark:text-zinc-200 block">
                Audio Beeper on Scan
              </span>
              <span className="text-[11px] text-zinc-500">
                Play pleasant chime on successful scan and buzzer on unrecognized barcode.
              </span>
            </div>
            <input
              type="checkbox"
              checked={scannerSound}
              onChange={(e) => setScannerSound(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
          </label>
        </div>

        {/* Receipt Customization */}
        <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <Receipt className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              Thermal Receipt Printing
            </h3>
          </div>

          <div className="text-xs space-y-2">
            <label className="font-medium text-zinc-700 dark:text-zinc-300 block">
              Receipt Footer Policy Note
            </label>
            <textarea
              rows={3}
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition"
          >
            <Save className="w-4 h-4" /> Save Configuration
          </button>
          {saved && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold animate-fade-in">
              Settings updated successfully!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
