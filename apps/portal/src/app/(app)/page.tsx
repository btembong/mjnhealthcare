'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge, Button, Skeleton } from '@mjn/ui';
import {
  FileText, CreditCard, BookOpen, CalendarBlank,
  CheckCircle, Clock, WarningCircle, TrendUp, ArrowRight,
  Sparkle, Buildings, Student, X, PaperPlaneTilt, ChatCircle,
  UploadSimple, CaretRight, Shield, ShoppingCart,
  IdentificationCard, Certificate, XCircle,
} from '@mjn/ui';
import { useUser } from '../../contexts/user-context';
import { api } from '../../lib/api';
import { SurveyInvite } from '../../components/survey-invite';

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
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCaseRef(id: string | undefined): string {
  if (!id) return '—';
  return `ENG-${id.slice(-6).toUpperCase()}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-64 w-full rounded-2xl" />
      <div className="grid gap-4 lg:grid-cols-5">
        <Skeleton className="lg:col-span-3 h-72 rounded-2xl" />
        <Skeleton className="lg:col-span-2 h-72 rounded-2xl" />
      </div>
      <Skeleton className="h-32 rounded-2xl" />
    </div>
  );
}

// ── Next Action Banner ────────────────────────────────────────────────────────

function NextActionBanner({ engagement, documents, orders, me, onNavigate }: {
  engagement: any; documents: any[]; orders: any[]; me: any; onNavigate: (p: string) => void;
}) {
  const configs: { show: boolean; action: boolean; icon: any; title: string; sub: string; cta: string; href: string }[] = [
    {
      show: !me?.name || me.name === me.email,
      action: true,
      icon: Student, title: 'Complete your profile',
      sub: 'Add your name and profession so your consultant can get started.',
      cta: 'Complete profile', href: '/settings',
    },
    {
      show: (() => { const exp = documents.filter((d) => { if (!d.expiryDate) return false; return Math.ceil((new Date(d.expiryDate).getTime() - Date.now()) / 86400000) <= 14; }); return exp.length > 0; })(),
      action: true,
      icon: WarningCircle, title: 'Documents expiring within 14 days',
      sub: 'Renew and re-upload before expiry to keep your case on track.',
      cta: 'Renew now', href: '/documents',
    },
    {
      show: orders.some((o) => o.status === 'PENDING'),
      action: true,
      icon: CreditCard, title: `Payment of $${Number(orders.find((o) => o.status === 'PENDING')?.total ?? 0).toLocaleString()} required`,
      sub: 'Complete to continue your licensing pathway.',
      cta: 'Pay now', href: '/payments',
    },
    {
      show: documents.some((d) => d.status === 'PENDING'),
      action: false,
      icon: FileText, title: `${documents.filter((d) => d.status === 'PENDING').length} document(s) under review`,
      sub: 'Being verified by your consultant — no action needed.',
      cta: 'View docs', href: '/documents',
    },
    {
      show: !engagement,
      action: false,
      icon: Sparkle, title: 'Ready to start your journey?',
      sub: 'Book a consultation — your consultant will set up your pathway.',
      cta: 'Book now', href: '/bookings',
    },
  ];

  const active = configs.find((c) => c.show);
  if (!active) return null;
  const Icon = active.icon;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon weight="fill" className="h-5 w-5 text-primary" />
          {active.action && (
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-accent" />
          )}
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{active.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{active.sub}</p>
        </div>
      </div>
      <button
        onClick={() => onNavigate(active.href)}
        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 transition-colors"
      >
        {active.cta} <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Onboarding Checklist ──────────────────────────────────────────────────────

function OnboardingChecklist({ steps, onNavigate }: {
  steps: { label: string; sub: string; done: boolean; href: string }[];
  onNavigate: (p: string) => void;
}) {
  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-foreground">Getting started</p>
          <p className="text-xs text-muted-foreground mt-0.5">{doneCount} of {steps.length} steps complete</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-32 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full gradient-hero transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-sm font-bold text-foreground w-10 text-right">{pct}%</span>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <div
            key={i}
            onClick={() => !step.done && onNavigate(step.href)}
            className={[
              'flex items-start gap-3 rounded-xl border px-3.5 py-3 transition-all',
              step.done ? 'border-primary/20 bg-primary/5' : 'border-border bg-white cursor-pointer hover:border-primary/40 hover:shadow-sm',
            ].join(' ')}
          >
            <div className={[
              'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all',
              step.done ? 'gradient-hero text-white' : 'bg-muted text-muted-foreground',
            ].join(' ')}>
              {step.done ? <CheckCircle weight="fill" className="h-3 w-3" /> : i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-semibold ${step.done ? 'text-primary/60 line-through' : 'text-foreground'}`}>{step.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{step.sub}</p>
            </div>
            {!step.done && <CaretRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 mt-0.5" />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Hero Command Header ───────────────────────────────────────────────────────

function HeroHeader({
  me, engagement, milestones, completedMilestones, caseProgress,
  documents, verifiedDocs, orders, balanceRemaining, bookings,
  onNavigate,
}: {
  me: any; engagement: any; milestones: any[]; completedMilestones: number;
  caseProgress: number; documents: any[]; verifiedDocs: number;
  orders: any[]; balanceRemaining: number; bookings: any[];
  onNavigate: (p: string) => void;
}) {
  const firstName = me?.name && me.name !== me.email ? me.name.split(' ')[0] : 'there';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  const currentIdx = milestones.findIndex((m: any) => !m.completedAt);
  const allDone = milestones.length > 0 && currentIdx === -1;
  const current = currentIdx >= 0 ? milestones[currentIdx] : null;
  const upNext = currentIdx >= 0 ? milestones[currentIdx + 1] : null;

  const nextSession = bookings
    .filter((b) => b.status === 'CONFIRMED' && b.slot?.startTime && new Date(b.slot.startTime).getTime() > Date.now())
    .sort((a, b) => new Date(a.slot.startTime).getTime() - new Date(b.slot.startTime).getTime())[0];
  const unpaidOrders = orders.filter((o) => o.status !== 'PAID').length;

  const stats = [
    {
      label: 'Documents',
      value: documents.length ? `${verifiedDocs} / ${documents.length}` : '—',
      sub: documents.length ? 'verified' : 'None uploaded yet',
      href: '/documents',
    },
    {
      label: 'Pipeline',
      value: milestones.length ? `${caseProgress}%` : '—',
      sub: milestones.length ? `${completedMilestones} of ${milestones.length} stages` : 'Not started',
      href: '/case',
    },
    {
      label: 'Balance due',
      value: balanceRemaining > 0 ? `$${balanceRemaining.toLocaleString()}` : orders.length ? 'Settled' : '—',
      sub: balanceRemaining > 0
        ? `${unpaidOrders} order${unpaidOrders !== 1 ? 's' : ''} pending`
        : orders.length ? 'Nothing owed' : 'No orders yet',
      href: '/payments',
      alert: balanceRemaining > 0,
    },
    {
      label: 'Next session',
      value: nextSession
        ? `${new Date(nextSession.slot.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${new Date(nextSession.slot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
        : '—',
      sub: nextSession ? untilLabel(nextSession.slot.startTime) : 'Nothing scheduled',
      href: '/bookings',
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm">
      <div className="p-6">
        {/* Who and what */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{today}</p>
            <h1 className="mt-1 text-2xl font-extrabold leading-tight tracking-tight text-foreground">
              Welcome back, {firstName}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              {me?.profession && <span>{statusLabel(me.profession)}</span>}
              {engagement && (
                <>
                  {me?.profession && <span className="text-muted-foreground/40">·</span>}
                  <span className="font-mono">{formatCaseRef(engagement.id)}</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                    <span className={`h-1.5 w-1.5 rounded-full ${engagement.status === 'ACTIVE' ? 'bg-secondary' : 'bg-muted-foreground/40'}`} />
                    {statusLabel(engagement.status)}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => onNavigate('/documents')}
              className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-muted/50"
            >
              <UploadSimple className="h-4 w-4" /> Upload
            </button>
            <button
              onClick={() => onNavigate(engagement ? '/case' : '/bookings')}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary/90"
            >
              {engagement ? 'View case' : 'Book now'} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Where you are */}
        <div className="mt-6">
          {!engagement ? (
            <p className="text-sm text-muted-foreground">
              Book a consultation to set up your licensing pathway.
            </p>
          ) : milestones.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Your consultant is setting up your stages — they will appear here once ready.
            </p>
          ) : (
            <>
              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {allDone ? 'Pathway' : 'Current stage'}
                  </p>
                  <p className="mt-1 truncate text-base font-bold text-foreground">
                    {allDone ? 'All stages complete' : current?.label}
                  </p>
                </div>
                <p className="shrink-0 text-xs font-semibold text-muted-foreground">
                  {allDone ? `${milestones.length} of ${milestones.length}` : `Stage ${currentIdx + 1} of ${milestones.length}`}
                </p>
              </div>
              <div className="mt-3 flex gap-1">
                {milestones.map((m: any, i: number) => (
                  <div
                    key={m.id}
                    title={m.label}
                    className={`h-2 flex-1 rounded-full ${
                      m.completedAt ? 'gradient-hero' : i === currentIdx ? 'bg-primary/30' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              {upNext && (
                <p className="mt-2.5 text-xs text-muted-foreground">
                  Next: <span className="font-semibold text-foreground">{upNext.label}</span>
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* The four numbers */}
      <div className="grid grid-cols-2 gap-y-1 border-t border-border/70 px-2 py-2 sm:grid-cols-4">
        {stats.map((stat, i) => (
          <button
            key={stat.label}
            onClick={() => onNavigate(stat.href)}
            className={`rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/40 ${i > 0 ? 'sm:border-l sm:border-border/60 sm:rounded-l-none' : ''}`}
          >
            <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
            <p className="mt-1 flex items-center gap-1.5 text-lg font-extrabold leading-tight text-foreground">
              {stat.alert && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />}
              {stat.value}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{stat.sub}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Horizontal Pipeline Stage Rail ───────────────────────────────────────────

function PipelineRail({ engagement, progress, milestones, onNavigate, onMessage }: {
  engagement: any; progress: any; milestones: any[]; onNavigate: (p: string) => void; onMessage: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-hero shadow-sm">
            <Buildings className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">Licensing Pipeline</h3>
            {engagement && (
              <p className="text-xs text-muted-foreground mt-0.5">{formatCaseRef(engagement.id)}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {engagement && (
            <Badge variant={statusVariant(engagement.status)} className="text-[10px] uppercase tracking-wider">
              {statusLabel(engagement.status)}
            </Badge>
          )}
          {engagement && (
            <button onClick={() => onNavigate('/case')} className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
              Full case <CaretRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* No engagement */}
      {!engagement && (
        <div className="flex flex-col items-center justify-center py-14 text-center px-6">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
            <Buildings className="h-8 w-8 text-muted-foreground/40" weight="duotone" />
          </div>
          <p className="font-bold text-foreground">No active engagement</p>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
            Your licensing pipeline will appear here once your consultant sets up your engagement.
          </p>
          <button
            onClick={() => onNavigate('/bookings')}
            className="mt-5 flex items-center gap-2 rounded-xl gradient-hero px-5 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-90 transition-all"
          >
            Book a consultation <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Engagement but no progress yet */}
      {engagement && !progress && (
        <div className="flex flex-col items-center justify-center py-12 text-center px-6">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50">
            <Clock className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <p className="font-bold text-foreground">Pathway being configured</p>
          <p className="mt-1 text-sm text-muted-foreground">Your consultant is setting up your licensing stages.</p>
          <button
            onClick={onMessage}
            className="mt-4 flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
          >
            <ChatCircle className="h-3.5 w-3.5" /> Message consultant
          </button>
        </div>
      )}

      {/* Stage rail */}
      {engagement && progress && milestones.length > 0 && (
        <div className="p-5">
          {/* Connector line + dots */}
          <div className="relative mb-5 hidden sm:flex items-center px-4">
            <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-border" />
            {milestones.map((m: any, i: number) => {
              const isDone = !!m.completedAt;
              const isActive = !isDone && i === milestones.findIndex((x: any) => !x.completedAt);
              const pct = (i / Math.max(milestones.length - 1, 1)) * 100;
              return (
                <div
                  key={m.id}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2 top-1/2"
                  style={{ left: `${pct}%` }}
                >
                  <div className={[
                    'flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all shadow-sm',
                    isDone   ? 'border-primary bg-primary text-white' : '',
                    isActive ? 'border-primary bg-white text-primary ring-4 ring-primary/20' : '',
                    !isDone && !isActive ? 'border-border bg-white text-muted-foreground' : '',
                  ].join(' ')}>
                    {isDone ? <CheckCircle weight="fill" className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stage cards */}
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {milestones.map((m: any, i: number) => {
              const isDone = !!m.completedAt;
              const isActive = !isDone && i === milestones.findIndex((x: any) => !x.completedAt);
              return (
                <div
                  key={m.id}
                  className={[
                    'flex-shrink-0 w-44 rounded-xl border p-3.5 transition-all',
                    isDone   ? 'border-primary/20 bg-primary/5' : '',
                    isActive ? 'border-primary bg-white shadow-md ring-1 ring-primary/30' : '',
                    !isDone && !isActive ? 'border-border bg-muted/20' : '',
                  ].join(' ')}
                >
                  <div className="mb-2.5 flex items-center justify-between">
                    <div className={[
                      'flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold',
                      isDone   ? 'gradient-hero text-white shadow-sm' : '',
                      isActive ? 'bg-primary/10 text-primary' : '',
                      !isDone && !isActive ? 'bg-muted text-muted-foreground' : '',
                    ].join(' ')}>
                      {isDone ? <CheckCircle weight="fill" className="h-3.5 w-3.5" /> : i + 1}
                    </div>
                    {isActive && (
                      <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary uppercase tracking-wide">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        Active
                      </span>
                    )}
                    {isDone && (
                      <span className="rounded-full bg-secondary/10 border border-secondary/30 px-2 py-0.5 text-[9px] font-bold text-foreground/80 uppercase tracking-wide">
                        Done
                      </span>
                    )}
                  </div>
                  <p className={`text-xs font-bold leading-snug mb-1 ${!isDone && !isActive ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {m.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {isDone && m.completedAt ? fmtDate(m.completedAt) : isActive ? 'In progress' : 'Awaiting previous'}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Documents footer */}
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Last updated {timeAgo(engagement.updatedAt)}</p>
            <button onClick={() => onNavigate('/documents')} className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
              View documents <CaretRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Activity Feed ─────────────────────────────────────────────────────────────

function ActivityFeed({ documents, engagement, orders }: { documents: any[]; engagement: any; orders: any[] }) {
  type Activity = { date: string; text: string; sub?: string; type: 'doc' | 'milestone' | 'order'; status?: string };
  const items: Activity[] = [
    ...documents.map((d) => ({
      date: d.uploadedAt ?? d.createdAt ?? '',
      text: `${d.type} ${d.status === 'VERIFIED' ? 'verified' : d.status === 'REJECTED' ? 'rejected' : 'uploaded'}`,
      sub: d.status === 'VERIFIED' ? 'Verified by consultant' : d.status === 'REJECTED' ? 'Contact consultant to re-upload' : 'Under review',
      type: 'doc' as const,
      status: d.status,
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

  function iconEl(item: Activity) {
    if (item.type === 'milestone') return <CheckCircle weight="fill" className="h-3.5 w-3.5 text-primary" />;
    if (item.type === 'order') return <CreditCard className="h-3.5 w-3.5 text-primary" />;
    if (item.status === 'VERIFIED') return <CheckCircle weight="fill" className="h-3.5 w-3.5 text-secondary" />;
    if (item.status === 'REJECTED') return <XCircle weight="fill" className="h-3.5 w-3.5 text-rose-500" />;
    return <Clock className="h-3.5 w-3.5 text-accent" />;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <Clock className="mb-3 h-10 w-10 text-muted-foreground/20" />
        <p className="text-sm font-medium text-muted-foreground">Activity will appear here as your case progresses.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {items.map((item, i) => (
        <div key={i} className="flex gap-3 group">
          <div className="flex flex-col items-center pt-0.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted/60 group-hover:bg-muted transition-colors">
              {iconEl(item)}
            </div>
            {i < items.length - 1 && <div className="w-px flex-1 bg-border/60 min-h-3 my-1" />}
          </div>
          <div className="pb-4 flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-snug">{item.text}</p>
            <div className="mt-1 flex items-center gap-2">
              {item.sub && <span className="text-xs text-muted-foreground">{item.sub}</span>}
              <span className="text-xs text-muted-foreground/40">·</span>
              <span className="text-xs text-muted-foreground/60">{timeAgo(item.date)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Financial Summary ─────────────────────────────────────────────────────────

function FinancialSummary({ orders, onNavigate }: { orders: any[]; onNavigate: (p: string) => void }) {
  if (orders.length === 0) return null;
  const total = orders.reduce((s, o) => s + Number(o.total ?? 0), 0);
  const paid = orders.filter((o) => o.status === 'PAID').reduce((s, o) => s + Number(o.total ?? 0), 0);
  const remaining = total - paid;
  const paidPct = total > 0 ? Math.round((paid / total) * 100) : 0;
  const nextDue = orders.find((o) => o.status === 'PENDING' || o.status === 'PARTIALLY_PAID');
  const partialPaid = orders.filter((o) => o.status === 'PARTIALLY_PAID');

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-hero shadow-sm">
            <CreditCard className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-bold text-foreground text-sm">Financial Summary</h3>
        </div>
        <button onClick={() => onNavigate('/payments')} className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
          View all <CaretRight className="h-3 w-3" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="mb-2 flex items-end justify-between">
          <div>
            <span className="text-2xl font-extrabold text-foreground">${paid.toLocaleString()}</span>
            <span className="ml-1.5 text-sm text-muted-foreground">of ${total.toLocaleString()} paid</span>
          </div>
          <span className="text-sm font-bold text-foreground">{paidPct}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${paidPct === 100 ? 'bg-secondary' : 'gradient-hero'}`}
            style={{ width: `${paidPct}%` }}
          />
        </div>
      </div>

      {/* Key figures */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total contract', value: `$${total.toLocaleString()}`, sub: `${orders.length} order${orders.length !== 1 ? 's' : ''}`, alert: false },
          { label: 'Remaining', value: remaining > 0 ? `$${remaining.toLocaleString()}` : 'Settled', sub: remaining > 0 ? 'Outstanding' : 'Nothing owed', alert: remaining > 0 },
          { label: 'Next due', value: nextDue ? `$${Number(nextDue.total).toLocaleString()}` : '—', sub: nextDue ? statusLabel(nextDue.status) : 'No pending orders', alert: !!nextDue },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-muted/20 p-3">
            <p className="text-[11px] font-medium text-muted-foreground mb-1">{item.label}</p>
            <p className="text-base font-extrabold text-foreground">{item.value}</p>
            <p className={`mt-0.5 flex items-center gap-1.5 text-[11px] ${item.alert ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
              {item.alert && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
              {item.sub}
            </p>
          </div>
        ))}
      </div>

      {partialPaid.length > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted/40 border border-border px-3.5 py-2.5">
          <WarningCircle weight="fill" className="h-4 w-4 shrink-0 text-accent" />
          <p className="text-xs text-foreground font-medium">
            {partialPaid.length} instalment{partialPaid.length > 1 ? 's' : ''} partially paid — next payment due on stage completion.
          </p>
        </div>
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
      if (engagementId) await api.sendMessage(engagementId, msg.trim());
      toast.success('Message sent to your consultant.');
      onClose();
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 border border-border/40" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="font-bold text-foreground">Message your consultant</p>
            {consultant?.name && <p className="text-xs text-muted-foreground mt-0.5">{consultant.name}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Ask a question or share an update…"
          rows={4}
          className="w-full rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
          autoFocus
        />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            onClick={send}
            disabled={!msg.trim() || sending}
            className="flex items-center gap-1.5 rounded-xl gradient-hero px-5 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40 transition-all shadow-md"
          >
            <PaperPlaneTilt className="h-4 w-4" /> {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Right Rail ────────────────────────────────────────────────────────────────

type RailAlert = {
  text: string; sub: string; critical: boolean; cta: string; href: string;
  kind: 'payment' | 'rejected' | 'expiring'; docType?: string;
};

function alertIcon(a: RailAlert) {
  if (a.kind === 'payment') return CreditCard;
  if (/passport|identity|national_id|visa/i.test(a.docType ?? '')) return IdentificationCard;
  if (/licen[cs]e|certificate|degree|diploma|transcript/i.test(a.docType ?? '')) return Certificate;
  return FileText;
}

function untilLabel(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'Starting now';
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `in ${mins} min`;
  if (hours < 24) return `in ${hours}h`;
  return `in ${days} day${days !== 1 ? 's' : ''}`;
}

function RailCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div className="mb-3.5 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function AttentionCard({ alerts, onNavigate }: { alerts: RailAlert[]; onNavigate: (p: string) => void }) {
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-secondary/30 bg-secondary/10 px-4 py-3">
        <Shield weight="fill" className="h-4 w-4 shrink-0 text-secondary" />
        <span className="text-xs font-semibold text-foreground">All clear — nothing needs your attention</span>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div className="mb-3.5 flex items-center gap-2">
        <WarningCircle weight="fill" className="h-4 w-4 text-accent" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Needs attention</h3>
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-accent-foreground">
          {alerts.length}
        </span>
      </div>
      <div className="divide-y divide-border/60">
        {alerts.map((a, i) => {
          const Icon = alertIcon(a);
          const BadgeIcon = a.kind === 'rejected' ? XCircle : a.kind === 'expiring' ? Clock : WarningCircle;
          return (
            <div key={i} className="flex gap-3 py-3.5 first:pt-0 last:pb-0">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icon weight="duotone" className="h-5 w-5 text-primary" />
                <span className="absolute -bottom-1 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white">
                  <BadgeIcon weight="fill" className={`h-4 w-4 ${a.critical ? 'text-rose-500' : 'text-accent'}`} />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-snug text-foreground">{a.text}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{a.sub}</p>
                <button
                  onClick={() => onNavigate(a.href)}
                  className={`mt-2.5 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                    i === 0
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : 'border border-border text-foreground hover:border-primary/30 hover:bg-muted/50'
                  }`}
                >
                  {a.cta} <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RightRail({ consultant, bookings, documents, alerts, onMessage, onNavigate }: {
  consultant: any; bookings: any[]; documents: any[]; alerts: RailAlert[];
  onMessage: () => void; onNavigate: (p: string) => void;
}) {
  const upcoming = bookings
    .filter((b) => b.status === 'CONFIRMED' && b.slot?.startTime && new Date(b.slot.startTime).getTime() > Date.now() - 3600000)
    .sort((a, b) => new Date(a.slot.startTime).getTime() - new Date(b.slot.startTime).getTime());
  const next = upcoming[0];
  const later = upcoming.slice(1, 3);

  const docSegments = [
    { label: 'Verified',  count: documents.filter((d) => d.status === 'VERIFIED').length, bar: 'bg-secondary', dot: 'bg-secondary' },
    { label: 'In review', count: documents.filter((d) => d.status === 'PENDING').length,  bar: 'bg-primary/30',  dot: 'bg-primary/30' },
    { label: 'Rejected',  count: documents.filter((d) => d.status === 'REJECTED').length, bar: 'bg-accent',      dot: 'bg-accent' },
  ];

  const shortcuts = [
    { label: 'Upload',   icon: UploadSimple, href: '/documents' },
    { label: 'Services', icon: ShoppingCart, href: '/checkout' },
    { label: 'Courses',  icon: BookOpen,     href: '/academy' },
    { label: 'Payments', icon: CreditCard,   href: '/payments' },
  ];

  const sessionType = (b: any) => statusLabel(b.type ?? 'Session');

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">

      {/* Attention — below xl it is rendered at the top of the main column instead */}
      <div className={alerts.length > 0 ? 'hidden xl:block' : 'md:col-span-2 xl:col-span-1'}>
        <AttentionCard alerts={alerts} onNavigate={onNavigate} />
      </div>

      {/* Next session */}
      <RailCard
        title="Next session"
        action={upcoming.length > 0 && (
          <button onClick={() => onNavigate('/bookings')} className="text-xs font-bold text-primary hover:underline">View all</button>
        )}
      >
        {!next ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-5 text-center">
            <CalendarBlank className="mx-auto mb-2 h-7 w-7 text-muted-foreground/40" />
            <p className="text-sm font-semibold text-foreground">Nothing scheduled</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Book time with your consultant.</p>
            <button
              onClick={() => onNavigate('/bookings')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg gradient-hero px-3.5 py-2 text-xs font-bold text-white hover:opacity-90"
            >
              Book a session <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3.5">
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10">
                <span className="text-xs font-bold uppercase leading-none text-primary">
                  {new Date(next.slot.startTime).toLocaleDateString('en-US', { month: 'short' })}
                </span>
                <span className="mt-0.5 text-xl font-extrabold leading-none text-primary">
                  {new Date(next.slot.startTime).getDate()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">{sessionType(next)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(next.slot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  <span className="mx-1.5 text-muted-foreground/40">·</span>
                  <span className="font-semibold text-primary">{untilLabel(next.slot.startTime)}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('/bookings')}
              className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-xs font-bold text-foreground transition-colors hover:border-primary/30 hover:bg-muted/50"
            >
              View details <ArrowRight className="h-3.5 w-3.5" />
            </button>
            {later.length > 0 && (
              <div className="mt-3 divide-y divide-border/60 border-t border-border/60">
                {later.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => onNavigate('/bookings')}
                    className="flex w-full items-center justify-between gap-2 py-2.5 text-left text-xs hover:text-primary"
                  >
                    <span className="truncate">
                      <span className="font-semibold text-foreground">
                        {new Date(b.slot.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="mx-1.5 text-muted-foreground/40">·</span>
                      <span className="text-muted-foreground">{sessionType(b)}</span>
                    </span>
                    <CaretRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </RailCard>

      {/* Consultant */}
      <RailCard title="Your consultant">
        {consultant ? (
          <>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full gradient-hero text-sm font-bold text-white">
                {consultant.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">{consultant.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Case Consultant</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={onMessage}
                className="flex items-center justify-center gap-1.5 rounded-xl gradient-hero px-3 py-2.5 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
              >
                <ChatCircle className="h-3.5 w-3.5" /> Message
              </button>
              <button
                onClick={() => onNavigate('/bookings')}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-xs font-bold text-foreground transition-colors hover:border-primary/30 hover:bg-muted/50"
              >
                <CalendarBlank className="h-3.5 w-3.5" /> Book
              </button>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-border px-4 py-5 text-center">
            <p className="text-sm font-semibold text-foreground">Not assigned yet</p>
            <p className="mt-0.5 text-xs text-muted-foreground">A consultant is assigned after your first consultation.</p>
            <button onClick={() => onNavigate('/bookings')} className="mt-2.5 text-xs font-bold text-primary hover:underline">
              Book a consultation →
            </button>
          </div>
        )}
      </RailCard>

      {/* Documents */}
      <RailCard
        title="Documents"
        action={documents.length > 0 && (
          <span className="text-xs font-bold text-foreground">
            {docSegments[0].count}<span className="font-medium text-muted-foreground"> / {documents.length} verified</span>
          </span>
        )}
      >
        {documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-5 text-center">
            <FileText className="mx-auto mb-2 h-7 w-7 text-muted-foreground/40" />
            <p className="text-sm font-semibold text-foreground">No documents yet</p>
            <button onClick={() => onNavigate('/documents')} className="mt-1.5 text-xs font-bold text-primary hover:underline">
              Upload your first document →
            </button>
          </div>
        ) : (
          <>
            <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full">
              {docSegments.filter((s) => s.count > 0).map((s) => (
                <div key={s.label} className={`h-full ${s.bar}`} style={{ flexGrow: s.count, flexBasis: 0 }} />
              ))}
            </div>
            <div className="mt-3 space-y-1.5">
              {docSegments.map((s) => (
                <div key={s.label} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className={`h-2 w-2 rounded-full ${s.dot}`} /> {s.label}
                  </span>
                  <span className="font-bold text-foreground">{s.count}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => onNavigate('/documents')}
              className="mt-3.5 flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              Manage documents <CaretRight className="h-3 w-3" />
            </button>
          </>
        )}
      </RailCard>

      {/* Shortcuts */}
      <RailCard title="Shortcuts">
        <div className="grid grid-cols-2 gap-2">
          {shortcuts.map(({ label, icon: Icon, href }) => (
            <button
              key={label}
              onClick={() => onNavigate(href)}
              className="group flex flex-col items-start gap-2 rounded-xl border border-border p-3 text-left transition-all hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 transition-colors group-hover:bg-primary/10">
                <Icon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
              </span>
              <span className="text-xs font-bold text-foreground">{label}</span>
            </button>
          ))}
        </div>
      </RailCard>
    </div>
  );
}

// ── Engagement Switcher ───────────────────────────────────────────────────────

function EngagementSwitcher({ allEngagements, active, onSwitch }: {
  allEngagements: any[]; active: any; onSwitch: (eng: any) => void;
}) {
  if (allEngagements.length <= 1) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-white px-4 py-3 shadow-md">
      <span className="text-xs font-bold text-muted-foreground mr-1">Switch case:</span>
      {allEngagements.map((eng) => (
        <button
          key={eng.id}
          onClick={() => onSwitch(eng)}
          className={[
            'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
            eng.id === active?.id
              ? 'gradient-hero text-white shadow-sm'
              : 'border border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground',
          ].join(' ')}
        >
          <span className="font-mono">ENG-{eng.id.slice(-4).toUpperCase()}</span>
          <span className="opacity-50">·</span>
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

  const verifiedDocs = documents.filter((d) => d.status === 'VERIFIED').length;
  const rejectedDocs = documents.filter((d) => d.status === 'REJECTED').length;
  const pendingDocs  = documents.filter((d) => d.status === 'PENDING').length;
  const consultant = engagement?.consultant ?? null;
  const milestones = engagement?.milestones ?? [];
  const completedMilestones = milestones.filter((m: any) => !!m.completedAt).length;
  const caseProgress = milestones.length ? Math.round((completedMilestones / milestones.length) * 100) : 0;
  const totalContract = orders.reduce((s, o) => s + Number(o.total ?? 0), 0);
  const totalPaid = orders.filter((o) => o.status === 'PAID').reduce((s, o) => s + Number(o.total ?? 0), 0);
  const balanceRemaining = totalContract - totalPaid;

  const onboardingSteps = [
    { label: 'Complete profile',        sub: 'Name & profession',              done: !!(me?.name && me.name !== me.email && me.profession), href: '/settings' },
    { label: 'Sign engagement letter',  sub: 'Formal agreement with MJN',      done: !!engagement, href: '/case' },
    { label: 'Upload documents',        sub: 'Passport, credentials, etc.',    done: documents.length > 0, href: '/documents' },
    { label: 'Select services',         sub: 'View catalog & checkout',        done: orders.length > 0, href: '/checkout' },
  ];
  const onboardingComplete = onboardingSteps.every((s) => s.done);

  const alerts: RailAlert[] = [
    ...orders.filter((o) => o.status === 'PENDING').map((o) => ({
      text: `Payment of $${Number(o.total).toLocaleString()} due`,
      sub: 'Complete payment to continue your pathway.',
      critical: false, cta: 'Pay now', href: '/payments', kind: 'payment' as const,
    })),
    ...documents.filter((d) => d.status === 'REJECTED').map((d) => ({
      text: `${statusLabel(d.type)} was rejected`,
      sub: 'Upload a corrected copy to keep your case moving.',
      critical: true, cta: 'Re-upload', href: '/documents', kind: 'rejected' as const, docType: d.type,
    })),
    ...documents.filter((d) => {
      if (!d.expiryDate) return false;
      return Math.ceil((new Date(d.expiryDate).getTime() - Date.now()) / 86400000) <= 30;
    }).map((d) => {
      const expired = new Date(d.expiryDate).getTime() < Date.now();
      return {
        text: `${statusLabel(d.type)} ${expired ? 'has expired' : 'expiring soon'}`,
        sub: `${expired ? 'Expired' : 'Expires'} ${fmtDate(d.expiryDate)}`,
        critical: expired, cta: 'Renew', href: '/documents',
        kind: 'expiring' as const, docType: d.type,
      };
    }),
  ];

  async function handleSignLetter() {
    if (!engagement?.letterUrl) return;
    window.open(engagement.letterUrl, '_blank');
    setLetterPolling(true);
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try { await refresh(); } catch {}
      if (attempts >= 37) { clearInterval(interval); setLetterPolling(false); }
    }, 8000);
  }

  if (loading) return <DashboardSkeleton />;

  return (
    <>
      <div className="flex flex-col gap-6 xl:flex-row">
        {/* ── Main content ── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Hero command header */}
          <HeroHeader
            me={me}
            engagement={engagement}
            milestones={milestones}
            completedMilestones={completedMilestones}
            caseProgress={caseProgress}
            documents={documents}
            verifiedDocs={verifiedDocs}
            orders={orders}
            balanceRemaining={balanceRemaining}
            bookings={bookings}
            onNavigate={router.push}
          />

          {/* Attention card moves here when the rail drops below the content */}
          {alerts.length > 0 && (
            <div className="xl:hidden">
              <AttentionCard alerts={alerts} onNavigate={router.push} />
            </div>
          )}

          {/* Engagement switcher */}
          <EngagementSwitcher allEngagements={allEngagements} active={engagement} onSwitch={switchEngagement} />

          {/* Letter polling banner */}
          {letterPolling && (
            <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-3.5 shadow-sm">
              <div className="h-4 w-4 shrink-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm font-semibold text-primary">Waiting for your signature — this page will update automatically once confirmed.</p>
            </div>
          )}

          {/* Onboarding checklist */}
          {!onboardingComplete && <OnboardingChecklist steps={onboardingSteps} onNavigate={router.push} />}

          {/* Next action banner */}
          <NextActionBanner engagement={engagement} documents={documents} orders={orders} me={me} onNavigate={router.push} />

          <SurveyInvite me={me} />

          {/* Pipeline + Activity Feed */}
          <div className="grid gap-5 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <PipelineRail
                engagement={engagement}
                progress={progress}
                milestones={milestones}
                onNavigate={router.push}
                onMessage={() => setMessageOpen(true)}
              />
            </div>

            {/* Activity Feed */}
            <div className="lg:col-span-2 rounded-2xl border border-border bg-white shadow-md overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/60">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm">Case Activity</h3>
                </div>
                <button onClick={() => router.push('/case')} className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                  View all <CaretRight className="h-3 w-3" />
                </button>
              </div>
              <div className="p-5">
                <ActivityFeed documents={documents} engagement={engagement} orders={orders} />
              </div>
            </div>
          </div>

          {/* Financial summary */}
          <FinancialSummary orders={orders} onNavigate={router.push} />

          {/* Recent Orders */}
          {orders.length > 0 && (
            <div className="rounded-2xl border border-border bg-white shadow-md overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/60">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm">Recent Orders</h3>
                </div>
                <button onClick={() => router.push('/payments')} className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                  View all <CaretRight className="h-3 w-3" />
                </button>
              </div>
              <div className="divide-y divide-border/60">
                {orders.slice(0, 3).map((order) => (
                  <div
                    key={order.id}
                    onClick={() => router.push('/payments')}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors cursor-pointer group"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 group-hover:bg-primary/10 transition-colors">
                      <CreditCard className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">
                        {order.orderType === 'standalone' ? 'À la carte order' : 'Engagement order'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' · '}{order.lineItems?.length ?? 0} service{order.lineItems?.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-extrabold text-foreground">${Number(order.total).toLocaleString()}</p>
                      <Badge
                        variant={order.status === 'PAID' ? 'success' : order.status === 'PARTIALLY_PAID' ? 'warning' : 'outline'}
                        className="text-[10px] uppercase tracking-wider mt-1"
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

        {/* ── Right rail ── */}
        <aside className="w-full shrink-0 xl:w-80">
          <div className="xl:sticky xl:top-6 xl:-m-1 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto xl:p-1">
            <RightRail
              consultant={consultant}
              bookings={bookings}
              documents={documents}
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
