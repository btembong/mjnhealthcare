'use client';

import Link from 'next/link';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import {
  ArrowRight,
  CalendarBlank,
  Clock,
  MonitorPlay,
  Users,
  Play,
  Globe,
  GraduationCap,
  Stethoscope,
  Briefcase,
  CheckCircle,
} from '@phosphor-icons/react';

// ─── DATA ──────────────────────────────────────────────────────────────────────

const upcoming = [
  {
    id: 'uae-dataflow-2026',
    title: 'UAE DataFlow 2026: What Changed and What to Submit',
    date: 'Sat 26 Jul 2026',
    time: '10:00 AM WAT / 1:00 PM GST',
    duration: '60 min',
    host: 'Sylvie Etame',
    hostRole: 'Head of Licensing Operations · Dubai',
    category: 'UAE Licensing',
    categoryColor: 'bg-amber-50 text-amber-700 border-amber-200',
    spots: 18,
    spotsMax: 50,
    desc: 'DHA updated its primary-source verification requirements in Q1 2026. Sylvie walks through the changes, the exact documents now required, and common reasons applications are returned — with live Q&A.',
    href: '/get-started',
  },
  {
    id: 'nclex-ngn-strategy',
    title: 'Passing NCLEX with NGN Questions — Strategy Session',
    date: 'Wed 30 Jul 2026',
    time: '6:00 PM WAT / 7:00 PM CET',
    duration: '75 min',
    host: 'Emmanuel Biya',
    hostRole: 'Head of Academy & Education · Yaoundé',
    category: 'NCLEX',
    categoryColor: 'bg-blue-50 text-blue-700 border-blue-200',
    spots: 32,
    spotsMax: 80,
    desc: 'Next Generation NCLEX items now account for 20–30% of the exam. Emmanuel covers the 6 NGN item types, how they are scored, and the reasoning frameworks that separate first-attempt passers from those who sit again.',
    href: '/get-started',
  },
  {
    id: 'ireland-2026-pathway',
    title: 'Ireland 2026: NMBI Registration and Critical Skills Permit — Full Walk-through',
    date: 'Sat 9 Aug 2026',
    time: '11:00 AM WAT / 12:00 PM IST',
    duration: '60 min',
    host: 'Amina Ousseini',
    hostRole: 'Head of Student Support · Dublin',
    category: 'Ireland',
    categoryColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    spots: 44,
    spotsMax: 60,
    desc: 'Amina completed NMBI registration and Ireland\'s Critical Skills Permit herself in 2021 and now advises nurses navigating the same path. Session covers updated NMBI requirements, English test options, and permit processing realities.',
    href: '/get-started',
  },
  {
    id: 'uk-nmc-osce-prep',
    title: 'NMC OSCE Preparation: What Assessors Look for in 2026',
    date: 'Wed 20 Aug 2026',
    time: '5:00 PM WAT / 6:00 PM BST',
    duration: '60 min',
    host: 'Patrick Mbang',
    hostRole: 'Head of Staffing & Employer Relations · London',
    category: 'UK Placement',
    categoryColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    spots: 27,
    spotsMax: 50,
    desc: 'Patrick spent 8 years on the NHS trust side and knows exactly what OSCE assessors are evaluating. This session covers communication stations, medication management, and the clinical decision-making scenarios that trip up most candidates.',
    href: '/get-started',
  },
];

