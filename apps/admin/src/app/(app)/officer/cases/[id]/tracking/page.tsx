'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@mjn/ui';
import { ArrowSquareUpRight, Plus } from '@phosphor-icons/react';
import { api } from '../../../../../lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

const PORTALS = ['DataFlow', 'DHA', 'MOH', 'DOH', 'NMC', 'NCLEX/CGFNS', 'NMBI', 'Other'];
const STATUSES = ['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'PENDING_DOCS', 'RESUBMITTED'];

export default function TrackingPage() {
  const { id } = useParams<{ id: string }>();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    portal: 'DataFlow',
    referenceNumber: '',
    submittedAt: '',
    status: 'SUBMITTED',
    notes: '',
    nextActionDate: '',
  });

  const load = () =>
    api.getTracking(id)
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.addTracking(id, form);
      toast.success('Tracking entry added');
      setForm({ portal: 'DataFlow', referenceNumber: '', submittedAt: '', status: 'SUBMITTED', notes: '', nextActionDate: '' });
      load();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ArrowSquareUpRight className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold">Application Tracking</h1>
          <Link href={`/officer/cases/${id}`} className="text-xs text-primary hover:underline">← Back to case</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add form */}
        <Card className="p-5">
          <h2 className="text-sm font-bold mb-4">Add Submission Entry</h2>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1">Portal / Body</label>
              <select
                value={form.portal}
                onChange={e => setForm(p => ({ ...p, portal: e.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {PORTALS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Reference Number</label>
              <input
                type="text"
                value={form.referenceNumber}
                onChange={e => setForm(p => ({ ...p, referenceNumber: e.target.value }))}
                placeholder="e.g. DHA-2024-001234"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Submitted Date</label>
                <input
                  type="date"
                  value={form.submittedAt}
                  onChange={e => setForm(p => ({ ...p, submittedAt: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Next Action Date</label>
              <input
                type="date"
                value={form.nextActionDate}
                onChange={e => setForm(p => ({ ...p, nextActionDate: e.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                rows={3}
                placeholder="Additional notes…"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              {saving ? 'Saving…' : 'Add Entry'}
            </button>
          </form>
        </Card>

        {/* History */}
        <Card className="p-5">
          <h2 className="text-sm font-bold mb-4">Submission History</h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : records.length === 0 ? (
            <p className="text-xs text-muted-foreground">No submissions yet.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {records.map(r => (
                <div key={r.id} className="rounded-xl border border-border p-3 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{r.portal}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary font-medium">{r.status}</span>
                  </div>
                  {r.referenceNumber && <p className="text-muted-foreground">Ref: {r.referenceNumber}</p>}
                  {r.notes && <p className="text-foreground mt-1">{r.notes}</p>}
                  {r.nextActionDate && (
                    <p className="text-amber-600 mt-1">
                      Next action: {new Date(r.nextActionDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
