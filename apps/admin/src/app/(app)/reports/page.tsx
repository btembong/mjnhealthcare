'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { PageHeader, Skeleton } from '@mjn/ui';
import { DownloadSimple, ArrowUp, ArrowDown, CircleNotch } from '@mjn/ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../../../lib/api';

// ── Shape ─────────────────────────────────────────────────────────────────────

type Ranked = { name: string; count: number };
type Report = {
  period: string; from: string; to: string; prevFrom: string; prevTo: string; generatedAt: string;
  money: {
    received: number; receivedBefore: number; orders: number; consultations: number; payments: number; refunded: number;
    waitingNow: number; waitingCount: number; byCategory: { name: string; amount: number }[]; monthly: { month: string; received: number }[];
  };
  leads?: { arrived: number; arrivedBefore: number; booked: number; held: number; missed: number; converted: number; lost: number; conversionRate: number | null };
  cases?: {
    started: number; startedBefore: number; completed: number; quiet: number;
    now: { active: number; onHold: number; awaitingSignature: number; completed: number; terminated: number };
    byStage: Ranked[]; byDestination: Ranked[];
  };
  service?: {
    documentsChecked: number; documentsWaiting: number; oldestWaitingSince: string | null; supportRequests: number;
    supportAnsweredOnTime: number | null; supportTargetHours: number; sessionsHeld: number; sessionsMissed: number;
  };
};

const PERIODS = [
  ['this_month', 'This month'], ['last_month', 'Last month'], ['last_3_months', 'Last 3 months'],
  ['last_12_months', 'Last 12 months'], ['this_year', 'This year'],
] as const;

/** The brand blue. One colour for every bar: the labels, not the colour, say what each bar is. */
const BLUE = '#0F4C81';
const ZONE = 'Africa/Douala';

const card = 'rounded-2xl border border-border bg-white shadow-sm';
const heading = 'text-xs font-bold uppercase tracking-widest text-muted-foreground';
const btnPrimary = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-40';
const btnOutline = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted/60 disabled:opacity-40';
const field = 'rounded-xl border border-border bg-white px-3 py-2 text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';
const link = 'text-xs font-bold text-primary hover:underline';

