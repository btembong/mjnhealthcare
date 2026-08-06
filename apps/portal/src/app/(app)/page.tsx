'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { StatCard, Badge, Button, Skeleton } from '@mjn/ui';
import {
  FileText, CreditCard, BookOpen, CalendarBlank,
  CheckCircle, Clock, WarningCircle, TrendUp, ArrowRight,
  Sparkle, Buildings, Student, X, PaperPlaneTilt, ChatCircle,
  UploadSimple,
} from '@phosphor-icons/react';
import { useUser } from '../../contexts/user-context';
import { api } from '../../lib/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusLabel(s: string) {
  return s?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? '—';
}

function statusVariant(s: string): 'success' | 'warning' | 'destructive' | 'outline' {
  if (s === 'ACTIVE') return 'success';
  if (s === 'PENDING_SIGNATURE' || s === 'ON_HOLD') return 'warning';
  if (s === 'TERMINATED') return 'destructive';
  return 'outline';
}

function docStatusIcon(status: string) {
  if (status === 'VERIFIED') return <CheckCircle weight="fill" className="h-4 w-4 text-primary shrink-0" />;
  if (status === 'REJECTED') return <WarningCircle weight="fill" className="h-4 w-4 text-rose-500 shrink-0" />;
  return <Clock className="h-4 w-4 text-amber-500 shrink-0" />;
}

function timeAgo(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 2) return 'Just now';
  if (hours < 1) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCaseRef(id: string | undefined): string {
  if (!id) return '—';
  return `ENG-${id.slice(-6).toUpperCase()}`;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div><Skeleton className="h-7 w-48 mb-2" /><Skeleton className="h-4 w-72" /></div>
      <Skeleton className="h-14 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
      <div className="grid gap-5 lg:grid-cols-5">
        <Skeleton className="lg:col-span-3 h-80 rounded-2xl" />
        <Skeleton className="lg:col-span-2 h-80 rounded-2xl" />
      </div>
      <Skeleton className="h-24 rounded-2xl" />
    </div>
  );
}

// ── Gap #9: Onboarding Checklist ──────────────────────────────────────────────

