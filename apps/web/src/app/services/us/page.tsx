'use client';

import Link from 'next/link';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import {
  ArrowRight, CheckCircle, Clock, Shield, Users,
} from '@phosphor-icons/react';

const steps = [
  {
    n: '1',
    title: 'CGFNS / NNAS Credential Evaluation',
    desc: 'Before sitting NCLEX, internationally educated nurses must have credentials evaluated. We prepare and submit your CGFNS VisaScreen or CES application — verifying your nursing education and licensure with your home-country institution.',
    weeks: '3–6 months',
  },
  {
    n: '2',
    title: 'English Language Test',
    desc: 'Most state boards and CGFNS require IELTS or TOEFL for internationally educated nurses. We assess your current level and integrate English preparation into your overall timeline.',
    weeks: '4–12 weeks prep',
  },
  {
    n: '3',
    title: 'State Board Application (NCLEX Eligibility)',
    desc: 'We identify the best US state board for your situation — considering processing time, Nurse Licensure Compact (NLC) membership, and retrogression queues. We prepare and submit your eligibility application to the State Board of Nursing.',
    weeks: '4–8 weeks',
  },
  {
    n: '4',
    title: 'NCLEX-RN Preparation',
    desc: 'Our Academy provides a structured NCLEX-RN study plan built around the 2026 Next Generation NCLEX (NGN) format — clinical judgement, case studies, and item types. Question bank and study plan access begin immediately.',
    weeks: '8–16 weeks prep',
  },
  {
    n: '5',
    title: 'NCLEX Exam & License Endorsement',
    desc: 'You sit NCLEX at a Pearson VUE test centre. On passing, you receive your RN licence from the issuing state. We then support multi-state endorsement if your target employer is in an NLC state.',
    weeks: '2–4 weeks (results)',
  },
  {
    n: '6',
    title: 'Employer Matching & EB-3 Visa Support',
    desc: 'With RN licence in hand, we connect you to US hospital systems offering EB-3 immigrant visas or H-1B sponsorship. We provide pre-departure orientation and employment contract review.',
    weeks: 'Ongoing',
  },
];

const included = [
  'CGFNS / NNAS credential evaluation submission and tracking',
  'State Board of Nursing application (state selection advice included)',
  'NCLEX-RN NGN study plan and full question bank access',
  'English test preparation guidance (IELTS / TOEFL)',
  'Authorization to Test (ATT) follow-up',
  'Multi-state licence endorsement support',
  'US employer network access (EB-3 / H-1B sponsors)',
  'Employment contract review',
  'Status updates at every stage',
];

const pathways = [
  {
    label: 'NCLEX-RN',
    who: 'Registered Nurses',
    body: 'State Board of Nursing (any of 50 states)',
    eval: 'CGFNS CES or VisaScreen',
    color: 'border-blue-200 bg-blue-50/60',
  },
  {
    label: 'USMLE',
    who: 'Physicians (MD/MBBS)',
    body: 'ECFMG + FSMB',
    eval: 'ECFMG Certification (Step 1, 2 CK, CS)',
    color: 'border-emerald-200 bg-emerald-50/60',
  },
  {
    label: 'Allied Health',
    who: 'PT, OT, Pharmacy, Radiology',
    body: 'Profession-specific board (FSBPT, NBCOT, etc.)',
    eval: 'CGFNS or credential-specific evaluation',
    color: 'border-amber-200 bg-amber-50/60',
  },
];

const faqs = [
  {
    q: 'How long does the full US licensure process take?',
    a: 'Typically 12–24 months from CGFNS submission to first US paycheck. The longest variables are CGFNS processing (3–6 months), state board eligibility (4–8 weeks), and visa retrogression queues (EB-3 for nurses can be 1–3 years for some nationalities). We flag these country-specific delays at consultation.',
  },
  {
    q: 'Which US state should I apply to?',
    a: 'It depends on your target employer, visa type, and state processing time. Compact (NLC) states allow multi-state practice — so if your employer is in an NLC state, applying there gives broader flexibility. Your consultant will advise based on your specific situation.',
  },
  {
    q: 'Is the NCLEX different now?',
    a: 'Yes — the Next Generation NCLEX (NGN) launched in April 2023 and tests clinical judgement through new item types (case studies, bowtie questions, etc.) rather than purely recall. Our Academy question bank and study plans are fully updated for the NGN format.',
  },
  {
    q: 'Do I need to travel to the US to sit NCLEX?',
    a: 'No — Pearson VUE administers NCLEX at international test centres in many countries, including the UK, UAE, India, and the Philippines. We help you identify the nearest centre and book your slot once you have an ATT.',
  },
  {
    q: 'Do you help with the visa process?',
    a: 'We provide support connecting you to EB-3-sponsoring employers and orient you on the H-1B vs. EB-3 trade-offs. Immigration attorney work for the visa petition itself is a separate engagement; we refer to trusted immigration partners where needed.',
  },
];

