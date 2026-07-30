'use client';

import Link from 'next/link';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import {
  ArrowRight, CheckCircle, Clock, FileText, Shield, Users,
  Star, CaretRight, Stethoscope, Warning, Question,
} from '@phosphor-icons/react';

const steps = [
  {
    n: '1',
    title: 'Document Collection',
    desc: 'We generate a personalised checklist — passport, degree, transcripts, home-country licence, work experience letters — and guide you through every scan and attestation requirement.',
    weeks: '2–4 weeks',
  },
  {
    n: '2',
    title: 'DataFlow Primary Source Verification',
    desc: 'We submit your complete DataFlow application to the Gulf Cooperation Council\'s verification body. We monitor status and respond to any queries on your behalf.',
    weeks: '8–12 weeks',
  },
  {
    n: '3',
    title: 'Prometric Licensing Exam',
    desc: 'While DataFlow is in progress we start your exam preparation. DHA, HAAD/DOH, and MOH exams are all Prometric-based. Our Academy study plan and question bank run in parallel.',
    weeks: '4–8 weeks prep',
  },
  {
    n: '4',
    title: 'Licence Application & Issue',
    desc: 'Once DataFlow clears and you pass your exam, we submit the licence application directly to the relevant authority (DHA, DOH, or MOH). Licence issued digitally.',
    weeks: '2–4 weeks',
  },
  {
    n: '5',
    title: 'Employer Matching (optional)',
    desc: 'With a licence in hand, we connect you to verified UAE hospitals and clinics from our employer network. We support offer review and employment visa initiation.',
    weeks: 'Ongoing',
  },
];

const included = [
  'DataFlow application submission and monitoring',
  'Authority liaison (DHA / DOH / MOH / HAAD)',
  'Document attestation guidance',
  'Prometric exam eligibility assessment',
  'Academy study plan and question bank access',
  'Licence application filing',
  'Status updates at every stage',
  'Employer connection (placement package)',
];

const bodies = [
  {
    authority: 'DHA',
    full: 'Dubai Health Authority',
    emirate: 'Dubai',
    exam: 'DHA Prometric',
    professions: 'Nurses, Physicians, Dentists, Pharmacists, Allied Health',
    color: 'border-blue-200 bg-blue-50/60',
  },
  {
    authority: 'DOH / HAAD',
    full: 'Department of Health Abu Dhabi',
    emirate: 'Abu Dhabi',
    exam: 'HAAD Prometric',
    professions: 'All licensed professions',
    color: 'border-emerald-200 bg-emerald-50/60',
  },
  {
    authority: 'MOH',
    full: 'Ministry of Health & Prevention',
    emirate: 'Sharjah, Ajman, RAK, UAQ, Fujairah',
    exam: 'MOH Prometric',
    professions: 'All licensed professions',
    color: 'border-amber-200 bg-amber-50/60',
  },
];

const faqs = [
  {
    q: 'How long does the full UAE licensing process take?',
    a: 'On average 3–5 months from document submission to licence issue. DataFlow verification (the longest step) takes 8–12 weeks. Exam preparation runs in parallel so total wall-clock time is typically 3–4 months after DataFlow starts.',
  },
  {
    q: 'Which authority should I apply to — DHA, DOH, or MOH?',
    a: 'It depends on where you want to work. Dubai employers require DHA; Abu Dhabi requires DOH/HAAD; the other five emirates fall under MOH. If you are open to any emirate, your consultant will recommend based on your profession and current exam pass rates.',
  },
  {
    q: 'Do you submit applications directly to DataFlow and the licensing authority on my behalf?',
    a: 'Yes — but only after you have signed the engagement letter and provided a Letter of Authorization. We act as your authorised representative for all third-party submissions. Nothing is submitted without your explicit consent.',
  },
  {
    q: 'What documents do I need to start?',
    a: 'Typically: valid passport (min. 12 months validity), nursing/medical degree certificate, academic transcripts, home-country licence/registration, good standing certificate, and a CV. Your personalised checklist is issued at engagement sign-on.',
  },
  {
    q: 'Do you guarantee exam pass or licence approval?',
    a: 'No — and we say this clearly in our engagement letter. Exam outcomes and regulatory decisions are outside our control. What we guarantee is professional, thorough handling of every submission and exam preparation. Our clients achieve a 94% first-attempt pass rate.',
  },
];

