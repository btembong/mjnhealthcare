'use client';

import Link from 'next/link';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import { ArrowRight, CheckCircle, Clock, Star, Users, Brain } from '@phosphor-icons/react';

const whatsCovered = [
  'NGN item types: case studies, bow-tie, matrix, cloze, and highlight',
  'Clinical judgement measurement framework (CJMM)',
  'Pharmacology — high-yield drug classes and priority nursing interventions',
  'Medical-surgical nursing — NCLEX-priority conditions',
  'Maternal/newborn and paediatric nursing',
  'Mental health and psychiatric nursing',
  'Leadership, management, and delegation',
  'Safe and effective care environment — infection control, safety',
  '2,500+ practice questions with detailed rationale',
  'Full-length adaptive practice exams (NGN format)',
];

const plans = [
  {
    name: 'Self-Study',
    price: '$89',
    duration: '3 months access',
    features: [
      'Full question bank (2,500+ questions)',
      'NGN-format practice exams',
      'Study plan generator',
      'Performance analytics dashboard',
      'PDF study guides',
    ],
    cta: 'Start Self-Study',
    highlight: false,
  },
  {
    name: 'Academy Plus',
    price: '$189',
    duration: '4 months access',
    features: [
      'Everything in Self-Study',
      'AI Study Assistant (Claude-powered)',
      'Weekly live revision sessions',
      'Weak-area detection and targeted plans',
      '3 full-length adaptive mock exams',
      'Priority email support',
    ],
    cta: 'Start Academy Plus',
    highlight: true,
  },
  {
    name: 'Full Engagement',
    price: 'Included',
    duration: 'With licensing engagement',
    features: [
      'Everything in Academy Plus',
      'Dedicated NCLEX coach',
      'Linked to your licensing pathway timeline',
      'Eligibility assessment included',
      'State board application support',
    ],
    cta: 'Book Consultation',
    highlight: false,
  },
];

const faqs = [
  {
    q: 'Is this for the old NCLEX or the new NGN format?',
    a: 'The MJN NCLEX preparation is fully updated for the Next Generation NCLEX (NGN), which launched in April 2023. All practice questions include the new item types — clinical case studies, bow-tie questions, cloze drop-down, and matrix items. We do not use legacy question banks.',
  },
  {
    q: 'Can I take the NCLEX exam in the UAE?',
    a: 'No — the NCLEX does not have a Pearson VUE testing centre in the UAE. Candidates residing in or planning to move to the UAE must travel to sit the exam. The closest available centres are typically in India, Jordan, or the UK. We factor travel planning into your exam preparation timeline so there are no surprises.',
  },
  {
    q: 'How long should I prepare for NCLEX?',
    a: 'Most internationally educated nurses need 10–16 weeks of structured preparation. The NGN format tests clinical judgement (not just recall), which takes longer to develop than traditional NCLEX. Our study plan adapts to your diagnostic results and available hours per week.',
  },
  {
    q: 'Can I access the course in French?',
    a: 'Yes — our AI Study Assistant supports French, and selected study guides are available in French. The NCLEX exam itself is in English only, so our core question bank and explanations are English-first to prepare you for the actual exam environment.',
  },
  {
    q: 'What is the AI Study Assistant?',
    a: 'It is a Claude-powered tutor embedded in the Academy. It answers clinical questions, explains question rationale in plain language, identifies your weak areas, and generates personalised study plans. It is not a replacement for your study plan — it is a supplement that helps you get more out of every study session.',
  },
];

export default function NCLEXPage() {
  return (
    <>
      <MarketingNav />

      <section className="relative overflow-hidden text-white bg-cover bg-center bg-no-repeat min-h-[520px] flex items-center" style={{ backgroundImage: "url('/examhero.jpg')" }}>
        <div className="relative mx-auto w-full max-w-6xl px-6 py-28 flex justify-end">
          {/* Text box — right side, dark frosted card */}
          <div className="w-full max-w-lg rounded-3xl bg-[#0F4C81]/80 p-8 backdrop-blur-md ring-1 ring-white/10 shadow-2xl">
            <Badge className="mb-4 border border-white/20 bg-white/10 text-white backdrop-blur-sm">
              Academy — NCLEX
            </Badge>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              NCLEX-RN Preparation — Next Generation NCLEX (NGN) Format
            </h1>
            <p className="mt-4 text-base text-blue-100 leading-relaxed">
              Structured NCLEX-RN preparation built for internationally educated nurses — NGN item types, AI-powered study assistant, and clinical judgement training. English and French support.
            </p>
            <div className="mt-6">
              <Button size="lg" className="rounded-xl bg-white px-8 text-primary shadow-lg hover:bg-white/90" asChild>
                <Link href="/get-started">Start Preparation <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-blue-100">
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-teal-300" /> 91% first-attempt pass rate</span>
              <span className="flex items-center gap-1.5"><Brain className="h-4 w-4 text-teal-300" /> NGN-format question bank</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-teal-300" /> English & French</span>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT'S COVERED */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">Curriculum</Badge>
            <h2 className="text-4xl font-bold">What the NCLEX Prep Covers</h2>
          </div>
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
            {/* Checklist */}
            <div className="flex-1 grid gap-3 sm:grid-cols-2">
              {whatsCovered.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-xl border border-border bg-white p-4">
                  <CheckCircle weight="fill" className="h-4 w-4 shrink-0 mt-0.5 text-teal-600" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>

            {/* NCLEX badge */}
            <div className="shrink-0 lg:w-96">
              <div className="overflow-hidden rounded-3xl ring-4 ring-primary/15 shadow-xl">
                <img
                  src="/NCLEX-406x406.png"
                  alt="NCLEX® — National Council Licensure Examination"
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                NCLEX® is administered by the National Council of State Boards of Nursing (NCSBN)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">Plans</Badge>
            <h2 className="text-4xl font-bold">Choose Your Preparation Plan</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {plans.map(({ name, price, duration, features, cta, highlight }) => (
              <div key={name} className={`flex flex-col rounded-2xl border p-6 ${highlight ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-white shadow-sm'}`}>
                {highlight && <span className="mb-3 w-fit rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white">Most Popular</span>}
                <h3 className="text-xl font-bold text-foreground">{name}</h3>
                <p className="mt-1 text-3xl font-extrabold text-foreground">{price}</p>
                <p className="text-xs text-muted-foreground">{duration}</p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle weight="fill" className="h-4 w-4 shrink-0 mt-0.5 text-teal-600" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 w-full" variant={highlight ? 'default' : 'outline'} asChild>
                  <Link href="/get-started">{cta} <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">FAQ</Badge>
            <h2 className="text-4xl font-bold">NCLEX Prep — Common Questions</h2>
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

      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="gradient-hero relative overflow-hidden rounded-3xl p-10 text-center text-white">
            <h2 className="text-4xl font-bold">Pass NCLEX First Time</h2>
            <p className="mx-auto mt-3 max-w-md text-blue-100">Join over 900 nurses who prepared with MJN Academy and passed on their first attempt.</p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="rounded-xl bg-white px-8 text-primary hover:bg-white/90" asChild>
                <Link href="/get-started">Start Preparation</Link>
              </Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10" asChild>
                <Link href="/services/us">US Licensing Service →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
