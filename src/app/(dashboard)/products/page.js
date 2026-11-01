'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Barcode as BarcodeIcon,
  Printer,
  Camera,
  Edit,
  Trash2,
  Tag,
  Sparkles,
  Filter,
  Shirt,
  Boxes,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  Check,
} from 'lucide-react';
import { api } from '../../../lib/api';
import BarcodeLabelModal from '../../../components/pos/BarcodeLabelModal';
import CameraScannerModal from '../../../components/pos/CameraScannerModal';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sizesList, setSizesList] = useState([]);
  const [colorsList, setColorsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [expandedProduct, setExpandedProduct] = useState(null);

  // Modals
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState(null);
  const [selectedBarcodeVariant, setSelectedBarcodeVariant] = useState(null);
  const [isCameraScanOpen, setIsCameraScanOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Product Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCatId, setNewCatId] = useState('');
  const [newBrandId, setNewBrandId] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newBasePrice, setNewBasePrice] = useState('');
  const [newPurchasePrice, setNewPurchasePrice] = useState('');
  const [newFabric, setNewFabric] = useState('Lawn');
  const [newSeason, setNewSeason] = useState('Summer');
  const [selectedSizes, setSelectedSizes] = useState(['S', 'M', 'L']);
  const [selectedColors, setSelectedColors] = useState([]);

  async function loadData() {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.getProducts({ limit: 100 }),
        api.getCategories(),
      ]);

      setProducts(prodRes.products || []);
      setCategories(catRes.categories || []);
      setBrands(catRes.brands || []);
      setSizesList(catRes.sizes || []);
      setColorsList(catRes.colors || []);

      if (catRes.categories?.length > 0 && !newCatId) {
        setNewCatId(catRes.categories[0].id);
      }
      if (catRes.brands?.length > 0 && !newBrandId) {
        setNewBrandId(catRes.brands[0].id);
      }
      if (catRes.colors?.length > 0 && selectedColors.length === 0) {
        setSelectedColors([catRes.colors[0].id]);
      }
    } catch (err) {
      console.error('Failed to load products catalog:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleBarcodeDetected(code) {
    setSearch(code);
    setIsCameraScanOpen(false);
  }

  // Toggle size selection in matrix
  function toggleSize(code) {
    setSelectedSizes((prev) =>
      prev.includes(code) ? prev.filter((s) => s !== code) : [...prev, code]
    );
  }

  // Toggle color selection in matrix
  function toggleColor(id) {
    setSelectedColors((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  // Submit New Product with Variant Matrix Generator
  async function handleCreateProduct(e) {
    e.preventDefault();
    if (!newTitle.trim() || !newCatId || !newBasePrice) {
      alert('Please fill out Product Name, Category, and Price.');
      return;
    }

    try {
      setSubmitting(true);

      // Generate variant combinations for each selected Size x Color
      const variantsToCreate = [];
      const retail = parseFloat(newBasePrice) || 0;
      const purchase = parseFloat(newPurchasePrice) || retail * 0.6;

      const activeSizes = sizesList.filter((s) => selectedSizes.includes(s.code));
      const activeColors = colorsList.filter((c) => selectedColors.includes(c.id));

      if (activeSizes.length === 0 || activeColors.length === 0) {
        variantsToCreate.push({
          sizeId: null,
          colorId: null,
          fabric: newFabric,
          season: newSeason,
          sellingPrice: retail,
          purchasePrice: purchase,
          wholesalePrice: retail * 0.85,
          stockQuantity: 10,
        });
      } else {
        for (const s of activeSizes) {
          for (const c of activeColors) {
            variantsToCreate.push({
              sizeId: s.id,
              colorId: c.id,
              fabric: newFabric,
              season: newSeason,
              sellingPrice: retail,
              purchasePrice: purchase,
              wholesalePrice: retail * 0.85,
              stockQuantity: 12,
            });
          }
        }
      }

      await api.createProduct({
        name: newTitle.trim(),
        categoryId: newCatId,
        brandId: newBrandId || null,
        description: newDescription.trim() || null,
        image: newImage.trim() || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80',
        basePrice: retail,
        variants: variantsToCreate,
      });

      setIsAddModalOpen(false);
      setNewTitle('');
      setNewBasePrice('');
      setNewPurchasePrice('');
      setNewDescription('');
      setNewImage('');
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to create product.');
    } finally {
      setSubmitting(false);
    }
  }

  // Filter products
  const filtered = products.filter((p) => {
    const matchCat = categoryFilter === 'ALL' || p.categoryId === categoryFilter || p.category?.name === categoryFilter;
    const q = search.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(q) ||
      p.slug.includes(q) ||
      p.variants?.some((v) => v.sku.toLowerCase().includes(q) || v.barcode.includes(q));
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Clothing Product Management</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              {products.length} Styles
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Manage ladies fashion wear, size & color matrix variations, barcodes, and prices in PKR.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsCameraScanOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 transition"
          >
            <Camera className="w-4 h-4 text-rose-500" />
            <span>Find by Barcode</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 via-rose-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-purple-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Fashion Garment</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search garment style, SKU, or Barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              categoryFilter === 'ALL'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                categoryFilter === c.name
                  ? 'bg-gradient-to-r from-purple-600 to-rose-600 text-white font-bold'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products & Variants Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-zinc-50/80 dark:bg-zinc-850/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-[11px] font-bold">
                <th className="py-3 px-4">Garment Item</th>
                <th className="py-3 px-4">Category & Brand</th>
                <th className="py-3 px-4">Retail Price</th>
                <th className="py-3 px-4">Variants Matrix</th>
                <th className="py-3 px-4">Total Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    <Shirt className="w-8 h-8 mx-auto mb-2 opacity-30 text-purple-400" />
                    No garments found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => {
                  const variants = prod.variants || [];
                  const totalStock = variants.reduce((sum, v) => sum + v.stockQuantity, 0);
                  const isExpanded = expandedProduct === prod.id;

                  return (
                    <>
                      <tr
                        key={prod.id}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30 transition group"
                      >
                        {/* Thumbnail & Title */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={prod.image || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=200'}
                                alt={prod.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                                {prod.name}
                              </p>
                              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                                Slug: {prod.slug}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Category & Brand */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-zinc-700 dark:text-zinc-300 block">
                            {prod.category?.name || 'Pret'}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {prod.brand?.name || 'Boutique Collection'}
                          </span>
                        </td>

                        {/* Price in PKR */}
                        <td className="py-3 px-4">
                          <span className="font-extrabold text-sm text-purple-700 dark:text-purple-400 font-mono">
                            ₨ {Number(prod.basePrice).toLocaleString()}
                          </span>
                        </td>

                        {/* Variants Breakdown */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setExpandedProduct(isExpanded ? null : prod.id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-500/20 hover:bg-purple-100 transition"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>{variants.length} Variants</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        </td>

                        {/* Total Stock */}
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-xl text-xs font-extrabold font-mono ${
                              totalStock <= 0
                                ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                                : totalStock < 10
                                ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            }`}
                          >
                            {totalStock} units
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedBarcodeProduct(prod);
                                setSelectedBarcodeVariant(variants[0] || null);
                              }}
                              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-purple-600 hover:border-purple-600 transition"
                              title="Print Barcode Tag"
                            >
                              <BarcodeIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Variant Matrix Detail Table */}
                      {isExpanded && (
                        <tr className="bg-zinc-50/90 dark:bg-zinc-950/60">
                          <td colSpan={6} className="p-4 pl-12 border-b border-zinc-200 dark:border-zinc-800">
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3 space-y-2">
                              <div className="flex items-center justify-between text-xs font-bold text-zinc-500 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                                <span>Specific Size & Color Combinations ({variants.length})</span>
                                <span className="text-[10px] text-zinc-400">Independent SKUs and Barcodes</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {variants.map((v) => (
                                  <div
                                    key={v.id}
                                    className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 flex items-center justify-between gap-2"
                                  >
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-mono font-extrabold text-xs px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100">
                                          {v.size?.code || 'Free'}
                                        </span>
                                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                          {v.color?.name || 'Assorted'}
                                        </span>
                                      </div>
                                      <div className="text-[10px] font-mono text-zinc-400 mt-1">
                                        SKU: {v.sku}
                                      </div>
                                      <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400">
                                        Barcode: {v.barcode}
                                      </div>
                                    </div>

                                    <div className="text-right">
                                      <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 block">
                                        ₨ {Number(v.sellingPrice).toLocaleString()}
                                      </span>
                                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                        {v.stockQuantity} in stock
                                      </span>
                                      <button
                                        onClick={() => {
                                          setSelectedBarcodeProduct(prod);
                                          setSelectedBarcodeVariant(v);
                                        }}
                                        className="mt-1 p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 block ml-auto"
                                        title="Print Tag for this Variant"
                                      >
                                        <Printer className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD NEW PRODUCT MODAL (Size x Color Variant Matrix Generator) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 my-auto animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Shirt className="w-5 h-5 text-purple-600" />
                  <span>Register New Fashion Garment</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Generates full combination variant matrix with unique SKUs and Barcodes automatically.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              {/* Product Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Garment Title / Style Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Lawn Embroidered 3-Piece Festive"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Category *
                  </label>
                  <select
                    value={newCatId}
                    onChange={(e) => setNewCatId(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Brand & Fabric */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Brand / Designer
                  </label>
                  <select
                    value={newBrandId}
                    onChange={(e) => setNewBrandId(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-medium"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Fabric Type
                  </label>
                  <select
                    value={newFabric}
                    onChange={(e) => setNewFabric(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-medium"
                  >
                    {['Lawn', 'Cotton', 'Chiffon', 'Silk', 'Khaddar', 'Linen', 'Velvet', 'Organza'].map(
                      (f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Season
                  </label>
                  <select
                    value={newSeason}
                    onChange={(e) => setNewSeason(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-medium"
                  >
                    {['Summer', 'Winter', 'Festive', 'All Season'].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing & Image */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Retail Selling Price (PKR ₨) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newBasePrice}
                    onChange={(e) => setNewBasePrice(e.target.value)}
                    placeholder="e.g. 8950"
                    className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Purchase Cost (PKR ₨)
                  </label>
                  <input
                    type="number"
                    value={newPurchasePrice}
                    onChange={(e) => setNewPurchasePrice(e.target.value)}
                    placeholder="e.g. 5200"
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Photo URL
                  </label>
                  <input
                    type="text"
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                  />
                </div>
              </div>

              {/* VARIANT MATRIX BUILDER: Sizes & Colors Checkboxes */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-400">
                    Variant Combinations Matrix Generator
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500">
                    Generates: {selectedSizes.length * selectedColors.length} unique variant SKUs
                  </span>
                </div>

                {/* Size options */}
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 block mb-1.5">
                    Select Available Sizes:
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {sizesList.map((sz) => {
                      const isSelected = selectedSizes.includes(sz.code);
                      return (
                        <button
                          key={sz.id}
                          type="button"
                          onClick={() => toggleSize(sz.code)}
                          className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition border ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                          }`}
                        >
                          {sz.code}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Color options */}
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 block mb-1.5">
                    Select Available Colors:
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {colorsList.map((col) => {
                      const isSelected = selectedColors.includes(col.id);
                      return (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => toggleColor(col.id)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition border flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                          }`}
                        >
                          <span
                            style={{ backgroundColor: col.hexCode }}
                            className="w-2.5 h-2.5 rounded-full border border-black/20"
                          ></span>
                          <span>{col.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-xs font-bold transition shadow-md shadow-purple-500/20 active:scale-95"
                >
                  {submitting ? 'Generating in MySQL...' : 'Save Product & Generate Variant Matrix'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Tag Modal */}
      {selectedBarcodeProduct && (
        <BarcodeLabelModal
          isOpen={!!selectedBarcodeProduct}
          onClose={() => {
            setSelectedBarcodeProduct(null);
            setSelectedBarcodeVariant(null);
          }}
          product={selectedBarcodeProduct}
          variant={selectedBarcodeVariant}
        />
      )}

      {/* Camera Barcode Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraScanOpen}
        onClose={() => setIsCameraScanOpen(false)}
        onDetected={handleBarcodeDetected}
      />
    </div>
  );
}
