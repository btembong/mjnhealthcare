'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { PageHeader, Skeleton } from '@mjn/ui';
import {
  VideoCamera, MagnifyingGlass, X, CircleNotch, CalendarBlank, CaretLeft, CaretRight, Envelope, Phone, Plus,
} from '@mjn/ui';
import { api } from '../../../lib/api';

// ── Time: everything on this page is Douala time (WAT, UTC+1, no daylight saving) ──

const ZONE = 'Africa/Douala';
const WAT_MS = 3600000;
const HOST_JOIN_OPENS_MIN = 15;
const PRESET_TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
const WEEKDAYS: [number, string][] = [[1, 'Mon'], [2, 'Tue'], [3, 'Wed'], [4, 'Thu'], [5, 'Fri'], [6, 'Sat'], [0, 'Sun']];
const MAX_WEEKS = 8;

/** The Douala calendar date ("2026-10-12") of an instant. */
function dDate(at: Date | number) {
  return new Date(+at + WAT_MS).toISOString().slice(0, 10);
}
function addDays(date: string, days: number) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
/** Monday of the week a calendar date falls in. */
function mondayOf(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return addDays(date, weekday === 0 ? -6 : 1 - weekday);
}
function clock(at: Date | number) {
  return new Date(at).toLocaleTimeString('en-GB', { timeZone: ZONE, hour: '2-digit', minute: '2-digit', hour12: false });
}
/** "Mon 12 Oct" for a calendar date string. */
function dateLabel(date: string, long = false) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: long ? 'long' : 'short', day: 'numeric', month: 'short' });
}
/** "Today", "Tomorrow", "Yesterday", or a short date. */
function dayName(at: Date, now: number) {
  const date = dDate(at);
  const today = dDate(now);
  if (date === today) return 'Today';
  if (date === addDays(today, 1)) return 'Tomorrow';
  if (date === addDays(today, -1)) return 'Yesterday';
  return dateLabel(date);
}

// ── Shape ─────────────────────────────────────────────────────────────────────

type Booking = {
  id: string; status: string; missed: boolean; cancelReason: string | null; start: Date; end: Date;
  consultantId: string | null; consultantName: string | null; name: string; email: string; phone: string | null;
  profession: string | null; destination: string | null; serviceInterest: string | null; notes: string | null;
  leadId: string | null; personId: string | null;
};
type OpenTime = { id: string; start: Date; consultantId: string | null };
type Consultant = { id: string; name: string; specialty: string };
type Week = Awaited<ReturnType<typeof api.getFreeConsultWeek>>;
type State = 'upcoming' | 'outcome' | 'done' | 'missed' | 'cancelled';

function stateOf(b: Booking, now: number): State {
  if (b.status === 'CANCELLED') return 'cancelled';
  if (b.status === 'COMPLETED') return 'done';
  if (b.missed) return 'missed';
  return b.end.getTime() <= now ? 'outcome' : 'upcoming';
}
const STATE: Record<State, { label: string; dot: string }> = {
  upcoming:  { label: 'Booked',          dot: 'bg-primary' },
  outcome:   { label: 'Needs an outcome', dot: 'bg-accent' },
  done:      { label: 'Attended',        dot: 'bg-secondary' },
  missed:    { label: 'Did not attend',  dot: 'bg-rose-500' },
  cancelled: { label: 'Cancelled',       dot: 'bg-muted-foreground/40' },
};

const card = 'rounded-2xl border border-border bg-white shadow-sm';
const heading = 'text-xs font-bold uppercase tracking-widest text-muted-foreground';
const btnPrimary = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-40';
const btnOutline = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted/60 disabled:opacity-40';
const field = 'w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';
const chip = (on: boolean) => `rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors ${on ? 'border-primary bg-primary text-white' : 'border-border bg-white text-muted-foreground hover:border-primary/40'}`;

