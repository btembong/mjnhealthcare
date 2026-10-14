'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { PageHeader, Skeleton } from '@mjn/ui';
import { MagnifyingGlass, CircleNotch, X, DownloadSimple, Receipt, ArrowClockwise } from '@mjn/ui';
import { api } from '../../../lib/api';
import { useAdmin } from '../../../contexts/admin-context';

// ── Shape and helpers ─────────────────────────────────────────────────────────

type State = 'waiting' | 'checking' | 'to_confirm' | 'paid' | 'part_refunded' | 'refunded' | 'cancelled';
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
  /** Orders: dollars received by hand and confirmed, and recorded payments waiting for an admin. */
  received: number; toConfirm: number;
};
/** Money received outside Tranzak and Stripe, recorded by staff. */
type Manual = {
  id: string; method: string; methodLabel: string; amount: number; currency: string; rate: number | null; amountUsd: number;
  receivedAt: string; reference: string | null; note: string | null; proof: { name: string; type: string } | null;
  status: 'RECORDED' | 'CONFIRMED' | 'VOIDED'; recordedBy: string | null; recordedById: string; recordedAt: string;
  confirmedBy: string | null; confirmedAt: string | null; voidedBy: string | null; voidedAt: string | null; voidReason: string | null;
};
type Detail = Row & {
  lines: { name: string; price: number }[];
  history: { at: string; by: string; action: string; note: string | null; amount: number | null; method: string | null }[];
  subtotal?: number; taxAmount?: number; receiptIssuedAt?: string | null; cancelReason?: string | null; refundReason?: string | null;
  refundedAt?: string | null; consultantName?: string | null; sessionStart?: string | null; forStage?: boolean;
  manualPayments?: Manual[];
};
type Check = { ref: string; provider?: string; status: string | null; paid: boolean; amount: number | null; currency: string | null };
const providerName = (p?: string) => (p === 'stripe' ? 'Stripe' : 'Tranzak');

