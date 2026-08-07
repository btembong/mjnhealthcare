'use client';

import * as React from 'react';
import Link from 'next/link';
import { MarketingNav } from '../../components/marketing-nav';
import { SiteFooter } from '../../components/site-footer';
import {
  ArrowRight, ArrowLeft, VideoCamera, Heart, Briefcase,
  Star, Clock, CheckCircle, CalendarBlank, User, Warning,
  Lock, CircleNotch, Shield, CurrencyDollar, Phone, EnvelopeSimple,
  ChatText, SealCheck, CaretRight, Globe,
} from '@phosphor-icons/react';

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000') + '/api/v1';

const TIMEZONES = [
  { value: 'Africa/Douala',       label: 'Cameroon (WAT, UTC+1)' },
  { value: 'Africa/Lagos',        label: 'Nigeria (WAT, UTC+1)' },
  { value: 'Africa/Accra',        label: 'Ghana (GMT, UTC+0)' },
  { value: 'Africa/Nairobi',      label: 'Kenya (EAT, UTC+3)' },
  { value: 'Africa/Johannesburg', label: 'South Africa (SAST, UTC+2)' },
  { value: 'Europe/London',       label: 'United Kingdom (GMT/BST)' },
  { value: 'Europe/Paris',        label: 'France (CET/CEST)' },
  { value: 'Asia/Dubai',          label: 'UAE (GST, UTC+4)' },
  { value: 'America/New_York',    label: 'US East (EST/EDT)' },
  { value: 'America/Chicago',     label: 'US Central (CST/CDT)' },
  { value: 'America/Los_Angeles', label: 'US West (PST/PDT)' },
];

function detectTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (TIMEZONES.find((t) => t.value === tz)) return tz;
  } catch {}
  return 'Africa/Douala';
}

function tzAbbr(tz: string) {
  const found = TIMEZONES.find((t) => t.value === tz);
  if (!found) return 'WAT';
  const m = found.label.match(/\(([^)]+)\)/);
  return m ? m[1].split(',')[0] : tz;
}

type Category = 'HEALTH' | 'CAREER';
type Step = 1 | 2 | 3 | 4 | 5;

interface Consultant {
  id: string; name: string; bio: string; photoUrl?: string;
  specialty: string; languages: string[]; consultationCategory: string;
  priceUsd: string; sessionDurationMins: number; rating: number; sessionCount: number;
}
interface Slot { id: string; startAt: string; durationMinutes: number; }

function groupSlotsByDate(slots: Slot[], tz: string): Record<string, Slot[]> {
  return slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    const date = new Date(slot.startAt).toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', timeZone: tz,
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {});
}

const STEPS = ['Session type', 'Specialist', 'Date & time', 'Your details', 'Payment'] as const;

// ── Reusable back button ──────────────────────────────────────────────────────
function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" /> {label}
    </button>
  );
}

