'use client';

import { useEffect, useState } from 'react';
import { Card } from '@mjn/ui';
import {
  CheckCircle, X, Warning, User, Note, Clock,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';
import { toast } from 'sonner';

export default function ApprovalsPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getPendingApprovals();
      setPending(data ?? []);
    } catch {
      toast.error('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleApprove(noteId: string) {
    setActing(noteId);
    try {
      await api.approveNote(noteId);
      toast.success('Update approved and sent to client');
      setPending(prev => prev.filter(n => n.id !== noteId));
    } catch {
      toast.error('Failed to approve');
    } finally {
      setActing(null);
    }
  }

  async function handleReject(noteId: string) {
    setActing(noteId);
    try {
      await api.rejectNote(noteId);
      toast.success('Update rejected — kept as internal note');
      setPending(prev => prev.filter(n => n.id !== noteId));
    } catch {
      toast.error('Failed to reject');
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Note className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Pending Approvals</h1>
          <p className="text-xs text-muted-foreground">
            Officer-drafted client updates marked as sensitive — review before they are sent
          </p>
        </div>
        {!loading && (
          <span className="ml-auto rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            {pending.length} pending
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-28 animate-pulse bg-muted" />
          ))}
        </div>
      ) : pending.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-3" weight="fill" />
          <p className="font-semibold text-foreground">All clear</p>
          <p className="text-sm text-muted-foreground mt-1">No officer updates are waiting for approval.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {pending.map(note => (
            <Card key={note.id} className="p-5 border-amber-200">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 shrink-0">
                    <Warning className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {note.engagement?.person?.name ?? 'Unknown client'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {note.engagement?.person?.email}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                    <User className="h-3 w-3" /> {note.author?.name ?? 'Officer'}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-0.5">
                    <Clock className="h-3 w-3" /> {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Update content */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-4">
                <p className="text-xs font-semibold text-amber-700 mb-1">Draft update to client:</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleReject(note.id)}
                  disabled={acting === note.id}
                  className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted/50 disabled:opacity-50 transition-colors"
                >
                  <X className="h-3.5 w-3.5" /> Reject
                </button>
                <button
                  onClick={() => handleApprove(note.id)}
                  disabled={acting === note.id}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
                >
                  <CheckCircle className="h-3.5 w-3.5" weight="fill" />
                  {acting === note.id ? 'Processing…' : 'Approve & Send to Client'}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