const STATE: Record<State, { label: string; dot: string }> = {
  checking:      { label: 'Needs checking',      dot: 'bg-accent' },
  to_confirm:    { label: 'Payment to confirm',  dot: 'bg-primary' },
  waiting:       { label: 'Waiting for payment', dot: 'bg-primary' },
  paid:          { label: 'Paid',                dot: 'bg-secondary' },
  part_refunded: { label: 'Paid, part refunded', dot: 'bg-secondary' },
  refunded:      { label: 'Refunded',            dot: 'bg-muted-foreground/40' },
  cancelled:     { label: 'Cancelled, not paid', dot: 'bg-muted-foreground/40' },
};
const TABS = [
  ['confirm', 'To confirm', ['to_confirm']],
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
  manual_recorded: 'Payment recorded by hand', manual_confirmed: 'Payment confirmed', manual_voided: 'Recorded payment voided',
  manual_proof_viewed: 'Proof of payment opened',
};
const MANUAL_METHODS: [string, string][] = [
  ['BANK_TRANSFER', 'Bank transfer'], ['CASH', 'Cash at our office'], ['MOBILE_MONEY', 'Mobile money to our number'], ['CHEQUE', 'Cheque'], ['OTHER', 'Other'],
];
const PROOF_EXT = /\.(pdf|jpe?g|png)$/i;
const MAX_PROOF = 20 * 1024 * 1024;

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
  if (r.state === 'to_confirm') {
    const n = r.toConfirm === 1 ? '1 payment' : `${r.toConfirm} payments`;
    return `${n} recorded by hand, waiting for an admin${r.received > 0 ? ` · ${money(r.received)} already confirmed` : ''}`;
  }
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
  const role = (me?.role as string)?.toUpperCase() ?? '';
  const canChange = role === 'ADMIN';
  // Finance staff may record money received by hand; an admin confirms it.
  const canRecord = canChange || role === 'FINANCE';

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
      // Land on the work that needs doing, the first time only. A link can open one order.
      if (!tabChosen.current) {
        tabChosen.current = true;
        const linked = new URLSearchParams(window.location.search).get('order');
        const target = linked ? (list as Row[]).find((r) => r.kind === 'order' && r.id === linked) : undefined;
        if (target) setOpen({ row: target, autoCheck: false });
        if (canChange && (list as Row[]).some((r) => r.state === 'to_confirm')) setTab('confirm');
        else if ((list as Row[]).some((r) => r.state === 'checking')) setTab('checking');
      }
    } catch {
      setFailed(true);
    }
  }, [filters, canChange]);

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
              {filtering ? 'No payments match.' : tab === 'confirm' ? 'No payments are waiting to be confirmed.' : tab === 'checking' ? 'Nothing needs checking.' : tab === 'waiting' ? 'Nothing is waiting to be paid.' : 'No payments here yet.'}
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
                    {r.received > 0 && <span className="block text-xs text-muted-foreground">{money(r.received)} received</span>}
                  </span>
                </button>
                <div className="md:w-40 md:text-right">
                  {r.state === 'to_confirm' && canChange
                    ? <button onClick={() => setOpen({ row: r, autoCheck: false })} className={btnPrimary}>Review and confirm</button>
                    : r.state === 'checking' && r.attempts[0]
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
          canRecord={canRecord}
          meId={me?.id ?? ''}
          onClose={() => setOpen(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

// ── One payment ───────────────────────────────────────────────────────────────

type Mode = null | 'hand' | 'manual' | 'cancel' | 'refund';

function PaymentPanel({ row, autoCheck, canChange, canRecord, meId, onClose, onChanged }: { row: Row; autoCheck: boolean; canChange: boolean; canRecord: boolean; meId: string; onClose: () => void; onChanged: () => void }) {
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

  const unpaid = d ? d.state === 'waiting' || d.state === 'checking' || d.state === 'to_confirm' : false;
  const manual = d?.manualPayments ?? [];
  const settled = async (message: string) => { toast.success(message); setMode(null); onChanged(); await load(); };
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
              {unpaid && d.received > 0 && <p className="text-xs text-muted-foreground">{money(d.received)} received · {money(Math.max(0, d.amount - d.received))} left</p>}
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

          {d.kind === 'order' && manual.length > 0 && (
            <ManualList payments={manual} orderUnpaid={unpaid} canChange={canChange} meId={meId} onDone={settled} />
          )}

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

          {mode === 'manual' && <ManualForm d={d} onCancel={() => setMode(null)} onDone={settled} />}

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
                    {(unpaid || paidConsultation) && !(d.kind === 'order' && (d.received > 0 || d.toConfirm > 0)) && <button onClick={() => start('cancel')} className={btnOutline}>{paidConsultation ? 'Cancel and refund' : d.kind === 'order' ? 'Cancel order' : 'Cancel booking'}</button>}
                    {refundable && left > 0 && <button onClick={() => start('refund')} className={btnOutline}>Record a refund</button>}
                  </div>
                  {unpaid && (d.kind === 'order'
                    ? <button onClick={() => start('manual')} className={btnPrimary}>Record a payment</button>
                    : <button onClick={() => start('hand')} className={btnOutline}>Record a payment by hand</button>)}
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">You can view, check and record payments. An admin confirms what you record, and cancels or refunds.</p>
                  {canRecord && unpaid && d.kind === 'order' && <button onClick={() => start('manual')} className={btnPrimary}>Record a payment</button>}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ── Money received by hand ────────────────────────────────────────────────────

/** Opens a short-lived file link in a new tab without the browser treating it as a pop-up. */
async function openInNewTab(getUrl: () => Promise<string>) {
  const win = window.open('about:blank', '_blank');
  if (win) win.opener = null;
  try {
    const url = await getUrl();
    if (win) win.location.href = url; else window.location.href = url;
  } catch (e: any) {
    win?.close();
    toast.error(e.message ?? 'The file could not be opened.');
  }
}

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function asReceived(p: Manual) {
  return p.currency === 'USD' ? money(p.amountUsd) : `${p.amount.toLocaleString('en-US')} XAF = ${money(p.amountUsd)}`;
}

function ManualList({ payments, orderUnpaid, canChange, meId, onDone }: {
  payments: Manual[]; orderUnpaid: boolean; canChange: boolean; meId: string; onDone: (message: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState('');
  const [confirming, setConfirming] = useState('');
  const [voiding, setVoiding] = useState('');
  const [reason, setReason] = useState('');

  async function act(key: string, work: () => Promise<{ message: string }>) {
    setBusy(key);
    try {
      const res = await work();
      setConfirming(''); setVoiding(''); setReason('');
      await onDone(res.message);
    } catch (e: any) {
      toast.error(e.message ?? 'That did not work. Try again.');
    } finally {
      setBusy('');
    }
  }

  return (
    <section>
      <p className={heading}>Received by hand</p>
      <ul className="mt-2 space-y-2">
        {payments.map((p) => {
          const canConfirm = canChange && p.status === 'RECORDED' && orderUnpaid;
          const canVoid = p.status !== 'VOIDED' && (p.status === 'RECORDED' ? canChange || p.recordedById === meId : canChange && orderUnpaid);
          return (
            <li key={p.id} className={`rounded-xl border border-border p-3 ${p.status === 'VOIDED' ? 'opacity-60' : ''}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">{p.methodLabel} · {asReceived(p)}</p>
                  <p className="text-xs text-muted-foreground">
                    Received {day(p.receivedAt)}{p.reference ? <> · ref <span className="font-mono">{p.reference}</span></> : null}{p.currency === 'XAF' && p.rate ? ` · rate ${p.rate}` : ''}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {p.status === 'RECORDED' && <>Recorded by {p.recordedBy} {dayTime(p.recordedAt)}. <span className="font-bold text-foreground">Waiting for an admin to confirm.</span></>}
                    {p.status === 'CONFIRMED' && <>Recorded by {p.recordedBy}, confirmed by {p.confirmedBy} {p.confirmedAt ? dayTime(p.confirmedAt) : ''}.</>}
                    {p.status === 'VOIDED' && <>Voided by {p.voidedBy}{p.voidReason ? `: ${p.voidReason}` : ''}. It does not count.</>}
                  </p>
                  {p.note && <p className="mt-0.5 text-xs text-muted-foreground">Note: {p.note}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.proof && <button onClick={() => openInNewTab(async () => (await api.getManualProofUrl(p.id)).url)} className={btnOutline}>View proof</button>}
                  {canConfirm && confirming !== p.id && <button onClick={() => { setConfirming(p.id); setVoiding(''); }} disabled={!!busy} className={btnPrimary}>Confirm</button>}
                  {canVoid && voiding !== p.id && <button onClick={() => { setVoiding(p.id); setConfirming(''); setReason(''); }} disabled={!!busy} className={btnOutline}>Void</button>}
                </div>
              </div>
              {confirming === p.id && (
                <div className="mt-3 rounded-lg bg-muted/40 p-3">
                  <p className="text-sm text-foreground">Confirm {money(p.amountUsd)} received by {p.methodLabel.toLowerCase()}?</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Check it in the bank account or the till first. Once confirmed it counts towards the order, and the client is emailed.</p>
                  <div className="mt-2 flex justify-end gap-2">
                    <button onClick={() => setConfirming('')} className={btnOutline}>Go back</button>
                    <button onClick={() => act('confirm' + p.id, () => api.confirmManualPayment(p.id))} disabled={!!busy} className={btnPrimary}>{busy === 'confirm' + p.id && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} Yes, the money is there</button>
                  </div>
                </div>
              )}
              {voiding === p.id && (
                <div className="mt-3 rounded-lg bg-muted/40 p-3">
                  <label className={heading} htmlFor={`void-${p.id}`}>Why is this being voided?</label>
                  <input id={`void-${p.id}`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="For example: recorded twice" className={`${field} mt-1.5`} />
                  <div className="mt-2 flex justify-end gap-2">
                    <button onClick={() => setVoiding('')} className={btnOutline}>Go back</button>
                    <button onClick={() => act('void' + p.id, () => api.voidManualPayment(p.id, reason.trim()))} disabled={!!busy || reason.trim().length < 3} className={btnPrimary}>{busy === 'void' + p.id && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} Void payment</button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ManualForm({ d, onCancel, onDone }: { d: Detail; onCancel: () => void; onDone: (message: string) => Promise<void> }) {
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [currency, setCurrency] = useState<'XAF' | 'USD'>('XAF');
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [receivedAt, setReceivedAt] = useState(todayLocal());
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState<{ key: string; name: string; type?: string; for: File } | null>(null);
  const [seen, setSeen] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const [busy, setBusy] = useState(false);

  const waiting = (d.manualPayments ?? []).filter((p) => p.status === 'RECORDED').reduce((s, p) => s + p.amountUsd, 0);
  const owed = Math.max(0, Math.round((d.amount - d.received - waiting) * 100) / 100);
  const num = /^\d+(\.\d{1,2})?$/.test(amount.replace(/[\s,]/g, '')) ? Number(amount.replace(/[\s,]/g, '')) : NaN;
  const rateNum = Number(rate);
  const usd = currency === 'USD' ? num : rateNum > 0 ? Math.round((num / rateNum) * 100) / 100 : NaN;
  const after = Math.round((d.received + waiting + (Number.isFinite(usd) ? usd : 0)) * 100) / 100;
  const tooMuch = Number.isFinite(usd) && usd > owed + 1;
  const fileProblem = file ? (file.size > MAX_PROOF ? 'That file is larger than 20 MB.' : !PROOF_EXT.test(file.name) ? 'Proof must be a PDF, JPG or PNG file.' : '') : '';
  const ready = Number.isFinite(usd) && usd > 0 && !tooMuch && !!receivedAt && seen && !fileProblem
    && (method !== 'BANK_TRANSFER' || reference.trim().length > 0)
    && (currency === 'USD' || (rateNum >= 300 && rateNum <= 2000))
    && (!duplicate || allowDuplicate);

  async function submit() {
    setBusy(true);
    try {
      let proof: { key: string; name: string; type?: string } | null = null;
      if (file) {
        if (uploaded?.for === file) proof = uploaded;
        else {
          const { url, key } = await api.getManualProofUploadUrl(d.id, file.name);
          const put = await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'application/octet-stream' } });
          if (!put.ok) throw new Error('The proof file could not be uploaded. Please try again.');
          proof = { key, name: file.name, type: file.type };
          setUploaded({ ...proof, for: file });
        }
      }
      const res = await api.recordManualPayment(d.id, {
        method, amount: num, currency, rate: currency === 'XAF' ? rateNum : null, receivedAt,
        reference: reference.trim() || undefined, note: note.trim() || undefined, proof, seenInAccount: seen,
        allowDuplicate: duplicate && allowDuplicate,
      });
      await onDone(res.message);
    } catch (e: any) {
      if (/already recorded on/i.test(e.message ?? '')) setDuplicate(true);
      toast.error(e.message ?? 'The payment could not be recorded.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl bg-muted/40 p-4">
      <p className="text-sm font-bold text-foreground">Record a payment</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        For money that did not come through Tranzak or Stripe: a bank transfer, cash, mobile money sent to our number, a cheque.
        Clients send their proof to billing@mjnhealthcare.com. {owed > 0 ? `${money(owed)} is still owed on this order.` : 'Nothing more is owed once the payments waiting for confirmation are counted.'}
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className={heading} htmlFor="mp-method">Received by</label>
          <select id="mp-method" value={method} onChange={(e) => setMethod(e.target.value)} className={`${field} mt-1.5`}>
            {MANUAL_METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className={heading} htmlFor="mp-date">Date received</label>
          <input id="mp-date" type="date" value={receivedAt} max={todayLocal()} onChange={(e) => setReceivedAt(e.target.value)} className={`${field} mt-1.5`} />
        </div>
        <div>
          <label className={heading} htmlFor="mp-amount">Amount received</label>
          <div className="mt-1.5 flex gap-2">
            <input id="mp-amount" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder={currency === 'XAF' ? '270000' : '450.00'} className={field} />
            <select aria-label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value as 'XAF' | 'USD')} className={`${field} w-24`}>
              <option value="XAF">XAF</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
        {currency === 'XAF' ? (
          <div>
            <label className={heading} htmlFor="mp-rate">Rate you got (XAF per $1)</label>
            <input id="mp-rate" value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" placeholder="600" className={`${field} mt-1.5`} />
          </div>
        ) : <div />}
        <div>
          <label className={heading} htmlFor="mp-ref">Reference{method === 'BANK_TRANSFER' ? '' : ' (optional)'}</label>
          <input id="mp-ref" value={reference} onChange={(e) => { setReference(e.target.value); setDuplicate(false); setAllowDuplicate(false); }} placeholder="As shown on the bank statement" className={`${field} mt-1.5`} />
        </div>
        <div>
          <label className={heading} htmlFor="mp-proof">Proof the client sent (optional)</label>
          <input id="mp-proof" type="file" accept="application/pdf,image/jpeg,image/png" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1.5 block w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border file:border-border file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-foreground" />
          {fileProblem && <p className="mt-1 text-xs font-bold text-foreground" role="alert">{fileProblem}</p>}
        </div>
      </div>

      <label className={`${heading} mt-3 block`} htmlFor="mp-note">Note (staff only)</label>
      <input id="mp-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="For example: seen on the Afriland statement of 14 October" className={`${field} mt-1.5`} />

      <div className="mt-3 rounded-lg bg-white px-3 py-2 text-sm" aria-live="polite">
        {Number.isFinite(usd) && usd > 0 ? (
          <>
            <p className="text-foreground">This payment: <span className="font-bold">{money(usd)}</span>{currency === 'XAF' ? ` (${num.toLocaleString('en-US')} XAF at ${rateNum})` : ''}</p>
            <p className="text-muted-foreground">After this {money(after)} of {money(d.amount)}{after >= d.amount - 0.5 ? ' · the order will be paid in full' : ` · ${money(Math.max(0, d.amount - after))} still to pay`}</p>
          </>
        ) : <p className="text-muted-foreground">Enter the amount{currency === 'XAF' ? ' and the rate' : ''} to see what it adds up to.</p>}
        {tooMuch && <p className="mt-1 font-bold text-foreground" role="alert">That is more than the {money(owed)} still owed.</p>}
      </div>

      {duplicate && (
        <label className="mt-3 flex items-start gap-2 text-sm text-foreground">
          <input type="checkbox" checked={allowDuplicate} onChange={(e) => setAllowDuplicate(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
          <span>This reference is already used on another payment. I have checked: this is a different payment.</span>
        </label>
      )}
      <label className="mt-3 flex items-start gap-2 text-sm text-foreground">
        <input type="checkbox" checked={seen} onChange={(e) => setSeen(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
        <span>I have seen this money in our account or till. <span className="text-muted-foreground">A screenshot from the client is not enough.</span></span>
      </label>

      <div className="mt-3 flex justify-end gap-2">
        <button onClick={onCancel} className={btnOutline}>Go back</button>
        <button onClick={submit} disabled={busy || !ready} className={btnPrimary}>{busy && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} Record payment</button>
      </div>
    </section>
  );
}
