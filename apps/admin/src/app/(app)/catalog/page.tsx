'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { PageHeader, Skeleton } from '@mjn/ui';
import { Tag, CircleNotch, X, Plus, Lock, ArrowUp, ArrowDown, MagnifyingGlass, CaretRight } from '@mjn/ui';
import { api } from '../../../lib/api';

// ── Shape and helpers ─────────────────────────────────────────────────────────

type Price = { key: string; priceUsd: number; used: boolean };
type Item = {
  id: string; categoryId: string; name: string; description: string; priceUsd: number;
  isDefaultSelected: boolean; isAvailableStandalone: boolean; isActive: boolean; locked: boolean;
  prices: Price[]; orderCount: number; planCount: number; stages: { stage: string; pathway: string }[]; canDelete: boolean;
};
type Category = { id: string; name: string; isMandatory: boolean; locked: boolean; items: Item[] };
type History = Awaited<ReturnType<typeof api.getCatalogPriceHistory>>;

/** The codes checkout understands, in plain words. */
const PRICE_LABEL: Record<string, string> = { nurse: 'Nurse & others', physician: 'Physician', retake: 'Retake' };
const priceLabel = (key: string) => PRICE_LABEL[key] ?? key;

const card = 'rounded-2xl border border-border bg-white shadow-sm';
const heading = 'text-xs font-bold uppercase tracking-widest text-muted-foreground';
const btnPrimary = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-40';
const btnOutline = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted/60 disabled:opacity-40';
const btnQuiet = 'inline-flex shrink-0 items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-25 disabled:hover:bg-transparent';
const field = 'w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';
const chip = (on: boolean) => `rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors ${on ? 'border-primary bg-primary text-white' : 'border-border bg-white text-muted-foreground hover:border-primary/40'}`;

