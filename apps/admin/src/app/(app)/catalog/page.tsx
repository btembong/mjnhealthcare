'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader, Skeleton } from '@mjn/ui';
import {
  Tag, CircleNotch, Check, PencilSimple, X, Plus, Trash,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';

type EditState = { id: string; name: string; description: string; priceUsd: number };

export default function CatalogPage() {
  const [categories, setCategories]   = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [editing, setEditing]         = useState<EditState | null>(null);
  const [saving, setSaving]           = useState(false);

  // New category form
  const [showNewCat, setShowNewCat]   = useState(false);
  const [catForm, setCatForm]         = useState({ name: '', isMandatory: false });
  const [savingCat, setSavingCat]     = useState(false);

  // New item form — keyed by categoryId, or null when closed
  const [newItemCatId, setNewItemCatId] = useState<string | null>(null);
  const [itemForm, setItemForm]         = useState({ name: '', priceUsd: '', description: '' });
  const [savingItem, setSavingItem]     = useState(false);

  useEffect(() => {
    api.getCatalogCategories()
      .then(setCategories)
      .catch((err: any) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSavePrice() {
    if (!editing) return;
    setSaving(true);
    try {
      await api.updateCatalogItem(editing.id, {
        name: editing.name.trim() || undefined,
        description: editing.description.trim() || undefined,
        priceUsd: editing.priceUsd,
      });
      setCategories((prev) => prev.map((cat) => ({
        ...cat,
        items: cat.items?.map((item: any) =>
          item.id === editing.id
            ? { ...item, name: editing.name || item.name, description: editing.description, priceUsd: editing.priceUsd }
            : item,
        ),
      })));
      toast.success('Item updated.');
      setEditing(null);
    } catch (err: any) {
      toast.error('Failed to update: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateCategory() {
    if (!catForm.name.trim()) return;
    setSavingCat(true);
    try {
      const created = await api.createCatalogCategory({ name: catForm.name.trim(), isMandatory: catForm.isMandatory });
      setCategories((prev) => [...prev, { ...created, items: [] }]);
      toast.success(`Category "${created.name}" created.`);
      setCatForm({ name: '', isMandatory: false });
      setShowNewCat(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingCat(false);
    }
  }

  async function handleDeleteCategory(id: string, name: string) {
    if (!confirm(`Delete category "${name}" and all its items? This cannot be undone.`)) return;
    try {
      await api.deleteCatalogCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success('Category deleted.');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleCreateItem(categoryId: string) {
    const price = parseFloat(itemForm.priceUsd);
    if (!itemForm.name.trim() || isNaN(price)) { toast.error('Name and valid price required.'); return; }
    setSavingItem(true);
    try {
      const created = await api.createCatalogItem({
        categoryId,
        name: itemForm.name.trim(),
        priceUsd: price,
        description: itemForm.description.trim() || undefined,
      });
      setCategories((prev) => prev.map((cat) =>
        cat.id === categoryId ? { ...cat, items: [...(cat.items ?? []), created] } : cat,
      ));
      toast.success(`Item "${created.name}" added.`);
      setItemForm({ name: '', priceUsd: '', description: '' });
      setNewItemCatId(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingItem(false);
    }
  }

  async function handleDeleteItem(itemId: string, catId: string) {
    if (!confirm('Delete this item?')) return;
    try {
      await api.deleteCatalogItem(itemId);
      setCategories((prev) => prev.map((cat) =>
        cat.id === catId ? { ...cat, items: cat.items?.filter((i: any) => i.id !== itemId) } : cat,
      ));
      toast.success('Item deleted.');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Service Catalog" subtitle="Manage service categories and item prices" />
        <button
          onClick={() => { setShowNewCat(true); setCatForm({ name: '', isMandatory: false }); }}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Category
        </button>
      </div>

      {/* New category inline form */}
      {showNewCat && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <p className="mb-3 text-sm font-semibold text-foreground">New Category</p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={catForm.name}
              onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Category name…"
              className="h-10 flex-1 min-w-[200px] rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
              <input type="checkbox" checked={catForm.isMandatory} onChange={(e) => setCatForm((f) => ({ ...f, isMandatory: e.target.checked }))} className="rounded" />
              Mandatory
            </label>
            <div className="flex gap-2">
              <button onClick={() => setShowNewCat(false)} className="rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 transition-colors">Cancel</button>
              <button
                onClick={handleCreateCategory}
                disabled={!catForm.name.trim() || savingCat}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {savingCat ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
          <Tag className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-semibold text-foreground">No catalog items found</p>
          <p className="mt-1 text-sm text-muted-foreground">Run the database seed or create a category above.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((cat: any) => (
            <div key={cat.id} className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
              {/* Category header */}
              <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-3">
                <Tag className="h-4 w-4 text-primary shrink-0" />
                <span className="font-semibold text-foreground text-sm">{cat.name}</span>
                {cat.isMandatory && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">Mandatory</span>
                )}
                <span className="text-xs text-muted-foreground">{cat.items?.length ?? 0} items</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <button
                    onClick={() => { setNewItemCatId(cat.id); setItemForm({ name: '', priceUsd: '', description: '' }); }}
                    className="flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors shadow-sm"
                  >
                    <Plus className="h-3 w-3" /> Add Item
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    title="Delete category"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* New item inline form */}
              {newItemCatId === cat.id && (
                <div className="border-b border-border bg-muted/10 px-5 py-4">
                  <p className="mb-3 text-xs font-semibold text-foreground">New Item</p>
                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-[180px]">
                      <label className="mb-1 block text-xs text-muted-foreground">Name *</label>
                      <input value={itemForm.name} onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Item name…"
                        className="h-9 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary" />
                    </div>
                    <div className="w-28">
                      <label className="mb-1 block text-xs text-muted-foreground">Price USD *</label>
                      <input value={itemForm.priceUsd} onChange={(e) => setItemForm((f) => ({ ...f, priceUsd: e.target.value }))}
                        type="number" min={0} step={0.01} placeholder="0.00"
                        className="h-9 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary" />
                    </div>
                    <div className="flex-1 min-w-[180px]">
                      <label className="mb-1 block text-xs text-muted-foreground">Description</label>
                      <input value={itemForm.description} onChange={(e) => setItemForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Optional…"
                        className="h-9 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary" />
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => setNewItemCatId(null)} className="rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 transition-colors">Cancel</button>
                      <button
                        onClick={() => handleCreateItem(cat.id)}
                        disabled={savingItem || !itemForm.name.trim() || !itemForm.priceUsd}
                        className="flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                      >
                        {savingItem ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/20 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-5 py-2 font-medium">Item</th>
                      <th className="px-5 py-2 font-medium">Description</th>
                      <th className="px-5 py-2 font-medium">Variants</th>
                      <th className="px-5 py-2 font-medium text-right">Price (USD)</th>
                      <th className="px-5 py-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(cat.items ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-4 text-center text-xs text-muted-foreground">No items — click "Add Item" above.</td>
                      </tr>
                    ) : (cat.items ?? []).map((item: any) => (
                      <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-5 py-3 font-medium text-foreground">
                          {editing?.id === item.id ? (
                            <input
                              value={editing.name}
                              onChange={e => setEditing(prev => prev ? { ...prev, name: e.target.value } : prev)}
                              placeholder="Item name"
                              className="w-full rounded-lg border border-primary px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          ) : item.name}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground text-xs max-w-xs truncate">
                          {editing?.id === item.id ? (
                            <input
                              value={editing.description}
                              onChange={e => setEditing(prev => prev ? { ...prev, description: e.target.value } : prev)}
                              placeholder="Description (optional)"
                              className="w-full rounded-lg border border-primary px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          ) : (item.description ?? '—')}
                        </td>
                        <td className="px-5 py-3">
                          {item.variants?.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {item.variants.map((v: any) => (
                                <span key={v.id} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                                  {v.variantKey}: ${Number(v.priceUsd).toFixed(2)}
                                </span>
                              ))}
                            </div>
                          ) : '—'}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {editing?.id === item.id ? (
                            <input
                              type="number" min={0} step={0.01}
                              value={editing!.priceUsd}
                              onChange={(e) => setEditing(prev => prev ? { ...prev, priceUsd: parseFloat(e.target.value) || 0 } : prev)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSavePrice()}
                              className="w-24 rounded-lg border border-primary px-2 py-1 text-right text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          ) : (
                            <span className="font-semibold text-foreground">${Number(item.priceUsd).toFixed(2)}</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {editing?.id === item.id ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={handleSavePrice}
                                disabled={saving}
                                className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                              >
                                {saving ? <CircleNotch className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                Save
                              </button>
                              <button onClick={() => setEditing(null)} className="rounded-lg p-1.5 hover:bg-muted/60 transition-colors">
                                <X className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setEditing({ id: item.id, name: item.name ?? '', description: item.description ?? '', priceUsd: Number(item.priceUsd) })}
                                className="rounded-lg p-1.5 hover:bg-muted/60 transition-colors"
                                title="Edit item"
                              >
                                <PencilSimple className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id, cat.id)}
                                className="rounded-lg p-1.5 hover:bg-rose-50 transition-colors"
                                title="Delete item"
                              >
                                <Trash className="h-3.5 w-3.5 text-muted-foreground hover:text-rose-600" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
