'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Plus, Pencil, Trash, Check, X, ChatText, MagnifyingGlass, CircleNotch,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';

const CONFIG_KEY = 'message_templates';

type Template = {
  id: string;
  name: string;
  body: string;
  category: string;
  createdAt: string;
};

const CATEGORIES = ['General', 'Documents', 'Payment', 'Licensing', 'Follow-up', 'Welcome'];

const DEFAULT_TEMPLATES: Template[] = [
  { id: 'tpl-1', name: 'Documents verified', category: 'Documents', body: 'Your documents have been verified and approved. We will proceed to the next stage shortly.', createdAt: new Date().toISOString() },
  { id: 'tpl-2', name: 'Upload request', category: 'Documents', body: 'Please upload the requested document to your portal document vault at your earliest convenience.', createdAt: new Date().toISOString() },
  { id: 'tpl-3', name: 'Case progressing', category: 'General', body: 'Your case is progressing well. We will keep you updated on any developments.', createdAt: new Date().toISOString() },
  { id: 'tpl-4', name: 'Schedule call', category: 'Follow-up', body: 'We need to schedule a consultation call to discuss your case. Please let us know your availability.', createdAt: new Date().toISOString() },
  { id: 'tpl-5', name: 'Payment reminder', category: 'Payment', body: 'Your next instalment is now due. Please complete your payment via the portal to avoid any delays to your case.', createdAt: new Date().toISOString() },
  { id: 'tpl-6', name: 'Welcome onboard', category: 'Welcome', body: 'Welcome to MJN Health! We are delighted to be supporting you on your licensing journey. Your assigned consultant will be in touch shortly.', createdAt: new Date().toISOString() },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew]     = useState(false);
  const [form, setForm]           = useState({ name: '', body: '', category: 'General' });
  const [copied, setCopied]       = useState<string | null>(null);
  const saveTimer                 = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from DB on mount
  useEffect(() => {
    api.getSystemConfig()
      .then((config) => {
        const raw = config[CONFIG_KEY];
        if (raw) {
          try { setTemplates(JSON.parse(raw)); return; } catch { /* fall through */ }
        }
        setTemplates(DEFAULT_TEMPLATES);
      })
      .catch(() => setTemplates(DEFAULT_TEMPLATES))
      .finally(() => setLoading(false));
  }, []);

  // Debounced save to DB
  function persistToDb(ts: Template[]) {
    setTemplates(ts);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await api.updateSystemConfig({ [CONFIG_KEY]: JSON.stringify(ts) });
      } catch {
        toast.error('Failed to save templates.');
      } finally {
        setSaving(false);
      }
    }, 800);
  }

  function handleCreate() {
    if (!form.name.trim() || !form.body.trim()) return;
    const newT: Template = {
      id: `tpl-${Date.now()}`,
      name: form.name.trim(),
      body: form.body.trim(),
      category: form.category,
      createdAt: new Date().toISOString(),
    };
    persistToDb([newT, ...templates]);
    setForm({ name: '', body: '', category: 'General' });
    setShowNew(false);
    toast.success('Template created.');
  }

  function handleEdit(t: Template) {
    setForm({ name: t.name, body: t.body, category: t.category });
    setEditingId(t.id);
    setShowNew(false);
  }

  function handleSaveEdit() {
    if (!form.name.trim() || !form.body.trim()) return;
    persistToDb(templates.map((t) => t.id === editingId ? { ...t, ...form } : t));
    setEditingId(null);
    setForm({ name: '', body: '', category: 'General' });
    toast.success('Template updated.');
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this template?')) return;
    persistToDb(templates.filter((t) => t.id !== id));
    toast.success('Template deleted.');
  }

  function handleCopy(body: string, id: string) {
    navigator.clipboard.writeText(body).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  const filtered = templates.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.name.toLowerCase().includes(q) || t.body.toLowerCase().includes(q);
    const matchCat = catFilter === 'All' || t.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Message Templates</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Shared templates for client communications — visible to all staff.
            {saving && <span className="ml-2 text-primary text-xs">Saving…</span>}
          </p>
        </div>
        <button
          onClick={() => { setShowNew(true); setEditingId(null); setForm({ name: '', body: '', category: 'General' }); }}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[#00A896] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity shrink-0"
        >
          <Plus className="h-4 w-4" /> New template
        </button>
      </div>

      {/* Create / edit form */}
      {(showNew || editingId) && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4">
          <p className="text-sm font-semibold text-foreground">{editingId ? 'Edit template' : 'New template'}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Template name…"
              className="col-span-2 h-10 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="h-10 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary"
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <textarea
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            placeholder="Template body…"
            rows={4}
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
          />
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => { setShowNew(false); setEditingId(null); }}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={editingId ? handleSaveEdit : handleCreate}
              disabled={!form.name.trim() || !form.body.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              <Check className="h-4 w-4" />
              {editingId ? 'Save changes' : 'Create template'}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['All', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${catFilter === cat ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <CircleNotch className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
          <ChatText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No templates match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <div key={t.id} className="rounded-2xl border border-border bg-white p-4 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">{t.name}</p>
                  <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {t.category}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleEdit(t)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 flex-1">{t.body}</p>
              <button
                onClick={() => handleCopy(t.body, t.id)}
                className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                  copied === t.id
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-border bg-white text-foreground hover:bg-muted/50'
                }`}
              >
                {copied === t.id ? <Check className="h-3.5 w-3.5" /> : <ChatText className="h-3.5 w-3.5" />}
                {copied === t.id ? 'Copied!' : 'Copy to clipboard'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
