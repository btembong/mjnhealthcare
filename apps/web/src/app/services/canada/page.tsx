'use client';

import Link from 'next/link';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import { ArrowRight, CheckCircle, Clock, FileText, Shield, Users, Star, CaretRight } from '@phosphor-icons/react';

const steps = [
  {
    n: '1',
    title: 'NNAS Advisory Report',
    desc: 'The National Nursing Assessment Service (NNAS) evaluates international nursing credentials for all Canadian provinces. We compile and submit your full NNAS application — transcripts, registration verification, language test results.',
    weeks: '4–6 months',
  },
  {
    n: '2',
    title: 'Provincial College Application',
    desc: 'Once NNAS issues your Advisory Report, we apply to your target provincial college — CNO (Ontario), CRNBC (BC), CARNA (Alberta), or others — on your behalf. Requirements vary slightly by province.',
    weeks: '4–8 weeks',
  },
  {
    n: '3',
    title: 'NCLEX-RN Examination',
    desc: 'Canada adopted NCLEX-RN for RN licensure. We enrol you in our NCLEX Academy module — structured study plan, 2,500+ NGN-format questions, and live instructor sessions. Physicians follow the MCCQE pathway.',
    weeks: '8–14 weeks prep',
  },
  {
    n: '4',
    title: 'Language Proficiency',
    desc: 'IELTS Academic (overall 7.0) or CELBAN (CLB 9 in all areas) for nurses. We assess your current level and recommend the most efficient preparation route.',
    weeks: '4–8 weeks prep',
  },
  {
    n: '5',
    title: 'Job Placement & Immigration',
    desc: 'We connect you to healthcare employer partners across Ontario, British Columbia, Alberta, and Saskatchewan. Once an offer is secured we support your Express Entry / Health Care stream immigration application.',
    weeks: '4–8 weeks',
  },
];

const included = [
  'NNAS application preparation and submission tracking',
  'Provincial college application (CNO, CRNBC, CARNA, others)',
  'NCLEX-RN enrolment and Academy study plan',
  'Language test eligibility assessment (IELTS vs. CELBAN)',
  'Credential verification and document attestation guidance',
  'Employer network access — Ontario, BC, Alberta, Saskatchewan',
  'Express Entry / Health Care stream immigration support',
  'Status updates at every milestone',
];

const bodies = [
  { authority: 'NNAS', full: 'National Nursing Assessment Service', profession: 'Nurses (all provinces)', flag: '🇨🇦' },
  { authority: 'CNO', full: 'College of Nurses of Ontario', profession: 'Nurses — Ontario', flag: '🇨🇦' },
  { authority: 'CRNBC', full: 'BC College of Nurses & Midwives', profession: 'Nurses — British Columbia', flag: '🇨🇦' },
  { authority: 'CARNA', full: 'College & Association of RNs of Alberta', profession: 'Nurses — Alberta', flag: '🇨🇦' },
  { authority: 'MCCQE', full: 'Medical Council of Canada Qualifying Exam', profession: 'Physicians', flag: '🇨🇦' },
  { authority: 'CEHPEA', full: 'Centre for the Evaluation of Health Professionals Educated Abroad', profession: 'Allied Health', flag: '🇨🇦' },
];

const faqs = [
  {
    q: 'How long does NNAS take?',
    a: 'NNAS Advisory Reports typically take 4–6 months from submission to completion, depending on how quickly your educational institutions respond to verification requests. We manage all follow-up communications on your behalf.',
  },
  {
    q: 'Which province should I target?',
    a: 'Ontario and British Columbia have the highest demand for internationally educated nurses, but Alberta and Saskatchewan offer faster pathways and active provincial nomination programs. We advise on province selection based on your qualifications and personal circumstances.',
  },
  {
    q: 'Do I need to take NCLEX-RN if I have already passed it for the US?',
    a: 'Yes — even if you hold a US NCLEX pass, you still need to apply through NNAS and the provincial college. However, your existing NCLEX result is accepted and you will not need to re-sit the exam.',
  },
  {
    q: 'Can physicians also use MJN for Canada?',
    a: 'Yes. Physicians follow the MCCQE Part 1 and Part 2 pathway, plus provincial College of Physicians and Surgeons applications. We manage the full process including NAC OSCE preparation referrals.',
  },
];

