'use client';

import Link from 'next/link';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import {
  ArrowRight, CheckCircle, TrendUp, Target, Users, Brain,
} from '@phosphor-icons/react';

const tracks = [
  {
    icon: '🗺️',
    title: 'Destination & Pathway Mapping',
    desc: 'Side-by-side comparison of all viable destination countries for your profession, qualification, and personal situation — factoring in salary, visa timeline, family situation, and long-term residency ambitions. No generic advice; your profile drives the analysis.',
  },
  {
    icon: '🎯',
    title: 'Licensing Timeline Modelling',
    desc: 'A realistic month-by-month roadmap from your current status to licensed-and-employed. We account for actual processing times, exam prep windows, and common bottlenecks — not best-case projections.',
  },
  {
    icon: '📈',
    title: 'Specialty & Salary Benchmarking',
    desc: 'Current salary ranges, specialty demand, and career progression paths across UAE, UK, US, Ireland, and Canada — broken down by profession and seniority level. Updated from verified employer data and placed-professional surveys.',
  },
  {
    icon: '🧠',
    title: 'Skill Gap Assessment',
    desc: 'We assess your current qualifications, clinical experience, and certifications against the requirements of your target destination and specialty — identifying precisely where to invest preparation time for maximum return.',
  },
  {
    icon: '📅',
    title: '5-Year Career Roadmap',
    desc: 'Beyond the first job — we map the path from initial placement to specialist registration, management roles, or multi-country licensing. Including CPD requirements, specialist exams, and residency milestones for your target country.',
  },
  {
    icon: '💼',
    title: 'CV & Professional Profile Review',
    desc: 'Your CV and LinkedIn profile reviewed against the standards expected by UAE, UK, US, and Irish healthcare employers — with specific feedback on clinical documentation, reference format, and professional summary for each market.',
  },
];

const deliverables = [
  'Written destination comparison report (all viable options for your profile)',
  'Licensing pathway timeline with month-by-month milestones',
  'Salary benchmarking data for your profession and specialty',
  'Skill gap assessment with prioritised action list',
  '5-year career roadmap document',
  'CV/profile review with tracked edits',
  'Recorded consultation session (yours to keep)',
  'Follow-up check-in at 3 months',
];

const whofor = [
  { label: 'Early-career professionals deciding between destinations', icon: '🌍' },
  { label: 'Mid-career professionals wanting to specialise or advance', icon: '📈' },
  { label: 'Professionals returning from career breaks', icon: '🔄' },
  { label: 'Students planning 3–5 years ahead', icon: '🎓' },
  { label: 'Professionals exploring a career pivot within healthcare', icon: '🔀' },
  { label: 'Anyone who has received conflicting advice and wants clarity', icon: '🧭' },
];

const faqs = [
  {
    q: 'How is career planning different from a licensing consultation?',
    a: 'A licensing consultation focuses on the steps to obtain a specific licence for a specific destination. Career planning takes a wider view — we map all realistic destinations, model multiple pathways simultaneously, and factor in your 5-year ambitions, not just the next step.',
  },
  {
    q: 'How long does a career planning engagement take?',
    a: 'The initial assessment session is 90 minutes. Your written deliverables — the destination report, timeline, and roadmap — are delivered within 5 business days. The total engagement is complete within 2 weeks, after which you have a clear plan to execute.',
  },
  {
    q: 'Will the career planner be a healthcare professional?',
    a: 'Yes — all MJN career consultants are healthcare professionals with personal international licensing experience, not career generalists. Your consultant has either lived the pathway you are exploring or has directly supported dozens of professionals through it.',
  },
  {
    q: 'Can career planning convert into a full licensing engagement?',
    a: 'Yes — most clients move from career planning into a full licensing engagement within the same consultant relationship. The career planning fee is credited against your licensing engagement fee when you proceed within 60 days.',
  },
];

export default function CareerPlanningPage() {
  return (
    <>
      <MarketingNav />

      {/* HERO */}
      <section className="gradient-hero relative overflow-hidden pt-28 pb-16 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6">
          <Badge className="mb-4 border border-white/20 bg-white/10 text-white backdrop-blur-sm">
            Career Planning
          </Badge>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Customised Healthcare Career Planning — Built Around Your Life
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-blue-100">
            Not every healthcare professional is at the same stage or heading to the same destination. Our career planning service gives you a personalised, data-driven roadmap — from where you are now to where you want to be in five years.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="rounded-xl bg-white px-8 text-primary shadow-lg hover:bg-white/90" asChild>
              <Link href="/get-started">Book Career Planning Session <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-blue-100">
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-teal-300" /> Written deliverables within 5 days</span>
            <span className="flex items-center gap-1.5"><Target className="h-4 w-4 text-teal-300" /> All viable destinations compared</span>
            <span className="flex items-center gap-1.5"><TrendUp className="h-4 w-4 text-teal-300" /> 5-year career roadmap included</span>
          </div>
        </div>
      </section>

      {/* TRACKS */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3">What&apos;s Covered</Badge>
            <h2 className="text-4xl font-bold">Six Career Planning Tracks</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Every career plan covers all six tracks — customised to your profession, experience, and target destination(s).
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tracks.map(({ icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 text-xl">{icon}</div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">Who This Is For</Badge>
            <h2 className="text-4xl font-bold">Career Planning Is for You If...</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {whofor.map(({ label, icon }) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-5">
                <span className="text-2xl">{icon}</span>
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DELIVERABLES */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge variant="outline" className="mb-3">Deliverables</Badge>
              <h2 className="text-4xl font-bold">What You Receive</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                At the end of your career planning engagement, you hold a complete, written career strategy — not notes from a call. Eight tangible outputs you own and act on.
              </p>
              <ul className="mt-6 space-y-3">
                {deliverables.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <CheckCircle weight="fill" className="h-4 w-4 shrink-0 mt-0.5 text-teal-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-8" asChild>
                <Link href="/get-started">Book Your Session <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="rounded-3xl border border-border bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
              <div className="mb-5 flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <p className="font-semibold text-foreground">AI-Enhanced Analysis</p>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>Your career plan is prepared by an experienced consultant — but enhanced by AI analysis of current licensing processing times, salary data, and visa queue trends across all destination countries.</p>
                <p>All AI-generated analysis is reviewed and validated by your consultant before delivery. You receive expert judgement, not raw model output.</p>
                <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Typical timeline</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Initial assessment session</span>
                      <span className="font-bold text-foreground">90 min</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Written deliverables</span>
                      <span className="font-bold text-foreground">5 business days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>3-month follow-up</span>
                      <span className="font-bold text-foreground">30 min call</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">FAQ</Badge>
            <h2 className="text-4xl font-bold">Career Planning — Common Questions</h2>
          </div>
          <div className="divide-y divide-border rounded-2xl border border-border bg-white overflow-hidden">
            {faqs.map(({ q, a }) => (
              <div key={q} className="px-6 py-5">
                <p className="font-semibold text-foreground text-sm">{q}</p>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="gradient-hero relative overflow-hidden rounded-3xl p-10 text-center text-white">
            <h2 className="text-4xl font-bold">Stop Guessing. Start with a Plan.</h2>
            <p className="mx-auto mt-3 max-w-md text-blue-100">
              Most professionals waste 12–24 months pursuing the wrong pathway. A career planning session takes 2 weeks and saves years.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="rounded-xl bg-white px-8 text-primary hover:bg-white/90" asChild>
                <Link href="/get-started">Book Career Planning Session</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
