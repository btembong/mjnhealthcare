'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Skeleton } from '@mjn/ui';
import {
  VideoCamera, MagnifyingGlass, CheckCircle, X, CircleNotch, CalendarBlank, CaretLeft, CaretRight,
  Rows, Envelope, Phone, ArrowSquareOut,
} from '@mjn/ui';
import { api } from '../../../lib/api';
import { useAdmin } from '../../../contexts/admin-context';

// ── Shape and helpers ─────────────────────────────────────────────────────────

type Session = {
  id: string; status: string; kind: string; clientName: string; clientEmail: string; clientPhone: string;
  clientNote: string | null; caseNote: string | null; paid: number; refund: number | null; isFree: boolean;
  start: Date; end: Date; minutes: number; consultantId: string; consultantName: string | null;
  personId: string | null; hasRoom: boolean; movedAt: string | null; completedAt: string | null; bookedAt: string;
};

const HOST_JOIN_OPENS_MIN = 15;
const NO_SHOW_AFTER_MIN = 10;
const NOTE_WINDOW_DAYS = 14;

const STATUS: Record<string, { label: string; dot: string }> = {
  CONFIRMED:        { label: 'Confirmed',        dot: 'bg-primary' },
  AWAITING_PAYMENT: { label: 'Awaiting payment', dot: 'bg-accent' },
  COMPLETED:        { label: 'Completed',        dot: 'bg-secondary' },
  CANCELLED:        { label: 'Cancelled',        dot: 'bg-muted-foreground/40' },
  NO_SHOW:          { label: 'Missed',           dot: 'bg-rose-500' },
};
const KIND: Record<string, string> = { HEALTH: 'Health consultation', CAREER: 'Career consultation', BOTH: 'Consultation' };

const card = 'rounded-2xl border border-border bg-white shadow-sm';
const heading = 'text-xs font-bold uppercase tracking-widest text-muted-foreground';
const btnPrimary = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-40';
const btnOutline = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted/60 disabled:opacity-40';
const field = 'w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

