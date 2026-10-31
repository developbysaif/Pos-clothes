'use client';

import { useEffect, useRef } from 'react';
import { Printer, CheckCircle, X, ShoppingBag, Sparkles } from 'lucide-react';
import JsBarcode from 'jsbarcode';

export default function ReceiptModal({ isOpen, onClose, saleData }) {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !saleData || !barcodeRef.current) return;
    try {
      JsBarcode(barcodeRef.current, saleData.id || 'INV-000000', {
        format: 'CODE128',
        width: 1.6,
        height: 40,
        displayValue: true,
        fontSize: 11,
        font: 'monospace',
        fontOptions: 'bold',
        textMargin: 2,
        background: '#ffffff',
        lineColor: '#18181b',
        margin: 4,
      });
    } catch (e) {
      console.warn('Receipt barcode render err:', e);
    }
  }, [isOpen, saleData]);

  if (!isOpen || !saleData) return null;

  function handlePrint() {
    window.print();
  }

  const {
    id = 'INV-100001',
    items = [],
    customer = null,
    subtotal = 0,
    taxAmount = 0,
    orderDiscount = 0,
    grandTotal = 0,
    paymentMethod = 'cash',
    cashier = 'Admin Cashier',
    date = new Date().toLocaleString(),
  } = saleData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-sm bg-white text-zinc-900 rounded-3xl shadow-2xl p-5 sm:p-6 border border-zinc-200 my-auto animate-in zoom-in-95 duration-200">
        {/* Controls (Hidden in Print) */}
        <div className="print:hidden flex items-center justify-between pb-3 border-b border-zinc-200 mb-4">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-extrabold text-sm">Sale Completed!</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Receipt Body */}
        <div id="thermal-receipt" className="text-xs font-mono leading-relaxed space-y-3">
          {/* Header */}
          <div className="text-center space-y-1">
            <h2 className="text-base font-extrabold tracking-wider uppercase text-pink-600">
              MR BILAL
            </h2>
            <p className="text-[11px] text-zinc-600 font-sans font-medium">Ladies Wear & Fashion Boutique</p>
            <p className="text-[10px] text-zinc-500">Phone: +92 42 3578 9012 • Lahore</p>
            <p className="text-[10px] text-zinc-400">TRN / Tax ID: 948103-88</p>
          </div>

          <div className="border-t border-b border-dashed border-zinc-400 py-2 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Invoice:</span>
              <span className="font-bold">{id}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{date}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span>{cashier}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{customer?.name || 'Walk-in'}</span>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-zinc-400 font-bold">
                <th className="py-1">Garment</th>
                <th className="py-1 text-center">Qty</th>
                <th className="py-1 text-right">Price</th>
                <th className="py-1 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dotted divide-zinc-300">
              {items.map((item, idx) => (
                <tr key={idx} className="align-top">
                  <td className="py-1.5 pr-1">
                    <div className="font-medium text-zinc-900">{item.name}</div>
                    <div className="text-[10px] text-zinc-500">
                      SKU: {item.sku} • {item.size || 'M'}
                    </div>
                  </td>
                  <td className="py-1.5 text-center font-bold">{item.quantity}</td>
                  <td className="py-1.5 text-right">${item.price.toFixed(2)}</td>
                  <td className="py-1.5 text-right font-bold text-zinc-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t border-dashed border-zinc-400 pt-2 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {orderDiscount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount ({orderDiscount}%):</span>
                <span>
                  -${((subtotal * orderDiscount) / 100).toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>VAT / Tax (5%):</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold pt-1 border-t border-zinc-300 text-pink-700">
              <span>NET TOTAL:</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-zinc-500 pt-1">
              <span>Paid via:</span>
              <span className="uppercase font-bold">{paymentMethod}</span>
            </div>
          </div>

          {/* Barcode SVG */}
          <div className="flex justify-center pt-2">
            <svg ref={barcodeRef} className="max-w-full h-auto"></svg>
          </div>

          {/* Footer note */}
          <div className="text-center pt-2 border-t border-dashed border-zinc-400 text-[10px] text-zinc-500">
            <p>Exchange valid within 7 days with original tag attached.</p>
            <p className="font-semibold text-zinc-700 mt-0.5">Thank you for shopping at MR BILAL!</p>
          </div>
        </div>

        {/* Modal Action Buttons (Hidden in Print) */}
        <div className="print:hidden mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl border border-zinc-300 hover:bg-zinc-100 transition"
          >
            New Sale
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-pink-600 hover:bg-pink-700 text-white shadow-md shadow-pink-500/20 transition flex items-center justify-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
