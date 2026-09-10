'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@mjn/ui';
import {
  ArrowRight, ArrowUpRight, CalendarBlank, CalendarCheck,
  CheckCircle, ChartBar, ChartLineUp, CircleNotch,
  CurrencyDollar, Envelope, FolderOpen, GearSix,
  MagnifyingGlass, Plus, Pulse, Sparkle, Signature,
  TrendUp, UserCircle, UserPlus, Users, UsersFour,
  Warning, Briefcase, FileText, Clock, Funnel,
} from '@mjn/ui';
import {
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatDistanceToNow, isToday, isPast, format, subDays } from 'date-fns';
import { api } from '../../lib/api';
import { useAdmin } from '../../contexts/admin-context';

// ── Helpers ───────────────────────────────────────────────────────────────────

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

const STATUS_DOT: Record<string, string> = {
  ACTIVE:             'bg-emerald-500',
  PENDING_SIGNATURE:  'bg-amber-500',
  COMPLETED:          'bg-blue-500',
  ON_HOLD:            'bg-orange-500',
  TERMINATED:         'bg-rose-500',
};

const STATUS_PILL: Record<string, string> = {
  ACTIVE:             'bg-emerald-50 text-emerald-700 ring-emerald-200',
  PENDING_SIGNATURE:  'bg-amber-50 text-amber-700 ring-amber-200',
  COMPLETED:          'bg-blue-50 text-blue-700 ring-blue-200',
  ON_HOLD:            'bg-orange-50 text-orange-700 ring-orange-200',
  TERMINATED:         'bg-rose-50 text-rose-700 ring-rose-200',
};

