'use client';

import Link from 'next/link';
import Image from 'next/image';
import * as React from 'react';
import { Button, Badge } from '@mjn/ui';
import { FAQAccordion } from '../components/faq-accordion';
import { ResourcesTabs } from '../components/resources-tabs';
import { TestimonialCarousel } from '../components/testimonial-carousel';
import { MarketingNav } from '../components/marketing-nav';
import { SiteFooter } from '../components/site-footer';
import {
  ArrowRight, Globe, GraduationCap, Stethoscope, CheckCircle,
  CaretRight, Brain, CalendarBlank, FileText, Target, ChatCircle,
  Shield, Heartbeat, Users, Lightning, BookOpen, Warning, Money,
  X as XIcon, MapPin, Clock, TrendUp, SealCheck,
} from '@phosphor-icons/react';

// ─── DATA ─────────────────────────────────────────────────────────────────────

const recentPlacements = [
  { name: 'Fatima K.', role: 'Physiotherapist', dest: 'Abu Dhabi (DOH)', time: '5 months' },
];

const partners = [
  'Cleveland Clinic Abu Dhabi',
  'NHS United Kingdom',
  'Mediclinic',
  'Aga Khan University Hospital',
  'Johns Hopkins Aramco Healthcare',
  'American University of Beirut Medical Center',
  "King's College Hospital Dubai",
  'Healthpoint Abu Dhabi',
  'Bumrungrad International',
  'HMC Qatar',
];

const steps = [
  {
    num: '01',
    title: 'Free Consultation',
    desc: 'A 30-minute call with a dedicated advisor who reviews your qualifications and maps the exact licensing pathway for your target country.',
    icon: CalendarBlank,
  },
  {
    num: '02',
    title: 'Sign Your Engagement',
    desc: 'A formal engagement letter defining exactly what we will do, what it costs, and what is outside our control — in writing, before any payment.',
    icon: FileText,
  },
  {
    num: '03',
    title: 'Document & Exam Prep',
    desc: 'Your consultant handles every regulatory submission while your Academy study plan runs in parallel. You focus on passing — we own the paperwork.',
    icon: Brain,
  },
  {
    num: '04',
    title: 'Placement & Deployment',
    desc: 'We connect you to verified employers, manage the offer process, and remain your point of contact after you land.',
    icon: Target,
  },
];

const services = [
  {
    icon: Globe,
    title: 'Global Placement',
    badge: 'Most Popular',
    desc: 'Full-service licensing and deployment to UAE, UK, US, Ireland, and beyond. DataFlow, DHA, MOH, NMC, NCLEX — we handle the paperwork.',
    features: ['DataFlow · DHA · MOH · DOH', 'UK NMC Registration', 'US NCLEX / CGFNS', 'Ireland NMBI'],
    href: '/services/global-placement',
  },
  {
    icon: GraduationCap,
    title: 'Academy & Exam Prep',
    badge: 'AI-Powered',
    desc: 'Virtual classes, question banks, and AI study plans for NCLEX, DHA, HAAD, CBT, and DA. Available in English and French.',
    features: ['Live virtual classes', 'AI study assistant', 'Question bank 5,000+', 'CPD programs'],
    href: '/academy',
  },
  {
    icon: Stethoscope,
    title: 'Student Support',
    badge: 'New',
    desc: 'Internship placement locally and abroad, study-abroad guidance, and university application assistance for healthcare students.',
    features: ['Local & international internships', 'Study-abroad guidance', 'University applications', 'Visa support'],
    href: '/services/student-support',
  },
];

const destinations = [
  { code: 'UAE', country: 'United Arab Emirates', bodies: 'DHA · MOH · DOH · HAAD', timeline: '3–5 months', href: '/services/uae', placed: '800+', salary: 'AED 9,500–18,000 / mo', featured: true },
  { code: 'UK', country: 'United Kingdom', bodies: 'NMC · GMC · HCPC', timeline: '6–9 months', href: '/services/uk', placed: '450+', salary: 'NHS Band 5–7' },
  { code: 'US', country: 'United States', bodies: 'NCLEX · CGFNS · ECFMG', timeline: '6–12 months', href: '/services/us', placed: '200+', salary: 'USD 70k–95k / yr' },
  { code: 'IE', country: 'Ireland', bodies: 'NMBI · IMC · CORU', timeline: '5–8 months', href: '/services/ireland', placed: '280+', salary: '€36k–55k / yr' },
  { code: 'CA', country: 'Canada', bodies: 'NCLEX-RN · NNAS', timeline: '8–14 months', href: '/services/canada', placed: '80+', salary: 'CAD 68k–88k / yr' },
  { code: 'AU', country: 'Australia', bodies: 'AHPRA · AMC', timeline: '9–15 months', href: '/services/australia', placed: '60+', salary: 'AUD 72k–95k / yr' },
];

