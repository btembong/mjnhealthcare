'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Skeleton } from '@mjn/ui';
import {
  FileText, CalendarBlank, CheckCircle, Clock,
  TrendUp, UploadSimple, Signature, Seal,
  ChatText, CreditCard, BookOpen, Copy, MapPin,
  Buildings, Envelope, ArrowRight, Warning,
  Headset, Receipt, Flag, ArrowSquareUpRight, DownloadSimple,
} from '@phosphor-icons/react';
import { useUser } from '../../../contexts/user-context';
import { api } from '../../../lib/api';
import { toast } from 'sonner';

// ── Constants ─────────────────────────────────────────────────────────────────

const COUNTRY_FLAGS: Record<string, string> = {
  UAE: '🇦🇪', UK: '🇬🇧', US: '🇺🇸', Ireland: '🇮🇪', Canada: '🇨🇦', Australia: '🇦🇺',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCaseRef(id?: string) {
  if (!id) return '—';
  return `ENG-${id.slice(-6).toUpperCase()}`;
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysAgo(ts: string) {
  return Math.floor((Date.now() - new Date(ts).getTime()) / 86400000);
}

function timeAgo(ts: string) {
  const d = daysAgo(ts);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d}d ago`;
}

function engagementStatusVariant(status: string): 'success' | 'warning' | 'outline' | 'destructive' {
  if (status === 'ACTIVE') return 'success';
  if (status === 'ON_HOLD') return 'warning';
  if (status === 'TERMINATED') return 'destructive';
  return 'outline';
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CaseSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-10 w-96 rounded-xl" />
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
      </div>
      <Skeleton className="h-16 rounded-2xl" />
      <div className="flex gap-6">
        <div className="flex-1 space-y-5">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
        <div className="hidden xl:block w-72 space-y-4">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ── Progress Ring ─────────────────────────────────────────────────────────────

function ProgressRing({ pct }: { pct: number }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative flex items-center justify-center">
      <svg width="76" height="76" viewBox="0 0 68 68" className="-rotate-90">
        <circle cx="34" cy="34" r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-muted" />
        <circle
          cx="34" cy="34" r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-primary"
          strokeDasharray={`${(pct / 100) * circ} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.9s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-foreground">{pct}%</span>
      </div>
    </div>
  );
}

// ── KPI Strip ─────────────────────────────────────────────────────────────────

function KpiChip({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm px-4 py-3 flex flex-col gap-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-foreground leading-none">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ── Next Action Banner ─────────────────────────────────────────────────────────

function NextActionBanner({
  engagement, docs, router,
}: { engagement: any; docs: any[]; router: ReturnType<typeof useRouter> }) {
  const orders: any[] = engagement.orders ?? [];
  const rejected = docs.filter((d) => d.status === 'REJECTED');
  const pending = docs.filter((d) => d.status === 'PENDING');
  const unpaidOrders = orders.filter((o) => o.status === 'PENDING' || o.status === 'PARTIALLY_PAID');
  const totalDue = unpaidOrders.reduce((s, o) => s + Number(o.total ?? 0), 0);

  // Priority 1: sign letter
  if (!engagement.letterSignedAt && engagement.letterUrl) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
          <Signature className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900">Action required: Sign your engagement letter</p>
          <p className="text-xs text-amber-700 mt-0.5">Your engagement cannot proceed until the letter is signed.</p>
        </div>
        <a
          href={`/sign/${engagement.id}`}
          className="shrink-0 flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
        >
          Sign now <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    );
  }

  // Priority 2: rejected docs
  if (rejected.length > 0) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 shadow-sm">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100">
          <Warning className="h-5 w-5 text-rose-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-rose-900">
            {rejected.length} document{rejected.length > 1 ? 's' : ''} rejected — re-upload required
          </p>
          <p className="text-xs text-rose-700 mt-0.5">
            {rejected.map((d) => d.type?.replace(/_/g, ' ')).join(', ')}
          </p>
        </div>
        <button
          onClick={() => router.push('/documents')}
          className="shrink-0 flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition-colors"
        >
          Fix now <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // Priority 3: outstanding payment
  if (unpaidOrders.length > 0) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
          <CreditCard className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900">
            Payment outstanding: ${totalDue.toLocaleString()}
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            {unpaidOrders.length} order{unpaidOrders.length > 1 ? 's' : ''} pending payment
          </p>
        </div>
        <button
          onClick={() => router.push('/payments')}
          className="shrink-0 flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
        >
          Pay now <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // Priority 4: pending docs
  if (pending.length > 0) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 shadow-sm">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
          <Clock className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-blue-900">
            {pending.length} document{pending.length > 1 ? 's' : ''} under review
          </p>
          <p className="text-xs text-blue-700 mt-0.5">Your consultant is reviewing your uploaded documents.</p>
        </div>
        <span className="shrink-0 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">In Review</span>
      </div>
    );
  }

  // All clear
  if (engagement.status === 'ACTIVE') {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
          <CheckCircle className="h-5 w-5 text-emerald-600" weight="fill" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-900">Your case is on track</p>
          <p className="text-xs text-emerald-700 mt-0.5">No action required right now. Your consultant is working on your case.</p>
        </div>
        <button
          onClick={() => router.push('/messages')}
          className="shrink-0 flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
        >
          <ChatText className="h-3.5 w-3.5" /> Message
        </button>
      </div>
    );
  }

  return null;
}

