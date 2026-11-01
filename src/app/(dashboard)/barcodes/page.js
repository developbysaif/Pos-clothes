'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Barcode as BarcodeIcon,
  Printer,
  Sparkles,
  Search,
  Plus,
  RefreshCw,
  Copy,
  CheckCircle,
  Camera,
  Shirt,
  Tag,
  Boxes,
} from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { api } from '../../../lib/api';
import BarcodeLabelModal from '../../../components/pos/BarcodeLabelModal';
import CameraScannerModal from '../../../components/pos/CameraScannerModal';

export default function BarcodePage() {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Bulk Generator State
  const [bulkCopies, setBulkCopies] = useState(12);
  const [bulkSelectedIds, setBulkSelectedIds] = useState([]);

  // Tester Code
  const [testCode, setTestCode] = useState('');
  const [testResult, setTestResult] = useState(null);
  const testSvgRef = useRef(null);

  async function loadVariants() {
    try {
      setLoading(true);
      const res = await api.getInventory();
      setVariants(res.variants || []);
    } catch (err) {
      console.error('Failed to load variants for barcodes:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVariants();
  }, []);

  // Update tester barcode render
  useEffect(() => {
    if (!testCode || !testSvgRef.current) return;
    try {
      JsBarcode(testSvgRef.current, testCode, {
        format: 'CODE128',
        width: 1.8,
        height: 48,
        displayValue: true,
        fontSize: 12,
        font: 'monospace',
        fontOptions: 'bold',
        textMargin: 2,
        background: '#ffffff',
        lineColor: '#09090b',
        margin: 4,
      });
    } catch (e) {
      // ignore
    }
  }, [testCode]);

  function handleTestSearch(e) {
    e.preventDefault();
    if (!testCode.trim()) return;
    const clean = testCode.trim();
    const found = variants.find(
      (v) => v.barcode === clean || v.sku.toLowerCase() === clean.toLowerCase()
    );
    setTestResult(found || 'NOT_FOUND');
  }

  function handleCameraDetected(code) {
    setIsCameraOpen(false);
    setTestCode(code);
    const found = variants.find(
      (v) => v.barcode === code || v.sku.toLowerCase() === code.toLowerCase()
    );
    setTestResult(found || 'NOT_FOUND');
  }

  // Toggle selection for bulk printing
  function toggleBulkSelect(id) {
    setBulkSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function selectAllForBulk() {
    if (bulkSelectedIds.length === variants.length) {
      setBulkSelectedIds([]);
    } else {
      setBulkSelectedIds(variants.map((v) => v.id));
    }
  }

  function handleBulkPrint() {
    window.print();
  }

  const filtered = variants.filter((v) => {
    const q = search.toLowerCase();
    return (
      v.barcode.includes(q) ||
      v.sku.toLowerCase().includes(q) ||
      v.product.name.toLowerCase().includes(q) ||
      (v.color?.name && v.color.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Barcode Management & Tag Hub</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              Code128 & EAN
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Generate, preview, test, and bulk-print scannable retail barcode stickers and hang-tags.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCameraOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 transition"
          >
            <Camera className="w-4 h-4 text-rose-500" />
            <span>Test Scanner</span>
          </button>

          <button
            onClick={handleBulkPrint}
            disabled={bulkSelectedIds.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl text-xs font-extrabold shadow-md shadow-purple-500/20 transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Bulk Print ({bulkSelectedIds.length})</span>
          </button>
        </div>
      </div>

      {/* Two Columns: Barcode Tester & Bulk Print Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Barcode Lookup & Tester (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 space-y-4">
          <div className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <BarcodeIcon className="w-4 h-4 text-purple-600" />
              <span>Instant Barcode Verifier</span>
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Scan with handheld USB gun or type code to verify database match
            </p>
          </div>

          <form onSubmit={handleTestSearch} className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={testCode}
                onChange={(e) => setTestCode(e.target.value)}
                placeholder="Scan or enter code (e.g. 890123456001)..."
                className="w-full font-mono text-xs pl-3 pr-20 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 text-[11px] font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                Verify
              </button>
            </div>
          </form>

          {/* Test Barcode Preview */}
          {testCode && (
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center">
              <div className="bg-white p-2 rounded-xl shadow-xs">
                <svg ref={testSvgRef} className="max-w-full h-auto"></svg>
              </div>

              {testResult && testResult !== 'NOT_FOUND' && (
                <div className="mt-3 text-center space-y-1">
                  <p className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Verified in Inventory
                  </p>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {testResult.product?.name}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Size: {testResult.size?.code || 'Free'} • Color: {testResult.color?.name} • Stock: {testResult.stockQuantity}
                  </p>
                  <p className="text-sm font-extrabold text-purple-600 font-mono">
                    ₨ {Number(testResult.sellingPrice).toLocaleString()}
                  </p>
                </div>
              )}

              {testResult === 'NOT_FOUND' && (
                <p className="text-xs font-bold text-rose-500 mt-2">
                  No variant found with this barcode in database.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Bulk Sticker Sheets (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Tag className="w-4 h-4 text-rose-500" />
                <span>Bulk Sticker Roll & Hang-Tag Generator</span>
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Generate 50x30mm thermal rolls or 24-sticker A4 pages
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllForBulk}
                className="text-xs font-bold text-purple-600 hover:underline"
              >
                {bulkSelectedIds.length === variants.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Select items from the table below, then click &ldquo;Bulk Print&rdquo; to send pre-formatted barcode hang-tags with store branding, size, and retail price directly to your thermal barcode printer.
          </p>

          <div className="flex items-center gap-2 pt-2">
            <span className="text-xs font-semibold text-zinc-500">Selected for Print:</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950 text-purple-600">
              {bulkSelectedIds.length} variants
            </span>
          </div>
        </div>
      </div>

      {/* Barcode Registry Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden space-y-3 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search barcode or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
            />
          </div>

          <span className="text-xs font-mono text-zinc-400">
            {filtered.length} active barcodes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 text-[11px] font-bold">
                <th className="py-2.5 px-3 w-10">Select</th>
                <th className="py-2.5 px-3">Barcode (Code128)</th>
                <th className="py-2.5 px-3">Garment Title</th>
                <th className="py-2.5 px-3">Size & Color</th>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">Retail Price</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
              {filtered.map((v) => {
                const isSelected = bulkSelectedIds.includes(v.id);
                return (
                  <tr key={v.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/40">
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleBulkSelect(v.id)}
                        className="rounded accent-purple-600"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono font-extrabold text-purple-600 dark:text-purple-400">
                      {v.barcode}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-zinc-800 dark:text-zinc-200">
                      {v.product?.name}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">
                      <span className="font-mono font-bold bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
                        {v.size?.code || 'Free'}
                      </span>{' '}
                      • {v.color?.name || 'Assorted'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400 text-[11px]">
                      {v.sku}
                    </td>
                    <td className="py-2.5 px-3 font-extrabold font-mono text-zinc-900 dark:text-zinc-100">
                      ₨ {Number(v.sellingPrice).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedVariant(v);
                          setIsLabelModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-purple-600 text-zinc-600 hover:text-purple-600 transition"
                        title="Print Single Tag"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single Barcode Tag Modal */}
      {selectedVariant && (
        <BarcodeLabelModal
          isOpen={isLabelModalOpen}
          onClose={() => {
            setIsLabelModalOpen(false);
            setSelectedVariant(null);
          }}
          product={selectedVariant.product}
          variant={selectedVariant}
        />
      )}

      {/* Camera Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onDetected={handleCameraDetected}
      />
    </div>
  );
}