export default function CanadaPage() {
  return (
    <>
      <MarketingNav />

      {/* HERO */}
      <section className="gradient-hero relative overflow-hidden pt-28 pb-16 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">🇨🇦</span>
            <Badge className="border border-white/20 bg-white/10 text-white backdrop-blur-sm">Canada</Badge>
          </div>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Canadian Healthcare Licensing — NNAS, NCLEX & Provincial Registration
          </h1>
          <p className="mt-5 max-w-xl text-lg text-blue-100">
            Full-service support from NNAS Advisory Report through provincial college registration, NCLEX-RN, and job placement across Ontario, BC, Alberta, and beyond.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="rounded-xl bg-white px-7 text-primary shadow-lg hover:bg-white/90" asChild>
              <Link href="/get-started">Book Free Consultation <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20" asChild>
              <Link href="/pricing">See Pricing</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-6 text-sm text-blue-200">
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Avg. 8–14 months</span>
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> Nurses · Physicians · Allied Health</span>
            <span className="flex items-center gap-1.5"><Star className="h-4 w-4" /> 91% success rate</span>
          </div>
        </div>
      </section>

      {/* REGULATORY BODIES */}
      <section className="px-6 py-12 border-b border-border">
        <div className="mx-auto max-w-6xl">
          <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Regulatory bodies we work with</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bodies.map(({ authority, full, profession, flag }) => (
              <div key={authority} className="flex items-start gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm">
                <span className="text-2xl mt-0.5">{flag}</span>
                <div>
                  <p className="font-bold text-foreground">{authority}</p>
                  <p className="text-xs text-muted-foreground">{full}</p>
                  <p className="mt-1 text-xs font-medium text-primary">{profession}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PATHWAY STEPS */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">The Pathway</Badge>
            <h2 className="text-4xl font-bold">Five Steps to Canadian Registration</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Canadian healthcare licensing is one of the longest pathways globally — but highly predictable when managed correctly.
            </p>
          </div>
          <div className="space-y-4">
            {steps.map(({ n, title, desc, weeks }) => (
              <div key={n} className="flex gap-5 rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">{n}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-bold text-foreground">{title}</h3>
                    <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">{weeks}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT'S INCLUDED */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <div>
              <Badge variant="outline" className="mb-3">What's Included</Badge>
              <h2 className="text-4xl font-bold">Everything Handled for You</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                The Canadian pathway involves more agencies and touch-points than most other destinations. We manage every submission so you can focus on exam preparation.
              </p>
              <ul className="mt-6 space-y-3">
                {included.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" weight="fill" />
                    <span className="text-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl bg-primary/5 border border-primary/20 p-8">
              <FileText className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Why Canada Is Different</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Unlike UAE or UK licensing, Canadian registration is provincially controlled. The same NCLEX-RN result may be sufficient in one province and require additional steps in another. NNAS is the national gateway, but provincial colleges each set their own supplementary requirements.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We map your credentials to the right province from the start — avoiding the common mistake of applying provincially before the NNAS Advisory Report is complete.
              </p>
              <Button className="mt-6 w-full" asChild>
                <Link href="/get-started">Assess My Eligibility <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">FAQ</Badge>
            <h2 className="text-4xl font-bold">Canada — Common Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map(({ q, a }) => (
              <div key={q} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <h3 className="font-bold text-foreground mb-2">{q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-4xl">
          <div className="gradient-hero relative overflow-hidden rounded-3xl p-10 text-center text-white">
            <div className="relative">
              <h2 className="text-4xl font-bold">Ready to Start Your Canadian Journey?</h2>
              <p className="mx-auto mt-3 max-w-md text-blue-100">
                Book a free consultation to assess your eligibility, choose the right province, and get a realistic timeline.
              </p>
              <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button size="lg" className="rounded-xl bg-white px-8 text-primary hover:bg-white/90" asChild>
                  <Link href="/get-started">Book Free Consultation</Link>
                </Button>
                <Button size="lg" variant="ghost" className="text-white hover:bg-white/10" asChild>
                  <Link href="/pricing">See Pricing →</Link>
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
