'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CheckCircle, CalendarBlank, Clock, VideoCamera, ArrowRight,
  User, Envelope, DeviceMobile, WarningCircle, ArrowSquareOut,
  BookOpen, ChatCircle, Confetti,
} from '@phosphor-icons/react';
import { Skeleton } from '@mjn/ui';

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000') + '/api/v1';

const CATEGORY_LABELS: Record<string, string> = {
  HEALTH: 'Health Consultation',
  CAREER: 'Career Consultation',
  BOTH: 'Health & Career Consultation',
};

function addToGoogleCalendar(sessionStart: string, durationMins: number, consultantName: string, category: string, roomUrl?: string) {
  const start = new Date(sessionStart);
  const end = new Date(start.getTime() + durationMins * 60000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace('.000', '');
  const title = encodeURIComponent(`MJN Healthcare: ${category} with ${consultantName}`);
  const dates = `${fmt(start)}/${fmt(end)}`;
  const desc = encodeURIComponent([
    roomUrl ? `Join link: ${roomUrl}` : '',
    'Powered by MJN Healthcare — mjnhealthcare.com',
  ].filter(Boolean).join('\n'));
  window.open(
    `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${desc}`,
    '_blank',
  );
}

export default function BookingConfirmedPage() {
  const params = useSearchParams();
  const router = useRouter();
  const bookingId = params.get('bookingId');

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookingId) { setError('No booking reference found.'); setLoading(false); return; }
    fetch(`${API}/consultations/booking/${bookingId}`)
      .then((r) => r.json())
      .then((data) => { setBooking(data); setLoading(false); })
      .catch(() => { setError('Could not load booking details.'); setLoading(false); });
  }, [bookingId]);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto space-y-4 pt-8">
        <Skeleton className="h-52 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-lg mx-auto pt-16 text-center space-y-3">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100">
            <WarningCircle className="h-7 w-7 text-rose-500" />
          </div>
        </div>
        <p className="font-semibold text-foreground">Booking not found</p>
        <p className="text-sm text-muted-foreground">{error || 'This booking reference is invalid or has expired.'}</p>
        <button onClick={() => router.push('/bookings')} className="text-sm text-primary underline underline-offset-2">
          Go to bookings
        </button>
      </div>
    );
  }

  const isPending = booking.status === 'AWAITING_PAYMENT' || booking.status === 'PENDING';
  const sessionTime = booking.sessionStart
    ? new Date(booking.sessionStart).toLocaleString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null;
  const categoryLabel = CATEGORY_LABELS[booking.category] ?? booking.category ?? 'Session';

  const PREPARE_ITEMS = booking.category === 'HEALTH'
    ? ['Have your medical history / recent test results ready', 'List your current medications if applicable', 'Note down your key symptoms or concerns in advance', 'Use a quiet, private space for the call']
    : booking.category === 'CAREER'
    ? ['Have your CV / résumé and licence documents accessible', 'Know your target country and profession', 'List any previous applications or rejections to discuss', 'Use a stable internet connection — screen sharing may be needed']
    : ['Prepare both health and career documents', 'Note your most urgent questions for each topic', 'Use a quiet, stable-connection space', 'The session will cover both areas — priority is yours to set'];

  return (
    <div className="max-w-lg mx-auto space-y-5 pt-4 pb-12">

      {/* Hero */}
      <div className={`rounded-2xl p-8 text-white text-center shadow-md relative overflow-hidden ${
        isPending
          ? 'bg-gradient-to-br from-amber-500 to-amber-400'
          : 'bg-gradient-to-br from-primary to-primary/80'
      }`}>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -left-6 -bottom-6 h-28 w-28 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
              {isPending
                ? <Clock className="h-8 w-8 text-white" weight="fill" />
                : <Confetti className="h-8 w-8 text-white" weight="fill" />}
            </div>
          </div>
          <h1 className="text-2xl font-extrabold mb-2">
            {isPending ? 'Payment processing…' : 'Session confirmed!'}
          </h1>
          <p className="text-sm text-white/80 leading-relaxed max-w-xs mx-auto">
            {isPending
              ? 'Your payment is being verified. You will receive a confirmation email and join link once it clears.'
              : 'Your session is locked in. Check your email for your join link — reminders arrive 24 h and 1 h before.'}
          </p>
          {bookingId && (
            <p className="mt-3 text-xs text-white/50 font-mono">Ref: {bookingId.slice(-10).toUpperCase()}</p>
          )}
        </div>
      </div>

      {/* Session details */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/20">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Session details</p>
        </div>
        <div className="divide-y divide-border">
          {booking.consultantName && (
            <div className="flex items-center gap-3 px-5 py-3.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Consultant</p>
                <p className="text-sm font-semibold text-foreground">{booking.consultantName}</p>
              </div>
            </div>
          )}
          {booking.category && (
            <div className="flex items-center gap-3 px-5 py-3.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <VideoCamera className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Session type</p>
                <p className="text-sm font-semibold text-foreground">{categoryLabel}</p>
              </div>
            </div>
          )}
          {sessionTime && (
            <div className="flex items-center gap-3 px-5 py-3.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <CalendarBlank className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Date & time</p>
                <p className="text-sm font-semibold text-foreground">{sessionTime}</p>
              </div>
              {!isPending && booking.sessionStart && (
                <button
                  onClick={() => addToGoogleCalendar(
                    booking.sessionStart,
                    booking.durationMins ?? 45,
                    booking.consultantName ?? 'Consultant',
                    categoryLabel,
                    booking.meetingUrl,
                  )}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors shrink-0"
                >
                  <CalendarBlank className="h-3.5 w-3.5" /> Add to calendar
                </button>
              )}
            </div>
          )}
          {booking.durationMins && (
            <div className="flex items-center gap-3 px-5 py-3.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-semibold text-foreground">{booking.durationMins} minutes</p>
              </div>
            </div>
          )}
          {booking.meetingUrl && !isPending && (
            <div className="flex items-center gap-3 px-5 py-3.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
                <VideoCamera className="h-4 w-4 text-secondary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Join link</p>
                <a
                  href={booking.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline underline-offset-2"
                >
                  Open session room <ArrowSquareOut className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* How you'll be notified */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/20">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">You'll receive</p>
        </div>
        <div className="divide-y divide-border">
          {[
            { icon: Envelope, label: 'Confirmation email', desc: 'Sent to your email address with session details and join link' },
            { icon: DeviceMobile, label: 'WhatsApp reminders', desc: '24 hours and 1 hour before your session starts' },
            { icon: VideoCamera, label: 'Join link reminder', desc: 'In the email and directly in your bookings page when the time comes' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3 px-5 py-3.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 mt-0.5">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How to prepare */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/20">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">How to prepare</p>
        </div>
        <ul className="divide-y divide-border">
          {PREPARE_ITEMS.map((item, i) => (
            <li key={i} className="flex items-start gap-3 px-5 py-3.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed">{item}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => router.push('/bookings')}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
        >
          My bookings <ArrowRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => router.push('/case')}
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
        >
          <ChatCircle className="h-4 w-4 text-primary" /> Message consultant
        </button>
        <button
          onClick={() => router.push('/academy')}
          className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/30 px-5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <BookOpen className="h-4 w-4" /> Study while you wait — go to Academy
        </button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        To reschedule or cancel, go to your bookings page or WhatsApp us at +971 50 863 8660.
      </p>
    </div>
  );
}
