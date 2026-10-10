'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge, Button, Skeleton } from '@mjn/ui';
import {
  FileText, CreditCard, BookOpen, CalendarBlank,
  CheckCircle, Clock, WarningCircle, TrendUp, ArrowRight,
  Sparkle, Buildings, Student, X, PaperPlaneTilt, ChatCircle,
  UploadSimple, CaretRight, Shield, Bell,
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
      <Skeleton className="h-52 w-full rounded-3xl" />
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
  const configs: { show: boolean; color: string; bg: string; border: string; icon: any; title: string; sub: string; cta: string; href: string }[] = [
    {
      show: !me?.name || me.name === me.email,
      color: 'text-amber-900', bg: 'bg-amber-50', border: 'border-amber-200',
      icon: Student, title: 'Complete your profile',
      sub: 'Add your name and profession so your consultant can get started.',
      cta: 'Complete profile', href: '/settings',
    },
    {
      show: (() => { const exp = documents.filter((d) => { if (!d.expiryDate) return false; return Math.ceil((new Date(d.expiryDate).getTime() - Date.now()) / 86400000) <= 14; }); return exp.length > 0; })(),
      color: 'text-rose-900', bg: 'bg-rose-50', border: 'border-rose-200',
      icon: WarningCircle, title: 'Documents expiring within 14 days',
      sub: 'Renew and re-upload before expiry to keep your case on track.',
      cta: 'Renew now', href: '/documents',
    },
    {
      show: orders.some((o) => o.status === 'PENDING'),
      color: 'text-rose-900', bg: 'bg-rose-50', border: 'border-rose-200',
      icon: CreditCard, title: `Payment of $${Number(orders.find((o) => o.status === 'PENDING')?.total ?? 0).toLocaleString()} required`,
      sub: 'Complete to continue your licensing pathway.',
      cta: 'Pay now', href: '/payments',
    },
    {
      show: documents.some((d) => d.status === 'PENDING'),
      color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/20',
      icon: FileText, title: `${documents.filter((d) => d.status === 'PENDING').length} document(s) under review`,
      sub: 'Being verified by your consultant — no action needed.',
      cta: 'View docs', href: '/documents',
    },
    {
      show: !engagement,
      color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/20',
      icon: Sparkle, title: 'Ready to start your journey?',
      sub: 'Book a consultation — your consultant will set up your pathway.',
      cta: 'Book now', href: '/bookings',
    },
  ];

  const active = configs.find((c) => c.show);
  if (!active) return null;
  const Icon = active.icon;

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border ${active.border} ${active.bg} px-5 py-4`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${active.bg}`}>
          <Icon weight="fill" className={`h-5 w-5 ${active.color}`} />
        </div>
        <div>
          <p className={`text-sm font-bold ${active.color}`}>{active.title}</p>
          <p className={`text-xs mt-0.5 ${active.color} opacity-70`}>{active.sub}</p>
        </div>
      </div>
      <button
        onClick={() => onNavigate(active.href)}
        className="flex items-center gap-2 rounded-xl bg-foreground/90 px-4 py-2 text-xs font-bold text-white hover:bg-foreground transition-colors"
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
  const initials = me?.name && me.name !== me.email
    ? me.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '??';

  const stats = [
    {
      value: documents.length ? `${verifiedDocs}/${documents.length}` : '—',
      label: 'Docs verified',
      href: '/documents',
    },
    {
      value: milestones.length ? `${caseProgress}%` : '—',
      label: 'Pipeline progress',
      href: '/case',
    },
    {
      value: balanceRemaining > 0 ? `$${balanceRemaining.toLocaleString()}` : orders.length ? 'Settled' : '—',
      label: 'Balance due',
      href: '/payments',
      alert: balanceRemaining > 0,
    },
    {
      value: bookings.filter((b) => b.status === 'CONFIRMED').length || '—',
      label: 'Sessions upcoming',
      href: '/bookings',
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl shadow-xl" style={{ background: 'linear-gradient(135deg, #0F4C81 0%, #00A896 100%)' }}>
      {/* Decorative rings */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/8" />
      <div className="pointer-events-none absolute -right-4 -top-4 h-36 w-36 rounded-full bg-white/8" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-white/5" />

      <div className="relative p-6 pb-0">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          {/* Left — avatar + greeting */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 ring-2 ring-white/30 text-xl font-extrabold text-white select-none shadow-inner">
                {initials}
              </div>
              {engagement?.status === 'ACTIVE' && (
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-400 shadow-sm" />
              )}
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-0.5">Client Portal</p>
              <h1 className="text-2xl font-extrabold text-white leading-tight">Welcome back, {firstName}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {me?.profession && (
                  <span className="text-xs font-medium text-white/60">{me.profession}</span>
                )}
                {engagement && (
                  <>
                    {me?.profession && <span className="text-white/30">·</span>}
                    <span className="text-xs font-medium text-white/60">{formatCaseRef(engagement.id)}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                      engagement.status === 'ACTIVE'
                        ? 'bg-emerald-400/20 border-emerald-400/30 text-emerald-300'
                        : 'bg-white/10 border-white/20 text-white/60'
                    }`}>
                      {engagement.status === 'ACTIVE' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                      {statusLabel(engagement.status)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right — actions */}
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-nowrap">
            <button
              onClick={() => onNavigate('/documents')}
              className="flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-all active:scale-95"
            >
              <UploadSimple className="h-4 w-4" /> Upload
            </button>
            <button
              onClick={() => onNavigate(engagement ? '/case' : '/bookings')}
              className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-primary hover:bg-white/90 transition-all active:scale-95 shadow-md"
            >
              {engagement ? 'View case' : 'Book now'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Progress bar — only if there are milestones */}
        {milestones.length > 0 && (
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-white/60">Overall case progress</span>
              <span className="text-xs font-bold text-white">{completedMilestones} of {milestones.length} stages</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full rounded-full bg-white/90 transition-all duration-1000 shadow-sm"
                style={{ width: `${caseProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stat chips strip */}
      <div className="relative mt-5 grid grid-cols-2 divide-x divide-white/10 border-t border-white/10 sm:grid-cols-4">
        {stats.map((stat, i) => (
          <button
            key={i}
            onClick={() => onNavigate(stat.href)}
            className="flex flex-col items-center gap-0.5 px-4 py-3.5 text-center hover:bg-white/8 transition-colors"
          >
            <span className={`text-xl font-extrabold ${stat.alert ? 'text-rose-300' : 'text-white'}`}>{stat.value}</span>
            <span className="text-[11px] font-medium text-white/50 leading-tight">{stat.label}</span>
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
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9px] font-bold text-emerald-700 uppercase tracking-wide">
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

  function dotColor(item: Activity) {
    if (item.type === 'milestone') return 'bg-primary';
    if (item.type === 'order') return 'bg-blue-400';
    if (item.status === 'VERIFIED') return 'bg-emerald-500';
    if (item.status === 'REJECTED') return 'bg-rose-500';
    return 'bg-amber-400';
  }

  function iconEl(item: Activity) {
    if (item.type === 'milestone') return <CheckCircle weight="fill" className="h-3.5 w-3.5 text-primary" />;
    if (item.type === 'order') return <CreditCard className="h-3.5 w-3.5 text-blue-400" />;
    if (item.status === 'VERIFIED') return <CheckCircle weight="fill" className="h-3.5 w-3.5 text-emerald-500" />;
    if (item.status === 'REJECTED') return <WarningCircle weight="fill" className="h-3.5 w-3.5 text-rose-500" />;
    return <Clock className="h-3.5 w-3.5 text-amber-400" />;
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
          <span className={`text-sm font-bold ${paidPct === 100 ? 'text-emerald-600' : 'text-foreground'}`}>{paidPct}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${paidPct === 100 ? 'bg-emerald-500' : 'gradient-hero'}`}
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
          <div key={item.label} className={`rounded-xl border p-3 ${item.alert ? 'border-rose-200 bg-rose-50' : 'border-border bg-muted/20'}`}>
            <p className="text-[11px] font-medium text-muted-foreground mb-1">{item.label}</p>
            <p className={`text-base font-extrabold ${item.alert ? 'text-rose-700' : 'text-foreground'}`}>{item.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{item.sub}</p>
          </div>
        ))}
      </div>

      {partialPaid.length > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2.5">
          <WarningCircle weight="fill" className="h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-xs text-amber-800 font-medium">
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

function RightRail({
  consultant, engagement, bookings, milestones, caseProgress,
  completedMilestones, pendingPayment, alerts, onMessage, onNavigate,
}: {
  consultant: any; engagement: any; bookings: any[]; milestones: any[];
  caseProgress: number; completedMilestones: number; pendingPayment: any;
  alerts: { text: string; sub: string; color: string }[];
  onMessage: () => void; onNavigate: (p: string) => void;
}) {
  const upcoming = bookings.filter((b) => b.status === 'CONFIRMED').slice(0, 3);

  return (
    <div className="flex flex-col divide-y divide-border/60 h-full">

      {/* Case Team */}
      <div className="relative overflow-hidden p-5" style={{ background: 'linear-gradient(135deg, #0F4C81 0%, #00A896 100%)' }}>
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/8" />
        <div className="pointer-events-none absolute right-4 bottom-0 h-12 w-12 rounded-full bg-white/8" />

        <p className="relative mb-3 text-[10px] font-bold uppercase tracking-widest text-white/50">Case Team</p>

        {consultant ? (
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative shrink-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 ring-2 ring-white/25 text-sm font-bold text-white">
                  {consultant.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white">{consultant.name}</p>
                <p className="text-xs text-white/50 mt-0.5">Case Consultant · Online</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onMessage}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20 transition-colors"
              >
                <ChatCircle className="h-3.5 w-3.5" /> Message
              </button>
              <button
                onClick={() => onNavigate('/bookings')}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-primary hover:bg-white/90 transition-colors shadow-sm"
              >
                <CalendarBlank className="h-3.5 w-3.5" /> Book
              </button>
            </div>
          </div>
        ) : (
          <div className="relative rounded-xl border border-white/15 bg-white/8 p-4 text-center">
            <p className="text-xs text-white/60">No consultant assigned yet.</p>
            <button onClick={() => onNavigate('/bookings')} className="mt-2 text-xs font-bold text-white hover:text-white/80 underline">
              Book a consultation →
            </button>
          </div>
        )}
      </div>

      {/* Case Details */}
      {engagement && (
        <div className="p-5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Case Details</p>
          <div className="space-y-3">
            {[
              { label: 'Reference', value: <span className="font-mono font-bold text-foreground">{formatCaseRef(engagement.id)}</span> },
              { label: 'Status', value: <Badge variant={statusVariant(engagement.status)} className="text-[10px] uppercase tracking-wider">{statusLabel(engagement.status)}</Badge> },
              { label: 'Last updated', value: <span className="font-semibold text-foreground">{timeAgo(engagement.updatedAt)}</span> },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{label}</span>
                {value}
              </div>
            ))}
            {milestones.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">Progress</span>
                  <span className="text-xs font-bold text-foreground">{caseProgress}% <span className="font-normal text-muted-foreground">({completedMilestones}/{milestones.length})</span></span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full gradient-hero transition-all duration-700" style={{ width: `${caseProgress}%` }} />
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => onNavigate('/case')}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-xs font-bold text-foreground hover:bg-muted/50 hover:border-primary/30 transition-all"
          >
            View full case <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Alerts */}
      <div className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <Bell className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Alerts</p>
          {alerts.length > 0 && (
            <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
              {alerts.length}
            </span>
          )}
        </div>
        {alerts.length === 0 ? (
          <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-100 px-3.5 py-3">
            <Shield weight="fill" className="h-4 w-4 shrink-0 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-800">No issues requiring attention</span>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div key={i} className={`rounded-xl border-l-4 pl-3 pr-3 py-2.5 ${
                a.color === 'rose'
                  ? 'border-l-rose-500 bg-rose-50 border-t border-r border-b border-rose-100'
                  : 'border-l-amber-500 bg-amber-50 border-t border-r border-b border-amber-100'
              }`}>
                <p className={`text-xs font-bold ${a.color === 'rose' ? 'text-rose-800' : 'text-amber-800'}`}>{a.text}</p>
                <p className={`mt-0.5 text-[11px] ${a.color === 'rose' ? 'text-rose-600' : 'text-amber-600'}`}>{a.sub}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Sessions */}
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Upcoming Sessions</p>
          <button onClick={() => onNavigate('/bookings')} className="text-xs font-bold text-primary hover:underline">View all</button>
        </div>
        {upcoming.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-4 text-center">
            <CalendarBlank className="mx-auto mb-2 h-7 w-7 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">No upcoming sessions</p>
            <button onClick={() => onNavigate('/bookings')} className="mt-1.5 text-xs font-bold text-primary hover:underline">
              Book a session →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((b) => (
              <div key={b.id} onClick={() => onNavigate('/bookings')}
                className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3.5 py-3 cursor-pointer hover:border-primary/30 hover:bg-muted/40 transition-all">
                <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10">
                  <span className="text-[10px] font-bold text-primary leading-none">
                    {b.slot?.startTime ? new Date(b.slot.startTime).toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : '—'}
                  </span>
                  <span className="text-base font-extrabold text-primary leading-none">
                    {b.slot?.startTime ? new Date(b.slot.startTime).getDate() : '—'}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground capitalize">{b.type?.replace(/_/g, ' ').toLowerCase()}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {b.slot?.startTime
                      ? new Date(b.slot.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-5">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quick Actions</p>
        <div className="space-y-1.5">
          <button onClick={() => onNavigate('/documents')}
            className="flex w-full items-center gap-3 rounded-xl border border-border px-3.5 py-3 text-xs font-semibold text-foreground hover:border-primary/30 hover:bg-muted/40 transition-all group">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/60 group-hover:bg-primary/10 transition-colors">
              <UploadSimple className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            Upload document
          </button>
          {pendingPayment && (
            <button onClick={() => onNavigate('/payments')}
              className="flex w-full items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-all group">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-100">
                <CreditCard className="h-3.5 w-3.5 text-rose-600" />
              </div>
              Pay ${Number(pendingPayment.total).toLocaleString()} now
            </button>
          )}
          <button onClick={() => onNavigate('/bookings')}
            className="flex w-full items-center gap-3 rounded-xl border border-border px-3.5 py-3 text-xs font-semibold text-foreground hover:border-primary/30 hover:bg-muted/40 transition-all group">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/60 group-hover:bg-primary/10 transition-colors">
              <CalendarBlank className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            Book a session
          </button>
          <button onClick={() => onNavigate('/academy')}
            className="flex w-full items-center gap-3 rounded-xl border border-border px-3.5 py-3 text-xs font-semibold text-foreground hover:border-primary/30 hover:bg-muted/40 transition-all group">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/60 group-hover:bg-primary/10 transition-colors">
              <BookOpen className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            My courses
          </button>
        </div>
      </div>
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
  const pendingPayment = orders.find((o) => o.status === 'PENDING');
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

  const alerts = [
    ...documents.filter((d) => d.status === 'REJECTED').map((d) => ({
      text: `${d.type} was rejected`, sub: 'Contact your consultant to re-upload.', color: 'rose',
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
      <div className="flex gap-6">
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
        <aside className="hidden xl:block w-80 shrink-0">
          <div className="sticky top-6 rounded-2xl border border-border bg-white shadow-md overflow-hidden">
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
