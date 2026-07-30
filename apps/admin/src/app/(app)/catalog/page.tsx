'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader, Skeleton } from '@mjn/ui';
import {
  Tag, CircleNotch, CheckCircle, PencilSimple, X,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';

type EditState = { id: string; priceUsd: number };

export default function CatalogPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getCatalogCategories()
      .then(setCategories)
      .catch((err: any) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    try {
      await api.updateCatalogItem(editing.id, { priceUsd: editing.priceUsd });
      setCategories((prev) => prev.map((cat) => ({
        ...cat,
        items: cat.items?.map((item: any) =>
          item.id === editing.id ? { ...item, priceUsd: editing.priceUsd } : item,
        ),
      })));
      toast.success('Price updated.');
      setEditing(null);
    } catch (err: any) {
      toast.error('Failed to update: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Service Catalog" subtitle="View and edit service item prices" />

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
          <Tag className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-semibold text-foreground">No catalog items found</p>
          <p className="mt-1 text-sm text-muted-foreground">Run the database seed to populate the catalog.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((cat: any) => (
            <div key={cat.id} className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-3">
                <Tag className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground text-sm">{cat.name}</span>
                {cat.isMandatory && (
                  <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">Mandatory</span>
                )}
                <span className="ml-auto text-xs text-muted-foreground">{cat.items?.length ?? 0} items</span>
              </div>

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
                  {(cat.items ?? []).map((item: any) => (
                    <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-5 py-3 font-medium text-foreground">{item.name}</td>
                      <td className="px-5 py-3 text-muted-foreground text-xs max-w-xs truncate">{item.description ?? '—'}</td>
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
                            type="number"
                            min={0}
                            step={0.01}
                            value={editing!.priceUsd}
                            onChange={(e) => setEditing({ id: item.id, priceUsd: parseFloat(e.target.value) || 0 })}
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
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
                              onClick={handleSave}
                              disabled={saving}
                              className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                            >
                              {saving ? <CircleNotch className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                              Save
                            </button>
                            <button onClick={() => setEditing(null)} className="rounded-lg p-1.5 hover:bg-muted/60 transition-colors">
                              <X className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditing({ id: item.id, priceUsd: Number(item.priceUsd) })}
                            className="rounded-lg p-1.5 hover:bg-muted/60 transition-colors"
                            title="Edit price"
                          >
                            <PencilSimple className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
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
