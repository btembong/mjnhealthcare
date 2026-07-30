'use client';

import Link from 'next/link';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import { ArrowRight, CheckCircle, Clock, Users, Stethoscope } from '@phosphor-icons/react';

const examDetails = [
  { label: 'Format', value: 'Computer-based (Prometric centre)' },
  { label: 'Questions', value: '100–150 MCQs' },
  { label: 'Duration', value: '2.5–3 hours' },
  { label: 'Pass mark', value: '65% (varies by profession)' },
  { label: 'Retake', value: '90-day waiting period' },
  { label: 'Validity', value: '5 years (then renewal)' },
];

const topics = [
  'Nursing fundamentals and patient assessment',
  'Medical-surgical nursing (priority conditions for DHA)',
  'Pharmacology — common drugs in UAE clinical settings',
  'Critical care and emergency nursing',
  'Maternal and child health',
  'Infection prevention and control (DHA protocols)',
  'Legal and ethical aspects of nursing in the UAE',
  'Documentation standards (DHA requirements)',
  '800+ DHA-format MCQ practice questions',
  'Full-length timed mock exams',
];

const faqs = [
  {
    q: 'How hard is the DHA exam compared to NCLEX?',
    a: 'The DHA exam is generally considered more focused and less complex than NCLEX — it tests UAE-relevant clinical knowledge rather than the broad clinical judgement framework of NGN NCLEX. Most nurses find 6–10 weeks of structured preparation sufficient, compared to 10–16 weeks for NCLEX.',
  },
  {
    q: 'Can I sit the DHA exam outside the UAE?',
    a: 'Yes — Prometric administers the DHA exam at international test centres, including in several African countries. Your consultant will identify the nearest centre when you reach the exam stage.',
  },
  {
    q: 'Is this preparation for all DHA professions or nurses only?',
    a: 'Our DHA Academy content is built primarily for nurses. Physicians, dentists, and pharmacists have separate DHA exam formats — we provide targeted preparation for those professions on request as part of a full licensing engagement.',
  },
  {
    q: 'What happens if I fail the DHA exam?',
    a: 'DHA requires a 90-day waiting period before a retake. If you fail on your first attempt, we review your exam feedback, identify weak areas, and build a targeted study plan for your retake. Clients on the Academy Plus and Full Engagement plans have retake coaching included.',
  },
];

export default function DHAPage() {
  return (
    <>
      <MarketingNav />

      <section className="relative overflow-hidden text-white bg-cover bg-center bg-no-repeat min-h-[520px] flex items-center" style={{ backgroundImage: "url('/examhero.jpg')" }}>
        <div className="relative mx-auto w-full max-w-6xl px-6 py-28 flex justify-end">
          <div className="w-full max-w-lg rounded-3xl bg-[#0F4C81]/80 p-8 backdrop-blur-md ring-1 ring-white/10 shadow-2xl">
            <Badge className="mb-4 border border-white/20 bg-white/10 text-white backdrop-blur-sm">
              Academy — DHA
            </Badge>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              DHA Exam Preparation — Dubai Health Authority Licensing
            </h1>
            <p className="mt-4 text-base text-blue-100 leading-relaxed">
              Structured exam preparation for the DHA Prometric licensing exam — 800+ practice questions, DHA-specific clinical content, and full mock exams. Achieve your Dubai licence.
            </p>
            <div className="mt-6">
              <Button size="lg" className="rounded-xl bg-white px-8 text-primary shadow-lg hover:bg-white/90" asChild>
                <Link href="/get-started">Start DHA Prep <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-blue-100">
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-teal-300" /> 94% first-attempt pass rate</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-teal-300" /> 6–10 weeks recommended</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-teal-300" /> Nurses, physicians, allied health</span>
            </div>
          </div>
        </div>
      </section>

      {/* EXAM DETAILS */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <Badge variant="outline" className="mb-3">Exam Details</Badge>
              <h2 className="text-4xl font-bold">About the DHA Exam</h2>
              <p className="mt-4 text-muted-foreground">The DHA Prometric exam is a computer-based licensing assessment required for all healthcare professionals seeking to practise in Dubai emirate. It tests UAE-relevant clinical knowledge and professional standards.</p>
              <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-white overflow-hidden">
                {examDetails.map(({ label, value }) => (
                  <div key={label} className="flex justify-between px-5 py-3 text-sm">
                    <span className="font-medium text-foreground">{label}</span>
                    <span className="text-muted-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Badge variant="outline" className="mb-3">Curriculum</Badge>
              <h2 className="text-4xl font-bold">Topics Covered</h2>
              <ul className="mt-6 space-y-2.5">
                {topics.map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm">
                    <CheckCircle weight="fill" className="h-4 w-4 shrink-0 mt-0.5 text-teal-600" />
                    <span className="text-muted-foreground">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">FAQ</Badge>
            <h2 className="text-4xl font-bold">DHA Exam — Common Questions</h2>
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
            <h2 className="text-4xl font-bold">Ready to Pass the DHA Exam?</h2>
            <p className="mx-auto mt-3 max-w-md text-blue-100">Join hundreds of nurses who prepared with MJN Academy and earned their Dubai Health Authority licence.</p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="rounded-xl bg-white px-8 text-primary hover:bg-white/90" asChild>
                <Link href="/get-started">Start DHA Prep</Link>
              </Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10" asChild>
                <Link href="/services/uae">Full UAE Licensing →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
