'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@mjn/ui';
import {
  UsersThree, Warning, ArrowSquareUpRight, CheckCircle,
  Clock, Note, ArrowRight, Pulse, ListChecks,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';
import { formatDistanceToNow, isPast, format } from 'date-fns';

function relTime(ts: string) {
  try { return formatDistanceToNow(new Date(ts), { addSuffix: true }); } catch { return '—'; }
}

function initials(name: string) {
  if (!name) return '?';
  const p = name.trim().split(' ').filter(Boolean);
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : p[0].slice(0, 2).toUpperCase();
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
        <div className="h-20 rounded-2xl bg-muted animate-pulse" />
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
      {/* Header */}
      <div className="rounded-2xl border border-border bg-white px-6 py-4 shadow-sm flex items-center gap-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">My Dashboard</h1>
          <p className="text-xs text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        {stats.slaAlerts > 0 && (
          <div className="ml-auto flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2">
            <Warning className="h-4 w-4 text-rose-600" weight="fill" />
            <span className="text-xs font-semibold text-rose-700">{stats.slaAlerts} overdue action{stats.slaAlerts > 1 ? 's' : ''} need attention</span>
          </div>
        )}
        {stats.slaAlerts === 0 && (
          <div className="ml-auto flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2">
            <CheckCircle className="h-4 w-4 text-emerald-600" weight="fill" />
            <span className="text-xs font-semibold text-emerald-700">All actions on track</span>
          </div>
        )}
      </div>

      {/* KPI cards */}
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
          sub={stats.openEscalations > 0 ? 'Awaiting consultant response' : 'None open'}
        />
        <StatCard
          label="Awaiting Approval"
          value={stats.awaitingApproval}
          icon={Clock}
          color={stats.awaitingApproval > 0 ? 'text-violet-600 border-violet-200' : 'text-muted-foreground'}
          sub={stats.awaitingApproval > 0 ? 'Sensitive updates pending' : 'None pending'}
        />
      </div>

      {/* Cases needing attention + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Cases needing attention */}
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
              <p className="text-xs text-muted-foreground mt-1">Contact your administrator to get cases assigned.</p>
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
                        {noTracking
                          ? 'No submissions yet'
                          : lastTracking
                          ? `${lastTracking.portal} · ${lastTracking.status}`
                          : c.person?.profession ?? '—'}
                      </p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {isOverdue && (
                        <span className="rounded-full bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 text-xs font-semibold">
                          Overdue
                        </span>
                      )}
                      {noTracking && !isOverdue && (
                        <span className="rounded-full bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 text-xs font-semibold">
                          No tracking
                        </span>
                      )}
                      {!isOverdue && !noTracking && (
                        <span className="rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-xs font-semibold">
                          Active
                        </span>
                      )}
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: recent activity + escalations */}
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
              <div className="divide-y divide-border max-h-64 overflow-y-auto">
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
                      <p className="text-xs font-semibold text-foreground truncate">
                        {item.engagement?.person?.name ?? 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {item._type === 'note'
                          ? item.content
                          : `${item.portal} · ${item.status}`}
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
                <p className="text-xs text-violet-600 mt-0.5">Sensitive updates you submitted — not yet sent to clients</p>
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
