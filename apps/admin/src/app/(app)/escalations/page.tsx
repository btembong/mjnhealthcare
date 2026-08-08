'use client';

import { useEffect, useState } from 'react';
import { Card } from '@mjn/ui';
import { Warning, CheckCircle } from '@phosphor-icons/react';
import { api } from '../../../lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

export default function EscalationsInboxPage() {
  const [escalations, setEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState<Record<string, string>>({});

  const load = () =>
    api.getConsultantEscalationsInbox()
      .then(setEscalations)
      .catch(() => setEscalations([]))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  async function resolve(id: string) {
    const resolution = resolutionText[id]?.trim();
    if (!resolution) { toast.error('Enter a resolution note'); return; }
    setResolving(id);
    try {
      await api.resolveEscalation(id, resolution);
      toast.success('Escalation resolved');
      load();
    } catch {
      toast.error('Failed to resolve');
    } finally {
      setResolving(null);
    }
  }

  const open = escalations.filter(e => e.status === 'OPEN');
  const resolved = escalations.filter(e => e.status === 'RESOLVED');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Warning className="h-6 w-6 text-rose-500" />
        <div>
          <h1 className="text-xl font-bold">Escalation Inbox</h1>
          <p className="text-xs text-muted-foreground">Cases flagged by processing officers for your attention</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <Card key={i} className="h-28 animate-pulse bg-muted" />)}
        </div>
      ) : (
        <>
          {open.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">
              <CheckCircle className="h-10 w-10 mx-auto mb-3 text-emerald-400" />
              <p className="font-medium">No open escalations</p>
              <p className="text-xs mt-1">All flagged cases have been resolved</p>
            </Card>
          ) : (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-rose-600">Open ({open.length})</h2>
              {open.map(e => (
                <Card key={e.id} className="p-5 border-rose-200">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">OPEN</span>
                        <Link
                          href={`/caseload/${e.engagementId}`}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          View Case →
                        </Link>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {e.engagement?.person?.name ?? 'Unknown Client'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Escalated by {e.officer?.name ?? 'Officer'} · {new Date(e.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-800 mb-3">
                    <span className="font-semibold">Reason: </span>{e.reason}
                  </div>
                  <div className="flex gap-2">
                    <textarea
                      value={resolutionText[e.id] ?? ''}
                      onChange={ev => setResolutionText(p => ({ ...p, [e.id]: ev.target.value }))}
                      placeholder="Enter resolution note…"
                      rows={2}
                      className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                      onClick={() => resolve(e.id)}
                      disabled={resolving === e.id || !resolutionText[e.id]?.trim()}
                      className="shrink-0 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                    >
                      {resolving === e.id ? 'Saving…' : 'Resolve'}
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {resolved.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground">Resolved ({resolved.length})</h2>
              {resolved.map(e => (
                <Card key={e.id} className="p-4 opacity-70">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-semibold">{e.engagement?.person?.name ?? 'Unknown'}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{new Date(e.resolvedAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{e.reason}</p>
                  {e.resolution && <p className="text-xs text-emerald-700 mt-1">Resolution: {e.resolution}</p>}
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