// ── Documents Summary Card ────────────────────────────────────────────────────

function DocsSummaryCard({ docs, router }: { docs: any[]; router: ReturnType<typeof useRouter> }) {
  const verified = docs.filter((d) => d.status === 'VERIFIED').length;
  const pending  = docs.filter((d) => d.status === 'PENDING').length;
  const rejected = docs.filter((d) => d.status === 'REJECTED').length;

  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Documents</p>
        <button
          onClick={() => router.push('/documents')}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          View all <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-3">
          <FileText className="h-7 w-7 text-muted-foreground/30 mx-auto mb-1.5" />
          <p className="text-xs text-muted-foreground">No documents uploaded yet.</p>
          <button
            onClick={() => router.push('/documents')}
            className="mt-2 text-xs font-semibold text-primary hover:underline"
          >
            Upload documents →
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Verified', count: verified, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Pending',  count: pending,  color: 'text-amber-600',   bg: 'bg-amber-50' },
              { label: 'Rejected', count: rejected, color: 'text-rose-600',    bg: 'bg-rose-50' },
            ].map(({ label, count, color, bg }) => (
              <div key={label} className={`rounded-xl ${bg} px-2 py-2 text-center`}>
                <p className={`text-lg font-bold ${color}`}>{count}</p>
                <p className={`text-[10px] font-medium ${color}`}>{label}</p>
              </div>
            ))}
          </div>

          {rejected > 0 && (
            <button
              onClick={() => router.push('/documents')}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition-colors"
            >
              <Warning className="h-3.5 w-3.5" /> Re-upload rejected docs
            </button>
          )}
          {rejected === 0 && (
            <button
              onClick={() => router.push('/documents')}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/60 transition-colors"
            >
              <UploadSimple className="h-3.5 w-3.5" /> Manage documents
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── Payments Summary Card ─────────────────────────────────────────────────────

function PaymentsSummaryCard({ orders, router }: { orders: any[]; router: ReturnType<typeof useRouter> }) {
  const paid    = orders.filter((o) => o.status === 'PAID').reduce((s, o) => s + Number(o.total ?? 0), 0);
  const pending = orders.filter((o) => o.status !== 'PAID').reduce((s, o) => s + Number(o.total ?? 0), 0);

  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payments</p>
        <button
          onClick={() => router.push('/payments')}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          View all <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {orders.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">No orders yet.</p>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Total paid</span>
            <span className="font-bold text-primary">${paid.toLocaleString()}</span>
          </div>
          {pending > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Outstanding</span>
              <span className="font-bold text-amber-600">${pending.toLocaleString()}</span>
            </div>
          )}
          <div className="border-t border-border pt-2 space-y-1.5">
            {orders.slice(0, 3).map((o: any) => (
              <div key={o.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                    o.status === 'PAID' ? 'bg-emerald-400' :
                    o.status === 'PARTIALLY_PAID' ? 'bg-amber-400' : 'bg-rose-400'
                  }`} />
                  <span className="text-muted-foreground truncate max-w-[120px]">
                    {o.lineItems?.[0]?.serviceItem?.name ?? 'Order'}
                  </span>
                </div>
                <span className="font-semibold text-foreground">${Number(o.total).toLocaleString()}</span>
              </div>
            ))}
          </div>
          {pending > 0 && (
            <button
              onClick={() => router.push('/payments')}
              className="mt-1 w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
            >
              <CreditCard className="h-3.5 w-3.5" /> Pay outstanding
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Activity Feed ─────────────────────────────────────────────────────────────

function ActivityFeed({ engagement, docs }: { engagement: any; docs: any[] }) {
  const milestones: any[] = engagement.milestones ?? [];

  const events: { date: string; icon: React.ReactNode; text: string; sub?: string }[] = [
    ...(engagement.createdAt ? [{
      date: engagement.createdAt,
      icon: <Flag className="h-3.5 w-3.5 text-primary" />,
      text: 'Case opened',
      sub: formatDate(engagement.createdAt),
    }] : []),
    ...(engagement.letterSignedAt ? [{
      date: engagement.letterSignedAt,
      icon: <Seal className="h-3.5 w-3.5 text-emerald-600" />,
      text: 'Engagement letter signed',
      sub: formatDate(engagement.letterSignedAt),
    }] : []),
    ...milestones.filter((m) => m.completedAt).map((m) => ({
      date: m.completedAt,
      icon: <CheckCircle className="h-3.5 w-3.5 text-primary" weight="fill" />,
      text: `Milestone: ${m.label}`,
      sub: formatDate(m.completedAt),
    })),
    ...docs.filter((d) => d.uploadedAt).map((d) => ({
      date: d.uploadedAt,
      icon: <FileText className="h-3.5 w-3.5 text-muted-foreground" />,
      text: `Document uploaded: ${d.type?.replace(/_/g, ' ') ?? 'Document'}`,
      sub: formatDate(d.uploadedAt),
    })),
    ...(engagement.orders ?? []).filter((o: any) => o.status === 'PAID').map((o: any) => ({
      date: o.updatedAt ?? o.createdAt,
      icon: <Receipt className="h-3.5 w-3.5 text-emerald-600" />,
      text: `Payment received: $${Number(o.total).toLocaleString()}`,
      sub: formatDate(o.updatedAt ?? o.createdAt),
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);

  if (events.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
      <div className="border-b border-border bg-muted/20 px-5 py-3.5">
        <p className="text-sm font-semibold text-foreground">Recent Activity</p>
      </div>
      <div className="divide-y divide-border/60">
        {events.map((ev, i) => (
          <div key={i} className="flex items-start gap-3 px-5 py-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted/50 mt-0.5">
              {ev.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">{ev.text}</p>
              {ev.sub && <p className="text-xs text-muted-foreground mt-0.5">{ev.sub}</p>}
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0 mt-1">{timeAgo(ev.date)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Right Sidebar ─────────────────────────────────────────────────────────────

function CaseSidebar({
  consultant, engagement, progressPct, completedCount, milestones, docs, router,
}: {
  consultant: any;
  engagement: any;
  progressPct: number;
  completedCount: number;
  milestones: any[];
  docs: any[];
  router: ReturnType<typeof useRouter>;
}) {
  function copyRef() {
    navigator.clipboard.writeText(formatCaseRef(engagement?.id))
      .then(() => toast.success('Case reference copied.'));
  }

  return (
    <div className="w-full xl:w-[280px] xl:shrink-0 xl:sticky xl:top-6 xl:self-start space-y-4">

      {/* Consultant card */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Your Consultant</p>
        {consultant ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-sm font-bold text-white shadow-sm">
                {consultant.name?.slice(0, 2).toUpperCase() ?? 'CN'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight">{consultant.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <p className="text-xs text-muted-foreground">Case Consultant</p>
                </div>
                {consultant.email && (
                  <a href={`mailto:${consultant.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-0.5 transition-colors">
                    <Envelope className="h-3 w-3" /> {consultant.email}
                  </a>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/messages')}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
              >
                <ChatText className="h-3.5 w-3.5" /> Message
              </button>
              <button
                onClick={() => router.push('/bookings')}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
              >
                <CalendarBlank className="h-3.5 w-3.5" /> Book call
              </button>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">No consultant assigned yet.</p>
            <button onClick={() => router.push('/bookings')} className="mt-2 text-xs font-semibold text-primary hover:underline">
              Book a consultation →
            </button>
          </div>
        )}
      </div>

      {/* Case details */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Case Details</p>
        <div className="flex items-center justify-between mb-4">
          <ProgressRing pct={progressPct} />
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Milestones</p>
            <p className="text-2xl font-bold text-foreground leading-none">
              {completedCount}<span className="text-sm font-normal text-muted-foreground">/{milestones.length}</span>
            </p>
            <p className="text-xs text-muted-foreground">completed</p>
          </div>
        </div>
        <div className="space-y-2.5 text-xs border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Reference</span>
            <button onClick={copyRef} className="flex items-center gap-1.5 font-mono font-bold text-foreground hover:text-primary transition-colors">
              {formatCaseRef(engagement?.id)} <Copy className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={engagementStatusVariant(engagement.status)} className="text-[10px]">
              {engagement.status.replace(/_/g, ' ')}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Opened</span>
            <span className="font-medium text-foreground">{formatDate(engagement.createdAt)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Days active</span>
            <span className="font-medium text-foreground">{daysAgo(engagement.createdAt)}d</span>
          </div>
          {engagement.letterSignedAt && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Letter signed</span>
              <span className="font-medium text-foreground">{formatDate(engagement.letterSignedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Documents summary */}
      <DocsSummaryCard docs={docs} router={router} />

      {/* Payments summary */}
      <PaymentsSummaryCard orders={engagement.orders ?? []} router={router} />

      {/* Quick actions */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Actions</p>
        <div className="space-y-1.5">
          {[
            { label: 'Upload documents', icon: <UploadSimple className="h-4 w-4 text-primary" />, href: '/documents' },
            { label: 'Payments',         icon: <CreditCard className="h-4 w-4 text-primary" />,  href: '/payments' },
            { label: 'My courses',       icon: <BookOpen className="h-4 w-4 text-primary" />,    href: '/academy' },
            { label: 'Support tickets',  icon: <Headset className="h-4 w-4 text-primary" />,     href: '/tickets' },
          ].map(({ label, icon, href }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="w-full flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Case Status Bot ───────────────────────────────────────────────────────────

type BotMsg = { role: 'user' | 'assistant'; content: string };

const BOT_WELCOME = (name?: string): BotMsg => ({
  role: 'assistant',
  content: `Hi${name ? ` ${name.split(' ')[0]}` : ''}! I can answer questions about your case — documents needed, milestones, payments, or what happens next. What would you like to know?`,
});

function CaseStatusBot({ personId, engagementId, name }: { personId: string; engagementId: string; name?: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<BotMsg[]>([BOT_WELCOME(name)]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load persisted conversation
  useEffect(() => {
    api.getCaseConversation(personId)
      .then((h) => { if (h && h.length > 0) setMessages(h); })
      .catch(() => {});
  }, [personId]);

  useEffect(() => {
    if (open) { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); setUnread(false); }
  }, [messages, open]);

  const QUICK = [
    'What documents do I still need?',
    'What is my current case status?',
    'Do I have any outstanding payments?',
    'What happens next?',
  ];

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    const next: BotMsg[] = [...messages, { role: 'user', content: msg }];
    setMessages(next);
    setInput('');
    setSending(true);
    try {
      const res = await api.caseChat(engagementId, personId, next);
      const reply: BotMsg = { role: 'assistant', content: res.content ?? 'Sorry, I could not respond.' };
      setMessages((prev) => [...prev, reply]);
      if (!open) setUnread(true);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I ran into an issue. Please try again.' }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-13 w-13 items-center justify-center rounded-full shadow-xl transition-all hover:scale-105 active:scale-95"
        style={{ height: 52, width: 52, background: 'linear-gradient(135deg, #0F4C81 0%, #00A896 100%)', boxShadow: '0 8px 24px rgba(15,76,129,0.35)' }}
        aria-label="Open case assistant"
      >
        {!open && unread && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">1</span>
        )}
        {open
          ? <ArrowRight weight="bold" className="h-5 w-5 text-white rotate-90" />
          : <Headset weight="fill" className="h-5 w-5 text-white" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden"
          style={{ width: 400, maxWidth: 'calc(100vw - 2rem)', maxHeight: 540, border: '1px solid rgba(15,76,129,0.12)' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ background: 'linear-gradient(135deg, #0F4C81 0%, #00A896 100%)' }}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
              <Headset weight="fill" className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-tight">Case Assistant</p>
              <p className="text-[11px] text-white/70">{sending ? 'Thinking…' : 'Answers based on your real case data'}</p>
            </div>
            <button onClick={() => setOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white transition">
              <ArrowRight weight="bold" className="h-3.5 w-3.5 rotate-[-45deg]" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ background: '#f7f9fc' }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary shadow-sm">
                    <Headset weight="fill" className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === 'user' ? 'bg-primary text-white rounded-br-sm' : 'bg-white text-foreground rounded-bl-sm shadow-sm border border-border/50'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex items-end gap-2 justify-start">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary shadow-sm">
                  <Headset weight="fill" className="h-3 w-3 text-white" />
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-white shadow-sm border border-border/50 px-4 py-3">
                  <div className="flex gap-1.5">
                    {[0, 150, 300].map((d) => <span key={d} className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick chips — first message only */}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-1.5 border-t border-border bg-white px-3 py-2.5">
              {QUICK.map((q) => (
                <button key={q} onClick={() => send(q)} className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-border bg-white px-3 py-3 flex gap-2 shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Ask about your case…"
              disabled={sending}
              className="flex-1 h-10 rounded-full border border-border bg-muted/30 px-4 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition disabled:opacity-60"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || sending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-40 transition hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #0F4C81 0%, #00A896 100%)' }}
            >
              <ArrowRight weight="bold" className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CasePage() {
  const router = useRouter();
  const { engagement, progress, loading, me } = useUser();
  const [botOpen, setBotOpen] = useState(false);
  const [docs, setDocs] = useState<any[]>([]);
  const [tracking, setTracking] = useState<any[]>([]);
  const [caseUpdates, setCaseUpdates] = useState<any[]>([]);

  useEffect(() => {
    if (me?.id) {
      api.getDocuments(me.id).then(setDocs).catch(() => {});
    }
  }, [me?.id]);

  useEffect(() => {
    if (engagement?.id) {
      api.getEngagementTracking(engagement.id).then(setTracking).catch(() => {});
      api.getClientUpdates(engagement.id).then(setCaseUpdates).catch(() => {});
    }
  }, [engagement?.id]);

  const milestones: any[] = engagement?.milestones ?? [];
  const completedCount = milestones.filter((m) => !!m.completedAt).length;
  const progressPct = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;
  const consultant = engagement?.consultants?.[0] ?? engagement?.consultant ?? null;
  const orders: any[] = engagement?.orders ?? [];
  const verifiedDocs = docs.filter((d) => d.status === 'VERIFIED').length;

  if (loading) return <CaseSkeleton />;

  return (
    <div className="space-y-5">
      {/* Case status bot — only when engagement exists */}
      {engagement && me?.id && (
        <CaseStatusBot personId={me.id} engagementId={engagement.id} name={me.name} />
      )}

      {/* Page title */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">My Case</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track your licensing journey and stay up to date with your consultant.</p>
        </div>
        {consultant && (
          <button
            onClick={() => router.push('/messages')}
            className="shrink-0 flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors shadow-sm"
          >
            <ChatText className="h-4 w-4" /> Message consultant
          </button>
        )}
      </div>

      {/* No engagement */}
      {!engagement && (
        <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
            <Buildings className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground">No active engagement</h3>
          <p className="mt-2 max-w-sm mx-auto text-sm text-muted-foreground">
            Your consulting engagement will appear here once your consultant sets it up after your initial session.
          </p>
          <button
            onClick={() => router.push('/bookings')}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            <CalendarBlank className="h-4 w-4" /> Book a consultation
          </button>
        </div>
      )}

      {engagement && (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiChip
              label="Milestones"
              value={`${completedCount}/${milestones.length}`}
              sub={milestones.length > 0 ? `${progressPct}% complete` : 'Not configured'}
            />
            <KpiChip
              label="Documents"
              value={verifiedDocs}
              sub={`of ${docs.length} verified`}
            />
            <KpiChip
              label="Days Active"
              value={daysAgo(engagement.createdAt)}
              sub={`Since ${formatDate(engagement.createdAt)}`}
            />
            <KpiChip
              label="Stage"
              value={progress?.currentStage?.label ?? '—'}
              sub={progress?.currentStage?.pathway?.country ?? 'Awaiting assignment'}
            />
          </div>

          {/* Next action banner */}
          <NextActionBanner engagement={engagement} docs={docs} router={router} />

          {/* Two-column layout */}
          <div className="flex flex-col xl:flex-row gap-5 items-start">

            {/* ── Main column ── */}
            <div className="flex-1 min-w-0 space-y-5">

              {/* Engagement letter */}
              <div className={`rounded-2xl border p-6 shadow-sm ${
                engagement.letterSignedAt
                  ? 'border-primary/20 bg-primary/5'
                  : 'border-amber-200 bg-amber-50/60'
              }`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      engagement.letterSignedAt ? 'bg-primary/10' : 'bg-amber-100'
                    }`}>
                      {engagement.letterSignedAt
                        ? <Seal weight="fill" className="h-5 w-5 text-primary" />
                        : <Signature className="h-5 w-5 text-amber-600" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Engagement Letter</h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {engagement.letterSignedAt
                          ? 'Signed and on file — your engagement is formally active.'
                          : 'Your engagement letter requires your signature before we can proceed.'}
                      </p>
                      {engagement.letterSignedAt && (
                        <p className="mt-1 text-xs font-medium text-primary">
                          Signed {formatDate(engagement.letterSignedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  {engagement.letterSignedAt ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                        <CheckCircle weight="fill" className="h-3.5 w-3.5" /> Signed
                      </span>
                      <button
                        onClick={() => api.downloadEngagementLetterPdf(engagement.id).catch(() => toast.error('Download failed'))}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-sm"
                        title="Download engagement letter PDF"
                      >
                        <DownloadSimple className="h-3.5 w-3.5" /> Download PDF
                      </button>
                    </div>
                  ) : engagement.letterUrl ? (
                    <a
                      href={`/sign/${engagement.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
                    >
                      <Signature className="h-4 w-4" /> Sign Letter
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground rounded-xl border border-border bg-white px-3 py-1.5">
                      Being prepared…
                    </span>
                  )}
                </div>
              </div>

              {/* Engagement overview */}
              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">Engagement Overview</h3>
                      <Badge variant={engagementStatusVariant(engagement.status)} className="text-xs">
                        {engagement.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Opened {formatDate(engagement.createdAt)}
                    </p>
                  </div>

                  {progress?.currentStage?.pathway?.country && (
                    <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-2.5">
                      <span className="text-2xl leading-none">
                        {COUNTRY_FLAGS[progress.currentStage.pathway.country] ?? ''}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{progress.currentStage.pathway.country} Pathway</p>
                        {progress.currentStage.pathway.regulatoryBody && (
                          <p className="text-xs text-muted-foreground">{progress.currentStage.pathway.regulatoryBody}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                {milestones.length > 0 && (
                  <div className="mb-5">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{completedCount} of {milestones.length} milestones complete</span>
                      <span className="font-bold text-foreground">{progressPct}%</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-2.5 rounded-full bg-primary transition-all duration-700"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Team */}
                {engagement.consultants?.length > 0 && (
                  <div className="border-t border-border pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your Team</p>
                    <div className="flex flex-wrap gap-3">
                      {engagement.consultants.map((c: any) => (
                        <div key={c.id} className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/30 px-3 py-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shrink-0">
                            {c.name?.slice(0, 2).toUpperCase() ?? 'CN'}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground">{c.name}</p>
                            {c.email && (
                              <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                                <Envelope className="h-3 w-3" /> {c.email}
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Licensing Pipeline */}
              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-2">
                  <TrendUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Licensing Pipeline</h3>
                  {milestones.length > 0 && (
                    <span className="ml-auto text-xs text-muted-foreground">{completedCount}/{milestones.length} stages</span>
                  )}
                </div>

                {milestones.length === 0 ? (
                  <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-muted/20 py-10 text-center">
                    <Clock className="mb-2 h-7 w-7 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-foreground">Milestones being configured</p>
                    <p className="mt-1 text-xs text-muted-foreground">Your consultant is setting up your licensing stages. Check back soon.</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {milestones.map((m: any, i: number) => {
                      const isDone = !!m.completedAt;
                      const isActive = !isDone && i === milestones.findIndex((x: any) => !x.completedAt);
                      const isLast = i === milestones.length - 1;

                      return (
                        <div key={m.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                              isDone
                                ? 'border-primary bg-primary text-white'
                                : isActive
                                ? 'border-primary bg-primary text-white ring-4 ring-primary/15'
                                : 'border-border bg-white text-muted-foreground'
                            }`}>
                              {isDone ? <CheckCircle weight="fill" className="h-4 w-4" /> : i + 1}
                            </div>
                            {!isLast && (
                              <div className={`mt-1 mb-1 w-0.5 flex-1 min-h-8 transition-colors ${isDone ? 'bg-primary/40' : 'bg-border'}`} />
                            )}
                          </div>

                          <div className={`flex-1 min-w-0 ${isLast ? 'pb-0' : 'pb-8'}`}>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className={`text-sm font-semibold ${!isDone && !isActive ? 'text-muted-foreground' : 'text-foreground'}`}>
                                {m.label}
                              </p>
                              {isActive && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                  In Progress
                                </span>
                              )}
                              {isDone && (
                                <span className="text-xs text-muted-foreground">
                                  Completed {formatDate(m.completedAt)}
                                </span>
                              )}
                            </div>

                            {m.description && (
                              <p className="mt-1 text-xs text-muted-foreground">{m.description}</p>
                            )}

                            {isActive && progress?.currentStage?.requiredDocuments?.length > 0 && (
                              <div className="mt-3 rounded-xl border border-border bg-muted/20 p-4">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Required for this stage
                                </p>
                                <div className="space-y-1.5">
                                  {progress.currentStage.requiredDocuments.map((docType: string, j: number) => (
                                    <div key={j} className="flex items-center gap-2 text-xs text-foreground">
                                      <div className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                                      {docType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                    </div>
                                  ))}
                                </div>
                                <button
                                  onClick={() => router.push('/documents')}
                                  className="mt-3 flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
                                >
                                  <UploadSimple className="h-3.5 w-3.5" /> Upload documents
                                </button>
                              </div>
                            )}

                            {!isDone && !isActive && (
                              <p className="mt-0.5 text-xs text-muted-foreground">Pending previous stage</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Current stage detail */}
              {progress?.currentStage && (
                <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Current Stage Detail</h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-muted/30 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Stage</p>
                      <p className="mt-1 text-sm font-bold text-foreground">{progress.currentStage.label}</p>
                    </div>
                    {progress.currentStage.pathway?.country && (
                      <div className="rounded-xl bg-muted/30 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Destination</p>
                        <p className="mt-1 text-sm font-bold text-foreground">
                          {COUNTRY_FLAGS[progress.currentStage.pathway.country] ?? ''} {progress.currentStage.pathway.country}
                        </p>
                      </div>
                    )}
                    {progress.currentStage.pathway?.regulatoryBody && (
                      <div className="rounded-xl bg-muted/30 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Regulatory Body</p>
                        <p className="mt-1 text-sm font-bold text-foreground">{progress.currentStage.pathway.regulatoryBody}</p>
                      </div>
                    )}
                    {progress.startedAt && (
                      <div className="rounded-xl bg-muted/30 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Stage Started</p>
                        <p className="mt-1 text-sm font-bold text-foreground">{formatDate(progress.startedAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Case Updates from officer */}
              {caseUpdates.length > 0 && (
                <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
                  <div className="border-b border-border bg-muted/20 px-5 py-3.5 flex items-center gap-2">
                    <ChatText className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Case Updates</p>
                    <span className="ml-auto text-xs text-muted-foreground">{caseUpdates.length} update{caseUpdates.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="divide-y divide-border/60">
                    {caseUpdates.map((u: any) => (
                      <div key={u.id} className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary mt-0.5">
                            {(u.author?.name ?? 'MJN').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="text-xs font-semibold text-foreground">{u.author?.name ?? 'MJN Healthcare'}</p>
                              <span className="text-xs text-muted-foreground shrink-0">{formatDate(u.createdAt)}</span>
                            </div>
                            <p className="text-sm text-foreground whitespace-pre-wrap">{u.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Application Progress */}
              {tracking.length > 0 && (
                <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
                  <div className="border-b border-border bg-muted/20 px-5 py-3.5 flex items-center gap-2">
                    <ArrowSquareUpRight className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Application Progress</p>
                    <span className="ml-auto text-xs text-muted-foreground">{tracking.length} submission{tracking.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="divide-y divide-border/60">
                    {tracking.map((t: any) => (
                      <div key={t.id} className="px-5 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">{t.portal}</p>
                            {t.referenceNumber && (
                              <p className="text-xs text-muted-foreground mt-0.5">Ref: {t.referenceNumber}</p>
                            )}
                            {t.submittedAt && (
                              <p className="text-xs text-muted-foreground">Submitted {formatDate(t.submittedAt)}</p>
                            )}
                            {t.nextActionDate && (
                              <p className="text-xs text-amber-600 mt-0.5">Next action: {formatDate(t.nextActionDate)}</p>
                            )}
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            t.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                            t.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                            t.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Feed */}
              <ActivityFeed engagement={engagement} docs={docs} />

              {/* Mobile sidebar cards (visible below xl) */}
              <div className="xl:hidden space-y-5">
                <CaseSidebar
                  consultant={consultant}
                  engagement={engagement}
                  progressPct={progressPct}
                  completedCount={completedCount}
                  milestones={milestones}
                  docs={docs}
                  router={router}
                />
              </div>
            </div>

            {/* ── Right sidebar (xl only) ── */}
            <div className="hidden xl:block w-[280px] shrink-0">
              <CaseSidebar
                consultant={consultant}
                engagement={engagement}
                progressPct={progressPct}
                completedCount={completedCount}
                milestones={milestones}
                docs={docs}
                router={router}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
