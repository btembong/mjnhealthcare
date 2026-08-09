'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@mjn/ui';
import {
  User, FileText, Note, ArrowSquareUpRight, Warning,
  CheckCircle, ClockCounterClockwise, Plus, PaperPlaneRight, Lock,
} from '@phosphor-icons/react';
import { api } from '../../../../../lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

export default function OfficerCaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [engagement, setEngagement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [sendToClient, setSendToClient] = useState(false);
  const [sensitiveUpdate, setSensitiveUpdate] = useState(false);

  useEffect(() => {
    api.getOfficerCase(id)
      .then(setEngagement)
      .catch(() => toast.error('Failed to load case'))
      .finally(() => setLoading(false));
  }, [id]);

  async function submitNote() {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      await api.addCaseNote(id, noteText, !sendToClient, sensitiveUpdate && sendToClient);
      toast.success(
        !sendToClient ? 'Note added' :
        sensitiveUpdate ? 'Update queued for consultant approval' :
        'Note sent to client',
      );
      setNoteText('');
      setSendToClient(false);
      setSensitiveUpdate(false);
      const updated = await api.getOfficerCase(id);
      setEngagement(updated);
    } catch {
      toast.error('Failed to add note');
    } finally {
      setAddingNote(false);
    }
  }

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;
  if (!engagement) return <p className="text-muted-foreground">Case not found.</p>;

  const { person, milestones, caseNotes, applicationTracking, orders, handoverNotes } = engagement;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
            {person?.name?.slice(0, 2).toUpperCase() ?? '??'}
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">{person?.name}</h1>
            <p className="text-xs text-muted-foreground">{person?.email} · {person?.profession}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/officer/cases/${id}/tracking`}
            className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
          >
            <ArrowSquareUpRight className="h-3.5 w-3.5" /> Track Application
          </Link>
          <Link
            href={`/officer/cases/${id}/escalate`}
            className="flex items-center gap-1.5 rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-600 transition-colors"
          >
            <Warning className="h-3.5 w-3.5" /> Escalate
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: milestones + tracking */}
        <div className="lg:col-span-2 space-y-5">
          {/* Milestones */}
          <Card className="p-5">
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" /> Milestones
            </h2>
            {milestones.length === 0 ? (
              <p className="text-xs text-muted-foreground">No milestones yet.</p>
            ) : (
              <ul className="space-y-2">
                {milestones.map((m: any) => (
                  <li key={m.id} className="flex items-center gap-2 text-xs">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${m.completedAt ? 'bg-emerald-500' : 'bg-border'}`} />
                    <span className={m.completedAt ? 'text-foreground' : 'text-muted-foreground'}>{m.title}</span>
                    {m.completedAt && (
                      <span className="ml-auto text-emerald-600">
                        {new Date(m.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Application Tracking */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ArrowSquareUpRight className="h-4 w-4 text-primary" /> Application Tracking
              </h2>
              <Link
                href={`/officer/cases/${id}/tracking`}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add entry
              </Link>
            </div>
            {applicationTracking.length === 0 ? (
              <p className="text-xs text-muted-foreground">No submissions tracked yet.</p>
            ) : (
              <div className="space-y-2">
                {applicationTracking.map((t: any) => (
                  <div key={t.id} className="rounded-xl border border-border px-3 py-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{t.portal}</span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary font-medium">{t.status}</span>
                    </div>
                    {t.referenceNumber && <p className="text-muted-foreground mt-0.5">Ref: {t.referenceNumber}</p>}
                    {t.notes && <p className="text-muted-foreground mt-0.5">{t.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right: notes */}
        <div className="space-y-5">
          {/* Orders summary */}
          <Card className="p-5">
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Orders
            </h2>
            {orders.length === 0 ? (
              <p className="text-xs text-muted-foreground">No orders.</p>
            ) : (
              <ul className="space-y-1.5">
                {orders.map((o: any) => (
                  <li key={o.id} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">${o.total?.toFixed(2)}</span>
                    <span className={`font-medium ${o.status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {o.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Handover Notes */}
          {handoverNotes && (
            <Card className="p-4 border-amber-200 bg-amber-50">
              <p className="text-xs font-semibold text-amber-800 mb-1 flex items-center gap-1.5">
                <Note className="h-3.5 w-3.5" /> Handover Notes
              </p>
              <p className="text-xs text-amber-900">{handoverNotes}</p>
            </Card>
          )}

          {/* Case Notes */}
          <Card className="p-5">
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Note className="h-4 w-4 text-primary" /> Case Notes
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
              {caseNotes.length === 0 ? (
                <p className="text-xs text-muted-foreground">No notes yet.</p>
              ) : (
                caseNotes.map((n: any) => (
                  <div key={n.id} className={`rounded-xl px-3 py-2 text-xs ${n.isInternal ? 'bg-muted/50' : 'bg-teal-50 border border-teal-200'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="font-semibold">{n.author?.name ?? 'Staff'}</span>
                      {!n.isInternal && (
                        <span className="rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold text-teal-700">Sent to client</span>
                      )}
                      <span className="ml-auto text-muted-foreground">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-foreground">{n.content}</p>
                  </div>
                ))
              )}
            </div>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder={sendToClient ? 'Write client update message…' : 'Add internal note…'}
              rows={3}
              className={`w-full rounded-xl border px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 ${sendToClient ? 'border-teal-300 bg-teal-50/50 focus:ring-teal-300/30' : 'border-border bg-background focus:ring-primary/30'}`}
            />
            {/* Send to client toggle */}
            <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
              <div
                onClick={() => setSendToClient(p => !p)}
                className={`relative h-4 w-8 rounded-full transition-colors ${sendToClient ? 'bg-teal-500' : 'bg-muted-foreground/30'}`}
              >
                <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${sendToClient ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span className={`text-xs font-medium ${sendToClient ? 'text-teal-700' : 'text-muted-foreground'}`}>
                {sendToClient ? 'Send to client (email + WhatsApp)' : 'Internal note only'}
              </span>
            </label>
            {/* Sensitive toggle — only visible when sendToClient is on */}
            {sendToClient && (
              <label className="flex items-center gap-2 mt-1.5 cursor-pointer select-none">
                <div
                  onClick={() => setSensitiveUpdate(p => !p)}
                  className={`relative h-4 w-8 rounded-full transition-colors ${sensitiveUpdate ? 'bg-amber-500' : 'bg-muted-foreground/30'}`}
                >
                  <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${sensitiveUpdate ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className={`text-xs font-medium ${sensitiveUpdate ? 'text-amber-700' : 'text-muted-foreground'}`}>
                  {sensitiveUpdate ? 'Sensitive — requires consultant approval first' : 'Routine update (sends directly)'}
                </span>
              </label>
            )}
            <button
              onClick={submitNote}
              disabled={addingNote || !noteText.trim()}
              className={`mt-2 w-full rounded-xl px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 transition-colors ${
                !sendToClient ? 'bg-primary hover:bg-primary/90' :
                sensitiveUpdate ? 'bg-amber-600 hover:bg-amber-700' :
                'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              {addingNote ? 'Saving…' :
               !sendToClient ? 'Add Internal Note' :
               sensitiveUpdate ? 'Submit for Approval' :
               'Send Update to Client'}
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
