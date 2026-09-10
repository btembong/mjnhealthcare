'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UsersThree, Warning, ArrowSquareUpRight, CheckCircle,
  Clock, Note, ArrowRight, Pulse, ListChecks,
  CalendarBlank, FileText, Clipboard, ChartBar,
} from '@mjn/ui';
import { api } from '../../../lib/api';
import { useAdmin } from '../../../contexts/admin-context';
import { formatDistanceToNow, format, differenceInDays } from 'date-fns';

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function urgencyLabel(stats: any): string {
  if (stats.slaAlerts > 0) return `${stats.slaAlerts} overdue action${stats.slaAlerts > 1 ? 's' : ''} — clear these first.`;
  if (stats.awaitingApproval > 0) return `${stats.awaitingApproval} update${stats.awaitingApproval > 1 ? 's' : ''} awaiting consultant approval.`;
  if (stats.openEscalations > 0) return `${stats.openEscalations} escalation${stats.openEscalations > 1 ? 's' : ''} awaiting response.`;
  return 'All caught up — great work today.';
}

// Days-until label — monochrome urgency via font weight only
function daysChip(dateStr: string) {
  const d = differenceInDays(new Date(dateStr), new Date());
  if (d < 0) return { label: 'Overdue', cls: 'bg-slate-900 text-white ring-slate-700'   };
  if (d === 0) return { label: 'Today',   cls: 'bg-slate-800 text-white ring-slate-600'  };
  if (d <= 3)  return { label: `${d}d`,   cls: 'bg-slate-200 text-slate-800 ring-slate-300' };
  return           { label: `${d}d`,   cls: 'bg-slate-100 text-slate-600 ring-slate-200' };
}

