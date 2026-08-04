'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Badge, Skeleton } from '@mjn/ui';
import {
  CalendarBlank, CheckCircle, Clock, X, VideoCamera,
  BookOpen, FileText, Stethoscope, Users, ArrowRight,
  Bell, ChatCircle, Plus, User,
} from '@phosphor-icons/react';
import { useUser } from '../../../contexts/user-context';

// Normalise a ConsultationBooking (from /consult flow) to the same shape as a BookingModule booking
function normaliseConsultationBooking(cb: any): any {
  return {
    id: cb.id,
    type: 'video_consultation',
    status: cb.status === 'COMPLETED' ? 'COMPLETED' : cb.status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED',
    meetingUrl: cb.meetingUrl ?? null,
    notes: cb.preSessionNote ?? null,
    createdAt: cb.createdAt,
    slot: {
      startTime: cb.slot?.startAt ?? cb.slot?.startTime ?? null,
      endTime: cb.slot?.endAt ?? cb.slot?.endTime ?? null,
      consultant: cb.slot?.consultant ?? null,
    },
    // flag so we can show a different label
    _isConsultation: true,
    _paidAmount: cb.paidAmount,
    _category: cb.consultationCategory,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function bookingStatusVariant(status: string): 'success' | 'warning' | 'outline' | 'destructive' {
  if (status === 'CONFIRMED') return 'success';
  if (status === 'PENDING') return 'warning';
  if (status === 'CANCELLED') return 'destructive';
  return 'outline';
}

// Session type config — primary for main types, neutral for secondary
const SESSION_CONFIG: Record<string, { label: string; icon: typeof VideoCamera; color: string; bg: string }> = {
  consultation:         { label: 'Consultation',       icon: VideoCamera,  color: 'text-primary',           bg: 'bg-primary/10' },
  video_consultation:   { label: 'Video Consultation', icon: VideoCamera,  color: 'text-primary',           bg: 'bg-primary/10' },
  follow_up:            { label: 'Follow-Up',          icon: Users,        color: 'text-muted-foreground',  bg: 'bg-muted/60' },
  document_review:      { label: 'Document Review',    icon: FileText,     color: 'text-muted-foreground',  bg: 'bg-muted/60' },
  simulation:           { label: 'Simulation Lab',     icon: Stethoscope,  color: 'text-muted-foreground',  bg: 'bg-muted/60' },
  class:                { label: 'Live Class',          icon: BookOpen,     color: 'text-primary',           bg: 'bg-primary/10' },
};

function getConfig(type: string) {
  return SESSION_CONFIG[type] ?? { label: type ?? 'Session', icon: CalendarBlank, color: 'text-muted-foreground', bg: 'bg-muted/50' };
}

function isFuture(iso: string) {
  return new Date(iso) > new Date();
}

function getDuration(start: string, end?: string) {
  if (!end) return null;
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getCountdown(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'Now';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `In ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `In ${hours} hour${hours !== 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `In ${days} days`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isJoinable(iso: string): boolean {
  const diff = new Date(iso).getTime() - Date.now();
  return diff <= 15 * 60 * 1000 && diff > -2 * 60 * 60 * 1000;
}

function addToGoogleCalendar(booking: any) {
  const start = new Date(booking.slot?.startTime);
  const end = booking.slot?.endTime
    ? new Date(booking.slot.endTime)
    : new Date(start.getTime() + 60 * 60000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace('.000', '');
  const cfg = getConfig(booking.type);
  const title = encodeURIComponent(`MJN Healthcare: ${cfg.label}`);
  const dates = `${fmt(start)}/${fmt(end)}`;
  const desc = encodeURIComponent(
    [booking.meetingUrl ? `Join: ${booking.meetingUrl}` : '', booking.notes ?? ''].filter(Boolean).join('\n')
  );
  window.open(
    `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${desc}`,
    '_blank',
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function BookingsSkeleton() {
  return (
    <div className="space-y-6">
      <div><Skeleton className="h-7 w-36 mb-2" /><Skeleton className="h-4 w-72" /></div>
      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-6">
          <Skeleton className="h-44 rounded-2xl" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <div className="hidden xl:block w-[280px] shrink-0 space-y-4">
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ── Right Sidebar ─────────────────────────────────────────────────────────────

function BookingsSidebar({
  nextSession, router, onBook,
}: {
  nextSession: any;
  router: ReturnType<typeof useRouter>;
  onBook: () => void;
}) {
  return (
    <div className="hidden xl:block w-[280px] shrink-0 sticky top-6 self-start space-y-4">

      {/* Next session compact */}
      {nextSession && (() => {
        const cfg = getConfig(nextSession.type);
        const Icon = cfg.icon;
        const start = nextSession.slot?.startTime;
        const countdown = start ? getCountdown(start) : null;
        const joinable = start ? isJoinable(start) : false;
        return (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Next Session</p>
            <div className="flex items-center gap-3 mb-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.bg}`}>
                <Icon className={`h-5 w-5 ${cfg.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{cfg.label}</p>
                {start && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {' · '}
                    {new Date(start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
            {countdown && (
              <div className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                joinable ? 'bg-primary text-white animate-pulse' : 'bg-primary/10 text-primary'
              }`}>
                <Clock className="h-3 w-3" />
                {joinable ? 'Starting soon' : countdown}
              </div>
            )}
            {nextSession.meetingUrl && nextSession.status === 'CONFIRMED' ? (
              <a
                href={nextSession.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
              >
                <VideoCamera className="h-4 w-4" />
                {joinable ? 'Join now' : 'Join session'}
              </a>
            ) : nextSession.status === 'PENDING' ? (
              <div className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                <Bell className="h-3.5 w-3.5" /> Awaiting confirmation
              </div>
            ) : null}
          </div>
        );
      })()}

      {/* Quick actions */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Actions</p>
        <div className="space-y-1.5">
          <button
            onClick={onBook}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" /> Book a session
          </button>
          <button
            onClick={() => router.push('/case')}
            className="w-full flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            <ChatCircle className="h-4 w-4 text-primary shrink-0" />
            Message consultant
          </button>
          <button
            onClick={() => router.push('/academy')}
            className="w-full flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            <BookOpen className="h-4 w-4 text-primary shrink-0" />
            My academy
          </button>
        </div>
      </div>

      {/* Session types legend */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Session Types</p>
        <div className="space-y-2.5">
          {Object.entries(SESSION_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <div key={key} className="flex items-center gap-2.5">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                </div>
                <span className="text-xs text-muted-foreground">{cfg.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BookingsPage() {
  const router = useRouter();
  const { bookings, consultationBookings, loading } = useUser();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  // Merge both booking types into one list
  const allBookings = [
    ...bookings,
    ...consultationBookings.map(normaliseConsultationBooking),
  ];

  const upcoming = allBookings
    .filter((b) => b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && b.slot?.startTime && isFuture(b.slot.startTime))
    .sort((a, b) => new Date(a.slot.startTime).getTime() - new Date(b.slot.startTime).getTime());

  const past = allBookings
    .filter((b) => b.status === 'CANCELLED' || b.status === 'COMPLETED' || !b.slot?.startTime || !isFuture(b.slot.startTime))
    .sort((a, b) =>
      new Date(b.slot?.startTime ?? b.createdAt).getTime() -
      new Date(a.slot?.startTime ?? a.createdAt).getTime(),
    );

  const displayed = tab === 'upcoming' ? upcoming : past;
  const nextSession = upcoming[0];

  if (loading) return <BookingsSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Bookings"
          subtitle="Your scheduled sessions with your consultant and academy classes."
        />
        <button
          onClick={() => router.push('/consult')}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors active:scale-[0.98] shrink-0"
        >
          <Plus className="h-4 w-4" /> Book a session
        </button>
      </div>

      <div className="flex gap-6 items-start">

        {/* ── Main column ──────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Next Session Hero */}
          {nextSession && (() => {
            const cfg = getConfig(nextSession.type);
            const start = nextSession.slot?.startTime;
            const end = nextSession.slot?.endTime;
            const joinable = start ? isJoinable(start) : false;
            const duration = start && end ? getDuration(start, end) : null;
            const countdown = start ? getCountdown(start) : null;
            const consultantName =
              nextSession.consultant?.name ??
              nextSession.slot?.consultant?.name ??
              nextSession.staff?.name ??
              null;
            const Icon = cfg.icon;

            return (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 text-white shadow-md">
                <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
                <div className="absolute -right-4 -top-4 h-28 w-28 rounded-full bg-white/10" />

                <div className="relative">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 shrink-0">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Next session</p>
                        <p className="text-base font-bold text-white leading-tight">{cfg.label}</p>
                        {consultantName && (
                          <p className="text-xs text-white/70 mt-0.5 flex items-center gap-1">
                            <User className="h-3 w-3" /> with {consultantName}
                          </p>
                        )}
                      </div>
                    </div>
                    {countdown && (
                      <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
                        joinable ? 'bg-white/90 text-primary animate-pulse' : 'bg-white/20 text-white'
                      }`}>
                        {joinable ? 'Starting soon' : countdown}
                      </span>
                    )}
                  </div>

                  {start && (
                    <p className="text-sm text-white/80">
                      {new Date(start).toLocaleString('en-US', {
                        weekday: 'long', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                      {duration && (
                        <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">{duration}</span>
                      )}
                    </p>
                  )}

                  {nextSession.notes && (
                    <p className="mt-1.5 text-xs text-white/60 italic">"{nextSession.notes}"</p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {nextSession.meetingUrl && nextSession.status === 'CONFIRMED' ? (
                      <a
                        href={nextSession.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-primary hover:bg-white/90 transition-colors"
                      >
                        <VideoCamera className="h-4 w-4" />
                        {joinable ? 'Join now' : 'Join session'}
                      </a>
                    ) : nextSession.status === 'PENDING' ? (
                      <span className="flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold">
                        <Bell className="h-4 w-4" /> Awaiting confirmation
                      </span>
                    ) : null}

                    {start && nextSession.status === 'CONFIRMED' && (
                      <button
                        onClick={() => addToGoogleCalendar(nextSession)}
                        className="flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20 transition-colors"
                      >
                        <CalendarBlank className="h-4 w-4" /> Add to calendar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Stats strip */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: CheckCircle, weight: 'fill' as const, value: upcoming.length, label: 'Upcoming', bg: 'bg-primary/10', color: 'text-primary' },
              { icon: Clock, weight: 'regular' as const, value: past.filter((b) => b.status !== 'CANCELLED').length, label: 'Completed', bg: 'bg-muted/70', color: 'text-muted-foreground' },
              { icon: X, weight: 'regular' as const, value: allBookings.filter((b) => b.status === 'CANCELLED').length, label: 'Cancelled', bg: 'bg-rose-100', color: 'text-rose-600' },
            ].map(({ icon: Icon, value, label, bg, color }) => (
              <div key={label} className="rounded-2xl border border-border bg-white p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs + list */}
          <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
            <div className="flex border-b border-border px-6">
              {(['upcoming', 'past'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`pb-3 pt-4 mr-6 text-sm font-medium border-b-2 transition-colors ${
                    tab === t
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t === 'upcoming' ? 'Upcoming' : 'Past & Cancelled'}
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-bold ${
                    tab === t ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {t === 'upcoming' ? upcoming.length : past.length}
                  </span>
                </button>
              ))}
            </div>

            {displayed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                  <CalendarBlank className="h-8 w-8 text-muted-foreground" />
                </div>
                <h4 className="font-semibold text-foreground">
                  {tab === 'upcoming' ? 'No upcoming sessions' : 'No past sessions'}
                </h4>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  {tab === 'upcoming'
                    ? 'Your consultant will schedule sessions as your case progresses, or you can book a session directly.'
                    : 'Completed and cancelled sessions will appear here.'}
                </p>
                {tab === 'upcoming' && (
                  <button
                    onClick={() => router.push('/consult')}
                    className="mt-5 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="h-4 w-4" /> Book a session
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {displayed.map((booking) => {
                  const start = booking.slot?.startTime;
                  const end = booking.slot?.endTime;
                  const cfg = getConfig(booking.type);
                  const Icon = cfg.icon;
                  const duration = start && end ? getDuration(start, end) : null;
                  const countdown = start && isFuture(start) ? getCountdown(start) : null;
                  const joinable = start ? isJoinable(start) : false;
                  const consultantName =
                    booking.consultant?.name ??
                    booking.slot?.consultant?.name ??
                    booking.staff?.name ??
                    null;

                  return (
                    <div key={booking.id} className="flex items-start gap-4 px-6 py-5 hover:bg-muted/20 transition-colors">
                      {/* Date block */}
                      <div className={`flex shrink-0 flex-col items-center justify-center rounded-xl p-2.5 w-14 text-center ${
                        booking.status === 'CANCELLED'
                          ? 'bg-muted/40'
                          : start && isFuture(start)
                          ? 'bg-primary/10'
                          : 'bg-muted/30'
                      }`}>
                        {start ? (
                          <>
                            <span className={`text-xs font-bold uppercase tracking-wide ${
                              booking.status === 'CANCELLED' ? 'text-muted-foreground' : 'text-primary'
                            }`}>
                              {new Date(start).toLocaleDateString('en-US', { month: 'short' })}
                            </span>
                            <span className={`text-xl font-bold leading-none ${
                              booking.status === 'CANCELLED' ? 'text-muted-foreground' : 'text-foreground'
                            }`}>
                              {new Date(start).getDate()}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(start).toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                          </>
                        ) : (
                          <CalendarBlank className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>

                      {/* Session type icon */}
                      <div className={`hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.bg}`}>
                        <Icon className={`h-5 w-5 ${cfg.color}`} />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className={`text-sm font-semibold ${
                            booking.status === 'CANCELLED' ? 'text-muted-foreground line-through' : 'text-foreground'
                          }`}>
                            {cfg.label}
                          </p>
                          <Badge variant={bookingStatusVariant(booking.status)} className="text-xs">
                            {statusLabel(booking.status)}
                          </Badge>
                          {countdown && !joinable && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                              {countdown}
                            </span>
                          )}
                          {joinable && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary animate-pulse">
                              Starting soon
                            </span>
                          )}
                        </div>

                        {consultantName && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
                            <User className="h-3 w-3" /> {consultantName}
                          </p>
                        )}

                        {start && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(start).toLocaleString('en-US', {
                              weekday: 'short', month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                            {end && ` – ${new Date(end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                            {duration && (
                              <span className="ml-2 inline-block rounded-full bg-muted px-1.5 py-0.5 text-xs">{duration}</span>
                            )}
                          </p>
                        )}

                        {booking.notes && (
                          <p className="mt-1.5 text-xs text-muted-foreground italic">"{booking.notes}"</p>
                        )}

                        <div className="mt-2 flex flex-wrap gap-2">
                          {booking.meetingUrl && booking.status === 'CONFIRMED' && start && isFuture(start) && (
                            <a
                              href={booking.meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
                            >
                              <VideoCamera className="h-3.5 w-3.5" />
                              {joinable ? 'Join now' : 'Join session'}
                            </a>
                          )}

                          {start && booking.status === 'CONFIRMED' && isFuture(start) && (
                            <button
                              onClick={() => addToGoogleCalendar(booking)}
                              className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                            >
                              <CalendarBlank className="h-3.5 w-3.5" /> Add to calendar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Help footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-muted/30 px-6 py-4">
            <div className="flex items-start gap-3">
              <Bell className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Need to reschedule or have questions? Contact your consultant directly from your case page.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => router.push('/case')}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
              >
                <ChatCircle className="h-3.5 w-3.5" /> Message consultant
              </button>
              <button
                onClick={() => router.push('/consult')}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Book new <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Right sidebar ─────────────────────────────────────────────── */}
        <BookingsSidebar
          nextSession={nextSession}
          router={router}
          onBook={() => router.push('/consult')}
        />
      </div>
    </div>
  );
}
