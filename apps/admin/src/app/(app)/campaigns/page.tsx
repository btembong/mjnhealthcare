'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { PageHeader, Skeleton } from '@mjn/ui';
import {
  MegaphoneSimple, Plus, X, CircleNotch, PaperPlaneTilt, Pencil,
  UploadSimple, FileArrowUp, CheckCircle, Warning, Users,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type Contact = { name: string; email: string; phone?: string };
type SavedList = { id: string; name: string; contacts: Contact[]; valid: number; invalid: number };
type TabKey = 'ALL' | 'DRAFT' | 'SCHEDULED' | 'SENT' | 'CANCELLED';

interface CampaignForm {
  name: string; subject: string; body: string; scheduledAt: string;
  audienceType: 'brevo' | 'custom'; audienceListId: string;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'SCHEDULED', label: 'Scheduled' },
  { key: 'SENT', label: 'Sent' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  SCHEDULED: 'bg-blue-100 text-blue-700',
  SENT: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
};

const EMPTY_FORM: CampaignForm = {
  name: '', subject: '', body: '', scheduledAt: '', audienceType: 'brevo', audienceListId: '',
};

function formatLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

// ── Import Modal ──────────────────────────────────────────────────────────────

function ImportModal({ onClose, onSave }: { onClose: () => void; onSave: (list: SavedList) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [colMap, setColMap] = useState({ name: '', email: '', phone: '' });
  const [listName, setListName] = useState('');
  const [dragging, setDragging] = useState(false);
  const [parsed, setParsed] = useState(false);

  async function parseFile(file: File) {
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      toast.error('Please upload an .xlsx, .xls, or .csv file.');
      return;
    }
    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (!data.length) { toast.error('File appears empty.'); return; }
      const hdrs = Object.keys(data[0]);
      setHeaders(hdrs);
      setRows(data);
      setColMap({
        name: hdrs.find((h) => /^name$/i.test(h) || /full.?name/i.test(h)) ?? hdrs[0] ?? '',
        email: hdrs.find((h) => /email/i.test(h)) ?? '',
        phone: hdrs.find((h) => /phone|mobile|tel/i.test(h)) ?? '',
      });
      setListName(file.name.replace(/\.[^.]+$/, ''));
      setParsed(true);
    } catch {
      toast.error('Could not parse file. Check that it is a valid Excel or CSV file.');
    }
  }

  const contacts = useMemo<Contact[]>(() => {
    if (!parsed || !colMap.email) return [];
    return rows.map((r) => ({
      name: colMap.name ? String(r[colMap.name] ?? '').trim() : '',
      email: String(r[colMap.email] ?? '').trim().toLowerCase(),
      phone: colMap.phone ? String(r[colMap.phone] ?? '').trim() || undefined : undefined,
    }));
  }, [rows, colMap, parsed]);

  const valid = contacts.filter((c) => isValidEmail(c.email));
  const invalid = contacts.filter((c) => !isValidEmail(c.email));

  function handleSave() {
    if (!listName.trim()) { toast.error('Enter a name for this list.'); return; }
    if (!valid.length) { toast.error('No valid email addresses found.'); return; }
    onSave({ id: Date.now().toString(), name: listName.trim(), contacts: valid, valid: valid.length, invalid: invalid.length });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <p className="font-bold text-foreground">Import Contact List</p>
            <p className="text-xs text-muted-foreground mt-0.5">Upload Excel or CSV — use as campaign audience</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted/60 transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {!parsed ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) parseFile(f); }}
              onClick={() => fileRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed py-16 cursor-pointer transition-colors ${
                dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/20'
              }`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <UploadSimple className="h-7 w-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Drop your file here, or click to browse</p>
                <p className="mt-1 text-xs text-muted-foreground">Supports .xlsx · .xls · .csv — first row must be column headers</p>
              </div>
            </div>
          ) : (
            <>
              {/* Column mapping */}
              <div>
                <p className="mb-3 text-xs font-semibold text-foreground uppercase tracking-wide">Map Columns</p>
                <div className="grid grid-cols-3 gap-3">
                  {(['name', 'email', 'phone'] as const).map((field) => (
                    <div key={field}>
                      <label className="mb-1.5 block text-xs font-medium text-muted-foreground capitalize">
                        {field}{field === 'email' ? ' *' : ' (optional)'}
                      </label>
                      <select
                        value={colMap[field]}
                        onChange={(e) => setColMap((m) => ({ ...m, [field]: e.target.value }))}
                        className="h-9 w-full rounded-xl border border-border bg-muted/30 px-2.5 text-xs outline-none focus:border-primary"
                      >
                        <option value="">— none —</option>
                        {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Validation summary */}
              {colMap.email && (
                <div className="flex items-center gap-5 rounded-xl border border-border bg-muted/30 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="text-sm font-bold text-emerald-700">{valid.length}</span>
                    <span className="text-xs text-muted-foreground">valid contacts</span>
                  </div>
                  {invalid.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Warning className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="text-sm font-bold text-amber-700">{invalid.length}</span>
                      <span className="text-xs text-muted-foreground">invalid — skipped on send</span>
                    </div>
                  )}
                </div>
              )}

              {/* Preview */}
              {contacts.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/40">
                        <tr className="text-left text-muted-foreground">
                          <th className="px-3 py-2 font-semibold w-8">#</th>
                          <th className="px-3 py-2 font-semibold">Name</th>
                          <th className="px-3 py-2 font-semibold">Email</th>
                          {colMap.phone && <th className="px-3 py-2 font-semibold">Phone</th>}
                          <th className="px-3 py-2 font-semibold">Valid</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {contacts.slice(0, 12).map((c, i) => {
                          const ok = isValidEmail(c.email);
                          return (
                            <tr key={i} className={ok ? 'hover:bg-muted/10' : 'bg-amber-50/60'}>
                              <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                              <td className="px-3 py-2 text-foreground">{c.name || '—'}</td>
                              <td className="px-3 py-2 font-mono">{c.email || '—'}</td>
                              {colMap.phone && <td className="px-3 py-2 text-muted-foreground">{c.phone || '—'}</td>}
                              <td className="px-3 py-2">
                                {ok ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <Warning className="h-3.5 w-3.5 text-amber-500" />}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {contacts.length > 12 && (
                    <div className="border-t border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                      Showing 12 of {contacts.length} rows
                    </div>
                  )}
                </div>
              )}

              {/* List name */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">List Name</label>
                <input
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="e.g. UAE Nurses July 2026"
                  className="h-10 w-full rounded-xl border border-border bg-muted/30 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 py-4">
          <button
            onClick={() => parsed ? (setParsed(false), setRows([]), setHeaders([])) : onClose()}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {parsed ? '← Upload different file' : 'Cancel'}
          </button>
          {parsed && (
            <button
              onClick={handleSave}
              disabled={!valid.length || !listName.trim()}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Users className="h-4 w-4" />
              Save List · {valid.length} contacts
            </button>
          )}
        </div>

        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) parseFile(f); }} />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CampaignForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);

  useEffect(() => {
    api.getCampaigns()
      .then(setCampaigns)
      .catch((err: any) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const tabCampaigns = useMemo(() =>
    activeTab === 'ALL' ? campaigns : campaigns.filter((c) => c.status === activeTab),
    [campaigns, activeTab]);

  const counts = useMemo(() => {
    const m: Record<string, number> = { ALL: campaigns.length };
    for (const t of ['DRAFT', 'SCHEDULED', 'SENT', 'CANCELLED'])
      m[t] = campaigns.filter((c) => c.status === t).length;
    return m;
  }, [campaigns]);

  function openCreate() { setEditId(null); setForm(EMPTY_FORM); setShowForm(true); }
  function openEdit(c: any) {
    const af = c.audienceFilter as any;
    setEditId(c.id);
    setForm({
      name: c.name, subject: c.subject, body: c.body,
      scheduledAt: c.scheduledAt ? c.scheduledAt.slice(0, 16) : '',
      audienceType: af?.type === 'custom_list' ? 'custom' : 'brevo',
      audienceListId: '',
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) return;

    let audienceFilter: Record<string, any> | undefined;
    if (form.audienceType === 'custom') {
      const list = savedLists.find((l) => l.id === form.audienceListId);
      if (!list) { toast.error('Select an imported list first.'); return; }
      audienceFilter = { type: 'custom_list', listName: list.name, contacts: list.contacts };
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name, subject: form.subject, body: form.body,
        scheduledAt: form.scheduledAt || undefined, audienceFilter,
      };
      if (editId) {
        const updated = await api.updateCampaign(editId, payload);
        setCampaigns((prev) => prev.map((c) => c.id === editId ? updated : c));
        toast.success('Campaign updated.');
      } else {
        const created = await api.createCampaign(payload);
        setCampaigns((prev) => [created, ...prev]);
        toast.success('Campaign draft created.');
      }
      setShowForm(false); setEditId(null); setForm(EMPTY_FORM);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendNow(id: string) {
    const c = campaigns.find((x) => x.id === id);
    const af = c?.audienceFilter as any;
    const isCustom = af?.type === 'custom_list';
    const confirmed = confirm(
      isCustom
        ? `Send to ${af.contacts?.length ?? 0} contacts in "${af.listName}"?`
        : 'Send this campaign to all Brevo subscribers now?'
    );
    if (!confirmed) return;
    setSending(id);
    try {
      const updated = await api.sendCampaignNow(id);
      setCampaigns((prev) => prev.map((x) => x.id === id ? { ...x, status: 'SENT', sentAt: updated.sentAt } : x));
      toast.success('Campaign sent.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSending(null);
    }
  }

  async function handleCancel(id: string) {
    try {
      await api.cancelCampaign(id);
      setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, status: 'CANCELLED' } : c));
      toast.success('Campaign cancelled.');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  const selectedList = savedLists.find((l) => l.id === form.audienceListId);

  return (
    <div className="space-y-6">
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onSave={(list) => {
            setSavedLists((prev) => [list, ...prev]);
            toast.success(`"${list.name}" saved — ${list.valid} contacts ready.`);
          }}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Campaigns" subtitle="Email outreach and audience management" />
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors shadow-sm"
          >
            <FileArrowUp className="h-4 w-4 text-primary" /> Import List
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> New Campaign
          </button>
        </div>
      </div>

      {/* Saved lists strip */}
      {savedLists.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <p className="flex items-center text-xs font-semibold text-muted-foreground mr-1">Imported lists:</p>
          {savedLists.map((l) => (
            <div key={l.id} className="flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs shadow-sm">
              <Users className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-semibold text-foreground">{l.name}</span>
              <span className="text-muted-foreground">{l.valid} contacts</span>
              <button onClick={() => setSavedLists((p) => p.filter((x) => x.id !== l.id))} className="ml-0.5 text-muted-foreground hover:text-rose-500 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Status tabs */}
      <div className="flex flex-wrap gap-1 rounded-2xl border border-border bg-white p-1 shadow-sm w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === t.key ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            {t.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
              activeTab === t.key ? 'bg-white/25 text-white' : 'bg-muted text-muted-foreground'
            }`}>
              {counts[t.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Campaign form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <p className="font-bold text-foreground">{editId ? 'Edit Campaign' : 'New Campaign Draft'}</p>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg p-1.5 hover:bg-muted/60 transition-colors">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">Campaign Name</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required
                placeholder="e.g. UAE Nurses — July 2026"
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">Email Subject</label>
              <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} required
                placeholder="Subject line…"
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Body (HTML or plain text)</label>
            <textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} required rows={8}
              placeholder="Email content…"
              className="w-full resize-y rounded-xl border border-border bg-muted/30 px-3 py-2.5 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </div>

          {/* Audience */}
          <div>
            <p className="mb-3 text-xs font-semibold text-foreground uppercase tracking-wide">Audience</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {/* Brevo option */}
              <button type="button" onClick={() => setForm((f) => ({ ...f, audienceType: 'brevo' }))}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                  form.audienceType === 'brevo' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border hover:bg-muted/20'
                }`}>
                <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  form.audienceType === 'brevo' ? 'border-primary' : 'border-muted-foreground/40'
                }`}>
                  {form.audienceType === 'brevo' && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Brevo Subscriber List</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">All contacts in your Brevo list (managed externally)</p>
                </div>
              </button>

              {/* Custom list option */}
              <button type="button"
                onClick={() => savedLists.length ? setForm((f) => ({ ...f, audienceType: 'custom' })) : setShowImport(true)}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                  form.audienceType === 'custom' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border hover:bg-muted/20'
                }`}>
                <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  form.audienceType === 'custom' ? 'border-primary' : 'border-muted-foreground/40'
                }`}>
                  {form.audienceType === 'custom' && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Custom Imported List</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {savedLists.length === 0 ? 'Click to import an Excel / CSV list first' : 'Select from your imported lists below'}
                  </p>
                </div>
              </button>
            </div>

            {form.audienceType === 'custom' && savedLists.length > 0 && (
              <div className="mt-3 space-y-2">
                <select value={form.audienceListId} onChange={(e) => setForm((f) => ({ ...f, audienceListId: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-border bg-muted/30 px-3 text-sm outline-none focus:border-primary">
                  <option value="">— Select a list —</option>
                  {savedLists.map((l) => <option key={l.id} value={l.id}>{l.name} · {l.valid} contacts</option>)}
                </select>
                {selectedList && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    <p className="text-xs text-emerald-700">
                      <span className="font-semibold">{selectedList.valid} recipients</span>
                      {selectedList.invalid > 0 && ` · ${selectedList.invalid} invalid rows skipped`}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Schedule (optional — leave blank to save as draft)</label>
            <input type="datetime-local" value={form.scheduledAt}
              onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
              className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted/40 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {submitting && <CircleNotch className="h-3.5 w-3.5 animate-spin" />}
              {editId ? 'Save Changes' : 'Create Draft'}
            </button>
          </div>
        </form>
      )}

      {/* Campaign list */}
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : tabCampaigns.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
          <MegaphoneSimple className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-semibold text-foreground">
            {activeTab === 'ALL' ? 'No campaigns yet' : `No ${formatLabel(activeTab).toLowerCase()} campaigns`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeTab === 'ALL' ? 'Create your first campaign draft to get started.' : 'Switch tabs to see campaigns in other statuses.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/20 text-left text-xs text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-5 py-3 font-semibold">Campaign</th>
                  <th className="px-5 py-3 font-semibold">Subject</th>
                  <th className="px-5 py-3 font-semibold">Audience</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Scheduled / Sent</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tabCampaigns.map((c) => {
                  const af = c.audienceFilter as any;
                  const isCustom = af?.type === 'custom_list';
                  return (
                    <tr key={c.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-foreground">{c.name}</td>
                      <td className="px-5 py-3.5 max-w-[200px] truncate text-xs text-muted-foreground">{c.subject}</td>
                      <td className="px-5 py-3.5">
                        {isCustom ? (
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="text-xs font-medium text-foreground">
                              {af.listName ?? 'Custom list'} · {(af.contacts as any[])?.length ?? 0}
                            </span>
                          </div>
                        ) : (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Brevo list</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[c.status] ?? 'bg-muted text-muted-foreground'}`}>
                          {formatLabel(c.status)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">
                        {c.sentAt ? formatTime(c.sentAt) : c.scheduledAt ? formatTime(c.scheduledAt) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(c.status === 'DRAFT' || c.status === 'SCHEDULED') && (
                            <>
                              <button onClick={() => openEdit(c)} title="Edit"
                                className="rounded-lg p-1.5 hover:bg-muted/60 transition-colors">
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
                              <button onClick={() => handleSendNow(c.id)} disabled={sending === c.id}
                                className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
                                {sending === c.id ? <CircleNotch className="h-3 w-3 animate-spin" /> : <PaperPlaneTilt className="h-3 w-3" />}
                                Send Now
                              </button>
                              <button onClick={() => handleCancel(c.id)} title="Cancel"
                                className="rounded-lg p-1.5 hover:bg-muted/60 transition-colors">
                                <X className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-5 py-3">
            <p className="text-xs text-muted-foreground">{tabCampaigns.length} campaign{tabCampaigns.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}
    </div>
  );
}
