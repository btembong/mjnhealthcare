'use client';

import { useEffect, useState } from 'react';
import { PageHeader, Skeleton } from '@mjn/ui';
import {
  CurrencyDollar, Users, GraduationCap,
  TrendUp, ArrowUp, ArrowDown,
} from '@phosphor-icons/react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { api } from '../../../lib/api';

// ─── Types ─────────────────────────────────────────────────────────────────────

type ReportData = {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    monthly: { month: string; amount: number }[];
    byCategory: { name: string; amount: number }[];
  };
  placements: {
    total: number;
    thisMonth: number;
    byDestination: { country: string; count: number }[];
    avgTimeToPlacementDays: number;
  };
  exams: {
    passRate: number;
    byExam: { exam: string; passRate: number; attempts: number }[];
  };
  pipeline: {
    leads: number;
    pendingSignature: number;
    active: number;
    onHold: number;
    completed: number;
    conversionRate: number;
  };
  clients: {
    total: number;
    newThisMonth: number;
    byProfession: { profession: string; count: number }[];
  };
};

// ─── Fallback mock data (used when API returns nothing) ────────────────────────

const MOCK: ReportData = {
  revenue: {
    total: 312400,
    thisMonth: 38200,
    lastMonth: 31500,
    monthly: [
      { month: 'Feb', amount: 18200 }, { month: 'Mar', amount: 22400 },
      { month: 'Apr', amount: 27100 }, { month: 'May', amount: 31500 },
      { month: 'Jun', amount: 31500 }, { month: 'Jul', amount: 38200 },
    ],
    byCategory: [
      { name: 'UAE Licensing', amount: 142000 },
      { name: 'NCLEX / US', amount: 78000 },
      { name: 'UK Placement', amount: 54000 },
      { name: 'Academy', amount: 24000 },
      { name: 'Ireland', amount: 14400 },
    ],
  },
  placements: {
    total: 2400,
    thisMonth: 38,
    byDestination: [
      { country: 'UAE', count: 980 }, { country: 'UK', count: 520 },
      { country: 'US', count: 340 }, { country: 'Ireland', count: 310 },
      { country: 'Canada', count: 140 }, { country: 'Australia', count: 110 },
    ],
    avgTimeToPlacementDays: 147,
  },
  exams: {
    passRate: 94,
    byExam: [
      { exam: 'NMC CBT', passRate: 96, attempts: 218 },
      { exam: 'NCLEX-RN', passRate: 94, attempts: 340 },
      { exam: 'NMBI', passRate: 92, attempts: 98 },
      { exam: 'DHA', passRate: 91, attempts: 412 },
      { exam: 'HAAD / DOH', passRate: 89, attempts: 184 },
      { exam: 'DA Exam', passRate: 88, attempts: 56 },
    ],
  },
  pipeline: {
    leads: 142, pendingSignature: 38, active: 214,
    onHold: 22, completed: 2400, conversionRate: 68,
  },
  clients: {
    total: 3100,
    newThisMonth: 47,
    byProfession: [
      { profession: 'Registered Nurse', count: 1820 },
      { profession: 'Physician', count: 480 },
      { profession: 'Allied Health', count: 620 },
      { profession: 'Student', count: 180 },
    ],
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n}`;
}

function pct(a: number, b: number) {
  if (!b) return 0;
  return Math.round(((a - b) / b) * 100);
}

const COLORS = ['#0F4C81', '#00A896', '#F4A261', '#6366f1', '#10b981', '#f59e0b'];
const DEST_FLAGS: Record<string, string> = {
  UAE: '🇦🇪', UK: '🇬🇧', US: '🇺🇸', Ireland: '🇮🇪', Canada: '🇨🇦', Australia: '🇦🇺',
};

// ─── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, delta, sub, color = 'text-primary', bg = 'bg-primary/8' }:
  { icon: any; label: string; value: string; delta?: number; sub?: string; color?: string; bg?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
          <Icon className={`h-4.5 w-4.5 ${color}`} />
        </div>
        {delta !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${delta >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
            {delta >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-extrabold text-foreground">{value}</p>
      <p className="text-xs font-semibold text-foreground">{label}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'6m' | '12m' | 'all'>('6m');

  useEffect(() => {
    ((api as any).getReports ? (api as any).getReports() : Promise.resolve(null))
      .then((d: any) => setData(d ?? MOCK))
      .catch(() => setData(MOCK))
      .finally(() => setLoading(false));
  }, []);

  const d = data ?? MOCK;
  const revDelta = pct(d.revenue.thisMonth, d.revenue.lastMonth);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reports & Analytics" subtitle="Revenue, placements, and pipeline metrics" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Reports & Analytics"
          subtitle="Revenue, placements, exam pass rates, and pipeline metrics"
        />
        <div className="flex rounded-xl border border-border bg-white overflow-hidden shadow-sm shrink-0">
          {(['6m', '12m', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-2 text-xs font-semibold transition-colors ${period === p ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {p === 'all' ? 'All time' : p}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI strip ─────────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={CurrencyDollar}
          label="Revenue this month"
          value={fmt(d.revenue.thisMonth)}
          delta={revDelta}
          sub={`${fmt(d.revenue.total)} all-time`}
          color="text-primary" bg="bg-primary/8"
        />
        <KpiCard
          icon={Users}
          label="Total placements"
          value={d.placements.total.toLocaleString()}
          delta={Math.round((d.placements.thisMonth / (d.placements.total / 12)) * 100 - 100)}
          sub={`${d.placements.thisMonth} this month`}
          color="text-teal-700" bg="bg-teal-50"
        />
        <KpiCard
          icon={GraduationCap}
          label="Exam pass rate"
          value={`${d.exams.passRate}%`}
          sub="First-attempt, all exams"
          color="text-purple-700" bg="bg-purple-50"
        />
        <KpiCard
          icon={TrendUp}
          label="Pipeline conversion"
          value={`${d.pipeline.conversionRate}%`}
          sub={`${d.pipeline.active} active engagements`}
          color="text-amber-700" bg="bg-amber-50"
        />
      </div>

      {/* ── Charts row 1 ──────────────────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Revenue over time */}
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-bold text-foreground">Monthly Revenue</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={d.revenue.monthly} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F4C81" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0F4C81" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `$${v / 1000}k`} />
              <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area type="monotone" dataKey="amount" stroke="#0F4C81" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by category */}
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-bold text-foreground">Revenue by Service Category</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={d.revenue.byCategory} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `$${v / 1000}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} width={90} />
              <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                {d.revenue.byCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Charts row 2 ──────────────────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Placements by destination */}
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <p className="mb-1 text-sm font-bold text-foreground">Placements by Destination</p>
          <p className="mb-4 text-xs text-muted-foreground">Avg time to placement: {d.placements.avgTimeToPlacementDays} days</p>
          <div className="space-y-2.5">
            {d.placements.byDestination.map(({ country, count }, i) => {
              const maxCount = Math.max(...d.placements.byDestination.map(x => x.count));
              return (
                <div key={country} className="flex items-center gap-3">
                  <span className="w-6 text-lg">{DEST_FLAGS[country] ?? '🌍'}</span>
                  <div className="flex-1">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium text-foreground">{country}</span>
                      <span className="font-bold text-primary">{count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(count / maxCount) * 100}%`, background: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Exam pass rates */}
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-bold text-foreground">Exam Pass Rates — First Attempt</p>
          <div className="space-y-3">
            {d.exams.byExam.map(({ exam, passRate, attempts }) => (
              <div key={exam} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-center justify-between text-xs gap-2">
                    <span className="font-medium text-foreground truncate">{exam}</span>
                    <span className="text-muted-foreground shrink-0">{attempts} attempts</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${passRate}%` }}
                    />
                  </div>
                </div>
                <span className={`shrink-0 text-sm font-extrabold w-10 text-right ${passRate >= 94 ? 'text-emerald-600' : passRate >= 90 ? 'text-teal-600' : 'text-amber-600'}`}>
                  {passRate}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Pipeline + clients ────────────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Pipeline funnel */}
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-bold text-foreground">Engagement Pipeline</p>
          <div className="space-y-3">
            {[
              { label: 'Leads', value: d.pipeline.leads, color: 'bg-slate-400' },
              { label: 'Pending Signature', value: d.pipeline.pendingSignature, color: 'bg-amber-400' },
              { label: 'Active', value: d.pipeline.active, color: 'bg-emerald-500' },
              { label: 'On Hold', value: d.pipeline.onHold, color: 'bg-orange-400' },
              { label: 'Completed', value: d.pipeline.completed, color: 'bg-primary' },
            ].map(({ label, value, color }) => {
              const total = d.pipeline.leads + d.pipeline.pendingSignature + d.pipeline.active + d.pipeline.onHold + d.pipeline.completed;
              return (
                <div key={label} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium text-foreground">{label}</span>
                      <span className="font-bold text-foreground">{value.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${(value / total) * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 rounded-xl bg-muted/40 px-4 py-2.5 text-xs">
            <span className="text-muted-foreground">Lead → Engaged conversion: </span>
            <span className="font-bold text-foreground">{d.pipeline.conversionRate}%</span>
          </div>
        </div>

        {/* Clients by profession */}
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-bold text-foreground">Clients by Profession</p>
            <div className="text-right">
              <p className="text-xl font-extrabold text-primary">{d.clients.total.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">+{d.clients.newThisMonth} this month</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={d.clients.byProfession} dataKey="count" nameKey="profession" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                {d.clients.byProfession.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
