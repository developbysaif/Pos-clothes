'use client';

import { useState } from 'react';
import { Plus, FolderTree, Edit, Trash2, Sparkles } from 'lucide-react';
import { INITIAL_CATEGORIES } from '../../../lib/data';

export default function CategoriesPage() {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [newCatName, setNewCatName] = useState('');

  function handleAdd(e) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCategories([
      ...categories,
      { id: `cat-${Date.now()}`, name: newCatName.trim(), count: 0 },
    ]);
    setNewCatName('');
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Garment Categories & Collections</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 font-bold">
              {categories.length} Collections
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Organize ladies apparel into boutique collections (e.g., Pret, Lawn, Bridal, Kurtis, Shawls).
          </p>
        </div>
      </div>

      {/* Add Category Form */}
      <form
        onSubmit={handleAdd}
        className="p-3 sm:p-4 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-2.5 sm:gap-3 shadow-sm"
      >
        <input
          type="text"
          placeholder="New collection name (e.g., Festive Silk Sets, Party Wear Gowns)..."
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-pink-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Collection
        </button>
      </form>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="p-4 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between hover:shadow-md transition"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400">
                <FolderTree className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {cat.name}
                </h4>
                <p className="text-xs text-zinc-500">{cat.count || 0} garments listed</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const name = prompt('Edit Category Name:', cat.name);
                  if (name && name.trim()) {
                    setCategories(
                      categories.map((c) => (c.id === cat.id ? { ...c, name: name.trim() } : c))
                    );
                  }
                }}
                className="p-2 text-zinc-400 hover:text-indigo-600 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                title="Edit category"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete category "${cat.name}"?`)) {
                    setCategories(categories.filter((c) => c.id !== cat.id));
                  }
                }}
                className="p-2 text-zinc-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                title="Delete category"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
