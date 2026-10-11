'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { PageHeader, Skeleton } from '@mjn/ui';
import { MagnifyingGlass, CircleNotch, X, DownloadSimple, Receipt, ArrowClockwise } from '@mjn/ui';
import { api } from '../../../lib/api';
import { useAdmin } from '../../../contexts/admin-context';

// ── Shape and helpers ─────────────────────────────────────────────────────────

type State = 'waiting' | 'checking' | 'paid' | 'part_refunded' | 'refunded' | 'cancelled';
type Kind = 'order' | 'consultation';
type Attempt = {
  provider: string; ref: string; at: string;
  /** PENDING = no final answer yet · SUCCESS = the one that paid · FAILED = over, no money taken. */
  status?: 'PENDING' | 'SUCCESS' | 'FAILED';
  checkedAt?: string | null;
  /** What the provider last said, in its own words. */
  said?: string | null;
};
/** What the server records when a provider reports a payment that belongs to something else. */
const PAID_ELSEWHERE = 'paid, but for a different order';
type Row = {
  id: string; kind: Kind; state: State; status: string; clientName: string; clientEmail: string; clientPhone: string | null;
  personId: string | null; amount: number; refund: number; summary: string; createdAt: string; startedAt: string | null; paidAt: string | null;
  attempts: Attempt[];
};
type Detail = Row & {
  lines: { name: string; price: number }[];
  history: { at: string; by: string; action: string; note: string | null; amount: number | null; method: string | null }[];
  subtotal?: number; taxAmount?: number; receiptIssuedAt?: string | null; cancelReason?: string | null; refundReason?: string | null;
  refundedAt?: string | null; consultantName?: string | null; sessionStart?: string | null; forStage?: boolean;
};
type Check = { ref: string; provider?: string; status: string | null; paid: boolean; amount: number | null; currency: string | null };
const providerName = (p?: string) => (p === 'stripe' ? 'Stripe' : 'Tranzak');

const STATE: Record<State, { label: string; dot: string }> = {
  checking:      { label: 'Needs checking',      dot: 'bg-accent' },
  waiting:       { label: 'Waiting for payment', dot: 'bg-primary' },
  paid:          { label: 'Paid',                dot: 'bg-secondary' },
  part_refunded: { label: 'Paid, part refunded', dot: 'bg-secondary' },
  refunded:      { label: 'Refunded',            dot: 'bg-muted-foreground/40' },
  cancelled:     { label: 'Cancelled, not paid', dot: 'bg-muted-foreground/40' },
};
const TABS = [
  ['checking', 'Needs checking', ['checking']],
  ['waiting', 'Waiting', ['waiting']],
  ['received', 'Received', ['paid', 'part_refunded']],
  ['closed', 'Cancelled & refunded', ['cancelled', 'refunded']],
  ['all', 'All', []],
] as const;
type Tab = (typeof TABS)[number][0];
const ACTION: Record<string, string> = {
  recorded_paid: 'Recorded as paid', cancelled: 'Cancelled', refunded: 'Refund recorded',
  confirmed_auto: 'Confirmed as paid', auto_cancelled: 'Cancelled: the payment did not go through',
  paid_after_cancel: 'Paid after it was cancelled — full refund owed',
};

const card = 'rounded-2xl border border-border bg-white shadow-sm';
const heading = 'text-xs font-bold uppercase tracking-widest text-muted-foreground';
const btnPrimary = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-40';
const btnOutline = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted/60 disabled:opacity-40';
const field = 'w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';
const chip = (on: boolean) => `rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors ${on ? 'border-primary bg-primary text-white' : 'border-border bg-white text-muted-foreground hover:border-primary/40'}`;

