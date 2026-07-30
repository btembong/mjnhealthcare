'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@mjn/ui';
import {
  CircleNotch, CheckCircle, Robot,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [editedDrafts, setEditedDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    api.getPendingDrafts().then(setDrafts).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function handleApprove(id: string) {
    setActionLoading(id);
    try {
      await api.approveDraft(id, 'admin');
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      showToast('Draft approved — consultant can now send it.');
    } catch (err: any) {
      showToast('Error: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }

  function getDraftText(draft: any) {
    return editedDrafts[draft.id] ?? draft.draft ?? '';
  }

  function setDraftText(id: string, value: string) {
    setEditedDrafts((prev) => ({ ...prev, [id]: value }));
  }

  function hasEdits(draft: any) {
    return draft.id in editedDrafts && editedDrafts[draft.id] !== draft.draft;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Draft Review"
        subtitle="AI-generated client communications must be reviewed before sending."
      />

      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <p className="text-sm text-emerald-700">{toast}</p>
        </div>
      )}

      {/* Guardrail notice */}
      <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-700">
        <strong>Review requirement:</strong> All AI-drafted communications touching licensing, visa, or exam content must be reviewed and approved by an authorised consultant before sending. This is enforced in code — approved drafts are flagged with your ID and timestamp.
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <CircleNotch className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : drafts.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
          <Robot className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">No drafts pending</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            All AI drafts have been reviewed. New drafts appear here as consultants generate them.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map((draft: any) => (
            <div key={draft.id} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Robot className="h-3.5 w-3.5 text-violet-500" />
                <span>AI draft · Engagement {draft.engagementId}</span>
                <span>·</span>
                <span>{draft.createdAt ? new Date(draft.createdAt).toLocaleString() : '—'}</span>
                {hasEdits(draft) && (
                  <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Edited</span>
                )}
              </div>
              <textarea
                value={getDraftText(draft)}
                onChange={(e) => setDraftText(draft.id, e.target.value)}
                rows={8}
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground leading-relaxed outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y"
              />
              <div className="mt-3 flex items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground">
                  Edit the draft above if needed. Approval logs your ID and timestamp.
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  {hasEdits(draft) && (
                    <button
                      onClick={() => setDraftText(draft.id, draft.draft)}
                      className="rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/60 transition"
                    >
                      Reset
                    </button>
                  )}
                  <button
                    onClick={() => handleApprove(draft.id)}
                    disabled={!!actionLoading}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
                  >
                    {actionLoading === draft.id
                      ? <CircleNotch className="h-4 w-4 animate-spin" />
                      : <CheckCircle className="h-4 w-4" />
                    }
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
