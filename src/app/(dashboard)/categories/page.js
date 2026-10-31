'use client';

import { useState } from 'react';
import { Plus, FolderTree, Edit, Trash2 } from 'lucide-react';
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Garment Categories
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Organize products into boutique collections (e.g., Pret, Lawn, Bridal, Casual).
          </p>
        </div>
      </div>

      {/* Add Category Form */}
      <form
        onSubmit={handleAdd}
        className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex gap-3 shadow-sm"
      >
        <input
          type="text"
          placeholder="New category name (e.g., Festive Silk Sets)"
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          className="flex-1 px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </form>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <FolderTree className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {cat.name}
                </h4>
                <p className="text-xs text-zinc-500">{cat.count} items linked</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const name = prompt('Edit Category Name:', cat.name);
                  if (name) {
                    setCategories(
                      categories.map((c) => (c.id === cat.id ? { ...c, name } : c))
                    );
                  }
                }}
                className="p-1.5 text-zinc-400 hover:text-indigo-600 rounded transition"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete category ${cat.name}?`)) {
                    setCategories(categories.filter((c) => c.id !== cat.id));
                  }
                }}
                className="p-1.5 text-zinc-400 hover:text-rose-600 rounded transition"
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