function money(n: number) {
  return `$${Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function day(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
}
function dayTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function ago(iso: string, now: number) {
  const mins = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}
/** The one line under the status that says when. */
function when(r: Row, now: number) {
  const last = r.attempts[0];
  const provider = last?.provider === 'stripe' ? 'Stripe' : 'Tranzak';
  if (r.state === 'checking') {
    if (!last) return 'No payment reference was stored, so it cannot be checked automatically';
    if (last.said === PAID_ELSEWHERE) return `${provider} reports a payment that belongs to a different order`;
    return last.checkedAt
      ? `${provider} last answered ${ago(last.checkedAt, now)} and cannot be reached since`
      : `Payment started ${ago(last.at, now)}, not checked yet`;
  }
  if (r.state === 'waiting') {
    if (!last) return `Created ${day(r.createdAt)}, payment not started`;
    if (last.status === 'FAILED') return `Last attempt on ${day(last.at)} did not go through`;
    return last.checkedAt
      ? `${provider} says not paid yet · checked ${ago(last.checkedAt, now)}`
      : `Payment started ${ago(last.at, now)}`;
  }
  if (r.state === 'cancelled') return `Created ${day(r.createdAt)}`;
  return r.paidAt ? `Paid ${day(r.paidAt)}` : day(r.createdAt);
}
/** The line under the title: is the automatic check running? */
function autoCheckLine(stats: any, now: number) {
  const auto = stats?.autoCheck;
  if (!auto) return '';
  if (!auto.enabled) return 'Automatic checking is switched off on this server.';
  const last = auto.lastRun?.at;
  const stuck = auto.lastRun?.stoppedEarly ? ' The payment provider could not be reached on that run.' : '';
  return last
    ? `Unpaid payments are checked with Tranzak and Stripe every ${auto.everyMinutes} minutes. Last check ${ago(last, now)}.${stuck}`
    : `Unpaid payments are checked with Tranzak and Stripe every ${auto.everyMinutes} minutes. The first check runs shortly after the server starts.`;
}
function Dot({ className }: { className: string }) {
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${className}`} />;
}

