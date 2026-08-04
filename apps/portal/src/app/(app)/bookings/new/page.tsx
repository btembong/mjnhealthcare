'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, Stethoscope, ChartLine, Sparkle,
  Star, Clock, CalendarBlank, User, CheckCircle, VideoCamera,
} from '@phosphor-icons/react';
import { Skeleton } from '@mjn/ui';
import { toast } from 'sonner';
import { useUser } from '../../../../contexts/user-context';

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000') + '/api/v1';

const CATEGORIES = [
  {
    value: 'HEALTH',
    label: 'Health Consultation',
    desc: 'Medical advice, clinical guidance, and health planning from a licensed professional.',
    icon: Stethoscope,
    color: 'text-secondary',
    bg: 'bg-secondary/10',
  },
  {
    value: 'CAREER',
    label: 'Career Consultation',
    desc: 'Licensing pathways, international job placement, and career strategy.',
    icon: ChartLine,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    value: 'BOTH',
    label: 'Health & Career',
    desc: 'A combined session covering both health and career topics in one call.',
    icon: Sparkle,
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
];

const STEP_LABELS = ['Session type', 'Consultant', 'Date & time', 'Confirm'];

function StepBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-8">
      {STEP_LABELS.map((label, i) => (
        <div key={label} className="flex items-center gap-1.5">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              i < step
                ? 'bg-primary text-white'
                : i === step
                ? 'bg-primary text-white ring-4 ring-primary/20'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {i < step ? <CheckCircle className="h-4 w-4" weight="fill" /> : i + 1}
          </div>
          <span
            className={`text-xs font-medium hidden sm:block ${
              i === step ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            {label}
          </span>
          {i < STEP_LABELS.length - 1 && (
            <div className={`h-px w-4 sm:w-8 shrink-0 ${i < step ? 'bg-primary' : 'bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date().toDateString();
  const tomorrow = new Date(Date.now() + 86400000).toDateString();
  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function BookNewPage() {
  const router = useRouter();
  const { me } = useUser();

  const [step, setStep] = useState(0);
  const [category, setCategory] = useState('');
  const [consultants, setConsultants] = useState<any[]>([]);
  const [consultant, setConsultant] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill from logged-in user
  useEffect(() => {
    if (me) {
      setName(me.name ?? '');
      setPhone(me.phone ?? '');
    }
  }, [me]);

  async function fetchConsultants(cat: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/consultations/consultants?category=${cat}`);
      const data = await res.json();
      setConsultants(Array.isArray(data) ? data : []);
    } catch {
      setError('Could not load consultants. Please try again.');
    }
    setLoading(false);
  }

  async function fetchSlots(consultantId: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/consultations/slots/${consultantId}`);
      const data = await res.json();
      const available = (Array.isArray(data) ? data : []).filter(
        (s: any) => !s.status || s.status === 'AVAILABLE',
      );
      setSlots(available);
      if (available.length > 0) {
        setSelectedDate(new Date(available[0].startAt).toDateString());
      }
    } catch {
      setError('Could not load available slots. Please try again.');
    }
    setLoading(false);
  }

  const slotsByDate = useMemo(() => {
    return slots.reduce((acc: Record<string, any[]>, slot) => {
      const d = new Date(slot.startAt).toDateString();
      if (!acc[d]) acc[d] = [];
      acc[d].push(slot);
      return acc;
    }, {});
  }, [slots]);

  const availableDates = Object.keys(slotsByDate);
  const slotsForDate = selectedDate ? (slotsByDate[selectedDate] ?? []) : [];

  function selectCategory(cat: string) {
    setCategory(cat);
    setConsultants([]);
    setConsultant(null);
    setSlots([]);
    setSelectedSlot(null);
    setStep(1);
    fetchConsultants(cat);
  }

  function selectConsultant(c: any) {
    setConsultant(c);
    setSlots([]);
    setSelectedSlot(null);
    setStep(2);
    fetchSlots(c.id);
  }

  function selectSlot(slot: any) {
    setSelectedSlot(slot);
    setStep(3);
  }

  async function handleBook() {
    if (!selectedSlot || !me?.email) return;
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!phone.trim()) { setError('Please enter your phone number.'); return; }
    setLoading(true);
    setError('');
    try {
      const portalUrl = (process.env.NEXT_PUBLIC_PORTAL_URL ?? window.location.origin);
      const res = await fetch(`${API}/consultations/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          clientName: name.trim(),
          clientEmail: me.email,
          clientPhone: phone.trim(),
          consultationCategory: category,
          preSessionNote: note.trim() || undefined,
          recordingConsent: consent,
          returnUrl: `${portalUrl}/bookings/confirmed`,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Booking failed. Please try again.');
      }
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        toast.success('Session booked successfully!');
        router.push('/bookings');
      }
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  const catConfig = CATEGORIES.find((c) => c.value === category);

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Back nav */}
      <button
        onClick={() => (step > 0 ? setStep((s) => s - 1) : router.push('/bookings'))}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {step === 0 ? 'Back to bookings' : 'Back'}
      </button>

      <div className="rounded-2xl border border-border bg-white shadow-sm p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground">Book a session</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Choose a session type, a consultant, and a time that works for you.
          </p>
        </div>

        <StepBar step={step} />

        {error && (
          <div className="mb-5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* ── Step 0: Category ───────────────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.value}
                  onClick={() => selectCategory(cat.value)}
                  className="w-full flex items-start gap-4 rounded-xl border border-border bg-muted/20 p-4 text-left hover:border-primary/40 hover:bg-primary/5 transition-all group"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cat.bg}`}>
                    <Icon className={`h-5 w-5 ${cat.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{cat.label}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{cat.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0 group-hover:text-primary transition-colors" />
                </button>
              );
            })}
          </div>
        )}

        {/* ── Step 1: Consultant ─────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            {loading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
            ) : consultants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 mb-3">
                  <User className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="font-semibold text-foreground">No consultants available</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  No consultants are available for this session type right now. Try another type or check back later.
                </p>
                <button
                  onClick={() => setStep(0)}
                  className="mt-4 text-sm text-primary underline underline-offset-2 hover:no-underline"
                >
                  Change session type
                </button>
              </div>
            ) : (
              consultants.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectConsultant(c)}
                  className="w-full flex items-start gap-4 rounded-xl border border-border bg-white p-5 text-left hover:border-primary/40 hover:shadow-md transition-all group"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                    {c.name?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <p className="font-semibold text-foreground">{c.name}</p>
                      {c.rating && (
                        <span className="flex items-center gap-0.5 text-xs text-amber-600 font-semibold">
                          <Star className="h-3 w-3" weight="fill" />
                          {Number(c.rating).toFixed(1)}
                        </span>
                      )}
                      {c.sessionCount > 0 && (
                        <span className="text-xs text-muted-foreground">{c.sessionCount} sessions</span>
                      )}
                    </div>
                    {c.specialty && (
                      <p className="text-xs text-muted-foreground font-medium">{c.specialty}</p>
                    )}
                    {c.bio && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.bio}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {c.sessionDurationMins ?? 45} min
                      </span>
                      <span className="text-xs font-bold text-primary">
                        ${Number(c.priceUsd ?? 0).toFixed(0)}
                      </span>
                      {Array.isArray(c.languages) && c.languages.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {c.languages.join(' · ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0 group-hover:text-primary transition-colors" />
                </button>
              ))
            )}
          </div>
        )}

        {/* ── Step 2: Slot ───────────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            {loading ? (
              <Skeleton className="h-56 rounded-xl" />
            ) : availableDates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 mb-3">
                  <CalendarBlank className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="font-semibold text-foreground">No available slots</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  {consultant?.name} has no open slots right now. Choose a different consultant.
                </p>
                <button
                  onClick={() => setStep(1)}
                  className="mt-4 text-sm text-primary underline underline-offset-2 hover:no-underline"
                >
                  Choose another consultant
                </button>
              </div>
            ) : (
              <>
                {/* Consultant summary */}
                <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-muted/30">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    {consultant?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{consultant?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {consultant?.sessionDurationMins ?? 45} min · ${Number(consultant?.priceUsd ?? 0).toFixed(0)}
                    </p>
                  </div>
                </div>

                {/* Date tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
                  {availableDates.map((d) => (
                    <button
                      key={d}
                      onClick={() => { setSelectedDate(d); setSelectedSlot(null); }}
                      className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                        selectedDate === d
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {formatDateLabel(d)}
                    </button>
                  ))}
                </div>

                {/* Time slots */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slotsForDate.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => selectSlot(slot)}
                      className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-semibold text-foreground hover:border-primary hover:bg-primary/5 hover:text-primary transition-all text-center"
                    >
                      {formatTime(slot.startAt)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Step 3: Confirm ────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">

            {/* Session summary card */}
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-2.5 text-sm">
              <div className="flex items-center gap-2 mb-3">
                <VideoCamera className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">Session summary</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Session type</span>
                <span className="font-medium text-foreground text-right">{catConfig?.label}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Consultant</span>
                <span className="font-medium text-foreground text-right">{consultant?.name}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Date & time</span>
                <span className="font-medium text-foreground text-right">
                  {selectedSlot &&
                    new Date(selectedSlot.startAt).toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium text-foreground">{consultant?.sessionDurationMins ?? 45} min</span>
              </div>
              <div className="border-t border-primary/20 pt-2.5 flex justify-between gap-4">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-primary text-base">
                  ${Number(consultant?.priceUsd ?? 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                  Full name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={me?.email ?? ''}
                  disabled
                  className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                  Phone number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+237 6XX XXX XXX"
                  className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                  Pre-session note{' '}
                  <span className="normal-case font-normal text-muted-foreground/70">(optional)</span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What would you like to discuss? Any specific questions or context to help your consultant prepare."
                  rows={3}
                  className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary focus:ring-primary/30"
                />
                <span className="text-sm text-muted-foreground leading-relaxed">
                  I consent to this session being recorded for quality assurance purposes.
                </span>
              </label>
            </div>

            <button
              onClick={handleBook}
              disabled={loading || !name.trim() || !phone.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                'Processing…'
              ) : (
                <>
                  Confirm & Pay ${Number(consultant?.priceUsd ?? 0).toFixed(2)}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <p className="text-xs text-center text-muted-foreground">
              Secure payment via Tranzak. You will be redirected to complete your payment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