function money(n: number) {
  return `$${Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function shortMoney(n: number) {
  return n >= 1000 ? `$${(n / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k` : `$${Math.round(n)}`;
}
function day(iso: string | number, withYear = true) {
  return new Date(iso).toLocaleDateString('en-GB', { timeZone: ZONE, day: 'numeric', month: 'short', year: withYear ? 'numeric' : undefined });
}
/** "1 – 11 Oct 2026". A period's end is the first moment after it, so a finished period ends the day before. */
function span(from: string, to: string, running: boolean) {
  const last = running ? new Date(to).getTime() : new Date(to).getTime() - 1;
  return `${day(from, false)} – ${day(last)}`;
}
function monthLabel(key: string, long = false) {
  const [y, m] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-GB', { timeZone: 'UTC', month: long ? 'long' : 'short', year: long ? 'numeric' : undefined });
}
function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

// ── Small pieces ──────────────────────────────────────────────────────────────

/** How a figure compares with the period before, in words. Never a bare coloured arrow. */
function Change({ now, before }: { now: number; before: number }) {
  if (before === 0) return <p className="text-xs text-muted-foreground">{now === 0 ? 'Same as the period before' : 'Nothing in the period before'}</p>;
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) return <p className="text-xs text-muted-foreground">Same as the period before</p>;
  const Icon = pct > 0 ? ArrowUp : ArrowDown;
  return (
    <p className="flex items-center gap-1 text-xs text-muted-foreground">
      <Icon className="h-3 w-3" /> <span className="font-bold text-foreground">{Math.abs(pct)}% {pct > 0 ? 'more' : 'less'}</span> than the period before
    </p>
  );
}

function Tile({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <div className={`${card} p-4`}>
      <p className={heading}>{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{value}</p>
      {children}
    </div>
  );
}

function Section({ title, tour, note, to, toLabel, children }: { title: string; tour: string; note: string; to?: string; toLabel?: string; children: ReactNode }) {
  return (
    <section data-tour={tour} className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        {to && <Link href={to} className={link}>{toLabel}</Link>}
      </div>
      {children}
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer font-bold hover:text-foreground">How this is counted</summary>
        <p className="mt-1 max-w-3xl leading-relaxed">{note}</p>
      </details>
    </section>
  );
}

/** Ranked horizontal bars: name on the left, the figure in plain text on the right. */
function Bars({ title, rows, format, empty }: { title: string; rows: { name: string; value: number }[]; format: (n: number) => string; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className={`${card} p-4`}>
      <p className={heading}>{title}</p>
      {rows.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">{empty}</p> : (
        <ul className="mt-3 space-y-2.5">
          {rows.map((r) => (
            <li key={r.name}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-foreground">{r.name}</span>
                <span className="shrink-0 font-bold tabular-nums text-foreground">{format(r.value)}</span>
              </div>
              <div className="mt-1 h-2 rounded bg-muted" aria-hidden="true">
                <div className="h-2 rounded" style={{ width: `${Math.max(2, (r.value / max) * 100)}%`, background: BLUE }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [period, setPeriod] = useState<string>('this_month');
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [asTable, setAsTable] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.getReports(period) as Report);
      setFailed(false);
    } catch {
      // No stand-in figures: a report that cannot load shows nothing rather than something untrue.
      setData(null);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [period]);
  useEffect(() => { load(); }, [load]);

  const running = period !== 'last_month';

  function exportCsv() {
    if (!data) return;
    const rows: [string, string, string | number][] = [];
    const add = (section: string, figure: string, value: string | number | null | undefined) => rows.push([section, figure, value ?? '']);
    const m = data.money;
    add('Money', 'Received (USD)', m.received.toFixed(2));
    add('Money', 'Received in the period before (USD)', m.receivedBefore.toFixed(2));
    add('Money', 'From orders (USD)', m.orders.toFixed(2));
    add('Money', 'From consultations (USD)', m.consultations.toFixed(2));
    add('Money', 'Refunded (USD)', m.refunded.toFixed(2));
    add('Money', 'Waiting to be paid now (USD)', m.waitingNow.toFixed(2));
    m.byCategory.forEach((c) => add('Money by category', c.name, c.amount.toFixed(2)));
    m.monthly.forEach((x) => add('Money by month', monthLabel(x.month, true), x.received.toFixed(2)));
    if (data.leads) {
      const l = data.leads;
      add('Leads', 'New leads', l.arrived); add('Leads', 'Booked a free consultation', l.booked); add('Leads', 'Free consultation held', l.held);
      add('Leads', 'Free consultation missed', l.missed); add('Leads', 'Became a client', l.converted); add('Leads', 'Lost', l.lost);
      add('Leads', 'Became a client (%)', l.conversionRate);
    }
    if (data.cases) {
      const c = data.cases;
      add('Cases', 'Started', c.started); add('Cases', 'Completed', c.completed); add('Cases', 'Active now', c.now.active); add('Cases', 'On hold now', c.now.onHold);
      add('Cases', 'Awaiting signature now', c.now.awaitingSignature); add('Cases', 'Quiet for 14 days or more', c.quiet);
      c.byStage.forEach((s) => add('Active cases by stage', s.name, s.count));
      c.byDestination.forEach((s) => add('Active cases by destination', s.name, s.count));
    }
    if (data.service) {
      const s = data.service;
      add('Service', 'Documents checked', s.documentsChecked); add('Service', 'Documents waiting now', s.documentsWaiting);
      add('Service', 'Support requests', s.supportRequests); add('Service', `Answered within ${s.supportTargetHours} hours (%)`, s.supportAnsweredOnTime);
      add('Service', 'Paid sessions held', s.sessionsHeld); add('Service', 'Paid sessions missed by client', s.sessionsMissed);
    }
    const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const head = [`"MJN Healthcare report"`, cell(span(data.from, data.to, running)), ''].join(',');
    const csv = ['﻿' + head, ['Section', 'Figure', 'Value'].map(cell).join(','), ...rows.map((r) => r.map(cell).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `mjn-report-${data.period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success('Report downloaded.');
  }

  const m = data?.money;
  const chart = (m?.monthly ?? []).map((x) => ({ ...x, label: monthLabel(x.month) }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        subtitle={data ? `${span(data.from, data.to, running)}, compared with ${span(data.prevFrom, data.prevTo, running)}. Douala time.` : 'How the business is doing, from figures the system records.'}
        actions={
          <>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Period" className={field}>
              {PERIODS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <button onClick={exportCsv} disabled={!data || loading} className={btnOutline}><DownloadSimple className="h-3.5 w-3.5" /> Export</button>
          </>
        }
      />

      {failed ? (
        <div className={`${card} p-10 text-center`}>
          <p className="text-sm font-bold text-foreground">The report could not be loaded.</p>
          <p className="mt-1 text-sm text-muted-foreground">No figures are shown, so nothing here can be mistaken for real numbers. Check your connection and try again.</p>
          <button onClick={load} className={`${btnPrimary} mt-4`}>Try again</button>
        </div>
      ) : !data || !m ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : (
        <div className={`space-y-10 ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
          {loading && <p className="flex items-center gap-2 text-xs text-muted-foreground"><CircleNotch className="h-3.5 w-3.5 animate-spin" /> Updating…</p>}

          {/* ── Money ── */}
          <Section
            title="Money" tour="rep-money" to="/payments" toLabel="Open Payments"
            note="Money is counted on the day it was paid, less anything refunded on that payment since, with paid consultations included. This is the same counting the Payments page uses, so the two agree. “Refunded” is refunds recorded during the period, whenever the original payment was made. Categories show the price of each service on orders paid in the period, before tax; fully refunded orders are left out. Amounts are US dollars."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Tile label="Received" value={money(m.received)}><Change now={m.received} before={m.receivedBefore} /></Tile>
              <Tile label="From orders" value={money(m.orders)}><p className="text-xs text-muted-foreground">{m.payments} {m.payments === 1 ? 'payment' : 'payments'} in all</p></Tile>
              <Tile label="From consultations" value={money(m.consultations)} />
              <Tile label="Refunded" value={money(m.refunded)}><p className="text-xs text-muted-foreground">{money(m.waitingNow)} is waiting to be paid now</p></Tile>
            </div>
            <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
              <div className={`${card} p-4`}>
                <div className="flex items-center justify-between gap-3">
                  <p className={heading}>Received each month, last 12 months</p>
                  <button onClick={() => setAsTable(!asTable)} className={link}>{asTable ? 'Show as chart' : 'Show as table'}</button>
                </div>
                {asTable ? (
                  <table className="mt-3 w-full text-sm">
                    <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1 font-bold">Month</th><th className="py-1 text-right font-bold">Received</th></tr></thead>
                    <tbody className="divide-y divide-border">
                      {m.monthly.map((x) => <tr key={x.month}><td className="py-1.5 text-foreground">{monthLabel(x.month, true)}</td><td className="py-1.5 text-right font-bold tabular-nums text-foreground">{money(x.received)}</td></tr>)}
                    </tbody>
                  </table>
                ) : m.monthly.every((x) => x.received === 0) ? (
                  <p className="mt-3 text-sm text-muted-foreground">No money has been received in the last 12 months.</p>
                ) : (
                  <div className="mt-3 h-56" role="img" aria-label={`Bar chart of money received each month. ${m.monthly.map((x) => `${monthLabel(x.month, true)}: ${money(x.received)}`).join('. ')}.`}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chart} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barCategoryGap="28%">
                        <CartesianGrid vertical={false} stroke="#EEF1F4" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#E5E7EB' }} interval={0} />
                        <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} tickFormatter={shortMoney} width={48} />
                        <Tooltip
                          cursor={{ fill: '#F3F4F6' }}
                          formatter={(v: any) => [money(Number(v)), 'Received']}
                          labelFormatter={(_, items: any) => (items?.[0]?.payload?.month ? monthLabel(items[0].payload.month, true) : '')}
                          contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #E5E7EB', boxShadow: 'none' }}
                        />
                        <Bar dataKey="received" fill={BLUE} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              <Bars title="Orders by service category" rows={m.byCategory.map((c) => ({ name: c.name, value: c.amount }))} format={money} empty="No orders were paid in this period." />
            </div>
          </Section>

          {/* ── Leads ── */}
          {data.leads && (() => {
            const l = data.leads;
            const steps: [string, number][] = [['New leads', l.arrived], ['Booked a free consultation', l.booked], ['Consultation held', l.held], ['Became a client', l.converted]];
            return (
              <Section
                title="Leads" tour="rep-leads" to="/leads" toLabel="Open Leads"
                note="This follows the people who first got in touch during the period and shows how far each has got so far, so recent periods keep improving as leads move on. “Consultation held” counts only consultations a member of staff marked as attended. Figures for older leads may be low, because attendance was not recorded before the Free consultations page was rebuilt."
              >
                <div className={`${card} p-4`}>
                  <ol className="grid gap-4 sm:grid-cols-4">
                    {steps.map(([label, value], i) => (
                      <li key={label}>
                        <p className={heading}>{i + 1}. {label}</p>
                        <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{value}</p>
                        {i === 0 ? <Change now={l.arrived} before={l.arrivedBefore} />
                          : <p className="text-xs text-muted-foreground">{l.arrived ? `${Math.round((value / l.arrived) * 100)}% of new leads` : 'No new leads'}</p>}
                      </li>
                    ))}
                  </ol>
                  <p className="mt-4 border-t border-border pt-3 text-sm text-foreground">
                    {l.conversionRate === null ? 'No new leads arrived in this period.' : <><span className="font-bold">{l.conversionRate}%</span> of new leads have become clients so far.</>}
                    {l.missed > 0 && <> {l.missed} missed their free consultation.</>}
                    {l.lost > 0 && <> {l.lost} {l.lost === 1 ? 'was' : 'were'} marked as lost.</>}
                  </p>
                </div>
              </Section>
            );
          })()}

          {/* ── Cases ── */}
          {data.cases && (() => {
            const c = data.cases;
            return (
              <Section
                title="Cases" tour="rep-cases" to="/caseload" toLabel="Open Caseload"
                note="“Started” counts cases opened in the period. The system does not store the date a case was completed, so “Completed” counts completed cases whose record last changed in the period — treat it as approximate. Active, on hold and awaiting signature are the position right now, not for the period. Stage names and the “quiet” rule (no activity for 14 days) are the same ones the Caseload page uses."
              >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Tile label="Started" value={String(c.started)}><Change now={c.started} before={c.startedBefore} /></Tile>
                  <Tile label="Completed" value={String(c.completed)}><p className="text-xs text-muted-foreground">Approximate; see below</p></Tile>
                  <Tile label="Active now" value={String(c.now.active)}><p className="text-xs text-muted-foreground">{c.now.onHold} on hold · {c.now.awaitingSignature} awaiting signature</p></Tile>
                  <Tile label="Quiet for 14 days or more" value={String(c.quiet)}><p className="text-xs text-muted-foreground">Active cases with no recent activity</p></Tile>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  <Bars title="Where active cases are now" rows={c.byStage.map((s) => ({ name: s.name, value: s.count }))} format={String} empty="There are no active cases." />
                  <Bars title="Active cases by destination" rows={c.byDestination.map((s) => ({ name: s.name, value: s.count }))} format={String} empty="There are no active cases." />
                </div>
              </Section>
            );
          })()}

          {/* ── Service ── */}
          {data.service && (() => {
            const s = data.service;
            const oldest = s.oldestWaitingSince ? daysSince(s.oldestWaitingSince) : null;
            return (
              <Section
                title="Service" tour="rep-service"
                note={`Documents checked are those verified or rejected in the period. A support request counts as answered on time when its first reply from staff came within ${s.supportTargetHours} hours of it being raised; requests newer than that and not yet answered are left out until they are due. Sessions are paid consultations whose time fell in the period.`}
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  <Tile label="Documents checked" value={String(s.documentsChecked)}>
                    <p className="text-xs text-muted-foreground">{s.documentsWaiting} waiting now{oldest !== null && s.documentsWaiting > 0 ? `, the oldest for ${oldest === 0 ? 'less than a day' : oldest === 1 ? '1 day' : `${oldest} days`}` : ''}</p>
                    <Link href="/documents" className={`${link} mt-1 inline-block`}>Open Documents</Link>
                  </Tile>
                  <Tile label="Support requests" value={String(s.supportRequests)}>
                    <p className="text-xs text-muted-foreground">{s.supportAnsweredOnTime === null ? 'None due for an answer yet' : `${s.supportAnsweredOnTime}% answered within ${s.supportTargetHours} hours`}</p>
                    <Link href="/tickets" className={`${link} mt-1 inline-block`}>Open Support requests</Link>
                  </Tile>
                  <Tile label="Paid sessions held" value={String(s.sessionsHeld)}>
                    <p className="text-xs text-muted-foreground">{s.sessionsMissed} missed by the client</p>
                    <Link href="/sessions" className={`${link} mt-1 inline-block`}>Open Sessions</Link>
                  </Tile>
                </div>
              </Section>
            );
          })()}

          {!data.leads && <p className="text-xs text-muted-foreground">You see the money section. Leads, cases and service figures are shown to admins.</p>}
          <p className="text-xs text-muted-foreground">Exam results and job placements are not shown because the system does not record them yet.</p>
        </div>
      )}
    </div>
  );
}