export default function USPage() {
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
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-end">
            {/* Left: text */}
            <div className="flex-1">
              <Badge className="mb-4 border border-white/20 bg-white/10 text-white backdrop-blur-sm">
                🇺🇸 United States
              </Badge>
              <h1 className="max-w-3xl text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
                US Healthcare Licensing — NCLEX, CGFNS & USMLE
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-blue-100">
                Full-service US licensure pathway for internationally educated nurses and physicians — credential evaluation, NCLEX NGN preparation, and employer matching with EB-3 visa sponsors.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" className="rounded-xl bg-white px-8 text-primary shadow-lg hover:bg-white/90" asChild>
                  <Link href="/get-started">Book Free Consultation <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-xl border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20" asChild>
                  <Link href="/academy/nclex">NCLEX Prep</Link>
                </Button>
              </div>
              <div className="mt-10 flex flex-wrap gap-6 text-sm text-blue-100">
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-teal-300" /> 91% first-attempt NCLEX pass rate</span>
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-teal-300" /> 12–24 months average</span>
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-teal-300" /> 200+ placed in US</span>
              </div>
            </div>

            {/* Right: NCLEX badge */}
            <div className="shrink-0 lg:w-72">
              <div className="overflow-hidden rounded-3xl ring-4 ring-white/20 shadow-2xl shadow-black/30">
                <img
                  src="/NCLEX-406x406.png"
                  alt="NCLEX® — National Council Licensure Examination"
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="mt-3 text-center text-xs text-white/50">
                NCLEX® is administered by the National Council of State Boards of Nursing (NCSBN)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3">The Process</Badge>
            <h2 className="text-4xl font-bold">From African Nursing School to US RN Licence</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Six stages — credential evaluation through visa-sponsored employment — all managed by one consultant.
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

      {/* PATHWAYS */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">Licensing Pathways</Badge>
            <h2 className="text-4xl font-bold">Nurses, Physicians & Allied Health</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Different professions follow different US licensing routes. Your consultant identifies the right pathway for your qualification.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {pathways.map((p) => (
              <div key={p.label} className={`rounded-2xl border p-6 ${p.color}`}>
                <p className="text-2xl font-extrabold text-foreground">{p.label}</p>
                <p className="mt-1 text-sm font-medium text-foreground">{p.who}</p>
                <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                  <p><span className="font-semibold text-foreground">Body:</span> {p.body}</p>
                  <p><span className="font-semibold text-foreground">Evaluation:</span> {p.eval}</p>
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
              <h2 className="text-4xl font-bold">One Consultant, The Entire US Pathway</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                The US pathway is the most complex in our portfolio — multiple federal bodies, state-by-state rules, and long visa queues. Having a single consultant who knows all the moving parts is the difference between a 14-month success and a 3-year stall.
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
                <Link href="/get-started">Start Your US Application <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="rounded-3xl border border-border bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
              <div className="mb-5 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <p className="font-semibold text-foreground">What We&apos;re Honest About</p>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>EB-3 visa retrogression — the waiting period between petition approval and visa availability — is determined by the US State Department, not us. Nationalities with long queues (e.g., Nigeria, Philippines) face waits that no consultant can shorten. We flag this clearly at consultation.</p>
                <p>What we can do: help you choose the fastest state board, prepare a spotless CGFNS submission, and connect you to employers who actively sponsor.</p>
                <div className="mt-6 rounded-xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Average outcomes (2025)</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>CGFNS first-submission acceptance</span>
                      <span className="font-bold text-foreground">96%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>NCLEX first-attempt pass</span>
                      <span className="font-bold text-foreground">91%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Employer match (post-licence)</span>
                      <span className="font-bold text-foreground">88%</span>
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
            <h2 className="text-4xl font-bold">US Licensing — Common Questions</h2>
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
            <h2 className="text-4xl font-bold">Ready to Start Your US Licensing Journey?</h2>
            <p className="mx-auto mt-3 max-w-md text-blue-100">
              Book a free consultation. We&apos;ll assess your qualifications, flag retrogression realities for your nationality, and map the fastest credible path.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="rounded-xl bg-white px-8 text-primary hover:bg-white/90" asChild>
                <Link href="/get-started">Book Free Consultation</Link>
              </Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10" asChild>
                <Link href="/academy/nclex">Browse NCLEX Prep →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
