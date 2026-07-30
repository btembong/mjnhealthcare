'use client';

import Link from 'next/link';
import { MarketingNav } from '../../components/marketing-nav';
import { SiteFooter } from '../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import { ArrowRight, CheckCircle, Brain, Users, Lightning, BookOpen, CaretRight, Star, Clock } from '@phosphor-icons/react';

const courses = [
  {
    code: 'NCLEX-RN',
    flag: '🇺🇸',
    title: 'NCLEX Exam Prep',
    desc: 'Structured preparation for the Next Generation NCLEX (NGN). Covers clinical judgement, all item types (bow-tie, matrix, cloze), and 2,500+ practice questions.',
    passRate: '94%',
    passRateNum: 94,
    duration: '8–12 weeks',
    href: '/academy/nclex',
    barColor: 'bg-primary',
    badge: 'US Nursing Board',
    pricing: 'Pricing on consultation',
    highlight: 'Most popular track',
  },
  {
    code: 'NMC CBT',
    flag: '🇬🇧',
    title: 'NMC CBT Prep',
    desc: 'UK Nursing and Midwifery Council Computer-Based Test preparation. Tests nursing knowledge in UK clinical contexts — essential first step toward NMC registration.',
    passRate: '96%',
    passRateNum: 96,
    duration: '6–8 weeks',
    href: '/academy/cbt',
    barColor: 'bg-teal-500',
    badge: 'UK Nursing Council',
    pricing: 'Pricing on consultation',
    highlight: 'Highest pass rate',
  },
  {
    code: 'DHA',
    flag: '🇦🇪',
    title: 'DHA Exam Prep',
    desc: 'Dubai Health Authority Prometric exam preparation for nurses, physicians, pharmacists, and allied health professionals. Profession-specific question banks.',
    passRate: '91%',
    passRateNum: 91,
    duration: '6–10 weeks',
    href: '/academy/dha',
    barColor: 'bg-amber-500',
    badge: 'Dubai Health Authority',
    pricing: 'Pricing on consultation',
    highlight: null,
  },
  {
    code: 'HAAD / DOH',
    flag: '🇦🇪',
    title: 'HAAD / DOH Exam Prep',
    desc: 'Abu Dhabi Department of Health (formerly HAAD) Prometric exam preparation. Covers all profession categories including nurses, physicians, and dentists.',
    passRate: '89%',
    passRateNum: 89,
    duration: '6–10 weeks',
    href: '/academy/haad',
    barColor: 'bg-orange-500',
    badge: 'Abu Dhabi DOH',
    pricing: 'Pricing on consultation',
    highlight: null,
  },
];

const features = [
  {
    icon: Brain,
    title: 'AI Study Assistant',
    desc: 'Chat-based tutor powered by Claude. Explains question rationale, adapts to your weak areas, and answers exam-prep questions in English or French.',
  },
  {
    icon: Lightning,
    title: 'Weak-Area Detection',
    desc: 'Your practice performance is tracked in real time. Topics where you consistently score below threshold are surfaced in your study plan and flagged to your instructor.',
  },
  {
    icon: Users,
    title: 'Live Virtual Classes',
    desc: 'Small cohorts with real instructors via Daily.co. Scheduled sessions for each exam track — join from anywhere with a stable internet connection.',
  },
  {
    icon: BookOpen,
    title: '5,000+ Questions',
    desc: 'Question bank updated to 2026 exam blueprints. Full rationale on every question. NGN-format items for NCLEX. Timed mock exams per exam track.',
  },
];

const testimonials = [
  {
    name: 'Amara D.',
    role: 'RN · Passed NCLEX in 75 questions',
    quote: 'The AI tutor helped me understand clinical judgement in a way no textbook ever did. I studied for 10 weeks and passed first attempt.',
  },
  {
    name: 'Chidi O.',
    role: 'Physician · DHA Licensed',
    quote: 'The DHA question bank is the closest thing to the actual exam. My pass rate on practice tests went from 60% to 84% in six weeks.',
  },
  {
    name: 'Marie-Claire F.',
    role: 'Nurse · NMC CBT Passed',
    quote: 'Je parlais peu d\'anglais médical. L\'assistant IA m\'a aidée en français d\'abord, puis graduellement en anglais. C\'est une approche vraiment différente.',
  },
];

