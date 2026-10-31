'use client';

import { Printer, CheckCircle, X } from 'lucide-react';

export default function ReceiptModal({ isOpen, onClose, saleData }) {
  if (!isOpen || !saleData) return null;

  function handlePrint() {
    window.print();
  }

  const {
    id = `INV-${Date.now().toString().slice(-6)}`,
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
      <div className="relative w-full max-w-sm bg-white text-zinc-900 rounded-xl shadow-2xl p-6 border border-zinc-200">
        {/* Modal Controls (Hidden in Print) */}
        <div className="print:hidden flex items-center justify-between pb-3 border-b border-zinc-200 mb-4">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold text-sm">Sale Completed!</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Receipt Body */}
        <div id="thermal-receipt" className="text-xs font-mono leading-relaxed space-y-3">
          {/* Header */}
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold tracking-wider uppercase">NOOR LADIES BOUTIQUE</h2>
            <p className="text-[11px] text-zinc-600">Fashion Avenue, Gulberg III, Lahore</p>
            <p className="text-[11px] text-zinc-600">Phone: +92 42 3578 9012</p>
            <p className="text-[10px] text-zinc-500">TRN / Tax ID: 948103-88</p>
          </div>

          <div className="border-t border-b border-dashed border-zinc-400 py-2 space-y-0.5">
            <div className="flex justify-between">
              <span>Receipt:</span>
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
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-400">
                <th className="py-1">Item</th>
                <th className="py-1 text-center">Qty</th>
                <th className="py-1 text-right">Price</th>
                <th className="py-1 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dotted divide-zinc-300">
              {items.map((item, idx) => (
                <tr key={idx} className="align-top">
                  <td className="py-1 pr-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-[10px] text-zinc-500">SKU: {item.sku}</div>
                    {item.discount > 0 && (
                      <span className="text-[10px] text-emerald-600">
                        -{item.discount}% off
                      </span>
                    )}
                  </td>
                  <td className="py-1 text-center font-semibold">{item.quantity}</td>
                  <td className="py-1 text-right">${item.price.toFixed(2)}</td>
                  <td className="py-1 text-right font-medium">
                    ${(
                      item.price *
                      item.quantity *
                      (1 - (item.discount || 0) / 100)
                    ).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Summary */}
          <div className="border-t border-zinc-400 pt-2 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {orderDiscount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span>-${orderDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax / VAT (5%):</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-dashed border-zinc-800 pt-1">
              <span>TOTAL DUE:</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] pt-1">
              <span>Payment Mode:</span>
              <span className="uppercase font-semibold">{paymentMethod}</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center pt-3 border-t border-dashed border-zinc-400 space-y-1">
            <p className="font-bold">THANK YOU FOR SHOPPING WITH US!</p>
            <p className="text-[10px] text-zinc-500">
              Exchange possible within 7 days with original receipt and tags attached.
            </p>
            <p className="text-[10px] text-zinc-400">www.noorpos.local</p>
          </div>
        </div>

        {/* Print / Action Buttons */}
        <div className="print:hidden mt-6 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition shadow-sm"
          >
            <Printer className="w-4 h-4" /> Print Thermal Receipt
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg font-medium text-sm transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