const comparison = [
  { point: 'Pathway mapped before you study', mjn: true },
  { point: 'Named consultant from day one', mjn: true },
  { point: 'Every document reviewed pre-submission', mjn: true },
  { point: 'Deadline calendar tracked for you', mjn: true },
  { point: 'Full itemised pricing locked upfront', mjn: true },
  { point: 'Engagement letter with legal scope', mjn: true },
];

const successStories = [
  {
    initial: 'CC', image: '/constanceche.webp', name: 'Constance Che A.',
    role: 'Registered Nurse · Cameroon', destination: 'Dubai, UAE',
    licensingBody: 'DHA — Approved', timeline: '4 months',
    quote: 'My process began in Cameroon. Once DataFlow was ready I travelled to Dubai, sat the exam the second week, and passed first attempt.',
  },
  {
    initial: 'EA', image: '/jeffreyasiedu.webp', name: 'Effery Asiedu',
    role: 'Registered Nurse · Ghana', destination: 'UAE & United States',
    licensingBody: 'DOH + NCLEX — Passed', timeline: 'End-to-end',
    quote: 'MJN guided me to my UAE licence, then mentored me through every step of NCLEX. I passed both. An absolute pleasure to work with.',
  },
  {
    initial: 'SD', image: '/sarahdanso.webp', name: 'Sarah Danso',
    role: 'Staff Nurse · Ghana', destination: 'Dubai, UAE',
    licensingBody: 'DHA — Licensed', timeline: 'Full documentation',
    quote: 'MJN has been the best link to me — contributing to my successful documentation and the assurance of arriving at my desired destination.',
  },
  {
    initial: 'AP', image: '/atangchpascaline.webp', name: 'Atangch Pascaline S.',
    role: 'Registered Nurse · Cameroon', destination: 'United States',
    licensingBody: 'NCLEX Eligibility — Approved', timeline: 'Multiple rejections overturned',
    quote: 'My eligibility letter was returned twice and rejected. When MJN submitted it, it was approved in no time. MJN, you have all my highest recommendations.',
  },
  {
    initial: 'R', image: '/richard.webp', name: 'Richard',
    role: 'Staff Nurse · Ghana', destination: 'Dubai, UAE',
    licensingBody: 'DHA — Licensed', timeline: 'Under 2 months',
    quote: 'Despite the difficulty they stood by me from the beginning till I had my licence in less than two months.',
  },
];

const HERO_PHRASES = ['in the UAE.', 'in the UK.', 'in the US.', 'in Ireland.'];

