'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Skeleton } from '@mjn/ui';
import { CalendarBlank, CheckCircle, X, VideoCamera, Plus, CircleNotch, ChatCircle, Headset } from '@mjn/ui';
import { toast } from 'sonner';
import { useUser } from '../../../contexts/user-context';
import { api } from '../../../lib/api';

// ── Wording (the page follows the client's preferred language) ────────────────

type Locale = 'en' | 'fr';

const TEXT = {
  en: {
    title: 'My sessions',
    book: 'Book a session',
    next: 'Next session',
    yourTime: (city: string, zone: string) => (city ? `${city} time${zone ? ` (${zone})` : ''}` : 'Your local time'),
    with: 'with',
    yourNote: 'Your note',
    join: 'Join',
    joining: 'Opening…',
    joinOpens: (time: string) => `Opens at ${time}, 10 minutes before the start`,
    joinOpen: 'The room is open',
    joinByLink: 'Your consultant will send you the link for this session.',
    notReady: 'Your video room is not ready yet. Try again a few minutes before the start, or message your team.',
    joinFailed: 'The session could not be opened. Please try again.',
    calendar: 'Add to calendar',
    google: 'Google Calendar',
    ics: 'Outlook or Apple (file)',
    reschedule: 'Reschedule',
    cancel: 'Cancel',
    before: 'Before you join: check your camera and microphone, and find a quiet place with a steady connection.',
    in: { now: 'Now', min: (n: number) => `in ${n} min`, hours: (n: number) => (n === 1 ? 'in 1 hour' : `in ${n} hours`), tomorrow: 'tomorrow', days: (n: number) => `in ${n} days` },
    unconfirmed: 'Not confirmed yet',
    unpaid: 'Payment was not completed, so this time is not reserved for you.',
    bookAgain: 'Book again',
    tabs: { upcoming: 'Upcoming', past: 'Past' },
    noUpcoming: 'No upcoming sessions',
    noUpcomingBody: 'Book a session with a consultant whenever you need one.',
    noPast: 'Past sessions will appear here.',
    showAll: (n: number) => `Show all ${n}`,
    status: { CONFIRMED: 'Confirmed', AWAITING_PAYMENT: 'Not confirmed', COMPLETED: 'Completed', CANCELLED: 'Cancelled', NO_SHOW: 'Missed' } as Record<string, string>,
    refund: (a: string) => `refund ${a}`,
    kinds: { HEALTH: 'Health consultation', CAREER: 'Career consultation', BOTH: 'Consultation', consultation: 'Consultation', video_consultation: 'Video consultation', follow_up: 'Follow-up', document_review: 'Document review', simulation: 'Simulation lab', class: 'Live class', fallback: 'Session' } as Record<string, string>,
    good: 'Good to know',
    rules: [
      ['Joining', 'The Join button opens 10 minutes before your session starts.'],
      ['Moving a session', 'Free, once, when it is more than 24 hours away.'],
      ['Cancelling', 'Full refund more than 24 hours before. Half from 4 to 24 hours before. None under 4 hours.'],
      ['Missed a session?', 'Message your team and we will help you rebook.'],
    ],
    help: 'Need help?',
    message: 'Message team',
    getHelp: 'Get help',
    cancelTitle: 'Cancel this session?',
    paid: (a: string) => `You paid ${a}.`,
    refundFull: (a: string) => `Cancelling now refunds ${a} (100%), because the session is more than 24 hours away.`,
    refundHalf: (a: string) => `Cancelling now refunds ${a} (50%), because the session is between 4 and 24 hours away.`,
    refundNone: 'Cancelling now gives no refund, because the session is less than 4 hours away.',
    refundFree: 'This session was free, so there is nothing to refund.',
    refundWhen: 'Refunds are paid back within 5 to 7 working days.',
    rather: 'Would you rather move it?',
    keep: 'Keep session',
    cancelIt: 'Cancel session',
    cancelled: 'Session cancelled.',
    cancelFailed: 'The session could not be cancelled. Please try again.',
    previewFailed: 'The refund could not be worked out. Please try again.',
    moveTitle: 'Move your session',
    currently: 'Currently',
    freeTimes: (name: string) => `${name}'s free times`,
    noTimes: 'This consultant has no other free times in the next four weeks. Message your team and we will find one.',
    moveRule: 'You can move a session once. Your payment carries over.',
    move: 'Move session',
    moved: 'Session moved. You will get a confirmation by email.',
    moveFailed: 'The session could not be moved. Please try again.',
    close: 'Close',
    leave: 'Leave session',
    room: 'MJN Healthcare session',
  },
  fr: {
    title: 'Mes séances',
    book: 'Réserver une séance',
    next: 'Prochaine séance',
    yourTime: (city: string, zone: string) => (city ? `Heure de ${city}${zone ? ` (${zone})` : ''}` : 'Votre heure locale'),
    with: 'avec',
    yourNote: 'Votre note',
    join: 'Rejoindre',
    joining: 'Ouverture…',
    joinOpens: (time: string) => `Ouvre à ${time}, 10 minutes avant le début`,
    joinOpen: 'La salle est ouverte',
    joinByLink: 'Votre consultant vous enverra le lien de cette séance.',
    notReady: 'Votre salle vidéo n’est pas encore prête. Réessayez quelques minutes avant le début, ou écrivez à votre équipe.',
    joinFailed: 'La séance n’a pas pu être ouverte. Veuillez réessayer.',
    calendar: 'Ajouter au calendrier',
    google: 'Google Agenda',
    ics: 'Outlook ou Apple (fichier)',
    reschedule: 'Déplacer',
    cancel: 'Annuler',
    before: 'Avant de rejoindre : vérifiez votre caméra et votre micro, et installez-vous au calme avec une connexion stable.',
    in: { now: 'Maintenant', min: (n: number) => `dans ${n} min`, hours: (n: number) => (n === 1 ? 'dans 1 heure' : `dans ${n} heures`), tomorrow: 'demain', days: (n: number) => `dans ${n} jours` },
    unconfirmed: 'Pas encore confirmées',
    unpaid: 'Le paiement n’a pas été finalisé : ce créneau ne vous est pas réservé.',
    bookAgain: 'Réserver à nouveau',
    tabs: { upcoming: 'À venir', past: 'Passées' },
    noUpcoming: 'Aucune séance à venir',
    noUpcomingBody: 'Réservez une séance avec un consultant quand vous en avez besoin.',
    noPast: 'Vos séances passées apparaîtront ici.',
    showAll: (n: number) => `Tout afficher (${n})`,
    status: { CONFIRMED: 'Confirmée', AWAITING_PAYMENT: 'Non confirmée', COMPLETED: 'Terminée', CANCELLED: 'Annulée', NO_SHOW: 'Manquée' } as Record<string, string>,
    refund: (a: string) => `remboursement ${a}`,
    kinds: { HEALTH: 'Consultation santé', CAREER: 'Consultation carrière', BOTH: 'Consultation', consultation: 'Consultation', video_consultation: 'Consultation vidéo', follow_up: 'Suivi', document_review: 'Revue de documents', simulation: 'Laboratoire de simulation', class: 'Cours en direct', fallback: 'Séance' } as Record<string, string>,
    good: 'Bon à savoir',
    rules: [
      ['Rejoindre', 'Le bouton « Rejoindre » s’active 10 minutes avant le début de la séance.'],
      ['Déplacer une séance', 'Gratuit, une fois, si elle a lieu dans plus de 24 heures.'],
      ['Annuler', 'Remboursement intégral plus de 24 heures avant. La moitié entre 4 et 24 heures avant. Aucun à moins de 4 heures.'],
      ['Séance manquée ?', 'Écrivez à votre équipe : nous vous aiderons à en réserver une autre.'],
    ],
    help: 'Besoin d’aide ?',
    message: 'Écrire à mon équipe',
    getHelp: 'Obtenir de l’aide',
    cancelTitle: 'Annuler cette séance ?',
    paid: (a: string) => `Vous avez payé ${a}.`,
    refundFull: (a: string) => `En annulant maintenant, vous êtes remboursé de ${a} (100 %), car la séance a lieu dans plus de 24 heures.`,
    refundHalf: (a: string) => `En annulant maintenant, vous êtes remboursé de ${a} (50 %), car la séance a lieu dans 4 à 24 heures.`,
    refundNone: 'En annulant maintenant, aucun remboursement n’est possible, car la séance a lieu dans moins de 4 heures.',
    refundFree: 'Cette séance était gratuite : il n’y a rien à rembourser.',
    refundWhen: 'Les remboursements sont versés sous 5 à 7 jours ouvrés.',
    rather: 'Vous préférez la déplacer ?',
    keep: 'Garder la séance',
    cancelIt: 'Annuler la séance',
    cancelled: 'Séance annulée.',
    cancelFailed: 'La séance n’a pas pu être annulée. Veuillez réessayer.',
    previewFailed: 'Le remboursement n’a pas pu être calculé. Veuillez réessayer.',
    moveTitle: 'Déplacer votre séance',
    currently: 'Actuellement',
    freeTimes: (name: string) => `Créneaux libres de ${name}`,
    noTimes: 'Ce consultant n’a pas d’autre créneau libre dans les quatre prochaines semaines. Écrivez à votre équipe : nous en trouverons un.',
    moveRule: 'Une séance peut être déplacée une fois. Votre paiement est conservé.',
    move: 'Déplacer la séance',
    moved: 'Séance déplacée. Vous recevrez une confirmation par e-mail.',
    moveFailed: 'La séance n’a pas pu être déplacée. Veuillez réessayer.',
    close: 'Fermer',
    leave: 'Quitter la séance',
    room: 'Séance MJN Healthcare',
  },
};
type Text = (typeof TEXT)['en'];

