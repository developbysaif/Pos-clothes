'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Printer, Barcode as BarcodeIcon, Tag, Sparkles } from 'lucide-react';
import JsBarcode from 'jsbarcode';

export default function BarcodeLabelModal({ isOpen, onClose, product, variant }) {
  const svgRef = useRef(null);
  const [copies, setCopies] = useState(1);

  const activeVariant = variant || product?.variants?.[0] || product;
  const barcodeValue = activeVariant?.barcode || activeVariant?.sku || product?.sku || '890123456001';
  const price = activeVariant?.sellingPrice || activeVariant?.price || product?.basePrice || 0;
  const sizeName = activeVariant?.size?.code || activeVariant?.size || 'Free';
  const colorName = activeVariant?.color?.name || activeVariant?.color || 'Assorted';
  const fabricName = activeVariant?.fabric || 'Standard';

  useEffect(() => {
    if (!isOpen || !svgRef.current) return;

    try {
      JsBarcode(svgRef.current, barcodeValue, {
        format: 'CODE128',
        width: 1.6,
        height: 42,
        displayValue: true,
        fontSize: 10,
        font: 'monospace',
        fontOptions: 'bold',
        textMargin: 2,
        background: '#ffffff',
        lineColor: '#09090b',
        margin: 4,
      });
    } catch (e) {
      console.warn('JsBarcode render error:', e);
    }
  }, [isOpen, barcodeValue]);

  if (!isOpen) return null;

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <BarcodeIcon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Garment Barcode Hang-Tag
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tag Preview Area (Printable) */}
        <div className="p-6 bg-zinc-50 dark:bg-zinc-950/60 flex flex-col items-center justify-center">
          <div
            id="printable-barcode-tag"
            className="w-64 bg-white text-zinc-950 p-4 rounded-2xl shadow-md border-2 border-dashed border-zinc-300 relative"
          >
            {/* Tag Hole punch effect */}
            <div className="w-3.5 h-3.5 rounded-full bg-zinc-200 mx-auto mb-2 border border-zinc-300"></div>

            {/* Boutique Brand */}
            <div className="text-center pb-2 border-b border-zinc-200">
              <p className="text-[11px] tracking-widest uppercase font-extrabold text-purple-700">
                MR BILAL
              </p>
              <p className="text-[8px] uppercase tracking-wider text-zinc-500 font-semibold">
                LADIES WEAR & COUTURE
              </p>
            </div>

            {/* Garment Details */}
            <div className="py-2 text-center space-y-1">
              <h4 className="text-xs font-bold text-zinc-900 leading-tight">
                {product?.name || activeVariant?.name || 'Ladies Garment'}
              </h4>
              <div className="flex items-center justify-center gap-1.5 text-[9px] text-zinc-600 font-semibold flex-wrap">
                <span className="px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200">
                  Size: {sizeName}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200">
                  {colorName}
                </span>
                {fabricName && (
                  <span className="px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200">
                    {fabricName}
                  </span>
                )}
              </div>
            </div>

            {/* Generated Barcode SVG */}
            <div className="flex justify-center my-1 bg-white p-1 rounded">
              <svg ref={svgRef} className="max-w-full h-auto"></svg>
            </div>

            {/* Retail Price in PKR */}
            <div className="pt-2 border-t border-zinc-200 flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">
                Retail Price
              </span>
              <span className="text-base font-extrabold text-purple-800">
                ₨ {Number(price).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-500">Sticker Copies to Print:</span>
            <div className="flex items-center gap-1">
              {[1, 5, 10, 25].map((num) => (
                <button
                  key={num}
                  onClick={() => setCopies(num)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition ${
                    copies === num
                      ? 'bg-purple-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {num}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20 transition active:scale-95"
            >
              <Printer className="w-4 h-4" /> Print Tag
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
