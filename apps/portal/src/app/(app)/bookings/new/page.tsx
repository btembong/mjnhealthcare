'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, Stethoscope, ChartLine, Sparkle,
  Star, Clock, CalendarBlank, User, CheckCircle, VideoCamera,
  Globe, CaretLeft, CaretRight, CircleNotch, Translate,
  Info, VideoConference,
} from '@phosphor-icons/react';
import { Skeleton } from '@mjn/ui';
import { toast } from 'sonner';
import { useUser } from '../../../../contexts/user-context';

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000') + '/api/v1';

// ── Timezones ──────────────────────────────────────────────────────────────────

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
  if (!found) return tz;
  const m = found.label.match(/\(([^)]+)\)/);
  return m ? m[1].split(',')[0] : tz;
}

// ── Session categories ─────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    value: 'HEALTH',
    label: 'Health Consultation',
    desc: 'Medical advice, clinical guidance, and health planning from a licensed professional.',
    icon: Stethoscope,
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    border: 'border-secondary/30',
    includes: ['Clinical Q&A', 'Health planning', 'Medication guidance', 'Referral advice'],
  },
  {
    value: 'CAREER',
    label: 'Career Consultation',
    desc: 'Licensing pathways, international job placement, and career strategy.',
    icon: ChartLine,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    includes: ['Pathway assessment', 'Document checklist', 'Exam prep guidance', 'Job search strategy'],
  },
  {
    value: 'BOTH',
    label: 'Health & Career',
    desc: 'A combined session covering both health and career topics in one call.',
    icon: Sparkle,
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/30',
    includes: ['Health + career combined', 'Holistic planning', 'Extended session', 'Priority scheduling'],
  },
];

const STEP_LABELS = ['Session type', 'Consultant', 'Date & time', 'Confirm'];

// ── Avatar gradient per name ───────────────────────────────────────────────────

const AVATAR_GRADIENTS = [
  'from-primary to-primary/60',
  'from-secondary to-secondary/60',
  'from-violet-600 to-violet-400',
  'from-amber-500 to-amber-400',
  'from-rose-500 to-rose-400',
  'from-teal-600 to-teal-400',
];
function avatarGradient(name: string) {
  return AVATAR_GRADIENTS[(name?.charCodeAt(0) ?? 0) % AVATAR_GRADIENTS.length];
}

// ── Formatters ─────────────────────────────────────────────────────────────────

function fmtTime(iso: string, tz: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: tz });
}

function fmtDateFull(iso: string, tz: string) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: tz,
  });
}

// ── Step bar ──────────────────────────────────────────────────────────────────