// ── Sessions from both booking routes, in one shape ───────────────────────────

type Session = {
  id: string; paid: boolean; status: string; start: Date; end: Date; kind: string;
  who: string | null; consultantId: string | null; note: string | null;
  amountPaid: number; refundAmount: number | null; isFree: boolean; canReschedule: boolean;
};

function toSessions(caseBookings: any[], consultations: any[]): Session[] {
  const fromConsultations = consultations.filter((c) => c.slot?.startAt).map((c): Session => {
    const start = new Date(c.slot.startAt);
    return {
      id: c.id, paid: true, status: c.status, start,
      end: new Date(start.getTime() + (c.slot.durationMinutes ?? 45) * 60000),
      kind: c.consultationCategory ?? 'consultation',
      who: c.slot.consultant?.name ?? null, consultantId: c.slot.consultantId ?? c.slot.consultant?.id ?? null,
      note: c.preSessionNote ?? null, amountPaid: Number(c.amountPaid ?? 0),
      refundAmount: c.refundAmount == null ? null : Number(c.refundAmount),
      isFree: !!c.slot.isFree, canReschedule: !!c.canReschedule,
    };
  });
  const fromCase = caseBookings.filter((b) => b.slot?.startTime).map((b): Session => {
    const start = new Date(b.slot.startTime);
    return {
      id: b.id, paid: false, status: b.status, start,
      end: b.slot.endTime ? new Date(b.slot.endTime) : new Date(start.getTime() + 45 * 60000),
      kind: b.type ?? 'consultation', who: b.slot.consultant?.name ?? null, consultantId: null,
      note: null, amountPaid: 0, refundAmount: null, isFree: true, canReschedule: false,
    };
  });
  return [...fromConsultations, ...fromCase];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const JOIN_OPENS_MIN = 10;
const DOT: Record<string, string> = {
  CONFIRMED: 'bg-secondary', AWAITING_PAYMENT: 'bg-accent', COMPLETED: 'bg-primary', CANCELLED: 'bg-muted-foreground/40', NO_SHOW: 'bg-rose-500',
};
const card = 'rounded-2xl border border-border bg-white shadow-sm';
const heading = 'text-xs font-bold uppercase tracking-widest text-muted-foreground';
const btnPrimary = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-40';
const btnOutline = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted/60 disabled:opacity-40';

function Dot({ className }: { className: string }) {
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${className}`} />;
}
function money(n: number) {
  return `$${Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0 })}`;
}
function initials(name?: string | null) {
  return (name ?? '').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
}
function zoneLabel(t: Text) {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    const city = (tz.split('/').pop() ?? '').replace(/_/g, ' ');
    const short = new Intl.DateTimeFormat('en-GB', { timeZoneName: 'short' }).formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value ?? '';
    return t.yourTime(city, short);
  } catch {
    return t.yourTime('', '');
  }
}
function stamp(d: Date) {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}
function calendarText(s: Session, t: Text) {
  return { title: `MJN Healthcare: ${t.kinds[s.kind] ?? t.kinds.fallback}${s.who ? ` ${t.with} ${s.who}` : ''}`, details: 'Join from your MJN portal: My sessions.' };
}
function openGoogle(s: Session, t: Text) {
  const { title, details } = calendarText(s, t);
  window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${stamp(s.start)}/${stamp(s.end)}&details=${encodeURIComponent(details)}`, '_blank', 'noopener');
}
function downloadIcs(s: Session, t: Text) {
  const { title, details } = calendarText(s, t);
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MJN Healthcare//Sessions//EN', 'BEGIN:VEVENT', `UID:${s.id}@mjnhealthcare.com`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(s.start)}`, `DTEND:${stamp(s.end)}`, `SUMMARY:${title}`, `DESCRIPTION:${details}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'mjn-session.ics'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Modal({ title, onClose, children, t }: { title: string; onClose: () => void; children: ReactNode; t: Text }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-white p-6 shadow-xl sm:max-w-md sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          <button onClick={onClose} aria-label={t.close} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BookingsPage() {
  const { bookings, consultationBookings, loading, refresh, me } = useUser();
  const locale: Locale = me?.locale === 'fr' ? 'fr' : 'en';
  const t = TEXT[locale];
  const dl = locale === 'fr' ? 'fr-FR' : 'en-GB';
  const longDay = (d: Date) => d.toLocaleDateString(dl, { weekday: 'long', day: 'numeric', month: 'long' });
  const shortDay = (d: Date) => d.toLocaleDateString(dl, { weekday: 'short', day: 'numeric', month: 'short' });
  const clock = (d: Date) => d.toLocaleTimeString(dl, { hour: '2-digit', minute: '2-digit' });

  const [now, setNow] = useState(() => Date.now());
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [showAllPast, setShowAllPast] = useState(false);
  const [calendarFor, setCalendarFor] = useState<string | null>(null);
  const [joining, setJoining] = useState('');
  const [room, setRoom] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<{ s: Session; preview: any | null; failed?: boolean } | null>(null);
  const [moving, setMoving] = useState<{ s: Session; slots: any[] | null; pick: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Keeps "in 12 min" and the Join button honest while the page stays open.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const sessions = useMemo(() => toSessions(bookings ?? [], consultationBookings ?? []), [bookings, consultationBookings]);
  const upcoming = sessions.filter((s) => s.status === 'CONFIRMED' && s.end.getTime() > now).sort((a, b) => a.start.getTime() - b.start.getTime());
  const unconfirmed = sessions.filter((s) => s.status === 'AWAITING_PAYMENT' && s.start.getTime() > now).sort((a, b) => a.start.getTime() - b.start.getTime());
  const past = sessions.filter((s) => !upcoming.includes(s) && !unconfirmed.includes(s)).sort((a, b) => b.start.getTime() - a.start.getTime());
  const next = upcoming[0] ?? null;
  const later = upcoming.slice(1);

  const label = (s: Session) => t.kinds[s.kind] ?? t.kinds.fallback;
  const joinOpensAt = (s: Session) => new Date(s.start.getTime() - JOIN_OPENS_MIN * 60000);
  const canJoin = (s: Session) => s.paid && now >= joinOpensAt(s).getTime() && now <= s.end.getTime() + 30 * 60000;
  function countdown(s: Session) {
    const mins = Math.floor((s.start.getTime() - now) / 60000);
    if (mins <= 0) return t.in.now;
    if (mins < 60) return t.in.min(mins);
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t.in.hours(hours);
    const days = Math.floor(hours / 24);
    return days === 1 ? t.in.tomorrow : t.in.days(days);
  }

  async function join(s: Session) {
    setJoining(s.id);
    try {
      const info = await api.joinMySession(s.id);
      if (!info.roomUrl) { toast.info(t.notReady); return; }
      setRoom(info.token ? `${info.roomUrl}${info.roomUrl.includes('?') ? '&' : '?'}t=${info.token}` : info.roomUrl);
    } catch (e: any) {
      toast.error(e?.message && !/^Request failed/.test(e.message) ? e.message : t.joinFailed);
    } finally {
      setJoining('');
    }
  }

  function startCancel(s: Session) {
    setCalendarFor(null);
    if (!s.paid) { setCancelling({ s, preview: { amountPaid: 0, refundAmount: 0, refundPercent: 0 } }); return; }
    setCancelling({ s, preview: null });
    api.getSessionCancelPreview(s.id)
      .then((preview) => setCancelling((c) => (c && c.s.id === s.id ? { ...c, preview } : c)))
      .catch(() => setCancelling((c) => (c && c.s.id === s.id ? { ...c, failed: true } : c)));
  }
  async function confirmCancel() {
    if (!cancelling) return;
    setBusy(true);
    try {
      if (cancelling.s.paid) await api.cancelMySession(cancelling.s.id); else await api.cancelBooking(cancelling.s.id);
      toast.success(t.cancelled);
      setCancelling(null);
      await refresh();
    } catch (e: any) {
      toast.error(e?.message && !/^Request failed/.test(e.message) ? e.message : t.cancelFailed);
    } finally {
      setBusy(false);
    }
  }

  function startMove(s: Session) {
    setCancelling(null); setCalendarFor(null);
    setMoving({ s, slots: null, pick: '' });
    if (!s.consultantId) { setMoving({ s, slots: [], pick: '' }); return; }
    api.getConsultantSlots(s.consultantId)
      .then((list) => {
        const free = (list ?? []).filter((x: any) => !!x.isFree === s.isFree && new Date(x.startAt).getTime() > Date.now());
        setMoving((m) => (m && m.s.id === s.id ? { ...m, slots: free } : m));
      })
      .catch(() => setMoving((m) => (m && m.s.id === s.id ? { ...m, slots: [] } : m)));
  }
  async function confirmMove() {
    if (!moving?.pick) return;
    setBusy(true);
    try {
      await api.rescheduleMySession(moving.s.id, moving.pick);
      toast.success(t.moved);
      setMoving(null);
      await refresh();
    } catch (e: any) {
      toast.error(e?.message && !/^Request failed/.test(e.message) ? e.message : t.moveFailed);
      // The list may be out of date if someone else took the time.
      if (moving) startMove(moving.s);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="space-y-4"><Skeleton className="h-56 rounded-2xl" /><Skeleton className="h-48 rounded-2xl" /></div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  const calendarMenu = (s: Session) => (
    <span className="relative">
      <button onClick={() => setCalendarFor((v) => (v === s.id ? null : s.id))} aria-expanded={calendarFor === s.id} className={btnOutline}><CalendarBlank className="h-3.5 w-3.5" /> {t.calendar}</button>
      {calendarFor === s.id && (
        <>
          <span className="fixed inset-0 z-30" onClick={() => setCalendarFor(null)} />
          <span className="absolute left-0 top-full z-40 mt-1.5 block w-56 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-xl">
            <button onClick={() => { openGoogle(s, t); setCalendarFor(null); }} className="block w-full px-3.5 py-2 text-left text-sm text-foreground hover:bg-muted/60">{t.google}</button>
            <button onClick={() => { downloadIcs(s, t); setCalendarFor(null); }} className="block w-full px-3.5 py-2 text-left text-sm text-foreground hover:bg-muted/60">{t.ics}</button>
          </span>
        </>
      )}
    </span>
  );
  const manage = (s: Session) => (
    <>
      {calendarMenu(s)}
      {s.canReschedule && <button onClick={() => startMove(s)} className={btnOutline}>{t.reschedule}</button>}
      <button onClick={() => startCancel(s)} className={btnOutline}>{t.cancel}</button>
    </>
  );
  const statusOf = (s: Session) => (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-foreground">
      <Dot className={DOT[s.status] ?? 'bg-muted'} /> {t.status[s.status] ?? s.status}
      {s.status === 'CANCELLED' && s.refundAmount ? <span className="font-normal text-muted-foreground">· {t.refund(money(s.refundAmount))}</span> : null}
    </span>
  );
  const shownPast = showAllPast ? past : past.slice(0, 8);

  return (
    <div className="space-y-4">
      <div data-tour="bookings-header" className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.title}</h1>
        <Link href="/bookings/new" className={`${btnPrimary} px-4 py-2.5 text-sm`}><Plus className="h-4 w-4" /> {t.book}</Link>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0 space-y-4">
          {/* Next session */}
          {next && (
            <section data-tour="bookings-next" className={`${card} p-5`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className={heading}>{t.next}</h2>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${canJoin(next) ? 'bg-accent text-accent-foreground' : 'bg-primary/10 text-primary'}`}>{countdown(next)}</span>
              </div>
              <p className="mt-3 text-xl font-bold capitalize text-foreground">{longDay(next.start)}</p>
              <p className="text-base font-semibold text-foreground">{clock(next.start)} – {clock(next.end)} <span className="ml-1 text-xs font-normal text-muted-foreground">{zoneLabel(t)}</span></p>

              <p className="mt-4 flex items-center gap-3">
                {next.who && <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{initials(next.who)}</span>}
                <span className="text-sm font-semibold text-foreground">{label(next)}{next.who ? ` ${t.with} ${next.who}` : ''}</span>
              </p>
              {next.note && <p className="mt-3 rounded-xl bg-muted/50 px-4 py-2.5 text-sm text-foreground"><span className="font-bold">{t.yourNote}: </span>{next.note}</p>}

              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                {next.paid ? (
                  <>
                    <button onClick={() => join(next)} disabled={!canJoin(next) || joining === next.id} className={`${btnPrimary} w-full px-6 py-2.5 text-sm sm:w-auto`}>
                      {joining === next.id ? <CircleNotch className="h-4 w-4 animate-spin" /> : <VideoCamera className="h-4 w-4" />} {joining === next.id ? t.joining : t.join}
                    </button>
                    <span className="text-xs text-muted-foreground">{canJoin(next) ? t.joinOpen : t.joinOpens(clock(joinOpensAt(next)))}</span>
                  </>
                ) : <span className="text-sm text-muted-foreground">{t.joinByLink}</span>}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">{manage(next)}</div>
              {next.paid && <p className="mt-4 border-t border-border/70 pt-3 text-xs text-muted-foreground">{t.before}</p>}
            </section>
          )}

          {/* Not confirmed yet */}
          {unconfirmed.length > 0 && (
            <section className={card}>
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
                <h2 className={heading}>{t.unconfirmed}</h2>
                <span className="rounded-full bg-accent px-2 text-xs font-bold text-accent-foreground">{unconfirmed.length}</span>
              </div>
              <ul className="divide-y divide-border/70">
                {unconfirmed.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold capitalize text-foreground">{shortDay(s.start)} · {clock(s.start)}{s.who ? ` · ${s.who}` : ''}</p>
                      <p className="text-sm text-muted-foreground">{t.unpaid}</p>
                    </div>
                    <Link href="/bookings/new" className={btnOutline}>{t.bookAgain}</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Upcoming and past */}
          <section data-tour="bookings-list" className={`${card} overflow-hidden`}>
            <div className="flex gap-1 border-b border-border px-2">
              {(['upcoming', 'past'] as const).map((key) => (
                <button key={key} onClick={() => setTab(key)} className={`-mb-px border-b-2 px-3.5 py-3 text-sm font-semibold transition-colors ${tab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                  {t.tabs[key]} <span className="ml-1 text-xs text-muted-foreground">{key === 'upcoming' ? upcoming.length : past.length}</span>
                </button>
              ))}
            </div>

            {tab === 'upcoming' && (upcoming.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-12 text-center">
                <CalendarBlank className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="font-bold text-foreground">{t.noUpcoming}</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">{t.noUpcomingBody}</p>
                <Link href="/bookings/new" className={`${btnPrimary} mt-4`}><Plus className="h-3.5 w-3.5" /> {t.book}</Link>
              </div>
            ) : later.length === 0 ? (
              <p className="flex items-center gap-2 px-5 py-5 text-sm text-muted-foreground"><CheckCircle weight="fill" className="h-4 w-4 text-secondary" /> {t.next}: <span className="font-semibold capitalize text-foreground">{shortDay(next!.start)} · {clock(next!.start)}</span></p>
            ) : (
              <ul className="divide-y divide-border/70">
                {later.map((s) => (
                  <li key={s.id} className="space-y-2.5 px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                      <p className="text-sm font-bold capitalize text-foreground">{shortDay(s.start)} · {clock(s.start)} – {clock(s.end)}</p>
                      {statusOf(s)}
                    </div>
                    <p className="text-sm text-muted-foreground">{label(s)}{s.who ? ` · ${s.who}` : ''}</p>
                    <div className="flex flex-wrap gap-2">{manage(s)}</div>
                  </li>
                ))}
              </ul>
            ))}

            {tab === 'past' && (past.length === 0 ? <p className="px-5 py-8 text-center text-sm text-muted-foreground">{t.noPast}</p> : (
              <>
                <ul className="divide-y divide-border/70">
                  {shownPast.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5">
                      <span className="w-28 shrink-0 text-xs capitalize text-muted-foreground">{s.start.toLocaleDateString(dl, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{label(s)}{s.who ? ` · ${s.who}` : ''}</span>
                      {statusOf(s)}
                    </li>
                  ))}
                </ul>
                {past.length > shownPast.length && <button onClick={() => setShowAllPast(true)} className="w-full border-t border-border py-3 text-xs font-bold text-primary hover:bg-muted/40">{t.showAll(past.length)}</button>}
              </>
            ))}
          </section>
        </div>

        {/* Side panel */}
        <aside className="space-y-4">
          <details open className={`${card} group p-5`} data-tour="bookings-rules">
            <summary className={`flex cursor-pointer list-none items-center justify-between ${heading}`}>{t.good}</summary>
            <dl className="mt-3 space-y-3">
              {t.rules.map(([name, body]) => (
                <div key={name}>
                  <dt className="text-sm font-bold text-foreground">{name}</dt>
                  <dd className="text-sm text-muted-foreground">{body}</dd>
                </div>
              ))}
            </dl>
          </details>
          <section className={`${card} p-5`}>
            <h2 className={`mb-3 ${heading}`}>{t.help}</h2>
            <div className="grid gap-2">
              <Link href="/messages" className={btnOutline}><ChatCircle className="h-3.5 w-3.5" /> {t.message}</Link>
              <Link href="/tickets" className={btnOutline}><Headset className="h-3.5 w-3.5" /> {t.getHelp}</Link>
            </div>
          </section>
        </aside>
      </div>

      {/* Cancel */}
      {cancelling && (
        <Modal title={t.cancelTitle} onClose={() => setCancelling(null)} t={t}>
          <p className="rounded-xl bg-muted/50 px-4 py-2.5 text-sm font-semibold capitalize text-foreground">{shortDay(cancelling.s.start)} · {clock(cancelling.s.start)}{cancelling.s.who ? ` · ${cancelling.s.who}` : ''}</p>
          <div className="mt-3 min-h-12 text-sm text-foreground">
            {cancelling.failed ? <p className="text-muted-foreground">{t.previewFailed}</p>
              : !cancelling.preview ? <p className="flex items-center gap-2 text-muted-foreground"><CircleNotch className="h-4 w-4 animate-spin" /></p>
              : !cancelling.s.paid || cancelling.preview.amountPaid === 0 ? <p>{t.refundFree}</p>
              : (
                <>
                  <p>{t.paid(money(cancelling.preview.amountPaid))}</p>
                  <p className="mt-1 font-semibold">
                    {cancelling.preview.refundPercent === 100 ? t.refundFull(money(cancelling.preview.refundAmount))
                      : cancelling.preview.refundPercent > 0 ? t.refundHalf(money(cancelling.preview.refundAmount))
                      : t.refundNone}
                  </p>
                  {cancelling.preview.refundAmount > 0 && <p className="mt-1 text-xs text-muted-foreground">{t.refundWhen}</p>}
                </>
              )}
          </div>
          {cancelling.s.canReschedule && (
            <p className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/70 pt-3 text-sm text-muted-foreground">
              {t.rather} <button onClick={() => startMove(cancelling.s)} className="font-bold text-primary hover:underline">{t.reschedule}</button>
            </p>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setCancelling(null)} className={btnOutline}>{t.keep}</button>
            <button onClick={confirmCancel} disabled={busy || !cancelling.preview} className={btnPrimary}>{busy && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} {t.cancelIt}</button>
          </div>
        </Modal>
      )}

      {/* Reschedule */}
      {moving && (
        <Modal title={t.moveTitle} onClose={() => setMoving(null)} t={t}>
          <p className="text-sm text-muted-foreground">{t.currently}: <span className="font-semibold capitalize text-foreground">{shortDay(moving.s.start)} · {clock(moving.s.start)}</span></p>
          <p className="mt-1 text-xs text-muted-foreground">{zoneLabel(t)}</p>
          <div className="mt-4">
            {!moving.slots ? <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground"><CircleNotch className="h-4 w-4 animate-spin" /></p>
              : moving.slots.length === 0 ? <p className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-foreground">{t.noTimes}</p>
              : (
                <>
                  <p className={`mb-2 ${heading}`}>{t.freeTimes(moving.s.who ?? '')}</p>
                  <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                    {Object.entries(moving.slots.reduce((days: Record<string, any[]>, slot: any) => {
                      const key = new Date(slot.startAt).toDateString();
                      (days[key] ??= []).push(slot);
                      return days;
                    }, {})).map(([key, slots]) => (
                      <div key={key}>
                        <p className="mb-1.5 text-xs font-semibold capitalize text-muted-foreground">{shortDay(new Date(key))}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(slots as any[]).map((slot) => (
                            <button
                              key={slot.id}
                              onClick={() => setMoving((m) => (m ? { ...m, pick: slot.id } : m))}
                              aria-pressed={moving.pick === slot.id}
                              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${moving.pick === slot.id ? 'border-primary bg-primary text-white' : 'border-border bg-white text-foreground hover:border-primary/40'}`}
                            >
                              {clock(new Date(slot.startAt))}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{t.moveRule}</p>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setMoving(null)} className={btnOutline}>{t.close}</button>
            <button onClick={confirmMove} disabled={busy || !moving.pick} className={btnPrimary}>{busy && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} {t.move}</button>
          </div>
        </Modal>
      )}

      {/* Video room */}
      {room && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex shrink-0 items-center justify-between bg-primary px-4 py-2">
            <span className="text-sm font-bold text-white">{t.room}</span>
            <button onClick={() => setRoom(null)} className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/25"><X className="h-3.5 w-3.5" /> {t.leave}</button>
          </div>
          <iframe src={room} title={t.room} allow="camera; microphone; fullscreen; display-capture; autoplay" className="w-full flex-1 border-0" />
        </div>
      )}
    </div>
  );
}
