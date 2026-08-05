'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Users,
  VideoCamera,
  CalendarBlank,
  ChatCircle,
  Play,
} from '@phosphor-icons/react';

// ── Types ──────────────────────────────────────────────────────────────────────
type Session = {
  id: string;
  title: string;
  instructor: string;
  instructorTitle: string;
  instructorInitials: string;
  date: string;
  startIso: string; // UTC
  endIso: string;   // UTC
  duration: string;
  seatsLeft: number;
  maxSeats: number;
  tag: 'DHA' | 'NCLEX' | 'CBT' | 'HAAD';
  whatsappText: string;
};

type PastSession = {
  title: string;
  tag: string;
  date: string;
  attendees: number;
};

// ── Data ───────────────────────────────────────────────────────────────────────
const ALL_SESSIONS: Session[] = [
  {
    id: 's1',
    title: 'DHA Exam 2026 — What Changed and How to Prepare',
    instructor: 'Sylvie Etame',
    instructorTitle: 'Head of Licensing Operations · DHA-licensed',
    instructorInitials: 'SE',
    date: 'Tue 22 Jul 2026',
    startIso: '2026-07-22T17:00:00Z', // 6 PM WAT / 9 PM GST
    endIso: '2026-07-22T18:30:00Z',
    duration: '90 min',
    seatsLeft: 11,
    maxSeats: 30,
    tag: 'DHA',
    whatsappText: 'DHA Exam 2026 class on Tue 22 Jul at 6 PM WAT',
  },
  {
    id: 's2',
    title: 'NCLEX NGN Mastery — Clinical Judgement Case Studies',
    instructor: 'Emmanuel Biya',
    instructorTitle: 'Head of Academy',
    instructorInitials: 'EB',
    date: 'Tue 29 Jul 2026',
    startIso: '2026-07-29T16:00:00Z', // 5 PM WAT / 6 PM GMT
    endIso: '2026-07-29T18:00:00Z',
    duration: '2 hours',
    seatsLeft: 8,
    maxSeats: 30,
    tag: 'NCLEX',
    whatsappText: 'NCLEX NGN Mastery class on Tue 29 Jul at 5 PM WAT',
  },
  {
    id: 's3',
    title: 'NMC CBT Deep Dive — Medicines Management Module',
    instructor: 'Guest Instructor',
    instructorTitle: 'NMC-registered · London NHS',
    instructorInitials: 'GI',
    date: 'Thu 31 Jul 2026',
    startIso: '2026-07-31T18:00:00Z', // 7 PM WAT / 8 PM BST
    endIso: '2026-07-31T19:30:00Z',
    duration: '90 min',
    seatsLeft: 20,
    maxSeats: 30,
    tag: 'CBT',
    whatsappText: 'NMC CBT Deep Dive on Thu 31 Jul at 7 PM WAT',
  },
  {
    id: 's4',
    title: 'HAAD / DOH Critical Care Nursing — Exam Focus',
    instructor: 'Blaise K.',
    instructorTitle: 'DOH-licensed ICU Nurse · Abu Dhabi',
    instructorInitials: 'BK',
    date: 'Sat 2 Aug 2026',
    startIso: '2026-08-02T09:00:00Z', // 10 AM WAT / 1 PM GST
    endIso: '2026-08-02T11:00:00Z',
    duration: '2 hours',
    seatsLeft: 5,
    maxSeats: 30,
    tag: 'HAAD',
    whatsappText: 'HAAD/DOH Critical Care class on Sat 2 Aug at 10 AM WAT',
  },
];

const PAST_SESSIONS: PastSession[] = [
  { title: 'DHA 2026 Blueprint — Key Changes', tag: 'DHA', date: '8 Jul 2026', attendees: 28 },
  { title: 'NCLEX NGN — Cognitive Skills Breakdown', tag: 'NCLEX', date: '1 Jul 2026', attendees: 30 },
  { title: 'NMC CBT — Infection Control Module', tag: 'CBT', date: '24 Jun 2026', attendees: 25 },
  { title: 'HAAD Pharmacology Focus Session', tag: 'HAAD', date: '17 Jun 2026', attendees: 22 },
  { title: 'NCLEX Prioritisation & Delegation', tag: 'NCLEX', date: '10 Jun 2026', attendees: 29 },
];

const TAGS = ['All', 'DHA', 'NCLEX', 'CBT', 'HAAD'] as const;