export default function UAEPage() {
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
            🇦🇪 Most Requested Destination
          </Badge>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            UAE Healthcare Licensing — DHA, MOH & DOH
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-blue-100">
            Full-service DataFlow verification, Prometric exam preparation, and licence application for nurses, physicians, dentists, and allied health professionals.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="rounded-xl bg-white px-8 text-primary shadow-lg hover:bg-white/90" asChild>
              <Link href="/get-started">Book Free Consultation <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-xl border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20" asChild>
              <Link href="/academy/dha">DHA Exam Prep</Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-blue-100">
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-teal-300" /> 94% first-attempt pass rate</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-teal-300" /> 3–5 months average</span>
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-teal-300" /> 600+ placed in UAE</span>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3">The Process</Badge>
            <h2 className="text-4xl font-bold">From Your Home Country to a UAE Licence</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Five stages, one consultant managing every step — so you can focus on exam preparation, not paperwork.
            </p>
          </div>
          <div className="relative space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-6 rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                  {step.n}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground">{step.title}</h3>
                    <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-0.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {step.weeks}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REGULATORY BODIES */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">Regulatory Bodies</Badge>
            <h2 className="text-4xl font-bold">Three Licensing Authorities, One Process</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Which authority you apply to depends on the emirate where you will work. Your consultant will advise the right path.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {bodies.map((b) => (
              <div key={b.authority} className={`rounded-2xl border p-6 ${b.color}`}>
                <p className="text-2xl font-extrabold text-foreground">{b.authority}</p>
                <p className="text-sm font-medium text-foreground">{b.full}</p>
                <p className="mt-1 text-xs text-muted-foreground">{b.emirate}</p>
                <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                  <p><span className="font-semibold text-foreground">Exam:</span> {b.exam}</p>
                  <p><span className="font-semibold text-foreground">Professions:</span> {b.professions}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT'S INCLUDED */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge variant="outline" className="mb-3">What's Included</Badge>
              <h2 className="text-4xl font-bold">Everything Managed — Nothing Left to Chance</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Our UAE licensing service is a fully managed engagement. You provide documents; we handle the rest — including responding to DataFlow queries and authority correspondence that most applicants find impossible to navigate alone.
              </p>
              <ul className="mt-6 space-y-3">
                {included.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <CheckCircle weight="fill" className="h-4 w-4 shrink-0 mt-0.5 text-teal-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-8" asChild>
                <Link href="/get-started">Start Your Application <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="rounded-3xl border border-border bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
              <div className="mb-5 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <p className="font-semibold text-foreground">Our Commitment</p>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>We are transparent about what we control and what we do not. Your engagement letter explicitly states that exam pass rates, DataFlow timelines, and licence approvals depend on regulatory bodies — not on us.</p>
                <p>What we commit to: professional, complete, on-time submissions with no corner-cutting.</p>
                <div className="mt-6 rounded-xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Average outcomes (2025)</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>DataFlow success rate</span>
                      <span className="font-bold text-foreground">98%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>First-attempt exam pass</span>
                      <span className="font-bold text-foreground">94%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Licence issued within 5 months</span>
                      <span className="font-bold text-foreground">87%</span>
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
            <h2 className="text-4xl font-bold">UAE Licensing — Common Questions</h2>
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
            <h2 className="text-4xl font-bold">Ready to Start Your UAE Licensing?</h2>
            <p className="mx-auto mt-3 max-w-md text-blue-100">
              Book a free 30-minute consultation. Your consultant will review your qualifications and map the exact pathway for your profession and target emirate.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="rounded-xl bg-white px-8 text-primary hover:bg-white/90" asChild>
                <Link href="/get-started">Book Free Consultation</Link>
              </Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10" asChild>
                <Link href="/academy/dha">Browse DHA Prep →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