// Pipeline — all one primary color with varying opacity
const PIPELINE_LABELS: Record<string, string> = {
  SUBMITTED:    'Submitted',
  IN_REVIEW:    'In Review',
  PENDING_DOCS: 'Pending Docs',
  RESUBMITTED:  'Resubmitted',
  APPROVED:     'Approved',
  REJECTED:     'Rejected',
  NO_TRACKING:  'No Tracking',
};

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, primary, alert, sub }: {
  label: string; value: number | string; icon: any; primary?: boolean; alert?: boolean; sub?: string;
}) {
  return (
    <div className={`rounded-xl border bg-white p-5 shadow-sm flex items-start gap-4 ${alert ? 'border-slate-300' : 'border-slate-100'}`}>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${primary ? 'bg-primary/10' : 'bg-slate-100'}`}>
        <Icon className={`h-5 w-5 ${primary ? 'text-primary' : 'text-slate-500'}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
        <p className="text-2xl font-bold tabular-nums text-slate-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{children}</p>;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function OfficerDashboard() {
  const router   = useRouter();
  const { me }   = useAdmin();
  const [data, setData]     = useState<any>(null);
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
        <div className="h-28 rounded-xl bg-slate-100 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />)}
        </div>
        <div className="h-12 rounded-xl bg-slate-100 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-72 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-72 rounded-xl bg-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  const stats              = data?.stats        ?? { totalCases: 0, slaAlerts: 0, openEscalations: 0, awaitingApproval: 0 };
  const thisWeek           = data?.thisWeek     ?? { notes: 0, clientUpdates: 0, trackingEntries: 0 };
  const pipeline           = data?.pipeline     ?? {};
  const cases: any[]       = data?.cases        ?? [];
  const overdueTracking: any[]   = data?.overdueTracking   ?? [];
  const upcomingDeadlines: any[] = data?.upcomingDeadlines ?? [];
  const escalations: any[]       = data?.escalations       ?? [];
  const pendingApprovals: any[]  = data?.pendingApprovals  ?? [];
  const recentActivity: any[]    = data?.recentActivity    ?? [];

  const staffName = me?.name ?? 'Officer';

  const overdueIds = new Set(overdueTracking.map((t: any) => t.engagementId));
  const sortedCases = [...cases].sort((a, b) => {
    // Priority: overdue → no tracking → active
    const aScore = (overdueIds.has(a.id) ? 0 : 1) + ((a.applicationTracking?.length ?? 0) === 0 ? 0 : 2);
    const bScore = (overdueIds.has(b.id) ? 0 : 1) + ((b.applicationTracking?.length ?? 0) === 0 ? 0 : 2);
    return aScore - bScore;
  });

  const pipelineTotal = Math.max(Object.values(pipeline).reduce((s: number, v: any) => s + v, 0), 1);
  const pipelineKeys  = Object.keys(PIPELINE_LABELS).filter(k => (pipeline[k] ?? 0) > 0);

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-100 bg-white shadow-sm px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex-1 min-w-0 border-l-4 border-primary pl-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
            Processing Officer · {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
          <h1 className="text-2xl font-bold text-slate-900">{greeting(staffName)}</h1>
          <p className="text-xs text-slate-500 mt-1">{urgencyLabel(stats)}</p>
        </div>

        {/* This-week summary */}
        <div className="flex gap-6 shrink-0">
          {[
            { value: thisWeek.trackingEntries, label: 'Submissions' },
            { value: thisWeek.clientUpdates,   label: 'Updates sent' },
            { value: thisWeek.notes,           label: 'Notes added' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Assigned Cases"    value={stats.totalCases}       icon={UsersThree}       primary />
        <KpiCard label="SLA Alerts"        value={stats.slaAlerts}        icon={Warning}          alert={stats.slaAlerts > 0}        sub={stats.slaAlerts > 0 ? 'Overdue next actions' : 'All on track'} />
        <KpiCard label="Open Escalations"  value={stats.openEscalations}  icon={ArrowSquareUpRight} alert={stats.openEscalations > 0} sub={stats.openEscalations > 0 ? 'Awaiting consultant' : 'None open'} />
        <KpiCard label="Awaiting Approval" value={stats.awaitingApproval} icon={Clock}            alert={stats.awaitingApproval > 0} sub={stats.awaitingApproval > 0 ? 'Sensitive updates' : 'None pending'} />
      </div>

      {/* ── Quick Actions strip ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SectionLabel>Quick Actions</SectionLabel>
        <div className="flex flex-wrap gap-2 sm:ml-4">
          {[
            { label: 'My Caseload',   icon: UsersThree, href: '/officer/caseload'   },
            { label: 'Post a Note',   icon: Note,       href: '/officer/notes'      },
            { label: 'Escalations',   icon: Warning,    href: '/officer/escalations', badge: stats.openEscalations },
            { label: 'Stage Tracker', icon: ListChecks, href: '/officer/stages'     },
            { label: 'Documents',     icon: FileText,   href: '/officer/documents'  },
          ].map(({ label, icon: Icon, href, badge }: any) => (
            <button key={label} onClick={() => router.push(href)}
              className="relative flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
              <Icon className="h-3.5 w-3.5 text-slate-500" />
              {label}
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-800 px-1 text-[10px] font-bold text-white">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Deadlines ──────────────────────────────────────────────────────── */}
      {(overdueTracking.length > 0 || upcomingDeadlines.length > 0) && (
        <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <SectionLabel>Upcoming Deadlines</SectionLabel>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">Next actions due within 7 days</p>
            </div>
            {overdueTracking.length > 0 && (
              <span className="rounded-md bg-slate-900 text-white px-3 py-1 text-xs font-semibold">
                {overdueTracking.length} overdue
              </span>
            )}
          </div>
          <div className="divide-y divide-slate-100">
            {[...overdueTracking.slice(0, 3), ...upcomingDeadlines].map((t: any) => {
              const chip = daysChip(t.nextActionDate);
              const isOverdue = overdueIds.has(t.engagementId) && overdueTracking.some((o: any) => o.id === t.id);
              return (
                <div key={t.id} onClick={() => router.push('/officer/cases/' + t.engagementId)}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isOverdue ? 'bg-slate-900' : 'bg-slate-100'}`}>
                    <CalendarBlank className={`h-4 w-4 ${isOverdue ? 'text-white' : 'text-slate-500'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{t.engagement?.person?.name ?? '—'}</p>
                    <p className="text-xs text-slate-400">{t.portal} · {t.status?.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`rounded-md ring-1 px-2.5 py-0.5 text-xs font-semibold ${chip.cls}`}>{chip.label}</span>
                    <p className="text-xs text-slate-400 mt-0.5">{t.nextActionDate ? format(new Date(t.nextActionDate), 'MMM d') : ''}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Main two-col ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* My Caseload */}
        <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <SectionLabel>My Caseload</SectionLabel>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{cases.length} assigned · priority order</p>
            </div>
            <button onClick={() => router.push('/officer/caseload')} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {cases.length === 0 ? (
            <div className="py-12 text-center flex-1">
              <UsersThree className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">No cases assigned yet</p>
              <p className="text-xs text-slate-400 mt-1">Contact your administrator.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {sortedCases.slice(0, 10).map((c: any) => {
                const isOverdue  = overdueIds.has(c.id);
                const noTracking = (c.applicationTracking?.length ?? 0) === 0;
                const lastEntry  = c.applicationTracking?.[0];
                return (
                  <div key={c.id} onClick={() => router.push('/officer/cases/' + c.id)}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors group">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
                      {initials(c.person?.name ?? '?')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{c.person?.name ?? '—'}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {noTracking ? 'No submissions yet' : lastEntry ? `${lastEntry.portal} · ${lastEntry.status?.replace(/_/g, ' ')}` : '—'}
                      </p>
                    </div>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${
                      isOverdue    ? 'bg-slate-900 text-white ring-slate-700'
                      : noTracking ? 'bg-slate-100 text-slate-600 ring-slate-200'
                      :              'bg-slate-100 text-slate-600 ring-slate-200'
                    }`}>
                      {isOverdue ? 'Overdue' : noTracking ? 'No tracking' : 'Active'}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Pipeline breakdown */}
          {pipelineKeys.length > 0 && (
            <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                  <ChartBar className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <SectionLabel>Case Pipeline</SectionLabel>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">Submission status across caseload</p>
                </div>
              </div>
              <div className="px-5 py-4 space-y-3">
                {/* Single-color stacked bar — varying opacity */}
                <div className="flex h-2 rounded-full overflow-hidden gap-px bg-slate-100">
                  {pipelineKeys.map((k, i) => {
                    const opacity = Math.max(0.2, 1 - i * 0.15);
                    return (
                      <div key={k}
                        style={{ width: `${((pipeline[k] ?? 0) / pipelineTotal) * 100}%`, backgroundColor: `rgba(15,76,129,${opacity})` }}
                        title={`${PIPELINE_LABELS[k]}: ${pipeline[k]}`} />
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
                  {pipelineKeys.map((k, i) => {
                    const opacity = Math.max(0.3, 1 - i * 0.15);
                    return (
                      <div key={k} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: `rgba(15,76,129,${opacity})` }} />
                          <span className="text-xs text-slate-500">{PIPELINE_LABELS[k]}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-800 tabular-nums">{pipeline[k]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Recent activity */}
          <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <SectionLabel>Recent Activity</SectionLabel>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">Your latest notes and tracking updates</p>
            </div>
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center">
                <Pulse className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No activity yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {recentActivity.map((item: any) => (
                  <div key={`${item._type}-${item.id}`} onClick={() => router.push('/officer/cases/' + item.engagementId)}
                    className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      {item._type === 'note'
                        ? <Note className="h-3.5 w-3.5 text-slate-500" />
                        : <ListChecks className="h-3.5 w-3.5 text-slate-500" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-900 truncate">{item.engagement?.person?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {item._type === 'note' ? item.content : `${item.portal} · ${item.status?.replace(/_/g, ' ')}`}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400 whitespace-nowrap">{relTime(item.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Open escalations */}
          {escalations.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <SectionLabel>Open Escalations</SectionLabel>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">Awaiting consultant response</p>
                </div>
                <span className="rounded-md bg-slate-900 text-white px-2.5 py-0.5 text-xs font-bold">{escalations.length}</span>
              </div>
              <div className="divide-y divide-slate-100">
                {escalations.map((esc: any) => (
                  <div key={esc.id} onClick={() => router.push('/officer/cases/' + esc.engagementId)}
                    className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                    <Warning className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" weight="fill" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-900">{esc.engagement?.person?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-slate-400 line-clamp-1">{esc.reason}</p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400 whitespace-nowrap">{relTime(esc.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending approvals */}
          {pendingApprovals.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <SectionLabel>Awaiting Approval</SectionLabel>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">Updates not yet sent to clients</p>
                </div>
                <span className="rounded-md bg-slate-100 text-slate-700 ring-1 ring-slate-200 px-2.5 py-0.5 text-xs font-bold">{pendingApprovals.length}</span>
              </div>
              <div className="divide-y divide-slate-100">
                {pendingApprovals.map((note: any) => (
                  <div key={note.id} onClick={() => router.push('/officer/cases/' + note.engagementId)}
                    className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                    <Clock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-900">{note.engagement?.person?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-slate-400 line-clamp-1">{note.content}</p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400 whitespace-nowrap">{relTime(note.createdAt)}</span>
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