const TAG_COLORS: Record<string, string> = {
  DHA: 'bg-amber-50 text-amber-700 border-amber-200',
  NCLEX: 'bg-purple-50 text-purple-700 border-purple-200',
  CBT: 'bg-blue-50 text-blue-700 border-blue-200',
  HAAD: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const features = [
  'Small cohorts (max 30 per session) — questions genuinely answered',
  'Delivered by licensed professionals with personal exam experience',
  'Interactive — live polls, case breakdowns, Q&A throughout',
  'Session recordings available within 24 hours for enrolled students',
  'Aligned to your study plan — sessions target known difficulty areas',
  'Available across West African, Gulf, and UK time zones',
];

const faqs = [
  {
    q: 'How small are the cohorts really?',
    a: 'We cap every session at 30 students. This is not a webinar — it is a classroom. The instructor has your name, can call on you, and responds to every question in the chat. We have rejected the easy option of scaling up sessions because quality drops past 30.',
  },
  {
    q: 'What if I miss a session?',
    a: 'All sessions are recorded and available to enrolled students within 24 hours. You can watch the full session including the Q&A. Recordings are available for 90 days from the session date.',
  },
  {
    q: 'Are sessions available in French?',
    a: 'Some sessions are delivered in French, particularly for NCLEX and DHA content. The session language is displayed in the booking calendar. We are expanding French-language session frequency — it is a priority for 2026.',
  },
  {
    q: 'Are live sessions included in the exam prep plans?',
    a: 'Live sessions are included in Academy Plus and Full Engagement plans — you are enrolled automatically. Self-Study plan subscribers can purchase individual sessions at a flat per-session rate.',
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
type Countdown = { d: number; h: number; m: number; s: number; expired: boolean };

function useCountdown(isoDate: string): Countdown {
  const [state, setState] = useState<Countdown>({ d: 0, h: 0, m: 0, s: 0, expired: false });

  useEffect(() => {
    function tick() {
      const diff = new Date(isoDate).getTime() - Date.now();
      if (diff <= 0) {
        setState({ d: 0, h: 0, m: 0, s: 0, expired: true });
        return;
      }
      setState({
        d: Math.floor(diff / 86_400_000),
        h: Math.floor((diff % 86_400_000) / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1_000),
        expired: false,
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isoDate]);

  return state;
}

function isLive(startIso: string, endIso: string): boolean {
  const now = Date.now();
  return now >= new Date(startIso).getTime() && now <= new Date(endIso).getTime();
}

function localTime(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return '';
  }
}

function googleCalUrl(s: Session): string {
  const fmt = (d: string) => d.replace(/[-:]/g, '').split('.')[0] + 'Z';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: s.title,
    dates: `${fmt(s.startIso)}/${fmt(s.endIso)}`,
    details: `Instructor: ${s.instructor} — ${s.instructorTitle}\n\nJoin via your MJN Healthcare portal.`,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function downloadIcs(s: Session) {
  const fmt = (d: string) => d.replace(/[-:]/g, '').split('.')[0] + 'Z';
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MJN Healthcare//EN',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(s.startIso)}`,
    `DTEND:${fmt(s.endIso)}`,
    `SUMMARY:${s.title}`,
    `DESCRIPTION:Instructor: ${s.instructor} — ${s.instructorTitle}`,
    'LOCATION:Online (MJN Healthcare)',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([lines], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${s.tag}-session-${s.date.replace(/\s/g, '-')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

function seatBarColor(left: number, max: number): string {
  const pct = left / max;
  if (pct <= 0.17) return 'bg-red-500';
  if (pct <= 0.33) return 'bg-amber-400';
  return 'bg-emerald-500';
}

function seatLabel(left: number): { text: string; color: string } {
  if (left === 0) return { text: 'Full', color: 'text-red-600' };
  if (left <= 5) return { text: 'Almost full', color: 'text-red-500' };
  if (left <= 10) return { text: 'Filling fast', color: 'text-amber-600' };
  return { text: `${left} seats left`, color: 'text-muted-foreground' };
}

// ── Session Card ───────────────────────────────────────────────────────────────
function SessionCard({ session }: { session: Session }) {
  const cd = useCountdown(session.startIso);
  const live = isLive(session.startIso, session.endIso);
  const local = localTime(session.startIso);
  const fill = ((session.maxSeats - session.seatsLeft) / session.maxSeats) * 100;
  const { text: seatText, color: seatColor } = seatLabel(session.seatsLeft);
  const tagCls = TAG_COLORS[session.tag] ?? 'bg-muted text-muted-foreground border-border';

  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md ${
        live ? 'border-red-300 ring-2 ring-red-100' : 'border-border'
      }`}
    >
      {/* Top row: tag + live/seats */}
      <div className="flex items-start justify-between gap-2">
        <span className={`rounded-full border px-2.5 py-[3px] text-[11px] font-semibold ${tagCls}`}>
          {session.tag}
        </span>

        {live ? (
          <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600 ring-1 ring-red-200">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            Live now
          </span>
        ) : (
          <span className={`text-xs font-semibold ${seatColor}`}>{seatText}</span>
        )}
      </div>

      {/* Title */}
      <p className="font-semibold leading-snug text-foreground">{session.title}</p>

      {/* Instructor mini-profile */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary ring-2 ring-primary/10">
          {session.instructorInitials}
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground">{session.instructor}</p>
          <p className="text-[10px] leading-tight text-muted-foreground">{session.instructorTitle}</p>
        </div>
      </div>

      {/* Date + duration */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CalendarBlank className="h-3 w-3" /> {session.date}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> {session.duration}
        </span>
      </div>

      {/* Auto-detected local time */}
      <p className="text-[11px] text-muted-foreground">
        Your local time:{' '}
        <span className="font-semibold text-foreground">{local}</span>
      </p>

      {/* Seat availability bar */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Cohort size: {session.maxSeats}</span>
          <span>{session.seatsLeft} remaining</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ${seatBarColor(session.seatsLeft, session.maxSeats)}`}
            style={{ width: `${fill}%` }}
          />
        </div>
      </div>

      {/* Countdown ticker */}
      {!live && !cd.expired && (
        <div className="rounded-xl bg-muted/50 px-4 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Starts in
          </p>
          <div className="flex items-end gap-1">
            {[
              { val: cd.d, label: 'days' },
              { val: cd.h, label: 'hrs' },
              { val: cd.m, label: 'min' },
              { val: cd.s, label: 'sec' },
            ].map(({ val, label }, i) => (
              <div key={label} className="flex items-end gap-1">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-extrabold tabular-nums leading-none text-foreground">
                    {String(val).padStart(2, '0')}
                  </span>
                  <span className="mt-0.5 text-[9px] uppercase tracking-widest text-muted-foreground">
                    {label}
                  </span>
                </div>
                {i < 3 && (
                  <span className="mb-4 text-base font-bold text-muted-foreground/40">:</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar + remind buttons */}
      <div className="flex flex-wrap gap-1.5">
        <a
          href={googleCalUrl(session)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          + Google Cal
        </a>
        <button
          onClick={() => downloadIcs(session)}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          + Apple / Outlook
        </button>
        <a
          href={`https://wa.me/971508638660?text=${encodeURIComponent(`Hi, please send me a reminder for the ${session.whatsappText}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
        >
          Remind me
        </a>
      </div>

      {/* Primary CTA */}
      {session.seatsLeft === 0 ? (
        <a
          href={`https://wa.me/971508638660?text=${encodeURIComponent(`Hi, I'd like to join the waitlist for: ${session.title}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"
        >
          Join Waitlist
        </a>
      ) : live ? (
        <Link
          href="/get-started"
          className="flex items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white shadow-md shadow-red-200 transition hover:bg-red-600"
        >
          <Play weight="fill" className="h-4 w-4" /> Join Now — Live
        </Link>
      ) : (
        <Link
          href="/get-started"
          className="flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition hover:bg-primary/90 hover:-translate-y-px"
        >
          Reserve Seat <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function LiveClassesPage() {
  const [activeTag, setActiveTag] = useState<string>('All');

  const filtered = useMemo(
    () =>
      activeTag === 'All'
        ? ALL_SESSIONS
        : ALL_SESSIONS.filter((s) => s.tag === activeTag),
    [activeTag],
  );

  return (
    <>
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden text-white bg-cover bg-center bg-no-repeat min-h-[520px] flex items-center" style={{ backgroundImage: "url('/examhero.jpg')" }}>
        <div className="relative mx-auto w-full max-w-6xl px-6 py-28 flex justify-end">
          <div className="w-full max-w-lg rounded-3xl bg-[#0F4C81]/80 p-8 backdrop-blur-md ring-1 ring-white/10 shadow-2xl">
            <Badge className="mb-4 border border-white/20 bg-white/10 text-white backdrop-blur-sm">
              Academy — Live Classes
            </Badge>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Live Virtual Classes — Small Cohorts, Expert Instructors
            </h1>
            <p className="mt-4 text-base text-blue-100 leading-relaxed">
              Weekly live sessions for NCLEX, DHA, HAAD, and CBT preparation — delivered by licensed professionals, capped at 30 students per session.
            </p>
            <div className="mt-6">
              <Button size="lg" className="rounded-xl bg-white px-8 text-primary shadow-lg hover:bg-white/90" asChild>
                <Link href="/get-started">Reserve a Seat <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-blue-100">
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-teal-300" /> Max 30 per session</span>
              <span className="flex items-center gap-1.5"><VideoCamera className="h-4 w-4 text-teal-300" /> Powered by Daily.co</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-teal-300" /> Recordings within 24 hours</span>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming sessions */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <Badge variant="outline" className="mb-3">Schedule</Badge>
            <h2 className="text-4xl font-bold">Upcoming Sessions</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Countdowns update live · Times shown in your local timezone · Max 30 seats per cohort
            </p>

            {/* Filter tabs */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-all ${
                    activeTag === tag
                      ? 'border-primary bg-primary text-white shadow-sm'
                      : 'border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {filtered.map((s) => (
                <SessionCard key={s.id} session={s} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-white py-16 text-center">
              <p className="text-muted-foreground">No upcoming {activeTag} sessions scheduled right now.</p>
              <a
                href={`https://wa.me/971508638660?text=${encodeURIComponent(`Hi, I'd like to be notified when the next ${activeTag} session is scheduled`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                <ChatCircle className="h-4 w-4" /> Notify me via WhatsApp
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Past sessions / recordings */}
      <section className="bg-muted/30 px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <Badge variant="outline" className="mb-2">Past Sessions</Badge>
              <h2 className="text-2xl font-bold text-foreground">Recordings Available</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enrolled students access recordings in the portal within 24 hours.
              </p>
            </div>
          </div>

          {/* Horizontal scroll */}
          <div className="flex gap-4 overflow-x-auto pb-3">
            {PAST_SESSIONS.map((ps) => {
              const tagCls = TAG_COLORS[ps.tag] ?? 'bg-muted text-muted-foreground border-border';
              return (
                <div
                  key={ps.title}
                  className="flex w-60 shrink-0 flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full border px-2.5 py-[3px] text-[11px] font-semibold ${tagCls}`}>
                      {ps.tag}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Users className="h-3 w-3" /> {ps.attendees}/{ps.attendees < 30 ? 30 : 30}
                    </span>
                  </div>
                  <p className="text-sm font-semibold leading-snug text-foreground">{ps.title}</p>
                  <p className="text-xs text-muted-foreground">{ps.date}</p>
                  <Link
                    href="/login"
                    className="mt-auto flex items-center justify-center gap-1.5 rounded-lg bg-primary/8 py-2 text-xs font-semibold text-primary transition hover:bg-primary/12"
                  >
                    <Play weight="fill" className="h-3 w-3" /> Watch Recording
                  </Link>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Recordings available to Academy Plus and Full Engagement students.{' '}
            <Link href="/get-started" className="text-primary hover:underline">
              Get enrolled →
            </Link>
          </p>
        </div>
      </section>

      {/* Why live classes */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">Why Live Classes</Badge>
            <h2 className="text-4xl font-bold">What Makes These Sessions Different</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f} className="flex items-start gap-3 rounded-xl border border-border bg-white p-4">
                <CheckCircle weight="fill" className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                <span className="text-sm text-muted-foreground">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">FAQ</Badge>
            <h2 className="text-4xl font-bold">Common Questions</h2>
          </div>
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white">
            {faqs.map(({ q, a }) => (
              <div key={q} className="px-6 py-5">
                <p className="text-sm font-semibold text-foreground">{q}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="gradient-hero relative overflow-hidden rounded-3xl p-10 text-center text-white">
            <h2 className="text-4xl font-bold">Learn Live — Not Alone</h2>
            <p className="mx-auto mt-3 max-w-md text-blue-100">
              Sessions fill fast. Reserve your seat for the next NCLEX, DHA, HAAD, or CBT class now.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/get-started"
                className="flex items-center gap-2 rounded-xl bg-white px-8 py-3 font-bold text-primary transition hover:bg-white/90"
              >
                Reserve a Seat <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
