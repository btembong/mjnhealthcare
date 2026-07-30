'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader, Skeleton } from '@mjn/ui';
import { Headset, CaretDown, CaretUp, CircleNotch } from '@phosphor-icons/react';
import { api } from '../../../lib/api';

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH'] as const;

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-muted text-muted-foreground',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-muted text-muted-foreground',
  MEDIUM: 'bg-amber-50 text-amber-700',
  HIGH: 'bg-rose-100 text-rose-700',
};

function formatLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getAllTickets(statusFilter || undefined)
      .then(setTickets)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  async function handleReply(ticketId: string) {
    const content = replyContent[ticketId]?.trim();
    if (!content) return;
    setSaving(true);
    try {
      const reply = await api.replyToTicket(ticketId, content);
      setTickets((prev) => prev.map((t) =>
        t.id === ticketId
          ? { ...t, replies: [...(t.replies ?? []), reply], status: t.status === 'OPEN' ? 'IN_PROGRESS' : t.status }
          : t,
      ));
      setReplyContent((prev) => ({ ...prev, [ticketId]: '' }));
      toast.success('Reply sent.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(ticketId: string, status: string) {
    try {
      await api.updateTicketStatus(ticketId, status);
      setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status } : t));
      toast.success('Status updated.');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handlePriority(ticketId: string, priority: string) {
    try {
      await api.updateTicketPriority(ticketId, priority);
      setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, priority } : t));
      toast.success('Priority updated.');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = tickets.filter((t) => t.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <PageHeader title="Support Tickets" subtitle="Client support requests and responses" />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
            className={`rounded-2xl border p-4 text-left shadow-sm transition-all hover:shadow-md ${statusFilter === s ? 'border-primary/30 bg-primary/5' : 'border-border bg-white'}`}
          >
            <p className="text-2xl font-extrabold text-foreground">{counts[s] ?? 0}</p>
            <p className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[s]}`}>{formatLabel(s)}</p>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : tickets.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
          <Headset className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-semibold text-foreground">No tickets {statusFilter ? `with status "${formatLabel(statusFilter)}"` : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const expanded = expandedId === ticket.id;
            return (
              <div key={ticket.id} className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                <button
                  className="flex w-full items-start gap-4 p-5 text-left hover:bg-muted/20 transition-colors"
                  onClick={() => setExpandedId(expanded ? null : ticket.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[ticket.status]}`}>
                        {formatLabel(ticket.status)}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_COLORS[ticket.priority]}`}>
                        {formatLabel(ticket.priority)}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {formatLabel(ticket.category)}
                      </span>
                    </div>
                    <p className="font-semibold text-foreground truncate">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ticket.person?.name ?? 'Unknown'} · {ticket.person?.email ?? ''} · {formatTime(ticket.createdAt)}
                      · {ticket.replies?.length ?? 0} replies
                    </p>
                  </div>
                  {expanded ? <CaretUp className="h-4 w-4 text-muted-foreground shrink-0 mt-1" /> : <CaretDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />}
                </button>

                {expanded && (
                  <div className="border-t border-border p-5 space-y-4">
                    {/* Admin controls */}
                    <div className="flex flex-wrap gap-3">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">Status</label>
                        <select
                          value={ticket.status}
                          onChange={(e) => handleStatus(ticket.id, e.target.value)}
                          className="rounded-lg border border-border bg-white px-2 py-1.5 text-xs font-medium outline-none focus:border-primary"
                        >
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">Priority</label>
                        <select
                          value={ticket.priority}
                          onChange={(e) => handlePriority(ticket.id, e.target.value)}
                          className="rounded-lg border border-border bg-white px-2 py-1.5 text-xs font-medium outline-none focus:border-primary"
                        >
                          {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{formatLabel(p)}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Replies */}
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {(ticket.replies ?? []).map((reply: any) => (
                        <div key={reply.id} className={`rounded-xl px-4 py-3 text-sm ${reply.authorRole === 'CLIENT' ? 'bg-muted/40' : 'bg-primary/5 border border-primary/10'}`}>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">
                            {reply.authorRole === 'CLIENT' ? ticket.person?.name : 'MJN Team'} · {formatTime(reply.createdAt)}
                          </p>
                          <p className="text-foreground leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                        </div>
                      ))}
                    </div>

                    {ticket.status !== 'CLOSED' && (
                      <div className="flex gap-3">
                        <textarea
                          value={replyContent[ticket.id] ?? ''}
                          onChange={(e) => setReplyContent((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                          rows={2}
                          placeholder="Reply to client…"
                          className="flex-1 resize-none rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                        <button
                          onClick={() => handleReply(ticket.id)}
                          disabled={saving || !(replyContent[ticket.id]?.trim())}
                          className="self-end rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                        >
                          {saving ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : null}
                          Reply
                        </button>
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