const recorded = [
  {
    id: 'choosing-destination',
    title: 'UAE vs UK vs Ireland: Choosing the Right Destination for Your Profession',
    recorded: 'Jun 14, 2026',
    duration: '58 min',
    views: '2,300+',
    host: 'Mbout John Nyah',
    category: 'Career Planning',
    categoryColor: 'bg-teal-50 text-teal-700 border-teal-200',
    desc: 'Salary comparisons, licensing timelines, English test requirements, and quality-of-life factors across the four most common destinations. Covers nurses, physicians, and allied health.',
    href: '/get-started',
  },
  {
    id: 'dataflow-documents',
    title: 'DataFlow Deep Dive: Documents, Attestation, and Avoiding Rejections',
    recorded: 'May 28, 2026',
    duration: '52 min',
    views: '3,800+',
    host: 'Sylvie Etame',
    category: 'UAE Licensing',
    categoryColor: 'bg-amber-50 text-amber-700 border-amber-200',
    desc: 'The most-watched session in MJN\'s library. Covers institution verification, good-standing certificates, name mismatch resolution, and the pre-submission review process that achieves a 98% acceptance rate.',
    href: '/get-started',
  },
  {
    id: 'nclex-study-plan',
    title: 'Building Your NCLEX Study Plan — From Diagnostic to Exam Day',
    recorded: 'May 10, 2026',
    duration: '66 min',
    views: '4,100+',
    host: 'Emmanuel Biya',
    category: 'NCLEX',
    categoryColor: 'bg-blue-50 text-blue-700 border-blue-200',
    desc: 'Emmanuel walks through the full MJN Academy study methodology — diagnostic test, topic prioritisation, question-bank rotation, and the final 2-week review strategy. Available in EN and FR.',
    href: '/get-started',
  },
  {
    id: 'physician-pathways',
    title: 'International Pathways for Physicians — GMC, ECFMG, and UAE DHA',
    recorded: 'Apr 22, 2026',
    duration: '70 min',
    views: '1,900+',
    host: 'Mbout John Nyah',
    category: 'Career Planning',
    categoryColor: 'bg-teal-50 text-teal-700 border-teal-200',
    desc: 'Specifically for internationally educated physicians. Covers GMC registration vs NHS internship routes, ECFMG for the US, DHA physician licensing, and realistic cost and timeline expectations for each.',
    href: '/get-started',
  },
  {
    id: 'salaries-benefits',
    title: 'Salary, Benefits, and Contract Terms — What to Negotiate Before You Sign',
    recorded: 'Apr 5, 2026',
    duration: '48 min',
    views: '2,700+',
    host: 'Patrick Mbang',
    category: 'Career Planning',
    categoryColor: 'bg-teal-50 text-teal-700 border-teal-200',
    desc: 'Patrick covers base pay benchmarks by emirate and UK band, allowances that are negotiable, contract clauses that benefit employers over candidates, and red flags to walk away from.',
    href: '/get-started',
  },
  {
    id: 'student-internships',
    title: 'International Internships for Healthcare Students — Getting in Without Experience',
    recorded: 'Mar 18, 2026',
    duration: '44 min',
    views: '1,500+',
    host: 'Amina Ousseini',
    category: 'Student Support',
    categoryColor: 'bg-pink-50 text-pink-700 border-pink-200',
    desc: 'Internship placements for nursing and medical students — locally in Cameroon and Nigeria, and internationally in UAE and Ireland. Covers eligibility, how to apply, what supervisors want to see, and timing relative to graduation.',
    href: '/get-started',
  },
];

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'UAE Licensing': Stethoscope,
  'NCLEX': GraduationCap,
  'UK Placement': Briefcase,
  'Ireland': Globe,
  'Career Planning': Briefcase,
  'Student Support': GraduationCap,
};

// ─── PAGE ──────────────────────────────────────────────────────────────────────