const PIPELINE_COLS = [
  { key: 'LEAD',               label: 'Leads',       color: '#94a3b8', bg: 'bg-slate-100', text: 'text-slate-600'  },
  { key: 'PENDING_SIGNATURE',  label: 'Pending Sig', color: '#f59e0b', bg: 'bg-amber-100', text: 'text-amber-700'  },
  { key: 'ACTIVE',             label: 'Active',      color: '#10b981', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { key: 'ON_HOLD',            label: 'On Hold',     color: '#f97316', bg: 'bg-orange-100', text: 'text-orange-700' },
  { key: 'COMPLETED',          label: 'Completed',   color: '#3b82f6', bg: 'bg-blue-100', text: 'text-blue-700'   },
];

const PIPELINE_STAGES = [
  { key: 'PENDING_SIGNATURE', label: 'Pending Sig', color: '#f59e0b' },
  { key: 'ACTIVE',            label: 'Active',      color: '#10b981' },
  { key: 'ON_HOLD',           label: 'On Hold',     color: '#f97316' },
  { key: 'COMPLETED',         label: 'Completed',   color: '#3b82f6' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

const RevenueTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold text-slate-600">{label}</p>
        <p className="text-primary font-bold mt-0.5">${Number(payload[0]?.value ?? 0).toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

type ActivityType = 'lead' | 'booking' | 'engagement' | 'document' | 'order';

const ACTIVITY_CONFIG: Record<ActivityType, { bg: string; icon: any; color: string; border: string }> = {
  lead:       { bg: 'bg-slate-100',   icon: UserPlus,     color: 'text-slate-600',   border: 'border-l-slate-400'   },
  booking:    { bg: 'bg-teal-100',    icon: CalendarBlank,color: 'text-teal-600',    border: 'border-l-teal-400'    },
  engagement: { bg: 'bg-blue-100',    icon: Signature,    color: 'text-blue-600',    border: 'border-l-blue-400'    },
  document:   { bg: 'bg-amber-100',   icon: FileText,     color: 'text-amber-600',   border: 'border-l-amber-400'   },
  order:      { bg: 'bg-emerald-100', icon: CurrencyDollar, color: 'text-emerald-600', border: 'border-l-emerald-400' },
};

function ActivityRow({ type, person, label, ts }: { type: ActivityType; person: string; label: string; ts: string }) {
  const cfg = ACTIVITY_CONFIG[type];
  const Icon = cfg.icon;
  return (
    <div className={`flex items-start gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors border-l-[3px] ${cfg.border}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
        <Icon className={`h-4 w-4 ${cfg.color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800">{person}</p>
        <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      </div>
      <span className="shrink-0 text-xs text-slate-400 whitespace-nowrap pt-0.5">{relTime(ts)}</span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-9 w-80 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Skeleton className="lg:col-span-3 h-72 rounded-2xl" />
        <Skeleton className="lg:col-span-2 h-72 rounded-2xl" />
      </div>
      <Skeleton className="h-52 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

// ── Quick action button ───────────────────────────────────────────────────────

function QA({
  icon: Icon, label, onClick, badge, primary, color,
}: {
  icon: any; label: string; onClick: () => void;
  badge?: number; primary?: boolean; color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all shadow-sm ${
        primary
          ? 'bg-primary text-white hover:bg-primary/90'
          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
      }`}
    >
      <Icon className={`h-3.5 w-3.5 ${primary ? 'text-white' : (color ?? 'text-slate-500')}`} />
      {label}
      {badge != null && badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white leading-none">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, iconBg, iconColor, alert,
}: {
  label: string; value: string | number; sub: string;
  icon: any; iconBg: string; iconColor: string; alert?: boolean;
}) {
  return (
    <div className={`rounded-2xl bg-white border shadow-sm p-5 flex items-start gap-4 ${alert ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100'}`}>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
        <p className={`text-2xl font-bold tabular-nums mt-0.5 ${alert ? 'text-rose-600' : 'text-slate-900'}`}>{value}</p>
        <p className="text-xs text-slate-400 mt-0.5 truncate">{sub}</p>
      </div>
    </div>
  );
}

// ── Priority inbox row ────────────────────────────────────────────────────────

function InboxRow({
  name, label, href, accent, router,
}: { name: string; label: string; href: string; accent: string; router: any }) {
  const borders: Record<string, string> = {
    rose:    'border-l-rose-400 hover:bg-rose-50/40',
    amber:   'border-l-amber-400 hover:bg-amber-50/40',
    emerald: 'border-l-emerald-400 hover:bg-emerald-50/40',
  };
  return (
    <div
      onClick={() => router.push(href)}
      className={`flex items-center gap-3 px-5 py-3 border-l-[3px] ${borders[accent] ?? ''} cursor-pointer transition-colors group`}
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(name)} text-white text-xs font-bold`}>
        {initials(name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-900 truncate">{name}</p>
        <p className="text-xs text-slate-400 truncate">{label}</p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{children}</p>;
}

// ── Consultant Dashboard ──────────────────────────────────────────────────────

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
  const myEmail   = me?.email;
  const staffName = me?.name ?? 'Consultant';

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

  const myCases = engagements.filter((e) => myEmail && e.consultantEmail === myEmail);
  const myPersonIds   = new Set(myCases.map((e) => e.personId ?? e.person?.id).filter(Boolean));
  const myPendingDocs = pendingDocs.filter((d) => myPersonIds.has(d.personId ?? d.person?.id));
  const myDrafts      = pendingDrafts.filter((d) => myPersonIds.has(d.engagement?.personId ?? d.engagement?.person?.id));

  const active     = myCases.filter((e) => e.status === 'ACTIVE');
  const pendingSig = myCases.filter((e) => e.status === 'PENDING_SIGNATURE');
  const onHold     = myCases.filter((e) => e.status === 'ON_HOLD');
  const completed  = myCases.filter((e) => e.status === 'COMPLETED');
  const completionRate = myCases.length > 0 ? Math.round((completed.length / myCases.length) * 100) : 0;

  const upcomingSessions = sessions
    .filter((s) => s.status === 'CONFIRMED' && s.slot?.startAt && !isPast(new Date(s.slot.startAt)))
    .sort((a, b) => new Date(a.slot.startAt).getTime() - new Date(b.slot.startAt).getTime());
  const todaySessions = upcomingSessions.filter((s) => isToday(new Date(s.slot?.startAt)));
  const nextSession   = upcomingSessions[0] ?? null;
  const nextMins      = nextSession ? Math.round((new Date(nextSession.slot.startAt).getTime() - now.getTime()) / 60_000) : null;
  const isImminent    = nextMins !== null && nextMins >= 0 && nextMins <= 120;

  const urgentItems   = [
    ...myPendingDocs.slice(0, 3).map((d) => ({ id: d.id, name: d.person?.name ?? 'Unknown', label: `${d.type ?? 'Document'} needs verification`, href: '/documents', accent: 'rose' })),
    ...myDrafts.slice(0, 2).map((d) => ({ id: d.id, name: d.engagement?.person?.name ?? 'Unknown', label: 'AI draft awaiting your review', href: '/drafts', accent: 'rose' })),
  ];
  const attentionItems = pendingSig.slice(0, 4).map((e) => ({ id: e.id, name: e.person?.name ?? 'Unknown', label: 'Engagement letter not yet signed', href: '/caseload/' + e.id, accent: 'amber' }));
  const todayItems     = todaySessions.slice(0, 4).map((s) => ({ id: s.id, name: s.clientName ?? s.person?.name ?? 'Client', label: s.slot?.startAt ? format(new Date(s.slot.startAt), 'h:mm a') + ' · ' + (s.category ?? 'Session') : 'Session today', href: '/sessions', accent: 'emerald', roomUrl: s.roomUrl }));

  const activityFeed = [
    ...myCases.slice(0, 6).map((e) => ({ id: e.id, type: 'engagement' as ActivityType, person: e.person?.name ?? 'Unknown', label: `Engagement ${statusLabel(e.status).toLowerCase()}`, ts: e.updatedAt ?? e.createdAt })),
    ...sessions.slice(0, 5).map((s) => ({ id: s.id, type: 'booking' as ActivityType, person: s.clientName ?? s.person?.name ?? 'Unknown', label: `Session confirmed · ${s.slot?.startAt ? format(new Date(s.slot.startAt), 'MMM d, h:mm a') : ''}`, ts: s.createdAt })),
    ...myPendingDocs.slice(0, 4).map((d) => ({ id: d.id, type: 'document' as ActivityType, person: d.person?.name ?? 'Unknown', label: `Document uploaded · ${d.type ?? 'file'}`, ts: d.uploadedAt ?? d.createdAt })),
  ].filter((e) => e.ts).sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()).slice(0, 12);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{greeting(staffName)}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{format(new Date(), 'EEEE, MMMM d, yyyy')} · {myCases.length} cases assigned</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <QA icon={UserCircle} label="My Cases" onClick={() => router.push('/caseload')} primary />
          <QA icon={CalendarCheck} label="Sessions" onClick={() => router.push('/sessions')} badge={todaySessions.length > 0 ? todaySessions.length : undefined} color="text-teal-500" />
          <QA icon={FileText} label="Doc Queue" onClick={() => router.push('/documents')} badge={myPendingDocs.length} color="text-amber-500" />
          <QA icon={Sparkle} label="AI Drafts" onClick={() => router.push('/drafts')} badge={myDrafts.length} color="text-violet-500" />
          <QA icon={GearSix} label="Settings" onClick={() => router.push('/settings')} color="text-slate-400" />
        </div>
      </div>

      {/* Next-up alert */}
      {isImminent && nextSession && (
        <div className="flex items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900">
              Session with {nextSession.clientName ?? nextSession.person?.name ?? 'client'} in{' '}
              {nextMins === 0 ? 'under a minute' : `${nextMins} min${nextMins === 1 ? '' : 's'}`}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{nextSession.slot?.startAt ? format(new Date(nextSession.slot.startAt), 'h:mm a') : ''} · {nextSession.category ?? 'Consultation'}</p>
          </div>
          {nextSession.roomUrl && (
            <a href={nextSession.roomUrl} target="_blank" rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-colors">
              Join Now <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Active Cases"     value={active.length}         sub={`${myCases.length} total assigned`}          icon={Briefcase}       iconBg="bg-primary/10"    iconColor="text-primary"      />
        <KpiCard label="Today's Sessions" value={todaySessions.length}  sub={`${upcomingSessions.length} upcoming total`}  icon={CalendarBlank}   iconBg="bg-teal-100"      iconColor="text-teal-600"     />
        <KpiCard label="Pending Docs"     value={myPendingDocs.length}  sub={myPendingDocs.length > 0 ? 'needs review' : 'all clear'} icon={FileText} iconBg={myPendingDocs.length > 0 ? 'bg-amber-100' : 'bg-slate-100'} iconColor={myPendingDocs.length > 0 ? 'text-amber-600' : 'text-slate-400'} alert={myPendingDocs.length > 0} />
        <KpiCard label="Completion Rate"  value={`${completionRate}%`}  sub={`${completed.length} of ${myCases.length} completed`} icon={ChartLineUp} iconBg="bg-emerald-100" iconColor="text-emerald-600" />
      </div>

      {/* Priority Inbox + Caseload */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Priority Inbox */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 pt-5 pb-4 border-b border-slate-100">
            <SectionLabel>Priority Inbox</SectionLabel>
            <div className="flex items-center gap-2 mt-3">
              {[
                { label: 'Urgent', count: urgentItems.length, cls: 'bg-rose-50 text-rose-600 ring-1 ring-rose-200' },
                { label: 'Attention', count: attentionItems.length, cls: 'bg-amber-50 text-amber-600 ring-1 ring-amber-200' },
                { label: 'Today', count: todayItems.length, cls: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' },
              ].map((t) => (
                <span key={t.label} className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${t.cls}`}>
                  {t.label} <span className="font-bold">{t.count}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-80">
            {urgentItems.map((item) => <InboxRow key={item.id} {...item} router={router} />)}
            {attentionItems.map((item) => <InboxRow key={item.id} {...item} router={router} />)}
            {todayItems.map((item) => (
              <div key={item.id} onClick={() => router.push(item.href)}
                className="flex items-center gap-3 px-5 py-3 border-l-[3px] border-l-emerald-400 hover:bg-emerald-50/40 cursor-pointer transition-colors group">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(item.name)} text-white text-xs font-bold`}>{initials(item.name)}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900 truncate">{item.name}</p>
                  <p className="text-xs text-slate-400 truncate">{item.label}</p>
                </div>
                {(item as any).roomUrl && (
                  <a href={(item as any).roomUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                    className="shrink-0 rounded-lg bg-primary px-2.5 py-1 text-xs font-bold text-white hover:bg-primary/90">
                    Join
                  </a>
                )}
              </div>
            ))}
            {urgentItems.length === 0 && attentionItems.length === 0 && todayItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center px-5">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle className="h-6 w-6 text-emerald-500" weight="fill" />
                </div>
                <p className="text-sm font-semibold text-slate-800">Inbox zero</p>
                <p className="text-xs text-slate-400 mt-1">No items require attention.</p>
              </div>
            )}
          </div>
        </div>

        {/* My Caseload */}
        <div className="lg:col-span-3 rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <SectionLabel>My Caseload</SectionLabel>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{myCases.length} cases</p>
            </div>
            <button onClick={() => router.push('/caseload')} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex-1 divide-y divide-slate-100 overflow-y-auto max-h-80">
            {myCases.slice(0, 8).map((e) => (
              <div key={e.id} onClick={() => router.push('/caseload/' + e.id)}
                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors group">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(e.person?.name ?? '')} text-white text-xs font-bold`}>
                  {initials(e.person?.name ?? '?')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">{e.person?.name ?? '—'}</p>
                  <p className="text-xs text-slate-400 truncate">{e.person?.profession ?? e.person?.email ?? '—'}</p>
                </div>
                <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${STATUS_PILL[e.status] ?? 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[e.status] ?? 'bg-slate-400'}`} />
                  {statusLabel(e.status)}
                </span>
                <span className="text-xs text-slate-400 whitespace-nowrap hidden sm:block">{relTime(e.createdAt)}</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            ))}
            {myCases.length === 0 && (
              <div className="py-12 text-center">
                <Users className="mx-auto mb-2 h-7 w-7 text-slate-300" weight="duotone" />
                <p className="text-sm text-slate-400">No cases assigned yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline + Performance + AI Drafts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Mini pipeline */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <SectionLabel>My Pipeline</SectionLabel>
              <p className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5">{myCases.length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <TrendUp className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="space-y-3">
            {PIPELINE_STAGES.map((stage) => {
              const count = myCases.filter((e) => e.status === stage.key).length;
              const pct   = myCases.length > 0 ? Math.round((count / myCases.length) * 100) : 0;
              return (
                <div key={stage.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-500">{stage.label}</span>
                    <span className="text-xs font-semibold text-slate-800 tabular-nums">{count}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100">
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
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <SectionLabel>Performance</SectionLabel>
              <p className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5">{completionRate}%</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <ChartLineUp className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-center gap-5 mb-4">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="3"
                  strokeDasharray={`${completionRate} ${100 - completionRate}`} strokeLinecap="round" />
              </svg>
              <span className="absolute text-sm font-bold text-slate-900">{completionRate}%</span>
            </div>
            <div className="space-y-1.5 text-xs flex-1">
              {[
                { label: 'Completed', count: completed.length, color: 'bg-emerald-500' },
                { label: 'Active',    count: active.length,    color: 'bg-blue-400' },
                { label: 'On Hold',   count: onHold.length,    color: 'bg-orange-400' },
                { label: 'Pending',   count: pendingSig.length, color: 'bg-amber-400' },
              ].map((r) => (
                <div key={r.label} className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${r.color}`} />
                  <span className="text-slate-500 flex-1">{r.label}</span>
                  <span className="font-semibold text-slate-800">{r.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Drafts */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <SectionLabel>AI Drafts</SectionLabel>
              <p className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">{myDrafts.length} pending</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
              <Sparkle className="h-4.5 w-4.5 text-violet-500" />
            </div>
          </div>
          <div className="flex-1 divide-y divide-slate-100">
            {myDrafts.slice(0, 4).map((d) => (
              <div key={d.id} onClick={() => router.push('/drafts')}
                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors group">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(d.engagement?.person?.name ?? '')} text-white text-xs font-bold`}>
                  {initials(d.engagement?.person?.name ?? '?')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 truncate">{d.engagement?.person?.name ?? 'Unknown'}</p>
                  <p className="text-xs text-slate-400">Awaiting review</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            ))}
            {myDrafts.length === 0 && (
              <div className="py-8 text-center">
                <CheckCircle className="mx-auto mb-2 h-7 w-7 text-emerald-400" weight="duotone" />
                <p className="text-sm text-slate-400">No drafts pending.</p>
              </div>
            )}
          </div>
          {myDrafts.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100">
              <button onClick={() => router.push('/drafts')} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                Review all <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <SectionLabel>Recent Activity</SectionLabel>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">Latest events on your cases</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">{activityFeed.length}</span>
        </div>
        {activityFeed.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Envelope className="mx-auto mb-2 h-8 w-8 text-slate-300" weight="duotone" />
            <p className="text-sm text-slate-400">No recent activity.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activityFeed.map((ev) => <ActivityRow key={`${ev.type}-${ev.id}`} {...ev} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Compliance Dashboard ──────────────────────────────────────────────────────

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
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{greeting(staffName)}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <QA icon={FileText} label="Doc Queue" onClick={() => router.push('/documents')} badge={pendingDocs.length} primary color="text-white" />
          <QA icon={Warning} label="On Hold" onClick={() => router.push('/caseload')} badge={onHold.length > 0 ? onHold.length : undefined} color="text-orange-500" />
          <QA icon={ChartBar} label="Audit Log" onClick={() => router.push('/audit')} color="text-slate-500" />
          <QA icon={Users} label="All Clients" onClick={() => router.push('/clients')} color="text-primary" />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard label="Pending Documents" value={pendingDocs.length} sub={pendingDocs.length > 0 ? 'Awaiting verification' : 'Queue clear'} icon={FileText} iconBg={pendingDocs.length > 0 ? 'bg-amber-100' : 'bg-slate-100'} iconColor={pendingDocs.length > 0 ? 'text-amber-600' : 'text-slate-400'} alert={pendingDocs.length > 0} />
        <KpiCard label="On Hold Cases"     value={onHold.length}      sub={onHold.length > 0 ? 'Needs attention' : 'All clear'}             icon={Warning}   iconBg={onHold.length > 0 ? 'bg-rose-100' : 'bg-slate-100'}  iconColor={onHold.length > 0 ? 'text-rose-600' : 'text-slate-400'} alert={onHold.length > 0} />
        <KpiCard label="Total Engagements" value={engagements.length}  sub="Across all consultants"                                           icon={Briefcase} iconBg="bg-primary/10" iconColor="text-primary" />
      </div>

      {/* Doc queue + On hold */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <SectionLabel>Document Review Queue</SectionLabel>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{pendingDocs.length} pending verification</p>
            </div>
            <button onClick={() => router.push('/documents')} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              Open queue <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {pendingDocs.slice(0, 8).map((d) => (
              <div key={d.id} onClick={() => router.push('/documents')}
                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <Warning className="h-4 w-4 text-amber-600" weight="fill" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">{d.person?.name ?? 'Unknown'}</p>
                  <p className="text-xs text-slate-400">{d.type ?? 'Document'} · {relTime(d.uploadedAt ?? d.createdAt)}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
              </div>
            ))}
            {pendingDocs.length === 0 && (
              <div className="py-12 text-center">
                <CheckCircle className="mx-auto mb-3 h-10 w-10 text-emerald-400" weight="duotone" />
                <p className="text-sm font-semibold text-slate-800">Queue clear</p>
                <p className="text-xs text-slate-400 mt-1">No documents awaiting review.</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <SectionLabel>On-Hold Cases</SectionLabel>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">Engagements paused / overdue</p>
            </div>
            <button onClick={() => router.push('/caseload')} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              Caseload <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {onHold.slice(0, 8).map((e) => (
              <div key={e.id} onClick={() => router.push('/caseload/' + e.id)}
                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors group">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(e.person?.name ?? '')} text-white text-xs font-bold`}>
                  {initials(e.person?.name ?? '?')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">{e.person?.name ?? '—'}</p>
                  <p className="text-xs text-slate-400">{e.person?.profession ?? e.person?.email ?? '—'}</p>
                </div>
                <span className="rounded-full bg-orange-50 text-orange-700 ring-1 ring-orange-200 px-2.5 py-0.5 text-xs font-semibold">On Hold</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            ))}
            {onHold.length === 0 && (
              <div className="py-12 text-center">
                <CheckCircle className="mx-auto mb-3 h-10 w-10 text-emerald-400" weight="duotone" />
                <p className="text-sm font-semibold text-slate-800">All clear</p>
                <p className="text-xs text-slate-400 mt-1">No on-hold engagements.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Admin Dashboard ───────────────────────────────────────────────────────────

function AdminDashboard() {
  const router = useRouter();
  const { me } = useAdmin();
  const [persons, setPersons]             = useState<any[]>([]);
  const [engagements, setEngagements]     = useState<any[]>([]);
  const [pendingDocs, setPendingDocs]     = useState<any[]>([]);
  const [pendingDrafts, setPendingDrafts] = useState<any[]>([]);
  const [leads, setLeads]                 = useState<any[]>([]);
  const [orders, setOrders]               = useState<any[]>([]);
  const [bookings, setBookings]           = useState<any[]>([]);
  const [officerNotes, setOfficerNotes]   = useState<any[]>([]);
  const [paymentStats, setPaymentStats]   = useState<any>(null);
  const [loading, setLoading]             = useState(true);

  const staffName = me?.name ?? 'Admin';

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [rPersons, rEngs, rDocs, rDrafts, rLeads, rOrders, rBookings, rOfficerNotes, rStats] = await Promise.allSettled([
        api.getPersons(), api.getAllEngagements(), api.getPendingDocuments(),
        api.getPendingDrafts(), api.getLeads(), api.getAllOrders(),
        api.getAllBookings(), api.getRecentOfficerNotes(15), api.getPaymentStats(),
      ]);
      if (rPersons.status === 'fulfilled')      setPersons(rPersons.value ?? []);
      if (rEngs.status === 'fulfilled')          setEngagements(rEngs.value ?? []);
      if (rDocs.status === 'fulfilled')          setPendingDocs(rDocs.value ?? []);
      if (rDrafts.status === 'fulfilled')        setPendingDrafts(rDrafts.value ?? []);
      if (rLeads.status === 'fulfilled')         setLeads(rLeads.value ?? []);
      if (rOrders.status === 'fulfilled')        setOrders(rOrders.value ?? []);
      if (rBookings.status === 'fulfilled')      setBookings(rBookings.value ?? []);
      if (rOfficerNotes.status === 'fulfilled')  setOfficerNotes(rOfficerNotes.value ?? []);
      if (rStats.status === 'fulfilled')         setPaymentStats(rStats.value ?? null);
    } finally { setLoading(false); }
  }

  // ── Derived metrics ──────────────────────────────────────────────────────────
  const activeEngagements    = engagements.filter((e) => e.status === 'ACTIVE').length;
  const pendingSigEngagements = engagements.filter((e) => e.status === 'PENDING_SIGNATURE');
  const onHoldEngagements    = engagements.filter((e) => e.status === 'ON_HOLD').length;

  const todayBookings = bookings.filter((b) => {
    try { return isToday(new Date(b.slot?.date ?? b.createdAt)); } catch { return false; }
  });

  const revenueMtd = orders
    .filter((o) => o.status === 'PAID' && o.createdAt && isThisMonth(o.createdAt))
    .reduce((sum, o) => sum + Number(o.total ?? 0), 0);

  const revenueChart: { date: string; revenue: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const key = format(d, 'MMM d');
    const dayRevenue = orders
      .filter((o) => o.status === 'PAID' && o.createdAt && isSameDay(new Date(o.createdAt), d))
      .reduce((sum, o) => sum + Number(o.total ?? 0), 0);
    revenueChart.push({ date: key, revenue: dayRevenue });
  }
  const revenue30d = revenueChart.reduce((s, d) => s + d.revenue, 0);

  const pipelineCounts: Record<string, any[]> = { LEAD: leads, PENDING_SIGNATURE: [], ACTIVE: [], ON_HOLD: [], COMPLETED: [] };
  engagements.forEach((e) => { if (pipelineCounts[e.status]) pipelineCounts[e.status].push(e); });
  const pipelineTotal = Object.values(pipelineCounts).reduce((s, arr) => s + arr.length, 0) || 1;

  const totalLeads = leads.length;
  const contacted  = leads.filter((l) => l.status !== 'NEW').length;
  const qualified  = leads.filter((l) => ['QUALIFIED', 'CONVERTED'].includes(l.status)).length;
  const converted  = leads.filter((l) => l.status === 'CONVERTED').length;

  const urgentItems = [
    ...pendingDocs.slice(0, 3).map((d) => ({ id: d.id, name: d.person?.name ?? 'Unknown', label: `Document: ${d.type ?? 'File'} needs verification`, href: '/documents', accent: 'rose' })),
    ...pendingDrafts.slice(0, 2).map((d) => ({ id: d.id, name: d.engagement?.person?.name ?? 'Unknown', label: 'AI draft awaiting review', href: '/drafts', accent: 'rose' })),
  ];
  const attentionItems = pendingSigEngagements.slice(0, 4).map((e) => ({ id: e.id, name: e.person?.name ?? 'Unknown', label: 'Engagement letter not signed', href: '/caseload', accent: 'amber' }));
  const todayItems     = todayBookings.slice(0, 4).map((b) => ({ id: b.id, name: b.person?.name ?? 'Unknown', label: `${b.type ?? 'Booking'} · ${b.slot?.startTime ? format(new Date(b.slot.startTime), 'h:mm a') : 'All day'}`, href: '/bookings', accent: 'emerald' }));

  const activityEvents = [
    ...leads.slice(0, 5).map((l) => ({ id: l.id, type: 'lead' as ActivityType, person: l.name ?? 'Unknown lead', label: `New lead · ${l.source ?? 'web'}`, ts: l.createdAt })),
    ...bookings.slice(0, 5).map((b) => ({ id: b.id, type: 'booking' as ActivityType, person: b.person?.name ?? 'Unknown', label: `Booking confirmed · ${b.type ?? 'session'}`, ts: b.createdAt })),
    ...engagements.slice(0, 4).map((e) => ({ id: e.id, type: 'engagement' as ActivityType, person: e.person?.name ?? 'Unknown', label: `Engagement ${statusLabel(e.status).toLowerCase()}`, ts: e.createdAt })),
    ...pendingDocs.slice(0, 3).map((d) => ({ id: d.id, type: 'document' as ActivityType, person: d.person?.name ?? 'Unknown', label: `Document uploaded · ${d.type ?? 'file'}`, ts: d.uploadedAt ?? d.createdAt })),
    ...orders.slice(0, 3).map((o) => ({ id: o.id, type: 'order' as ActivityType, person: (o.person ?? o.engagement?.person)?.name ?? 'Unknown', label: `Order ${statusLabel(o.status).toLowerCase()} · $${Number(o.total ?? 0).toLocaleString()}`, ts: o.createdAt })),
  ].filter((e) => e.ts).sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()).slice(0, 15);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{greeting(staffName)}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{format(new Date(), 'EEEE, MMMM d, yyyy')} · {persons.length} clients in system</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <QA icon={Plus}          label="New Case"    onClick={() => router.push('/caseload/new')}  primary />
          <QA icon={FileText}      label="Doc Queue"   onClick={() => router.push('/documents')}     badge={pendingDocs.length}   color="text-amber-500" />
          <QA icon={Sparkle}       label="AI Drafts"   onClick={() => router.push('/drafts')}        badge={pendingDrafts.length} color="text-violet-500" />
          <QA icon={UserPlus}      label="Add Lead"    onClick={() => router.push('/leads')}         color="text-teal-500" />
          <QA icon={ChartBar}      label="Pipeline"    onClick={() => router.push('/caseload')}      color="text-primary" />
          <QA icon={CurrencyDollar} label="Finance"   onClick={() => router.push('/finance')}       color="text-emerald-500" />
          <QA icon={MagnifyingGlass} label="Search"   onClick={() => router.push('/clients')}       color="text-slate-400" />
        </div>
      </div>

      {/* ── KPI Row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Active Cases"     value={activeEngagements}
          sub={`${engagements.length} total engagements`}
          icon={Briefcase}  iconBg="bg-primary/10"    iconColor="text-primary"
        />
        <KpiCard
          label="Revenue MTD"
          value={`$${(paymentStats?.revenueMtd ?? revenueMtd).toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 })}`}
          sub={`${orders.filter((o) => o.status === 'PAID').length} paid orders`}
          icon={CurrencyDollar} iconBg="bg-emerald-100" iconColor="text-emerald-600"
        />
        <KpiCard
          label="Pending Docs"     value={pendingDocs.length}
          sub={pendingDocs.length > 0 ? 'Awaiting verification' : 'Queue clear'}
          icon={FileText}   iconBg={pendingDocs.length > 0 ? 'bg-amber-100' : 'bg-slate-100'}
          iconColor={pendingDocs.length > 0 ? 'text-amber-600' : 'text-slate-400'}
          alert={pendingDocs.length > 0}
        />
        <KpiCard
          label="Today's Sessions" value={todayBookings.length}
          sub={`${bookings.length} total bookings`}
          icon={CalendarBlank} iconBg="bg-teal-100" iconColor="text-teal-600"
        />
      </div>

      {/* ── Revenue Chart + Priority Inbox ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Revenue area chart */}
        <div className="lg:col-span-3 rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 pt-5 pb-2 flex items-start justify-between">
            <div>
              <SectionLabel>Revenue · 30 days</SectionLabel>
              <p className="text-3xl font-bold text-slate-900 tabular-nums mt-1">
                ${revenue30d.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {format(subDays(new Date(), 29), 'MMM d')} – {format(new Date(), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <TrendUp className="h-5 w-5 text-primary" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={revenueChart} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0F4C81" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#0F4C81" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <Tooltip content={<RevenueTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#0F4C81" strokeWidth={2} fill="url(#revenueGrad2)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Inbox */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 pt-5 pb-4 border-b border-slate-100">
            <SectionLabel>Priority Inbox</SectionLabel>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {[
                { label: 'Urgent',    count: urgentItems.length,    cls: 'bg-rose-50 text-rose-600 ring-1 ring-rose-200' },
                { label: 'Attention', count: attentionItems.length, cls: 'bg-amber-50 text-amber-600 ring-1 ring-amber-200' },
                { label: 'Today',     count: todayItems.length,     cls: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' },
              ].map((t) => (
                <span key={t.label} className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${t.cls}`}>
                  {t.label} <span className="font-bold">{t.count}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[260px]">
            {urgentItems.map((item) => <InboxRow key={item.id} {...item} router={router} />)}
            {attentionItems.map((item) => <InboxRow key={item.id} {...item} router={router} />)}
            {todayItems.map((item) => <InboxRow key={item.id} {...item} router={router} />)}
            {urgentItems.length === 0 && attentionItems.length === 0 && todayItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center px-5">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle className="h-6 w-6 text-emerald-500" weight="fill" />
                </div>
                <p className="text-sm font-semibold text-slate-800">Inbox zero</p>
                <p className="text-xs text-slate-400 mt-1">All clear — no urgent items.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Client Pipeline ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <SectionLabel>Client Pipeline</SectionLabel>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{pipelineTotal} clients across all stages</p>
          </div>
          <button onClick={() => router.push('/caseload')} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            Full caseload <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {PIPELINE_COLS.map((col) => {
            const items = pipelineCounts[col.key] ?? [];
            const pct   = Math.round((items.length / pipelineTotal) * 100);
            return (
              <div
                key={col.key}
                onClick={() => router.push(col.key === 'LEAD' ? '/leads' : '/caseload')}
                className="group cursor-pointer rounded-xl border border-slate-100 p-4 hover:border-slate-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 truncate">{col.label}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${col.bg} ${col.text}`}>{items.length}</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 tabular-nums mb-2">{pct}<span className="text-base font-medium text-slate-400">%</span></p>
                <div className="h-1 w-full rounded-full bg-slate-100 mb-3">
                  <div className="h-1 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: col.color }} />
                </div>
                <div className="space-y-1.5">
                  {items.slice(0, 3).map((item: any) => {
                    const name = item.person?.name ?? item.name ?? '—';
                    return (
                      <div key={item.id} className="flex items-center gap-1.5">
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(name)} text-white text-[9px] font-bold`}>
                          {initials(name)}
                        </div>
                        <span className="text-xs text-slate-600 truncate">{name.split(' ')[0]}</span>
                      </div>
                    );
                  })}
                  {items.length > 3 && <p className="text-xs text-slate-400 pl-0.5">+{items.length - 3} more</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Analytics Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Lead funnel */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <SectionLabel>Lead Funnel</SectionLabel>
              <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">{totalLeads}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <UsersFour className="h-5 w-5 text-slate-500" />
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Total leads', count: totalLeads, max: totalLeads, color: '#94a3b8' },
              { label: 'Contacted',   count: contacted,  max: totalLeads, color: '#60a5fa' },
              { label: 'Qualified',   count: qualified,  max: totalLeads, color: '#a78bfa' },
              { label: 'Converted',   count: converted,  max: totalLeads, color: '#34d399' },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-500">{row.label}</span>
                  <span className="text-xs font-semibold text-slate-800 tabular-nums">
                    {row.count}
                    {row.max > 0 && row.label !== 'Total leads' && (
                      <span className="text-slate-400 font-normal ml-1">({Math.round((row.count / row.max) * 100)}%)</span>
                    )}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100">
                  <div className="h-1.5 rounded-full transition-all" style={{ width: row.max > 0 ? `${Math.round((row.count / row.max) * 100)}%` : '0%', backgroundColor: row.color }} />
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => router.push('/leads')} className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            Manage leads <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Today's agenda */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <SectionLabel>Today's Agenda</SectionLabel>
              <p className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">{todayBookings.length} sessions</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
              <CalendarBlank className="h-4.5 w-4.5 text-teal-600" />
            </div>
          </div>
          <div className="flex-1 divide-y divide-slate-100">
            {todayBookings.slice(0, 5).map((b: any) => (
              <div key={b.id} onClick={() => router.push('/bookings')}
                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(b.person?.name ?? '?')} text-white text-xs font-bold`}>
                  {initials(b.person?.name ?? '?')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 truncate">{b.person?.name ?? '—'}</p>
                  <p className="text-xs text-slate-400">{b.type ?? 'Session'}{b.slot?.startTime ? ` · ${format(new Date(b.slot.startTime), 'h:mm a')}` : ''}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${b.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {b.status}
                </span>
              </div>
            ))}
            {todayBookings.length === 0 && (
              <div className="py-10 text-center">
                <CalendarBlank className="mx-auto mb-2 h-7 w-7 text-slate-300" weight="duotone" />
                <p className="text-sm text-slate-400">No sessions today</p>
              </div>
            )}
          </div>
          <div className="px-5 py-3 border-t border-slate-100">
            <button onClick={() => router.push('/bookings')} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              All bookings <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* AI Drafts */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <SectionLabel>AI Drafts</SectionLabel>
              <p className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">{pendingDrafts.length} pending</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
              <Sparkle className="h-4.5 w-4.5 text-violet-500" />
            </div>
          </div>
          <div className="flex-1 divide-y divide-slate-100">
            {pendingDrafts.slice(0, 5).map((d) => (
              <div key={d.id} onClick={() => router.push('/drafts')}
                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors group">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(d.engagement?.person?.name ?? '')} text-white text-xs font-bold`}>
                  {initials(d.engagement?.person?.name ?? '?')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 truncate">{d.engagement?.person?.name ?? 'Unknown'}</p>
                  <p className="text-xs text-slate-400">Awaiting review</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            ))}
            {pendingDrafts.length === 0 && (
              <div className="py-10 text-center">
                <CheckCircle className="mx-auto mb-2 h-7 w-7 text-emerald-400" weight="duotone" />
                <p className="text-sm text-slate-400">No drafts pending</p>
              </div>
            )}
          </div>
          {pendingDrafts.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100">
              <button onClick={() => router.push('/drafts')} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                Review all <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Activity Feed ────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <SectionLabel>Recent Activity</SectionLabel>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">Latest events across all modules</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">{activityEvents.length} events</span>
        </div>
        {activityEvents.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Envelope className="mx-auto mb-2 h-8 w-8 text-slate-300" weight="duotone" />
            <p className="text-sm text-slate-400">No recent activity.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activityEvents.map((ev) => <ActivityRow key={`${ev.type}-${ev.id}`} {...ev} />)}
          </div>
        )}
      </div>

      {/* ── Officer Notes ────────────────────────────────────────────────────── */}
      {officerNotes.length > 0 && (
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <SectionLabel>Officer Activity</SectionLabel>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">Latest updates from processing officers</p>
            </div>
            <button onClick={() => router.push('/officers')} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              Officers <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {officerNotes.map((note) => (
              <div key={note.id} onClick={() => router.push('/officer/cases/' + note.engagementId)}
                className="flex items-start gap-4 px-6 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 text-xs font-bold">
                  {(note.author?.name ?? 'O').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-slate-800">{note.engagement?.person?.name ?? 'Unknown'}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      note.isInternal ? 'bg-slate-100 text-slate-500' :
                      note.requiresApproval && !note.approvedAt ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'
                    }`}>
                      {note.isInternal ? 'Internal' : note.requiresApproval && !note.approvedAt ? 'Needs approval' : 'Sent'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{note.content}</p>
                  <p className="text-xs text-slate-400">by {note.author?.name ?? 'Officer'}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-400 whitespace-nowrap pt-0.5">{relTime(note.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

// ── Role-aware export ─────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { me } = useAdmin();
  const role = (me?.role as string)?.toUpperCase() ?? 'ADMIN';
  if (role === 'CONSULTANT') return <ConsultantDashboard />;
  if (role === 'COMPLIANCE') return <ComplianceDashboard />;
  return <AdminDashboard />;
}
