'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader, Skeleton, Button } from '@mjn/ui';
import { Headset, Plus, X, CircleNotch, CaretDown, CaretUp } from '@phosphor-icons/react';
import { api } from '../../../lib/api';

const CATEGORIES = ['GENERAL', 'DOCUMENT', 'PAYMENT', 'LICENSING', 'EXAM_PREP'] as const;
type Category = (typeof CATEGORIES)[number];

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-muted text-muted-foreground',
};

function formatLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<Category>('GENERAL');
  const [firstMessage, setFirstMessage] = useState('');

  useEffect(() => {
    api.getMyTickets()
      .then(setTickets)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !firstMessage.trim()) return;
    setSubmitting(true);
    try {
      const ticket = await api.createTicket(subject.trim(), category, firstMessage.trim());
      setTickets((prev) => [ticket, ...prev]);
      setShowForm(false);
      setSubject(''); setCategory('GENERAL'); setFirstMessage('');
      setExpandedId(ticket.id);
      toast.success('Support ticket created.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(ticketId: string) {
    const content = replyContent[ticketId]?.trim();
    if (!content) return;
    setSubmitting(true);
    try {
      const reply = await api.replyToTicket(ticketId, content);
      setTickets((prev) => prev.map((t) =>
        t.id === ticketId ? { ...t, replies: [...(t.replies ?? []), reply], status: t.status === 'OPEN' ? 'IN_PROGRESS' : t.status } : t,
      ));
      setReplyContent((prev) => ({ ...prev, [ticketId]: '' }));
      toast.success('Reply sent.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Support Tickets" subtitle="Get help from the MJN team" />
        <Button onClick={() => setShowForm(!showForm)} className="rounded-xl shrink-0">
          {showForm ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
          {showForm ? 'Cancel' : 'New Ticket'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-4">
          <p className="font-semibold text-foreground">Open a Support Ticket</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="Brief description of your issue"
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{formatLabel(c)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Message</label>
            <textarea
              value={firstMessage}
              onChange={(e) => setFirstMessage(e.target.value)}
              required
              rows={4}
              placeholder="Describe your issue in detail…"
              className="w-full resize-none rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Cancel</Button>
            <Button type="submit" disabled={submitting} className="rounded-xl">
              {submitting ? <CircleNotch className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Submit Ticket
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : tickets.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
          <Headset className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-semibold text-foreground">No tickets yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Open a ticket if you need help with your case, documents, or payments.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const expanded = expandedId === ticket.id;
            return (
              <div key={ticket.id} className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                {/* Header */}
                <button
                  className="flex w-full items-start gap-4 p-5 text-left hover:bg-muted/20 transition-colors"
                  onClick={() => setExpandedId(expanded ? null : ticket.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[ticket.status] ?? ''}`}>
                        {formatLabel(ticket.status)}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {formatLabel(ticket.category)}
                      </span>
                    </div>
                    <p className="font-semibold text-foreground truncate">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatTime(ticket.createdAt)} · {ticket.replies?.length ?? 0} replies</p>
                  </div>
                  {expanded ? <CaretUp className="h-4 w-4 text-muted-foreground shrink-0 mt-1" /> : <CaretDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />}
                </button>

                {expanded && (
                  <div className="border-t border-border px-5 pb-5">
                    {/* Replies */}
                    <div className="pt-4 space-y-3 max-h-72 overflow-y-auto">
                      {(ticket.replies ?? []).map((reply: any) => (
                        <div key={reply.id} className={`rounded-xl px-4 py-3 text-sm ${reply.authorRole === 'CLIENT' ? 'bg-primary/5 border border-primary/10' : 'bg-muted/40'}`}>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">
                            {reply.authorRole === 'CLIENT' ? 'You' : `MJN Team`} · {formatTime(reply.createdAt)}
                          </p>
                          <p className="text-foreground leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                        </div>
                      ))}
                    </div>

                    {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                      <div className="mt-4 flex gap-3">
                        <textarea
                          value={replyContent[ticket.id] ?? ''}
                          onChange={(e) => setReplyContent((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                          rows={2}
                          placeholder="Add a reply…"
                          className="flex-1 resize-none rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                        <Button
                          onClick={() => handleReply(ticket.id)}
                          disabled={submitting || !(replyContent[ticket.id]?.trim())}
                          className="rounded-xl self-end shrink-0"
                        >
                          Reply
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
