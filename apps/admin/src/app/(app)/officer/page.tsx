'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UsersThree, Warning, ArrowSquareUpRight, CheckCircle,
  Clock, Note, ArrowRight, Pulse, ListChecks, Plus,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';
import { useAdmin } from '../../../contexts/admin-context';
import { formatDistanceToNow, format } from 'date-fns';

function relTime(ts: string) {
  try { return formatDistanceToNow(new Date(ts), { addSuffix: true }); } catch { return '—'; }
}

function initials(name: string) {
  if (!name) return '?';
  const p = name.trim().split(' ').filter(Boolean);
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : p[0].slice(0, 2).toUpperCase();
}

function greeting(name: string) {
  const h = new Date().getHours();
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${g}, ${name.split(' ')[0]}`;
}

function contextMessage(stats: any) {
  if (stats.slaAlerts > 0) {
    return {
      text: `You have ${stats.slaAlerts} overdue action${stats.slaAlerts > 1 ? 's' : ''} — let's clear them first.`,
      color: 'bg-rose-500/20 text-rose-100 border-rose-400/30',
      dot: 'bg-rose-400',
    };
  }
  if (stats.awaitingApproval > 0) {
    return {
      text: `${stats.awaitingApproval} sensitive update${stats.awaitingApproval > 1 ? 's are' : ' is'} waiting for consultant approval.`,
      color: 'bg-amber-500/20 text-amber-100 border-amber-400/30',
      dot: 'bg-amber-400',
    };
  }
  if (stats.openEscalations > 0) {
    return {
      text: `${stats.openEscalations} escalation${stats.openEscalations > 1 ? 's' : ''} awaiting consultant response.`,
      color: 'bg-violet-500/20 text-violet-100 border-violet-400/30',
      dot: 'bg-violet-400',
    };
  }
  return {
    text: 'All caught up — great work today.',
    color: 'bg-teal-500/20 text-teal-100 border-teal-400/30',
    dot: 'bg-teal-400',
  };
}

