'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Camera,
  Barcode,
  Plus,
  Minus,
  Trash2,
  Tag,
  CreditCard,
  Banknote,
  QrCode,
  RotateCcw,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useCart } from '../../../context/CartContext';
import { useBarcodeScanner } from '../../../hooks/useBarcodeScanner';
import { playBeep } from '../../../lib/audio';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_CUSTOMERS } from '../../../lib/data';
import CameraScannerModal from '../../../components/pos/CameraScannerModal';
import ReceiptModal from '../../../components/pos/ReceiptModal';

export default function POSPage() {
  const {
    items,
    addItem,
    updateQuantity,
    removeItem,
    setItemDiscount,
    customer,
    setCustomer,
    subtotal,
    taxAmount,
    grandTotal,
    totalItemCount,
    orderDiscount,
    setOrderDiscount,
    paymentMethod,
    setPaymentMethod,
    clearCart,
    holdOrder,
    restoreOrder,
    heldOrders,
  } = useCart();

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  function showToast(msg, isError = false) {
    setToastMessage({ msg, isError });
    setTimeout(() => setToastMessage(null), 3000);
  }

  // Handle hardware barcode scan
  function handleBarcodeScanned(sku) {
    const product = INITIAL_PRODUCTS.find(
      (p) => p.sku.toLowerCase() === sku.toLowerCase() || p.id === sku
    );

    if (product) {
      addItem(product);
      showToast(`Scanned: ${product.name} added to cart`);
    } else {
      playBeep('error');
      showToast(`Product not found for SKU: ${sku}`, true);
    }
  }

  // Hook hardware scanner
  useBarcodeScanner(handleBarcodeScanned);

  // Filter products by category and search text
  const filteredProducts = useMemo(() => {
    return INITIAL_PRODUCTS.filter((product) => {
      const matchesCategory =
        selectedCategory === 'ALL' || product.category === selectedCategory;
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.includes(searchQuery);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Complete sale checkout
  function handleCheckout() {
    if (items.length === 0) {
      showToast('Cart is empty. Add products to checkout.', true);
      return;
    }

    const saleRecord = {
      id: `INV-${Date.now().toString().slice(-6)}`,
      items: [...items],
      customer,
      subtotal,
      taxAmount,
      orderDiscount,
      grandTotal,
      paymentMethod,
      date: new Date().toLocaleString(),
    };

    setCompletedSale(saleRecord);
    clearCart();
    playBeep('success');
  }

  return (
    <div className="h-[calc(100vh-6.5rem)] flex gap-6">
      {/* LEFT SECTION: Products & Catalog */}
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {/* Top Filter and Search Bar */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-3 items-center justify-between">
          {/* Search box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ladies dress, fabric, or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Barcode action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCameraOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition shadow-sm"
            >
              <Camera className="w-4 h-4" />
              <span>Camera Scan</span>
            </button>

            <div className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700">
              <Barcode className="w-4 h-4 text-zinc-400" />
              <span>USB Scanner Ready</span>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-850/50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              selectedCategory === 'ALL'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            All Items
          </button>
          {INITIAL_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat.name
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 content-start">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => {
                addItem(product);
                playBeep('success');
              }}
              className="group relative bg-white dark:bg-zinc-850 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/80 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-xl p-3 flex flex-col justify-between cursor-pointer transition hover:shadow-lg active:scale-[0.98]"
            >
              <div>
                {/* Product Badge */}
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium mb-1">
                  <span>{product.category}</span>
                  <span
                    className={`font-semibold ${
                      product.stock < 10 ? 'text-amber-500' : 'text-zinc-500'
                    }`}
                  >
                    Stock: {product.stock}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 line-clamp-2 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                  {product.name}
                </h4>
                <div className="text-[10px] text-zinc-500 font-mono">
                  SKU: {product.sku.slice(-6)} | {product.size}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                  ${product.price.toFixed(2)}
                </span>
                <span className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition">
                  <Plus className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SECTION: Cart & Checkout Panel */}
      <div className="w-96 flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden shrink-0">
        {/* Customer & Cart Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Current Order</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold">
                {totalItemCount}
              </span>
            </h3>

            {/* Held orders badge */}
            {heldOrders.length > 0 && (
              <button
                onClick={() => restoreOrder(heldOrders[0].id)}
                className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium hover:underline"
              >
                <Clock className="w-3.5 h-3.5" /> Recall ({heldOrders.length})
              </button>
            )}
          </div>

          {/* Customer Selection */}
          <select
            value={customer?.id || ''}
            onChange={(e) => {
              const cust = INITIAL_CUSTOMERS.find((c) => c.id === e.target.value);
              setCustomer(cust || null);
            }}
            className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Walk-in Customer (Default)</option>
            {INITIAL_CUSTOMERS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone})
              </option>
            ))}
          </select>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400">
              <Sparkles className="w-10 h-10 mb-2 stroke-1 text-zinc-300 dark:text-zinc-700" />
              <p className="text-xs font-medium">Cart is empty</p>
              <p className="text-[11px] text-zinc-400 mt-1">
                Scan barcode with scanner or click products on the left
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-850/40 flex flex-col gap-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      ${item.price.toFixed(2)} each
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-zinc-400 hover:text-rose-500 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-l transition"
                    >
                      <Minus className="w-3 h-3 text-zinc-600 dark:text-zinc-300" />
                    </button>
                    <span className="w-7 text-center text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-r transition"
                    >
                      <Plus className="w-3 h-3 text-zinc-600 dark:text-zinc-300" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    ${(
                      item.price *
                      item.quantity *
                      (1 - (item.discount || 0) / 100)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Payment Section */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/80 space-y-3">
          {/* Summary Lines */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
              <span>Subtotal:</span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                ${subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
              <span>Tax (5%):</span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                ${taxAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-zinc-900 dark:text-zinc-100 pt-1 border-t border-zinc-200 dark:border-zinc-800">
              <span>Grand Total:</span>
              <span className="text-indigo-600 dark:text-indigo-400 text-base">
                ${grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'cash', label: 'Cash', icon: Banknote },
              { id: 'card', label: 'Card', icon: CreditCard },
              { id: 'qr', label: 'QR Pay', icon: QrCode },
            ].map((method) => {
              const Icon = method.icon;
              const isSelected = paymentMethod === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-medium border transition ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-0.5" />
                  <span>{method.label}</span>
                </button>
              );
            })}
          </div>

          {/* Checkout & Hold Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={holdOrder}
              disabled={items.length === 0}
              className="px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 text-xs font-semibold text-zinc-700 dark:text-zinc-300 disabled:opacity-40 transition"
              title="Hold this cart order"
            >
              Hold
            </button>
            <button
              onClick={clearCart}
              disabled={items.length === 0}
              className="px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-semibold text-rose-600 dark:text-rose-400 disabled:opacity-40 transition"
              title="Clear Cart"
            >
              Clear
            </button>
            <button
              onClick={handleCheckout}
              disabled={items.length === 0}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold tracking-wide transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              Pay ${grandTotal.toFixed(2)}
            </button>
          </div>
        </div>
      </div>

      {/* Camera Barcode Modal */}
      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onDetected={handleBarcodeScanned}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={!!completedSale}
        onClose={() => setCompletedSale(null)}
        saleData={completedSale}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl text-xs font-semibold text-white shadow-xl transition-all ${
            toastMessage.isError ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          {toastMessage.msg}
        </div>
      )}
    </div>
  );
}