function OnboardingChecklist({ steps, onNavigate }: {
  steps: { label: string; sub: string; done: boolean; href: string }[];
  onNavigate: (p: string) => void;
}) {
  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Getting started</p>
          <p className="text-xs text-muted-foreground mt-0.5">{doneCount} of {steps.length} steps complete</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-28 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-semibold text-foreground">{pct}%</span>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <div
            key={i}
            onClick={() => !step.done && onNavigate(step.href)}
            className={[
              'flex items-start gap-2.5 rounded-xl border px-3 py-2.5 transition-colors',
              step.done
                ? 'border-primary/20 bg-primary/5'
                : 'border-border bg-muted/20 cursor-pointer hover:border-primary/30 hover:bg-muted/30',
            ].join(' ')}
          >
            <div className={[
              'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold',
              step.done ? 'bg-primary text-white' : 'bg-muted-foreground/20 text-muted-foreground',
            ].join(' ')}>
              {step.done ? <CheckCircle weight="fill" className="h-3 w-3" /> : i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-semibold ${step.done ? 'text-primary/70 line-through decoration-primary/40' : 'text-foreground'}`}>
                {step.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{step.sub}</p>
            </div>
            {!step.done && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 mt-0.5" />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Next Action Banner ────────────────────────────────────────────────────────

function NextActionBanner({
  engagement, documents, orders, me, onNavigate,
}: {
  engagement: any; documents: any[]; orders: any[]; me: any; onNavigate: (p: string) => void;
}) {
  if (!me?.name || me.name === me.email) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100">
            <Student className="h-4 w-4 text-amber-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-900">Complete your profile</p>
            <p className="text-xs text-amber-700">Add your name and profession so your consultant can get started.</p>
          </div>
        </div>
        <button onClick={() => onNavigate('/settings')} className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors">
          Complete <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }
  const expiringDocs = documents.filter((d) => {
    if (!d.expiryDate) return false;
    const daysLeft = Math.ceil((new Date(d.expiryDate).getTime() - Date.now()) / 86400000);
    return daysLeft <= 30;
  });
  if (expiringDocs.length > 0) {
    const urgentCount = expiringDocs.filter((d) => Math.ceil((new Date(d.expiryDate).getTime() - Date.now()) / 86400000) <= 14).length;
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-100">
            <WarningCircle weight="fill" className="h-4 w-4 text-rose-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-rose-900">
              {urgentCount > 0 ? `${urgentCount} document${urgentCount > 1 ? 's' : ''} expiring within 14 days` : `${expiringDocs.length} document${expiringDocs.length > 1 ? 's' : ''} expiring soon`}
            </p>
            <p className="text-xs text-rose-700">Renew and re-upload before expiry to keep your case on track.</p>
          </div>
        </div>
        <button onClick={() => onNavigate('/documents')} className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition-colors">
          Renew <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }
  const pendingDocs = documents.filter((d) => d.status === 'PENDING');
  if (pendingDocs.length > 0) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">{pendingDocs.length} document{pendingDocs.length > 1 ? 's' : ''} under review</p>
            <p className="text-xs text-muted-foreground">{pendingDocs[0]?.type} — being verified by your consultant.</p>
          </div>
        </div>
        <button onClick={() => onNavigate('/documents')} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
          View <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }
  const pendingPayment = orders.find((o) => o.status === 'PENDING');
  if (pendingPayment) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-100">
            <CreditCard className="h-4 w-4 text-rose-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-rose-900">Payment required</p>
            <p className="text-xs text-rose-700">${Number(pendingPayment.total).toLocaleString()} outstanding — complete to continue your pathway.</p>
          </div>
        </div>
        <button onClick={() => onNavigate('/payments')} className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition-colors">
          Pay now <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }
  if (!engagement) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Sparkle className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">Ready to start your journey?</p>
            <p className="text-xs text-muted-foreground">Book a consultation — your consultant will set up your pathway.</p>
          </div>
        </div>
        <button onClick={() => onNavigate('/bookings')} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
          Book now <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }
  return null;
}

// ── Activity Feed ─────────────────────────────────────────────────────────────

function ActivityFeed({ documents, engagement, orders }: { documents: any[]; engagement: any; orders: any[] }) {
  type Activity = { date: string; text: string; sub?: string; type: 'doc' | 'milestone' | 'order' };
  const items: Activity[] = [
    ...documents.map((d) => ({
      date: d.uploadedAt ?? d.createdAt ?? '',
      text: `${d.type} ${d.status === 'VERIFIED' ? 'verified' : d.status === 'REJECTED' ? 'rejected' : 'uploaded'}`,
      sub: d.status === 'VERIFIED' ? 'Verified by consultant' : d.status === 'REJECTED' ? 'Contact your consultant' : 'Under review',
      type: 'doc' as const,
    })),
    ...((engagement?.milestones ?? []).filter((m: any) => m.completedAt).map((m: any) => ({
      date: m.completedAt,
      text: `${m.label} completed`,
      sub: 'Milestone reached',
      type: 'milestone' as const,
    }))),
    ...orders.map((o) => ({
      date: o.createdAt ?? '',
      text: `Order placed — $${Number(o.total).toLocaleString()}`,
      sub: statusLabel(o.status),
      type: 'order' as const,
    })),
  ]
    .filter((a) => !!a.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const iconForType = (type: Activity['type'], text: string) => {
    if (type === 'milestone') return <CheckCircle weight="fill" className="h-3.5 w-3.5 text-primary" />;
    if (type === 'order') return <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />;
    if (text.includes('rejected')) return <WarningCircle weight="fill" className="h-3.5 w-3.5 text-rose-500" />;
    if (text.includes('verified')) return <CheckCircle weight="fill" className="h-3.5 w-3.5 text-primary" />;
    return <FileText className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <Clock className="mb-2 h-8 w-8 text-muted-foreground/30" />
        <p className="text-xs text-muted-foreground">Activity will appear here as your case progresses.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {items.map((item, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/60">
              {iconForType(item.type, item.text)}
            </div>
            {i < items.length - 1 && <div className="w-px flex-1 bg-border min-h-4 my-1" />}
          </div>
          <div className="pb-4 flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground leading-snug">{item.text}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {item.sub && <span className="text-xs text-muted-foreground">{item.sub}</span>}
              {item.sub && <span className="text-xs text-muted-foreground/40">·</span>}
              <span className="text-xs text-muted-foreground/60">{timeAgo(item.date)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Financial Summary ─────────────────────────────────────────────────────────

function FinancialSummary({ orders }: { orders: any[] }) {
  if (orders.length === 0) return null;
  const total = orders.reduce((s, o) => s + Number(o.total ?? 0), 0);
  const paid = orders.filter((o) => o.status === 'PAID').reduce((s, o) => s + Number(o.total ?? 0), 0);
  const remaining = total - paid;
  const nextDue = orders.find((o) => o.status === 'PENDING' || o.status === 'PARTIALLY_PAID');
  const partialPaid = orders.filter((o) => o.status === 'PARTIALLY_PAID');

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-foreground mb-4">Financial Summary</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Contract', value: `$${total.toLocaleString()}`, sub: `${orders.length} order${orders.length !== 1 ? 's' : ''}`, urgent: false, positive: false },
          { label: 'Paid', value: `$${paid.toLocaleString()}`, sub: paid >= total ? 'Fully settled' : `${Math.round((paid / total) * 100)}% of total`, urgent: false, positive: false },
          { label: 'Remaining', value: `$${remaining.toLocaleString()}`, sub: remaining === 0 ? 'Nothing owed' : 'Outstanding', urgent: remaining > 0, positive: false },
          { label: 'Next Due', value: nextDue ? `$${Number(nextDue.total).toLocaleString()}` : '—', sub: nextDue ? statusLabel(nextDue.status) : 'No pending orders', urgent: false, positive: false },
        ].map((item) => (
          <div key={item.label} className={`rounded-xl border p-3 ${item.urgent ? 'border-rose-200 bg-rose-50' : 'border-border bg-muted/20'}`}>
            <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
            <p className={`text-xl font-bold mt-1 ${item.urgent ? 'text-rose-700' : 'text-foreground'}`}>{item.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
          </div>
        ))}
      </div>
      {partialPaid.length > 0 && (
        <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
          {partialPaid.length} order{partialPaid.length > 1 ? 's' : ''} partially paid — instalment due on next stage completion.
        </p>
      )}
    </div>
  );
}

// ── Message Modal ─────────────────────────────────────────────────────────────

function MessageModal({ consultant, engagementId, onClose }: { consultant: any; engagementId?: string; onClose: () => void }) {
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);

  async function send() {
    if (!msg.trim()) return;
    setSending(true);
    try {
      if (engagementId) {
        await api.sendMessage(engagementId, msg.trim());
      }
      toast.success('Message sent to your consultant.');
      onClose();
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Message your consultant</p>
            {consultant?.name && <p className="text-xs text-muted-foreground">{consultant.name}</p>}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition"><X className="h-4 w-4" /></button>
        </div>
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Ask a question or share an update…"
          rows={4}
          className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
          autoFocus
        />
        <div className="mt-3 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
          <button
            onClick={send}
            disabled={!msg.trim() || sending}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            <PaperPlaneTilt className="h-3.5 w-3.5" /> {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Right Rail ────────────────────────────────────────────────────────────────

function RightRail({
  consultant, engagement, bookings,
  milestones, caseProgress, completedMilestones,
  pendingPayment, alerts,
  onMessage, onNavigate,
}: {
  consultant: any;
  engagement: any;
  bookings: any[];
  milestones: any[];
  caseProgress: number;
  completedMilestones: number;
  pendingPayment: any;
  alerts: { text: string; sub: string; color: string }[];
  onMessage: () => void;
  onNavigate: (p: string) => void;
}) {
  const upcoming = bookings.filter((b) => b.status === 'CONFIRMED').slice(0, 3);

  return (
    <div className="flex flex-col divide-y divide-border h-full">
      {/* Case Team — gradient header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary to-[#00A896] px-5 py-4">
        <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute right-6 bottom-0 h-10 w-10 rounded-full bg-white/10 pointer-events-none" />
        <p className="relative text-[10px] font-bold uppercase tracking-widest text-white/60 mb-3">Case Team</p>
        {consultant ? (
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/30 text-sm font-bold text-white">
                {consultant.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{consultant.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-white/60 animate-pulse" />
                  <p className="text-xs text-white/60">Case Consultant · Online</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onMessage}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
              >
                <ChatCircle className="h-3.5 w-3.5" /> Message
              </button>
              <button
                onClick={() => onNavigate('/bookings')}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-primary hover:bg-white/90 transition-colors"
              >
                <CalendarBlank className="h-3.5 w-3.5" /> Book
              </button>
            </div>
          </div>
        ) : (
          <div className="relative rounded-xl border border-white/20 bg-white/10 p-4 text-center">
            <p className="text-xs text-white/70">No consultant assigned yet.</p>
            <button onClick={() => onNavigate('/bookings')} className="mt-2 text-xs font-semibold text-white hover:text-white/80 underline">
              Book a consultation →
            </button>
          </div>
        )}
      </div>

      {/* Case Details */}
      {engagement && (
        <div className="p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Case Details</p>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-mono font-bold text-foreground text-xs">{formatCaseRef(engagement.id)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={statusVariant(engagement.status)} className="text-xs uppercase tracking-wide">
                {statusLabel(engagement.status)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last updated</span>
              <span className="font-medium text-foreground">{timeAgo(engagement.updatedAt)}</span>
            </div>
            {milestones.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold text-foreground">{caseProgress}% <span className="text-muted-foreground font-normal">({completedMilestones}/{milestones.length})</span></span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${caseProgress}%` }} />
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => onNavigate('/case')}
            className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
          >
            View full case <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Alerts */}
      <div className="p-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Alerts</p>
        {alerts.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle weight="fill" className="h-4 w-4 text-primary shrink-0" />
            <span>No issues requiring attention</span>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div key={i} className={`rounded-xl border p-2.5 ${a.color === 'rose' ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50'}`}>
                <p className={`text-xs font-semibold ${a.color === 'rose' ? 'text-rose-800' : 'text-amber-800'}`}>{a.text}</p>
                <p className={`mt-0.5 text-xs ${a.color === 'rose' ? 'text-rose-600' : 'text-amber-600'}`}>{a.sub}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Sessions */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Upcoming</p>
          <button onClick={() => onNavigate('/bookings')} className="text-xs font-semibold text-primary hover:underline">
            View all
          </button>
        </div>
        {upcoming.length === 0 ? (
          <div className="text-center py-4">
            <CalendarBlank className="mx-auto mb-2 h-6 w-6 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">No upcoming sessions</p>
            <button onClick={() => onNavigate('/bookings')} className="mt-1.5 text-xs font-semibold text-primary hover:underline">
              Book a session →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((b) => (
              <div key={b.id} className="rounded-xl border border-border bg-muted/20 px-3.5 py-3 cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => onNavigate('/bookings')}>
                <p className="text-sm font-semibold text-foreground capitalize">{b.type}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {b.slot?.startTime
                    ? new Date(b.slot.startTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Quick Actions</p>
        <div className="space-y-2">
          <button
            onClick={() => onNavigate('/documents')}
            className="flex w-full items-center gap-3 rounded-xl border border-border px-3.5 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            <UploadSimple className="h-4 w-4 text-muted-foreground shrink-0" /> Upload Document
          </button>
          {pendingPayment && (
            <button
              onClick={() => onNavigate('/payments')}
              className="flex w-full items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
            >
              <CreditCard className="h-4 w-4 shrink-0" />
              Pay ${Number(pendingPayment.total).toLocaleString()} now
            </button>
          )}
          <button
            onClick={() => onNavigate('/bookings')}
            className="flex w-full items-center gap-3 rounded-xl border border-border px-3.5 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            <CalendarBlank className="h-4 w-4 text-muted-foreground shrink-0" /> Book a session
          </button>
          <button
            onClick={() => onNavigate('/academy')}
            className="flex w-full items-center gap-3 rounded-xl border border-border px-3.5 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" /> My courses
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

// ── Engagement Switcher ───────────────────────────────────────────────────────

function EngagementSwitcher({
  allEngagements, active, onSwitch,
}: {
  allEngagements: any[];
  active: any;
  onSwitch: (eng: any) => void;
}) {
  if (allEngagements.length <= 1) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-white px-4 py-3 shadow-sm">
      <span className="text-xs font-semibold text-muted-foreground mr-1">Active case:</span>
      {allEngagements.map((eng) => (
        <button
          key={eng.id}
          onClick={() => onSwitch(eng)}
          className={[
            'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors',
            eng.id === active?.id
              ? 'bg-primary text-white'
              : 'border border-border bg-muted/30 text-muted-foreground hover:border-primary/30 hover:text-foreground',
          ].join(' ')}
        >
          <span className="font-mono">ENG-{eng.id.slice(-4).toUpperCase()}</span>
          <span className="opacity-70">·</span>
          <span>{eng.status?.replace(/_/g, ' ')}</span>
        </button>
      ))}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function PortalDashboard() {
  const router = useRouter();
  const { me, engagement, allEngagements, progress, documents, orders, bookings, loading, refresh, switchEngagement } = useUser();
  const [messageOpen, setMessageOpen] = useState(false);
  const [letterPolling, setLetterPolling] = useState(false);

  // Derived
  const firstName = me?.name && me.name !== me.email ? me.name.split(' ')[0] : 'there';
  const verifiedDocs = documents.filter((d) => d.status === 'VERIFIED').length;
  const rejectedDocs = documents.filter((d) => d.status === 'REJECTED').length;
  const pendingDocs = documents.filter((d) => d.status === 'PENDING').length;
  const pendingPayment = orders.find((o) => o.status === 'PENDING');
  const consultant = engagement?.consultant ?? null;
  const milestones = engagement?.milestones ?? [];
  const completedMilestones = milestones.filter((m: any) => !!m.completedAt).length;
  const caseProgress = milestones.length ? Math.round((completedMilestones / milestones.length) * 100) : 0;
  const docProgress = documents.length ? Math.round((verifiedDocs / documents.length) * 100) : 0;
  const totalContract = orders.reduce((s, o) => s + Number(o.total ?? 0), 0);
  const totalPaid = orders.filter((o) => o.status === 'PAID').reduce((s, o) => s + Number(o.total ?? 0), 0);
  const balanceRemaining = totalContract - totalPaid;
  const onboardingSteps = [
    { label: 'Complete profile', sub: 'Name & profession', done: !!(me?.name && me.name !== me.email && me.profession), href: '/settings' },
    { label: 'Sign engagement letter', sub: 'Formal agreement with MJN', done: !!engagement, href: '/case' },
    { label: 'Upload documents', sub: 'Passport, credentials, etc.', done: documents.length > 0, href: '/documents' },
    { label: 'Select services', sub: 'View catalog & checkout', done: orders.length > 0, href: '/checkout' },
  ];
  const onboardingComplete = onboardingSteps.every((s) => s.done);

  // Alerts
  const alerts = [
    ...documents.filter((d) => d.status === 'REJECTED').map((d) => ({
      text: `${d.type} was rejected`,
      sub: 'Contact your consultant to re-upload.',
      color: 'rose',
    })),
    ...documents.filter((d) => {
      if (!d.expiryDate) return false;
      return Math.ceil((new Date(d.expiryDate).getTime() - Date.now()) / 86400000) <= 30;
    }).map((d) => ({
      text: `${d.type} expiring soon`,
      sub: `Expires ${new Date(d.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      color: 'amber',
    })),
    ...orders.filter((o) => o.status === 'PENDING').map((o) => ({
      text: `Payment of $${Number(o.total).toLocaleString()} due`,
      sub: 'Complete payment to continue your pathway.',
      color: 'rose',
    })),
  ];

  // Poll for letter signing after client clicks "Sign Letter"
  async function handleSignLetter() {
    if (!engagement?.letterUrl) return;
    window.open(engagement.letterUrl, '_blank');
    setLetterPolling(true);
    // Poll every 8s for up to 5 minutes
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        await refresh();
      } catch {}
      if (attempts >= 37) {
        clearInterval(interval);
        setLetterPolling(false);
      }
    }, 8000);
  }

  if (loading) return <DashboardSkeleton />;

  return (
    <>
      <div className="flex gap-6">
      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-4 sm:space-y-5">
        {/* ── Hero greeting banner ──────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[#00A896] p-6 shadow-md text-white">
          {/* Decorative rings */}
          <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -right-3 -top-3 h-28 w-28 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute right-36 -bottom-10 h-36 w-36 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between gap-y-4">
            {/* Left: avatar + greeting */}
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/30 text-lg font-bold text-white select-none">
                {me?.name?.slice(0, 2).toUpperCase() ?? '??'}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-0.5">Client Portal</p>
                <h1 className="text-xl font-bold text-white leading-tight">Welcome back, {firstName}</h1>
                <p className="text-sm text-white/70 mt-0.5">
                  {engagement
                    ? `Your engagement is ${statusLabel(engagement.status).toLowerCase()}.`
                    : 'Your consultant will open your engagement after your first session.'}
                </p>
              </div>
            </div>

            {/* Right: case pill + action buttons */}
            <div className="flex shrink-0 flex-row flex-wrap items-center gap-2 sm:flex-col sm:items-end">
              {engagement && (
                <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5">
                  <span className="text-xs text-white/60">Case</span>
                  <span className="font-mono text-xs font-bold text-white">{formatCaseRef(engagement.id)}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/documents')}
                  className="flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-colors active:scale-[0.98]"
                >
                  <UploadSimple className="h-4 w-4" /> Upload
                </button>
                {engagement ? (
                  <button
                    onClick={() => router.push('/case')}
                    className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-primary hover:bg-white/90 transition-colors active:scale-[0.98]"
                  >
                    View case <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => router.push('/bookings')}
                    className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-primary hover:bg-white/90 transition-colors active:scale-[0.98]"
                  >
                    Book now <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bottom stats strip */}
          {(engagement || documents.length > 0 || orders.length > 0) && (
            <div className="relative mt-5 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-white/20 pt-4">
              {engagement?.createdAt && (
                <span className="flex items-center gap-1.5 text-xs text-white/70">
                  <span className="h-1 w-1 rounded-full bg-white/40" />
                  Active since {new Date(engagement.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              )}
              {milestones.length > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-white/70">
                  <span className="h-1 w-1 rounded-full bg-white/40" />
                  {completedMilestones} of {milestones.length} stages complete
                </span>
              )}
              {documents.length > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-white/70">
                  <span className="h-1 w-1 rounded-full bg-white/40" />
                  {verifiedDocs} of {documents.length} documents verified
                </span>
              )}
              {balanceRemaining > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-white/70">
                  <span className="h-1 w-1 rounded-full bg-white/40" />
                  ${balanceRemaining.toLocaleString()} balance remaining
                </span>
              )}
            </div>
          )}
        </div>

        {/* Multi-engagement switcher */}
        <EngagementSwitcher
          allEngagements={allEngagements}
          active={engagement}
          onSwitch={switchEngagement}
        />

        {/* Letter polling banner */}
        {letterPolling && (
          <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-3">
            <div className="h-4 w-4 shrink-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-primary font-medium">Waiting for your signature — the page will update automatically once confirmed.</p>
          </div>
        )}

        {/* Onboarding checklist */}
        {!onboardingComplete && <OnboardingChecklist steps={onboardingSteps} onNavigate={router.push} />}

        {/* Next action */}
        <NextActionBanner engagement={engagement} documents={documents} orders={orders} me={me} onNavigate={router.push} />

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <div onClick={() => router.push('/documents')} className="cursor-pointer">
            <StatCard
              label="Documents Verified"
              value={documents.length ? `${verifiedDocs} / ${documents.length}` : '—'}
              icon={FileText}
              accent="primary"
              progress={documents.length ? docProgress : undefined}
              delta={
                rejectedDocs > 0 ? `${rejectedDocs} rejected` :
                pendingDocs > 0  ? `${pendingDocs} under review` :
                verifiedDocs > 0 ? 'All verified' : 'No documents yet'
              }
              deltaPositive={rejectedDocs === 0 && pendingDocs === 0 && verifiedDocs > 0}
              deltaNeutral={pendingDocs > 0 && rejectedDocs === 0}
              urgent={rejectedDocs > 0}
              warning={pendingDocs > 0 && rejectedDocs === 0}
            />
          </div>
          <div onClick={() => router.push('/case')} className="cursor-pointer">
            <StatCard
              label="Case Progress"
              value={milestones.length ? `${caseProgress}%` : '—'}
              icon={TrendUp}
              accent="primary"
              progress={milestones.length ? caseProgress : undefined}
              delta={milestones.length ? `${completedMilestones} of ${milestones.length} stages` : progress ? 'In progress' : 'Not started'}
              deltaPositive={caseProgress === 100}
              deltaNeutral={caseProgress > 0 && caseProgress < 100}
            />
          </div>
          <div onClick={() => router.push('/payments')} className="cursor-pointer">
            <StatCard
              label="Balance Due"
              value={balanceRemaining > 0 ? `$${balanceRemaining.toLocaleString()}` : orders.length ? 'Paid up' : '—'}
              icon={CreditCard}
              accent={balanceRemaining > 0 ? 'rose' : 'primary'}
              delta={balanceRemaining > 0 ? 'Outstanding' : orders.length ? 'Fully settled' : 'No orders yet'}
              deltaPositive={balanceRemaining === 0 && orders.length > 0}
              urgent={!!pendingPayment}
            />
          </div>
          <div onClick={() => router.push('/bookings')} className="cursor-pointer">
            <StatCard
              label="Sessions Booked"
              value={bookings.filter((b) => b.status === 'CONFIRMED').length || '—'}
              icon={CalendarBlank}
              accent="primary"
              delta={bookings.filter((b) => b.status === 'CONFIRMED').length > 0 ? 'Upcoming confirmed' : 'No upcoming sessions'}
              deltaNeutral={bookings.filter((b) => b.status === 'CONFIRMED').length === 0}
              deltaPositive={bookings.filter((b) => b.status === 'CONFIRMED').length > 0}
            />
          </div>
        </div>

        {/* Pipeline + Activity Feed */}
        <div className="grid gap-5 lg:grid-cols-5">
          {/* Pipeline */}
          <div className="lg:col-span-3 rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/60">
                  <Buildings className="h-4 w-4 text-foreground/50" />
                </div>
                <h3 className="font-semibold text-foreground">Licensing Pipeline</h3>
              </div>
              <div className="flex items-center gap-3">
                {engagement && (
                  <Badge variant={statusVariant(engagement.status)} className="text-xs uppercase tracking-wide">
                    {statusLabel(engagement.status)}
                  </Badge>
                )}
                {engagement && (
                  <button onClick={() => router.push('/case')} className="flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline">
                    View case <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {!engagement && (
              <div className="flex flex-col items-center justify-center rounded-xl bg-muted/20 py-12 text-center border border-border border-dashed">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Buildings className="h-7 w-7 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-semibold text-foreground">No active engagement</p>
                <p className="mt-1.5 text-xs text-muted-foreground max-w-xs">
                  Your licensing pipeline will appear here once your consultant sets up your engagement.
                </p>
                <button onClick={() => router.push('/bookings')} className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
                  Book a consultation <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {engagement && !progress && (
              <div className="flex flex-col items-center justify-center rounded-xl bg-muted/20 border border-border py-10 text-center">
                <Clock className="mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-semibold text-foreground">Pathway being configured</p>
                <p className="mt-1 text-xs text-muted-foreground">Your consultant is setting up your licensing stages.</p>
                <button
                  onClick={() => setMessageOpen(true)}
                  className="mt-4 flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
                >
                  <ChatCircle className="h-3.5 w-3.5" /> Message consultant
                </button>
              </div>
            )}

            {engagement && progress && (
              <div className="space-y-0">
                {milestones.length === 0 && (
                  <p className="text-sm text-muted-foreground">Milestones are being configured by your consultant.</p>
                )}
                {milestones.map((m: any, i: number) => {
                  const isDone = !!m.completedAt;
                  const isActive = !isDone && i === milestones.findIndex((x: any) => !x.completedAt);
                  return (
                    <div key={m.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={[
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all',
                          isDone ? 'border-primary bg-primary text-white'
                          : isActive ? 'border-primary bg-white text-primary'
                          : 'border-border bg-white text-muted-foreground',
                        ].join(' ')}>
                          {isDone ? <CheckCircle weight="fill" className="h-4 w-4" /> : i + 1}
                        </div>
                        {i < milestones.length - 1 && (
                          <div className={['mt-1 mb-1 w-0.5 flex-1 min-h-6 transition-colors', isDone ? 'bg-primary/40' : 'bg-border'].join(' ')} />
                        )}
                      </div>
                      <div className="pb-6 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={['text-sm font-semibold', !isDone && !isActive ? 'text-muted-foreground' : 'text-foreground'].join(' ')}>
                            {m.label}
                          </p>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> In Progress
                            </span>
                          )}
                          {isDone && <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-xs font-semibold text-muted-foreground">Done</span>}
                        </div>
                        {isDone && m.completedAt && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Completed {new Date(m.completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                        {isActive && <p className="mt-0.5 text-xs text-muted-foreground">In progress · completion date TBC</p>}
                        {!isDone && !isActive && <p className="mt-0.5 text-xs text-muted-foreground">Pending previous stage</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {documents.length > 0 && (
              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{documents.length} document{documents.length !== 1 ? 's' : ''} on file</p>
                <button onClick={() => router.push('/documents')} className="flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline">
                  View documents <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* Activity feed */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Case Activity</h3>
              <button onClick={() => router.push('/case')} className="flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline">
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <ActivityFeed documents={documents} engagement={engagement} orders={orders} />
          </div>
        </div>

        {/* Financial summary */}
        <FinancialSummary orders={orders} />

        {/* Recent orders */}
        {orders.length > 0 && (
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Recent Orders</h3>
              <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => router.push('/payments')}>View all</Button>
            </div>
            <div className="space-y-2">
              {orders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() => router.push('/payments')}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {order.orderType === 'standalone' ? 'À la carte order' : 'Engagement order'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' · '}{order.lineItems?.length ?? 0} service{order.lineItems?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">${Number(order.total).toLocaleString()}</p>
                    <Badge
                      variant={order.status === 'PAID' ? 'success' : order.status === 'PARTIALLY_PAID' ? 'warning' : 'outline'}
                      className="text-xs uppercase"
                    >
                      {statusLabel(order.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right rail — visible on XL screens */}
      <aside className="hidden xl:block w-80 shrink-0">
        <div className="sticky top-6 rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <RightRail
            consultant={consultant}
            engagement={engagement}
            bookings={bookings}
            milestones={milestones}
            caseProgress={caseProgress}
            completedMilestones={completedMilestones}
            pendingPayment={pendingPayment}
            alerts={alerts}
            onMessage={() => setMessageOpen(true)}
            onNavigate={router.push}
          />
        </div>
      </aside>
      </div>

      {messageOpen && (
        <MessageModal consultant={consultant} engagementId={engagement?.id} onClose={() => setMessageOpen(false)} />
      )}
    </>
  );
}