export default function AcademyPage() {
  return (
    <>
      <MarketingNav />

      {/* HERO */}
      <section className="relative overflow-hidden text-white bg-cover bg-center bg-no-repeat min-h-[520px] flex items-center" style={{ backgroundImage: "url('/examhero.jpg')" }}>
        <div className="relative mx-auto w-full max-w-6xl px-6 py-28 flex justify-end">
          <div className="w-full max-w-lg rounded-3xl bg-[#0F4C81]/80 p-8 backdrop-blur-md ring-1 ring-white/10 shadow-2xl">
            <Badge className="mb-4 border border-white/20 bg-white/10 text-white backdrop-blur-sm">
              Academy &amp; Exam Prep
            </Badge>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Pass Your Licensing Exam. First Attempt.
            </h1>
            <p className="mt-4 text-base text-blue-100 leading-relaxed">
              Structured exam prep for NCLEX, DHA, HAAD/DOH, and NMC CBT — with an AI study assistant, live classes, and 5,000+ questions. Available in English and French.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" className="rounded-xl bg-white px-7 text-primary shadow-lg hover:bg-white/90" asChild>
                <Link href="/get-started">Get Started <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20" asChild>
                <Link href="/academy/ai-tutor">Try AI Tutor Free</Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-blue-100">
              <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-teal-300" /> 94% average pass rate</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-teal-300" /> 2,400+ students trained</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-teal-300" /> EN &amp; FR supported</span>
            </div>
          </div>
        </div>
      </section>

      {/* PASS RATE BENCHMARK STRIP */}
      <section className="border-b border-border bg-white px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">MJN Academy — First-Attempt Pass Rates (2025)</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { exam: 'NMC CBT', rate: 96, flag: '🇬🇧', color: 'bg-teal-500' },
              { exam: 'NCLEX-RN', rate: 94, flag: '🇺🇸', color: 'bg-primary' },
              { exam: 'DHA', rate: 91, flag: '🇦🇪', color: 'bg-amber-500' },
              { exam: 'HAAD / DOH', rate: 89, flag: '🇦🇪', color: 'bg-orange-500' },
            ].map(({ exam, rate, flag, color }) => (
              <div key={exam} className="rounded-xl border border-border bg-muted/20 px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <span>{flag}</span> {exam}
                  </span>
                  <span className="text-lg font-extrabold text-foreground">{rate}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${rate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COURSES */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3">Exam Tracks</Badge>
            <h2 className="text-4xl font-bold">Choose Your Exam</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Each track is built specifically for that exam's format, blueprint, and pass criteria — not a generic study bank repackaged.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {courses.map(({ code, flag, title, desc, passRate, passRateNum, duration, href, barColor, badge, pricing, highlight }) => (
              <div key={code} className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-white p-8 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
                {highlight && (
                  <div className="absolute top-5 right-5">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">{highlight}</span>
                  </div>
                )}
                <div className="mb-5 flex items-start gap-3">
                  <span className="text-4xl">{flag}</span>
                  <div>
                    <Badge variant="secondary" className="mb-1.5 text-xs">{badge}</Badge>
                    <h3 className="text-xl font-bold text-foreground leading-tight">{title}</h3>
                  </div>
                </div>

                {/* Pass rate bar */}
                <div className="mb-5 rounded-xl bg-muted/40 px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">First-attempt pass rate</span>
                    <span className="text-sm font-extrabold text-foreground">{passRate}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                    <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${passRateNum}%` }} />
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">{desc}</p>

                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    <Clock className="h-3 w-3" /> {duration}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">{pricing}</span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <Link
                    href="/get-started"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
                  >
                    Enroll now <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link href={href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-all hover:text-primary hover:gap-2.5">
                    Learn more <CaretRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Live classes CTA */}
          <div className="mt-6 rounded-3xl border border-primary/20 bg-primary/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-foreground">Live Virtual Classes — Next Cohort Starting Soon</p>
              <p className="text-sm text-muted-foreground mt-1">Small-group sessions with real instructors. All exam tracks. Book your seat before it fills.</p>
            </div>
            <Button asChild className="shrink-0 rounded-xl">
              <Link href="/academy/live">View Schedule <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3">What's Included</Badge>
            <h2 className="text-4xl font-bold">Built for Internationally Educated Professionals</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Every tool in the Academy is designed around the specific challenges of preparing for a foreign licensing exam from Africa.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI TUTOR SPOTLIGHT */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="gradient-hero rounded-3xl p-6 sm:p-10 text-white overflow-hidden relative">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
            </div>
            <div className="relative grid gap-8 lg:grid-cols-2 items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold">
                  <Lightning className="h-3.5 w-3.5 text-teal-300" /> AI-Powered
                </div>
                <h2 className="text-3xl font-bold">Meet Your AI Study Assistant</h2>
                <p className="mt-3 text-blue-100 leading-relaxed">
                  Powered by Claude. Chat in English or French. Ask about any question in the bank, request a concept explanation, or ask it to generate a 10-question quiz on pharmacology. Available 24/7.
                </p>
                <ul className="mt-5 space-y-2.5">
                  {[
                    'Explains question rationale — not just the answer',
                    'Adapts study plan based on your weak areas',
                    'Answers in EN or FR depending on your preference',
                    'Flags at-risk patterns to your assigned tutor',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2 text-sm text-blue-100">
                      <CheckCircle className="h-4 w-4 text-teal-300 mt-0.5 shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 bg-white text-primary hover:bg-white/90" asChild>
                  <Link href="/academy/ai-tutor">Try It Free <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
              <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm ring-1 ring-white/20">
                <p className="text-xs text-blue-200 uppercase tracking-widest font-semibold mb-4">Sample conversation</p>
                <div className="space-y-3">
                  <div className="rounded-xl bg-white/10 px-4 py-3 text-sm text-white">
                    <span className="text-blue-200 text-xs block mb-1">You</span>
                    Why is option B wrong for the bow-tie question on potassium imbalance?
                  </div>
                  <div className="rounded-xl bg-teal-400/20 px-4 py-3 text-sm text-white">
                    <span className="text-teal-300 text-xs block mb-1">AI Tutor</span>
                    Option B describes signs of hyperkalemia, but the case presents hypokalemia (K+ 2.9). The peaked T-waves in hyperkalemia are often confused with the U-waves seen in hypokalemia. Here's the key difference...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">Student Results</Badge>
            <h2 className="text-4xl font-bold">What Students Say</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {testimonials.map(({ name, role, quote }) => (
              <div key={name} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="mb-4 flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-amber-400" weight="fill" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic mb-4">"{quote}"</p>
                <div>
                  <p className="font-semibold text-foreground text-sm">{name}</p>
                  <p className="text-xs text-muted-foreground">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="outline" className="mb-4">Get Started</Badge>
          <h2 className="text-4xl font-bold">Ready to Prepare?</h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Book a consultation to get matched to the right exam track and study plan for your profile. Or jump straight into the AI tutor.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/get-started">Book Free Consultation <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/academy/ai-tutor">Try AI Tutor</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
