'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@mjn/ui';
import { Warning } from '@phosphor-icons/react';
import { api } from '../../../../../../lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

export default function EscalatePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [consultants, setConsultants] = useState<any[]>([]);
  const [consultantId, setConsultantId] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getConsultants(true).then(data => {
      setConsultants(data ?? []);
      if (data?.length > 0) setConsultantId(data[0].id);
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim() || !consultantId) return;
    setSaving(true);
    try {
      await api.escalateCase(id, consultantId, reason);
      toast.success('Case escalated to consultant');
      router.push(`/officer/cases/${id}`);
    } catch {
      toast.error('Failed to escalate');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Warning className="h-6 w-6 text-rose-500" />
        <div>
          <h1 className="text-xl font-bold">Escalate Case</h1>
          <Link href={`/officer/cases/${id}`} className="text-xs text-primary hover:underline">← Back to case</Link>
        </div>
      </div>

      <Card className="p-6">
        <p className="text-xs text-muted-foreground mb-4">
          Escalating will notify the assigned consultant and flag this case for urgent review.
          Use this when you encounter a compliance issue, a client dispute, or something that requires
          consultant decision-making.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1">Assign to Consultant</label>
            <select
              value={consultantId}
              onChange={e => setConsultantId(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {consultants.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Reason for Escalation</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
              rows={5}
              placeholder="Describe the issue that requires consultant attention…"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !reason.trim() || !consultantId}
            className="w-full rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Escalating…' : 'Escalate Case'}
          </button>
        </form>
      </Card>
    </div>
  );
}
