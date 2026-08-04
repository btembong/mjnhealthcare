'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '@mjn/ui';
import {
  Headset, CircleNotch, PaperPlaneTilt, X,
  MagnifyingGlass, ChatCircle, CheckCircle, Clock,
  FileText, CreditCard, BookOpen, Certificate,
  CaretDown, ArrowLeft, Warning, User,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH'] as const;

const STATUS_META: Record<string, { label: string; dot: string; badge: string }> = {
  OPEN:        { label: 'Open',        dot: 'bg-blue-400',    badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  IN_PROGRESS: { label: 'In Progress', dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  RESOLVED:    { label: 'Resolved',    dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CLOSED:      { label: 'Closed',      dot: 'bg-muted-foreground', badge: 'bg-muted text-muted-foreground border-border' },
};

const PRIORITY_META: Record<string, { label: string; badge: string }> = {
  LOW:    { label: 'Low',    badge: 'bg-muted text-muted-foreground border-border' },
  MEDIUM: { label: 'Medium', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  HIGH:   { label: 'High',   badge: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode }> = {
  GENERAL:   { label: 'General',   icon: <Headset className="h-3.5 w-3.5" /> },
  DOCUMENT:  { label: 'Document',  icon: <FileText className="h-3.5 w-3.5" /> },
  PAYMENT:   { label: 'Payment',   icon: <CreditCard className="h-3.5 w-3.5" /> },
  LICENSING: { label: 'Licensing', icon: <Certificate className="h-3.5 w-3.5" /> },
  EXAM_PREP: { label: 'Exam Prep', icon: <BookOpen className="h-3.5 w-3.5" /> },
};

const QUICK_REPLIES = [
  'We have received your request and are looking into it.',
  'Please upload the required document to your portal vault.',
  'Your case has been updated. Please check your portal for details.',
  'This issue has been resolved. Let us know if you need further assistance.',
  'We will get back to you within 24 hours.',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatLabel(s: string) {
  return s?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? '';
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

function initials(name?: string) {
  if (!name) return '??';
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

// ── Stat card (clickable filter) ──────────────────────────────────────────────

function StatCard({
  label, value, color, active, onClick,
}: { label: string; value: number; color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border shadow-sm px-5 py-4 text-left flex items-center gap-4 transition-all hover:shadow-md ${
        active ? 'border-primary/30 bg-primary/5' : 'border-border bg-white'
      }`}
    >
      <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${color}`} />
      <div>
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </button>
  );
}

// ── Ticket row ────────────────────────────────────────────────────────────────

function TicketRow({
  ticket, selected, onClick,
}: { ticket: any; selected: boolean; onClick: () => void }) {
  const status = STATUS_META[ticket.status] ?? STATUS_META.OPEN;
  const priority = PRIORITY_META[ticket.priority] ?? PRIORITY_META.LOW;
  const cat = CATEGORY_META[ticket.category] ?? CATEGORY_META.GENERAL;
  const replies: any[] = ticket.replies ?? [];
  const lastReply = replies[replies.length - 1];
  const needsReply = lastReply?.authorRole === 'CLIENT' || replies.length === 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 border-b border-border/60 transition-colors hover:bg-muted/30 ${
        selected ? 'bg-primary/5 border-l-2 border-l-primary' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Client avatar */}
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5 ${
          selected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
        }`}>
          {initials(ticket.person?.name)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className={`text-sm font-semibold truncate flex-1 ${selected ? 'text-primary' : 'text-foreground'}`}>
              {ticket.subject}
            </p>
            {needsReply && ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' && (
              <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" title="Awaiting reply" />
            )}
          </div>

          <p className="text-xs text-muted-foreground truncate mb-1.5">
            {ticket.person?.name ?? 'Unknown'} · {ticket.person?.email ?? ''}
          </p>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${status.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
            {ticket.priority && ticket.priority !== 'LOW' && (
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${priority.badge}`}>
                {ticket.priority === 'HIGH' && <Warning className="h-2.5 w-2.5" />}
                {priority.label}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              {cat.icon} {cat.label}
            </span>
            <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo(ticket.updatedAt ?? ticket.createdAt)}</span>
          </div>

          {lastReply && (
            <p className="mt-1 text-xs text-muted-foreground truncate">
              {lastReply.authorRole === 'CLIENT' ? ticket.person?.name?.split(' ')[0] ?? 'Client' : 'You'}: {lastReply.content}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Thread panel ──────────────────────────────────────────────────────────────

function ThreadPanel({
  ticket,
  onClose,
  onReply,
  onStatusChange,
  onPriorityChange,
}: {
  ticket: any;
  onClose: () => void;
  onReply: (ticketId: string, content: string) => Promise<void>;
  onStatusChange: (ticketId: string, status: string) => Promise<void>;
  onPriorityChange: (ticketId: string, priority: string) => Promise<void>;
}) {
  const [compose, setCompose] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const status = STATUS_META[ticket.status] ?? STATUS_META.OPEN;
  const priority = PRIORITY_META[ticket.priority] ?? PRIORITY_META.LOW;
  const cat = CATEGORY_META[ticket.category] ?? CATEGORY_META.GENERAL;
  const replies: any[] = ticket.replies ?? [];
  const isClosed = ticket.status === 'CLOSED';

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [ticket.id, replies.length]);

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

  async function quickStatus(status: string) {
    setUpdatingStatus(true);
    try { await onStatusChange(ticket.id, status); } finally { setUpdatingStatus(false); }
  }

  return (
    <div className="flex flex-col h-full bg-white">

      {/* Header */}
      <div className="shrink-0 bg-[#0F4C81] px-5 py-3.5 border-b border-[#0d3d6a]">
        <div className="flex items-start gap-3">
          {/* Mobile back */}
          <button onClick={onClose} className="lg:hidden flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors mt-0.5">
            <ArrowLeft className="h-4 w-4" />
          </button>

          {/* Client info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                {initials(ticket.person?.name)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm leading-tight truncate">{ticket.subject}</p>
                <p className="text-xs text-white/60 truncate">
                  {ticket.person?.name ?? 'Unknown'} · {ticket.person?.email ?? '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Desktop close */}
          <button onClick={onClose} className="hidden lg:flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Meta row */}
        <div className="mt-2.5 flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${status.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${priority.badge}`}>
            {priority.label} priority
          </span>
          <span className="flex items-center gap-1 text-[10px] text-white/50">
            {cat.icon} {cat.label}
          </span>
          <span className="text-[10px] text-white/40 ml-auto">{formatFull(ticket.createdAt)}</span>
        </div>
      </div>

      {/* Admin controls bar */}
      <div className="shrink-0 flex items-center gap-3 border-b border-border bg-muted/20 px-4 py-2.5 flex-wrap">
        {/* Status */}
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Status</label>
          <div className="relative">
            <select
              value={ticket.status}
              onChange={(e) => quickStatus(e.target.value)}
              disabled={updatingStatus}
              className="h-7 appearance-none rounded-lg border border-border bg-white pl-2.5 pr-6 text-xs font-medium outline-none focus:border-primary cursor-pointer"
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
            </select>
            <CaretDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* Priority */}
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Priority</label>
          <div className="relative">
            <select
              value={ticket.priority ?? 'LOW'}
              onChange={(e) => onPriorityChange(ticket.id, e.target.value)}
              className="h-7 appearance-none rounded-lg border border-border bg-white pl-2.5 pr-6 text-xs font-medium outline-none focus:border-primary cursor-pointer"
            >
              {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{formatLabel(p)}</option>)}
            </select>
            <CaretDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <div className="flex-1" />

        {/* Quick action buttons */}
        {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
          <button
            onClick={() => quickStatus('RESOLVED')}
            disabled={updatingStatus}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {updatingStatus ? <CircleNotch className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" weight="fill" />}
            Mark Resolved
          </button>
        )}
        {ticket.status !== 'CLOSED' && (
          <button
            onClick={() => quickStatus('CLOSED')}
            disabled={updatingStatus}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/50 disabled:opacity-50 transition-colors"
          >
            Close
          </button>
        )}

        {updatingStatus && <CircleNotch className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5" style={{ background: '#f0f2f5' }}>
        {replies.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <ChatCircle className="h-10 w-10 text-muted-foreground/20 mb-2" weight="fill" />
            <p className="text-sm text-muted-foreground">No replies yet.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Reply below to start the conversation with this client.</p>
          </div>
        ) : (
          replies.map((reply, i) => {
            const isAdmin = reply.authorRole !== 'CLIENT';
            const prev = replies[i - 1];
            const next = replies[i + 1];
            const showDate = !prev || !isSameDay(prev.createdAt, reply.createdAt);
            const isLastInGroup = !next || next.authorRole !== reply.authorRole;

            return (
              <div key={reply.id ?? i}>
                {showDate && (
                  <div className="flex items-center justify-center my-3">
                    <span className="rounded-full bg-white/90 border border-black/5 px-3 py-1 text-[11px] text-muted-foreground font-medium shadow-sm">
                      {formatDateSep(reply.createdAt)}
                    </span>
                  </div>
                )}

                <div className={`flex items-end gap-1.5 mb-0.5 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className="h-6 w-6 shrink-0">
                    {isLastInGroup && (
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                        isAdmin ? 'bg-primary' : 'bg-[#00A896]'
                      }`}>
                        {isAdmin ? 'MJ' : initials(ticket.person?.name)}
                      </div>
                    )}
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[72%] px-3.5 py-2.5 shadow-sm text-sm leading-relaxed ${
                    isAdmin
                      ? 'bg-[#0F4C81] text-white rounded-2xl rounded-br-sm'
                      : 'bg-white text-foreground rounded-2xl rounded-bl-sm'
                  } ${!isLastInGroup ? (isAdmin ? 'rounded-br-2xl' : 'rounded-bl-2xl') : ''}`}>
                    <p className="whitespace-pre-wrap break-words">{reply.content}</p>
                    {isLastInGroup && (
                      <p className={`text-[10px] mt-1 ${isAdmin ? 'text-white/50 text-right' : 'text-muted-foreground/50'}`}>
                        {new Date(reply.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        {isAdmin && <span className="ml-1">· You</span>}
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

      {/* Quick replies */}
      <div className="shrink-0 flex gap-2 overflow-x-auto px-4 py-2 bg-white border-t border-border/50 scrollbar-hide">
        {QUICK_REPLIES.map((qr) => (
          <button
            key={qr}
            onClick={() => { setCompose(qr); textareaRef.current?.focus(); }}
            className="whitespace-nowrap shrink-0 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-foreground hover:bg-muted hover:border-primary/30 transition-colors"
          >
            {qr.length > 40 ? qr.slice(0, 40) + '…' : qr}
          </button>
        ))}
      </div>

      {/* Compose */}
      {isClosed ? (
        <div className="shrink-0 border-t border-border bg-white px-5 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            Ticket is closed. Reopen by changing status above.
          </p>
        </div>
      ) : (
        <div className="shrink-0 flex items-end gap-2 border-t border-border bg-white px-4 py-3">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={compose}
              onChange={(e) => { setCompose(e.target.value); autoResize(e.target); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={`Reply to ${ticket.person?.name?.split(' ')[0] ?? 'client'}…`}
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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.getAllTickets(statusFilter || undefined)
      .then(setTickets)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  async function handleReply(ticketId: string, content: string) {
    const reply = await api.replyToTicket(ticketId, content);
    setTickets((prev) => prev.map((t) =>
      t.id === ticketId
        ? { ...t, replies: [...(t.replies ?? []), reply], status: t.status === 'OPEN' ? 'IN_PROGRESS' : t.status, updatedAt: new Date().toISOString() }
        : t,
    ));
    toast.success('Reply sent.');
  }

  async function handleStatusChange(ticketId: string, status: string) {
    await api.updateTicketStatus(ticketId, status);
    setTickets((prev) => prev.map((t) =>
      t.id === ticketId ? { ...t, status, updatedAt: new Date().toISOString() } : t,
    ));
    toast.success(`Status set to ${formatLabel(status)}.`);
  }

  async function handlePriorityChange(ticketId: string, priority: string) {
    await api.updateTicketPriority(ticketId, priority);
    setTickets((prev) => prev.map((t) =>
      t.id === ticketId ? { ...t, priority } : t,
    ));
    toast.success(`Priority set to ${formatLabel(priority)}.`);
  }

  // Stats (always from all loaded tickets — ignore search)
  const stats = {
    open:       tickets.filter((t) => t.status === 'OPEN').length,
    inProgress: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
    resolved:   tickets.filter((t) => t.status === 'RESOLVED').length,
    closed:     tickets.filter((t) => t.status === 'CLOSED').length,
    needsReply: tickets.filter((t) => {
      const replies: any[] = t.replies ?? [];
      const last = replies[replies.length - 1];
      return (last?.authorRole === 'CLIENT' || replies.length === 0) && t.status !== 'CLOSED' && t.status !== 'RESOLVED';
    }).length,
  };

  // Filtered + searched list
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return tickets.filter((t) => {
      if (!q) return true;
      return (
        t.subject?.toLowerCase().includes(q) ||
        t.person?.name?.toLowerCase().includes(q) ||
        t.person?.email?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      );
    });
  }, [tickets, search]);

  const selected = tickets.find((t) => t.id === selectedId) ?? null;

  const TABS = [
    { key: '',            label: 'All' },
    { key: 'OPEN',        label: 'Open' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'RESOLVED',    label: 'Resolved' },
    { key: 'CLOSED',      label: 'Closed' },
  ];

  return (
    <div className="flex flex-col gap-5 h-[calc(100vh-5rem)]">

      {/* Page header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-foreground">Support Tickets</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Client support requests · manage and respond</p>
        </div>
        {stats.needsReply > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            <Warning className="h-4 w-4 shrink-0" />
            <span className="font-semibold">{stats.needsReply}</span> ticket{stats.needsReply !== 1 ? 's' : ''} awaiting reply
          </div>
        )}
      </div>

      {/* Stat bar (clickable filters) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
        <StatCard label="Open"        value={stats.open}       color="bg-blue-400"    active={statusFilter === 'OPEN'}        onClick={() => setStatusFilter(statusFilter === 'OPEN'        ? '' : 'OPEN')} />
        <StatCard label="In Progress" value={stats.inProgress} color="bg-amber-400"   active={statusFilter === 'IN_PROGRESS'} onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? '' : 'IN_PROGRESS')} />
        <StatCard label="Resolved"    value={stats.resolved}   color="bg-emerald-400" active={statusFilter === 'RESOLVED'}    onClick={() => setStatusFilter(statusFilter === 'RESOLVED'    ? '' : 'RESOLVED')} />
        <StatCard label="Closed"      value={stats.closed}     color="bg-muted-foreground" active={statusFilter === 'CLOSED'} onClick={() => setStatusFilter(statusFilter === 'CLOSED'      ? '' : 'CLOSED')} />
      </div>

      {/* Filter tabs + search */}
      <div className="flex items-center gap-4 shrink-0 border-b border-border">
        <div className="flex gap-1 overflow-x-auto flex-1">
          {TABS.map(({ key, label }) => {
            const count = key === '' ? tickets.length : tickets.filter((t) => t.status === key).length;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${
                  statusFilter === key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
                {count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    statusFilter === key ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative shrink-0 mb-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search client, subject…"
            className="h-8 w-52 rounded-full border border-border bg-muted/30 pl-8 pr-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Two-pane */}
      <div className="flex flex-1 overflow-hidden rounded-2xl border border-border shadow-sm min-h-0">

        {/* Left: ticket list */}
        <div className={`${selected ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 xl:w-96 shrink-0 border-r border-border bg-white overflow-hidden`}>

          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Headset className="h-12 w-12 text-muted-foreground/20 mb-3" />
              <p className="font-semibold text-foreground text-sm">No tickets found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? `No results for "${search}"` : 'No tickets match this filter.'}
              </p>
            </div>
          ) : (
            <>
              <div className="px-4 py-2.5 border-b border-border/60 bg-muted/10">
                <p className="text-xs text-muted-foreground font-medium">
                  {filtered.length} ticket{filtered.length !== 1 ? 's' : ''}
                  {search && ` matching "${search}"`}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-border/40">
                {filtered.map((ticket) => (
                  <TicketRow
                    key={ticket.id}
                    ticket={ticket}
                    selected={selectedId === ticket.id}
                    onClick={() => setSelectedId(ticket.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right: thread panel */}
        <div className={`${selected ? 'flex' : 'hidden lg:flex'} flex-1 flex-col overflow-hidden`}>
          {selected ? (
            <ThreadPanel
              ticket={selected}
              onClose={() => setSelectedId(null)}
              onReply={handleReply}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center p-8 bg-[#f0f2f5]">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm mb-4">
                <ChatCircle className="h-8 w-8 text-primary/40" weight="fill" />
              </div>
              <p className="font-semibold text-foreground">Select a ticket</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Choose a ticket from the list to read the thread and reply to the client.
              </p>
              {stats.needsReply > 0 && (
                <p className="mt-3 text-xs text-rose-600 font-medium">
                  {stats.needsReply} ticket{stats.needsReply !== 1 ? 's need' : ' needs'} your reply
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