function Dot({ className }: { className: string }) {
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${className}`} />;
}

function Modal({ title, sub, onClose, children }: { title: string; sub?: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-white p-6 shadow-xl sm:max-w-md sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-foreground">{title}</h2>
            {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const FILTERS = [['upcoming', 'Upcoming'], ['outcome', 'Needs an outcome'], ['past', 'Past']] as const;
type Filter = (typeof FILTERS)[number][0];
type Dialog = { kind: 'manage' | 'move' | 'cancel'; b: Booking };

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FreeConsultationsPage() {
  const [data, setData] = useState<{ canManageAll: boolean; consultants: Consultant[]; openTimes: OpenTime[]; bookings: Booking[] } | null>(null);
  const [failed, setFailed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [tab, setTab] = useState<'bookings' | 'availability'>('bookings');

  // Bookings
  const [filter, setFilter] = useState<Filter>('upcoming');
  const [search, setSearch] = useState('');
  const [onlyConsultant, setOnlyConsultant] = useState('');
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [reason, setReason] = useState('');
  const [reopen, setReopen] = useState(true);
  const [moveConsultant, setMoveConsultant] = useState('');
  const [pick, setPick] = useState('');
  const [busy, setBusy] = useState('');
  const [room, setRoom] = useState<{ url: string; clientName: string } | null>(null);

  // Availability
  const [consultant, setConsultant] = useState('');
  const [weekFrom, setWeekFrom] = useState(() => mondayOf(dDate(Date.now())));
  const [week, setWeek] = useState<Week | null>(null);
  const [weekFailed, setWeekFailed] = useState(false);
  const [dayPick, setDayPick] = useState(0);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.getFreeConsultOverview();
      setData({
        canManageAll: res.canManageAll,
        consultants: res.consultants ?? [],
        openTimes: (res.openTimes ?? []).map((o) => ({ ...o, start: new Date(o.start) })),
        bookings: (res.bookings ?? []).map((b: any) => ({ ...b, start: new Date(b.start), end: new Date(b.end) })),
      });
      setConsultant((current) => current || res.consultants?.[0]?.id || '');
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  const loadWeek = useCallback(async () => {
    if (!consultant) return;
    try {
      setWeek(await api.getFreeConsultWeek(consultant, weekFrom));
      setWeekFailed(false);
    } catch {
      setWeekFailed(true);
    }
  }, [consultant, weekFrom]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setWeek(null); loadWeek(); }, [loadWeek]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const bookings = data?.bookings ?? [];
  const buckets = useMemo(() => {
    const of = (wanted: State[]) => bookings.filter((b) => wanted.includes(stateOf(b, now)));
    return {
      upcoming: of(['upcoming']),
      outcome: of(['outcome']),
      past: of(['done', 'missed', 'cancelled']).sort((a, b) => b.start.getTime() - a.start.getTime()),
    };
  }, [bookings, now]);

  const q = search.trim().toLowerCase();
  const shown = buckets[filter].filter((b) =>
    (!onlyConsultant || b.consultantId === onlyConsultant) &&
    (!q || b.name.toLowerCase().includes(q) || b.email.toLowerCase().includes(q) || (b.phone ?? '').includes(q)));
  const today = buckets.upcoming.filter((b) => dDate(b.start) === dDate(now)).length;
  const thisWeek = buckets.upcoming.filter((b) => b.start.getTime() - now < 7 * 86400000).length;
  const openSoon = (data?.openTimes ?? []).filter((o) => o.start.getTime() - now < 7 * 86400000).length;
  const consultants = data?.consultants ?? [];
  const consultantName = (id: string | null) => consultants.find((c) => c.id === id)?.name ?? null;

  const joinOpensAt = (b: Booking) => b.start.getTime() - HOST_JOIN_OPENS_MIN * 60000;
  const canJoin = (b: Booking) => stateOf(b, now) === 'upcoming' && now >= joinOpensAt(b);
  function countdown(b: Booking) {
    const mins = Math.floor((b.start.getTime() - now) / 60000);
    if (mins <= 0) return 'now';
    if (mins < 60) return `in ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours === 1 ? 'in 1 hour' : `in ${hours} hours`;
    const days = Math.floor(hours / 24);
    return days === 1 ? 'in 1 day' : `in ${days} days`;
  }
  /** "Nurse → UK · NMC registration" from whatever the person told us. */
  function about(b: Booking) {
    const lead = [b.profession, b.destination].filter(Boolean).join(' → ');
    return [lead, b.serviceInterest].filter(Boolean).join(' · ');
  }

  async function join(b: Booking) {
    setBusy('join' + b.id);
    try {
      const res = await api.joinFreeConsult(b.id);
      if (!res.roomUrl) { toast.info(res.message ?? 'The video room is not ready yet. Try again in a minute.'); return; }
      setRoom({ url: res.token ? `${res.roomUrl}${res.roomUrl.includes('?') ? '&' : '?'}t=${res.token}` : res.roomUrl, clientName: res.clientName });
    } catch (e: any) {
      toast.error(e.message ?? 'The session could not be opened.');
    } finally {
      setBusy('');
    }
  }

  async function outcome(b: Booking, attended: boolean) {
    setBusy((attended ? 'yes' : 'no') + b.id);
    try {
      await api.setFreeConsultOutcome(b.id, attended);
      toast.success(attended ? `${b.name} marked as attended.` : `${b.name} marked as did not attend.`);
      setDialog(null);
      await load();
    } catch (e: any) {
      toast.error(e.message ?? 'That could not be saved.');
    } finally {
      setBusy('');
    }
  }

  function start(kind: Dialog['kind'], b: Booking) {
    setReason('');
    setReopen(true);
    setPick('');
    setMoveConsultant(b.consultantId ?? '');
    setDialog({ kind, b });
  }

  async function confirmCancel() {
    if (!dialog) return;
    setBusy('cancel');
    try {
      await api.cancelFreeConsult(dialog.b.id, reason.trim(), reopen);
      toast.success(`Booking cancelled. ${dialog.b.name} has been emailed.`);
      setDialog(null);
      await Promise.all([load(), loadWeek()]);
    } catch (e: any) {
      toast.error(e.message ?? 'The booking could not be cancelled.');
    } finally {
      setBusy('');
    }
  }

  async function confirmMove() {
    if (!dialog || !pick) return;
    setBusy('move');
    try {
      await api.moveFreeConsult(dialog.b.id, pick);
      toast.success(`Booking moved. ${dialog.b.name} has been emailed the new time.`);
      setDialog(null);
      await Promise.all([load(), loadWeek()]);
    } catch (e: any) {
      toast.error(e.message ?? 'The booking could not be moved.');
      await load();
    } finally {
      setBusy('');
    }
  }

  async function removeTime(slotId: string) {
    setBusy('rm' + slotId);
    try {
      await api.removeFreeConsultSlot(slotId);
      toast.success('Time removed.');
      await Promise.all([loadWeek(), load()]);
    } catch (e: any) {
      toast.error(e.message ?? 'The time could not be removed.');
    } finally {
      setBusy('');
    }
  }

  // Open times offered in the Move dialog, grouped by day.
  const moveDays = useMemo(() => {
    const groups = new Map<string, OpenTime[]>();
    for (const o of data?.openTimes ?? []) {
      if (o.consultantId !== moveConsultant || o.start.getTime() <= now) continue;
      const key = dDate(o.start);
      groups.set(key, [...(groups.get(key) ?? []), o]);
    }
    return [...groups.entries()];
  }, [data, moveConsultant, now]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekFrom, i));
  const thisMonday = mondayOf(dDate(now));

  if (failed && !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Free consultations" />
        <div className={`${card} p-10 text-center`}>
          <p className="text-sm font-bold text-foreground">Free consultations could not be loaded.</p>
          <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
          <button onClick={load} className={`${btnPrimary} mt-4`}>Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Free consultations"
        subtitle={data
          ? `${today} today · ${thisWeek} in the next 7 days · ${openSoon} open ${openSoon === 1 ? 'time' : 'times'} in the next 7 days. All times are Douala time (WAT).`
          : 'All times are Douala time (WAT).'}
        actions={<button onClick={() => { setTab('availability'); setAdding(true); }} disabled={consultants.length === 0} className={btnPrimary}><Plus className="h-3.5 w-3.5" /> Add times</button>}
      />

      {data && consultants.length === 0 && (
        <div className={`${card} flex items-start gap-3 p-4`}>
          <Dot className="mt-1.5 bg-accent" />
          <p className="text-sm text-foreground">
            {data.canManageAll
              ? 'There are no active consultants yet. Add one under Consultants before opening free times.'
              : 'Your login is not linked to a consultant profile yet, so you have no free times to manage. Ask an admin to add a consultant profile with your email address.'}
          </p>
        </div>
      )}

      <div data-tour="fc-tabs" className="flex gap-1 border-b border-border">
        {([['bookings', 'Bookings'], ['availability', 'Availability']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${tab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {label}
            {key === 'bookings' && buckets.outcome.length > 0 && <span className="ml-2 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">{buckets.outcome.length}</span>}
          </button>
        ))}
      </div>

      {/* ── Bookings ── */}
      {tab === 'bookings' && (
        <div className="space-y-4">
          <div data-tour="fc-filters" className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map(([key, label]) => (
                <button key={key} onClick={() => setFilter(key)} className={chip(filter === key)}>
                  {label} <span className="ml-1 opacity-70">{buckets[key].length}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {data?.canManageAll && consultants.length > 1 && (
                <select value={onlyConsultant} onChange={(e) => setOnlyConsultant(e.target.value)} aria-label="Consultant" className={`${field} sm:w-48`}>
                  <option value="">All consultants</option>
                  {consultants.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
              <div className="relative sm:w-64">
                <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email or phone" className={`${field} pl-9`} />
              </div>
            </div>
          </div>

          {!data ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div>
          ) : shown.length === 0 ? (
            <div className={`${card} p-10 text-center`}>
              <CalendarBlank className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
              <p className="text-sm font-bold text-foreground">
                {q || onlyConsultant ? 'No bookings match.' : filter === 'upcoming' ? 'No free consultations are booked.' : filter === 'outcome' ? 'Nothing is waiting for an outcome.' : 'No past free consultations yet.'}
              </p>
              {filter === 'upcoming' && !q && !onlyConsultant && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {openSoon > 0 ? `${openSoon} open ${openSoon === 1 ? 'time is' : 'times are'} on the website for the next 7 days.` : 'There are no open times in the next 7 days, so nobody can book. Add some under Availability.'}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {shown.map((b) => {
                const state = stateOf(b, now);
                return (
                  <div key={b.id} className={`${card} grid gap-3 p-4 md:grid-cols-[150px_1fr_auto] md:items-center md:gap-5`}>
                    <div>
                      <p className="text-sm font-bold text-foreground">{dayName(b.start, now)}</p>
                      <p className="text-lg font-bold leading-tight text-primary">{clock(b.start)}</p>
                      {state === 'upcoming' && <p className="text-xs text-muted-foreground">{countdown(b)}</p>}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">{b.name}</p>
                      {about(b) && <p className="truncate text-xs text-foreground/80">{about(b)}</p>}
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                        {b.email && <a href={`mailto:${b.email}`} className="inline-flex items-center gap-1 hover:text-primary"><Envelope className="h-3.5 w-3.5" /> {b.email}</a>}
                        {b.phone && <a href={`tel:${b.phone}`} className="inline-flex items-center gap-1 hover:text-primary"><Phone className="h-3.5 w-3.5" /> {b.phone}</a>}
                      </div>
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Dot className={STATE[state].dot} /> {STATE[state].label}
                        {b.consultantName && <span>· with {b.consultantName}</span>}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      {state === 'upcoming' && (
                        <button onClick={() => join(b)} disabled={!canJoin(b) || busy === 'join' + b.id} title={canJoin(b) ? undefined : `Opens at ${clock(joinOpensAt(b))}, ${HOST_JOIN_OPENS_MIN} minutes before the start`} className={btnPrimary}>
                          {busy === 'join' + b.id ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <VideoCamera className="h-3.5 w-3.5" />} Join as host
                        </button>
                      )}
                      {state === 'outcome' && (
                        <>
                          <button onClick={() => outcome(b, true)} disabled={!!busy} className={btnPrimary}>{busy === 'yes' + b.id && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} Attended</button>
                          <button onClick={() => outcome(b, false)} disabled={!!busy} className={btnOutline}>{busy === 'no' + b.id && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} Did not attend</button>
                        </>
                      )}
                      <button onClick={() => start('manage', b)} className={btnOutline}>{state === 'upcoming' || state === 'outcome' ? 'Manage' : 'Details'}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Availability ── */}
      {tab === 'availability' && consultants.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {consultants.length > 1 ? (
              <select value={consultant} onChange={(e) => setConsultant(e.target.value)} aria-label="Consultant" className={`${field} sm:w-64`}>
                {consultants.map((c) => <option key={c.id} value={c.id}>{c.name}{c.specialty ? ` — ${c.specialty}` : ''}</option>)}
              </select>
            ) : (
              <p className="text-sm font-bold text-foreground">{consultants[0].name}</p>
            )}
            <div className="flex items-center gap-2">
              <button onClick={() => setWeekFrom(addDays(weekFrom, -7))} disabled={weekFrom <= thisMonday} aria-label="Previous week" className={btnOutline}><CaretLeft className="h-3.5 w-3.5" /></button>
              <p className="min-w-[150px] text-center text-sm font-bold text-foreground">{dateLabel(weekFrom)} – {dateLabel(addDays(weekFrom, 6))}</p>
              <button onClick={() => setWeekFrom(addDays(weekFrom, 7))} aria-label="Next week" className={btnOutline}><CaretRight className="h-3.5 w-3.5" /></button>
              {weekFrom !== thisMonday && <button onClick={() => setWeekFrom(thisMonday)} className={btnOutline}>This week</button>}
            </div>
          </div>

          {/* Phone: one day at a time */}
          <div className="flex gap-1.5 overflow-x-auto md:hidden">
            {days.map((d, i) => (
              <button key={d} onClick={() => setDayPick(i)} className={`${chip(dayPick === i)} shrink-0`}>{dateLabel(d)}</button>
            ))}
          </div>

          {weekFailed ? (
            <div className={`${card} p-8 text-center`}>
              <p className="text-sm font-bold text-foreground">This week could not be loaded.</p>
              <button onClick={loadWeek} className={`${btnPrimary} mt-3`}>Try again</button>
            </div>
          ) : !week ? (
            <Skeleton className="h-64 w-full rounded-2xl" />
          ) : (
            <div className={`${card} grid divide-border md:grid-cols-7 md:divide-x`}>
              {days.map((d, i) => {
                const items = [
                  ...week.slots.filter((s) => dDate(new Date(s.start)) === d).map((s) => ({ at: +new Date(s.start), slot: s, busy: null as Week['busy'][number] | null })),
                  ...week.busy.filter((x) => dDate(new Date(x.start)) === d).map((x) => ({ at: +new Date(x.start), slot: null as Week['slots'][number] | null, busy: x })),
                ].sort((a, b) => a.at - b.at);
                return (
                  <div key={d} className={`${dayPick === i ? 'block' : 'hidden'} min-h-[180px] p-3 md:block`}>
                    <p className={`mb-2 text-xs font-bold ${d === dDate(now) ? 'text-primary' : 'text-muted-foreground'}`}>{dateLabel(d)}{d === dDate(now) ? ' · today' : ''}</p>
                    {items.length === 0 && <p className="text-xs text-muted-foreground/60">No times</p>}
                    <div className="space-y-1.5">
                      {items.map((it) => it.busy ? (
                        <div key={`x${it.at}${it.busy.kind}`} className="rounded-lg border border-dashed border-border bg-muted/50 px-2 py-1.5 text-xs text-muted-foreground">
                          <span className="font-bold">{clock(it.at)}–{clock(new Date(it.busy.end))}</span>
                          <span className="block">{it.busy.kind === 'session' ? 'Paid-session time' : 'Blocked'}</span>
                        </div>
                      ) : it.slot!.booked ? (
                        <div key={it.slot!.id} className="rounded-lg bg-primary px-2 py-1.5 text-xs text-white">
                          <span className="font-bold">{clock(it.at)}</span>
                          <span className="block truncate">{it.slot!.bookedBy ?? 'Booked'}</span>
                        </div>
                      ) : (
                        <div key={it.slot!.id} className={`flex items-center justify-between rounded-lg border px-2 py-1.5 text-xs ${it.at <= now ? 'border-border text-muted-foreground/60' : 'border-primary/40 text-primary'}`}>
                          <span><span className="font-bold">{clock(it.at)}</span>{it.at <= now ? ' · passed' : ' · open'}</span>
                          <button onClick={() => removeTime(it.slot!.id)} disabled={busy === 'rm' + it.slot!.id} aria-label={`Remove ${clock(it.at)} on ${dateLabel(d)}`} title="Remove this time" className="ml-1 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                            {busy === 'rm' + it.slot!.id ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-primary/40" /> Open — visitors can book it</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-primary" /> Booked — move or cancel it under Bookings</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-dashed border-border bg-muted/50" /> Paid-session or blocked time — free times cannot go here</span>
          </div>
        </div>
      )}

      {/* ── Manage a booking ── */}
      {dialog?.kind === 'manage' && (() => {
        const b = dialog.b;
        const state = stateOf(b, now);
        return (
          <Modal title={b.name} sub={`${dayName(b.start, now)}, ${clock(b.start)} Douala time${b.consultantName ? ` · with ${b.consultantName}` : ''}`} onClose={() => setDialog(null)}>
            <p className="mb-3 flex items-center gap-1.5 text-xs font-bold text-foreground"><Dot className={STATE[state].dot} /> {STATE[state].label}</p>
            <dl className="space-y-2 text-sm">
              {b.email && <div><dt className={heading}>Email</dt><dd><a href={`mailto:${b.email}`} className="text-primary hover:underline">{b.email}</a></dd></div>}
              {b.phone && <div><dt className={heading}>Phone / WhatsApp</dt><dd><a href={`tel:${b.phone}`} className="text-primary hover:underline">{b.phone}</a></dd></div>}
              {about(b) && <div><dt className={heading}>Looking for</dt><dd className="text-foreground">{about(b)}</dd></div>}
              {b.notes && <div><dt className={heading}>From the website</dt><dd className="whitespace-pre-wrap text-foreground">{b.notes}</dd></div>}
              {b.cancelReason && <div><dt className={heading}>Why it was cancelled</dt><dd className="text-foreground">{b.cancelReason}</dd></div>}
            </dl>
            <div className="mt-3 text-xs">
              {b.personId
                ? <Link href={`/clients/${b.personId}`} className="font-bold text-primary hover:underline">Open this client</Link>
                : b.leadId && <Link href="/leads" className="font-bold text-primary hover:underline">Open Leads</Link>}
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              {state === 'upcoming' && <button onClick={() => start('cancel', b)} className={btnOutline}>Cancel booking</button>}
              {(state === 'upcoming' || state === 'outcome' || state === 'missed') && <button onClick={() => start('move', b)} className={btnOutline}>Move to another time</button>}
              {(state === 'outcome' || state === 'done') && <button onClick={() => outcome(b, false)} disabled={!!busy} className={btnOutline}>Did not attend</button>}
              {(state === 'outcome' || state === 'missed') && <button onClick={() => outcome(b, true)} disabled={!!busy} className={btnPrimary}>Attended</button>}
              {state === 'upcoming' && <button onClick={() => { setDialog(null); join(b); }} disabled={!canJoin(b)} title={canJoin(b) ? undefined : `Opens at ${clock(joinOpensAt(b))}`} className={btnPrimary}><VideoCamera className="h-3.5 w-3.5" /> Join as host</button>}
            </div>
          </Modal>
        );
      })()}

      {/* ── Cancel ── */}
      {dialog?.kind === 'cancel' && (
        <Modal title="Cancel this booking?" sub={`${dialog.b.name} · ${dayName(dialog.b.start, now)}, ${clock(dialog.b.start)}`} onClose={() => setDialog(null)}>
          <label className={heading} htmlFor="fc-reason">Reason</label>
          <textarea id="fc-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="For example: the consultant is unavailable that day." className={`${field} mt-1.5`} />
          <label className="mt-3 flex items-start gap-2 text-sm text-foreground">
            <input type="checkbox" checked={reopen} onChange={(e) => setReopen(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#0F4C81]" />
            <span>Keep this time open so someone else can book it<span className="block text-xs text-muted-foreground">Untick this if the consultant cannot take anyone at this time.</span></span>
          </label>
          <p className="mt-4 text-xs text-muted-foreground">{dialog.b.name} is emailed your reason and invited to choose another time. Their reminders stop.</p>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setDialog(null)} className={btnOutline}>Keep booking</button>
            <button onClick={confirmCancel} disabled={busy === 'cancel' || reason.trim().length < 3} className={btnPrimary}>{busy === 'cancel' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} Cancel booking</button>
          </div>
        </Modal>
      )}

      {/* ── Move ── */}
      {dialog?.kind === 'move' && (
        <Modal title="Move to another time" sub={`${dialog.b.name} · now ${dayName(dialog.b.start, now)}, ${clock(dialog.b.start)}`} onClose={() => setDialog(null)}>
          {data?.canManageAll && consultants.length > 1 && (
            <select value={moveConsultant} onChange={(e) => { setMoveConsultant(e.target.value); setPick(''); }} aria-label="Consultant" className={`${field} mb-3`}>
              {consultants.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          {moveDays.length === 0 ? (
            <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">{consultantName(moveConsultant) ?? 'This consultant'} has no open times. Add some under Availability first.</p>
          ) : (
            <div className="max-h-72 space-y-3 overflow-y-auto">
              {moveDays.map(([day, times]) => (
                <div key={day}>
                  <p className={heading}>{dateLabel(day, true)}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {times.map((o) => <button key={o.id} onClick={() => setPick(o.id)} className={chip(pick === o.id)}>{clock(o.start)}</button>)}
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-4 text-xs text-muted-foreground">{dialog.b.name} is emailed the new time with a new join link, and reminded again before it. The old time opens up for someone else.</p>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setDialog(null)} className={btnOutline}>Close</button>
            <button onClick={confirmMove} disabled={busy === 'move' || !pick} className={btnPrimary}>{busy === 'move' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} Move booking</button>
          </div>
        </Modal>
      )}

      {adding && (
        <AddTimes
          consultants={consultants}
          initialConsultant={consultant}
          firstDate={dDate(now)}
          onClose={() => setAdding(false)}
          onSaved={async (consultantId, startDate) => {
            setAdding(false);
            setConsultant(consultantId);
            setWeekFrom(mondayOf(startDate));
            await Promise.all([load(), loadWeek()]);
          }}
        />
      )}

      {/* ── Host video room ── */}
      {room && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-black">
          <div className="flex shrink-0 items-center justify-between bg-primary px-4 py-2">
            <span className="text-sm font-bold text-white">Free consultation with {room.clientName} · you are the host</span>
            <button onClick={() => { setRoom(null); load(); }} className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/25"><X className="h-3.5 w-3.5" /> Leave session</button>
          </div>
          <iframe src={room.url} title="Video session" allow="camera; microphone; fullscreen; display-capture; autoplay" className="w-full flex-1 border-0" />
        </div>
      )}
    </div>
  );
}

// ── Add times ─────────────────────────────────────────────────────────────────

function AddTimes({ consultants, initialConsultant, firstDate, onClose, onSaved }: {
  consultants: Consultant[]; initialConsultant: string; firstDate: string;
  onClose: () => void; onSaved: (consultantId: string, startDate: string) => void;
}) {
  const [consultantId, setConsultantId] = useState(initialConsultant || consultants[0]?.id || '');
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startDate, setStartDate] = useState(addDays(firstDate, 1));
  const [weeks, setWeeks] = useState(1);
  const [times, setTimes] = useState<string[]>(['09:00', '11:00', '14:00', '16:00']);
  const [custom, setCustom] = useState('');
  const [preview, setPreview] = useState<{ adding: number; skipped: { existing: number; clash: number; past: number } } | null>(null);
  const [problem, setProblem] = useState('');
  const [saving, setSaving] = useState(false);

  const ready = !!consultantId && weekdays.length > 0 && times.length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(startDate);
  const input = useMemo(() => ({ consultantId, startDate, weeks, weekdays, times }), [consultantId, startDate, weeks, weekdays, times]);

  // Ask the server what would be added, so duplicates and clashes are known before saving.
  useEffect(() => {
    setPreview(null);
    setProblem('');
    if (!ready) return;
    let stale = false;
    const t = setTimeout(() => {
      api.previewFreeConsultSlots(input)
        .then((res) => { if (!stale) setPreview(res); })
        .catch((e: any) => { if (!stale) setProblem(e.message ?? 'These times could not be checked.'); });
    }, 300);
    return () => { stale = true; clearTimeout(t); };
  }, [input, ready]);

  const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  function addCustom() {
    if (!/^\d{2}:\d{2}$/.test(custom) || times.includes(custom)) return;
    setTimes([...times, custom].sort());
    setCustom('');
  }

  async function save() {
    setSaving(true);
    try {
      const res = await api.createFreeConsultSlots(input);
      const skipped = res.skipped.existing + res.skipped.clash + res.skipped.past;
      toast.success(`${res.added} ${res.added === 1 ? 'time' : 'times'} added${skipped ? `, ${skipped} skipped` : ''}.`);
      onSaved(consultantId, startDate);
    } catch (e: any) {
      toast.error(e.message ?? 'The times could not be added.');
    } finally {
      setSaving(false);
    }
  }

  const skippedParts = preview ? [
    preview.skipped.existing ? `${preview.skipped.existing} already exist` : '',
    preview.skipped.clash ? `${preview.skipped.clash} clash with a paid session or blocked time` : '',
    preview.skipped.past ? `${preview.skipped.past} already passed` : '',
  ].filter(Boolean) : [];

  return (
    <Modal title="Add free consultation times" sub="Each time is 30 minutes, in Douala time (WAT)." onClose={onClose}>
      <div className="space-y-4">
        {consultants.length > 1 && (
          <div>
            <label className={heading} htmlFor="fc-consultant">Consultant</label>
            <select id="fc-consultant" value={consultantId} onChange={(e) => setConsultantId(e.target.value)} className={`${field} mt-1.5`}>
              {consultants.map((c) => <option key={c.id} value={c.id}>{c.name}{c.specialty ? ` — ${c.specialty}` : ''}</option>)}
            </select>
          </div>
        )}
        <div>
          <p className={heading}>Days of the week</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {WEEKDAYS.map(([n, label]) => <button key={n} type="button" onClick={() => setWeekdays(toggle(weekdays, n))} aria-pressed={weekdays.includes(n)} className={chip(weekdays.includes(n))}>{label}</button>)}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={heading} htmlFor="fc-start">Starting</label>
            <input id="fc-start" type="date" value={startDate} min={firstDate} onChange={(e) => setStartDate(e.target.value)} className={`${field} mt-1.5`} />
          </div>
          <div>
            <label className={heading} htmlFor="fc-weeks">For</label>
            <select id="fc-weeks" value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} className={`${field} mt-1.5`}>
              {Array.from({ length: MAX_WEEKS }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} {n === 1 ? 'week' : 'weeks'}</option>)}
            </select>
          </div>
        </div>
        <div>
          <p className={heading}>Times</p>
          <div className="mt-1.5 grid grid-cols-4 gap-1.5">
            {[...new Set([...PRESET_TIMES, ...times])].sort().map((t) => <button key={t} type="button" onClick={() => setTimes(toggle(times, t).sort())} aria-pressed={times.includes(t)} className={chip(times.includes(t))}>{t}</button>)}
          </div>
          <div className="mt-2 flex gap-2">
            <input type="time" value={custom} onChange={(e) => setCustom(e.target.value)} aria-label="Another time" className={field} />
            <button type="button" onClick={addCustom} disabled={!custom} className={btnOutline}><Plus className="h-3.5 w-3.5" /> Add time</button>
          </div>
        </div>

        <div className="rounded-xl bg-muted/50 p-3 text-sm" aria-live="polite">
          {problem ? <p className="font-bold text-foreground">{problem}</p>
            : !ready ? <p className="text-muted-foreground">Choose at least one day and one time.</p>
            : !preview ? <p className="flex items-center gap-2 text-muted-foreground"><CircleNotch className="h-3.5 w-3.5 animate-spin" /> Checking…</p>
            : (
              <>
                <p className="font-bold text-foreground">{preview.adding === 0 ? 'Nothing new to add.' : `This adds ${preview.adding} ${preview.adding === 1 ? 'time' : 'times'}.`}</p>
                {skippedParts.length > 0 && <p className="mt-0.5 text-xs text-muted-foreground">Skipped: {skippedParts.join(' · ')}.</p>}
              </>
            )}
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className={btnOutline}>Close</button>
        <button onClick={save} disabled={saving || !preview || preview.adding === 0} className={btnPrimary}>
          {saving && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} {preview && preview.adding > 0 ? `Add ${preview.adding} ${preview.adding === 1 ? 'time' : 'times'}` : 'Add times'}
        </button>
      </div>
    </Modal>
  );
}