// ─── PAGE ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [phraseIdx, setPhraseIdx] = React.useState(0);
  const [phraseVisible, setPhraseVisible] = React.useState(true);

  React.useEffect(() => {
    const id = setInterval(() => {
      setPhraseVisible(false);
      setTimeout(() => { setPhraseIdx((i) => (i + 1) % HERO_PHRASES.length); setPhraseVisible(true); }, 320);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  const [storyIdx, setStoryIdx] = React.useState(0);
  const [storyVisible, setStoryVisible] = React.useState(true);

  function goToStory(i: number) {
    setStoryVisible(false);
    setTimeout(() => { setStoryIdx(i); setStoryVisible(true); }, 320);
  }

  React.useEffect(() => {
    const id = setInterval(() => {
      setStoryVisible(false);
      setTimeout(() => { setStoryIdx((i) => (i + 1) % successStories.length); setStoryVisible(true); }, 320);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  const story = successStories[storyIdx];

  // Scroll-driven services carousel (mobile only)
  const servicesSectionRef = React.useRef<HTMLDivElement>(null);
  const servicesStripRef = React.useRef<HTMLDivElement>(null);
  const [activeService, setActiveService] = React.useState(0);

  React.useEffect(() => {
    function onScroll() {
      if (window.innerWidth >= 1024) return;
      const section = servicesSectionRef.current;
      const strip = servicesStripRef.current;
      if (!section || !strip) return;
      const scrollIn = Math.max(0, window.scrollY - section.offsetTop);
      const vh = window.innerHeight;
      const rawProgress = scrollIn / vh;
      const clamped = Math.min(rawProgress, services.length - 1);
      strip.style.transform = `translateX(-${clamped * 100}vw)`;
      setActiveService(Math.max(0, Math.min(Math.floor(rawProgress), services.length - 1)));
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <MarketingNav />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/hero-nurse.jpg')", minHeight: '100svh' }}
      >
        <div className="relative mx-auto flex w-full max-w-6xl items-center justify-start px-6 py-28" style={{ minHeight: '100svh' }}>
          <div className="flex w-full max-w-[538px] flex-col gap-5 rounded-3xl bg-[#0F4C81]/80 p-8 backdrop-blur-md ring-1 ring-white/10 shadow-2xl text-white">

            {/* Live placement pill */}
            {recentPlacements.map((p) => (
              <div key={p.name} className="flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white ring-1 ring-white/20">
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" />
                <span className="font-medium">{p.name}</span>
                <span className="text-blue-200">{p.role} → {p.dest}</span>
              </div>
            ))}

            {/* Headline */}
            <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl md:text-5xl">
              <span className="block">We Get You Licensed.</span>
              <span className="block">We Get You Placed —</span>
              <span
                className="relative inline-block text-[#7dd3fc]"
                style={{
                  opacity: phraseVisible ? 1 : 0,
                  transform: phraseVisible ? 'translateY(0)' : 'translateY(8px)',
                  transition: 'opacity 0.32s ease, transform 0.32s ease',
                }}
              >
                {HERO_PHRASES[phraseIdx]}
                <span className="absolute inset-x-0 -bottom-1.5 h-2.5 rounded-full bg-sky-400/20 blur-sm" />
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-base text-blue-100 leading-relaxed">
              Full-service licensing support, exam preparation, and international job placement for
              nurses, physicians, and allied health professionals from Africa — handled by a dedicated
              consultant, not a portal.
            </p>

            {/* CTAs */}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button size="lg" className="rounded-xl bg-white px-7 text-primary shadow-lg shadow-black/25 hover:bg-white/90 hover:-translate-y-px transition-all" asChild>
                <Link href="/get-started">Book Free Consultation <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="ghost" className="rounded-xl text-blue-200 hover:text-white hover:bg-white/10 px-5" asChild>
                <a href="#how-it-works">See How It Works ↓</a>
              </Button>
            </div>

            {/* Stats row */}
            <div className="flex divide-x divide-white/20 border-t border-white/10 pt-5 text-center">
              {[
                { value: '1,800+', label: 'Placed' },
                { value: '91%', label: 'Pass Rate' },
                { value: '12', label: 'Countries' },
              ].map(({ value, label }) => (
                <div key={label} className="flex-1 px-3 first:pl-0 last:pr-0">
                  <p className="text-xl font-extrabold text-white">{value}</p>
                  <p className="text-xs text-blue-200">{label}</p>
                </div>
              ))}
            </div>

            {/* Compact rotating success story */}
            <div
              className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10"
              style={{ opacity: storyVisible ? 1 : 0, transform: storyVisible ? 'translateY(0)' : 'translateY(10px)', transition: 'opacity 0.32s ease, transform 0.32s ease' }}
            >
              <div className="flex items-start gap-3">
                {(story as any).image ? (
                  <Image src={(story as any).image} alt={story.name} width={44} height={44} className="h-11 w-11 shrink-0 rounded-xl object-cover ring-2 ring-white/30" />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/40 text-base font-bold text-white ring-2 ring-white/30 select-none">
                    {story.initial}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white">{story.name}</p>
                  <p className="text-xs text-blue-200">{story.role}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {story.destination}
                    </span>
                    <span className="text-xs text-blue-200/60">{story.timeline}</span>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-blue-100 leading-relaxed italic">"{story.quote}"</p>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {successStories.map((_, i) => (
                    <button key={i} onClick={() => goToStory(i)} aria-label={`Story ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === storyIdx ? 'w-5 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/50'}`} />
                  ))}
                </div>
                <Link href="/success-stories" className="flex items-center gap-1 text-xs text-blue-200 transition-colors hover:text-white">
                  All stories <CaretRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* Destination chips — bottom-right of photo */}
        <div className="absolute bottom-6 right-6 hidden flex-wrap items-center gap-2 lg:flex">
          {[
            { flag: '🇦🇪', label: 'UAE' },
            { flag: '🇬🇧', label: 'UK' },
            { flag: '🇺🇸', label: 'US' },
            { flag: '🇮🇪', label: 'Ireland' },
            { flag: '🇨🇦', label: 'Canada' },
            { flag: '🇦🇺', label: 'Australia' },
          ].map(({ flag, label }) => (
            <span key={label} className="flex items-center gap-1.5 rounded-full bg-[#0F4C81]/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm ring-1 ring-white/20">
              {flag} {label}
            </span>
          ))}
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-white px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { value: '2,400+', label: 'Professionals Placed', sub: 'across 12 countries' },
              { value: '94%', label: 'Exam Pass Rate', sub: 'first attempt, 2025' },
              { value: '98%', label: 'DataFlow Success', sub: 'pre-submission review' },
              { value: '4.9 / 5', label: 'Client Rating', sub: 'verified engagements' },
            ].map(({ value, label, sub }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-extrabold text-primary md:text-4xl">{value}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTNER MARQUEE ──────────────────────────────────────────────────── */}
      <section className="overflow-hidden border-b border-border bg-background py-7">
        <p className="mb-5 text-center text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/60">
          Professionals placed at leading institutions
        </p>
        <style>{`
          @keyframes marquee-left  { from { transform: translateX(0) } to { transform: translateX(-50%) } }
          .animate-marquee-left   { animation: marquee-left 32s linear infinite }
          .animate-marquee-left:hover { animation-play-state: paused }
        `}</style>
        <div className="flex w-max animate-marquee-left items-center gap-0">
          {[...partners, ...partners].map((p, i) => (
            <span
              key={i}
              className="mx-8 whitespace-nowrap text-sm font-semibold text-foreground/30 transition-colors duration-200 hover:text-foreground/70"
            >
              {p}
            </span>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-primary">How It Works</p>
            <h2 className="text-3xl font-bold sm:text-4xl">Four Steps from Consultation to Deployment</h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              Every engagement follows the same structured process — no guesswork, no hidden steps.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {steps.map(({ num, title, desc, icon: Icon }, idx) => (
              <div key={num} className="relative flex flex-col px-6 pb-8 lg:pb-0">
                {/* connector line between steps */}
                {idx < steps.length - 1 && (
                  <div className="absolute hidden lg:block top-7 left-[calc(50%+28px)] right-0 h-px bg-border" />
                )}
                {/* step number badge */}
                <div className="relative z-10 mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-white shadow-sm ring-1 ring-border">
                  <Icon className="h-6 w-6 text-primary" />
                  <span className="absolute -top-2.5 -right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                    {num}
                  </span>
                </div>
                <h3 className="mb-2 font-bold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button asChild className="gradient-hero rounded-xl border-0">
              <Link href="/get-started">Book Your Free Consultation <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── WHAT WE DO ───────────────────────────────────────────────────────── */}
      <section id="services" className="border-t border-border">

        {/* Mobile: scroll-driven sticky carousel */}
        <div ref={servicesSectionRef} className="lg:hidden bg-muted/25" style={{ height: `${services.length * 100}vh` }}>
          <div className="sticky top-0 h-screen overflow-hidden flex flex-col bg-muted/25">
            <div className="shrink-0 pt-14 pb-4 px-6 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">What We Do</p>
              <h2 className="text-2xl font-bold">Three Ways We Work With You</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Every service starts with a dedicated consultant — not a portal ticket.</p>
            </div>
            <p className="shrink-0 text-center text-[11px] text-muted-foreground/50 mb-3">Scroll to explore ↓</p>
            <div className="flex-1 overflow-hidden px-5 min-h-0">
              <div ref={servicesStripRef} className="flex h-full" style={{ width: `${services.length * 100}vw` }}>
                {services.map(({ icon: Icon, title, badge, desc, features, href }) => (
                  <div key={title} className="flex h-full pb-3" style={{ width: '100vw', paddingRight: '1.25rem' }}>
                    <div className="group flex flex-col flex-1 overflow-y-auto rounded-2xl border border-border bg-white p-6 shadow-sm">
                      <div className="mb-5 flex items-start justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <span className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-[11px] font-semibold text-foreground/60">{badge}</span>
                      </div>
                      <h3 className="mb-2 text-lg font-bold text-foreground">{title}</h3>
                      <p className="mb-5 flex-1 text-sm text-muted-foreground leading-relaxed">{desc}</p>
                      <ul className="space-y-2 border-t border-border pt-4">
                        {features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-3.5 w-3.5 shrink-0 text-primary" weight="fill" />
                            <span className="text-foreground/75">{f}</span>
                          </li>
                        ))}
                      </ul>
                      <Link href={href} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                        Learn more <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="shrink-0 flex items-center justify-center gap-2 py-4">
              {services.map((s, i) => (
                <div key={s.title} className={`h-1.5 rounded-full transition-all duration-300 ${i === activeService ? 'w-6 bg-primary' : 'w-1.5 bg-border'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Desktop: 3-column grid */}
        <div className="hidden lg:block bg-muted/25 px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-primary">What We Do</p>
              <h2 className="text-3xl font-bold sm:text-4xl">Three Ways We Work With You</h2>
              <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                Every service starts with a dedicated consultant assigned to your case — not a portal ticket.
              </p>
            </div>
            <div className="grid gap-5 grid-cols-3">
              {services.map(({ icon: Icon, title, badge, desc, features, href }) => (
                <div key={title} className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-white p-7 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30">
                  <div className="mb-5 flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 transition-colors group-hover:bg-primary/14">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-[11px] font-semibold text-foreground/60">{badge}</span>
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-foreground">{title}</h3>
                  <p className="mb-5 flex-1 text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  <ul className="space-y-2 border-t border-border pt-4">
                    {features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3.5 w-3.5 shrink-0 text-primary" weight="fill" />
                        <span className="text-foreground/75">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={href} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary transition-all hover:gap-2">
                    Learn more <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── GLOBAL DESTINATIONS ──────────────────────────────────────────────── */}
      <section id="destinations" className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-primary">Where We Place You</p>
            <h2 className="text-3xl font-bold sm:text-4xl">Global Destinations</h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              We manage the full licensing process for each country — regulatory bodies, document verification, and employer connection.
            </p>
          </div>

          {/* UAE featured card */}
          {(() => {
            const uae = destinations.find((d) => d.featured)!;
            return (
              <Link href={uae.href} className="group mb-5 flex flex-col overflow-hidden rounded-2xl border border-primary/20 bg-primary/4 p-7 transition-all hover:border-primary/40 hover:shadow-md sm:flex-row sm:items-center sm:gap-8">
                <div className="mb-4 sm:mb-0 sm:shrink-0">
                  <div className="inline-flex items-center justify-center rounded-xl border border-primary/20 bg-white px-4 py-2.5 shadow-sm">
                    <span className="text-2xl font-black tracking-tight text-primary">{uae.code}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-bold text-foreground text-lg">{uae.country}</p>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">Most Active</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{uae.bodies}</p>
                </div>
                <div className="mt-4 sm:mt-0 flex flex-wrap gap-6 sm:shrink-0">
                  {[{ label: 'Timeline', val: uae.timeline }, { label: 'Placed', val: uae.placed }, { label: 'Salary range', val: uae.salary }].map(({ label, val }) => (
                    <div key={label}>
                      <p className="text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                      <p className="text-sm font-bold text-foreground">{val}</p>
                    </div>
                  ))}
                </div>
                <CaretRight className="ml-4 hidden h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary sm:block" />
              </Link>
            );
          })()}

          {/* Rest */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {destinations.filter((d) => !d.featured).map(({ code, country, bodies, timeline, href, placed, salary }) => (
              <Link key={code} href={href} className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center justify-center rounded-lg border border-border bg-muted/40 px-3 py-1.5">
                    <span className="text-base font-black tracking-tight text-foreground">{code}</span>
                  </div>
                  <CaretRight className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
                <p className="font-semibold text-foreground text-sm">{country}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{bodies}</p>
                <div className="mt-4 space-y-1.5 border-t border-border pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Timeline</span>
                    <span className="text-[11px] font-semibold text-foreground">{timeline}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Placed</span>
                    <span className="text-[11px] font-semibold text-foreground">{placed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] text-muted-foreground flex items-center gap-1"><TrendUp className="h-3 w-3" /> Salary</span>
                    <span className="text-[11px] font-semibold text-foreground">{salary}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-muted/25 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-primary">Success Stories</p>
            <h2 className="text-3xl font-bold sm:text-4xl">Professionals Who Made the Move</h2>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              Real stories from nurses, doctors, and allied health professionals we have placed globally.
            </p>
          </div>
        </div>
        <TestimonialCarousel />
        <div className="mt-8 text-center">
          <Link href="/success-stories" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            Read all 1,200+ stories <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── WHY CHOOSE MJN ───────────────────────────────────────────────────── */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-start gap-14 lg:grid-cols-2">

            {/* Left: narrative + checklist */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-primary">Why MJN</p>
              <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
                The Difference Between Knowing the Rules and Knowing the System
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Most licensing failures are not about clinical competence. They are about wrong pathways,
                avoidable document rejections, missed windows, and agencies that disappear after the first payment.
              </p>

              {/* With MJN / Without table */}
              <div className="mt-8 overflow-hidden rounded-2xl border border-border">
                <div className="grid grid-cols-2 border-b border-border">
                  <div className="px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground bg-muted/30">Without MJN</div>
                  <div className="px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-primary bg-primary/5 border-l border-border">With MJN</div>
                </div>
                {comparison.map(({ point }) => (
                  <div key={point} className="grid grid-cols-2 border-b border-border last:border-0">
                    <div className="flex items-start gap-2.5 px-4 py-3">
                      <XIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground/25" weight="bold" />
                      <span className="text-xs text-muted-foreground line-through decoration-foreground/20">{point}</span>
                    </div>
                    <div className="flex items-start gap-2.5 border-l border-border bg-primary/3 px-4 py-3">
                      <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" weight="fill" />
                      <span className="text-xs font-medium text-foreground">{point}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Button asChild className="gradient-hero rounded-xl border-0">
                  <Link href="/get-started">Book Free Consultation <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            </div>

            {/* Right: common failure points */}
            <div>
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Common reasons applications fail — and how we prevent each one
              </p>
              <div className="space-y-3">
                {[
                  { icon: Target, title: 'Wrong exam pathway chosen', consequence: 'Studying NCLEX when your target employer requires DHA — months of wasted prep and full retake fees.', fix: 'We map your exact pathway before you open a textbook.' },
                  { icon: FileText, title: 'DataFlow / document rejection', consequence: 'A name mismatch or unsupported translation stalls your DataFlow by 3–6 months.', fix: 'We review every document before it leaves your hands.' },
                  { icon: CalendarBlank, title: 'Missed eligibility windows', consequence: 'NCLEX ATT codes expire in 90 days. Miss the window and you restart from scratch.', fix: 'We own your deadline calendar — not you.' },
                  { icon: Warning, title: 'Unverified agency, no recourse', consequence: 'You paid an agency that disappeared after receiving your money.', fix: 'Signed engagement letter and itemised scope before any payment.' },
                  { icon: Money, title: 'Hidden fees mid-process', consequence: 'You were quoted one amount, then invoiced three more "admin fees."', fix: 'Full itemised pricing locked in your engagement letter from day one.' },
                ].map(({ icon: Icon, title, consequence, fix }) => (
                  <div key={title} className="rounded-xl border border-border bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                        <Icon className="h-4 w-4 text-foreground/50" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground">{title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{consequence}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2">
                      <SealCheck className="h-3.5 w-3.5 shrink-0 text-primary" weight="fill" />
                      <p className="text-xs font-medium text-primary">{fix}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ACADEMY ──────────────────────────────────────────────────────────── */}
      <section id="academy" className="border-t border-border bg-muted/25 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-primary">Academy & Exam Prep</p>
              <h2 className="text-3xl font-bold sm:text-4xl">Prepare for Every Licensing Exam — in English or French</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Live virtual classes, 5,000+ practice questions, and an AI study assistant powered by Claude.
                Your personalised study plan adapts as you practice — flagging weak areas before they become exam failures.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  { icon: Brain, text: 'AI Study Assistant — chat-based tutor in English or French' },
                  { icon: Lightning, text: "Weak-area detection — flags topics where you're consistently low" },
                  { icon: Users, text: 'Live classes — small cohorts, real instructors, Daily.co powered' },
                  { icon: BookOpen, text: '5,000+ questions updated to 2026 exam blueprints' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/8">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm text-foreground/80">{text}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="gradient-hero rounded-xl border-0">
                  <Link href="/academy">Browse Academy <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button variant="outline" asChild className="rounded-xl">
                  <Link href="/academy/ai-tutor">Try AI Tutor</Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              {[
                { code: 'NCLEX', body: 'US Nursing Board', dest: 'United States', rate: '94%' },
                { code: 'DHA', body: 'Dubai Health Authority', dest: 'UAE', rate: '91%' },
                { code: 'HAAD / DOH', body: 'Abu Dhabi', dest: 'UAE', rate: '89%' },
                { code: 'NMC CBT', body: 'UK Nursing Council', dest: 'United Kingdom', rate: '96%' },
                { code: 'NMBI', body: 'Ireland Nursing Board', dest: 'Ireland', rate: '92%' },
                { code: 'DA Exam', body: 'Dental Authority UAE', dest: 'UAE', rate: '88%' },
              ].map(({ code, body, dest, rate }) => (
                <div key={code} className="group rounded-xl border border-border bg-white p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{dest}</span>
                    <span className="text-xs font-bold text-primary">{rate}</span>
                  </div>
                  <p className="font-bold text-foreground text-sm">{code}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
                </div>
              ))}
              <div className="gradient-hero col-span-2 rounded-xl p-4 text-white sm:col-span-3 lg:col-span-2 xl:col-span-3">
                <div className="flex items-center gap-2 mb-1">
                  <Lightning className="h-4 w-4 text-white/70" />
                  <span className="text-xs font-semibold text-white/70">AI-Powered</span>
                </div>
                <p className="font-bold text-sm">Personalised Study Assistant</p>
                <p className="mt-0.5 text-xs text-white/65 leading-relaxed">
                  Explains question rationale, adapts your study plan, and flags weak areas. Available in EN & FR.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── RESOURCES ────────────────────────────────────────────────────────── */}
      <section id="resources" className="border-t border-border bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-primary">Resources</p>
            <h2 className="text-3xl font-bold sm:text-4xl">Free Tools, Guides & Learning</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Everything you need to prepare — before you even sign an engagement.
            </p>
          </div>
          <ResourcesTabs />
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-muted/25 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-primary">FAQ</p>
            <h2 className="text-3xl font-bold sm:text-4xl">Common Questions</h2>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              Honest answers — including the things most agencies will not tell you upfront.
            </p>
          </div>
          <FAQAccordion />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Still have questions?{' '}
            <Link href="/get-started" className="font-medium text-primary hover:underline">Book a free consultation</Link>
            {' '}— no commitment required.
          </p>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-white px-6 pb-20 pt-16">
        <div className="mx-auto max-w-4xl">
          <div className="gradient-hero relative overflow-hidden rounded-2xl px-8 py-12 text-center text-white shadow-xl shadow-primary/20">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
              <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5 blur-2xl" />
            </div>
            <div className="relative">
              <h2 className="text-3xl font-bold sm:text-4xl">Ready to Start?</h2>
              <p className="mx-auto mt-3 max-w-md text-white/70">
                Book a free consultation with one of our advisors today. No commitment required.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button size="lg" className="rounded-xl bg-white px-8 text-primary hover:bg-white/90 shadow-md" asChild>
                  <Link href="/get-started">Book Free Consultation</Link>
                </Button>
                <Button size="lg" variant="ghost" className="rounded-xl text-white hover:bg-white/10 border border-white/20" asChild>
                  <Link href="/academy">Browse Academy →</Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-white/50">
                <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> No commitment</span>
                <span className="flex items-center gap-1.5"><Heartbeat className="h-3.5 w-3.5" /> EN & FR supported</span>
                <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> 12 countries</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />

      {/* WhatsApp float — offset above SupportBot */}
      <a
        href="https://wa.me/971508638660?text=Hello%2C%20I%27d%20like%20to%20learn%20more%20about%20MJN%20Health%20services"
        target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp"
        className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30 transition-all hover:scale-110 hover:shadow-xl hover:shadow-emerald-500/40"
      >
        <ChatCircle className="h-6 w-6 fill-white text-white" />
      </a>
    </>
  );
}