function money(n: number) {
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
/** A typed amount as a number, or null when the box is empty or not an amount. */
function amount(text: string): number | null {
  const t = text.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  return Number(t);
}
function Dot({ className }: { className: string }) {
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${className}`} />;
}

function Modal({ title, sub, onClose, wide, children }: { title: string; sub?: string; onClose: () => void; wide?: boolean; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-white p-6 shadow-xl sm:rounded-2xl ${wide ? 'sm:max-w-lg' : 'sm:max-w-md'}`} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-foreground">{title}</h2>
            {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Check({ checked, onChange, disabled, label, hint }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string; hint?: string }) {
  return (
    <label className={`flex items-start gap-2 text-sm ${disabled ? 'text-muted-foreground' : 'text-foreground'}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#0F4C81]" />
      <span>{label}{hint && <span className="block text-xs text-muted-foreground">{hint}</span>}</span>
    </label>
  );
}

type Show = 'all' | 'offered' | 'hidden';
type Editing = { item: Item | null; categoryId: string };

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CatalogPage() {
  const [data, setData] = useState<{ priceTypes: string[]; categories: Category[] } | null>(null);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [show, setShow] = useState<Show>('all');
  const [busy, setBusy] = useState('');
  const [editing, setEditing] = useState<Editing | null>(null);
  const [catDialog, setCatDialog] = useState<{ category: Category | null } | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await api.getCatalog() as any);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const categories = data?.categories ?? [];
  const allItems = categories.flatMap((c) => c.items);
  const hiddenCount = allItems.filter((i) => !i.isActive).length;
  const q = search.trim().toLowerCase();
  const filtering = !!q || show !== 'all';
  const matches = (i: Item) =>
    (show === 'all' || (show === 'offered') === i.isActive) &&
    (!q || i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));

  async function act(key: string, work: () => Promise<unknown>, failedText: string) {
    setBusy(key);
    try {
      await work();
      await load();
    } catch (e: any) {
      toast.error(e.message ?? failedText);
    } finally {
      setBusy('');
    }
  }

  if (failed && !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Services and prices" />
        <div className={`${card} p-10 text-center`}>
          <p className="text-sm font-bold text-foreground">The catalog could not be loaded.</p>
          <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
          <button onClick={load} className={`${btnPrimary} mt-4`}>Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services and prices"
        subtitle={data
          ? `${allItems.length} ${allItems.length === 1 ? 'service' : 'services'} in ${categories.length} ${categories.length === 1 ? 'category' : 'categories'}${hiddenCount ? ` · ${hiddenCount} hidden` : ''} · prices in US dollars`
          : 'Prices in US dollars'}
        actions={<button onClick={() => setCatDialog({ category: null })} className={btnPrimary}><Plus className="h-3.5 w-3.5" /> New category</button>}
      />

      <p className="text-sm text-muted-foreground">A new price applies to new orders only. Receipts already issued never change.</p>

      <div data-tour="catalog-filters" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-80">
          <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search a service" className={`${field} pl-9`} />
        </div>
        <div className="flex gap-2">
          {([['all', 'All'], ['offered', 'Offered'], ['hidden', 'Hidden']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setShow(key)} className={chip(show === key)}>{label}</button>
          ))}
        </div>
      </div>

      {!data ? (
        <div className="space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>
      ) : categories.length === 0 ? (
        <div className={`${card} p-10 text-center`}>
          <Tag className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
          <p className="text-sm font-bold text-foreground">There are no services yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">Start with a category, then add services to it.</p>
        </div>
      ) : (
        <div data-tour="catalog-list" className="space-y-5">
          {categories.map((cat, ci) => {
            const items = cat.items.filter(matches);
            if (filtering && items.length === 0) return null;
            return (
              <section key={cat.id} className={`${card} overflow-hidden`}>
                <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-muted/30 px-4 py-3">
                  <h2 className="text-sm font-bold text-foreground">{cat.name}</h2>
                  {cat.isMandatory && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">Always charged</span>}
                  <span className="text-xs text-muted-foreground">{cat.items.length} {cat.items.length === 1 ? 'service' : 'services'}</span>
                  <div className="ml-auto flex items-center gap-1">
                    <button onClick={() => act('cat' + cat.id, () => api.moveCatalogCategory(cat.id, 'up'), 'The category could not be moved.')} disabled={ci === 0 || !!busy || filtering} aria-label={`Move ${cat.name} up`} title="Move up" className={btnQuiet}><ArrowUp className="h-4 w-4" /></button>
                    <button onClick={() => act('cat' + cat.id, () => api.moveCatalogCategory(cat.id, 'down'), 'The category could not be moved.')} disabled={ci === categories.length - 1 || !!busy || filtering} aria-label={`Move ${cat.name} down`} title="Move down" className={btnQuiet}><ArrowDown className="h-4 w-4" /></button>
                    <button onClick={() => setCatDialog({ category: cat })} className={`${btnOutline} ml-1`}>Edit</button>
                    {!cat.locked && <button onClick={() => setEditing({ item: null, categoryId: cat.id })} className={btnOutline}><Plus className="h-3.5 w-3.5" /> Add service</button>}
                  </div>
                </header>

                {items.length === 0 ? (
                  <p className="px-4 py-5 text-sm text-muted-foreground">No services here yet. Clients do not see an empty category.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {items.map((item) => {
                      const at = cat.items.indexOf(item);
                      return (
                        <li key={item.id} className="flex items-center gap-1 px-2 py-1 hover:bg-muted/20">
                          <div className="flex shrink-0 flex-col">
                            <button onClick={() => act('item' + item.id, () => api.moveCatalogItem(item.id, 'up'), 'The service could not be moved.')} disabled={at === 0 || !!busy || filtering} aria-label={`Move ${item.name} up`} className={btnQuiet}><ArrowUp className="h-3.5 w-3.5" /></button>
                            <button onClick={() => act('item' + item.id, () => api.moveCatalogItem(item.id, 'down'), 'The service could not be moved.')} disabled={at === cat.items.length - 1 || !!busy || filtering} aria-label={`Move ${item.name} down`} className={btnQuiet}><ArrowDown className="h-3.5 w-3.5" /></button>
                          </div>
                          <button onClick={() => setEditing({ item, categoryId: cat.id })} className="flex min-w-0 flex-1 flex-col gap-1 rounded-xl px-2 py-2 text-left sm:flex-row sm:items-center sm:gap-4">
                            <span className="min-w-0 flex-1">
                              <span className={`block truncate text-sm font-bold ${item.isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {item.locked && <Lock className="mr-1 inline h-3.5 w-3.5 text-muted-foreground" />}{item.name}
                              </span>
                              <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                                {!item.isActive
                                  ? <span className="inline-flex items-center gap-1.5 font-bold"><Dot className="bg-muted-foreground/40" /> Hidden from clients</span>
                                  : item.locked ? <span>Required by checkout</span>
                                  : <span>{item.isDefaultSelected ? 'Ticked by default' : 'Optional'}</span>}
                                {item.isAvailableStandalone && item.isActive && <span>· Sold on its own</span>}
                                {item.orderCount > 0 && <span>· On {item.orderCount} {item.orderCount === 1 ? 'order' : 'orders'}</span>}
                              </span>
                            </span>
                            <span className="shrink-0 text-sm sm:text-right">
                              {item.prices.length === 0
                                ? <span className="font-bold text-foreground">{money(item.priceUsd)}</span>
                                : <span className="flex flex-wrap gap-x-3 text-xs text-foreground sm:justify-end">{item.prices.map((p) => <span key={p.key}>{priceLabel(p.key)} <span className="font-bold">{money(p.priceUsd)}</span></span>)}</span>}
                            </span>
                            <CaretRight className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
          {filtering && categories.every((c) => c.items.filter(matches).length === 0) && (
            <div className={`${card} p-8 text-center text-sm font-bold text-foreground`}>No services match.</div>
          )}
        </div>
      )}

      {editing && data && (
        <ServicePanel
          key={editing.item?.id ?? 'new'}
          item={editing.item}
          categoryId={editing.categoryId}
          categories={categories}
          priceTypes={data.priceTypes}
          onClose={() => setEditing(null)}
          onDone={async () => { setEditing(null); await load(); }}
        />
      )}

      {catDialog && (
        <CategoryDialog
          category={catDialog.category}
          onClose={() => setCatDialog(null)}
          onDone={async () => { setCatDialog(null); await load(); }}
        />
      )}
    </div>
  );
}

// ── Category: create, rename, delete ──────────────────────────────────────────

function CategoryDialog({ category, onClose, onDone }: { category: Category | null; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState(category?.name ?? '');
  const [mandatory, setMandatory] = useState(category?.isMandatory ?? false);
  const [busy, setBusy] = useState('');

  async function save() {
    setBusy('save');
    try {
      if (category) await api.updateCatalogCategory(category.id, { name: name.trim(), isMandatory: mandatory });
      else await api.createCatalogCategory({ name: name.trim(), isMandatory: mandatory });
      toast.success(category ? 'Category saved.' : `"${name.trim()}" created. Add services to it so clients can see it.`);
      onDone();
    } catch (e: any) {
      toast.error(e.message ?? 'The category could not be saved.');
    } finally {
      setBusy('');
    }
  }
  async function remove() {
    if (!category) return;
    setBusy('delete');
    try {
      await api.deleteCatalogCategory(category.id);
      toast.success('Category deleted.');
      onDone();
    } catch (e: any) {
      toast.error(e.message ?? 'The category could not be deleted.');
    } finally {
      setBusy('');
    }
  }

  return (
    <Modal title={category ? 'Edit category' : 'New category'} onClose={onClose}>
      <label className={heading} htmlFor="cat-name">Name</label>
      <input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="For example: UK Registration" className={`${field} mt-1.5`} />
      <div className="mt-4">
        <Check
          checked={mandatory}
          onChange={setMandatory}
          disabled={category?.locked}
          label="Always charged"
          hint={category?.locked ? 'This category holds the engagement fee, so it is always charged.' : 'Every service in this category is added to the order and the client cannot remove it.'}
        />
      </div>
      <div className="mt-5 flex items-center justify-between gap-2">
        {category && !category.locked
          ? <button onClick={remove} disabled={!!busy || category.items.length > 0} title={category.items.length > 0 ? 'Move or delete its services first' : undefined} className={btnOutline}>{busy === 'delete' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} Delete</button>
          : <span />}
        <div className="flex gap-2">
          <button onClick={onClose} className={btnOutline}>Close</button>
          <button onClick={save} disabled={!!busy || !name.trim()} className={btnPrimary}>{busy === 'save' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} {category ? 'Save changes' : 'Create category'}</button>
        </div>
      </div>
      {category && !category.locked && category.items.length > 0 && <p className="mt-3 text-xs text-muted-foreground">A category can be deleted once it has no services in it.</p>}
    </Modal>
  );
}

// ── Service: everything about one service ─────────────────────────────────────

function ServicePanel({ item, categoryId, categories, priceTypes, onClose, onDone }: {
  item: Item | null; categoryId: string; categories: Category[]; priceTypes: string[]; onClose: () => void; onDone: () => void;
}) {
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [category, setCategory] = useState(categoryId);
  const [price, setPrice] = useState(item ? item.priceUsd.toFixed(2) : '');
  const [extra, setExtra] = useState<{ key: string; text: string; used: boolean }[]>((item?.prices ?? []).map((p) => ({ key: p.key, text: p.priceUsd.toFixed(2), used: p.used })));
  const [ticked, setTicked] = useState(item?.isDefaultSelected ?? true);
  const [standalone, setStandalone] = useState(item?.isAvailableStandalone ?? false);
  const [offered, setOffered] = useState(item?.isActive ?? true);
  const [history, setHistory] = useState<History | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [askDelete, setAskDelete] = useState(false);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (!item) return;
    api.getCatalogPriceHistory(item.id).then(setHistory).catch(() => setHistory([]));
  }, [item]);

  const locked = !!item?.locked;
  const base = amount(price);
  const extraAmounts = extra.map((e) => ({ key: e.key, priceUsd: amount(e.text) }));
  const addable = priceTypes.filter((t) => !extra.some((e) => e.key === t));
  const problem = !name.trim() ? 'Give the service a name.'
    : base === null ? 'Enter the price as an amount, for example 240 or 240.50.'
    : extraAmounts.some((e) => e.priceUsd === null) ? 'Enter an amount for each extra price, or remove it.'
    : '';

  /** What will change about the prices, in words, for the confirmation. */
  const priceChanges = useMemo(() => {
    const list: string[] = [];
    if (base === null) return list;
    if (!item) return list;
    if (base !== item.priceUsd) list.push(`${extra.length ? 'Standard price' : 'Price'}: ${money(item.priceUsd)} → ${money(base)}`);
    for (const e of extraAmounts) {
      if (e.priceUsd === null) continue;
      const before = item.prices.find((p) => p.key === e.key);
      if (!before) list.push(`${priceLabel(e.key)}: new price ${money(e.priceUsd)}`);
      else if (before.priceUsd !== e.priceUsd) list.push(`${priceLabel(e.key)}: ${money(before.priceUsd)} → ${money(e.priceUsd)}`);
    }
    for (const p of item.prices) if (!extra.some((e) => e.key === p.key)) list.push(`${priceLabel(p.key)}: removed (was ${money(p.priceUsd)})`);
    return list;
  }, [item, base, extra, extraAmounts]);

  async function save() {
    if (problem) return;
    const payload = {
      name: name.trim(),
      description: description.trim(),
      priceUsd: base,
      isDefaultSelected: ticked,
      isAvailableStandalone: standalone,
      ...(locked ? {} : { prices: extraAmounts, categoryId: category }),
    };
    setBusy('save');
    try {
      if (item) await api.updateCatalogItem(item.id, { ...payload, ...(locked ? {} : { isActive: offered }) });
      else await api.createCatalogItem(payload);
      toast.success(item ? `${name.trim()} saved.` : `${name.trim()} added.`);
      onDone();
    } catch (e: any) {
      toast.error(e.message ?? 'The service could not be saved.');
      setConfirming(false);
    } finally {
      setBusy('');
    }
  }

  async function remove() {
    if (!item) return;
    setBusy('delete');
    try {
      await api.deleteCatalogItem(item.id);
      toast.success(`${item.name} deleted.`);
      onDone();
    } catch (e: any) {
      toast.error(e.message ?? 'The service could not be deleted.');
      setAskDelete(false);
    } finally {
      setBusy('');
    }
  }

  if (confirming) {
    return (
      <Modal title="Confirm the new prices" sub={name.trim()} onClose={() => setConfirming(false)}>
        <ul className="space-y-1.5 text-sm text-foreground">
          {priceChanges.map((c) => <li key={c} className="flex items-start gap-2"><Dot className="mt-1.5 bg-accent" /> {c}</li>)}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">This applies to new orders only. Orders and receipts that already exist keep their price. The change is recorded with your name.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => setConfirming(false)} className={btnOutline}>Go back</button>
          <button onClick={save} disabled={!!busy} className={btnPrimary}>{busy === 'save' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} Change {priceChanges.length === 1 ? 'price' : 'prices'}</button>
        </div>
      </Modal>
    );
  }

  if (askDelete && item) {
    return (
      <Modal title={`Delete ${item.name}?`} onClose={() => setAskDelete(false)}>
        <p className="text-sm text-foreground">This service has never been ordered and no pathway stage needs it, so it can be removed completely. This cannot be undone.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => setAskDelete(false)} className={btnOutline}>Keep it</button>
          <button onClick={remove} disabled={!!busy} className={btnPrimary}>{busy === 'delete' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} Delete service</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal wide title={item ? item.name : 'New service'} sub={locked ? 'Added to every client’s first order. Only its name, description and price can change.' : undefined} onClose={onClose}>
      <div className="space-y-5">
        <div className="space-y-3">
          <div>
            <label className={heading} htmlFor="svc-name">Name</label>
            <input id="svc-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus={!item} className={`${field} mt-1.5`} />
          </div>
          <div>
            <label className={heading} htmlFor="svc-desc">Description</label>
            <textarea id="svc-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Shown to the client under the name. Optional." className={`${field} mt-1.5`} />
          </div>
          {!locked && categories.length > 1 && (
            <div>
              <label className={heading} htmlFor="svc-cat">Category</label>
              <select id="svc-cat" value={category} onChange={(e) => setCategory(e.target.value)} className={`${field} mt-1.5`}>
                {categories.filter((c) => !c.locked || c.id === category).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div>
          <p className={heading}>Price (US dollars)</p>
          <div className="mt-2 space-y-2">
            <PriceRow label={extra.length ? 'Standard price' : 'Price'} hint={extra.length ? 'Used only when none of the prices below fits the client.' : undefined} value={price} onChange={setPrice} />
            {extra.map((e, i) => (
              <PriceRow
                key={e.key}
                label={priceLabel(e.key)}
                value={e.text}
                onChange={(text) => setExtra(extra.map((x, xi) => (xi === i ? { ...x, text } : x)))}
                onRemove={e.used ? undefined : () => setExtra(extra.filter((_, xi) => xi !== i))}
                hint={e.used ? 'Used on orders, so it can be changed but not removed.' : e.key === 'retake' ? 'Clients can choose this price themselves at checkout.' : undefined}
              />
            ))}
          </div>
          {!locked && addable.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Add a different price for:</span>
              {addable.map((t) => <button key={t} type="button" onClick={() => setExtra([...extra, { key: t, text: '', used: false }])} className={btnOutline}><Plus className="h-3 w-3" /> {priceLabel(t)}</button>)}
            </div>
          )}
          {extra.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Nurse and Physician prices are matched to the profession on the client’s file. Other professions choose at checkout.</p>}
        </div>

        {!locked && (
          <div>
            <p className={heading}>At checkout</p>
            <div className="mt-2 space-y-2.5">
              <Check checked={ticked} onChange={setTicked} label="Ticked by default" hint="The client can still untick it, unless the category is always charged." />
              <Check checked={standalone} onChange={setStandalone} label="Can be bought on its own" hint="Offered outside a full case, as a single service." />
              {item && <Check checked={offered} onChange={setOffered} label="Offered to clients" hint="Untick to hide it. Clients no longer see it; orders and receipts that include it are kept." />}
            </div>
          </div>
        )}

        {item && (
          <div>
            <p className={heading}>Where it is used</p>
            <ul className="mt-2 space-y-1 text-sm text-foreground">
              <li>{item.orderCount === 0 ? 'Not on any order yet.' : `On ${item.orderCount} ${item.orderCount === 1 ? 'order' : 'orders'}.`}</li>
              {item.planCount > 0 && <li>In {item.planCount} {item.planCount === 1 ? 'client’s payment plan' : 'clients’ payment plans'}.</li>}
              {item.stages.map((s) => <li key={s.pathway + s.stage}>Needed at the “{s.stage}” stage{s.pathway ? ` (${s.pathway})` : ''}.</li>)}
            </ul>
          </div>
        )}

        {item && (
          <div>
            <p className={heading}>Price history</p>
            {!history ? <Skeleton className="mt-2 h-8 w-full rounded-lg" />
              : history.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No price change has been recorded yet. Changes are recorded from now on.</p>
              : (
                <ul className="mt-2 space-y-1 text-sm text-foreground">
                  {history.map((h, i) => (
                    <li key={i} className="flex flex-wrap gap-x-2">
                      <span className="text-muted-foreground">{new Date(h.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span>{h.priceType ? `${priceLabel(h.priceType)}: ` : ''}{h.from === null ? `set to ${money(h.to ?? 0)}` : h.to === null ? `removed (was ${money(h.from)})` : `${money(h.from)} → ${money(h.to)}`}</span>
                      <span className="text-muted-foreground">by {h.by}</span>
                    </li>
                  ))}
                </ul>
              )}
          </div>
        )}
      </div>

      {problem && <p className="mt-4 text-xs font-bold text-foreground" role="alert">{problem}</p>}
      <div className="mt-5 flex items-center justify-between gap-2">
        {item && !locked
          ? <button onClick={() => setAskDelete(true)} disabled={!item.canDelete} title={item.canDelete ? undefined : 'It has been used, so it can only be hidden'} className={btnOutline}>Delete</button>
          : <span />}
        <div className="flex gap-2">
          <button onClick={onClose} className={btnOutline}>Close</button>
          <button onClick={() => (priceChanges.length > 0 ? setConfirming(true) : save())} disabled={!!problem || !!busy} className={btnPrimary}>
            {busy === 'save' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} {item ? 'Save changes' : 'Add service'}
          </button>
        </div>
      </div>
      {item && !locked && !item.canDelete && <p className="mt-3 text-xs text-muted-foreground">This service has been used, so it cannot be deleted. To stop offering it, untick “Offered to clients”.</p>}
    </Modal>
  );
}

function PriceRow({ label, hint, value, onChange, onRemove }: { label: string; hint?: string; value: string; onChange: (v: string) => void; onRemove?: () => void }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 text-sm text-foreground">{label}</span>
        <div className="relative w-32">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
          <input value={value} onChange={(e) => onChange(e.target.value)} inputMode="decimal" aria-label={`${label} in US dollars`} placeholder="0.00" className={`${field} pl-6 text-right`} />
        </div>
        {onRemove
          ? <button type="button" onClick={onRemove} aria-label={`Remove the ${label} price`} title="Remove this price" className={btnQuiet}><X className="h-4 w-4" /></button>
          : <span className="w-7" />}
      </div>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
