'use client';

import Link from 'next/link';
import { MarketingNav } from '../../components/marketing-nav';
import { SiteFooter } from '../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import {
  ArrowRight, CheckCircle, Globe, Target, Handshake,
  Scales, Translate, MapPin, Users, GraduationCap,
  Medal, ClockCounterClockwise, ShieldCheck,
  ArrowUpRight, Quotes, Star, SealCheck,
  Stethoscope, BookOpen, Certificate, AirplaneTakeoff,
  Hospital, ChalkboardTeacher, Camera,
} from '@phosphor-icons/react';

// ── Photo strip data ──────────────────────────────────────────────────────────

const photoStripRow1 = [
  { label: 'DHA Exam Prep Session', sub: 'Dubai · 2025', icon: Stethoscope, gradient: 'from-[#0F4C81] to-[#0a3560]' },
  { label: 'Academy Live Class', sub: 'Yaoundé · 2025', icon: ChalkboardTeacher, gradient: 'from-[#00A896] to-[#006e62]' },
  { label: 'Client Placement Ceremony', sub: 'London · 2024', icon: Certificate, gradient: 'from-[#0F4C81] to-[#00A896]' },
  { label: 'NCLEX Study Group', sub: 'Online · 2025', icon: BookOpen, gradient: 'from-[#0a3560] to-[#0F4C81]' },
  { label: 'UAE Licensing Workshop', sub: 'Dubai · 2024', icon: Hospital, gradient: 'from-[#00A896] to-[#0F4C81]' },
  { label: 'Pre-Departure Briefing', sub: 'Yaoundé · 2025', icon: AirplaneTakeoff, gradient: 'from-[#0F4C81] to-[#005f54]' },
  { label: 'Team Meeting — Q2', sub: 'Yaoundé · 2025', icon: Users, gradient: 'from-[#0a3560] to-[#00A896]' },
  { label: 'Partner Hospital Visit', sub: 'Dublin · 2024', icon: Handshake, gradient: 'from-[#00A896] to-[#007a6e]' },
];

const photoStripRow2 = [
  { label: 'NMC CBT Prep Cohort', sub: 'Online · 2025', icon: BookOpen, gradient: 'from-[#0F4C81] to-[#00A896]' },
  { label: 'Ireland NMBI Workshop', sub: 'Dublin · 2024', icon: Globe, gradient: 'from-[#006e62] to-[#0F4C81]' },
  { label: 'Scholarship Ceremony', sub: 'Douala · 2025', icon: GraduationCap, gradient: 'from-[#00A896] to-[#0a3560]' },
  { label: 'DataFlow Document Review', sub: 'Dubai · 2025', icon: Certificate, gradient: 'from-[#0a3560] to-[#005f54]' },
  { label: 'Founder Keynote', sub: 'Yaoundé · 2024', icon: ChalkboardTeacher, gradient: 'from-[#0F4C81] to-[#0a3560]' },
  { label: 'Student Internship Cohort', sub: 'Lagos · 2025', icon: Users, gradient: 'from-[#007a6e] to-[#0F4C81]' },
  { label: 'Healthcare Conference', sub: 'Abuja · 2024', icon: Hospital, gradient: 'from-[#00A896] to-[#0F4C81]' },
  { label: 'Behind the Scenes', sub: 'MJN HQ · 2025', icon: Camera, gradient: 'from-[#0a3560] to-[#00A896]' },
];

// ── Photo strip component ─────────────────────────────────────────────────────

type PhotoCard = typeof photoStripRow1[0];