function Modal({ title, sub, onClose, children }: { title: string; sub?: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-white p-6 shadow-xl sm:max-w-lg sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-foreground">{title}</h2>
            {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const { me } = useAdmin();
  const canChange = (me?.role as string)?.toUpperCase() === 'ADMIN';

  const [rows, setRows] = useState<Row[] | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [failed, setFailed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [tab, setTab] = useState<Tab>('all');
  const tabChosen = useRef(false);
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [open, setOpen] = useState<{ row: Row; autoCheck: boolean } | null>(null);
  const [exporting, setExporting] = useState(false);

  const filters = useMemo(() => ({ search: search.trim() || undefined, kind: kind || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }), [search, kind, dateFrom, dateTo]);

  const load = useCallback(async () => {
    try {
      const [list, summary] = await Promise.all([api.listPayments(filters), api.getPaymentStats()]);
      setRows(list as Row[]);
      setStats(summary);
      setNow(Date.now());
      setFailed(false);
      // Land on the work that needs doing, the first time only.
      if (!tabChosen.current) {
        tabChosen.current = true;
        if ((list as Row[]).some((r) => r.state === 'checking')) setTab('checking');
      }
    } catch {
      setFailed(true);
    }
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const count = (states: readonly string[]) => (rows ?? []).filter((r) => states.length === 0 || states.includes(r.state)).length;
  const states = TABS.find((t) => t[0] === tab)![2] as readonly string[];
  const shown = (rows ?? []).filter((r) => states.length === 0 || states.includes(r.state));
  const filtering = !!(filters.search || filters.kind || filters.dateFrom || filters.dateTo);

  async function exportCsv() {
    setExporting(true);
    try {
      const url = api.getPaymentsExportUrl({ ...filters, state: states.join(',') || undefined });
      const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('mjn_admin_token')}` } });
      if (!res.ok) throw new Error();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(await res.blob());
      a.download = `mjn-payments-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      toast.error('The export could not be downloaded.');
    } finally {
      setExporting(false);
    }
  }

  if (failed && !rows) {
    return (
      <div className="space-y-6">
        <PageHeader title="Payments" />
        <div className={`${card} p-10 text-center`}>
          <p className="text-sm font-bold text-foreground">Payments could not be loaded.</p>
          <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
          <button onClick={load} className={`${btnPrimary} mt-4`}>Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        subtitle={`Orders and paid consultations. Amounts in US dollars. ${autoCheckLine(stats, now)}`.trim()}
        actions={<button onClick={exportCsv} disabled={exporting || !rows} className={btnOutline}>{exporting ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <DownloadSimple className="h-3.5 w-3.5" />} Export this list</button>}
      />

      <div data-tour="pay-stats" className="grid gap-3 sm:grid-cols-3">
        {!stats ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />) : (
          <>
            <div className={`${card} p-4`}>
              <p className={heading}>Received this month</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{money(stats.receivedThisMonth)}</p>
              <p className="text-xs text-muted-foreground">After refunds. {money(stats.receivedTotal)} in all.</p>
            </div>
            <div className={`${card} p-4`}>
              <p className={heading}>Waiting to be paid</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{money(stats.waitingTotal)}</p>
              <p className="text-xs text-muted-foreground">{stats.waitingCount} unpaid {stats.waitingCount === 1 ? 'order or booking' : 'orders and bookings'}.</p>
            </div>
            <button onClick={() => setTab('checking')} className={`${card} p-4 text-left transition-colors hover:bg-muted/30`}>
              <p className={heading}>Need checking</p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-foreground">{stats.checkingCount > 0 && <Dot className="bg-accent" />}{stats.checkingCount}</p>
              <p className="text-xs text-muted-foreground">Unpaid, and the automatic check could not settle it.</p>
            </button>
          </>
        )}
      </div>

      <div data-tour="pay-filters" className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map(([key, label, st]) => (
            <button key={key} onClick={() => setTab(key)} className={chip(tab === key)}>{label} <span className="ml-1 opacity-70">{count(st)}</span></button>
          ))}
        </div>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative lg:w-80">
            <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email or payment reference" className={`${field} pl-9`} />
          </div>
          <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Type" className={`${field} lg:w-52`}>
            <option value="">Orders and consultations</option>
            <option value="order">Orders only</option>
            <option value="consultation">Consultations only</option>
          </select>
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} aria-label="Created from" className={field} />
            <span className="text-xs text-muted-foreground">to</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} aria-label="Created to" className={field} />
          </div>
          {filtering && <button onClick={() => { setSearch(''); setKind(''); setDateFrom(''); setDateTo(''); }} className={btnOutline}><X className="h-3.5 w-3.5" /> Clear</button>}
        </div>
      </div>

      <div data-tour="pay-table">
        {!rows ? (
          <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
        ) : shown.length === 0 ? (
          <div className={`${card} p-10 text-center`}>
            <Receipt className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
            <p className="text-sm font-bold text-foreground">
              {filtering ? 'No payments match.' : tab === 'checking' ? 'Nothing needs checking.' : tab === 'waiting' ? 'Nothing is waiting to be paid.' : 'No payments here yet.'}
            </p>
            {tab === 'checking' && !filtering && <p className="mt-1 text-sm text-muted-foreground">The system checks unpaid payments with Tranzak and Stripe by itself. One appears here only when that check cannot settle it: the provider has not answered for a while, or the payment has no reference to check.</p>}
          </div>
        ) : (
          <ul className={`${card} divide-y divide-border overflow-hidden`}>
            {shown.map((r) => (
              <li key={`${r.kind}${r.id}`} className="flex flex-col gap-2 px-4 py-3 hover:bg-muted/20 md:flex-row md:items-center md:gap-4">
                <button onClick={() => setOpen({ row: r, autoCheck: false })} className="grid min-w-0 flex-1 gap-1 text-left md:grid-cols-[1.1fr_1.3fr_auto] md:items-center md:gap-4">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-foreground">{r.clientName}</span>
                    <span className="block truncate text-xs text-muted-foreground">{r.clientEmail}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-foreground">{r.kind === 'order' ? 'Order' : 'Consultation'} · {r.kind === 'order' ? r.summary : r.summary.replace('Consultation with ', '')}</span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground"><Dot className={STATE[r.state].dot} /> <span className="font-bold text-foreground">{STATE[r.state].label}</span> · {when(r, now)}</span>
                  </span>
                  <span className="md:w-28 md:text-right">
                    <span className="block text-sm font-bold tabular-nums text-foreground">{money(r.amount)}</span>
                    {r.refund > 0 && <span className="block text-xs text-muted-foreground">{money(r.refund)} refunded</span>}
                  </span>
                </button>
                <div className="md:w-40 md:text-right">
                  {r.state === 'checking' && r.attempts[0]
                    ? <button onClick={() => setOpen({ row: r, autoCheck: true })} className={btnPrimary}><ArrowClockwise className="h-3.5 w-3.5" /> Check with {providerName(r.attempts[0].provider)}</button>
                    : <button onClick={() => setOpen({ row: r, autoCheck: false })} className={btnOutline}>Open</button>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {open && (
        <PaymentPanel
          key={`${open.row.kind}${open.row.id}`}
          row={open.row}
          autoCheck={open.autoCheck}
          canChange={canChange}
          onClose={() => setOpen(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

// ── One payment ───────────────────────────────────────────────────────────────

type Mode = null | 'hand' | 'cancel' | 'refund';

function PaymentPanel({ row, autoCheck, canChange, onClose, onChanged }: { row: Row; autoCheck: boolean; canChange: boolean; onClose: () => void; onChanged: () => void }) {
  const [d, setD] = useState<Detail | null>(null);
  const [failed, setFailed] = useState(false);
  const [checks, setChecks] = useState<Record<string, Check>>({});
  const [busy, setBusy] = useState('');
  const [mode, setMode] = useState<Mode>(null);
  const [text, setText] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const ranAuto = useRef(false);

  const load = useCallback(async () => {
    try {
      setD(await api.getPayment(row.kind, row.id) as Detail);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [row.kind, row.id]);
  useEffect(() => { load(); }, [load]);

  const check = useCallback(async (ref: string) => {
    setBusy('check' + ref);
    try {
      const res = await api.checkPayment(row.kind, row.id, ref);
      setChecks((c) => ({ ...c, [ref]: res }));
    } catch (e: any) {
      toast.error(e.message ?? 'The payment provider could not be reached.');
    } finally {
      setBusy('');
    }
  }, [row.kind, row.id]);

  useEffect(() => {
    if (!autoCheck || ranAuto.current || !d) return;
    ranAuto.current = true;
    const first = d.attempts[0];
    if (first) check(first.ref);
  }, [autoCheck, d, check]);

  async function run(key: string, work: () => Promise<{ message: string }>, failedText: string) {
    setBusy(key);
    try {
      const res = await work();
      toast.success(res.message);
      setMode(null);
      setChecks({});
      onChanged();
      await load();
    } catch (e: any) {
      toast.error(e.message ?? failedText);
    } finally {
      setBusy('');
    }
  }
  function start(next: Mode) {
    setText('');
    setMethod('');
    setAmount(next === 'refund' && d ? (d.amount - d.refund).toFixed(2) : '');
    setMode(next);
  }

  const unpaid = d ? d.state === 'waiting' || d.state === 'checking' : false;
  const refundable = d ? d.kind === 'order' && d.status === 'PAID' : false;
  const paidConsultation = d ? d.kind === 'consultation' && d.status === 'CONFIRMED' : false;
  const left = d ? d.amount - d.refund : 0;
  const refundAmount = /^\d+(\.\d{1,2})?$/.test(amount.trim()) ? Number(amount) : NaN;

  return (
    <Modal title={row.clientName} sub={`${row.kind === 'order' ? 'Order' : 'Consultation'} · ${row.id}`} onClose={onClose}>
      {failed ? (
        <div className="py-6 text-center">
          <p className="text-sm font-bold text-foreground">This payment could not be loaded.</p>
          <button onClick={load} className={`${btnPrimary} mt-3`}>Try again</button>
        </div>
      ) : !d ? (
        <div className="space-y-3"><Skeleton className="h-16 rounded-xl" /><Skeleton className="h-28 rounded-xl" /></div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-bold text-foreground"><Dot className={STATE[d.state].dot} /> {STATE[d.state].label}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {d.clientEmail}{d.clientPhone ? ` · ${d.clientPhone}` : ''}
                {d.personId && <> · <Link href={`/clients/${d.personId}`} className="font-bold text-primary hover:underline">Open client</Link></>}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold tabular-nums text-foreground">{money(d.amount)}</p>
              {d.refund > 0 && <p className="text-xs text-muted-foreground">{money(d.refund)} refunded</p>}
            </div>
          </div>

          <section>
            <p className={heading}>What it is for</p>
            {d.kind === 'order' ? (
              <ul className="mt-2 space-y-1 text-sm">
                {d.lines.map((l, i) => <li key={i} className="flex justify-between gap-3"><span className="text-foreground">{l.name}</span><span className="tabular-nums text-foreground">{money(l.price)}</span></li>)}
                {!!d.taxAmount && <li className="flex justify-between gap-3 text-muted-foreground"><span>Tax</span><span className="tabular-nums">{money(d.taxAmount)}</span></li>}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-foreground">Consultation{d.consultantName ? ` with ${d.consultantName}` : ''}{d.sessionStart ? `, ${dayTime(d.sessionStart)}` : ''}</p>
            )}
            {d.forStage && <p className="mt-1 text-xs text-muted-foreground">Raised automatically for a stage of the client’s payment plan.</p>}
            {d.receiptIssuedAt && <p className="mt-1 text-xs text-muted-foreground">Receipt issued {day(d.receiptIssuedAt)}.</p>}
            {d.cancelReason && <p className="mt-1 text-xs text-muted-foreground">Cancelled: {d.cancelReason}</p>}
            {d.refundReason && <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">Refund reason: {d.refundReason}</p>}
          </section>

          <section>
            <p className={heading}>Payment attempts</p>
            {d.attempts.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">{unpaid ? 'The client has not started a payment yet.' : 'No payment reference is stored for this.'}</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {d.attempts.map((a) => {
                  const result = checks[a.ref];
                  return (
                    <li key={a.ref} className="rounded-xl border border-border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm text-foreground">{dayTime(a.at)} · {a.provider === 'tranzak' ? 'Tranzak' : 'Stripe (card)'}</p>
                          <p className="truncate font-mono text-xs text-muted-foreground">{a.ref}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {a.status === 'SUCCESS' ? 'This is the payment that went through.'
                              : a.status === 'FAILED' ? `Did not go through${a.said ? `: ${a.said.toLowerCase()}` : ''}. No money was taken.`
                              : a.checkedAt ? `${providerName(a.provider)} last said: ${(a.said ?? 'nothing').toLowerCase()} · checked ${dayTime(a.checkedAt)}`
                              : 'Not checked with the provider yet.'}
                          </p>
                        </div>
                        <button onClick={() => check(a.ref)} disabled={!!busy} className={btnOutline}>{busy === 'check' + a.ref ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <ArrowClockwise className="h-3.5 w-3.5" />} Check with {providerName(a.provider)}</button>
                      </div>
                      {result && (
                        <div className="mt-2 border-t border-border pt-2" aria-live="polite">
                          <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                            <Dot className={result.paid ? 'bg-secondary' : 'bg-accent'} />
                            {providerName(a.provider)} says: {result.paid ? 'paid' : result.status ? (result.status.toLowerCase() === 'paid' ? 'paid, but for a different order' : result.status.toLowerCase()) : 'no record of this payment'}
                            {result.amount != null && <span className="font-normal text-muted-foreground">· {Number(result.amount).toLocaleString('en-US')} {result.currency ?? ''}</span>}
                          </p>
                          {result.paid && unpaid && (canChange
                            ? <button onClick={() => run('paid', () => api.recordPaymentPaid(d.kind, d.id, { ref: a.ref }), 'It could not be recorded as paid.')} disabled={!!busy} className={`${btnPrimary} mt-2`}>{busy === 'paid' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} Record as paid</button>
                            : <p className="mt-1 text-xs text-muted-foreground">Ask an admin to record this as paid.</p>)}
                          {result.paid && d.state === 'cancelled' && d.kind === 'order' && canChange && (
                            <button onClick={() => run('paid', () => api.recordPaymentPaid(d.kind, d.id, { ref: a.ref }), 'It could not be recorded as paid.')} disabled={!!busy} className={`${btnPrimary} mt-2`}>The client did pay — reopen as paid</button>
                          )}
                          {!result.paid && <p className="mt-1 text-xs text-muted-foreground">Nothing has been changed. If the client insists they paid, ask for their payment confirmation message.</p>}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {d.history.length > 0 && (
            <section>
              <p className={heading}>What staff did</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {d.history.map((h, i) => (
                  <li key={i}>
                    <span className="text-foreground">{ACTION[h.action] ?? h.action}{h.action === 'refunded' && h.amount != null ? ` · ${money(h.amount)}` : ''}</span>
                    <span className="text-muted-foreground"> · {dayTime(h.at)} · {h.by}</span>
                    {(h.note || h.method) && <span className="block text-xs text-muted-foreground">{[h.method, h.note].filter(Boolean).join(' — ')}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── Changing it (admins) ── */}
          {mode === 'hand' && (
            <section className="rounded-xl bg-muted/40 p-4">
              <p className="text-sm font-bold text-foreground">Record a payment received another way</p>
              <p className="mt-0.5 text-xs text-muted-foreground">For cash or a bank transfer — money that did not come through Tranzak or Stripe. {d.kind === 'order' ? 'The client is emailed their receipt.' : 'The client is emailed their confirmation and join link.'}</p>
              <label className={`${heading} mt-3 block`} htmlFor="pay-note">How was the {money(d.amount)} received?</label>
              <textarea id="pay-note" value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="For example: bank transfer on 12 October, reference 99120." className={`${field} mt-1.5`} />
              <div className="mt-3 flex justify-end gap-2">
                <button onClick={() => setMode(null)} className={btnOutline}>Go back</button>
                <button onClick={() => run('hand', () => api.recordPaymentPaid(d.kind, d.id, { note: text.trim() }), 'It could not be recorded as paid.')} disabled={!!busy || text.trim().length < 5} className={btnPrimary}>{busy === 'hand' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} Record as paid</button>
              </div>
            </section>
          )}

          {mode === 'cancel' && (
            <section className="rounded-xl bg-muted/40 p-4">
              <p className="text-sm font-bold text-foreground">{paidConsultation ? 'Cancel this paid consultation?' : `Cancel this unpaid ${d.kind === 'order' ? 'order' : 'booking'}?`}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {paidConsultation
                  ? `A full refund of ${money(d.amount)} is recorded as owed and the client is told. The money is not sent automatically: return it through Tranzak.`
                  : d.kind === 'order' ? 'The client is emailed your reason. Nothing was paid, so there is nothing to refund.' : 'The client is emailed your reason and the time opens up for someone else.'}
              </p>
              <label className={`${heading} mt-3 block`} htmlFor="pay-reason">Reason</label>
              <textarea id="pay-reason" value={text} onChange={(e) => setText(e.target.value)} rows={2} className={`${field} mt-1.5`} />
              <div className="mt-3 flex justify-end gap-2">
                <button onClick={() => setMode(null)} className={btnOutline}>Go back</button>
                <button onClick={() => run('cancel', () => api.cancelPayment(d.kind, d.id, text.trim()), 'It could not be cancelled.')} disabled={!!busy || text.trim().length < 3} className={btnPrimary}>{busy === 'cancel' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} {paidConsultation ? 'Cancel and record refund' : 'Cancel it'}</button>
              </div>
            </section>
          )}

          {mode === 'refund' && (
            <section className="rounded-xl bg-muted/40 p-4">
              <p className="text-sm font-bold text-foreground">Record a refund</p>
              <p className="mt-0.5 text-xs text-muted-foreground">This records the refund and emails the client. It does not send money: return it through Tranzak or the bank first, then record it here. Up to {money(left)} can be refunded.</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className={heading} htmlFor="pay-amount">Amount (USD)</label>
                  <input id="pay-amount" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className={`${field} mt-1.5`} />
                </div>
                <div>
                  <label className={heading} htmlFor="pay-method">Returned by</label>
                  <input id="pay-method" value={method} onChange={(e) => setMethod(e.target.value)} placeholder="Tranzak to MTN MoMo" className={`${field} mt-1.5`} />
                </div>
              </div>
              <label className={`${heading} mt-3 block`} htmlFor="pay-why">Reason (the client sees this)</label>
              <textarea id="pay-why" value={text} onChange={(e) => setText(e.target.value)} rows={2} className={`${field} mt-1.5`} />
              {refundAmount > left && <p className="mt-2 text-xs font-bold text-foreground" role="alert">That is more than the {money(left)} left on this order.</p>}
              {refundAmount === left && <p className="mt-2 text-xs text-muted-foreground">This refunds the order in full and closes it. The client can order these services again.</p>}
              <div className="mt-3 flex justify-end gap-2">
                <button onClick={() => setMode(null)} className={btnOutline}>Go back</button>
                <button onClick={() => run('refund', () => api.recordPaymentRefund(d.id, { amount: refundAmount, reason: text.trim(), method: method.trim() }), 'The refund could not be recorded.')} disabled={!!busy || !(refundAmount > 0) || refundAmount > left || text.trim().length < 3 || method.trim().length < 3} className={btnPrimary}>{busy === 'refund' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} Record refund</button>
              </div>
            </section>
          )}

          {!mode && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
              {canChange ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {(unpaid || paidConsultation) && <button onClick={() => start('cancel')} className={btnOutline}>{paidConsultation ? 'Cancel and refund' : d.kind === 'order' ? 'Cancel order' : 'Cancel booking'}</button>}
                    {refundable && left > 0 && <button onClick={() => start('refund')} className={btnOutline}>Record a refund</button>}
                  </div>
                  {unpaid && <button onClick={() => start('hand')} className={btnOutline}>Record a payment by hand</button>}
                </>
              ) : (
                <p className="text-xs text-muted-foreground">You can view and check payments. Only an admin can record, cancel or refund one.</p>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
