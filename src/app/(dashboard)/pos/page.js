'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
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
  Volume2,
  VolumeX,
  CheckCircle,
  X,
  ShoppingBag,
  ArrowRight,
  Filter,
  Shirt,
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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [mobileTab, setMobileTab] = useState('catalog'); // 'catalog' or 'cart'
  const barcodeInputRef = useRef(null);

  // Handle URL query string ?scan=... if opened from header scanner
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const scanCode = params.get('scan');
      if (scanCode) {
        handleBarcodeScanned(scanCode);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function showToast(msg, isError = false) {
    setToastMessage({ msg, isError });
    setTimeout(() => setToastMessage(null), 3500);
  }

  // Handle barcode scanned from USB hardware scanner, Camera, or Quick Input
  function handleBarcodeScanned(sku) {
    if (!sku) return;
    const cleanSku = sku.trim();

    const product = INITIAL_PRODUCTS.find(
      (p) =>
        p.sku.toLowerCase() === cleanSku.toLowerCase() ||
        p.id.toLowerCase() === cleanSku.toLowerCase()
    );

    if (product) {
      addItem(product);
      if (soundEnabled) playBeep('success');
      showToast(`Added: ${product.name} ($${product.price.toFixed(2)})`);
      setBarcodeInput('');
    } else {
      if (soundEnabled) playBeep('error');
      showToast(`No ladies garment found for SKU / Barcode: "${cleanSku}"`, true);
    }
  }

  // USB / Bluetooth Hardware scanner keyboard hook
  useBarcodeScanner(handleBarcodeScanned, {
    enabled: true,
    playSound: soundEnabled,
  });

  // Filter products by category and search text
  const filteredProducts = useMemo(() => {
    return INITIAL_PRODUCTS.filter((product) => {
      const matchesCategory =
        selectedCategory === 'ALL' || product.category === selectedCategory;
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.includes(searchQuery) ||
        (product.color && product.color.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  function handleManualBarcodeSubmit(e) {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    handleBarcodeScanned(barcodeInput.trim());
  }

  // Complete sale checkout
  function handleCheckout() {
    if (items.length === 0) {
      showToast('Cart is empty. Please add garments to checkout.', true);
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
    if (soundEnabled) playBeep('success');
  }

  return (
    <div className="space-y-4">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`fixed top-18 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-md border transition-all animate-in slide-in-from-top-4 duration-200 ${
            toastMessage.isError
              ? 'bg-rose-500/95 text-white border-rose-400'
              : 'bg-emerald-600/95 text-white border-emerald-400'
          }`}
        >
          {toastMessage.isError ? (
            <X className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* TOP DEDICATED BARCODE SCANNER TOOLBAR */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3 sm:p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Barcode input field with scanner trigger */}
          <form
            onSubmit={handleManualBarcodeSubmit}
            className="flex-1 flex items-center gap-2"
          >
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-zinc-400">
                <Barcode className="w-4 h-4 text-pink-500" />
              </div>
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan or enter Barcode / SKU (e.g. 890123456001)..."
                data-barcode-target="true"
                className="w-full pl-9 pr-20 py-2 sm:py-2.5 text-xs sm:text-sm font-mono rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-bold text-white bg-pink-600 hover:bg-pink-700 rounded-lg transition"
              >
                Scan Enter
              </button>
            </div>
          </form>

          {/* Scanner Buttons & Status */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Live Camera Scanner Modal Trigger */}
            <button
              onClick={() => setIsCameraOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 shadow-md shadow-pink-500/20 transition active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>Camera Scan</span>
            </button>

            {/* Hardware Scanner Ready Badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>USB / BT Ready</span>
            </div>

            {/* Sound Beeper Toggle */}
            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              className={`p-2 sm:p-2.5 rounded-xl border transition ${
                soundEnabled
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700'
                  : 'bg-zinc-100/50 dark:bg-zinc-800/50 text-zinc-400 border-zinc-200 dark:border-zinc-800'
              }`}
              title={soundEnabled ? 'Scanner Beep: ON' : 'Scanner Beep: MUTED'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-pink-500" />
              ) : (
                <VolumeX className="w-4 h-4 text-zinc-400" />
              )}
            </button>
          </div>
        </div>

        {/* Quick Simulator Barcode Chips */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-pink-500" /> Quick Barcode Test:
          </span>
          {[
            { label: 'Silk Kurti', sku: '890123456001' },
            { label: 'Bridal Lehenga', sku: '890123456003' },
            { label: 'Organza Anarkali', sku: '890123456004' },
            { label: 'Chiffon Dupatta', sku: '890123456005' },
            { label: '3-Pc Suit', sku: '890123456007' },
          ].map((chip) => (
            <button
              key={chip.sku}
              type="button"
              onClick={() => handleBarcodeScanned(chip.sku)}
              className="px-2.5 py-1 text-[11px] rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-pink-50 dark:hover:bg-pink-950/40 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/80 whitespace-nowrap transition active:scale-95 flex items-center gap-1 font-medium"
            >
              <span>{chip.label}</span>
              <span className="font-mono text-[9px] text-zinc-400">({chip.sku.slice(-4)})</span>
            </button>
          ))}
        </div>
      </div>

      {/* MOBILE SEGMENTED VIEW SWITCHER (Catalog vs Cart) */}
      <div className="lg:hidden flex rounded-2xl bg-zinc-200 dark:bg-zinc-800/80 p-1">
        <button
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            mobileTab === 'catalog'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-pink-500" />
          <span>Garments ({filteredProducts.length})</span>
        </button>

        <button
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            mobileTab === 'cart'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400'
          }`}
        >
          <div className="relative">
            <span className="text-indigo-500 font-extrabold">Cart</span>
            {totalItemCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-pink-500 text-white text-[10px]">
                {totalItemCount}
              </span>
            )}
          </div>
          <span>• ${grandTotal.toFixed(2)}</span>
        </button>
      </div>

      {/* MAIN CONTENT AREA: Split View on Desktop, Tabbed on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Garment Catalog & Filter (8 cols on lg) */}
        <div
          className={`lg:col-span-7 xl:col-span-8 flex flex-col bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden ${
            mobileTab === 'cart' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Filter & Search Bar */}
          <div className="p-3 sm:p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-2.5 items-center justify-between">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search garment name, fabric, color..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          {/* Category Horizontal Pills */}
          <div className="px-3 sm:px-4 py-2.5 bg-zinc-50/60 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === 'ALL'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                  : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'
              }`}
            >
              All Items
            </button>
            {INITIAL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat.name
                    ? 'bg-gradient-to-r from-pink-600 to-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="p-3 sm:p-4 overflow-y-auto max-h-[calc(100vh-22rem)] min-h-[380px] grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3.5 content-start">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-12 text-center text-zinc-400">
                <Shirt className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">No garments match your search</p>
                <p className="text-[11px] text-zinc-500 mt-1">Try another keyword or category filter</p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => {
                    addItem(product);
                    if (soundEnabled) playBeep('success');
                    showToast(`Added: ${product.name}`);
                  }}
                  className="group relative bg-white dark:bg-zinc-850/60 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/80 hover:border-pink-500 dark:hover:border-pink-500 rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition-all hover:shadow-lg active:scale-[0.98]"
                >
                  <div>
                    {/* Top tags */}
                    <div className="flex items-center justify-between text-[10px] mb-1.5">
                      <span className="font-semibold text-zinc-500 dark:text-zinc-400 truncate max-w-[70%]">
                        {product.category}
                      </span>
                      <span
                        className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${
                          product.stock < 10
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {product.stock} left
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 line-clamp-2 leading-snug mb-1 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition">
                      {product.name}
                    </h4>

                    {/* Size and Barcode */}
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mt-1">
                      <span className="px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-750 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold">
                        {product.size || 'M'}
                      </span>
                      <span className="truncate">
                        #{product.sku.slice(-4)}
                      </span>
                    </div>
                  </div>

                  {/* Price & Quick Add Button */}
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-sm font-extrabold text-pink-600 dark:text-pink-400">
                      ${product.price.toFixed(2)}
                    </span>
                    <span className="p-1.5 rounded-xl bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 group-hover:bg-gradient-to-r group-hover:from-pink-600 group-hover:to-indigo-600 group-hover:text-white transition shadow-sm">
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Cart & Checkout Panel (5 cols on lg) */}
        <div
          className={`lg:col-span-5 xl:col-span-4 flex flex-col bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden ${
            mobileTab === 'catalog' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Customer & Current Order Header */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Current Order</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 font-extrabold">
                  {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                </span>
              </h3>

              {/* Held Orders Recall */}
              {heldOrders.length > 0 && (
                <button
                  onClick={() => restoreOrder(heldOrders[0].id)}
                  className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-bold hover:underline"
                >
                  <Clock className="w-3.5 h-3.5" /> Recall ({heldOrders.length})
                </button>
              )}
            </div>

            {/* Customer Dropdown */}
            <select
              value={customer?.id || ''}
              onChange={(e) => {
                const cust = INITIAL_CUSTOMERS.find((c) => c.id === e.target.value);
                setCustomer(cust || null);
              }}
              className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium"
            >
              <option value="">Walk-in Customer (Default)</option>
              {INITIAL_CUSTOMERS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} • {c.phone}
                </option>
              ))}
            </select>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 p-3 overflow-y-auto max-h-[320px] min-h-[220px] space-y-2">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400">
                <Sparkles className="w-10 h-10 mb-2 stroke-1 text-pink-400/60 animate-pulse" />
                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Cart is empty</p>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-xs">
                  Scan barcode with USB scanner, tap Camera Scan, or select garments from the catalog.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-850/40 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        ${item.price.toFixed(2)} ea • SKU: {item.sku.slice(-4)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {/* Stepper */}
                    <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 overflow-hidden shadow-sm">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition text-zinc-600 dark:text-zinc-300"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition text-zinc-600 dark:text-zinc-300"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Item Total */}
                    <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing Summary & Checkout */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-950/60 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
            {/* Calculation details */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Subtotal</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Sales Tax / VAT (5%)</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  ${taxAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400">
                <span>Order Discount (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={orderDiscount || ''}
                  onChange={(e) => setOrderDiscount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-16 px-2 py-0.5 text-right font-mono text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                />
              </div>
              <div className="flex justify-between text-sm font-extrabold text-zinc-900 dark:text-zinc-100 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <span>Grand Total</span>
                <span className="text-base text-pink-600 dark:text-pink-400">
                  ${grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'cash', label: 'Cash', icon: Banknote },
                { id: 'card', label: 'Card', icon: CreditCard },
                { id: 'qr', label: 'Raast / QR', icon: QrCode },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition flex flex-col items-center gap-1 ${
                      isSelected
                        ? 'bg-pink-600 text-white border-pink-600 shadow-md shadow-pink-500/20'
                        : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-750'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Action Buttons: Hold Order & Checkout */}
            <div className="flex gap-2 pt-1">
              {items.length > 0 && (
                <button
                  onClick={holdOrder}
                  className="p-3 rounded-2xl border border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition"
                  title="Hold current order"
                >
                  <Clock className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={handleCheckout}
                disabled={items.length === 0}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-pink-500/20 transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>Checkout & Print Bill</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE FLOATING STICKY CART BAR (When viewing catalog on mobile and cart has items) */}
      {mobileTab === 'catalog' && totalItemCount > 0 && (
        <div className="lg:hidden fixed bottom-16 left-3 right-3 z-30 animate-in slide-in-from-bottom-3 duration-200">
          <button
            onClick={() => setMobileTab('cart')}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 text-white shadow-2xl shadow-pink-600/40 flex items-center justify-between font-bold text-xs sm:text-sm active:scale-98"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-extrabold text-xs">
                {totalItemCount}
              </span>
              <span>{totalItemCount === 1 ? 'Garment' : 'Garments'} Added</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold">${grandTotal.toFixed(2)}</span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-lg flex items-center gap-1">
                Checkout <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </button>
        </div>
      )}

      {/* MODALS */}
      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onDetected={handleBarcodeScanned}
      />

      <ReceiptModal
        isOpen={!!completedSale}
        onClose={() => setCompletedSale(null)}
        saleData={completedSale}
      />
    </div>
  );
}
