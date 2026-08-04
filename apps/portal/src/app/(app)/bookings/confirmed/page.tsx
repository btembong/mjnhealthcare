'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, CalendarBlank, Clock, VideoCamera, ArrowRight, User } from '@phosphor-icons/react';
import { Skeleton } from '@mjn/ui';

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000') + '/api/v1';

const CATEGORY_LABELS: Record<string, string> = {
  HEALTH: 'Health Consultation',
  CAREER: 'Career Consultation',
  BOTH:   'Health & Career Consultation',
};

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
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-lg mx-auto pt-16 text-center">
        <p className="text-sm text-muted-foreground">{error || 'Booking not found.'}</p>
        <button onClick={() => router.push('/bookings')} className="mt-4 text-sm text-primary underline underline-offset-2">
          Go to bookings
        </button>
      </div>
    );
  }

  const sessionTime = booking.sessionStart
    ? new Date(booking.sessionStart).toLocaleString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null;

  const isPending = booking.status === 'AWAITING_PAYMENT' || booking.status === 'PENDING';

  return (
    <div className="max-w-lg mx-auto space-y-5 pt-4">

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-8 text-white text-center shadow-md">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
            <CheckCircle className="h-8 w-8 text-white" weight="fill" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-1">
          {isPending ? 'Booking received' : 'Session confirmed!'}
        </h1>
        <p className="text-sm text-white/75">
          {isPending
            ? 'Your payment is being processed. You will receive a confirmation email once it clears.'
            : 'Your session is confirmed. Check your email for the join link and reminders.'}
        </p>
      </div>

      {/* Details card */}
      <div className="rounded-2xl border border-border bg-white shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Session details</h2>

        <div className="space-y-3 text-sm">
          {booking.consultantName && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Consultant</p>
                <p className="font-semibold text-foreground">{booking.consultantName}</p>
              </div>
            </div>
          )}

          {booking.category && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <VideoCamera className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Session type</p>
                <p className="font-semibold text-foreground">
                  {CATEGORY_LABELS[booking.category] ?? booking.category}
                </p>
              </div>
            </div>
          )}

          {sessionTime && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <CalendarBlank className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date & time</p>
                <p className="font-semibold text-foreground">{sessionTime}</p>
              </div>
            </div>
          )}

          {booking.durationMins && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-semibold text-foreground">{booking.durationMins} minutes</p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border pt-4 text-xs text-muted-foreground">
          Reference: <span className="font-mono text-foreground">{bookingId}</span>
        </div>
      </div>

      {/* What's next */}
      <div className="rounded-2xl border border-border bg-white shadow-sm p-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">What happens next</h2>
        <ol className="space-y-2.5 text-sm text-muted-foreground list-none">
          <li className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary mt-0.5">1</span>
            <span>You will receive a confirmation email with your join link and reminders 24 h and 1 h before the session.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary mt-0.5">2</span>
            <span>Join from a quiet place with a stable internet connection at the scheduled time.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary mt-0.5">3</span>
            <span>To reschedule or cancel, contact us at hello@mjnhealthcare.com or WhatsApp +971 50 863 8660.</span>
          </li>
        </ol>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => router.push('/bookings')}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
        >
          View my bookings <ArrowRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
        >
          Go to dashboard
        </button>
      </div>
    </div>
  );
}