export default function WebinarsPage() {
  return (
    <>
      <MarketingNav />

      {/* HERO */}
      <section className="gradient-hero relative overflow-hidden pt-28 pb-16 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-56 w-56 rounded-full bg-teal-400/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6">
          <Badge className="mb-4 border border-white/20 bg-white/10 text-white backdrop-blur-sm">
            Webinars
          </Badge>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Live and Recorded Sessions with MJN Consultants
          </h1>
          <p className="mt-4 max-w-xl text-lg text-blue-100">
            Every session is hosted by a consultant who has personally completed the process they are teaching —
            not a trainer reading from a manual.
          </p>

          {/* Stats strip */}
          <div className="mt-10 flex flex-wrap gap-6">
            {[
              { value: '6,000+', label: 'Total views this year' },
              { value: '94%', label: 'Attendee satisfaction' },
              { value: 'EN & FR', label: 'Language options' },
              { value: 'Free', label: 'All sessions' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-extrabold text-white">{value}</p>
                <p className="text-xs text-blue-200">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UPCOMING WEBINARS */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <Badge variant="outline" className="mb-2">Upcoming Live Sessions</Badge>
              <h2 className="text-3xl font-bold">Register Free</h2>
              <p className="mt-1 text-muted-foreground">Live sessions include Q&A with the host.</p>
            </div>
            <Link href="/get-started" className="hidden shrink-0 text-sm font-semibold text-primary hover:underline sm:inline-flex items-center gap-1">
              Get notified of new sessions <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {upcoming.map((w) => {
              const filled = Math.round((w.spotsMax - w.spots) / w.spotsMax * 100);
              return (
                <div
                  key={w.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
                >
                  {/* Top bar */}
                  <div className="flex items-center justify-between border-b border-border px-5 py-3">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${w.categoryColor}`}>
                      {w.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> {w.duration}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-bold text-foreground leading-snug">{w.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{w.desc}</p>

                    {/* Date / time */}
                    <div className="mt-4 flex flex-wrap gap-3">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-foreground/70">
                        <CalendarBlank className="h-3.5 w-3.5 text-primary" />
                        {w.date}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-medium text-foreground/70">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        {w.time}
                      </span>
                    </div>

                    {/* Host */}
                    <div className="mt-4 flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {w.host.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{w.host}</p>
                        <p className="text-[10px] text-muted-foreground">{w.hostRole}</p>
                      </div>
                    </div>

                    {/* Spots */}
                    <div className="mt-4">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          <span className="font-semibold text-foreground">{w.spots} spots</span> remaining of {w.spotsMax}
                        </span>
                        <span className="font-semibold text-primary">{filled}% full</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${filled}%` }}
                        />
                      </div>
                    </div>

                    {/* CTA */}
                    <Button className="mt-5 w-full rounded-xl" asChild>
                      <Link href={w.href}>
                        Reserve My Spot — Free <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* RECORDED LIBRARY */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10">
            <Badge variant="outline" className="mb-2">On-Demand Library</Badge>
            <h2 className="text-3xl font-bold">Watch Any Time</h2>
            <p className="mt-1 text-muted-foreground">
              All past sessions are available free — no sign-up required.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recorded.map((w) => {
              const Icon = categoryIcons[w.category] ?? MonitorPlay;
              return (
                <div
                  key={w.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                >
                  {/* Thumbnail placeholder */}
                  <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md transition-transform group-hover:scale-110">
                      <Play className="h-5 w-5 translate-x-0.5 text-primary" weight="fill" />
                    </div>
                    <span className={`absolute bottom-3 left-3 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${w.categoryColor}`}>
                      {w.category}
                    </span>
                    <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white">
                      <Clock className="h-2.5 w-2.5" /> {w.duration}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-sm font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
                      {w.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                      {w.desc}
                    </p>

                    <div className="mt-auto pt-4 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold text-foreground">{w.host}</p>
                        <p className="text-[10px] text-muted-foreground">{w.recorded} · {w.views} views</p>
                      </div>
                      <Link
                        href={w.href}
                        className="flex items-center gap-1 rounded-lg bg-primary/8 px-3 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/15"
                      >
                        Watch <Play className="h-3 w-3" weight="fill" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge variant="outline" className="mb-3">Why Attend</Badge>
              <h2 className="text-3xl font-bold sm:text-4xl">Sessions Taught by People Who Have Done It</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Every MJN consultant has personally navigated the process they teach — as an internationally
                educated healthcare professional from Africa. No actors. No trainers. The person on screen has
                been through your licensing journey.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Live Q&A — ask the host your specific question, not a FAQ bot',
                  'Small cohorts — upcoming sessions capped at 50–80 registrants',
                  'Recording available — all live sessions recorded and added to library within 48h',
                  'English and French — select sessions available in French on request',
                  'Free — no upsell, no paywall, no "upgrade to watch"',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" weight="fill" />
                    <span className="text-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: upcoming at a glance */}
            <div className="rounded-2xl border border-border bg-muted/30 p-6">
              <p className="mb-4 text-sm font-semibold text-foreground">Next 4 sessions at a glance</p>
              <div className="space-y-3">
                {upcoming.map((w) => (
                  <div key={w.id} className="flex items-start gap-3 rounded-xl bg-white border border-border p-3 shadow-sm">
                    <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-center leading-none">
                      <span className="text-[10px] font-semibold text-primary/70 uppercase">{w.date.split(' ')[1]}</span>
                      <span className="text-base font-extrabold text-primary leading-tight">{w.date.split(' ')[2]}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2">{w.title}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{w.host} · {w.duration}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${w.categoryColor}`}>
                      {w.spots} left
                    </span>
                  </div>
                ))}
              </div>
              <Button className="mt-5 w-full rounded-xl" asChild>
                <Link href="/get-started">
                  Get Notified of New Sessions <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-4xl">
          <div className="gradient-hero relative overflow-hidden rounded-3xl p-7 sm:p-10 text-center text-white">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
              <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-teal-400/10 blur-xl" />
            </div>
            <div className="relative">
              <MonitorPlay className="mx-auto mb-4 h-10 w-10 text-teal-300" />
              <h2 className="text-3xl font-bold sm:text-4xl">Want a Personal Consultation Instead?</h2>
              <p className="mx-auto mt-3 max-w-md text-blue-100">
                Webinars are great for general knowledge. For your specific qualifications and destination,
                book a free 30-minute call with a dedicated advisor.
              </p>
              <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button size="lg" className="rounded-xl bg-white px-8 text-primary hover:bg-white/90" asChild>
                  <Link href="/get-started">Book Free Consultation</Link>
                </Button>
                <Button size="lg" variant="ghost" className="text-white hover:bg-white/10" asChild>
                  <Link href="/blog">Read the Blog →</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
