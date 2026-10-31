'use client';

import { useEffect, useRef } from 'react';
import { X, Printer, Barcode as BarcodeIcon, Tag, Sparkles } from 'lucide-react';
import JsBarcode from 'jsbarcode';

export default function BarcodeLabelModal({ isOpen, onClose, product }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !product || !svgRef.current) return;

    try {
      JsBarcode(svgRef.current, product.sku || '000000000000', {
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
        margin: 6,
      });
    } catch (e) {
      console.warn('JsBarcode render error:', e);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <BarcodeIcon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Garment Barcode Tag
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tag Preview (Printable Area) */}
        <div className="p-6 bg-zinc-50 dark:bg-zinc-950/60 flex flex-col items-center justify-center">
          <div className="w-64 bg-white text-zinc-950 p-4 rounded-2xl shadow-md border-2 border-dashed border-zinc-300 relative">
            {/* Tag Hole punch effect */}
            <div className="w-3.5 h-3.5 rounded-full bg-zinc-200 mx-auto mb-2 border border-zinc-300"></div>

            {/* Boutique Header */}
            <div className="text-center pb-2 border-b border-zinc-200">
              <p className="text-[10px] tracking-widest uppercase font-extrabold text-pink-600">
                MR BILAL
              </p>
              <p className="text-[8px] uppercase tracking-wider text-zinc-500 font-medium">
                Ladies Wear Boutique
              </p>
            </div>

            {/* Garment Details */}
            <div className="py-2.5 text-center space-y-1">
              <h4 className="text-xs font-bold text-zinc-900 leading-tight">
                {product.name}
              </h4>
              <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-600 font-medium">
                <span className="px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200">
                  Size: {product.size || 'M'}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200">
                  {product.color || 'Standard'}
                </span>
              </div>
            </div>

            {/* Generated Barcode SVG */}
            <div className="flex justify-center my-1 bg-white p-1 rounded">
              <svg ref={svgRef} className="max-w-full h-auto"></svg>
            </div>

            {/* Price Tag */}
            <div className="pt-2 border-t border-zinc-200 flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">
                Retail Price
              </span>
              <span className="text-base font-extrabold text-indigo-700">
                ${product.price?.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition active:scale-95"
          >
            <Printer className="w-4 h-4" /> Print Label
          </button>
        </div>
      </div>
    </div>
  );
}
