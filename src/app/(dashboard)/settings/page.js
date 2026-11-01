'use client';

import { useState, useEffect } from 'react';
import { 
  Store, Receipt, Barcode, ShieldCheck, Save, CheckCircle, 
  Volume2, Database, Download, Upload, AlertCircle, RefreshCw,
  Printer, Percent, MapPin, Phone, Mail, Building, FileText
} from 'lucide-react';
import { api, API_BASE } from '@/lib/api';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Store profile
  const [storeName, setStoreName] = useState('MR BILAL Ladies Wear');
  const [phone, setPhone] = useState('+92 300 1234567');
  const [email, setEmail] = useState('boutique@mrbilal.pk');
  const [address, setAddress] = useState('Shop #12, Liberty Market, Gulberg III, Lahore, Pakistan');
  const [taxNumber, setTaxNumber] = useState('STRN-9821430-1');
  const [currency, setCurrency] = useState('PKR');

  // Policy & hardware
  const [taxRate, setTaxRate] = useState('5');
  const [maxDiscount, setMaxDiscount] = useState('20');
  const [printerFormat, setPrinterFormat] = useState('80mm');
  const [scannerSound, setScannerSound] = useState(true);
  const [receiptHeader, setReceiptHeader] = useState('LUXURY EASTERN WEAR • BRIDAL & FORMAL');
  const [receiptFooter, setReceiptFooter] = useState('Exchange allowed within 7 days with original tag and receipt. Dry clean only for pure silks and chiffons.');

  // Backup / Restore
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState(null);

  async function loadSettings() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSettings();
      if (res.store) {
        setStoreName(res.store.name || 'MR BILAL Ladies Wear');
        setPhone(res.store.phone || '');
        setEmail(res.store.email || '');
        setAddress(res.store.address || '');
        setTaxNumber(res.store.taxNumber || '');
        setCurrency(res.store.currency || 'PKR');
        if (res.store.receiptHeader) setReceiptHeader(res.store.receiptHeader);
        if (res.store.receiptFooter) setReceiptFooter(res.store.receiptFooter);
      }
      if (res.settings) {
        if (res.settings.tax_rate !== undefined) setTaxRate(res.settings.tax_rate);
        if (res.settings.max_discount !== undefined) setMaxDiscount(res.settings.max_discount);
        if (res.settings.printer_format) setPrinterFormat(res.settings.printer_format);
        if (res.settings.scanner_sound !== undefined) setScannerSound(res.settings.scanner_sound === 'true');
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError('Could not load current settings from MySQL database.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const res = await api.getSettings();
        if (isMounted) {
          if (res.store) {
            setStoreName(res.store.name || 'MR BILAL Ladies Wear');
            setPhone(res.store.phone || '');
            setEmail(res.store.email || '');
            setAddress(res.store.address || '');
            setTaxNumber(res.store.taxNumber || '');
            setCurrency(res.store.currency || 'PKR');
            if (res.store.receiptHeader) setReceiptHeader(res.store.receiptHeader);
            if (res.store.receiptFooter) setReceiptFooter(res.store.receiptFooter);
          }
          if (res.settings) {
            if (res.settings.tax_rate !== undefined) setTaxRate(res.settings.tax_rate);
            if (res.settings.max_discount !== undefined) setMaxDiscount(res.settings.max_discount);
            if (res.settings.printer_format) setPrinterFormat(res.settings.printer_format);
            if (res.settings.scanner_sound !== undefined) setScannerSound(res.settings.scanner_sound === 'true');
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        if (isMounted) setError('Could not load current settings from MySQL database.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      await api.updateSettings({
        storeData: {
          name: storeName,
          phone,
          email,
          address,
          taxNumber,
          currency,
          receiptHeader,
          receiptFooter,
        },
        settings: {
          tax_rate: taxRate,
          max_discount: maxDiscount,
          printer_format: printerFormat,
          scanner_sound: String(scannerSound),
        },
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update settings:', err);
      setError(err.message || 'Error updating settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleDownloadBackup() {
    try {
      const token = localStorage.getItem('boutique_token') || localStorage.getItem('token') || '';
      const res = await fetch(`${API_BASE}/settings/backup`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Backup failed');
      }
      const data = await res.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ladies_pos_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Could not generate database backup: ' + err.message);
    }
  }

  async function handleRestoreFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Warning: Restoring data will overwrite or merge items in your database. Do you wish to continue?')) {
      e.target.value = '';
      return;
    }

    try {
      setRestoring(true);
      setRestoreMessage(null);
      const text = await file.text();
      const backupData = JSON.parse(text);

      const json = await api.restoreBackup(backupData);

      setRestoreMessage({ type: 'success', text: json.message || 'Database restored successfully' });
      loadSettings();
    } catch (err) {
      setRestoreMessage({ type: 'error', text: err.message });
    } finally {
      setRestoring(false);
      e.target.value = '';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-pink-500 animate-spin" />
          <p className="text-sm font-semibold text-zinc-500">Loading store configuration from MySQL...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Store & Terminal Settings</span>
            {savedSuccess && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold flex items-center gap-1 border border-emerald-500/20">
                <CheckCircle className="w-3.5 h-3.5" /> Saved to Database
              </span>
            )}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Configure boutique identity, sales tax, thermal receipt printing, audio scanner alerts and SQL backups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadBackup}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-pink-500" />
            <span>Download SQL Backup</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-3 text-rose-700 dark:text-rose-400 text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {restoreMessage && (
        <div className={`p-4 rounded-2xl border text-xs font-medium flex items-center gap-2 ${
          restoreMessage.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-700' 
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-700'
        }`}>
          {restoreMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{restoreMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Boutique Profile */}
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="p-2 bg-pink-50 dark:bg-pink-950/50 rounded-xl text-pink-500">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Boutique Profile & Business Details
              </h3>
              <p className="text-[11px] text-zinc-500">Displayed on printed thermal receipts, barcode tags, and customer invoices</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Store / Brand Name
              </label>
              <input
                type="text"
                required
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
                <option value="PKR">Pakistani Rupee (₨ / PKR)</option>
                <option value="USD">US Dollar ($ / USD)</option>
                <option value="AED">UAE Dirham (AED)</option>
                <option value="GBP">British Pound (£ / GBP)</option>
                <option value="EUR">Euro (€ / EUR)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-pink-500" /> Phone / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3 text-pink-500" /> Store Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@ladiesboutique.pk"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1 flex items-center gap-1">
                <Building className="w-3 h-3 text-pink-500" /> NTN / FBR Sales Tax #
              </label>
              <input
                type="text"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                placeholder="STRN-1234567-8"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-pink-500" /> Outlet Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Shop #12, Liberty Market, Lahore"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>
        </div>

        {/* Pricing, Tax & Discount Rules */}
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="p-2 bg-pink-50 dark:bg-pink-950/50 rounded-xl text-pink-500">
              <Percent className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Taxation & Cashier Discount Limits
              </h3>
              <p className="text-[11px] text-zinc-500">POS checkout calculations and security constraints</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Default Sales Tax / GST (%)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <span className="text-[10px] text-zinc-400 mt-0.5 block">Applied automatically during POS cart subtotal calculation</span>
            </div>

            <div>
              <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Maximum Cashier Discount Permitted (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <span className="text-[10px] text-zinc-400 mt-0.5 block">Discounts exceeding this limit require manager override</span>
            </div>
          </div>
        </div>

        {/* Thermal Receipt Settings */}
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="p-2 bg-pink-50 dark:bg-pink-950/50 rounded-xl text-pink-500">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Thermal Receipt Printer & Policy Text
              </h3>
              <p className="text-[11px] text-zinc-500">Paper width formats (58mm / 80mm) and return conditions</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Thermal Paper Roll Width
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer font-bold transition ${
                  printerFormat === '80mm'
                    ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                }`}>
                  <input
                    type="radio"
                    name="printerFormat"
                    value="80mm"
                    checked={printerFormat === '80mm'}
                    onChange={(e) => setPrinterFormat(e.target.value)}
                    className="accent-pink-600"
                  />
                  <span>80mm (Standard POS)</span>
                </label>

                <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer font-bold transition ${
                  printerFormat === '58mm'
                    ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                }`}>
                  <input
                    type="radio"
                    name="printerFormat"
                    value="58mm"
                    checked={printerFormat === '58mm'}
                    onChange={(e) => setPrinterFormat(e.target.value)}
                    className="accent-pink-600"
                  />
                  <span>58mm (Compact Roll)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Receipt Tagline / Header Note
              </label>
              <input
                type="text"
                value={receiptHeader}
                onChange={(e) => setReceiptHeader(e.target.value)}
                placeholder="LUXURY EASTERN WEAR • BRIDAL & FORMAL"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Exchange Policy / Receipt Footer Text
              </label>
              <textarea
                rows={2}
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                placeholder="Exchange allowed within 7 days with original tag attached..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>
        </div>

        {/* Hardware & Sound Options */}
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="p-2 bg-pink-50 dark:bg-pink-950/50 rounded-xl text-pink-500">
              <Barcode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Hardware Scanner & Audio Feedback
              </h3>
              <p className="text-[11px] text-zinc-500">USB keyboard-wedge laser scanners & HD camera feedback</p>
            </div>
          </div>

          <label className="flex items-center justify-between text-xs cursor-pointer p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 hover:border-pink-300 dark:hover:border-pink-700 transition">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-pink-100/50 dark:bg-pink-900/30 text-pink-600">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                  Audio Beeper Tone on Successful Barcode Scan
                </span>
                <span className="text-[11px] text-zinc-500">
                  Plays a high-pitch 880Hz confirmation beep whenever an item is added to POS cart
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={scannerSound}
              onChange={(e) => setScannerSound(e.target.checked)}
              className="w-4 h-4 accent-pink-600 rounded"
            />
          </label>
        </div>

        {/* Database Disaster Recovery */}
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="p-2 bg-pink-50 dark:bg-pink-950/50 rounded-xl text-pink-500">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Database Backup & Disaster Recovery
              </h3>
              <p className="text-[11px] text-zinc-500">MySQL 8.4 database snapshot download and JSON restore</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs font-bold transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Full Database Snapshot (.json)</span>
            </button>

            <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-pink-500 text-zinc-700 dark:text-zinc-300 text-xs font-bold cursor-pointer transition">
              <Upload className="w-3.5 h-3.5 text-pink-500" />
              <span>{restoring ? 'Restoring Database...' : 'Restore from JSON File'}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreFile}
                disabled={restoring}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Save Button Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-pink-500/20 transition active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving to MySQL...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
