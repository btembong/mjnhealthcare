'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@mjn/ui';
import {
  ArrowRight, CheckCircle,
  CalendarBlank, CurrencyDollar, Warning, Pulse, ClockCountdown,
  ArrowUpRight, UserCircle, Envelope, Signature, FolderOpen,
  Sparkle, TrendUp, Circle, UsersFour,
} from '@phosphor-icons/react';
import {
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatDistanceToNow, isToday, isPast, format, subDays } from 'date-fns';
import { api } from '../../lib/api';
import { useAdmin } from '../../contexts/admin-context';

function statusLabel(s: string) {
  return s?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? '—';
}

function initials(name: string) {
  if (!name) return 'NA';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

function relTime(ts: string | undefined) {
  if (!ts) return '—';
  try { return formatDistanceToNow(new Date(ts), { addSuffix: true }); } catch { return '—'; }
}

function greeting(name: string) {
  const h = new Date().getHours();
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${g}, ${name.split(' ')[0]}`;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  PENDING_SIGNATURE: 'bg-amber-100 text-amber-700 border-amber-200',
  COMPLETED: 'bg-blue-100 text-blue-700 border-blue-200',
  ON_HOLD: 'bg-orange-100 text-orange-700 border-orange-200',
  TERMINATED: 'bg-rose-100 text-rose-700 border-rose-200',
};

const PIPELINE_COLS = [
  { key: 'LEAD', label: 'Leads', color: '#94a3b8', bg: 'bg-slate-100', text: 'text-slate-600' },
  { key: 'PENDING_SIGNATURE', label: 'Pending Sig', color: '#f59e0b', bg: 'bg-amber-100', text: 'text-amber-700' },
  { key: 'ACTIVE', label: 'Active', color: '#10b981', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { key: 'ON_HOLD', label: 'On Hold', color: '#f97316', bg: 'bg-orange-100', text: 'text-orange-700' },
  { key: 'COMPLETED', label: 'Completed', color: '#3b82f6', bg: 'bg-blue-100', text: 'text-blue-700' },
];

const AVATAR_COLORS = [
  'from-blue-500 to-blue-700',
  'from-emerald-500 to-emerald-700',
  'from-violet-500 to-violet-700',
  'from-amber-500 to-amber-700',
  'from-rose-500 to-rose-700',
  'from-teal-500 to-teal-700',
];

function avatarColor(name: string) {
  const code = name?.charCodeAt(0) ?? 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

const RevenueTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl border border-border bg-white px-3 py-2 shadow-md text-xs">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-primary font-bold">${Number(payload[0]?.value ?? 0).toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-20 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <Skeleton className="lg:col-span-2 h-96 rounded-2xl" />
        <Skeleton className="lg:col-span-3 h-96 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  );
}

type ActivityEvent = {
  id: string;
  type: 'lead' | 'booking' | 'engagement' | 'document' | 'order';
  person: string;
  label: string;
  ts: string;
};

function ActivityIcon({ type }: { type: ActivityEvent['type'] }) {
  const base = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full';
  switch (type) {
    case 'lead': return <div className={`${base} bg-slate-100`}><UserCircle className="h-4 w-4 text-slate-600" /></div>;
    case 'booking': return <div className={`${base} bg-teal-100`}><CalendarBlank className="h-4 w-4 text-teal-600" /></div>;
    case 'engagement': return <div className={`${base} bg-blue-100`}><Signature className="h-4 w-4 text-blue-600" /></div>;
    case 'document': return <div className={`${base} bg-amber-100`}><FolderOpen className="h-4 w-4 text-amber-600" /></div>;
    case 'order': return <div className={`${base} bg-emerald-100`}><CurrencyDollar className="h-4 w-4 text-emerald-600" /></div>;
  }
}

// ── Consultant-scoped dashboard ───────────────────────────────────────────────

const PIPELINE_STAGES = [
  { key: 'PENDING_SIGNATURE', label: 'Pending Sig', color: '#f59e0b', bg: 'bg-amber-100', text: 'text-amber-700' },
  { key: 'ACTIVE',            label: 'Active',      color: '#10b981', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { key: 'ON_HOLD',           label: 'On Hold',     color: '#f97316', bg: 'bg-orange-100', text: 'text-orange-700' },
  { key: 'COMPLETED',         label: 'Completed',   color: '#3b82f6', bg: 'bg-blue-100', text: 'text-blue-700' },
];

function ConsultantDashboard() {
  const router = useRouter();
  const { me } = useAdmin();
  const [engagements, setEngagements] = useState<any[]>([]);
  const [sessions, setSessions]       = useState<any[]>([]);
  const [pendingDocs, setPendingDocs] = useState<any[]>([]);
  const [pendingDrafts, setPendingDrafts] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [now, setNow]                 = useState(new Date());

  const myId      = me?.id;
  const staffName = me?.name ?? 'Consultant';

  // Live clock for countdown — tick every 30s
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { if (myId) loadData(); }, [myId]);

  async function loadData() {
    setLoading(true);
    try {
      const [rEngs, rSessions, rDocs, rDrafts] = await Promise.allSettled([
        api.getAllEngagements(),
        api.getSessions({ consultantId: myId }),
        api.getPendingDocuments(),
        api.getPendingDrafts(),
      ]);
      if (rEngs.status    === 'fulfilled') setEngagements(rEngs.value ?? []);
      if (rSessions.status === 'fulfilled') setSessions(rSessions.value ?? []);
      if (rDocs.status    === 'fulfilled') setPendingDocs(rDocs.value ?? []);
      if (rDrafts.status  === 'fulfilled') setPendingDrafts(rDrafts.value ?? []);
    } finally { setLoading(false); }
  }

  // ── Fix #4: filter by consultant email (consultantId stores ConsultantProfile.id, not Person.id)
  const myEmail = me?.email;
  const myCases = engagements.filter((e) => e.consultantEmail && myEmail && e.consultantEmail === myEmail);

  // ── Fix #5: scope docs + drafts to my clients only ────────────────────────
  const myPersonIds   = new Set(myCases.map((e) => e.personId ?? e.person?.id).filter(Boolean));
  const myPendingDocs = pendingDocs.filter((d) => myPersonIds.has(d.personId ?? d.person?.id));
  const myDrafts      = pendingDrafts.filter((d) => {
    const pid = d.engagement?.personId ?? d.engagement?.person?.id;
    return myPersonIds.has(pid);
  });

  // ── Derived counts ────────────────────────────────────────────────────────
  const active    = myCases.filter((e) => e.status === 'ACTIVE');
  const pendingSig = myCases.filter((e) => e.status === 'PENDING_SIGNATURE');
  const onHold    = myCases.filter((e) => e.status === 'ON_HOLD');
  const completed = myCases.filter((e) => e.status === 'COMPLETED');
  const completionRate = myCases.length > 0
    ? Math.round((completed.length / myCases.length) * 100)
    : 0;

  // ── Sessions ──────────────────────────────────────────────────────────────
  const upcomingSessions = sessions
    .filter((s) => s.status === 'CONFIRMED' && s.slot?.startAt && !isPast(new Date(s.slot.startAt)))
    .sort((a, b) => new Date(a.slot.startAt).getTime() - new Date(b.slot.startAt).getTime());
  const todaySessions = upcomingSessions.filter((s) => isToday(new Date(s.slot?.startAt)));
  const nextSession   = upcomingSessions[0] ?? null;
  const nextMins      = nextSession
    ? Math.round((new Date(nextSession.slot.startAt).getTime() - now.getTime()) / 60_000)
    : null;
  const isImminent    = nextMins !== null && nextMins >= 0 && nextMins <= 120;

  // ── Priority inbox ────────────────────────────────────────────────────────
  const urgentItems = [
    ...myPendingDocs.slice(0, 3).map((d) => ({
      id: d.id, name: d.person?.name ?? 'Unknown',
      label: `${d.type ?? 'Document'} needs verification`,
      href: '/documents',
    })),
    ...myDrafts.slice(0, 2).map((d) => ({
      id: d.id, name: d.engagement?.person?.name ?? 'Unknown',
      label: 'AI draft awaiting your review',
      href: '/drafts',
    })),
  ];
  const attentionItems = pendingSig.slice(0, 4).map((e) => ({
    id: e.id, name: e.person?.name ?? 'Unknown',
    label: 'Engagement letter not yet signed',
    href: '/caseload/' + e.id,
  }));
  const todayItems = todaySessions.slice(0, 4).map((s) => ({
    id: s.id, name: s.clientName ?? s.person?.name ?? 'Client',
    label: s.slot?.startAt ? format(new Date(s.slot.startAt), 'h:mm a') + ' · ' + (s.category ?? 'Session') : 'Session today',
    href: '/sessions',
    roomUrl: s.roomUrl,
  }));
  const urgentCount = urgentItems.length + attentionItems.length;

  // ── Activity feed (my cases only) ─────────────────────────────────────────
  const activityFeed: ActivityEvent[] = [
    ...myCases.slice(0, 6).map((e) => ({
      id: e.id, type: 'engagement' as const,
      person: e.person?.name ?? 'Unknown',
      label: `Engagement ${statusLabel(e.status).toLowerCase()}`,
      ts: e.updatedAt ?? e.createdAt,
    })),
    ...sessions.slice(0, 5).map((s) => ({
      id: s.id, type: 'booking' as const,
      person: s.clientName ?? s.person?.name ?? 'Unknown',
      label: `Session confirmed · ${s.slot?.startAt ? format(new Date(s.slot.startAt), 'MMM d, h:mm a') : ''}`,
      ts: s.createdAt,
    })),
    ...myPendingDocs.slice(0, 4).map((d) => ({
      id: d.id, type: 'document' as const,
      person: d.person?.name ?? 'Unknown',
      label: `Document uploaded · ${d.type ?? 'file'}`,
      ts: d.uploadedAt ?? d.createdAt,
    })),
  ]
    .filter((e) => e.ts)
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .slice(0, 12);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-5">

      {/* ── Zone 1: Hero ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[#00A896] p-6 shadow-lg text-white">
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute right-40 -bottom-10 h-40 w-40 rounded-full bg-white/5" />

        <div className="relative">
          {/* Greeting + urgent badge + quick actions */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-lg font-bold text-white">{greeting(staffName)}</p>
                {urgentCount > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-rose-500/90 px-2 py-0.5 text-xs font-bold text-white">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/80 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                    </span>
                    {urgentCount} urgent
                  </span>
                )}
              </div>
              <p className="text-xs text-white/60">
                {format(new Date(), 'EEEE, MMMM d, yyyy')} · {myCases.length} cases assigned to you
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => router.push('/caseload')}
                className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-primary hover:bg-white/90 transition-colors"
              >
                <UserCircle className="h-3.5 w-3.5" /> My Cases
              </button>
              <button
                onClick={() => router.push('/documents')}
                className="flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/20 transition-colors"
              >
                <FolderOpen className="h-3.5 w-3.5" /> Doc Queue {myPendingDocs.length > 0 && `(${myPendingDocs.length})`}
              </button>
              <button
                onClick={() => router.push('/sessions')}
                className="flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/20 transition-colors"
              >
                <CalendarBlank className="h-3.5 w-3.5" /> Sessions
              </button>
            </div>
          </div>

          {/* KPI tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Active Cases',      value: active.length,       sub: `${myCases.length} total`,           accent: false },
              { label: "Today's Sessions",  value: todaySessions.length, sub: `${upcomingSessions.length} upcoming`, accent: false },
              { label: 'Pending Docs',      value: myPendingDocs.length, sub: myPendingDocs.length > 0 ? 'needs review' : 'all clear', accent: myPendingDocs.length > 0 },
              { label: 'Completion Rate',   value: `${completionRate}%`, sub: `${completed.length} completed`,     accent: false },
            ].map((tile) => (
              <div
                key={tile.label}
                className={`rounded-xl px-4 py-3 backdrop-blur-sm ${
                  tile.accent
                    ? 'bg-rose-500/25 border border-rose-300/30'
                    : 'bg-white/15 border border-white/20'
                }`}
              >
                <p className="text-xs font-medium text-white/60 mb-0.5">{tile.label}</p>
                <p className={`text-2xl font-bold tabular-nums leading-tight ${tile.accent ? 'text-rose-200' : 'text-white'}`}>
                  {tile.value}
                </p>
                <p className="text-xs text-white/50 mt-0.5">{tile.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Zone 2: Next Up alert (only when imminent) ─────────────────────── */}
      {isImminent && nextSession && (
        <div className="flex items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <ClockCountdown className="h-5 w-5 text-primary" weight="fill" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground">
              Session with {nextSession.clientName ?? nextSession.person?.name ?? 'client'} in{' '}
              {nextMins === 0 ? 'under a minute' : `${nextMins} min${nextMins === 1 ? '' : 's'}`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {nextSession.slot?.startAt ? format(new Date(nextSession.slot.startAt), 'h:mm a') : ''} · {nextSession.category ?? 'Consultation'}
            </p>
          </div>
          {nextSession.roomUrl && (
            <a
              href={nextSession.roomUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-colors shrink-0"
            >
              Join Now <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </div>
      )}

      {/* ── Zone 3: Priority Inbox + Caseload ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Priority Inbox */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground text-sm">Priority Inbox</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Items requiring your attention</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">

            {urgentItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-5 py-2 bg-rose-50">
                  <Pulse className="h-3 w-3 text-rose-500" weight="fill" />
                  <span className="text-xs font-bold text-rose-600 uppercase tracking-wide">Urgent</span>
                  <span className="ml-auto text-xs font-bold text-rose-500">{urgentItems.length}</span>
                </div>
                {urgentItems.map((item) => (
                  <div key={item.id} onClick={() => router.push(item.href)}
                    className="flex items-center gap-3 px-5 py-3 border-l-4 border-l-rose-400 hover:bg-rose-50/50 cursor-pointer transition-colors group"
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(item.name)} text-white text-xs font-bold`}>
                      {initials(item.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                ))}
              </div>
            )}

            {attentionItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-5 py-2 bg-amber-50">
                  <Warning className="h-3 w-3 text-amber-500" weight="fill" />
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">Attention</span>
                  <span className="ml-auto text-xs font-bold text-amber-500">{attentionItems.length}</span>
                </div>
                {attentionItems.map((item) => (
                  <div key={item.id} onClick={() => router.push(item.href)}
                    className="flex items-center gap-3 px-5 py-3 border-l-4 border-l-amber-400 hover:bg-amber-50/50 cursor-pointer transition-colors group"
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(item.name)} text-white text-xs font-bold`}>
                      {initials(item.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                ))}
              </div>
            )}

            {todayItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-5 py-2 bg-emerald-50">
                  <ClockCountdown className="h-3 w-3 text-emerald-500" weight="fill" />
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Today</span>
                  <span className="ml-auto text-xs font-bold text-emerald-500">{todayItems.length}</span>
                </div>
                {todayItems.map((item) => (
                  <div key={item.id}
                    className="flex items-center gap-3 px-5 py-3 border-l-4 border-l-emerald-400 hover:bg-emerald-50/50 cursor-pointer transition-colors group"
                    onClick={() => router.push(item.href)}
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(item.name)} text-white text-xs font-bold`}>
                      {initials(item.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                    </div>
                    {item.roomUrl && (
                      <a href={item.roomUrl} target="_blank" rel="noopener noreferrer"
                        className="shrink-0 rounded-lg bg-primary px-2 py-0.5 text-xs font-bold text-white hover:bg-primary/90"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Join
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {urgentItems.length === 0 && attentionItems.length === 0 && todayItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle className="h-6 w-6 text-emerald-500" weight="fill" />
                </div>
                <p className="text-sm font-semibold text-foreground">Inbox zero</p>
                <p className="mt-1 text-xs text-muted-foreground">No items require attention right now.</p>
              </div>
            )}
          </div>
        </div>

        {/* My Caseload */}
        <div className="lg:col-span-3 rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h3 className="font-semibold text-foreground text-sm">My Caseload</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{myCases.length} cases assigned to you</p>
            </div>
            <button onClick={() => router.push('/caseload')} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-border">
            {myCases.slice(0, 7).map((e) => (
              <div
                key={e.id}
                onClick={() => router.push('/caseload/' + e.id)}
                className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 cursor-pointer transition-colors group"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(e.person?.name ?? '')} text-white text-xs font-bold`}>
                  {initials(e.person?.name ?? '?')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{e.person?.name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground truncate">{e.person?.profession ?? e.person?.email ?? '—'}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${STATUS_STYLES[e.status] ?? 'bg-muted text-muted-foreground border-border'}`}>
                  {statusLabel(e.status)}
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">{relTime(e.createdAt)}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            ))}
            {myCases.length === 0 && (
              <div className="py-10 text-center">
                <p className="text-sm text-muted-foreground">No cases assigned yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Zone 4: Mini-pipeline + Performance + AI Drafts ───────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Mini pipeline */}
        <div className="rounded-2xl border border-border bg-white shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">My Pipeline</p>
              <p className="text-2xl font-bold text-foreground tabular-nums mt-0.5">{myCases.length}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <TrendUp className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="space-y-3">
            {PIPELINE_STAGES.map((stage) => {
              const count = myCases.filter((e) => e.status === stage.key).length;
              const pct   = myCases.length > 0 ? Math.round((count / myCases.length) * 100) : 0;
              return (
                <div key={stage.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{stage.label}</span>
                    <span className="text-xs font-semibold text-foreground tabular-nums">{count}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: stage.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => router.push('/caseload')} className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            Full caseload <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Performance */}
        <div className="rounded-2xl border border-border bg-white shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Performance</p>
              <p className="text-2xl font-bold text-foreground tabular-nums mt-0.5">{completionRate}%</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
              <Circle className="h-5 w-5 text-emerald-600" weight="fill" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Completion rate across all assigned cases</p>
          {/* Donut-style progress ring */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke="#10b981" strokeWidth="3"
                  strokeDasharray={`${completionRate} ${100 - completionRate}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-sm font-bold text-foreground">{completionRate}%</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Completed</span>
                <span className="ml-auto font-semibold text-foreground">{completed.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-400" />
                <span className="text-muted-foreground">Active</span>
                <span className="ml-auto font-semibold text-foreground">{active.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-orange-400" />
                <span className="text-muted-foreground">On Hold</span>
                <span className="ml-auto font-semibold text-foreground">{onHold.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-muted-foreground">Pending Sig</span>
                <span className="ml-auto font-semibold text-foreground">{pendingSig.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Drafts */}
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">AI Drafts</p>
              <p className="text-2xl font-bold text-foreground tabular-nums mt-0.5">{myDrafts.length}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
              <Sparkle className="h-5 w-5 text-violet-500" />
            </div>
          </div>
          <div className="divide-y divide-border">
            {myDrafts.slice(0, 4).map((d) => (
              <div key={d.id} onClick={() => router.push('/drafts')}
                className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 cursor-pointer transition-colors group"
              >
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(d.engagement?.person?.name ?? '')} text-white text-xs font-bold`}>
                  {initials(d.engagement?.person?.name ?? '?')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">{d.engagement?.person?.name ?? 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground truncate">Awaiting your review</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            ))}
            {myDrafts.length === 0 && (
              <div className="py-8 text-center px-5">
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle className="h-4 w-4 text-emerald-500" weight="fill" />
                </div>
                <p className="text-sm text-muted-foreground">No drafts pending.</p>
              </div>
            )}
          </div>
          {myDrafts.length > 0 && (
            <div className="px-5 py-3 border-t border-border">
              <button onClick={() => router.push('/drafts')} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                Review all drafts <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Zone 5: Activity Feed ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/60">
              <Sparkle className="h-4 w-4 text-foreground/50" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
              <p className="text-xs text-muted-foreground">Latest events on your cases</p>
            </div>
          </div>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            {activityFeed.length} events
          </span>
        </div>
        {activityFeed.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Envelope className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No recent activity on your cases.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activityFeed.map((ev) => (
              <div key={`${ev.type}-${ev.id}`} className="flex items-start gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                <ActivityIcon type={ev.type} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{ev.person}</p>
                  <p className="text-xs text-muted-foreground">{ev.label}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">{relTime(ev.ts)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

// ── Compliance dashboard ───────────────────────────────────────────────────────

function ComplianceDashboard() {
  const router = useRouter();
  const { me } = useAdmin();
  const [pendingDocs, setPendingDocs] = useState<any[]>([]);
  const [engagements, setEngagements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const staffName = me?.name ?? 'Staff';

  useEffect(() => {
    Promise.allSettled([api.getPendingDocuments(), api.getAllEngagements()])
      .then(([rDocs, rEngs]) => {
        if (rDocs.status === 'fulfilled') setPendingDocs(rDocs.value ?? []);
        if (rEngs.status === 'fulfilled') setEngagements(rEngs.value ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const onHold = engagements.filter((e) => e.status === 'ON_HOLD');

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-white px-6 py-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div>
            <p className="text-base font-bold text-foreground">{greeting(staffName)}</p>
            <p className="text-xs text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <div className="h-10 w-px bg-border hidden sm:block" />
          <div>
            <p className="text-xs text-muted-foreground">Pending docs</p>
            <p className={`text-xl font-bold tabular-nums ${pendingDocs.length > 0 ? 'text-amber-600' : 'text-foreground'}`}>{pendingDocs.length}</p>
          </div>
          <div className="h-10 w-px bg-border hidden sm:block" />
          <div>
            <p className="text-xs text-muted-foreground">On hold cases</p>
            <p className={`text-xl font-bold tabular-nums ${onHold.length > 0 ? 'text-rose-600' : 'text-foreground'}`}>{onHold.length}</p>
          </div>
          <div className="h-10 w-px bg-border hidden md:block" />
          <div>
            <p className="text-xs text-muted-foreground">Total engagements</p>
            <p className="text-xl font-bold text-foreground tabular-nums">{engagements.length}</p>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => router.push('/audit')}
              className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
            >
              Audit Log <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pending document queue */}
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h3 className="font-semibold text-foreground text-sm">Document Review Queue</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{pendingDocs.length} pending verification</p>
            </div>
            <button onClick={() => router.push('/documents')} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              Open queue <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-border">
            {pendingDocs.slice(0, 8).map((d) => (
              <div
                key={d.id}
                onClick={() => router.push('/documents')}
                className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 cursor-pointer transition-colors"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <Warning className="h-4 w-4 text-amber-600" weight="fill" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{d.person?.name ?? 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{d.type ?? 'Document'} · {relTime(d.uploadedAt ?? d.createdAt)}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </div>
            ))}
            {pendingDocs.length === 0 && (
              <div className="py-12 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle className="h-5 w-5 text-emerald-500" weight="fill" />
                </div>
                <p className="text-sm font-semibold text-foreground">Queue clear</p>
                <p className="text-xs text-muted-foreground mt-1">No documents awaiting review.</p>
              </div>
            )}
          </div>
        </div>

        {/* On-hold cases */}
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h3 className="font-semibold text-foreground text-sm">On-Hold Cases</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Engagements paused / overdue</p>
            </div>
            <button onClick={() => router.push('/caseload')} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              Caseload <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-border">
            {onHold.slice(0, 8).map((e) => (
              <div
                key={e.id}
                onClick={() => router.push('/caseload/' + e.id)}
                className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 cursor-pointer transition-colors group"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(e.person?.name ?? '')} text-white text-xs font-bold`}>
                  {initials(e.person?.name ?? '?')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{e.person?.name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">{e.person?.profession ?? e.person?.email ?? '—'}</p>
                </div>
                <span className="rounded-full bg-orange-100 text-orange-700 border border-orange-200 px-2.5 py-0.5 text-xs font-semibold">On Hold</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            ))}
            {onHold.length === 0 && (
              <div className="py-12 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle className="h-5 w-5 text-emerald-500" weight="fill" />
                </div>
                <p className="text-sm font-semibold text-foreground">All clear</p>
                <p className="text-xs text-muted-foreground mt-1">No on-hold engagements.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Admin dashboard ────────────────────────────────────────────────────────────

function AdminDashboard() {
  const router = useRouter();
  const { me } = useAdmin();
  const [persons, setPersons] = useState<any[]>([]);
  const [engagements, setEngagements] = useState<any[]>([]);
  const [pendingDocs, setPendingDocs] = useState<any[]>([]);
  const [pendingDrafts, setPendingDrafts] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [officerNotes, setOfficerNotes] = useState<any[]>([]);
  const [paymentStats, setPaymentStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [rPersons, rEngs, rDocs, rDrafts, rLeads, rOrders, rBookings, rOfficerNotes, rStats] = await Promise.allSettled([
        api.getPersons(),
        api.getAllEngagements(),
        api.getPendingDocuments(),
        api.getPendingDrafts(),
        api.getLeads(),
        api.getAllOrders(),
        api.getAllBookings(),
        api.getRecentOfficerNotes(15),
        api.getPaymentStats(),
      ]);
      if (rPersons.status === 'fulfilled') setPersons(rPersons.value ?? []);
      if (rEngs.status === 'fulfilled') setEngagements(rEngs.value ?? []);
      if (rDocs.status === 'fulfilled') setPendingDocs(rDocs.value ?? []);
      if (rDrafts.status === 'fulfilled') setPendingDrafts(rDrafts.value ?? []);
      if (rLeads.status === 'fulfilled') setLeads(rLeads.value ?? []);
      if (rOrders.status === 'fulfilled') setOrders(rOrders.value ?? []);
      if (rBookings.status === 'fulfilled') setBookings(rBookings.value ?? []);
      if (rOfficerNotes.status === 'fulfilled') setOfficerNotes(rOfficerNotes.value ?? []);
      if (rStats.status === 'fulfilled') setPaymentStats(rStats.value ?? null);
    } finally {
      setLoading(false);
    }
  }

  // ── Derived metrics ─────────────────────────────────────────────────────────
  const staffName = me?.name ?? 'Admin';

  const activeEngagements = engagements.filter((e) => e.status === 'ACTIVE').length;
  const pendingSigEngagements = engagements.filter((e) => e.status === 'PENDING_SIGNATURE');
  const onHoldEngagements = engagements.filter((e) => e.status === 'ON_HOLD').length;

  const todayBookings = bookings.filter((b) => {
    try { return isToday(new Date(b.slot?.date ?? b.createdAt)); } catch { return false; }
  });

  const revenueMtd = orders
    .filter((o) => o.status === 'PAID' && o.createdAt && isThisMonth(o.createdAt))
    .reduce((sum, o) => sum + Number(o.total ?? 0), 0);

  const urgentCount = pendingDocs.length + pendingDrafts.length;

  // Revenue 30-day chart
  const revenueChart: { date: string; revenue: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const key = format(d, 'MMM d');
    const dayRevenue = orders
      .filter((o) => o.status === 'PAID' && o.createdAt && isSameDay(new Date(o.createdAt), d))
      .reduce((sum, o) => sum + Number(o.total ?? 0), 0);
    revenueChart.push({ date: key, revenue: dayRevenue });
  }

  // Pipeline counts
  const pipelineCounts: Record<string, any[]> = { LEAD: leads, PENDING_SIGNATURE: [], ACTIVE: [], ON_HOLD: [], COMPLETED: [] };
  engagements.forEach((e) => {
    if (pipelineCounts[e.status]) pipelineCounts[e.status].push(e);
  });
  const pipelineTotal = Object.values(pipelineCounts).reduce((s, arr) => s + arr.length, 0) || 1;

  // Lead funnel
  const totalLeads = leads.length;
  const contacted = leads.filter((l) => l.status !== 'NEW').length;
  const qualified = leads.filter((l) => ['QUALIFIED', 'CONVERTED'].includes(l.status)).length;
  const converted = leads.filter((l) => l.status === 'CONVERTED').length;

  // Priority inbox
  const urgentItems = [
    ...pendingDocs.slice(0, 3).map((d) => ({
      id: d.id, type: 'doc' as const,
      name: d.person?.name ?? 'Unknown',
      label: `Document: ${d.type ?? 'File'} needs verification`,
      href: '/documents',
    })),
    ...pendingDrafts.slice(0, 2).map((d) => ({
      id: d.id, type: 'draft' as const,
      name: d.engagement?.person?.name ?? 'Unknown',
      label: 'AI draft awaiting review',
      href: '/drafts',
    })),
  ];

  const attentionItems = pendingSigEngagements.slice(0, 4).map((e) => ({
    id: e.id,
    name: e.person?.name ?? 'Unknown',
    label: 'Engagement letter not yet signed',
    href: '/caseload',
  }));

  const todayItems = todayBookings.slice(0, 4).map((b) => ({
    id: b.id,
    name: b.person?.name ?? 'Unknown',
    label: `${b.type ?? 'Booking'} · ${b.slot?.startTime ? format(new Date(b.slot.startTime), 'h:mm a') : 'All day'}`,
    href: '/bookings',
  }));

  // Activity feed (synthesized)
  const activityEvents: ActivityEvent[] = [
    ...leads.slice(0, 5).map((l) => ({
      id: l.id, type: 'lead' as const,
      person: l.name ?? 'Unknown lead',
      label: `New lead captured · ${l.source ?? 'web'}`,
      ts: l.createdAt,
    })),
    ...bookings.slice(0, 5).map((b) => ({
      id: b.id, type: 'booking' as const,
      person: b.person?.name ?? 'Unknown',
      label: `Booking confirmed · ${b.type ?? 'session'}`,
      ts: b.createdAt,
    })),
    ...engagements.slice(0, 4).map((e) => ({
      id: e.id, type: 'engagement' as const,
      person: e.person?.name ?? 'Unknown',
      label: `Engagement ${statusLabel(e.status).toLowerCase()}`,
      ts: e.createdAt,
    })),
    ...pendingDocs.slice(0, 3).map((d) => ({
      id: d.id, type: 'document' as const,
      person: d.person?.name ?? 'Unknown',
      label: `Document uploaded · ${d.type ?? 'file'}`,
      ts: d.uploadedAt ?? d.createdAt,
    })),
    ...orders.slice(0, 3).map((o) => ({
      id: o.id, type: 'order' as const,
      person: (o.person ?? o.engagement?.person)?.name ?? 'Unknown',
      label: `Order ${statusLabel(o.status).toLowerCase()} · $${Number(o.total ?? 0).toLocaleString()}`,
      ts: o.createdAt,
    })),
  ]
    .filter((e) => e.ts)
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .slice(0, 15);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-5">

          {/* ── Zone 1: Gradient Hero ─────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[#00A896] p-6 shadow-lg text-white">
            {/* Decorative rings */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute right-40 -bottom-10 h-40 w-40 rounded-full bg-white/5" />

            <div className="relative">
              {/* Top row: greeting + urgent indicator */}
              <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-lg font-bold text-white">{greeting(staffName)}</p>
                    {urgentCount > 0 && (
                      <span className="flex items-center gap-1 rounded-full bg-rose-500/90 px-2 py-0.5 text-xs font-bold text-white">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/80 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                        </span>
                        {urgentCount} urgent
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/60">{format(new Date(), 'EEEE, MMMM d, yyyy')} · {persons.length} clients total</p>
                </div>

                {/* Quick actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => router.push('/caseload/new')}
                    className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-primary hover:bg-white/90 transition-colors"
                  >
                    <UserCircle className="h-3.5 w-3.5" /> New Case
                  </button>
                  <button
                    onClick={() => router.push('/documents')}
                    className="flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/20 transition-colors"
                  >
                    <FolderOpen className="h-3.5 w-3.5" /> Doc Queue
                  </button>
                  <button
                    onClick={() => router.push('/caseload')}
                    className="flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/20 transition-colors"
                  >
                    <TrendUp className="h-3.5 w-3.5" /> Pipeline
                  </button>
                </div>
              </div>

              {/* KPI tiles */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    label: 'Active Cases',
                    value: activeEngagements,
                    sub: `${engagements.length} total`,
                    accent: false,
                  },
                  {
                    label: 'Revenue MTD',
                    value: `$${(paymentStats?.revenueMtd ?? revenueMtd).toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 })}`,
                    sub: `${orders.filter((o) => o.status === 'PAID').length} orders + consultations`,
                    accent: false,
                  },
                  {
                    label: "Today's Sessions",
                    value: todayBookings.length,
                    sub: 'bookings',
                    accent: false,
                  },
                  {
                    label: 'On Hold',
                    value: onHoldEngagements,
                    sub: onHoldEngagements > 0 ? 'needs attention' : 'all clear',
                    accent: onHoldEngagements > 0,
                  },
                ].map((tile) => (
                  <div
                    key={tile.label}
                    className={`rounded-xl px-4 py-3 backdrop-blur-sm ${
                      tile.accent
                        ? 'bg-rose-500/25 border border-rose-300/30'
                        : 'bg-white/15 border border-white/20'
                    }`}
                  >
                    <p className="text-xs font-medium text-white/60 mb-0.5">{tile.label}</p>
                    <p className={`text-2xl font-bold tabular-nums leading-tight ${tile.accent ? 'text-rose-200' : 'text-white'}`}>
                      {tile.value}
                    </p>
                    <p className="text-xs text-white/50 mt-0.5">{tile.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Zone 2: Priority Inbox + Pipeline Kanban ─────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

            {/* Priority Inbox */}
            <div className="lg:col-span-2 rounded-2xl border border-border bg-white shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold text-foreground text-sm">Priority Inbox</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Items that need your attention now</p>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-border">
                {/* Urgent tier */}
                {urgentItems.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-5 py-2 bg-rose-50">
                      <Pulse className="h-3 w-3 text-rose-500" weight="fill" />
                      <span className="text-xs font-bold text-rose-600 uppercase tracking-wide">Urgent</span>
                      <span className="ml-auto text-xs font-bold text-rose-500">{urgentItems.length}</span>
                    </div>
                    {urgentItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => router.push(item.href)}
                        className="flex items-center gap-3 px-5 py-3 border-l-4 border-l-rose-400 hover:bg-rose-50/50 cursor-pointer transition-colors group"
                      >
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(item.name)} text-white text-xs font-bold`}>
                          {initials(item.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Attention tier */}
                {attentionItems.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-5 py-2 bg-amber-50">
                      <Warning className="h-3 w-3 text-amber-500" weight="fill" />
                      <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">Attention</span>
                      <span className="ml-auto text-xs font-bold text-amber-500">{attentionItems.length}</span>
                    </div>
                    {attentionItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => router.push(item.href)}
                        className="flex items-center gap-3 px-5 py-3 border-l-4 border-l-amber-400 hover:bg-amber-50/50 cursor-pointer transition-colors group"
                      >
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(item.name)} text-white text-xs font-bold`}>
                          {initials(item.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Today tier */}
                {todayItems.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-5 py-2 bg-emerald-50">
                      <ClockCountdown className="h-3 w-3 text-emerald-500" weight="fill" />
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Today</span>
                      <span className="ml-auto text-xs font-bold text-emerald-500">{todayItems.length}</span>
                    </div>
                    {todayItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => router.push(item.href)}
                        className="flex items-center gap-3 px-5 py-3 border-l-4 border-l-emerald-400 hover:bg-emerald-50/50 cursor-pointer transition-colors group"
                      >
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(item.name)} text-white text-xs font-bold`}>
                          {initials(item.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    ))}
                  </div>
                )}

                {urgentItems.length === 0 && attentionItems.length === 0 && todayItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                      <CheckCircle className="h-6 w-6 text-emerald-500" weight="fill" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Inbox zero</p>
                    <p className="mt-1 text-xs text-muted-foreground">No items require attention right now.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pipeline Kanban */}
            <div className="lg:col-span-3 rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Client Pipeline</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{pipelineTotal} total across all stages</p>
                </div>
                <button onClick={() => router.push('/caseload')} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  Full view <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>

              <div className="grid grid-cols-5 divide-x divide-border h-[calc(100%-65px)]">
                {PIPELINE_COLS.map((col) => {
                  const items = pipelineCounts[col.key] ?? [];
                  const pct = Math.round((items.length / pipelineTotal) * 100);
                  return (
                    <div key={col.key} className="flex flex-col p-3 min-h-0">
                      {/* Column header */}
                      <div className={`rounded-lg px-2 py-1 ${col.bg} mb-3`}>
                        <p className={`text-xs font-bold ${col.text} truncate`}>{col.label}</p>
                        <p className={`text-xl font-bold ${col.text} tabular-nums leading-tight`}>{items.length}</p>
                      </div>

                      {/* Progress bar */}
                      <div className="h-1 w-full rounded-full bg-muted mb-3">
                        <div
                          className="h-1 rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: col.color }}
                        />
                      </div>

                      {/* Person chips */}
                      <div className="space-y-1.5 overflow-hidden">
                        {items.slice(0, 4).map((item: any) => {
                          const name = item.person?.name ?? item.name ?? '—';
                          return (
                            <div
                              key={item.id}
                              title={name}
                              className="flex items-center gap-1.5 rounded-lg bg-muted/40 px-1.5 py-1 hover:bg-muted/70 cursor-pointer transition-colors"
                              onClick={() => router.push(col.key === 'LEAD' ? '/leads' : '/caseload')}
                            >
                              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(name)} text-white text-[9px] font-bold`}>
                                {initials(name)}
                              </div>
                              <span className="text-xs text-foreground truncate min-w-0">{name.split(' ')[0]}</span>
                            </div>
                          );
                        })}
                        {items.length > 4 && (
                          <p className="text-xs text-muted-foreground px-1.5">+{items.length - 4} more</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Zone 3: Analytics Row ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Revenue 30-day area chart */}
            <div className="rounded-2xl border border-border bg-white shadow-sm p-5">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Revenue · 30 days</p>
                  <p className="text-2xl font-bold text-foreground tabular-nums mt-0.5">
                    ${revenueChart.reduce((s, d) => s + d.revenue, 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <TrendUp className="h-5 w-5 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-4">{orders.filter((o) => o.status === 'PAID').length} paid orders total</p>
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={revenueChart} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F4C81" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0F4C81" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <Tooltip content={<RevenueTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0F4C81"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Lead conversion funnel */}
            <div className="rounded-2xl border border-border bg-white shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lead Funnel</p>
                  <p className="text-2xl font-bold text-foreground tabular-nums mt-0.5">{totalLeads}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                  <UsersFour className="h-5 w-5 text-slate-600" />
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Total leads', count: totalLeads, max: totalLeads, color: 'bg-slate-300' },
                  { label: 'Contacted', count: contacted, max: totalLeads, color: 'bg-blue-400' },
                  { label: 'Qualified', count: qualified, max: totalLeads, color: 'bg-violet-400' },
                  { label: 'Converted', count: converted, max: totalLeads, color: 'bg-emerald-500' },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{row.label}</span>
                      <span className="text-xs font-semibold text-foreground tabular-nums">
                        {row.count}
                        {row.max > 0 && row.label !== 'Total leads' && (
                          <span className="text-muted-foreground font-normal ml-1">
                            ({Math.round((row.count / row.max) * 100)}%)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div
                        className={`h-1.5 rounded-full transition-all ${row.color}`}
                        style={{ width: row.max > 0 ? `${Math.round((row.count / row.max) * 100)}%` : '0%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => router.push('/leads')} className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                Manage leads <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* Today's agenda */}
            <div className="rounded-2xl border border-border bg-white shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Today's Agenda</p>
                  <p className="text-2xl font-bold text-foreground tabular-nums mt-0.5">{todayBookings.length}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
                  <CalendarBlank className="h-5 w-5 text-teal-600" />
                </div>
              </div>

              {todayBookings.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <p className="text-sm text-muted-foreground">No bookings today</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {todayBookings.slice(0, 5).map((b: any) => (
                    <div
                      key={b.id}
                      onClick={() => router.push('/bookings')}
                      className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2 hover:bg-muted/40 cursor-pointer transition-colors"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100">
                        <CalendarBlank className="h-3.5 w-3.5 text-teal-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground truncate">{b.person?.name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">
                          {b.type ?? 'Session'}
                          {b.slot?.startTime ? ` · ${format(new Date(b.slot.startTime), 'h:mm a')}` : ''}
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold shrink-0 ${
                        b.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                        b.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => router.push('/bookings')} className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                All bookings <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* ── Zone 4: Activity Feed ────────────────────────────────────────── */}
          <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/60">
                  <Sparkle className="h-4 w-4 text-foreground/50" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
                  <p className="text-xs text-muted-foreground">Latest events across all modules</p>
                </div>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                {activityEvents.length} events
              </span>
            </div>

            {activityEvents.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <Envelope className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No recent activity.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {activityEvents.map((ev) => (
                  <div key={`${ev.type}-${ev.id}`} className="flex items-start gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                    <ActivityIcon type={ev.type} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{ev.person}</p>
                      <p className="text-xs text-muted-foreground">{ev.label}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">{relTime(ev.ts)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        {/* Recent Officer Activity */}
        {officerNotes.length > 0 && (
          <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h3 className="font-semibold text-foreground text-sm">Recent Officer Activity</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Latest updates posted by processing officers</p>
              </div>
              <button onClick={() => router.push('/officers')} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                Officers <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
            <div className="divide-y divide-border">
              {officerNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => router.push('/officer/cases/' + note.engagementId)}
                  className="flex items-start gap-3 px-5 py-3 hover:bg-muted/20 cursor-pointer transition-colors group"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 text-xs font-bold">
                    {(note.author?.name ?? 'O').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground">{note.engagement?.person?.name ?? 'Unknown client'}</p>
                      <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (note.isInternal ? 'bg-muted text-muted-foreground' : note.requiresApproval && !note.approvedAt ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700')}>
                        {note.isInternal ? 'Internal' : note.requiresApproval && !note.approvedAt ? 'Awaiting approval' : 'Sent to client'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{note.content}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">by {note.author?.name ?? 'Officer'}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">{relTime(note.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        </div>
  );
}

// ── Helpers used in derived metrics ─────────────────────────────────────────

function isThisMonth(ts: string) {
  try {
    const d = new Date(ts);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  } catch { return false; }
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// ── Role-aware default export ─────────────────────────────────────────────────

export default function DashboardPage() {
  const { me } = useAdmin();
  const role = (me?.role as string)?.toUpperCase() ?? 'ADMIN';
  if (role === 'CONSULTANT') return <ConsultantDashboard />;
  if (role === 'COMPLIANCE') return <ComplianceDashboard />;
  return <AdminDashboard />;
}
