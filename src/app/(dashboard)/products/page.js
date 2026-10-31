'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../../../lib/data';
import BarcodeLabelModal from '../../../components/pos/BarcodeLabelModal';
import CameraScannerModal from '../../../components/pos/CameraScannerModal';

export default function ProductsPage() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState(null);
  const [isCameraScanOpen, setIsCameraScanOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Garment Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: INITIAL_CATEGORIES[0]?.name || 'Kurtis & Tunics',
    price: '',
    stock: '',
    sku: '890123999001',
    size: 'M',
    color: '',
  });

  function openAddModal() {
    setNewProduct({
      name: '',
      category: INITIAL_CATEGORIES[0]?.name || 'Kurtis & Tunics',
      price: '',
      stock: '',
      sku: `890123${Date.now().toString().slice(-6)}`,
      size: 'M',
      color: '',
    });
    setIsAddModalOpen(true);
  }

  const filtered = products.filter((p) => {
    const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.includes(search) ||
      (p.color && p.color.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  function handleBarcodeDetected(code) {
    setSearch(code);
    setIsCameraScanOpen(false);
  }

  function handleAddNewProduct(e) {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;

    const item = {
      id: `prod-${Date.now()}`,
      name: newProduct.name,
      category: newProduct.category,
      price: parseFloat(newProduct.price) || 0,
      stock: parseInt(newProduct.stock) || 10,
      sku: newProduct.sku || `890123${Date.now().toString().slice(-6)}`,
      size: newProduct.size,
      color: newProduct.color || 'Standard',
    };

    setProducts([item, ...products]);
    setIsAddModalOpen(false);
    setNewProduct({
      name: '',
      category: INITIAL_CATEGORIES[0]?.name || 'Kurtis & Tunics',
      price: '',
      stock: '',
      sku: `890123${Date.now().toString().slice(-6)}`,
      size: 'M',
      color: '',
    });
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Ladies Garments & Inventory</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 font-bold">
              {products.length} Products
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Manage ladies suits, lehengas, kurtis, generate barcode price tags, and monitor stock.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Scan Barcode to find product */}
          <button
            onClick={() => setIsCameraScanOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 transition"
          >
            <Camera className="w-4 h-4 text-pink-500" />
            <span>Scan Tag</span>
          </button>

          {/* Add New Garment */}
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-pink-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Garment
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 sm:p-4 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-3 items-center justify-between shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by garment name, Barcode SKU, or fabric color..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium"
          >
            <option value="ALL">All Garment Categories</option>
            {INITIAL_CATEGORIES.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Display (Responsive Table & Card Grid) */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead className="bg-zinc-50/80 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4 font-bold">Garment Item</th>
                <th className="py-3 px-4 font-bold">Barcode / SKU</th>
                <th className="py-3 px-4 font-bold">Category</th>
                <th className="py-3 px-4 font-bold">Size & Fabric</th>
                <th className="py-3 px-4 font-bold text-right">Price</th>
                <th className="py-3 px-4 font-bold text-center">Stock</th>
                <th className="py-3 px-4 font-bold text-right">Barcode Tag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    No ladies garments found matching the criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">
                        {product.name}
                      </div>
                      <div className="text-[10px] text-zinc-400">ID: {product.id}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-600 dark:text-zinc-300">
                      <button
                        onClick={() => setSelectedBarcodeProduct(product)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-pink-50 dark:hover:bg-pink-950/40 text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition"
                        title="Click to view & print barcode tag"
                      >
                        <BarcodeIcon className="w-3.5 h-3.5 text-pink-500" />
                        <span>{product.sku}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300 font-medium">
                      {product.category}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px]">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                          {product.size || 'M'}
                        </span>
                        <span className="text-zinc-500">{product.color || 'Standard'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-pink-600 dark:text-pink-400 text-sm">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          product.stock < 10
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {product.stock} units
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedBarcodeProduct(product)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Tag</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Garment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 my-auto animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mb-1">
              Add New Ladies Garment
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Enter suit/kurti details and generate an instant barcode SKU.
            </p>

            <form onSubmit={handleAddNewProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold block mb-1">Garment Name / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Embroidered Velvet Shawl Suit"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  >
                    {INITIAL_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Price ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="49.99"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Size</label>
                  <select
                    value={newProduct.size}
                    onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="Free Size">Free Size</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Color / Fabric</label>
                  <input
                    type="text"
                    placeholder="Pink / Silk"
                    value={newProduct.color}
                    onChange={(e) => setNewProduct({ ...newProduct, color: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Stock Qty</label>
                  <input
                    type="number"
                    placeholder="15"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Barcode SKU (Auto-generated)</label>
                <input
                  type="text"
                  required
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                  className="w-full font-mono px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 text-white font-bold transition shadow-md shadow-pink-500/20"
                >
                  Save Garment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Tag Modal */}
      <BarcodeLabelModal
        isOpen={!!selectedBarcodeProduct}
        onClose={() => setSelectedBarcodeProduct(null)}
        product={selectedBarcodeProduct}
      />

      {/* Camera Scanner for search */}
      <CameraScannerModal
        isOpen={isCameraScanOpen}
        onClose={() => setIsCameraScanOpen(false)}
        onDetected={handleBarcodeDetected}
      />
    </div>
  );
}