function PhotoCard({ card }: { card: PhotoCard }) {
  const Icon = card.icon;
  return (
    <div className={`relative flex-shrink-0 w-52 h-36 rounded-2xl overflow-hidden bg-gradient-to-br ${card.gradient} shadow-md`}>
      {/* decorative circle */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -left-4 -bottom-4 h-16 w-16 rounded-full bg-white/10" />
      {/* icon */}
      <div className="absolute top-4 left-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
        <Icon className="h-4.5 w-4.5 text-white" />
      </div>
      {/* label */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
        <p className="text-xs font-bold text-white leading-tight">{card.label}</p>
        <p className="text-xs text-white/70 mt-0.5">{card.sub}</p>
      </div>
    </div>
  );
}

function PhotoStrip({ cards, reverse = false }: { cards: PhotoCard[]; reverse?: boolean }) {
  // duplicate cards to fill the loop seamlessly
  const doubled = [...cards, ...cards];
  return (
    <div className="overflow-hidden">
      <div
        className={`flex gap-4 w-max ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'}`}
        style={{ willChange: 'transform' }}
      >
        {doubled.map((card, i) => (
          <PhotoCard key={i} card={card} />
        ))}
      </div>
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────

const stats = [
  { value: '350+', label: 'Professionals placed', icon: Users, color: 'text-primary bg-primary/10' },
  { value: '6', label: 'Countries active', icon: Globe, color: 'text-secondary bg-secondary/10' },
  { value: '94%', label: 'First-attempt pass rate', icon: Medal, color: 'text-primary bg-primary/10' },
  { value: '9 yrs', label: 'In operation', icon: ClockCounterClockwise, color: 'text-secondary bg-secondary/10' },
];

const values = [
  {
    icon: Target,
    title: 'Honest Over Optimistic',
    desc: 'We tell clients what is realistic — including when a pathway is unlikely to succeed. Generic optimism is easy to sell; honest assessment is what actually helps.',
    color: 'text-primary bg-primary/10',
  },
  {
    icon: Handshake,
    title: 'Partnership, Not Transaction',
    desc: 'Every engagement is a long-term relationship. We stay involved from first consultation through post-placement check-ins because a placed professional matters more to us than a closed deal.',
    color: 'text-secondary bg-secondary/10',
  },
  {
    icon: Globe,
    title: 'Africa-First Perspective',
    desc: 'Our team has personal experience navigating licensing systems as internationally educated professionals from Africa. We do not advise from the outside.',
    color: 'text-primary bg-primary/10',
  },
  {
    icon: ShieldCheck,
    title: 'Process Discipline',
    desc: 'Healthcare licensing is a regulated domain. Errors in submissions cost clients months and money. We are methodical, thorough, and leave nothing to chance in documentation.',
    color: 'text-secondary bg-secondary/10',
  },
  {
    icon: Scales,
    title: 'Compliance Without Compromise',
    desc: 'We never advise shortcuts, credential misrepresentation, or workarounds. Our reputation and our clients\' licences are both on the line with every submission.',
    color: 'text-primary bg-primary/10',
  },
  {
    icon: Translate,
    title: 'Bilingual by Design',
    desc: 'French and English — both fully supported, not as an afterthought. Our African client base spans both language communities and deserves equally excellent service in both.',
    color: 'text-secondary bg-secondary/10',
  },
];

const differentiators = [
  {
    heading: 'Advisors who have done it themselves',
    body: 'Every consultant on our team has personally completed the licensing process they advise on — as an internationally educated professional from Africa. Most consulting firms do not have this. Most online resources do not either.',
  },
  {
    heading: 'Document pre-review before every submission',
    body: 'One rejected DataFlow or CGFNS application costs 8–12 weeks and fees that are non-refundable. We review every document set before submission. This is not optional — it is part of every engagement.',
  },
  {
    heading: 'Signed engagement letter — no surprises',
    body: 'We issue a formal scope-of-work before any payment. It states exactly what is included, what we do on your behalf, and — critically — what we cannot guarantee (exam outcomes, visa decisions, job offers). No agency should promise those things.',
  },
  {
    heading: 'End-to-end, not handoff',
    body: 'We do not hand you a checklist and disappear. Your assigned consultant manages the full pipeline — document collection, authority submissions, employer introductions, and post-placement check-ins. One point of contact throughout.',
  },
];

const timeline = [
  { year: '2016', event: 'MJN Healthcare founded in the United Arab Emirates by Mbout John Nyah. First international placements under UAE DHA licensing.' },
  { year: '2018', event: 'Operations expanded to Cameroon. UK NMC and Ireland NMBI pathways introduced.' },
  { year: '2020', event: 'US NCLEX pathway launched. First NHS trust employer partnership established.' },
  { year: '2021', event: 'MJN Academy launched with NCLEX-RN and DHA exam preparation. Mentorship and CPD programmes introduced.' },
  { year: '2023', event: 'AI Study Assistant (Claude-powered) deployed in Academy. Student Support and internship placement added.' },
  { year: '2025', event: 'Ministerial Authorization No. M032517649867P/RC/YAO/2025/B/637 obtained. 350+ professionals placed internationally. Platform fully rebuilt.' },
];

const team = [
  {
    name: 'Mbout John Nyah (MJN)',
    initials: 'MJN',
    photo: '/nyah-ceo.png',
    role: 'Founder & Chief Executive Officer',
    credentials: 'MBA-HCM · BSN · RN',
    bio: 'Founded MJN Healthcare in 2016 in the UAE after witnessing firsthand how preventable documentation failures — not clinical incompetence — derailed qualified African healthcare professionals. MBA in Healthcare Management, BSN, and registered nurse with deep personal experience in international licensing.',
  },
  {
    name: 'Sylvie Etame',
    initials: 'SE',
    role: 'Head of Licensing Operations',
    credentials: 'RN · DHA-Licensed · NMC (UK)',
    bio: 'Registered nurse with both DHA and NMC registration. Has managed 400+ DataFlow applications and maintains direct working relationships with case officers at UAE licensing authorities.',
  },
  {
    name: 'Emmanuel Biya',
    initials: 'EB',
    role: 'Head of Academy & Education',
    credentials: 'BSN · NCLEX Coach · Curriculum Designer',
    bio: 'Former NCLEX instructor with a 96% first-attempt pass rate across personally coached students. Leads curriculum design for all MJN Academy exam preparation programmes.',
  },
  {
    name: 'Amina Ousseini',
    initials: 'AO',
    role: 'Head of Student Support',
    credentials: 'RN · NMBI (Ireland) · BA Education',
    bio: 'Completed her nursing degree in Ireland under NMBI registration. Leads student support and early-career planning with particular expertise in francophone West Africa.',
  },
];

const offices = [
  { city: 'Yaoundé', country: 'Cameroon', flag: '🇨🇲', role: 'Headquarters & Academy', detail: 'Dr. Raïssa Fombe · Emmanuel Biya' },
  { city: 'Dubai', country: 'UAE', flag: '🇦🇪', role: 'UAE Operations', detail: 'Sylvie Etame · DHA / DOH / MOH licensing' },
  { city: 'London', country: 'United Kingdom', flag: '🇬🇧', role: 'UK Placement', detail: 'Patrick Mbang · NHS employer relations' },
  { city: 'Dublin', country: 'Ireland', flag: '🇮🇪', role: 'Ireland Support', detail: 'Amina Ousseini · NMBI & Critical Skills' },
  { city: 'United States', country: 'USA', flag: '🇺🇸', role: 'CEO & Global Leadership', detail: 'Mbout John Nyah · NCLEX & US Pathway' },
];

const testimonials = [
  {
    quote: 'I had tried to navigate DataFlow on my own for six months. MJN reviewed my documents, spotted two errors immediately, and we submitted within three weeks. My DHA license came through in 11 weeks.',
    name: 'Blessing O.',
    role: 'Registered Nurse · Now practising in Dubai',
  },
  {
    quote: 'The AI study assistant in the Academy explained NCLEX clinical reasoning in a way my textbooks never did. Passed in 75 questions on first attempt.',
    name: 'Amara D.',
    role: 'NCLEX Passer · US placement in progress',
  },
  {
    quote: 'What I appreciated most was the honesty. They told me my NMBI application might require an adaptation period — and explained exactly what that meant — before I paid anything.',
    name: 'Carole F.',
    role: 'RN · Now registered in Ireland',
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <>
      <MarketingNav />

      {/* HERO ──────────────────────────────────────────────────────────────── */}
      <section className="gradient-hero relative overflow-hidden pt-28 pb-20 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl" />
          <div className="absolute top-1/2 right-1/3 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_340px] items-center">
            <div>
              <Badge className="mb-5 border border-white/20 bg-white/10 text-white backdrop-blur-sm">
                About MJN Healthcare
              </Badge>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
                Founded by Healthcare Professionals<br className="hidden md:block" /> Who Lived This Journey
              </h1>
              <p className="mt-6 max-w-xl text-lg text-blue-100 leading-relaxed">
                MJN Healthcare was built because qualified African healthcare professionals were failing regulatory processes that had nothing to do with their clinical competence — and succeeding required knowing the system from the inside.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/get-started"
                  className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-primary hover:bg-white/90 transition-colors"
                >
                  Book Free Consultation <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/success-stories"
                  className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
                >
                  Read Success Stories <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Founder card */}
            <div className="hidden lg:block">
              <div className="relative rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm shadow-2xl">
                <div className="flex items-center gap-4 mb-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/nyah-ceo.png"
                    alt="Mbout John Nyah"
                    className="h-14 w-14 rounded-2xl object-cover border border-white/20"
                  />
                  <div>
                    <p className="font-bold text-white text-sm">Mbout John Nyah (MJN)</p>
                    <p className="text-xs text-white/70">Founder & Chief Executive Officer</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 mb-4">
                  <Quotes className="h-5 w-5 text-white/40 shrink-0 mt-0.5" weight="fill" />
                  <p className="text-sm text-white/80 leading-relaxed italic">
                    "I founded MJN to remove every preventable barrier between African healthcare professionals and international practice — because I lived those barriers myself."
                  </p>
                </div>
                <div className="border-t border-white/10 pt-4 space-y-2">
                  {[
                    'MBA-HCM · Healthcare Management',
                    'BSN · Registered Nurse (RN)',
                    'Ministerial Authorization No. M032517649867P',
                  ].map((c) => (
                    <div key={c} className="flex items-center gap-2 text-xs text-white/60">
                      <SealCheck className="h-3.5 w-3.5 text-secondary shrink-0" />
                      {c}
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/10 p-3 text-center">
                    <p className="text-xl font-extrabold text-white">2016</p>
                    <p className="text-xs text-white/60">Founded</p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-3 text-center">
                    <p className="text-xl font-extrabold text-white">350+</p>
                    <p className="text-xs text-white/60">Placed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS ─────────────────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-white px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map(({ value, label, icon: Icon, color }) => (
              <div key={label} className="rounded-2xl border border-border bg-white p-5 shadow-sm text-center hover:shadow-md transition-shadow">
                <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-3xl font-extrabold text-foreground">{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PHOTO STRIP ──────────────────────────────────────────────────────── */}
      <section className="py-10 border-b border-border bg-muted/20 photo-strip-wrap overflow-hidden">
        <div className="mb-2 px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center">
            Team, events & placements
          </p>
        </div>
        <div className="space-y-4 mt-5">
          <PhotoStrip cards={photoStripRow1} reverse={false} />
          <PhotoStrip cards={photoStripRow2} reverse={true} />
        </div>
        <p className="text-center text-xs text-muted-foreground mt-5 px-6">
          Hover to pause &nbsp;·&nbsp; Real photos coming soon as we update our gallery
        </p>
      </section>

      {/* FOUNDER NARRATIVE ─────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-white px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <Badge variant="outline" className="mb-4">Founder&apos;s Story</Badge>
              <h2 className="text-3xl font-bold text-foreground leading-tight mb-6">
                Built From Personal Experience — Not From a Manual
              </h2>
              <div className="space-y-4 text-muted-foreground leading-[1.8] text-[15px]">
                <p>
                  Mbout John Nyah (MJN) — a registered nurse, BSN, and MBA in Healthcare Management — founded MJN Healthcare in the United Arab Emirates in 2016 after witnessing firsthand the preventable barriers that derail qualified African healthcare professionals seeking international practice.
                </p>
                <p>
                  With personal experience navigating international nursing licensure, he understood that the challenge was rarely clinical competence — it was the opacity of systems like DataFlow, NMC, CGFNS, and NMBI that were designed in contexts most African professionals had never encountered. Documentation errors, missed deadlines, and uninformed submissions were costing candidates months and non-refundable fees.
                </p>
                <p>
                  He returned with one mission: remove every preventable barrier between African healthcare professionals and international practice — and build a firm where every consultant has personally completed the process they advise on.
                </p>
                <p className="font-semibold text-foreground">
                  Today, MJN Healthcare holds Ministerial Authorization No. M032517649867P/RC/YAO/2025/B/637, has placed over 350 professionals internationally, and operates across UAE, UK, US, Ireland, and Cameroon.
                </p>
              </div>
            </div>

            {/* Right: mission statement + key points */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
                <div className="flex items-start gap-3 mb-4">
                  <Quotes className="h-6 w-6 text-primary/40 shrink-0 mt-0.5" weight="fill" />
                  <p className="text-base font-semibold text-foreground leading-relaxed">
                    Remove every preventable barrier between African healthcare professionals and international practice.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Africa produces hundreds of thousands of qualified nurses, physicians, and allied health professionals every year. Most of them know their clinical work. Most of them do not know how to navigate DataFlow, NMC, CGFNS, or NMBI — systems designed in contexts they have never encountered. MJN exists to close that gap.
                </p>
              </div>
              {[
                'We are not a pipeline that extracts talent from Africa.',
                'We give professionals the tools to make informed, sovereign career decisions.',
                'Our success is measured in placed professionals, not closed deals.',
              ].map((point) => (
                <div key={point} className="flex items-start gap-3 rounded-xl border border-border bg-white p-4 shadow-sm">
                  <CheckCircle weight="fill" className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHY MJN ───────────────────────────────────────────────────────────── */}
      <section className="bg-muted/30 px-6 py-16 border-b border-border">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">Why MJN</Badge>
            <h2 className="text-3xl font-bold text-foreground">What Makes the Difference</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
              Licensing processes are not hard because the content is difficult. They are hard because the rules are opaque, the consequences of errors are severe, and most people go in without institutional knowledge. This is what we provide.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {differentiators.map(({ heading, body }, i) => (
              <div key={i} className="rounded-2xl border border-border bg-white p-6 shadow-sm hover:border-primary/30 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-2">{heading}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALUES ─────────────────────────────────────────────────────────────── */}
      <section className="px-6 py-16 border-b border-border">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">Values</Badge>
            <h2 className="text-3xl font-bold text-foreground">How We Work</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {values.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="group rounded-2xl border border-border bg-white p-6 shadow-sm hover:border-primary/30 hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${color} transition-transform group-hover:scale-110`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM ──────────────────────────────────────────────────────────────── */}
      <section className="bg-muted/30 px-6 py-16 border-b border-border">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <Badge variant="outline" className="mb-3">Team</Badge>
              <h2 className="text-3xl font-bold text-foreground">The People Behind Your Engagement</h2>
              <p className="mt-2 text-muted-foreground text-sm max-w-lg">
                Every member has personally navigated the licensing process they now advise on.
              </p>
            </div>
            <Link
              href="/team"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors shrink-0"
            >
              Meet the full team <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {team.map(({ name, initials, photo, role, credentials, bio }: any) => (
              <div
                key={name}
                className="group rounded-2xl border border-border bg-white p-5 shadow-sm hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className="mb-4">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt={name} className="h-12 w-12 rounded-xl object-cover border border-border" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-sm font-extrabold text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      {initials}
                    </div>
                  )}
                </div>
                <p className="font-bold text-foreground text-sm">{name}</p>
                <p className="text-xs font-semibold text-primary mt-0.5 mb-1">{role}</p>
                <p className="text-xs text-muted-foreground mb-3">{credentials}</p>
                <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">{bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE ──────────────────────────────────────────────────────────── */}
      <section className="px-6 py-16 border-b border-border">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3">History</Badge>
            <h2 className="text-3xl font-bold text-foreground">Our Story, Year by Year</h2>
          </div>
          <div className="relative">
            {/* vertical line */}
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border" />
            <div className="space-y-0">
              {timeline.map(({ year, event }, i) => (
                <div key={year} className="flex gap-6 group">
                  <div className="relative flex flex-col items-center">
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white border-2 border-primary text-xs font-extrabold text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      {year.slice(2)}
                    </div>
                  </div>
                  <div className="pb-8 pt-1.5">
                    <p className="text-xs font-bold text-primary mb-1">{year}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS ──────────────────────────────────────────────────────── */}
      <section className="bg-muted/30 px-6 py-16 border-b border-border">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">Client Voices</Badge>
            <h2 className="text-3xl font-bold text-foreground">In Their Own Words</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {testimonials.map(({ quote, name, role }) => (
              <div key={name} className="rounded-2xl border border-border bg-white p-6 shadow-sm flex flex-col gap-4">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-amber-400" weight="fill" />
                  ))}
                </div>
                <p className="flex-1 text-sm text-muted-foreground leading-relaxed italic">&ldquo;{quote}&rdquo;</p>
                <div className="border-t border-border pt-4">
                  <p className="text-sm font-bold text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{role}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/success-stories"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Read all success stories <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* OFFICES ───────────────────────────────────────────────────────────── */}
      <section className="px-6 py-14 border-b border-border">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <Badge variant="outline" className="mb-3">Locations</Badge>
            <h2 className="text-2xl font-bold text-foreground">Where We Operate</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {offices.map(({ city, country, flag, role, detail }) => (
              <div key={city} className="rounded-2xl border border-border bg-white p-5 shadow-sm hover:border-primary/20 hover:shadow-md transition-all">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-3xl">{flag}</span>
                  <div>
                    <p className="font-bold text-foreground">{city}</p>
                    <p className="text-xs text-muted-foreground">{country}</p>
                  </div>
                </div>
                <p className="text-xs font-semibold text-primary mb-2">{role}</p>
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-primary/60" />
                  <span className="leading-relaxed">{detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST / REGULATORY BODIES ─────────────────────────────────────────── */}
      <section className="bg-muted/20 px-6 py-10 border-b border-border">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
            We work with professionals targeting these regulatory bodies
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { name: 'DHA', full: 'Dubai Health Authority' },
              { name: 'DOH', full: 'Dept. of Health Abu Dhabi' },
              { name: 'MOH UAE', full: 'Ministry of Health UAE' },
              { name: 'NMC', full: 'Nursing & Midwifery Council (UK)' },
              { name: 'NCLEX', full: 'US Nursing Licensure' },
              { name: 'CGFNS', full: 'Commission on Graduates of Foreign Nursing Schools' },
              { name: 'NMBI', full: 'Nursing & Midwifery Board of Ireland' },
              { name: 'DataFlow', full: 'Primary Source Verification (UAE)' },
            ].map(({ name, full }) => (
              <div
                key={name}
                title={full}
                className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:border-primary/30 hover:text-primary transition-colors cursor-default"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DUAL CTA ──────────────────────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 sm:grid-cols-2">

            {/* Candidate CTA */}
            <div className="gradient-hero relative overflow-hidden rounded-3xl p-8 text-white shadow-xl">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
              <div className="relative">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">I am a healthcare professional</h3>
                <p className="text-blue-100 text-sm leading-relaxed mb-6">
                  Book a free 30-minute consultation. We will review your qualifications, identify the right pathway, and give you a realistic timeline and cost.
                </p>
                <Button className="bg-white text-primary hover:bg-white/90 rounded-xl font-bold" asChild>
                  <Link href="/get-started">Book Free Consultation <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            </div>

            {/* Partner CTA */}
            <div className="relative overflow-hidden rounded-3xl border-2 border-border bg-white p-8 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/5" />
              <div className="relative">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Handshake className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">I am an employer or institution</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  We place verified, licensed healthcare professionals with hospitals, clinics, and institutions. Commission-based — you only pay on successful placement.
                </p>
                <Button variant="outline" className="rounded-xl font-bold border-primary/40 text-primary hover:bg-primary hover:text-white transition-colors" asChild>
                  <Link href="/partner">Partner With Us <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* keyframes injected once */}
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-reverse {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
        .animate-marquee-reverse {
          animation: marquee-reverse 35s linear infinite;
        }
        .photo-strip-wrap:hover .animate-marquee,
        .photo-strip-wrap:hover .animate-marquee-reverse {
          animation-play-state: paused;
        }
      `}</style>

      <SiteFooter />
    </>
  );
}