// ── Consultant avatar ─────────────────────────────────────────────────────────
function ConsultantAvatar({ consultant, size = 'md' }: { consultant: Consultant; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-10 w-10 rounded-lg text-base', md: 'h-14 w-14 rounded-xl text-xl', lg: 'h-16 w-16 rounded-xl text-2xl' };
  return (
    <div className={`${sizes[size]} flex shrink-0 items-center justify-center overflow-hidden bg-primary/10 font-bold text-primary`}>
      {consultant.photoUrl
        ? <img src={consultant.photoUrl} alt={consultant.name} className="h-full w-full object-cover" />
        : consultant.name.charAt(0).toUpperCase()
      }
    </div>
  );
}

export default function ConsultPage() {
  const [step, setStep]                           = React.useState<Step>(1);
  const [category, setCategory]                   = React.useState<Category | null>(null);
  const [consultants, setConsultants]             = React.useState<Consultant[]>([]);
  const [selectedConsultant, setSelectedConsultant] = React.useState<Consultant | null>(null);
  const [slots, setSlots]                         = React.useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot]           = React.useState<Slot | null>(null);
  const [pendingSlot, setPendingSlot]             = React.useState<Slot | null>(null);
  const [loadingConsultants, setLoadingConsultants] = React.useState(false);
  const [loadingSlots, setLoadingSlots]           = React.useState(false);
  const [submitting, setSubmitting]               = React.useState(false);
  const [error, setError]                         = React.useState('');
  const [clientName, setClientName]               = React.useState('');
  const [clientEmail, setClientEmail]             = React.useState('');
  const [clientPhone, setClientPhone]             = React.useState('');
  const [preSessionNote, setPreSessionNote]       = React.useState('');
  const [recordingConsent, setRecordingConsent]   = React.useState(false);
  const [termsConsent, setTermsConsent]           = React.useState(false);
  const [tz, setTz]                               = React.useState(detectTimezone);

  async function handleCategorySelect(cat: Category) {
    setCategory(cat);
    setLoadingConsultants(true);
    setError('');
    try {
      const res = await fetch(`${API}/consultations/consultants?category=${cat}`);
      setConsultants(await res.json() as Consultant[]);
      setStep(2);
    } catch { setError('Failed to load consultants. Please try again.'); }
    finally { setLoadingConsultants(false); }
  }

  async function handleConsultantSelect(consultant: Consultant) {
    setSelectedConsultant(consultant);
    setLoadingSlots(true);
    setPendingSlot(null);
    setError('');
    try {
      const res = await fetch(`${API}/consultations/slots/${consultant.id}`);
      setSlots(await res.json() as Slot[]);
      setStep(3);
    } catch { setError('Failed to load available times. Please try again.'); }
    finally { setLoadingSlots(false); }
  }

  function handleConfirmSlot() {
    if (!pendingSlot) return;
    setSelectedSlot(pendingSlot);
    setStep(4);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot || !category) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API}/consultations/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: selectedSlot.id, clientName, clientEmail, clientPhone,
          consultationCategory: category, recordingConsent,
          preSessionNote: preSessionNote || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json() as { message?: string };
        throw new Error(err.message ?? 'Booking failed. Please try again.');
      }
      const data = await res.json() as { bookingId: string; redirectUrl: string };
      window.location.href = data.redirectUrl;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setSubmitting(false);
    }
  }

  const slotsByDate = groupSlotsByDate(slots, tz);
  const currentStepIndex = step - 1;

  return (
    <>
      <MarketingNav />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="gradient-hero relative overflow-hidden pb-0 pt-24 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/4 blur-3xl" />
          <div className="absolute bottom-0 left-8 h-56 w-56 rounded-full bg-white/4 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 pb-16 pt-4">
          <div className="flex flex-col items-center text-center">
            {/* Session count pill */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-white/80 shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
              1-on-1 Expert Sessions · 45 minutes
            </div>

            <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Book a Private Consultation
              <span className="block text-white/70">with a Licensed Specialist</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/65">
              Health guidance or licensing pathway advice — speak directly with a qualified professional.
              No waiting rooms. No referrals. One clear session, one clear outcome.
            </p>

            {/* Trust pills row */}
            <div className="mt-7 flex flex-wrap justify-center gap-2.5">
              {[
                { icon: VideoCamera, label: 'Secure video call' },
                { icon: CurrencyDollar, label: 'From $30 · 45 min' },
                { icon: Shield, label: 'Refund policy included' },
                { icon: SealCheck, label: 'Verified specialists' },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-3.5 py-2 text-xs font-medium text-white/80 backdrop-blur-sm">
                  <Icon className="h-3.5 w-3.5 text-white/60" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="leading-none">
          <svg viewBox="0 0 1440 40" className="w-full fill-background" preserveAspectRatio="none" style={{ display: 'block' }}>
            <path d="M0,20 C480,40 960,0 1440,20 L1440,40 L0,40 Z" />
          </svg>
        </div>
      </section>

      {/* ── PROGRESS STEPPER ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <div className="flex items-center">
            {STEPS.map((label, i) => {
              const s = (i + 1) as Step;
              const done   = step > s;
              const active = step === s;
              return (
                <React.Fragment key={label}>
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 ${
                      done   ? 'gradient-hero text-white shadow-sm shadow-primary/30'
                      : active ? 'border-2 border-primary bg-primary/6 text-primary'
                      : 'border-2 border-border/60 bg-white text-muted-foreground/60'
                    }`}>
                      {done ? <CheckCircle className="h-4 w-4" weight="fill" /> : s}
                    </div>
                    <span className={`hidden text-xs font-semibold whitespace-nowrap sm:block ${
                      active ? 'text-foreground' : done ? 'text-primary' : 'text-muted-foreground/50'
                    }`}>{label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`mx-1 h-px flex-1 transition-all duration-300 sm:mx-2 ${
                      done ? 'bg-primary' : 'bg-border/60'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── MAIN ─────────────────────────────────────────────────────────────── */}
      <section className="min-h-[60vh] bg-muted/20 px-6 py-12">
        <div className={`mx-auto transition-all duration-300 ${step === 2 ? 'max-w-4xl' : 'max-w-3xl'}`}>

          {error && (
            <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <Warning className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* ── STEP 1 — Session type ────────────────────────────────────────── */}
          {step === 1 && (
            <div className="mx-auto max-w-2xl">
              <div className="mb-10 text-center">
                <h2 className="text-2xl font-bold text-foreground">What brings you here today?</h2>
                <p className="mt-2 text-sm text-muted-foreground">Select a session type to see available specialists and pricing.</p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {[
                  {
                    cat: 'HEALTH' as Category,
                    icon: Heart,
                    title: 'Health Advice',
                    subtitle: 'Speak with a licensed clinician',
                    desc: 'Private video consultation with a licensed physician or registered nurse — on your schedule, from anywhere.',
                    includes: ['General health queries', 'Medication guidance', 'Symptom review', 'Second opinions'],
                    price: 'From $30',
                    duration: '45 min session',
                    badge: 'Licensed MD · RN',
                    cta: 'See available doctors',
                  },
                  {
                    cat: 'CAREER' as Category,
                    icon: Briefcase,
                    title: 'Career & Licensing',
                    subtitle: 'Map your international pathway',
                    desc: 'A personalised roadmap for licensing in UAE, UK, US or Ireland — from MJN consultants who have placed hundreds of professionals.',
                    includes: ['Pathway assessment', 'Document checklist', 'Country-specific advice', 'Exam strategy'],
                    price: 'From $35',
                    duration: '45 min session',
                    badge: 'MJN Consultant',
                    cta: 'See available consultants',
                  },
                ].map(({ cat, icon: Icon, title, subtitle, desc, includes, price, duration, badge, cta }) => (
                  <button
                    key={cat}
                    onClick={() => handleCategorySelect(cat)}
                    disabled={loadingConsultants}
                    className="group relative overflow-hidden rounded-3xl text-left shadow-xl shadow-primary/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/25 focus:outline-none disabled:opacity-50"
                  >
                    {/* Full card gradient background */}
                    <div className="gradient-hero absolute inset-0" />

                    {/* Decorative orbs */}
                    <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/6 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-10 -left-6 h-36 w-36 rounded-full bg-white/4 blur-xl" />
                    <div className="pointer-events-none absolute right-4 bottom-20 h-20 w-20 rounded-full bg-white/4 blur-lg" />

                    {/* Content */}
                    <div className="relative flex h-full flex-col p-8">

                      {/* Top row: icon + badge */}
                      <div className="flex items-start justify-between">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 shadow-inner ring-1 ring-white/20 backdrop-blur-sm">
                          <Icon className="h-8 w-8 text-white" weight="duotone" />
                        </div>
                        <span className="rounded-full bg-white/12 px-3 py-1 text-[11px] font-semibold text-white/75 ring-1 ring-white/15">
                          {badge}
                        </span>
                      </div>

                      {/* Title block */}
                      <div className="mt-6">
                        <p className="text-2xl font-extrabold leading-tight text-white">{title}</p>
                        <p className="mt-1 text-sm text-white/55">{subtitle}</p>
                      </div>

                      {/* Description */}
                      <p className="mt-4 text-sm leading-relaxed text-white/65">{desc}</p>

                      {/* Divider */}
                      <div className="my-5 h-px bg-white/12" />

                      {/* Includes */}
                      <div className="grid grid-cols-2 gap-y-2.5 gap-x-3">
                        {includes.map((item) => (
                          <div key={item} className="flex items-center gap-2 text-xs text-white/70">
                            <CheckCircle className="h-3.5 w-3.5 shrink-0 text-white/50" weight="fill" />
                            {item}
                          </div>
                        ))}
                      </div>

                      {/* Bottom: price + CTA */}
                      <div className="mt-7 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-3xl font-extrabold text-white leading-none">{price}</p>
                          <p className="mt-1 text-xs text-white/50">{duration}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-primary shadow-lg transition-all duration-200 group-hover:shadow-xl group-hover:scale-[1.02]">
                          {loadingConsultants && category === cat
                            ? <><CircleNotch className="h-4 w-4 animate-spin" /> Loading…</>
                            : <>{cta} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></>
                          }
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <p className="mt-8 text-center text-xs text-muted-foreground leading-relaxed">
                Health advice is for informational purposes only and does not constitute medical diagnosis or treatment.{' '}
                <Link href="/terms" className="text-primary hover:underline">Terms apply.</Link>
              </p>
            </div>
          )}

          {/* ── STEP 2 — Specialist ──────────────────────────────────────────── */}
          {step === 2 && (
            <div>
              <BackButton label="Back to session types" onClick={() => setStep(1)} />

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground">Choose your specialist</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {category === 'HEALTH'
                    ? 'Licensed physicians and registered nurses available for private video consultations.'
                    : 'MJN consultants specialising in international licensing, visa pathways, and career placement.'}
                </p>
              </div>

              {loadingConsultants ? (
                <div className="space-y-4">
                  {[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />)}
                </div>
              ) : consultants.length === 0 ? (
                <div className="rounded-2xl border border-border bg-white p-14 text-center shadow-sm">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60">
                    <User className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="font-semibold text-foreground">No specialists available right now</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Please check back soon or{' '}
                    <Link href="/contact" className="text-primary hover:underline">contact us</Link> to arrange a session.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  {consultants.map((c) => (
                    <div
                      key={c.id}
                      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-primary/15"
                    >
                      {/* ── Photo area ── */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden">
                        {c.photoUrl ? (
                          <img
                            src={c.photoUrl}
                            alt={c.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="gradient-hero flex h-full w-full items-center justify-center">
                            <span className="text-6xl font-extrabold text-white/80 select-none">
                              {c.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}

                        {/* Gradient scrim at bottom of photo */}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />

                        {/* Price badge — top right */}
                        <div className="absolute right-3 top-3 rounded-xl bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-sm">
                          <p className="text-sm font-extrabold text-primary leading-none">${c.priceUsd}</p>
                          <p className="text-[10px] text-muted-foreground leading-tight">{c.sessionDurationMins} min</p>
                        </div>

                        {/* Verified badge — bottom left, on scrim */}
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-sm ring-1 ring-white/20">
                          <SealCheck className="h-3.5 w-3.5 text-white" weight="fill" />
                          <span className="text-[11px] font-semibold text-white">Verified Expert</span>
                        </div>

                        {/* Category tag — bottom right, on scrim */}
                        <div className="absolute bottom-3 right-3 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-sm ring-1 ring-white/20">
                          <span className="text-[11px] font-semibold text-white uppercase tracking-wide">
                            {c.consultationCategory === 'BOTH' ? 'Health · Career' : c.consultationCategory === 'HEALTH' ? 'Health' : 'Career'}
                          </span>
                        </div>
                      </div>

                      {/* ── Card body ── */}
                      <div className="flex flex-1 flex-col p-5">
                        {/* Name + specialty */}
                        <div>
                          <p className="text-lg font-bold leading-tight text-foreground">{c.name}</p>
                          <p className="mt-0.5 text-sm text-muted-foreground">{c.specialty}</p>
                        </div>

                        {/* Stars + session count */}
                        <div className="mt-3 flex items-center gap-1.5">
                          <div className="flex">
                            {[1,2,3,4,5].map((s) => (
                              <Star
                                key={s}
                                weight="fill"
                                className={`h-3.5 w-3.5 ${s <= Math.round(c.rating > 0 ? c.rating : 5) ? 'text-amber-400' : 'text-muted-foreground/25'}`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-semibold text-foreground">
                            {c.rating > 0 ? c.rating.toFixed(1) : 'New'}
                          </span>
                          {c.sessionCount > 0 && (
                            <span className="text-xs text-muted-foreground">· {c.sessionCount} sessions</span>
                          )}
                        </div>

                        {/* Bio */}
                        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{c.bio}</p>

                        {/* Language pills */}
                        {c.languages.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {c.languages.map((lang) => (
                              <span key={lang} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                                {lang}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Book button */}
                        <button
                          onClick={() => handleConsultantSelect(c)}
                          disabled={loadingSlots}
                          className="gradient-hero mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-[0.98] disabled:opacity-50"
                        >
                          {loadingSlots && selectedConsultant?.id === c.id
                            ? <><CircleNotch className="h-4 w-4 animate-spin" /> Loading slots…</>
                            : <>Book this specialist <ArrowRight className="h-4 w-4" /></>
                          }
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3 — Date & time ─────────────────────────────────────────── */}
          {step === 3 && selectedConsultant && (
            <div>
              <BackButton label="Back to specialists" onClick={() => setStep(2)} />

              {/* Consultant recap */}
              <div className="mb-8 flex items-center gap-4 rounded-2xl border border-border bg-white px-5 py-4 shadow-sm">
                <ConsultantAvatar consultant={selectedConsultant} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground">{selectedConsultant.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedConsultant.specialty}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-bold text-foreground">${selectedConsultant.priceUsd}</p>
                  <p className="text-xs text-muted-foreground">{selectedConsultant.sessionDurationMins} min</p>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground">Pick a date & time</h2>
                <div className="mt-2 flex items-center gap-2">
                  <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <select
                    value={tz}
                    onChange={(e) => setTz(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {TIMEZONES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">All times shown in {tzAbbr(tz)}.</p>
              </div>

              {loadingSlots ? (
                <div className="space-y-5">
                  {[0, 1].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)}
                </div>
              ) : Object.keys(slotsByDate).length === 0 ? (
                <div className="rounded-2xl border border-border bg-white p-14 text-center shadow-sm">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60">
                    <CalendarBlank className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="font-semibold text-foreground">No slots available in the next 14 days</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    <Link href="/contact" className="text-primary hover:underline">Contact us</Link> to arrange a custom time.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {Object.entries(slotsByDate).map(([date, daySlots]) => (
                    <div key={date} className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                      <div className="flex items-center gap-2.5 border-b border-border bg-muted/30 px-5 py-3">
                        <CalendarBlank className="h-4 w-4 text-primary" />
                        <p className="text-sm font-bold text-foreground">{date}</p>
                        <span className="ml-auto text-xs text-muted-foreground">{daySlots.length} available</span>
                      </div>
                      <div className="flex flex-wrap gap-2 p-4">
                        {daySlots.map((slot) => {
                          const isSelected = pendingSlot?.id === slot.id;
                          return (
                            <button
                              key={slot.id}
                              onClick={() => setPendingSlot(isSelected ? null : slot)}
                              className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                                isSelected
                                  ? 'gradient-hero border-transparent text-white shadow-sm'
                                  : 'border-border bg-white text-foreground hover:border-primary/50 hover:bg-primary/4'
                              }`}
                            >
                              {isSelected && <CheckCircle className="h-3.5 w-3.5" weight="fill" />}
                              {new Date(slot.startAt).toLocaleTimeString('en-GB', {
                                hour: '2-digit', minute: '2-digit', timeZone: tz,
                              })}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Confirm panel */}
              {pendingSlot && (
                <div className="mt-6 overflow-hidden rounded-2xl border border-primary/25 bg-white shadow-md">
                  <div className="gradient-hero px-5 py-3">
                    <p className="text-xs font-semibold text-white/80 uppercase tracking-wide">Selected time</p>
                  </div>
                  <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-foreground">
                        {new Date(pendingSlot.startAt).toLocaleString('en-GB', {
                          weekday: 'long', day: 'numeric', month: 'long',
                          hour: '2-digit', minute: '2-digit', timeZone: tz,
                        })} {tzAbbr(tz)}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{pendingSlot.durationMinutes} min · with {selectedConsultant.name}</p>
                    </div>
                    <button
                      onClick={handleConfirmSlot}
                      className="gradient-hero flex shrink-0 items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
                    >
                      Confirm & continue <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 4 — Your details ────────────────────────────────────────── */}
          {step === 4 && selectedConsultant && selectedSlot && (
            <div className="lg:grid lg:grid-cols-5 lg:gap-8">

              {/* Left: form */}
              <div className="lg:col-span-3">
                <BackButton label="Change time" onClick={() => setStep(3)} />
                <h2 className="mb-7 text-2xl font-bold text-foreground">Your details</h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name + Phone row */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-foreground">Full name *</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                        <input
                          required type="text" value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="Your full name"
                          className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-foreground">WhatsApp / Phone *</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                        <input
                          required type="tel" value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="+237 6XX XXX XXX"
                          className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-foreground">Email address *</label>
                    <div className="relative">
                      <EnvelopeSimple className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                      <input
                        required type="email" value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">Your video session link will be sent here immediately after payment.</p>
                  </div>

                  {/* Pre-session note */}
                  <div>
                    <label className="mb-1.5 flex items-center justify-between text-sm font-semibold text-foreground">
                      <span className="flex items-center gap-1.5">
                        <ChatText className="h-4 w-4 text-muted-foreground/60" />
                        What would you like to discuss?
                      </span>
                      <span className="text-xs font-normal text-muted-foreground">Optional</span>
                    </label>
                    <textarea
                      rows={4} value={preSessionNote}
                      onChange={(e) => setPreSessionNote(e.target.value)}
                      placeholder={
                        category === 'HEALTH'
                          ? 'Briefly describe your question or concern so the consultant can prepare…'
                          : 'Your profession, target destination, current licensing status, specific questions…'
                      }
                      maxLength={500}
                      className="w-full resize-none rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
                    />
                    <p className="mt-1 text-right text-[11px] text-muted-foreground">{preSessionNote.length}/500</p>
                  </div>

                  {/* Consents */}
                  <div className="space-y-3 rounded-xl border border-border bg-white p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Consents & agreements</p>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input type="checkbox" checked={recordingConsent} onChange={(e) => setRecordingConsent(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded accent-primary" />
                      <span className="text-xs leading-relaxed text-muted-foreground">
                        I consent to this session being recorded for quality assurance. Recordings are handled per our{' '}
                        <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input required type="checkbox" checked={termsConsent} onChange={(e) => setTermsConsent(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded accent-primary" />
                      <span className="text-xs leading-relaxed text-muted-foreground">
                        I agree to the{' '}
                        <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and{' '}
                        <Link href="/refund-policy" className="text-primary hover:underline">Refund Policy</Link>.
                        Health advice is informational only — not a substitute for in-person medical care. *
                      </span>
                    </label>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="gradient-hero flex w-full items-center justify-center gap-2.5 rounded-xl py-4 text-base font-bold text-white shadow-lg shadow-primary/25 transition-all hover:opacity-95 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {submitting
                      ? <><CircleNotch className="h-5 w-5 animate-spin" /> Processing payment…</>
                      : <><Lock className="h-5 w-5" /> Pay ${selectedConsultant.priceUsd} securely</>
                    }
                  </button>

                  <p className="text-center text-xs text-muted-foreground">
                    Powered by Tranzak · SSL encrypted · Partial refund if cancelled more than 4 h before session
                  </p>
                </form>
              </div>

              {/* Right: booking summary */}
              <div className="mt-8 lg:col-span-2 lg:mt-0">
                <div className="sticky top-28">
                  <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-md">
                    {/* Summary header */}
                    <div className="gradient-hero px-5 py-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-white/70">Booking Summary</p>
                    </div>

                    <div className="p-5">
                      {/* Consultant mini */}
                      <div className="mb-5 flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-3">
                        <ConsultantAvatar consultant={selectedConsultant} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-foreground">{selectedConsultant.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{selectedConsultant.specialty}</p>
                        </div>
                      </div>

                      {/* Line items */}
                      <div className="space-y-3 text-sm">
                        {[
                          { label: 'Session type', value: category === 'HEALTH' ? 'Health Advice' : 'Career & Licensing' },
                          {
                            label: 'Date & time',
                            value: new Date(selectedSlot.startAt).toLocaleString('en-GB', {
                              weekday: 'short', day: 'numeric', month: 'short',
                              hour: '2-digit', minute: '2-digit', timeZone: tz,
                            }) + ' ' + tzAbbr(tz),
                          },
                          { label: 'Duration', value: `${selectedSlot.durationMinutes} minutes` },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex justify-between gap-2">
                            <span className="shrink-0 text-muted-foreground">{label}</span>
                            <span className="text-right font-medium text-foreground">{value}</span>
                          </div>
                        ))}
                      </div>

                      <div className="my-4 border-t border-border" />

                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">Total due</span>
                        <span className="text-2xl font-extrabold text-primary">${selectedConsultant.priceUsd}</span>
                      </div>

                      {/* Trust items */}
                      <div className="mt-5 space-y-2.5 border-t border-border pt-4">
                        {[
                          { icon: Shield, text: 'SSL-encrypted payment' },
                          { icon: CurrencyDollar, text: 'Partial refund if cancelled >4 h before' },
                          { icon: VideoCamera, text: 'Join link sent immediately after payment' },
                        ].map(({ icon: Icon, text }) => (
                          <div key={text} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                            <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                            {text}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    Questions?{' '}
                    <Link href="/contact" className="font-medium text-primary hover:underline">Chat with us</Link>
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      <SiteFooter />
    </>
  );
}
