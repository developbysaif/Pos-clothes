'use client';

import { useEffect, useRef, useState } from 'react';
import { Printer, CheckCircle, X, Download, Sliders } from 'lucide-react';
import JsBarcode from 'jsbarcode';

export default function ReceiptModal({ isOpen, onClose, saleData }) {
  const barcodeRef = useRef(null);
  const [paperSize, setPaperSize] = useState('80mm'); // '80mm' or '58mm'

  const invoiceNumber = saleData?.invoiceNumber || saleData?.id || 'INV-000000';

  useEffect(() => {
    if (!isOpen || !saleData || !barcodeRef.current) return;
    try {
      JsBarcode(barcodeRef.current, invoiceNumber, {
        format: 'CODE128',
        width: paperSize === '58mm' ? 1.2 : 1.6,
        height: 38,
        displayValue: true,
        fontSize: 10,
        font: 'monospace',
        fontOptions: 'bold',
        textMargin: 2,
        background: '#ffffff',
        lineColor: '#18181b',
        margin: 2,
      });
    } catch (e) {
      console.warn('Receipt barcode render err:', e);
    }
  }, [isOpen, saleData, paperSize, invoiceNumber]);

  if (!isOpen || !saleData) return null;

  function handlePrint() {
    window.print();
  }

  const {
    items = [],
    customer = null,
    subtotal = 0,
    taxAmount = 0,
    discountAmount = 0,
    grandTotal = 0,
    paidAmount = 0,
    changeAmount = 0,
    balanceDue = 0,
    paymentMethod = 'CASH',
    payments = [],
    user = { name: 'Cashier #01' },
    branch = { name: 'Gulberg Flagship - Lahore', phone: '+92 42 35789000', address: 'MM Alam Road, Lahore' },
    saleDate = new Date(),
    orderNotes,
  } = saleData;

  const resolvedPaymentMethod =
    payments.length > 0
      ? payments.map((p) => p.paymentMethod).join(' + ')
      : paymentMethod;

  const dateFormatted = new Date(saleDate).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className={`relative w-full ${
          paperSize === '58mm' ? 'max-w-[280px]' : 'max-w-sm'
        } bg-white text-zinc-900 rounded-3xl shadow-2xl p-4 sm:p-6 border border-zinc-200 my-auto animate-in zoom-in-95 duration-200 transition-all`}
      >
        {/* Controls (Hidden in Print) */}
        <div className="print:hidden flex items-center justify-between pb-3 border-b border-zinc-200 mb-3">
          <div className="flex items-center gap-1.5 text-emerald-600 font-extrabold text-xs">
            <CheckCircle className="w-4 h-4" />
            <span>Order Completed</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Paper format selector */}
            <div className="flex bg-zinc-100 rounded-lg p-0.5 text-[10px] font-bold">
              <button
                onClick={() => setPaperSize('58mm')}
                className={`px-2 py-0.5 rounded ${
                  paperSize === '58mm' ? 'bg-white shadow text-rose-600' : 'text-zinc-500'
                }`}
              >
                58mm
              </button>
              <button
                onClick={() => setPaperSize('80mm')}
                className={`px-2 py-0.5 rounded ${
                  paperSize === '80mm' ? 'bg-white shadow text-rose-600' : 'text-zinc-500'
                }`}
              >
                80mm
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thermal Receipt Print Area */}
        <div id="thermal-receipt" className="text-xs font-mono leading-relaxed space-y-2.5">
          {/* Boutique Header */}
          <div className="text-center space-y-0.5">
            <h2 className="text-sm sm:text-base font-extrabold tracking-wider uppercase text-purple-700">
              MR BILAL
            </h2>
            <p className="text-[10px] text-zinc-600 font-sans font-semibold">
              LADIES WEAR & COUTURE
            </p>
            <p className="text-[9px] text-zinc-500">{branch.name || 'Gulberg Flagship, Lahore'}</p>
            <p className="text-[9px] text-zinc-500">Tel: {branch.phone || '+92 42 35789000'}</p>
            <p className="text-[9px] text-zinc-400">GST/STRN: 98765432-1</p>
          </div>

          {/* Invoice Meta */}
          <div className="border-t border-b border-dashed border-zinc-400 py-1.5 space-y-0.5 text-[10px]">
            <div className="flex justify-between">
              <span>Invoice:</span>
              <span className="font-bold">{invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{dateFormatted}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span>{user?.name || 'Cashier #01'}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span className="font-semibold">{customer?.name || 'Walk-in Customer'}</span>
            </div>
            {customer?.phone && (
              <div className="flex justify-between text-zinc-500">
                <span>Phone:</span>
                <span>{customer.phone}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <table className="w-full text-left text-[10px]">
            <thead>
              <tr className="border-b border-zinc-400 font-bold">
                <th className="py-1">Item</th>
                <th className="py-1 text-center">Qty</th>
                <th className="py-1 text-right">Price</th>
                <th className="py-1 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dotted divide-zinc-300">
              {items.map((item, idx) => {
                const name = item.name || item.variant?.product?.name || 'Garment';
                const size = item.size || item.variant?.size?.code || '';
                const color = item.color || item.variant?.color?.name || '';
                const price = Number(item.price || item.unitPrice || 0);
                const qty = item.quantity;
                return (
                  <tr key={idx} className="align-top">
                    <td className="py-1 pr-1">
                      <div className="font-semibold text-zinc-900 leading-tight">{name}</div>
                      <div className="text-[9px] text-zinc-500">
                        {size && `[${size}] `}
                        {color}
                      </div>
                    </td>
                    <td className="py-1 text-center font-bold">{qty}</td>
                    <td className="py-1 text-right">₨{price.toLocaleString()}</td>
                    <td className="py-1 text-right font-bold text-zinc-900">
                      ₨{(price * qty).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Financial Totals */}
          <div className="border-t border-dashed border-zinc-400 pt-1.5 space-y-0.5 text-[10px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₨ {Number(subtotal).toLocaleString()}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discount:</span>
                <span>-₨ {Number(discountAmount).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Sales Tax / VAT (5%):</span>
              <span>₨ {Number(taxAmount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm font-extrabold pt-1 border-t border-zinc-400 text-purple-900">
              <span>GRAND TOTAL:</span>
              <span>₨ {Number(grandTotal).toLocaleString()}</span>
            </div>

            <div className="pt-1 border-t border-dotted border-zinc-300 space-y-0.5 text-[9px]">
              <div className="flex justify-between">
                <span>Paid via ({resolvedPaymentMethod}):</span>
                <span className="font-bold">₨ {Number(paidAmount || grandTotal).toLocaleString()}</span>
              </div>
              {changeAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Change Returned:</span>
                  <span>₨ {Number(changeAmount).toLocaleString()}</span>
                </div>
              )}
              {balanceDue > 0 && (
                <div className="flex justify-between text-amber-600 font-bold">
                  <span>Balance Due (Credit):</span>
                  <span>₨ {Number(balanceDue).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Notes */}
          {orderNotes && (
            <div className="text-[9px] text-zinc-500 italic border-t border-dotted border-zinc-300 pt-1">
              Note: {orderNotes}
            </div>
          )}

          {/* Barcode Scannable SVG */}
          <div className="flex justify-center pt-1.5">
            <svg ref={barcodeRef} className="max-w-full h-auto"></svg>
          </div>

          {/* Boutique Policy Footer */}
          <div className="text-center pt-2 border-t border-dashed border-zinc-400 text-[9px] text-zinc-500 space-y-0.5">
            <p>Exchange valid within 7 days with original tag attached.</p>
            <p className="font-semibold text-zinc-800">Thank you for visiting MR BILAL!</p>
          </div>
        </div>

        {/* Modal Action Buttons (Hidden in Print) */}
        <div className="print:hidden mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl border border-zinc-300 hover:bg-zinc-100 transition"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20 transition flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" /> Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
