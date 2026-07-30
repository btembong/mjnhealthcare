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
    title: 'English Language Test',
    desc: 'IELTS Academic (overall 7.0, no band below 6.5) or OET (minimum grade B in all four components). We assess your current level and recommend the right preparation pathway.',
    weeks: '4–12 weeks prep',
  },
  {
    n: '2',
    title: 'NMC / GMC / HCPC Application',
    desc: 'We prepare and submit your application to the correct UK regulatory body — NMC for nurses and midwives, GMC for physicians, HCPC for allied health. Includes credential evaluation and document attestation.',
    weeks: '4–8 weeks',
  },
  {
    n: '3',
    title: 'CBT (Computer-Based Test)',
    desc: 'The NMC CBT tests nursing knowledge in a UK clinical context. We provide structured study plans and question-bank access through the Academy. GMC PLAB 1 is the equivalent for doctors.',
    weeks: '6–10 weeks prep',
  },
  {
    n: '4',
    title: 'OSCE / PLAB 2',
    desc: 'The Objective Structured Clinical Examination (nurses) or PLAB 2 (doctors) is a UK-based practical assessment. We connect you with accredited OSCE preparation centres and help with UK arrival logistics.',
    weeks: 'Taken in UK',
  },
  {
    n: '5',
    title: 'NMC Pin & NHS Job Placement',
    desc: 'On successful OSCE completion the NMC issues your PIN. We then connect you to our NHS trust and private sector employer network. Our consultants support offer review, contract negotiation, and Tier 2 visa initiation.',
    weeks: '2–4 weeks',
  },
];

const included = [
  'English test eligibility assessment (IELTS vs. OET)',
  'NMC / GMC / HCPC application preparation and submission',
  'Document attestation and credential verification guidance',
  'CBT / PLAB 1 study plan and question bank access',
  'OSCE preparation centre referral and logistics support',
  'Authority liaison (NMC, GMC, HCPC)',
  'NHS employer network access and job matching',
  'Tier 2 / Health and Care Worker visa initiation support',
  'Status updates at every stage',
];

const bodies = [
  {
    authority: 'NMC',
    full: 'Nursing and Midwifery Council',
    professions: 'Registered Nurses, Midwives',
    exam: 'CBT + OSCE',
    color: 'border-blue-200 bg-blue-50/60',
  },
  {
    authority: 'GMC',
    full: 'General Medical Council',
    professions: 'Physicians (all specialties)',
    exam: 'PLAB 1 + PLAB 2',
    color: 'border-emerald-200 bg-emerald-50/60',
  },
  {
    authority: 'HCPC',
    full: 'Health and Care Professions Council',
    professions: 'Allied Health (Physio, OT, Radiography, etc.)',
    exam: 'Competence & Adaptation Programme',
    color: 'border-amber-200 bg-amber-50/60',
  },
];

const faqs = [
  {
    q: 'How long does the full UK registration process take?',
    a: 'Typically 9–14 months from start to NMC PIN, depending on English test preparation time and OSCE scheduling. The longest variable is OSCE availability — seats fill quickly. We advise applying for an OSCE slot immediately after passing your CBT.',
  },
  {
    q: 'Do I need to come to the UK for the OSCE?',
    a: 'Yes — the OSCE is a practical, in-person assessment held at NMC-approved UK test centres. We help you plan your travel, short-term accommodation, and OSCE preparation once you have a confirmed slot.',
  },
  {
    q: 'What IELTS score do I need?',
    a: 'NMC requires IELTS Academic with an overall band of 7.0 and no band below 6.5. OET is accepted as an alternative, with a minimum grade B in all four components. Many candidates find OET more achievable as it uses healthcare-specific scenarios.',
  },
  {
    q: 'Can you help me find a job before I finish registration?',
    a: 'Yes — many NHS trusts sponsor overseas nurses under a conditional offer model, where the offer is made before OSCE but activated upon PIN issue. We connect you to those opportunities early so you have employment confirmed before you travel.',
  },
  {
    q: 'Do you guarantee job placement or visa approval?',
    a: 'No — and we state this clearly in our engagement letter. Job offers depend on employer requirements and your profile; visa decisions are the UK Home Office\'s. What we commit to is professional representation, thorough submission, and honest guidance throughout.',
  },
];

export default function UKPage() {
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
            🇬🇧 UK — High Demand
          </Badge>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            UK Healthcare Registration — NMC, GMC & HCPC
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-blue-100">
            Full-service UK registration and NHS placement for nurses, physicians, and allied health professionals — from English test through NMC PIN and job offer.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="rounded-xl bg-white px-8 text-primary shadow-lg hover:bg-white/90" asChild>
              <Link href="/get-started">Book Free Consultation <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-xl border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20" asChild>
              <Link href="/academy/cbt">NMC CBT Prep</Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-blue-100">
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-teal-300" /> 89% first-attempt CBT pass rate</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-teal-300" /> 9–14 months average</span>
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-teal-300" /> 400+ placed in UK NHS</span>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3">The Process</Badge>
            <h2 className="text-4xl font-bold">From Your Home Country to an NHS Role</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Five stages managed end-to-end — so you focus on exam preparation, not paperwork.
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
            <h2 className="text-4xl font-bold">Which Body Regulates Your Profession</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              UK registration goes to the body responsible for your profession. Your consultant confirms the right pathway.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {bodies.map((b) => (
              <div key={b.authority} className={`rounded-2xl border p-6 ${b.color}`}>
                <p className="text-2xl font-extrabold text-foreground">{b.authority}</p>
                <p className="text-sm font-medium text-foreground">{b.full}</p>
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
              <Badge variant="outline" className="mb-3">What&apos;s Included</Badge>
              <h2 className="text-4xl font-bold">End-to-End Support — English Test to Employment</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Our UK service covers the entire pathway, including the practical UK-based OSCE stage that trips up many self-guided applicants. We stay with you through PIN issue and first-day employment.
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
                <Link href="/get-started">Start Your UK Application <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="rounded-3xl border border-border bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
              <div className="mb-5 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <p className="font-semibold text-foreground">Our Commitment</p>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>The UK pathway has specific in-country requirements (OSCE, Tier 2 visa) that make consultant support especially valuable. We coordinate every stage, including your OSCE slot booking and NHS employer introductions.</p>
                <p>We never advise clients to misrepresent qualifications or experience — NMC verification is thorough and any discrepancy causes permanent disqualification.</p>
                <div className="mt-6 rounded-xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Average outcomes (2025)</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>CBT / PLAB 1 first attempt</span>
                      <span className="font-bold text-foreground">89%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>OSCE first attempt</span>
                      <span className="font-bold text-foreground">82%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Placed within 3 months of PIN</span>
                      <span className="font-bold text-foreground">91%</span>
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
            <h2 className="text-4xl font-bold">UK Registration — Common Questions</h2>
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
            <h2 className="text-4xl font-bold">Ready to Start Your UK Registration?</h2>
            <p className="mx-auto mt-3 max-w-md text-blue-100">
              Book a free consultation. Your consultant will review your qualifications and map your exact pathway to an NHS role.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="rounded-xl bg-white px-8 text-primary hover:bg-white/90" asChild>
                <Link href="/get-started">Book Free Consultation</Link>
              </Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10" asChild>
                <Link href="/academy/cbt">Browse NMC CBT Prep →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
