'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
  UserPlus,
  Users,
  Smartphone,
  Keyboard,
  Layers,
  ChevronRight,
  Split,
  Percent,
} from 'lucide-react';
import { useCart } from '../../../context/CartContext';
import { useBarcodeScanner } from '../../../hooks/useBarcodeScanner';
import { playBeep } from '../../../lib/audio';
import { api } from '../../../lib/api';
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
    discountAmount,
    grandTotal,
    totalItemCount,
    orderDiscount,
    setOrderDiscount,
    discountPercent,
    setDiscountPercent,
    paymentMethod,
    setPaymentMethod,
    clearCart,
    holdOrder,
    restoreOrder,
    removeHeldOrder,
    heldOrders,
  } = useCart();

  // State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Scanner & Checkout UI
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [mobileTab, setMobileTab] = useState('catalog'); // 'catalog' | 'cart'

  // Variant Selection Modal
  const [activeProductForVariant, setActiveProductForVariant] = useState(null);

  // Checkout Payment States
  const [tenderAmount, setTenderAmount] = useState('');
  const [splitMethod, setSplitMethod] = useState('NONE'); // 'NONE' | 'SPLIT'
  const [splitCash, setSplitCash] = useState('');
  const [splitDigital, setSplitDigital] = useState('');
  const [digitalMethod, setDigitalMethod] = useState('CARD'); // 'CARD' | 'JAZZCASH' | 'EASYPAISA' | 'BANK_TRANSFER'
  const [orderNotes, setOrderNotes] = useState('');
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

  // Quick Customer State
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  const barcodeInputRef = useRef(null);

  function showToast(msg, isError = false) {
    setToastMessage({ msg, isError });
    setTimeout(() => setToastMessage(null), 3500);
  }

  // Handle scanned barcode from USB scanner, Camera, or Text submit
  async function handleBarcodeScanned(code) {
    if (!code) return;
    const clean = code.trim();

    try {
      const res = await api.scanBarcode(clean);
      if (res && res.variant) {
        const v = res.variant;
        addItem({
          variantId: v.id,
          productId: v.productId,
          name: v.name,
          category: v.category,
          sku: v.sku,
          barcode: v.barcode,
          price: v.price,
          costPrice: v.costPrice,
          stock: v.stock,
          size: v.size,
          color: v.color,
          colorHex: v.colorHex,
          fabric: v.fabric,
          image: v.image,
        });

        if (soundEnabled) playBeep('success');
        showToast(`Added: ${v.name} (${v.size} - ${v.color}) ₨${v.price.toLocaleString()}`);
        setBarcodeInput('');
      }
    } catch (err) {
      // Local search fallback across loaded products & variants
      let found = null;
      for (const p of products) {
        const v = p.variants?.find(
          (varItem) =>
            varItem.barcode === clean ||
            varItem.sku.toLowerCase() === clean.toLowerCase()
        );
        if (v) {
          found = { ...v, name: p.name, category: p.category?.name, image: p.image };
          break;
        }
      }

      if (found) {
        addItem({
          variantId: found.id,
          productId: found.productId,
          name: found.name,
          category: found.category,
          sku: found.sku,
          barcode: found.barcode,
          price: Number(found.sellingPrice),
          costPrice: Number(found.purchasePrice),
          stock: found.stockQuantity,
          size: found.size?.code || 'Free',
          color: found.color?.name || 'Assorted',
          colorHex: found.color?.hexCode,
          fabric: found.fabric,
          image: found.image,
        });
        if (soundEnabled) playBeep('success');
        showToast(`Added: ${found.name}`);
        setBarcodeInput('');
      } else {
        if (soundEnabled) playBeep('error');
        showToast(`Barcode "${clean}" not recognized in database.`, true);
      }
    }
  }

  // Load catalog data from MySQL
  async function loadData() {
    try {
      setLoading(true);
      const [prodRes, catRes, custRes] = await Promise.all([
        api.getProducts({ limit: 100 }),
        api.getCategories(),
        api.getCustomers(),
      ]);

      setProducts(prodRes.products || []);
      setCategories(catRes.categories || []);
      setCustomersList(custRes.customers || []);
    } catch (err) {
      console.error('Failed to load POS catalog:', err);
      showToast('Error loading inventory from server', true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const [prodRes, catRes, custRes] = await Promise.all([
          api.getProducts({ limit: 100 }),
          api.getCategories(),
          api.getCustomers(),
        ]);
        if (isMounted) {
          setProducts(prodRes.products || []);
          setCategories(catRes.categories || []);
          setCustomersList(custRes.customers || []);
        }
      } catch (err) {
        console.error('Failed to load POS catalog:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();

    // Handle URL query string ?scan=...
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const scanCode = params.get('scan');
      if (scanCode) {
        setTimeout(() => {
          handleBarcodeScanned(scanCode);
        }, 50);
      }
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // USB Hardware keyboard wedge scanner hook
  useBarcodeScanner(handleBarcodeScanned, {
    enabled: true,
    playSound: soundEnabled,
  });

  // Open Checkout Modal & set initial tender
  const openCheckoutModal = useCallback(() => {
    if (items.length === 0) {
      showToast('Cart is empty. Add garments first.', true);
      return;
    }
    setTenderAmount(grandTotal.toString());
    setSplitMethod('NONE');
    setSplitCash('');
    setSplitDigital('');
    setIsCheckoutOpen(true);
  }, [items.length, grandTotal]);

  // Global Keyboard Shortcuts (F1, F2, F4, F8)
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'F1') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      } else if (e.key === 'F2') {
        e.preventDefault();
        setIsCameraOpen((prev) => !prev);
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (items.length > 0 && confirm('Clear current cart?')) {
          clearCart();
        }
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (items.length > 0) openCheckoutModal();
      } else if (e.key === 'Escape') {
        setIsCheckoutOpen(false);
        setIsQuickCustomerOpen(false);
        setActiveProductForVariant(null);
        setIsShortcutsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, clearCart, openCheckoutModal]);

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        selectedCategory === 'ALL' ||
        p.category?.name === selectedCategory ||
        p.categoryId === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        p.name.toLowerCase().includes(q) ||
        p.variants?.some(
          (v) =>
            v.sku.toLowerCase().includes(q) ||
            v.barcode.includes(q) ||
            (v.fabric && v.fabric.toLowerCase().includes(q)) ||
            (v.color?.name && v.color.name.toLowerCase().includes(q))
        );
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  function handleManualBarcodeSubmit(e) {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    handleBarcodeScanned(barcodeInput.trim());
  }

  // Quick Customer Creation
  async function handleQuickCustomerSubmit(e) {
    e.preventDefault();
    if (!newCustName.trim()) return;
    try {
      const res = await api.createCustomer({
        name: newCustName.trim(),
        phone: newCustPhone.trim() || undefined,
        address: newCustAddress.trim() || undefined,
      });
      setCustomersList([res.customer, ...customersList]);
      setCustomer(res.customer);
      setIsQuickCustomerOpen(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustAddress('');
      showToast(`Customer "${res.customer.name}" registered and assigned.`);
    } catch (err) {
      showToast(err.message, true);
    }
  }

  // Complete Checkout API Call
  async function handleFinalCheckout() {
    try {
      setCheckoutSubmitting(true);

      const parsedTender = parseFloat(tenderAmount) || grandTotal;
      let paymentsPayload = [];

      if (splitMethod === 'SPLIT') {
        const cAmount = parseFloat(splitCash) || 0;
        const dAmount = parseFloat(splitDigital) || 0;
        paymentsPayload = [
          { paymentMethod: 'CASH', amount: cAmount, receivedAmount: cAmount },
          { paymentMethod: digitalMethod, amount: dAmount, receivedAmount: dAmount },
        ];
      } else {
        paymentsPayload = [
          {
            paymentMethod,
            amount: parsedTender,
            receivedAmount: parsedTender,
            changeAmount: Math.max(0, parsedTender - grandTotal),
          },
        ];
      }

      const salePayload = {
        customerId: customer?.id || null,
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.price,
          discountAmount: item.discount || 0,
        })),
        subtotal,
        discountAmount,
        discountPercent,
        taxAmount,
        taxPercent: 5,
        grandTotal,
        paidAmount: splitMethod === 'SPLIT' ? ((parseFloat(splitCash) || 0) + (parseFloat(splitDigital) || 0)) : parsedTender,
        payments: paymentsPayload,
        orderNotes: orderNotes || undefined,
      };

      const result = await api.createSale(salePayload);

      setCompletedSale(result.sale);
      setIsCheckoutOpen(false);
      clearCart();
      if (soundEnabled) playBeep('success');
      showToast(`Invoice ${result.sale.invoiceNumber} recorded successfully!`);

      // Reload products to reflect updated real-time stock
      loadData();
    } catch (err) {
      showToast(err.message || 'Checkout failed.', true);
      if (soundEnabled) playBeep('error');
    } finally {
      setCheckoutSubmitting(false);
    }
  }

  // Calculate change for checkout modal
  const computedPaid = splitMethod === 'SPLIT'
    ? ((parseFloat(splitCash) || 0) + (parseFloat(splitDigital) || 0))
    : (parseFloat(tenderAmount) || 0);
  const changeDue = Math.max(0, computedPaid - grandTotal);
  const remainingBalanceDue = Math.max(0, grandTotal - computedPaid);

  return (
    <div className="space-y-4">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div
          className={`fixed top-18 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-md border transition-all animate-in slide-in-from-top-4 duration-200 ${
            toastMessage.isError
              ? 'bg-rose-600/95 text-white border-rose-500'
              : 'bg-emerald-600/95 text-white border-emerald-500'
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

      {/* TOP DEDICATED POS BARCODE SCANNER TOOLBAR */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-3.5 sm:p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
          {/* Barcode input field */}
          <form onSubmit={handleManualBarcodeSubmit} className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-zinc-400">
                <Barcode className="w-4 h-4 text-purple-600" />
              </div>
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan Garment Hang-Tag Barcode or type SKU (e.g. 890123456001)... [F1]"
                data-barcode-target="true"
                className="w-full pl-9 pr-24 py-2 sm:py-2.5 text-xs sm:text-sm font-mono rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-600 transition"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 text-[11px] font-bold text-white bg-gradient-to-r from-purple-600 to-rose-600 hover:brightness-110 rounded-lg transition"
              >
                Scan Enter
              </button>
            </div>
          </form>

          {/* Scanner Buttons & Status */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsCameraOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 shadow-sm transition active:scale-95"
              title="Camera Scanner [F2]"
            >
              <Camera className="w-4 h-4" />
              <span>Camera Scan</span>
            </button>

            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>USB Wedge Ready</span>
            </div>

            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              className="p-2 sm:p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
              title={soundEnabled ? 'Scanner Beep: ON' : 'Scanner Beep: MUTED'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-purple-600" />
              ) : (
                <VolumeX className="w-4 h-4 text-zinc-400" />
              )}
            </button>

            <button
              onClick={() => setIsShortcutsOpen(true)}
              className="p-2 sm:p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
              title="Keyboard Shortcuts"
            >
              <Keyboard className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Quick Simulator Barcode Chips from Seeded Database */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-semibold text-zinc-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-rose-500" /> Quick Barcodes:
          </span>
          {[
            { label: 'SS Festive Lawn (S)', code: '890123456001' },
            { label: 'SS Festive Lawn (M)', code: '890123456002' },
            { label: 'MB Anarkali Gown (S)', code: '890123456006' },
            { label: 'Khaadi Kurti (M)', code: '890123456011' },
            { label: 'Bareeze Velvet Shawl', code: '890123456017' },
            { label: 'Nishat Nida Abaya', code: '890123456020' },
          ].map((chip) => (
            <button
              key={chip.code}
              type="button"
              onClick={() => handleBarcodeScanned(chip.code)}
              className="px-2.5 py-1 text-[11px] rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/80 whitespace-nowrap transition active:scale-95 flex items-center gap-1 font-medium"
            >
              <span>{chip.label}</span>
              <span className="font-mono text-[9px] text-zinc-400">({chip.code.slice(-4)})</span>
            </button>
          ))}
        </div>
      </div>

      {/* MOBILE SEGMENTED VIEW SWITCHER */}
      <div className="lg:hidden flex rounded-2xl bg-zinc-200 dark:bg-zinc-800 p-1">
        <button
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            mobileTab === 'catalog'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-purple-600" />
          <span>Garment Catalog ({filteredProducts.length})</span>
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
            <span className="text-purple-600 font-extrabold">Cart</span>
            {totalItemCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
                {totalItemCount}
              </span>
            )}
          </div>
          <span>• ₨ {grandTotal.toLocaleString()}</span>
        </button>
      </div>

      {/* MAIN CONTENT AREA: Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT COLUMN: Garment Catalog & Variants */}
        <div
          className={`lg:col-span-7 xl:col-span-8 flex flex-col bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden ${
            mobileTab === 'cart' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Search Bar */}
          <div className="p-3 sm:p-4 border-b border-zinc-200 dark:border-zinc-800 flex gap-2.5 items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search garment name, fabric, color, or brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          {/* Category Horizontal Pills */}
          <div className="px-3 sm:px-4 py-2.5 bg-zinc-50/60 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === 'ALL'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm font-bold'
                  : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'
              }`}
            >
              All Styles
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat.name
                    ? 'bg-gradient-to-r from-purple-600 to-rose-600 text-white shadow-sm font-bold'
                    : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Cards Grid with Variant Selector (like Image 1) */}
          <div className="p-3 sm:p-4 overflow-y-auto max-h-[calc(100vh-22rem)] min-h-[420px] grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 content-start">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-16 text-center text-zinc-400">
                <Shirt className="w-12 h-12 mx-auto mb-2 opacity-30 text-purple-400" />
                <p className="text-xs font-semibold">No garments found matching filter</p>
                <p className="text-[11px] text-zinc-500 mt-1">Try another keyword or category filter</p>
              </div>
            ) : (
              filteredProducts.map((prod) => {
                const variants = prod.variants || [];
                const totalStock = variants.reduce((sum, v) => sum + v.stockQuantity, 0);
                const displayPrice = variants[0]?.sellingPrice || prod.basePrice || 0;

                // Unique sizes and colors available for this product
                const availableSizes = [...new Set(variants.map((v) => v.size?.code || 'Free'))];
                const availableColors = variants.map((v) => ({
                  name: v.color?.name || 'Assorted',
                  hex: v.color?.hexCode || '#000000',
                }));

                return (
                  <div
                    key={prod.id}
                    className="group bg-white dark:bg-zinc-850/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-purple-500 dark:hover:border-purple-500 p-3 flex flex-col justify-between transition-all hover:shadow-md"
                  >
                    <div>
                      {/* Thumbnail & Tags */}
                      <div className="relative w-full h-36 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden mb-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={prod.image || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400'}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute top-2 right-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold shadow-sm ${
                              totalStock <= 0
                                ? 'bg-rose-500 text-white'
                                : totalStock < 10
                                ? 'bg-amber-500 text-white'
                                : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {totalStock <= 0 ? 'Out of Stock' : `${totalStock} in stock`}
                          </span>
                        </div>
                        <div className="absolute bottom-2 left-2">
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-black/60 text-white backdrop-blur-xs">
                            {prod.brand?.name || 'MR BILAL'}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                        {prod.name}
                      </h4>

                      {/* Size Pills */}
                      <div className="mt-2 flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] text-zinc-400 font-semibold mr-1">Size:</span>
                        {availableSizes.slice(0, 4).map((sz, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                          >
                            {sz}
                          </span>
                        ))}
                        {availableSizes.length > 4 && (
                          <span className="text-[9px] text-zinc-400 font-bold">
                            +{availableSizes.length - 4}
                          </span>
                        )}
                      </div>

                      {/* Color Swatches */}
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="text-[10px] text-zinc-400 font-semibold mr-1">Colors:</span>
                        {availableColors.slice(0, 5).map((col, cIdx) => (
                          <span
                            key={cIdx}
                            title={col.name}
                            style={{ backgroundColor: col.hex }}
                            className="w-3 h-3 rounded-full border border-black/20 shadow-xs"
                          ></span>
                        ))}
                      </div>
                    </div>

                    {/* Price and Add button */}
                    <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-400 block -mb-0.5">Starting at</span>
                        <span className="text-sm font-extrabold text-purple-700 dark:text-purple-400">
                          ₨ {Number(displayPrice).toLocaleString()}
                        </span>
                      </div>

                      <button
                        onClick={() => setActiveProductForVariant(prod)}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1 transition shadow-sm active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Select</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Cart & Checkout Panel */}
        <div
          className={`lg:col-span-5 xl:col-span-4 flex flex-col bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden ${
            mobileTab === 'catalog' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Customer Selection Header */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>POS Cart</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-extrabold">
                  {totalItemCount} {totalItemCount === 1 ? 'garment' : 'garments'}
                </span>
              </h3>

              {/* Parked Carts */}
              {heldOrders.length > 0 && (
                <button
                  onClick={() => restoreOrder(heldOrders[0].id)}
                  className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-bold hover:underline"
                >
                  <Clock className="w-3.5 h-3.5" /> Recall Cart ({heldOrders.length})
                </button>
              )}
            </div>

            {/* Customer Dropdown + Quick Add Button */}
            <div className="flex items-center gap-2">
              <select
                value={customer?.id || ''}
                onChange={(e) => {
                  const c = customersList.find((item) => item.id === e.target.value);
                  setCustomer(c || null);
                }}
                className="flex-1 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
              >
                <option value="">Walk-in Customer (Default)</option>
                {customersList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} • {c.phone || 'No phone'} (Points: {c.loyaltyPoints || 0})
                  </option>
                ))}
              </select>

              <button
                onClick={() => setIsQuickCustomerOpen(true)}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-purple-600 dark:text-purple-400 transition"
                title="Quick Add Customer"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 p-3 overflow-y-auto max-h-[300px] min-h-[220px] space-y-2">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400">
                <Sparkles className="w-10 h-10 mb-2 stroke-1 text-purple-400/60 animate-pulse" />
                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Cart is empty</p>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-xs">
                  Scan barcode with USB scanner, tap Camera Scan, or select garment from the catalogue.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-850/40 flex flex-col gap-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono mt-0.5">
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">
                          [{item.size}]
                        </span>
                        <span>• {item.color}</span>
                        <span>• SKU: {item.sku}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {/* Stepper */}
                    <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 overflow-hidden shadow-xs">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition text-zinc-600 dark:text-zinc-300"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition text-zinc-600 dark:text-zinc-300"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price Calculation */}
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                        ₨ {(item.price * item.quantity).toLocaleString()}
                      </span>
                      <span className="block text-[9px] text-zinc-400">
                        ₨ {item.price.toLocaleString()} ea
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing Summary & Checkout Drawer */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-950/60 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Subtotal</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  ₨ {subtotal.toLocaleString()}
                </span>
              </div>

              {/* Order Discount Input (%) */}
              <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1">
                  <Percent className="w-3 h-3 text-rose-500" /> Discount (%)
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent || ''}
                  onChange={(e) => setDiscountPercent(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-16 px-2 py-0.5 text-right font-mono text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                />
              </div>

              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Sales Tax / VAT (5%)</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  ₨ {taxAmount.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-sm font-extrabold text-zinc-900 dark:text-zinc-100 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <span>Grand Total</span>
                <span className="text-base text-purple-700 dark:text-purple-400">
                  ₨ {grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Hold Order & Proceed to Payment Buttons */}
            <div className="flex gap-2 pt-1">
              {items.length > 0 && (
                <button
                  onClick={holdOrder}
                  className="p-3 rounded-2xl border border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition active:scale-95"
                  title="Park / Hold current order"
                >
                  <Clock className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={openCheckoutModal}
                disabled={items.length === 0}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-rose-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-purple-500/20 transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>Proceed to Payment [F8]</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* VARIANT SELECTOR MODAL (Size x Color Selection when clicking a garment) */}
      {activeProductForVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-5 border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                  Select Size & Color Variant
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">{activeProductForVariant.name}</p>
              </div>
              <button
                onClick={() => setActiveProductForVariant(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Variant rows */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {(activeProductForVariant.variants || []).map((v) => {
                const isOutOfStock = v.stockQuantity <= 0;
                return (
                  <div
                    key={v.id}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      isOutOfStock
                        ? 'opacity-40 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850'
                        : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-purple-500'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-extrabold bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100">
                          {v.size?.code || 'Free'}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          <span
                            style={{ backgroundColor: v.color?.hexCode || '#000000' }}
                            className="w-3 h-3 rounded-full border border-black/20"
                          ></span>
                          <span>{v.color?.name || 'Assorted'}</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-1">
                        SKU: {v.sku} • Stock: {v.stockQuantity}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-extrabold text-purple-700 dark:text-purple-400">
                        ₨ {Number(v.sellingPrice).toLocaleString()}
                      </span>

                      <button
                        disabled={isOutOfStock}
                        onClick={() => {
                          addItem({
                            variantId: v.id,
                            productId: activeProductForVariant.id,
                            name: activeProductForVariant.name,
                            category: activeProductForVariant.category?.name,
                            sku: v.sku,
                            barcode: v.barcode,
                            price: Number(v.sellingPrice),
                            costPrice: Number(v.purchasePrice),
                            stock: v.stockQuantity,
                            size: v.size?.code || 'Free',
                            color: v.color?.name || 'Assorted',
                            colorHex: v.color?.hexCode,
                            fabric: v.fabric,
                            image: activeProductForVariant.image,
                          });
                          if (soundEnabled) playBeep('success');
                          showToast(`Added: ${activeProductForVariant.name} [${v.size?.code}]`);
                          setActiveProductForVariant(null);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-400 text-white text-xs font-bold transition active:scale-95 shadow-xs"
                      >
                        {isOutOfStock ? 'Sold Out' : '+ Add'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL: Cash Tender, Multi-Payment, JazzCash/Easypaisa, Split, Credit */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>Fast Checkout Terminal</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold uppercase">
                    PKR (₨)
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Client: {customer?.name || 'Walk-in Customer'} • {totalItemCount} garments
                </p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Display */}
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                  Net Amount Payable
                </span>
                <p className="text-2xl font-black text-purple-950 dark:text-purple-200">
                  ₨ {grandTotal.toLocaleString()}
                </p>
              </div>

              {/* Mode Toggle: Single vs Split Payment */}
              <button
                type="button"
                onClick={() => setSplitMethod(splitMethod === 'NONE' ? 'SPLIT' : 'NONE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                  splitMethod === 'SPLIT'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                }`}
              >
                <Split className="w-3.5 h-3.5" />
                <span>{splitMethod === 'SPLIT' ? 'Split Mode: ON' : 'Enable Split Payment'}</span>
              </button>
            </div>

            {splitMethod === 'NONE' ? (
              <div className="space-y-4">
                {/* Payment Methods Grid */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                    Select Payment Method:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'CASH', label: 'Cash', icon: Banknote },
                      { id: 'CARD', label: 'Card / Debit', icon: CreditCard },
                      { id: 'JAZZCASH', label: 'JazzCash', icon: Smartphone },
                      { id: 'EASYPAISA', label: 'Easypaisa', icon: Smartphone },
                      { id: 'BANK_TRANSFER', label: 'Bank Transfer', icon: QrCode },
                      { id: 'CREDIT', label: 'Store Credit', icon: Users },
                    ].map((m) => {
                      const Icon = m.icon;
                      const isSelected = paymentMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20'
                              : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-750'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tender Input for Cash / Card */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Tendered Amount (PKR ₨):
                  </label>
                  <input
                    type="number"
                    value={tenderAmount}
                    onChange={(e) => setTenderAmount(e.target.value)}
                    placeholder="Enter cash received..."
                    className="w-full text-base font-mono font-bold px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />

                  {/* Quick Tender Bills Buttons for PKR */}
                  <div className="flex gap-1.5 mt-2">
                    {[
                      { label: 'Exact', amt: grandTotal },
                      { label: '₨ 1,000', amt: 1000 },
                      { label: '₨ 2,000', amt: 2000 },
                      { label: '₨ 5,000', amt: 5000 },
                      { label: '₨ 10,000', amt: 10000 },
                    ].map((btn, bIdx) => (
                      <button
                        key={bIdx}
                        type="button"
                        onClick={() => setTenderAmount(btn.amt.toString())}
                        className="flex-1 py-1 px-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px] font-bold font-mono transition"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* SPLIT PAYMENT MODE */
              <div className="space-y-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800">
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Split Payment Breakdown:
                </p>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 block mb-1">
                    Portion 1: Cash Paid (PKR ₨)
                  </label>
                  <input
                    type="number"
                    value={splitCash}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSplitCash(val);
                      const remainder = Math.max(0, grandTotal - (parseFloat(val) || 0));
                      setSplitDigital(remainder.toString());
                    }}
                    placeholder="e.g. 2000"
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-semibold text-zinc-500">
                      Portion 2: Digital Payment (PKR ₨)
                    </label>
                    <select
                      value={digitalMethod}
                      onChange={(e) => setDigitalMethod(e.target.value)}
                      className="text-[10px] font-bold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-0.5"
                    >
                      <option value="CARD">Card / Debit</option>
                      <option value="JAZZCASH">JazzCash</option>
                      <option value="EASYPAISA">Easypaisa</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                  </div>
                  <input
                    type="number"
                    value={splitDigital}
                    onChange={(e) => setSplitDigital(e.target.value)}
                    placeholder="Remaining digital portion..."
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  />
                </div>
              </div>
            )}

            {/* Reconciliation Live Status Box */}
            <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-xs space-y-1">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
                <span>Total Received:</span>
                <span className="font-bold font-mono">₨ {computedPaid.toLocaleString()}</span>
              </div>
              {changeDue > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-extrabold text-sm pt-1 border-t border-zinc-200 dark:border-zinc-700">
                  <span>Change to Return:</span>
                  <span className="font-mono">₨ {changeDue.toLocaleString()}</span>
                </div>
              )}
              {remainingBalanceDue > 0 && (
                <div className="flex justify-between text-amber-600 dark:text-amber-400 font-extrabold text-xs pt-1 border-t border-zinc-200 dark:border-zinc-700">
                  <span>Credit / Balance Due:</span>
                  <span className="font-mono">₨ {remainingBalanceDue.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Order Notes */}
            <div>
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Optional invoice notes (e.g. VIP client, altered sleeve length)..."
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>

            {/* Final Action Buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="py-3 px-4 rounded-2xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                Back to Cart
              </button>

              <button
                type="button"
                disabled={checkoutSubmitting}
                onClick={handleFinalCheckout}
                className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-purple-600 via-rose-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-purple-500/20 transition active:scale-98 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {checkoutSubmitting ? (
                  <span>Processing SQL Transaction...</span>
                ) : (
                  <>
                    <span>Confirm Sale & Print Bill</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD CUSTOMER MODAL */}
      {isQuickCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <form
            onSubmit={handleQuickCustomerSubmit}
            className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 space-y-3.5 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-purple-600" />
                <span>Quick Register Customer</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsQuickCustomerOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-500 block mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
                placeholder="e.g. Dr. Hina Tahir"
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-500 block mb-1">
                Phone Number (WhatsApp)
              </label>
              <input
                type="text"
                value={newCustPhone}
                onChange={(e) => setNewCustPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-500 block mb-1">Address</label>
              <input
                type="text"
                value={newCustAddress}
                onChange={(e) => setNewCustAddress(e.target.value)}
                placeholder="DHA Phase 5, Lahore"
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsQuickCustomerOpen(false)}
                className="py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition"
              >
                Save & Select Customer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KEYBOARD SHORTCUTS REFERENCE MODAL */}
      {isShortcutsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 space-y-3.5 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-purple-600" />
                <span>POS Keyboard Hotkeys</span>
              </h3>
              <button
                onClick={() => setIsShortcutsOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { key: 'F1', desc: 'Focus Barcode Scanner Input' },
                { key: 'F2', desc: 'Open Live Camera Scanner' },
                { key: 'F4', desc: 'Clear Active Cart' },
                { key: 'F8', desc: 'Launch Fast Checkout' },
                { key: 'Esc', desc: 'Close any active modal' },
              ].map((hk, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800"
                >
                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 text-purple-600 dark:text-purple-400">
                    {hk.key}
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-300">{hk.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Live Camera Scanner Modal */}
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
    </div>
  );
}
