'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader, Skeleton } from '@mjn/ui';
import { MegaphoneSimple, Plus, X, CircleNotch, PaperPlaneTilt, Pencil } from '@phosphor-icons/react';
import { api } from '../../../lib/api';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  SCHEDULED: 'bg-blue-100 text-blue-700',
  SENT: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
};

function formatLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface CampaignForm {
  name: string;
  subject: string;
  body: string;
  scheduledAt: string;
}

const EMPTY_FORM: CampaignForm = { name: '', subject: '', body: '', scheduledAt: '' };

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CampaignForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    api.getCampaigns()
      .then(setCampaigns)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  function openCreate() { setEditId(null); setForm(EMPTY_FORM); setShowForm(true); }
  function openEdit(c: any) {
    setEditId(c.id);
    setForm({ name: c.name, subject: c.subject, body: c.body, scheduledAt: c.scheduledAt ? c.scheduledAt.slice(0, 16) : '' });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) return;
    setSubmitting(true);
    try {
      const payload = { ...form, scheduledAt: form.scheduledAt || undefined };
      if (editId) {
        const updated = await api.updateCampaign(editId, payload);
        setCampaigns((prev) => prev.map((c) => c.id === editId ? updated : c));
        toast.success('Campaign updated.');
      } else {
        const created = await api.createCampaign(payload);
        setCampaigns((prev) => [created, ...prev]);
        toast.success('Campaign draft created.');
      }
      setShowForm(false);
      setEditId(null);
      setForm(EMPTY_FORM);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendNow(id: string) {
    if (!confirm('Send this campaign to all subscribers now?')) return;
    setSending(id);
    try {
      const updated = await api.sendCampaignNow(id);
      setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, status: 'SENT', sentAt: updated.sentAt } : c));
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

  const stats = ['DRAFT', 'SCHEDULED', 'SENT', 'CANCELLED'].map((s) => ({
    status: s,
    count: campaigns.filter((c) => c.status === s).length,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Campaigns" subtitle="Email campaigns sent via Brevo" />
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" /> New Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {stats.map(({ status, count }) => (
          <div key={status} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <p className="text-2xl font-extrabold text-foreground">{count}</p>
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[status]}`}>
              {formatLabel(status)}
            </span>
          </div>
        ))}
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-foreground">{editId ? 'Edit Campaign' : 'New Campaign Draft'}</p>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg p-1.5 hover:bg-muted/60">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">Campaign Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder="e.g. UAE Nurses — July 2026"
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">Email Subject</label>
              <input
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                required
                placeholder="Subject line…"
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Body (HTML or plain text)</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              required
              rows={8}
              placeholder="Email content…"
              className="w-full resize-none rounded-xl border border-border bg-muted/30 px-3 py-2.5 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Schedule (optional — leave blank to save as draft)</label>
            <input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
              className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted/40">Cancel</button>
            <button type="submit" disabled={submitting} className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
              {submitting ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : null}
              {editId ? 'Save Changes' : 'Create Draft'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
          <MegaphoneSimple className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-semibold text-foreground">No campaigns yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create your first campaign draft to get started.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/20 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Campaign</th>
                  <th className="px-5 py-3 font-medium">Subject</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Scheduled / Sent</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">{c.name}</td>
                    <td className="px-5 py-3 max-w-xs truncate text-muted-foreground text-xs">{c.subject}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[c.status]}`}>
                        {formatLabel(c.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {c.sentAt ? formatTime(c.sentAt) : c.scheduledAt ? formatTime(c.scheduledAt) : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(c.status === 'DRAFT' || c.status === 'SCHEDULED') && (
                          <>
                            <button
                              onClick={() => openEdit(c)}
                              className="rounded-lg p-1.5 hover:bg-muted/60 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleSendNow(c.id)}
                              disabled={sending === c.id}
                              className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                            >
                              {sending === c.id ? <CircleNotch className="h-3 w-3 animate-spin" /> : <PaperPlaneTilt className="h-3 w-3" />}
                              Send Now
                            </button>
                            <button
                              onClick={() => handleCancel(c.id)}
                              className="rounded-lg p-1.5 hover:bg-muted/60 transition-colors"
                              title="Cancel"
                            >
                              <X className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