function StepBar({ step, onStepClick }: { step: number; onStepClick: (i: number) => void }) {
  return (
    <div className="flex items-center gap-1 mb-8">
      {STEP_LABELS.map((label, i) => (
        <div key={label} className="flex items-center gap-1 flex-1">
          <button
            disabled={i >= step}
            onClick={() => i < step && onStepClick(i)}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
              i < step
                ? 'bg-primary text-white hover:bg-primary/80'
                : i === step
                ? 'bg-primary text-white ring-4 ring-primary/20'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            {i < step ? <CheckCircle className="h-4 w-4" weight="fill" /> : i + 1}
          </button>
          <span className={`text-xs font-medium hidden sm:block whitespace-nowrap ${
            i === step ? 'text-foreground' : i < step ? 'text-primary' : 'text-muted-foreground'
          }`}>
            {label}
          </span>
          {i < STEP_LABELS.length - 1 && (
            <div className={`h-px flex-1 min-w-[8px] mx-1 ${i < step ? 'bg-primary' : 'bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Mini calendar ─────────────────────────────────────────────────────────────

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function MiniCalendar({
  availableDates,
  selectedDate,
  onSelect,
}: {
  availableDates: Set<string>;
  selectedDate: string;
  onSelect: (d: string) => void;
}) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(() => {
    if (availableDates.size > 0) {
      const first = Array.from(availableDates).sort()[0];
      const [y, m] = first.split('-').map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // 0=Mon

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function pad(n: number) { return String(n).padStart(2, '0'); }
  function toKey(d: number) { return `${year}-${pad(month + 1)}-${pad(d)}`; }

  function isPast(d: number) {
    return new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  const canPrev = new Date(year, month - 1, 1) >= new Date(today.getFullYear(), today.getMonth(), 1);
  const canNext = new Date(year, month + 1, 1) <= new Date(today.getFullYear(), today.getMonth() + 3, 1);
  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden select-none">
      {/* Month nav */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <button
          onClick={() => setViewMonth(new Date(year, month - 1, 1))}
          disabled={!canPrev}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <CaretLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-bold text-foreground">{monthLabel}</p>
        <button
          onClick={() => setViewMonth(new Date(year, month + 1, 1))}
          disabled={!canNext}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <CaretRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/20">
        {DAY_HEADERS.map((h) => (
          <div key={h} className="py-2 text-center text-xs font-semibold text-muted-foreground">{h}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          if (d === null) return <div key={`e-${i}`} className="aspect-square" />;
          const key = toKey(d);
          const past = isPast(d);
          const available = availableDates.has(key);
          const selected = selectedDate === key;

          return (
            <button
              key={key}
              disabled={past || !available}
              onClick={() => onSelect(key)}
              className={`aspect-square flex flex-col items-center justify-center text-sm font-semibold transition-all relative ${
                selected
                  ? 'bg-primary text-white'
                  : available && !past
                  ? 'hover:bg-primary/10 text-foreground'
                  : 'text-muted-foreground/40 cursor-not-allowed'
              }`}
            >
              {d}
              {available && !past && !selected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      <div className="px-5 py-2.5 border-t border-border bg-muted/10 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-primary inline-block" />
        <span className="text-xs text-muted-foreground">Available dates</span>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

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
  const [tz, setTz] = useState(detectTimezone);
  const [note, setNote] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function fetchConsultants(cat: string) {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/consultations/consultants?category=${cat}`);
      const data = await res.json();
      setConsultants(Array.isArray(data) ? data : []);
    } catch { setError('Could not load consultants.'); }
    setLoading(false);
  }

  async function fetchSlots(consultantId: string) {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/consultations/slots/${consultantId}`);
      const data = await res.json();
      const available = (Array.isArray(data) ? data : []).filter(
        (s: any) => !s.status || s.status === 'AVAILABLE',
      );
      setSlots(available);
      if (available.length > 0) {
        setSelectedDate(
          new Date(available[0].startAt).toLocaleDateString('en-CA', { timeZone: tz }),
        );
      }
    } catch { setError('Could not load available slots.'); }
    setLoading(false);
  }

  const { availableDatesSet, slotsByDate } = useMemo(() => {
    const byDate: Record<string, any[]> = {};
    for (const s of slots) {
      const k = new Date(s.startAt).toLocaleDateString('en-CA', { timeZone: tz });
      if (!byDate[k]) byDate[k] = [];
      byDate[k].push(s);
    }
    return { availableDatesSet: new Set(Object.keys(byDate)), slotsByDate: byDate };
  }, [slots, tz]);

  const slotsForDate = selectedDate ? (slotsByDate[selectedDate] ?? []) : [];

  // Re-compute selectedDate when tz changes
  useEffect(() => {
    if (selectedSlot) {
      setSelectedDate(new Date(selectedSlot.startAt).toLocaleDateString('en-CA', { timeZone: tz }));
    } else if (slots.length > 0) {
      setSelectedDate(new Date(slots[0].startAt).toLocaleDateString('en-CA', { timeZone: tz }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tz]);

  function selectCategory(cat: string) {
    setCategory(cat); setConsultants([]); setConsultant(null);
    setSlots([]); setSelectedSlot(null);
    setStep(1);
    fetchConsultants(cat);
  }

  function selectConsultant(c: any) {
    setConsultant(c); setSlots([]); setSelectedSlot(null);
    setStep(2);
    fetchSlots(c.id);
  }

  function selectSlot(slot: any) { setSelectedSlot(slot); setStep(3); }

  function goBack() {
    setError('');
    if (step > 0) setStep((s) => s - 1);
    else router.push('/bookings');
  }

  async function handleBook() {
    if (!selectedSlot || !me?.email) return;
    setSubmitting(true); setError('');
    try {
      const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL ?? window.location.origin;
      const res = await fetch(`${API}/consultations/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          clientName: me.name ?? '',
          clientEmail: me.email,
          clientPhone: me.phone ?? '',
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
      if (data.redirectUrl) window.location.href = data.redirectUrl;
      else { toast.success('Session booked!'); router.push('/bookings'); }
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong.');
      setSubmitting(false);
    }
  }

  const catConfig = CATEGORIES.find((c) => c.value === category);
  const abbr = tzAbbr(tz);

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-12">

      {/* Back nav */}
      <button
        onClick={goBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {step === 0 ? 'Back to bookings' : 'Back'}
      </button>

      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <VideoConference className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Book a session</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choose a session type, a consultant, and a time that works for you.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <StepBar step={step} onStepClick={setStep} />

          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
              <Info className="h-4 w-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {/* ── Step 0: Session type ──────────────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-3">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.value}
                    onClick={() => selectCategory(cat.value)}
                    className="w-full flex items-start gap-4 rounded-2xl border-2 border-border bg-white p-5 text-left hover:border-primary/40 hover:shadow-md transition-all group"
                  >
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${cat.bg} border ${cat.border}`}>
                      <Icon className={`h-5 w-5 ${cat.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground">{cat.label}</p>
                      <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{cat.desc}</p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {cat.includes.map((tag) => (
                          <span key={tag} className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cat.bg} ${cat.color}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0 group-hover:text-primary transition-colors" />
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Step 1: Consultant ────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              {catConfig && (
                <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${catConfig.bg} ${catConfig.color} border ${catConfig.border}`}>
                  <catConfig.icon className="h-3.5 w-3.5" /> {catConfig.label} selected
                </div>
              )}

              {loading ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)
              ) : consultants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 mb-3">
                    <User className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="font-semibold text-foreground">No consultants available</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    No consultants are available for this session type right now.
                  </p>
                  <button onClick={() => setStep(0)} className="mt-4 text-sm text-primary underline underline-offset-2">
                    Change session type
                  </button>
                </div>
              ) : (
                consultants.map((c) => {
                  const langs: string[] = Array.isArray(c.languages) ? c.languages : [];
                  const specs: string[] = c.specialty
                    ? c.specialty.split(/[,·]/).map((s: string) => s.trim()).filter(Boolean)
                    : [];
                  const ratingNum = Number(c.rating ?? 0);
                  return (
                    <button
                      key={c.id}
                      onClick={() => selectConsultant(c)}
                      className="w-full flex items-start gap-4 rounded-2xl border-2 border-border bg-white p-5 text-left hover:border-primary/40 hover:shadow-lg transition-all group"
                    >
                      {/* Avatar */}
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${avatarGradient(c.name ?? '')} text-white text-xl font-bold shadow-sm`}>
                        {c.name?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Name + stars */}
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-bold text-foreground text-base">{c.name}</p>
                          {ratingNum > 0 && (
                            <span className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  weight={i < Math.round(ratingNum) ? 'fill' : 'regular'}
                                  className={`h-3 w-3 ${i < Math.round(ratingNum) ? 'text-amber-400' : 'text-muted-foreground/30'}`}
                                />
                              ))}
                              <span className="ml-1 text-xs text-muted-foreground">{ratingNum.toFixed(1)}</span>
                            </span>
                          )}
                          {c.sessionCount > 0 && (
                            <span className="text-xs text-muted-foreground">· {c.sessionCount} sessions</span>
                          )}
                        </div>

                        {/* Specialty tags */}
                        {specs.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {specs.map((s) => (
                              <span key={s} className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Bio */}
                        {c.bio && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{c.bio}</p>
                        )}

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-3 mt-2.5">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" /> {c.sessionDurationMins ?? 45} min
                          </span>
                          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                            ${Number(c.priceUsd ?? 0).toFixed(0)} USD
                          </span>
                          {langs.length > 0 && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Translate className="h-3.5 w-3.5" /> {langs.join(' · ')}
                            </span>
                          )}
                        </div>
                      </div>

                      <ArrowRight className="h-4 w-4 text-muted-foreground mt-2 shrink-0 group-hover:text-primary transition-colors" />
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* ── Step 2: Date & time ───────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Consultant summary */}
              <div className="flex items-center gap-3 rounded-xl bg-muted/30 border border-border p-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${avatarGradient(consultant?.name ?? '')} text-white text-sm font-bold`}>
                  {consultant?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{consultant?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {consultant?.sessionDurationMins ?? 45} min · ${Number(consultant?.priceUsd ?? 0).toFixed(0)} USD
                  </p>
                </div>
                <button onClick={() => setStep(1)} className="text-xs text-primary font-semibold hover:underline shrink-0">
                  Change
                </button>
              </div>

              {/* Timezone */}
              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-white px-3 py-2">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                <select
                  value={tz}
                  onChange={(e) => { setTz(e.target.value); setSelectedDate(''); setSelectedSlot(null); }}
                  className="flex-1 bg-transparent text-sm text-foreground outline-none cursor-pointer"
                >
                  {TIMEZONES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {loading ? (
                <Skeleton className="h-72 rounded-2xl" />
              ) : availableDatesSet.size === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 mb-3">
                    <CalendarBlank className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="font-semibold text-foreground">No available slots</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    {consultant?.name} has no open slots. Try another consultant.
                  </p>
                  <button onClick={() => setStep(1)} className="mt-4 text-sm text-primary underline underline-offset-2">
                    Choose another consultant
                  </button>
                </div>
              ) : (
                <>
                  <MiniCalendar
                    availableDates={availableDatesSet}
                    selectedDate={selectedDate}
                    onSelect={(d) => { setSelectedDate(d); setSelectedSlot(null); }}
                  />

                  {/* Time slots */}
                  {selectedDate && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-foreground">
                          {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                            weekday: 'long', month: 'long', day: 'numeric',
                          })}
                        </p>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{abbr}</span>
                      </div>

                      {slotsForDate.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6 rounded-xl border border-border bg-muted/20">
                          No slots on this day — pick another date.
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {slotsForDate.map((slot) => (
                            <button
                              key={slot.id}
                              onClick={() => selectSlot(slot)}
                              className="rounded-xl border border-border bg-white px-3 py-3 text-sm font-semibold text-foreground hover:border-primary hover:bg-primary/5 hover:text-primary transition-all text-center"
                            >
                              {fmtTime(slot.startAt, tz)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Step 3: Confirm ───────────────────────────────────────────── */}
          {step === 3 && selectedSlot && (
            <div className="space-y-5">

              {/* Session summary card */}
              <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-primary/15 bg-primary/10">
                  <VideoCamera className="h-4 w-4 text-primary" weight="fill" />
                  <span className="text-sm font-bold text-primary">Session summary</span>
                </div>
                <div className="px-5 py-4 space-y-3 text-sm">
                  {([
                    ['Session type', catConfig?.label],
                    ['Consultant', consultant?.name],
                    ['Duration', `${consultant?.sessionDurationMins ?? 45} minutes`],
                    ['Date & time', `${fmtDateFull(selectedSlot.startAt, tz)} (${abbr})`],
                  ] as [string, string | undefined][]).map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold text-foreground text-right">{value ?? '—'}</span>
                    </div>
                  ))}
                  <div className="border-t border-primary/15 pt-3 flex justify-between gap-4 items-center">
                    <span className="font-bold text-foreground">Total</span>
                    <span className="font-extrabold text-primary text-xl">
                      ${Number(consultant?.priceUsd ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Your details (read-only) */}
              <div className="rounded-2xl border border-border overflow-hidden">
                <div className="px-5 py-3 border-b border-border bg-muted/20">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your details</p>
                </div>
                <div className="px-5 py-4 space-y-2.5 text-sm">
                  {[
                    ['Name', me?.name],
                    ['Email', me?.email],
                    ['Phone', me?.phone],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium text-foreground">{value ?? '—'}</span>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-2.5 border-t border-border bg-muted/10">
                  <button onClick={() => router.push('/settings')} className="text-xs text-primary hover:underline underline-offset-2">
                    Update contact details →
                  </button>
                </div>
              </div>

              {/* Pre-session note */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Pre-session note{' '}
                  <span className="font-normal text-muted-foreground text-xs">(optional)</span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What would you like to discuss? Any specific questions or context to help your consultant prepare."
                  rows={3}
                  className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                />
              </div>

              {/* Recording consent */}
              <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-border bg-muted/20 p-4 hover:bg-muted/30 transition-colors">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary shrink-0"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">Recording consent</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    I consent to this session being recorded for quality assurance. Recordings are stored securely and not shared with third parties.
                  </p>
                </div>
              </label>

              {/* CTA */}
              <button
                onClick={handleBook}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                {submitting ? (
                  <><CircleNotch className="h-4 w-4 animate-spin" /> Processing…</>
                ) : (
                  <>Confirm & Pay ${Number(consultant?.priceUsd ?? 0).toFixed(2)} <ArrowRight className="h-4 w-4" /></>
                )}
              </button>

              <p className="text-xs text-center text-muted-foreground">
                Secure payment via Tranzak. You will be redirected to complete payment and returned here when done.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
