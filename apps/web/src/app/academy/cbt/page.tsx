'use client';

import Link from 'next/link';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import { ArrowRight, CheckCircle, Clock, Users } from '@phosphor-icons/react';

const examDetails = [
  { label: 'Full name', value: 'NMC CBT — Nursing and Midwifery Council Computer-Based Test' },
  { label: 'Format', value: 'Computer-based (Pearson VUE)' },
  { label: 'Questions', value: '120 MCQs' },
  { label: 'Duration', value: '3 hours' },
  { label: 'Pass mark', value: 'Scaled score — reported by NMC' },
  { label: 'Validity', value: 'Must take OSCE within 3 years of CBT pass' },
];

const domains = [
  { domain: 'Professional values', topics: 'Code of conduct, professional boundaries, NMC standards' },
  { domain: 'Communication', topics: 'Patient communication, documentation, handover' },
  { domain: 'Nursing practice', topics: 'Assessment, planning, intervention, evaluation' },
  { domain: 'Leadership', topics: 'Delegation, prioritisation, team working' },
  { domain: 'Evidence-based practice', topics: 'Research literacy, clinical guidelines, audit' },
  { domain: 'Medicines management', topics: 'Drug calculations, administration, pharmacology' },
];

const faqs = [
  {
    q: 'What is the NMC CBT and why do I need it?',
    a: 'The NMC Computer-Based Test is the first UK registration exam for internationally educated nurses. It tests theoretical nursing knowledge in a UK context. You must pass the CBT before you can book an OSCE (the practical assessment). Both CBT and OSCE must be passed to obtain your NMC PIN.',
  },
  {
    q: 'Where can I sit the NMC CBT?',
    a: 'The CBT is administered by Pearson VUE at international test centres — including in several African countries. You do not need to travel to the UK for the CBT. Your consultant will identify the nearest test centre when you reach the exam stage.',
  },
  {
    q: 'How different is the CBT from NCLEX?',
    a: 'The CBT tests UK nursing context (NMC Code, NHS values, UK medications and protocols) rather than the US clinical framework. If you have studied for NCLEX, some clinical content overlaps — but the UK-specific professional standards and medication names require separate preparation. We advise against treating them as interchangeable.',
  },
  {
    q: 'How long should I prepare for the CBT?',
    a: 'Most candidates need 6–10 weeks of focused preparation. Key areas where internationally educated nurses underperform are the professional values and medicines management domains — which require knowledge of UK-specific standards, not just clinical nursing. Our study plan weights these appropriately.',
  },
];

export default function CBTPage() {
  return (
    <>
      <MarketingNav />

      <section className="relative overflow-hidden text-white bg-cover bg-center bg-no-repeat min-h-[520px] flex items-center" style={{ backgroundImage: "url('/examhero.jpg')" }}>
        <div className="relative mx-auto w-full max-w-6xl px-6 py-28 flex justify-end">
          <div className="w-full max-w-lg rounded-3xl bg-[#0F4C81]/80 p-8 backdrop-blur-md ring-1 ring-white/10 shadow-2xl">
            <Badge className="mb-4 border border-white/20 bg-white/10 text-white backdrop-blur-sm">
              Academy — NMC CBT
            </Badge>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              NMC CBT Preparation — UK Nursing &amp; Midwifery Council Computer-Based Test
            </h1>
            <p className="mt-4 text-base text-blue-100 leading-relaxed">
              Comprehensive preparation for the NMC CBT — the first exam on the UK nursing registration pathway. UK-specific clinical content, professional standards, and medicines management focus.
            </p>
            <div className="mt-6">
              <Button size="lg" className="rounded-xl bg-white px-8 text-primary shadow-lg hover:bg-white/90" asChild>
                <Link href="/get-started">Start CBT Prep <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-blue-100">
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-teal-300" /> 89% first-attempt pass rate</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-teal-300" /> 6–10 weeks recommended</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-teal-300" /> Nurses and midwives</span>
            </div>
          </div>
        </div>
      </section>

      {/* EXAM + DOMAINS */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <Badge variant="outline" className="mb-3">Exam Details</Badge>
              <h2 className="text-4xl font-bold">About the NMC CBT</h2>
              <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-white overflow-hidden">
                {examDetails.map(({ label, value }) => (
                  <div key={label} className="flex justify-between px-5 py-3 text-sm">
                    <span className="font-medium text-foreground">{label}</span>
                    <span className="text-muted-foreground text-right max-w-[60%]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Badge variant="outline" className="mb-3">Exam Domains</Badge>
              <h2 className="text-4xl font-bold">Six Test Domains</h2>
              <div className="mt-6 space-y-3">
                {domains.map(({ domain, topics }) => (
                  <div key={domain} className="rounded-xl border border-border bg-white p-4">
                    <p className="font-semibold text-foreground text-sm">{domain}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{topics}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OSCE NOTE */}
      <section className="bg-muted/30 px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-border bg-white p-6">
            <h3 className="font-bold text-foreground mb-2">After the CBT — the OSCE</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Passing the CBT does not complete your NMC registration — it qualifies you to book the Objective Structured Clinical Examination (OSCE), which is a practical assessment held in the UK. Our full UK licensing service covers both the CBT and OSCE stages, including OSCE preparation centre referrals and UK arrival logistics.{' '}
              <Link href="/services/uk" className="text-primary hover:underline">Learn about the full UK pathway →</Link>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">FAQ</Badge>
            <h2 className="text-4xl font-bold">NMC CBT — Common Questions</h2>
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
            <h2 className="text-4xl font-bold">Pass the CBT and Get Your UK Nursing Career Started</h2>
            <p className="mx-auto mt-3 max-w-md text-blue-100">The CBT is the first gate on the NMC pathway. Pass it first time with structured preparation.</p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="rounded-xl bg-white px-8 text-primary hover:bg-white/90" asChild>
                <Link href="/get-started">Start CBT Prep</Link>
              </Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10" asChild>
                <Link href="/services/uk">Full UK Licensing →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
