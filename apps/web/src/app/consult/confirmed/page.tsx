'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { Button } from '@mjn/ui';
import {
  VideoCamera, Envelope, WhatsappLogo, ArrowRight,
  Clock, CheckCircle, CircleNotch, Warning,
} from '@phosphor-icons/react';

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000') + '/api/v1';

interface BookingSummary {
  status: string;
  clientName: string;
  consultantName: string;
  sessionStart: string;
  durationMins: number;
  amountPaid: string;
  category: string;
}

function ConfirmedContent() {
  const params = useSearchParams();
  const bookingId = params.get('bookingId');
  const [booking, setBooking] = React.useState<BookingSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState('');
  const [pollCount, setPollCount] = React.useState(0);

  async function fetchBooking() {
    if (!bookingId) { setLoading(false); return; }
    try {
      const r = await fetch(`${API}/consultations/booking/${bookingId}`);
      const data = await r.json() as BookingSummary;
      setBooking(data);
    } catch {
      setFetchError('Could not load booking details.');
    } finally {
      setLoading(false);
    }
  }

  // Initial fetch
  React.useEffect(() => { fetchBooking(); }, [bookingId]);

  // Poll every 3 s while AWAITING_PAYMENT, up to 20 attempts (60 s)
  React.useEffect(() => {
    if (!booking || booking.status !== 'AWAITING_PAYMENT' || pollCount >= 20) return;
    const id = setTimeout(async () => {
      await fetchBooking();
      setPollCount((n) => n + 1);
    }, 3000);
    return () => clearTimeout(id);
  }, [booking, pollCount]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-6 py-32 text-center">
        <CircleNotch className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading booking details…</p>
      </div>
    );
  }

  // ── Not found / error ─────────────────────────────────────────────────────
  if (fetchError || !booking) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
            <Warning className="h-10 w-10 text-amber-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">Booking not found</h1>
        <p className="text-muted-foreground mb-6">
          We couldn't find this booking. If you completed payment, check your email for confirmation or contact us with your booking reference.
        </p>
        {bookingId && (
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground mb-6">
            Booking reference: <span className="font-mono font-semibold text-foreground">{bookingId}</span>
          </div>
        )}
        <Button asChild><Link href="/contact">Contact Support <ArrowRight className="h-4 w-4" /></Link></Button>
      </div>
    );
  }

  const sessionTime = new Date(booking.sessionStart).toLocaleString('en-GB', {
    timeZone: 'Africa/Douala', weekday: 'short', day: 'numeric',
    month: 'long', hour: '2-digit', minute: '2-digit',
  });

  // ── Awaiting payment ──────────────────────────────────────────────────────
  if (booking.status === 'AWAITING_PAYMENT') {
    const stillPolling = pollCount < 20;
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
            {stillPolling
              ? <CircleNotch className="h-10 w-10 text-amber-500 animate-spin" />
              : <Clock className="h-10 w-10 text-amber-500" />}
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-foreground mb-3">
          {stillPolling ? 'Confirming your payment…' : 'Payment Processing'}
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Your slot with <strong>{booking.consultantName}</strong> on <strong>{sessionTime} WAT</strong> is held.
          {stillPolling
            ? ' Checking with the payment gateway — this page will update automatically.'
            : ' Once your payment is verified, you\'ll receive your session join link by email and WhatsApp.'}
        </p>
        {!stillPolling && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 mb-8">
            Taking longer than expected. If you completed payment, check your email or contact support.
          </div>
        )}
        {bookingId && (
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground mb-8">
            Booking reference: <span className="font-mono font-semibold text-foreground">{bookingId}</span>
          </div>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => { setPollCount(0); fetchBooking(); }}>
            <CircleNotch className="h-4 w-4 mr-1.5" /> Refresh Status
          </Button>
          <Button variant="outline" asChild>
            <Link href="/contact">Contact Support</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── Confirmed ─────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-lg px-6 py-20 text-center">
      <div className="mb-6 flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle className="h-10 w-10 text-primary" weight="fill" />
        </div>
      </div>
      <h1 className="text-3xl font-extrabold text-foreground mb-3">Booking Confirmed!</h1>
      <p className="text-muted-foreground leading-relaxed mb-8">
        Your consultation with <strong>{booking.consultantName}</strong> on <strong>{sessionTime} WAT</strong> is
        confirmed and paid. Your session join link has been sent to your email and WhatsApp.
      </p>

      {/* What happens next */}
      <div className="rounded-3xl border border-border bg-white p-6 shadow-sm text-left mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">What happens next</p>
        <div className="space-y-4">
          {[
            { icon: Envelope, label: 'Check your email', desc: 'Your join link, session time, and consultant details have been emailed to you.' },
            { icon: WhatsappLogo, label: 'Check WhatsApp', desc: 'A copy of your join link has been sent via WhatsApp with reminders 24h and 1h before your session.' },
            { icon: Clock, label: 'Join at your session time', desc: 'Click the join link at the scheduled time. No download required — the session runs in your browser.' },
            { icon: VideoCamera, label: 'Your session', desc: `Both you and ${booking.consultantName} will join the same secure video room. The session lasts up to ${booking.durationMins} minutes.` },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {bookingId && (
        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground mb-8">
          Booking reference: <span className="font-mono font-semibold text-foreground">{bookingId}</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground mb-8 leading-relaxed">
        Need to cancel? Reply to your confirmation email or contact us on WhatsApp. Cancellations more than 24 hours before the session: full refund. 4–24 hours: 50% refund. Less than 4 hours: no refund.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href="/consult">Book Another Session <ArrowRight className="h-4 w-4" /></Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}

export default function ConsultConfirmedPage() {
  return (
    <>
      <MarketingNav />
      <React.Suspense fallback={<div className="py-32 text-center text-muted-foreground">Loading…</div>}>
        <ConfirmedContent />
      </React.Suspense>
      <SiteFooter />
    </>
  );
}
