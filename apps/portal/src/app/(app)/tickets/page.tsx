'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '@mjn/ui';
import {
  Headset, Plus, X, CircleNotch, PaperPlaneTilt,
  FileText, CreditCard, BookOpen, Certificate,
  ChatCircle, Clock, CheckCircle, ArrowLeft,
  CaretDown,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = ['GENERAL', 'DOCUMENT', 'PAYMENT', 'LICENSING', 'EXAM_PREP'] as const;
type Category = (typeof CATEGORIES)[number];
type FilterTab = 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

const STATUS_META: Record<string, { label: string; dot: string; badge: string }> = {
  OPEN:        { label: 'Open',        dot: 'bg-blue-400',    badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  IN_PROGRESS: { label: 'In Progress', dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  RESOLVED:    { label: 'Resolved',    dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CLOSED:      { label: 'Closed',      dot: 'bg-muted-foreground', badge: 'bg-muted text-muted-foreground border-border' },
};

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode }> = {
  GENERAL:   { label: 'General',    icon: <Headset className="h-4 w-4" /> },
  DOCUMENT:  { label: 'Document',   icon: <FileText className="h-4 w-4" /> },
  PAYMENT:   { label: 'Payment',    icon: <CreditCard className="h-4 w-4" /> },
  LICENSING: { label: 'Licensing',  icon: <Certificate className="h-4 w-4" /> },
  EXAM_PREP: { label: 'Exam Prep',  icon: <BookOpen className="h-4 w-4" /> },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function formatFull(ts: string) {
  return new Date(ts).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDateSep(ts: string) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function hasUnread(ticket: any): boolean {
  const replies: any[] = ticket.replies ?? [];
  const last = replies[replies.length - 1];
  return !!last && last.authorRole !== 'CLIENT';
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm px-5 py-4 flex items-center gap-4">
      <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${color}`} />
      <div>
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

// ── Ticket card ───────────────────────────────────────────────────────────────

function TicketCard({
  ticket, selected, onClick,
}: { ticket: any; selected: boolean; onClick: () => void }) {
  const status = STATUS_META[ticket.status] ?? STATUS_META.OPEN;
  const cat = CATEGORY_META[ticket.category] ?? CATEGORY_META.GENERAL;
  const unread = hasUnread(ticket);
  const replies: any[] = ticket.replies ?? [];
  const lastReply = replies[replies.length - 1];

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 border-b border-border/60 transition-colors hover:bg-muted/30 ${
        selected ? 'bg-primary/5 border-l-2 border-l-primary' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Category icon */}
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5 ${
          selected ? 'bg-primary/10 text-primary' : 'bg-muted/60 text-muted-foreground'
        }`}>
          {cat.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className={`text-sm font-semibold truncate flex-1 ${selected ? 'text-primary' : 'text-foreground'}`}>
              {ticket.subject}
            </p>
            {unread && (
              <span className="h-2 w-2 rounded-full bg-primary shrink-0" title="Unread reply" />
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${status.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
            <span className="text-[10px] text-muted-foreground">{cat.label}</span>
            <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo(ticket.updatedAt ?? ticket.createdAt)}</span>
          </div>

          {lastReply && (
            <p className="mt-1 text-xs text-muted-foreground truncate">
              {lastReply.authorRole === 'CLIENT' ? 'You' : 'MJN'}: {lastReply.content}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Thread panel ──────────────────────────────────────────────────────────────

function ThreadPanel({
  ticket, onClose, onReply,
}: {
  ticket: any;
  onClose: () => void;
  onReply: (ticketId: string, content: string) => Promise<void>;
}) {
  const [compose, setCompose] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const status = STATUS_META[ticket.status] ?? STATUS_META.OPEN;
  const cat = CATEGORY_META[ticket.category] ?? CATEGORY_META.GENERAL;
  const replies: any[] = ticket.replies ?? [];
  const isClosed = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies.length]);

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  async function handleSend() {
    const text = compose.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await onReply(ticket.id, text);
      setCompose('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">

      {/* Thread header */}
      <div className="shrink-0 border-b border-border bg-[#0F4C81] px-5 py-3.5">
        <div className="flex items-start gap-3">
          <button
            onClick={onClose}
            className="lg:hidden flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors mt-0.5"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm leading-tight truncate">{ticket.subject}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.badge}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-white/60">
                {cat.icon && <span className="opacity-60">{cat.icon}</span>}
                {cat.label}
              </span>
              <span className="text-[10px] text-white/50">{formatFull(ticket.createdAt)}</span>
            </div>
          </div>
          <button onClick={onClose} className="hidden lg:flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Status timeline */}
      <div className="shrink-0 flex items-center gap-0 border-b border-border bg-muted/10 px-5 py-2 overflow-x-auto">
        {['OPEN', 'IN_PROGRESS', 'RESOLVED'].map((step, i) => {
          const steps = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
          const currentIdx = steps.indexOf(ticket.status);
          const stepIdx = steps.indexOf(step);
          const done = currentIdx >= stepIdx;
          const active = ticket.status === step;
          return (
            <div key={step} className="flex items-center shrink-0">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                active ? 'bg-primary text-white' :
                done ? 'bg-primary/10 text-primary' :
                'text-muted-foreground/50'
              }`}>
                {done && !active && <CheckCircle className="h-3 w-3" weight="fill" />}
                {active && <Clock className="h-3 w-3" />}
                {formatLabel(step)}
              </div>
              {i < 2 && (
                <div className={`h-px w-6 ${done && currentIdx > stepIdx ? 'bg-primary/40' : 'bg-border'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5" style={{ background: '#f0f2f5' }}>
        {replies.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <ChatCircle className="h-10 w-10 text-muted-foreground/20 mb-2" weight="fill" />
            <p className="text-sm text-muted-foreground">No replies yet.</p>
          </div>
        ) : (
          replies.map((reply, i) => {
            const isMe = reply.authorRole === 'CLIENT';
            const prev = replies[i - 1];
            const showDate = !prev || !isSameDay(prev.createdAt, reply.createdAt);
            const nextReply = replies[i + 1];
            const isLastInGroup = !nextReply || nextReply.authorRole !== reply.authorRole;

            return (
              <div key={reply.id ?? i}>
                {showDate && (
                  <div className="flex items-center justify-center my-3">
                    <span className="rounded-full bg-white/90 border border-black/5 px-3 py-1 text-[11px] text-muted-foreground font-medium shadow-sm">
                      {formatDateSep(reply.createdAt)}
                    </span>
                  </div>
                )}

                <div className={`flex items-end gap-1.5 mb-0.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar placeholder */}
                  {!isMe && (
                    <div className="h-6 w-6 shrink-0">
                      {isLastInGroup && (
                        <div className="h-6 w-6 rounded-full bg-[#00A896] flex items-center justify-center text-[10px] font-bold text-white">
                          MJ
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`max-w-[72%] px-3.5 py-2.5 shadow-sm text-sm leading-relaxed ${
                    isMe
                      ? 'bg-[#0F4C81] text-white rounded-2xl rounded-br-sm'
                      : 'bg-white text-foreground rounded-2xl rounded-bl-sm'
                  } ${!isLastInGroup ? (isMe ? 'rounded-br-2xl' : 'rounded-bl-2xl') : ''}`}>
                    <p className="whitespace-pre-wrap break-words">{reply.content}</p>
                    {isLastInGroup && (
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-white/50 text-right' : 'text-muted-foreground/50'}`}>
                        {new Date(reply.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      {isClosed ? (
        <div className="shrink-0 border-t border-border bg-white px-5 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            This ticket is {ticket.status.toLowerCase()}. Open a new ticket if you need further help.
          </p>
        </div>
      ) : (
        <div className="shrink-0 border-t border-border bg-white px-4 py-3 flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={compose}
              onChange={(e) => { setCompose(e.target.value); autoResize(e.target); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Type a reply… (Enter to send)"
              rows={1}
              className="w-full resize-none rounded-full border border-border bg-[#f0f2f5] px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 max-h-[120px] leading-relaxed"
            />
            {compose.length > 300 && (
              <span className={`absolute bottom-2 right-4 text-[10px] ${compose.length > 1000 ? 'text-rose-500' : 'text-muted-foreground/50'}`}>
                {compose.length}/1000
              </span>
            )}
          </div>
          <button
            onClick={handleSend}
            disabled={!compose.trim() || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0F4C81] text-white hover:bg-[#0d3d6a] disabled:opacity-40 transition-colors shadow-sm"
          >
            {sending
              ? <CircleNotch className="h-4 w-4 animate-spin" />
              : <PaperPlaneTilt className="h-4 w-4" weight="fill" />
            }
          </button>
        </div>
      )}
    </div>
  );
}

// ── New ticket slide-in ────────────────────────────────────────────────────────

function NewTicketPanel({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (subject: string, category: string, message: string) => Promise<void>;
}) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<Category>('GENERAL');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      await onCreate(subject.trim(), category, message.trim());
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-[#0F4C81]">
          <div>
            <p className="font-semibold text-white text-sm">New Support Ticket</p>
            <p className="text-xs text-white/60 mt-0.5">We typically respond within 24 hours</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Category */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-foreground uppercase tracking-wide">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => {
                const meta = CATEGORY_META[c];
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all ${
                      category === c
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-white text-muted-foreground hover:border-primary/30 hover:text-foreground'
                    }`}
                  >
                    {meta.icon}
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground uppercase tracking-wide">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder="Brief description of your issue"
              className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Message */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground uppercase tracking-wide">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={6}
              placeholder="Describe your issue in detail. Include any relevant case or order references."
              className="w-full resize-none rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 leading-relaxed"
            />
          </div>

          {/* Info note */}
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700 leading-relaxed">
            For urgent matters, you can also reach us directly on WhatsApp or email us at{' '}
            <a href="mailto:hello@mjnhealthcare.com" className="font-semibold underline">
              hello@mjnhealthcare.com
            </a>
          </div>
        </form>

        {/* Footer */}
        <div className="shrink-0 border-t border-border px-6 py-4 flex gap-3 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={submitting || !subject.trim() || !message.trim()}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            {submitting ? <CircleNotch className="h-4 w-4 animate-spin" /> : null}
            Submit Ticket
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    api.getMyTickets()
      .then(setTickets)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(subject: string, category: string, message: string) {
    const ticket = await api.createTicket(subject, category, message);
    setTickets((prev) => [ticket, ...prev]);
    setSelectedId(ticket.id);
    toast.success('Support ticket created.');
  }

  async function handleReply(ticketId: string, content: string) {
    const reply = await api.replyToTicket(ticketId, content);
    setTickets((prev) => prev.map((t) =>
      t.id === ticketId
        ? { ...t, replies: [...(t.replies ?? []), reply], status: t.status === 'OPEN' ? 'IN_PROGRESS' : t.status, updatedAt: new Date().toISOString() }
        : t,
    ));
  }

  // Stats
  const stats = {
    open:       tickets.filter((t) => t.status === 'OPEN').length,
    inProgress: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
    resolved:   tickets.filter((t) => t.status === 'RESOLVED').length,
    total:      tickets.length,
  };

  // Filtered list
  const filtered = filter === 'ALL'
    ? tickets
    : tickets.filter((t) => t.status === filter);

  const selected = tickets.find((t) => t.id === selectedId) ?? null;

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'ALL',         label: 'All' },
    { key: 'OPEN',        label: 'Open' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'RESOLVED',    label: 'Resolved' },
    { key: 'CLOSED',      label: 'Closed' },
  ];

  return (
    <div className="flex flex-col gap-5 h-[calc(100vh-5rem)]">

      {/* Page title + new button */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-foreground">Support Tickets</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Get help from the MJN team — we respond within 24 hours</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors shadow-sm shrink-0"
        >
          <Plus className="h-4 w-4" /> New Ticket
        </button>
      </div>

      {/* Stat bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
        <StatCard label="Open"        value={stats.open}       color="bg-blue-400" />
        <StatCard label="In Progress" value={stats.inProgress} color="bg-amber-400" />
        <StatCard label="Resolved"    value={stats.resolved}   color="bg-emerald-400" />
        <StatCard label="Total"       value={stats.total}      color="bg-muted-foreground" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto shrink-0 border-b border-border pb-0">
        {TABS.map(({ key, label }) => {
          const count = key === 'ALL' ? tickets.length : tickets.filter((t) => t.status === key).length;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${
                filter === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  filter === key ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Two-pane content area */}
      <div className="flex flex-1 overflow-hidden rounded-2xl border border-border shadow-sm min-h-0">

        {/* Left: ticket list */}
        <div className={`${selected ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 xl:w-96 shrink-0 border-r border-border bg-white overflow-hidden`}>

          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Headset className="h-12 w-12 text-muted-foreground/20 mb-3" />
              <p className="font-semibold text-foreground text-sm">No tickets</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                {filter === 'ALL'
                  ? 'Open a support ticket if you need help with your case, documents, or payments.'
                  : `No ${formatLabel(filter).toLowerCase()} tickets.`}
              </p>
              {filter === 'ALL' && (
                <button
                  onClick={() => setShowNew(true)}
                  className="mt-4 flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Open a ticket
                </button>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-border/40">
              {filtered.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  selected={selectedId === ticket.id}
                  onClick={() => setSelectedId(ticket.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: thread panel */}
        <div className={`${selected ? 'flex' : 'hidden lg:flex'} flex-1 flex-col overflow-hidden`}>
          {selected ? (
            <ThreadPanel
              ticket={selected}
              onClose={() => setSelectedId(null)}
              onReply={handleReply}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center p-8 bg-[#f0f2f5]">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm mb-4">
                <ChatCircle className="h-8 w-8 text-primary/40" weight="fill" />
              </div>
              <p className="font-semibold text-foreground">Select a ticket</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Choose a ticket from the list to view the conversation thread.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New ticket slide-in */}
      {showNew && (
        <NewTicketPanel
          onClose={() => setShowNew(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