function Dot({ className }: { className: string }) {
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${className}`} />;
}
function initials(name?: string | null) {
  return (name ?? '').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
}
function money(n: number) {
  return `$${Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0 })}`;
}
function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}
function clock(d: Date) {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
/** "Today", "Tomorrow", "Yesterday", or a short date. */
function dayName(d: Date) {
  const today = new Date();
  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, new Date(today.getTime() + 86400000))) return 'Tomorrow';
  if (sameDay(d, new Date(today.getTime() - 86400000))) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' });
}
function zoneLabel() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    const city = (tz.split('/').pop() ?? '').replace(/_/g, ' ');
    const short = new Intl.DateTimeFormat('en-GB', { timeZoneName: 'short' }).formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value ?? '';
    return city ? `${city} time${short ? ` (${short})` : ''}` : 'your local time';
  } catch {
    return 'your local time';
  }
}
function toSession(s: any): Session | null {
  if (!s.slot?.startAt) return null;
  const start = new Date(s.slot.startAt);
  const minutes = s.slot.durationMinutes ?? 45;
  return {
    id: s.id, status: s.status, kind: s.consultationCategory ?? 'BOTH',
    clientName: s.clientName ?? 'Client', clientEmail: s.clientEmail ?? '', clientPhone: s.clientPhone ?? '',
    clientNote: s.preSessionNote ?? null, caseNote: s.caseNote ?? null,
    paid: Number(s.amountPaid ?? 0), refund: s.refundAmount == null ? null : Number(s.refundAmount), isFree: !!s.slot.isFree,
    start, end: new Date(start.getTime() + minutes * 60000), minutes,
    consultantId: s.consultantId ?? s.slot.consultant?.id ?? '', consultantName: s.slot.consultant?.name ?? null,
    personId: s.personId ?? null, hasRoom: !!s.hasRoom, movedAt: s.rescheduledAt ?? null, completedAt: s.completedAt ?? null, bookedAt: s.createdAt,
  };
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

const TABS = [['upcoming', 'Upcoming'], ['note', 'Needs a note'], ['past', 'Past'], ['other', 'Cancelled & missed']] as const;
type Tab = (typeof TABS)[number][0];
type Dialog = { kind: 'complete' | 'cancel' | 'noshow' | 'move'; s: Session };

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SessionsPage() {
  const { me } = useAdmin();
  const isAdmin = (me?.role as string)?.toUpperCase() === 'ADMIN';

  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [tab, setTab] = useState<Tab>('upcoming');
  const [search, setSearch] = useState('');
  const [consultant, setConsultant] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [text, setText] = useState('');
  const [slots, setSlots] = useState<any[] | null>(null);
  const [pick, setPick] = useState('');
  const [busy, setBusy] = useState(false);
  const [joining, setJoining] = useState('');
  const [room, setRoom] = useState<{ url: string; clientName: string } | null>(null);
  const [month, setMonth] = useState(() => new Date());
  const [day, setDay] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const raw = (await api.getSessions()) ?? [];
      setSessions(raw.map(toSession).filter(Boolean) as Session[]);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  // Keeps "in 25 min" and the Join button honest while the page stays open.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const all = useMemo(() => (sessions ?? []).filter((s) => !consultant || s.consultantId === consultant), [sessions, consultant]);
  const consultants = useMemo(
    () => [...new Map((sessions ?? []).filter((s) => s.consultantName).map((s) => [s.consultantId, s.consultantName as string])).entries()].sort((a, b) => a[1].localeCompare(b[1])),
    [sessions],
  );

  const ended = (s: Session) => s.end.getTime() <= now;
  const needsNote = (s: Session) =>
    (s.status === 'CONFIRMED' && ended(s)) ||
    (s.status === 'COMPLETED' && !s.caseNote && now - s.end.getTime() < NOTE_WINDOW_DAYS * 86400000);
  const buckets: Record<Tab, Session[]> = {
    upcoming: all.filter((s) => s.status === 'CONFIRMED' && !ended(s)).sort((a, b) => a.start.getTime() - b.start.getTime()),
    note: all.filter(needsNote).sort((a, b) => a.start.getTime() - b.start.getTime()),
    past: all.filter((s) => s.status === 'COMPLETED').sort((a, b) => b.start.getTime() - a.start.getTime()),
    other: all.filter((s) => ['CANCELLED', 'NO_SHOW', 'AWAITING_PAYMENT'].includes(s.status)).sort((a, b) => b.start.getTime() - a.start.getTime()),
  };
  const next = buckets.upcoming[0] ?? null;
  const q = search.trim().toLowerCase();
  const shown = buckets[tab].filter((s) => !q || s.clientName.toLowerCase().includes(q) || s.clientEmail.toLowerCase().includes(q) || (s.consultantName ?? '').toLowerCase().includes(q));
  const today = buckets.upcoming.filter((s) => sameDay(s.start, new Date(now))).length;
  const week = buckets.upcoming.filter((s) => s.start.getTime() - now < 7 * 86400000).length;
  // Money actually received: paid bookings less anything refunded. Unpaid bookings count for nothing.
  const received = all.filter((s) => s.status !== 'AWAITING_PAYMENT').reduce((sum, s) => sum + s.paid - (s.refund ?? 0), 0);
  const open = (sessions ?? []).find((s) => s.id === openId) ?? null;

  const joinOpensAt = (s: Session) => new Date(s.start.getTime() - HOST_JOIN_OPENS_MIN * 60000);
  const canJoin = (s: Session) => s.status === 'CONFIRMED' && now >= joinOpensAt(s).getTime() && now <= s.end.getTime() + 30 * 60000;
  const canNoShow = (s: Session) => s.status === 'CONFIRMED' && now >= s.start.getTime() + NO_SHOW_AFTER_MIN * 60000;
  function countdown(s: Session) {
    const mins = Math.floor((s.start.getTime() - now) / 60000);
    if (mins <= 0) return 'now';
    if (mins < 60) return `in ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours === 1 ? 'in 1 hour' : `in ${hours} hours`;
    const days = Math.floor(hours / 24);
    return days === 1 ? 'tomorrow' : `in ${days} days`;
  }
  const kindOf = (s: Session) => `${KIND[s.kind] ?? 'Consultation'}${s.isFree ? ' · free' : ''}`;

  async function join(s: Session) {
    setJoining(s.id);
    try {
      const data = await api.getHostJoinInfo(s.id);
      if (!data.roomUrl) { toast.info(data.message ?? 'The video room is not ready yet. Try again in a minute.'); return; }
      setRoom({ url: data.token ? `${data.roomUrl}${data.roomUrl.includes('?') ? '&' : '?'}t=${data.token}` : data.roomUrl, clientName: data.clientName });
    } catch (e: any) {
      toast.error(e.message ?? 'The session could not be opened.');
    } finally {
      setJoining('');
    }
  }

  function start(kind: Dialog['kind'], s: Session) {
    setText(kind === 'complete' ? s.caseNote ?? '' : '');
    setPick('');
    setDialog({ kind, s });
    if (kind === 'move') {
      setSlots(null);
      api.getOpenSlots(s.consultantId)
        .then((list) => setSlots((list ?? []).filter((x: any) => !!x.isFree === s.isFree && new Date(x.startAt).getTime() > Date.now())))
        .catch(() => setSlots([]));
    }
  }

  async function confirm() {
    if (!dialog) return;
    const { kind, s } = dialog;
    setBusy(true);
    try {
      if (kind === 'complete') {
        await api.markSessionCompleted(s.id, text.trim() || undefined);
        toast.success(s.status === 'COMPLETED' ? 'Note saved.' : 'Session marked complete.');
      } else if (kind === 'cancel') {
        const r = await api.cancelSession(s.id, text.trim());
        toast.success(r.refundAmount > 0 ? `Session cancelled. The client is refunded ${money(r.refundAmount)} and has been told.` : 'Session cancelled. The client has been told.');
      } else if (kind === 'noshow') {
        await api.markSessionNoShow(s.id, text.trim() || undefined);
        toast.success('Session marked as missed.');
      } else {
        await api.moveSession(s.id, pick);
        toast.success('Session moved. The client has been told.');
      }
      setDialog(null);
      await load();
    } catch (e: any) {
      toast.error(e.message ?? 'That did not work. Please try again.');
      if (kind === 'move') start('move', s);
    } finally {
      setBusy(false);
    }
  }

  const statusOf = (s: Session) => (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-foreground">
      <Dot className={STATUS[s.status]?.dot ?? 'bg-muted'} /> {STATUS[s.status]?.label ?? s.status}
    </span>
  );
  const joinButton = (s: Session, wide = false) => (
    <button onClick={() => join(s)} disabled={!canJoin(s) || !s.hasRoom || joining === s.id} className={`${btnPrimary} ${wide ? 'w-full px-6 py-2.5 text-sm sm:w-auto' : ''}`}>
      {joining === s.id ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <VideoCamera className="h-3.5 w-3.5" />} Join as host
    </button>
  );

  if (sessions === null && !failed) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  // Calendar cells: whole weeks, Monday first.
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(1 - ((monthStart.getDay() + 6) % 7));
  const cells = Array.from({ length: 42 }, (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
  const onDay = (d: Date) => all.filter((s) => sameDay(s.start, d)).sort((a, b) => a.start.getTime() - b.start.getTime());

  const row = (s: Session) => (
    <li key={s.id}>
      <div className="grid gap-x-4 gap-y-2 px-5 py-3.5 md:grid-cols-[9rem_minmax(0,1.3fr)_minmax(0,1fr)_8rem_auto] md:items-center">
        <button onClick={() => setOpenId(s.id)} className="text-left">
          <span className="block text-sm font-bold text-foreground">{dayName(s.start)}</span>
          <span className="block text-xs text-muted-foreground">{clock(s.start)} – {clock(s.end)}</span>
        </button>
        <button onClick={() => setOpenId(s.id)} className="min-w-0 text-left">
          <span className="block truncate text-sm font-semibold text-foreground">{s.clientName}</span>
          {s.clientNote && <span className="block truncate text-xs text-muted-foreground">“{s.clientNote}”</span>}
        </button>
        <p className="min-w-0 text-xs text-muted-foreground">
          <span className="block truncate">{kindOf(s)} · {s.minutes} min</span>
          {isAdmin && s.consultantName && <span className="block truncate">{s.consultantName}</span>}
        </p>
        {statusOf(s)}
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {tab === 'upcoming' && canJoin(s) && joinButton(s)}
          {needsNote(s) && <button onClick={() => start('complete', s)} className={btnPrimary}>{s.status === 'COMPLETED' ? 'Add note' : 'Write note and complete'}</button>}
          <button onClick={() => setOpenId(s.id)} className={btnOutline}>Open</button>
        </div>
      </div>
    </li>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 data-tour="page-title" className="text-2xl font-bold tracking-tight text-foreground">{isAdmin ? 'Consultation sessions' : 'My sessions'}</h1>
          <p data-tour="sessions-stats" className="mt-0.5 text-sm text-muted-foreground">
            {today} today · {week} in the next 7 days · {buckets.note.length} need{buckets.note.length === 1 ? 's' : ''} a note
            {isAdmin && <span> · {money(received)} received</span>}
            <span className="ml-2 text-xs">Times in {zoneLabel()}</span>
          </p>
        </div>
        <div className="flex overflow-hidden rounded-xl border border-border bg-white">
          {([['list', 'List', Rows], ['calendar', 'Calendar', CalendarBlank]] as const).map(([key, label, Icon]) => (
            <button key={key} onClick={() => setView(key)} aria-pressed={view === key} className={`flex h-9 items-center gap-1.5 px-3 text-xs font-bold transition-colors ${view === key ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {failed && <div className={`${card} px-5 py-4 text-sm text-muted-foreground`}>Sessions could not be loaded. Check your connection and reload the page.</div>}

      {/* Next session */}
      {next && view === 'list' && (
        <section data-tour="sessions-next" className={`${card} p-5`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className={heading}>Next session</h2>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${canJoin(next) ? 'bg-accent text-accent-foreground' : 'bg-primary/10 text-primary'}`}>{countdown(next)}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-xl font-bold text-foreground">{dayName(next.start)} · {clock(next.start)} – {clock(next.end)}</p>
            <p className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{initials(next.clientName)}</span>
              <span className="min-w-0 truncate text-sm font-semibold text-foreground">{next.clientName} · <span className="font-normal text-muted-foreground">{kindOf(next)}{isAdmin && next.consultantName ? ` · ${next.consultantName}` : ''}</span></span>
            </p>
          </div>
          {next.clientNote && <p className="mt-3 rounded-xl bg-muted/50 px-4 py-2.5 text-sm text-foreground"><span className="font-bold">Client’s note: </span>{next.clientNote}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
            {joinButton(next, true)}
            <span className="text-xs text-muted-foreground">
              {!next.hasRoom ? 'The video room is not ready yet.' : canJoin(next) ? 'The room is open.' : `Opens at ${clock(joinOpensAt(next))}, ${HOST_JOIN_OPENS_MIN} minutes before the start`}
            </span>
            <span className="flex flex-wrap gap-2 sm:ml-auto">
              <button onClick={() => setOpenId(next.id)} className={btnOutline}>Details</button>
              <button onClick={() => start('move', next)} className={btnOutline}>Move</button>
              <button onClick={() => start('cancel', next)} className={btnOutline}>Cancel</button>
            </span>
          </div>
        </section>
      )}

      {/* ── List ── */}
      {view === 'list' && (
        <>
          <div data-tour="sessions-filters" className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1.5">
              {TABS.map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)} aria-pressed={tab === key} className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${tab === key ? 'border-primary bg-primary text-white' : 'border-border bg-white text-foreground hover:bg-muted/60'}`}>
                  {label} <span className={tab === key ? 'text-white/70' : key === 'note' && buckets.note.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>{buckets[key].length}</span>
                  {key === 'note' && buckets.note.length > 0 && tab !== key && <Dot className="ml-1.5 bg-accent" />}
                </button>
              ))}
            </div>
            <div className="ml-auto flex w-full flex-wrap gap-2 sm:w-auto">
              {isAdmin && consultants.length > 1 && (
                <select aria-label="Consultant" value={consultant} onChange={(e) => setConsultant(e.target.value)} className="h-9 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary">
                  <option value="">All consultants</option>
                  {consultants.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>
              )}
              <div className="relative flex-1 sm:w-60 sm:flex-none">
                <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input aria-label="Search sessions" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search client" className="h-9 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
          </div>

          {shown.length === 0 ? (
            <div className={`${card} flex flex-col items-center px-6 py-12 text-center`}>
              {tab === 'note' && !q ? <CheckCircle weight="fill" className="mb-2 h-8 w-8 text-secondary" /> : <VideoCamera className="mb-2 h-8 w-8 text-muted-foreground/30" />}
              <p className="text-sm font-semibold text-foreground">
                {q ? 'No session matches your search' : tab === 'upcoming' ? 'No upcoming sessions' : tab === 'note' ? 'Every session is written up' : 'Nothing here yet'}
              </p>
              {tab === 'upcoming' && !q && <p className="mt-1 text-sm text-muted-foreground">Sessions appear here when a client books one of your free times.</p>}
            </div>
          ) : (
            <div data-tour="sessions-list" className={`${card} overflow-hidden`}>
              <div className="hidden grid-cols-[9rem_minmax(0,1.3fr)_minmax(0,1fr)_8rem_auto] gap-4 border-b border-border bg-muted/40 px-5 py-2.5 text-xs font-semibold text-muted-foreground md:grid">
                <span>When</span><span>Client</span><span>Session</span><span>Status</span><span />
              </div>
              <ul className="divide-y divide-border/70">{shown.map(row)}</ul>
            </div>
          )}
        </>
      )}

      {/* ── Calendar ── */}
      {view === 'calendar' && (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className={`${card} overflow-hidden`}>
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <button onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))} aria-label="Previous month" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted/60"><CaretLeft className="h-4 w-4" /></button>
                <p className="w-36 text-center text-sm font-bold text-foreground">{month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
                <button onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))} aria-label="Next month" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted/60"><CaretRight className="h-4 w-4" /></button>
              </div>
              <button onClick={() => { setMonth(new Date()); setDay(new Date()); }} className={btnOutline}>Today</button>
            </div>
            <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-semibold text-muted-foreground">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <span key={d} className="py-2">{d}</span>)}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((d, i) => {
                const list = onDay(d);
                const inMonth = d.getMonth() === month.getMonth();
                const isToday = sameDay(d, new Date());
                const selected = !!day && sameDay(d, day);
                return (
                  <button
                    key={i}
                    onClick={() => setDay(selected ? null : d)}
                    aria-pressed={selected}
                    className={`min-h-16 border-b border-r border-border/70 p-1.5 text-left align-top transition-colors sm:min-h-24 ${i % 7 === 6 ? 'border-r-0' : ''} ${selected ? 'bg-primary/10' : 'hover:bg-muted/40'} ${inMonth ? '' : 'opacity-40'}`}
                  >
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${isToday ? 'bg-primary text-white' : 'text-foreground'}`}>{d.getDate()}</span>
                    <span className="mt-1 hidden space-y-0.5 sm:block">
                      {list.slice(0, 2).map((s) => (
                        <span key={s.id} className="flex items-center gap-1 truncate text-[11px] text-foreground"><Dot className={STATUS[s.status]?.dot ?? 'bg-muted'} /><span className="truncate">{clock(s.start)} {s.clientName}</span></span>
                      ))}
                      {list.length > 2 && <span className="block text-[11px] font-semibold text-muted-foreground">+{list.length - 2} more</span>}
                    </span>
                    {list.length > 0 && <span className="mt-1 flex gap-0.5 sm:hidden">{list.slice(0, 4).map((s) => <Dot key={s.id} className={STATUS[s.status]?.dot ?? 'bg-muted'} />)}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={card}>
            <div className="border-b border-border px-4 py-3">
              <p className={heading}>{day ? day.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Select a day'}</p>
            </div>
            {!day ? <p className="px-4 py-6 text-sm text-muted-foreground">Choose a day to see its sessions.</p>
              : onDay(day).length === 0 ? <p className="px-4 py-6 text-sm text-muted-foreground">Nothing is scheduled for this day.</p>
              : (
                <ul className="divide-y divide-border/70">
                  {onDay(day).map((s) => (
                    <li key={s.id}>
                      <button onClick={() => setOpenId(s.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40">
                        <span className="w-12 shrink-0 text-sm font-bold text-foreground">{clock(s.start)}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-foreground">{s.clientName}</span>
                          <span className="block truncate text-xs text-muted-foreground">{kindOf(s)}</span>
                        </span>
                        {statusOf(s)}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
          </div>
        </div>
      )}

      {/* ── Session panel ── */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setOpenId(null)}>
          <aside role="dialog" aria-modal="true" aria-label={`Session with ${open.clientName}`} className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-foreground">{open.clientName}</h2>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">{dayName(open.start)} · {clock(open.start)} – {clock(open.end)} {statusOf(open)}</p>
              </div>
              <button onClick={() => setOpenId(null)} aria-label="Close" className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>

            <div className="min-h-0 flex-1 divide-y divide-border/70 overflow-y-auto">
              <section className="px-5 py-4">
                <h3 className={`mb-2 ${heading}`}>Client</h3>
                <div className="space-y-1.5 text-sm text-foreground">
                  {open.clientEmail && <p className="flex items-center gap-2"><Envelope className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="min-w-0 select-all truncate">{open.clientEmail}</span></p>}
                  {open.clientPhone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="select-all">{open.clientPhone}</span></p>}
                </div>
                {open.personId
                  ? <Link href={`/clients/${open.personId}`} className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">Open client profile <ArrowSquareOut className="h-3.5 w-3.5" /></Link>
                  : <p className="mt-2 text-xs text-muted-foreground">This person booked as a guest and has no portal account yet.</p>}
              </section>

              <section className="px-5 py-4">
                <h3 className={`mb-2 ${heading}`}>Client’s note</h3>
                <p className="whitespace-pre-wrap text-sm text-foreground">{open.clientNote || <span className="text-muted-foreground">The client did not leave a note.</span>}</p>
              </section>

              <section className="px-5 py-4">
                <h3 className={`mb-2 ${heading}`}>Session</h3>
                {[
                  ['Type', `${kindOf(open)} · ${open.minutes} min`],
                  ...(isAdmin && open.consultantName ? [['Consultant', open.consultantName]] : []),
                  ['Paid', open.isFree ? 'Free session' : money(open.paid)],
                  ...(open.refund ? [['Refunded', money(open.refund)]] : []),
                  ['Booked', new Date(open.bookedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })],
                  ...(open.movedAt ? [['Moved', `on ${new Date(open.movedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`]] : []),
                ].map(([label, value]) => (
                  <p key={label} className="flex items-center justify-between gap-3 py-1 text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="text-right font-semibold text-foreground">{value}</span>
                  </p>
                ))}
              </section>

              <section className="px-5 py-4">
                <h3 className={`mb-2 flex items-center justify-between ${heading}`}>
                  Your note
                  {open.status === 'COMPLETED' && <button onClick={() => start('complete', open)} className="text-xs font-bold normal-case tracking-normal text-primary hover:underline">{open.caseNote ? 'Edit' : 'Add'}</button>}
                </h3>
                <p className="whitespace-pre-wrap text-sm text-foreground">{open.caseNote || <span className="text-muted-foreground">{open.status === 'CONFIRMED' ? 'Written when you mark the session complete. Clients never see it.' : 'No note was written.'}</span>}</p>
              </section>
            </div>

            {open.status === 'CONFIRMED' && (
              <div className="space-y-2 border-t border-border px-5 py-4">
                {!ended(open) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {joinButton(open)}
                    <button onClick={() => start('move', open)} className={btnOutline}>Move</button>
                    <button onClick={() => start('cancel', open)} className={btnOutline}>Cancel</button>
                    {!canJoin(open) && open.hasRoom && <span className="text-xs text-muted-foreground">Join opens at {clock(joinOpensAt(open))}</span>}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => start('complete', open)} disabled={now < open.start.getTime()} className={ended(open) ? btnPrimary : btnOutline}>Mark complete</button>
                  <button onClick={() => start('noshow', open)} disabled={!canNoShow(open)} className={btnOutline}>Client did not attend</button>
                </div>
                {now < open.start.getTime() && <p className="text-xs text-muted-foreground">You can complete the session, or record that the client did not attend, once it has started.</p>}
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ── Dialogs ── */}
      {dialog?.kind === 'complete' && (
        <Modal title={dialog.s.status === 'COMPLETED' ? 'Session note' : 'Mark session complete'} sub={`Session with ${dialog.s.clientName} · ${dayName(dialog.s.start)} ${clock(dialog.s.start)}`} onClose={() => setDialog(null)}>
          <label htmlFor="case-note" className="mb-1.5 block text-xs font-bold text-foreground">Your note</label>
          <textarea id="case-note" value={text} onChange={(e) => setText(e.target.value)} rows={5} autoFocus placeholder="What you covered, what you advised, and any follow-up." className={`${field} resize-none`} />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Kept for the team; the client never sees it.{dialog.s.isFree && dialog.s.status !== 'COMPLETED' ? ' After a free session, the client is sent a follow-up with a 10% discount two days later.' : ''}
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setDialog(null)} className={btnOutline}>Cancel</button>
            <button onClick={confirm} disabled={busy || (dialog.s.status === 'COMPLETED' && !text.trim())} className={btnPrimary}>{busy && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} {dialog.s.status === 'COMPLETED' ? 'Save note' : 'Mark complete'}</button>
          </div>
        </Modal>
      )}

      {dialog?.kind === 'cancel' && (
        <Modal title="Cancel this session?" sub={`${dialog.s.clientName} · ${dayName(dialog.s.start)} ${clock(dialog.s.start)}`} onClose={() => setDialog(null)}>
          <p className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-foreground">
            {dialog.s.paid > 0 ? <>The client is refunded in full, <span className="font-bold">{money(dialog.s.paid)}</span>, because the cancellation is not their choice.</> : 'This was a free session, so there is nothing to refund.'} This time will not be offered to anyone else.
          </p>
          <label htmlFor="cancel-reason" className="mb-1.5 mt-4 block text-xs font-bold text-foreground">Reason (sent to the client)</label>
          <textarea id="cancel-reason" value={text} onChange={(e) => setText(e.target.value)} rows={3} autoFocus placeholder="For example: I am unwell and need to rearrange." className={`${field} resize-none`} />
          <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">Would you rather keep the booking? <button onClick={() => start('move', dialog.s)} className="font-bold text-primary hover:underline">Move it instead</button></p>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setDialog(null)} className={btnOutline}>Keep session</button>
            <button onClick={confirm} disabled={busy || !text.trim()} className={btnPrimary}>{busy && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} Cancel session</button>
          </div>
        </Modal>
      )}

      {dialog?.kind === 'noshow' && (
        <Modal title="The client did not attend?" sub={`${dialog.s.clientName} · ${dayName(dialog.s.start)} ${clock(dialog.s.start)}`} onClose={() => setDialog(null)}>
          <p className="rounded-xl bg-accent/15 px-4 py-3 text-sm text-foreground">
            The session is recorded as missed{dialog.s.paid > 0 ? <> and the client is <span className="font-bold">not refunded</span></> : ''}. Only do this if you waited and they did not join.
          </p>
          <label htmlFor="noshow-note" className="mb-1.5 mt-4 block text-xs font-bold text-foreground">Note (optional, for the team)</label>
          <textarea id="noshow-note" value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="For example: waited 15 minutes, no reply on WhatsApp." className={`${field} resize-none`} />
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setDialog(null)} className={btnOutline}>Back</button>
            <button onClick={confirm} disabled={busy} className={btnPrimary}>{busy && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} Mark as missed</button>
          </div>
        </Modal>
      )}

      {dialog?.kind === 'move' && (
        <Modal title="Move this session" sub={`${dialog.s.clientName} · currently ${dayName(dialog.s.start)} ${clock(dialog.s.start)}`} onClose={() => setDialog(null)}>
          {!slots ? <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground"><CircleNotch className="h-4 w-4 animate-spin" /> Loading free times…</p>
            : slots.length === 0 ? <p className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-foreground">There are no other free times in the next four weeks. Add availability under Consultants first, then move the session.</p>
            : (
              <>
                <p className={`mb-2 ${heading}`}>{isAdmin && dialog.s.consultantName ? `${dialog.s.consultantName}’s free times` : 'Your free times'}</p>
                <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                  {Object.entries(slots.reduce((days: Record<string, any[]>, slot: any) => {
                    const key = new Date(slot.startAt).toDateString();
                    (days[key] ??= []).push(slot);
                    return days;
                  }, {})).map(([key, list]) => (
                    <div key={key}>
                      <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{dayName(new Date(key))}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(list as any[]).map((slot) => (
                          <button key={slot.id} onClick={() => setPick(slot.id)} aria-pressed={pick === slot.id} className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${pick === slot.id ? 'border-primary bg-primary text-white' : 'border-border bg-white text-foreground hover:border-primary/40'}`}>
                            {clock(new Date(slot.startAt))}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          <p className="mt-4 text-xs text-muted-foreground">The client is emailed and messaged with the new time. Their payment carries over, and this does not use up their own free move.</p>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setDialog(null)} className={btnOutline}>Close</button>
            <button onClick={confirm} disabled={busy || !pick} className={btnPrimary}>{busy && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} Move session</button>
          </div>
        </Modal>
      )}

      {/* ── Host video room ── */}
      {room && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-black">
          <div className="flex shrink-0 items-center justify-between bg-primary px-4 py-2">
            <span className="text-sm font-bold text-white">Session with {room.clientName} · you are the host</span>
            <button onClick={() => { setRoom(null); load(); }} className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/25"><X className="h-3.5 w-3.5" /> Leave session</button>
          </div>
          <iframe src={room.url} title="Video session" allow="camera; microphone; fullscreen; display-capture; autoplay" className="w-full flex-1 border-0" />
        </div>
      )}
    </div>
  );
}