function StatCard({
  label, value, icon: Icon, color, sub,
}: {
  label: string; value: number | string; icon: any; color: string; sub?: string;
}) {
  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm flex items-start gap-4 ${color}`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-current/10">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-xs font-semibold text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function OfficerDashboard() {
  const router = useRouter();
  const { me } = useAdmin();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOfficerDashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-44 rounded-2xl bg-muted animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-72 rounded-2xl bg-muted animate-pulse" />
          <div className="h-72 rounded-2xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  const stats = data?.stats ?? { totalCases: 0, slaAlerts: 0, openEscalations: 0, awaitingApproval: 0 };
  const cases: any[] = data?.cases ?? [];
  const overdueTracking: any[] = data?.overdueTracking ?? [];
  const escalations: any[] = data?.escalations ?? [];
  const pendingApprovals: any[] = data?.pendingApprovals ?? [];
  const recentActivity: any[] = data?.recentActivity ?? [];

  const staffName = me?.name ?? 'Officer';
  const msg = contextMessage(stats);

  // Sort cases: overdue first, then no tracking, then rest
  const overdueEngagementIds = new Set(overdueTracking.map((t: any) => t.engagementId));
  const sortedCases = [...cases].sort((a, b) => {
    const aOverdue = overdueEngagementIds.has(a.id) ? 0 : 1;
    const bOverdue = overdueEngagementIds.has(b.id) ? 0 : 1;
    const aNoTracking = (a.applicationTracking?.length ?? 0) === 0 ? 0 : 1;
    const bNoTracking = (b.applicationTracking?.length ?? 0) === 0 ? 0 : 1;
    return (aOverdue + aNoTracking) - (bOverdue + bNoTracking);
  });

  return (
    <div className="space-y-6">

      {/* ── Welcome Banner ─────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl shadow-lg"
        style={{ background: 'linear-gradient(135deg, #0F4C81 0%, #0a3460 55%, #00A896 100%)' }}
      >
        {/* decorative circles */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-teal-400/10" />
        <div className="pointer-events-none absolute top-0 left-0 bottom-0 w-1.5 rounded-l-2xl bg-gradient-to-b from-teal-400 to-primary" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6 px-8 py-7">

          {/* Left — greeting + status + actions */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-1">
              Processing Officer · {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
              {greeting(staffName)}
            </h1>

            {/* Contextual status pill */}
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold mb-5 ${msg.color}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${msg.dot} animate-pulse`} />
              {msg.text}
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push('/officer/caseload')}
                className="flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 px-4 py-2 text-xs font-semibold text-white transition-colors"
              >
                <UsersThree className="h-3.5 w-3.5" />
                View My Caseload
              </button>
              <button
                onClick={() => router.push('/officer/stages')}
                className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-2 text-xs font-semibold text-white/80 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Stage Tracker
              </button>
            </div>
          </div>

          {/* Right — avatar + mini stats */}
          <div className="flex flex-col items-center gap-4 shrink-0">
            {/* Avatar */}
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-teal-400 to-primary flex items-center justify-center text-xl font-extrabold text-white shadow-xl ring-4 ring-white/20">
                {initials(staffName)}
              </div>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>
            </div>

            {/* Mini stats row */}
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-lg font-extrabold text-white tabular-nums">{stats.totalCases}</p>
                <p className="text-xs text-white/50 font-medium">Cases</p>
              </div>
              <div className="w-px bg-white/15" />
              <div className="text-center">
                <p className={`text-lg font-extrabold tabular-nums ${stats.slaAlerts > 0 ? 'text-rose-300' : 'text-white'}`}>{stats.slaAlerts}</p>
                <p className="text-xs text-white/50 font-medium">SLA</p>
              </div>
              <div className="w-px bg-white/15" />
              <div className="text-center">
                <p className={`text-lg font-extrabold tabular-nums ${stats.openEscalations > 0 ? 'text-amber-300' : 'text-white'}`}>{stats.openEscalations}</p>
                <p className="text-xs text-white/50 font-medium">Escalated</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── KPI cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Assigned Cases" value={stats.totalCases} icon={UsersThree} color="text-primary" />
        <StatCard
          label="SLA Alerts"
          value={stats.slaAlerts}
          icon={Warning}
          color={stats.slaAlerts > 0 ? 'text-rose-600 border-rose-200' : 'text-emerald-600'}
          sub={stats.slaAlerts > 0 ? 'Overdue next actions' : 'All on track'}
        />
        <StatCard
          label="Open Escalations"
          value={stats.openEscalations}
          icon={ArrowSquareUpRight}
          color={stats.openEscalations > 0 ? 'text-amber-600 border-amber-200' : 'text-muted-foreground'}
          sub={stats.openEscalations > 0 ? 'Awaiting consultant' : 'None open'}
        />
        <StatCard
          label="Awaiting Approval"
          value={stats.awaitingApproval}
          icon={Clock}
          color={stats.awaitingApproval > 0 ? 'text-violet-600 border-violet-200' : 'text-muted-foreground'}
          sub={stats.awaitingApproval > 0 ? 'Sensitive updates' : 'None pending'}
        />
      </div>

      {/* ── Caseload + Activity ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Cases */}
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h2 className="text-sm font-bold text-foreground">My Caseload</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{cases.length} assigned · overdue first</p>
            </div>
            <button
              onClick={() => router.push('/officer/caseload')}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {cases.length === 0 ? (
            <div className="py-12 text-center">
              <UsersThree className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">No cases assigned yet</p>
              <p className="text-xs text-muted-foreground mt-1">Contact your administrator.</p>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {sortedCases.slice(0, 10).map((c: any) => {
                const isOverdue = overdueEngagementIds.has(c.id);
                const noTracking = (c.applicationTracking?.length ?? 0) === 0;
                const lastTracking = c.applicationTracking?.[0];
                return (
                  <div
                    key={c.id}
                    onClick={() => router.push('/officer/cases/' + c.id)}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 cursor-pointer transition-colors group"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {initials(c.person?.name ?? '?')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{c.person?.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {noTracking ? 'No submissions yet' : lastTracking ? `${lastTracking.portal} · ${lastTracking.status}` : '—'}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {isOverdue && <span className="rounded-full bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 text-xs font-semibold">Overdue</span>}
                      {!isOverdue && noTracking && <span className="rounded-full bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 text-xs font-semibold">No tracking</span>}
                      {!isOverdue && !noTracking && <span className="rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-xs font-semibold">Active</span>}
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Recent activity */}
          <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-bold text-foreground">Recent Activity</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Your latest notes and tracking updates</p>
            </div>
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center">
                <Pulse className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No activity yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border max-h-56 overflow-y-auto">
                {recentActivity.map((item: any) => (
                  <div
                    key={`${item._type}-${item.id}`}
                    onClick={() => router.push('/officer/cases/' + item.engagementId)}
                    className="flex items-start gap-3 px-5 py-3 hover:bg-muted/20 cursor-pointer transition-colors"
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${item._type === 'note' ? 'bg-teal-100' : 'bg-blue-100'}`}>
                      {item._type === 'note'
                        ? <Note className="h-3.5 w-3.5 text-teal-600" />
                        : <ListChecks className="h-3.5 w-3.5 text-blue-600" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">{item.engagement?.person?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {item._type === 'note' ? item.content : `${item.portal} · ${item.status}`}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">{relTime(item.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Open escalations */}
          {escalations.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-amber-200 bg-amber-50">
                <h2 className="text-sm font-bold text-amber-800">Open Escalations</h2>
                <p className="text-xs text-amber-600 mt-0.5">Awaiting consultant response</p>
              </div>
              <div className="divide-y divide-border">
                {escalations.map((esc: any) => (
                  <div
                    key={esc.id}
                    onClick={() => router.push('/officer/cases/' + esc.engagementId)}
                    className="flex items-start gap-3 px-5 py-3 hover:bg-muted/20 cursor-pointer transition-colors"
                  >
                    <Warning className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" weight="fill" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground">{esc.engagement?.person?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{esc.reason}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">{relTime(esc.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending approvals */}
          {pendingApprovals.length > 0 && (
            <div className="rounded-2xl border border-violet-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-violet-200 bg-violet-50">
                <h2 className="text-sm font-bold text-violet-800">Awaiting Consultant Approval</h2>
                <p className="text-xs text-violet-600 mt-0.5">Not yet sent to clients</p>
              </div>
              <div className="divide-y divide-border">
                {pendingApprovals.map((note: any) => (
                  <div
                    key={note.id}
                    onClick={() => router.push('/officer/cases/' + note.engagementId)}
                    className="flex items-start gap-3 px-5 py-3 hover:bg-muted/20 cursor-pointer transition-colors"
                  >
                    <Clock className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground">{note.engagement?.person?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{note.content}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">{relTime(note.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
