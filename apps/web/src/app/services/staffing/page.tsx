'use client';

import Link from 'next/link';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import {
  ArrowRight, CheckCircle, Users, Buildings, Briefcase, Shield,
} from '@phosphor-icons/react';

const forCandidates = [
  'Access to exclusive positions not advertised publicly',
  'Employer pre-screening — we only present candidates who match the role',
  'Contract and offer review before you sign anything',
  'Salary negotiation support',
  'Reference and credentialing support (employer-facing)',
  'Post-placement check-in for 90 days',
];

const forEmployers = [
  'Pre-licensed candidate pipeline (ready to start faster)',
  'Credential-verified candidate profiles — no surprises at onboarding',
  'Profession-specific candidate matching (nurses, physicians, allied health)',
  'Volume hiring support for unit or ward openings',
  'Replacement guarantee for placements who do not complete probation',
  'Compliance documentation package for every placed candidate',
];

const specialties = [
  { label: 'ICU / Critical Care', icon: '🫀' },
  { label: 'Emergency Medicine', icon: '🚑' },
  { label: 'Operating Theatre', icon: '🩺' },
  { label: 'Oncology / Haematology', icon: '🔬' },
  { label: 'Paediatrics / Neonatology', icon: '👶' },
  { label: 'Mental Health / Psychiatry', icon: '🧠' },
  { label: 'Radiology / Imaging', icon: '📡' },
  { label: 'Pharmacy', icon: '💊' },
  { label: 'Physiotherapy / Rehab', icon: '🏋️' },
  { label: 'General / Ward Nursing', icon: '🏥' },
  { label: 'Midwifery', icon: '🤱' },
  { label: 'Dental / Oral Health', icon: '🦷' },
];

const markets = [
  { flag: '🇦🇪', market: 'UAE', detail: 'DHA / DOH / MOH licensed — Dubai, Abu Dhabi, Northern Emirates' },
  { flag: '🇬🇧', market: 'United Kingdom', detail: 'NMC / GMC / HCPC registered — NHS trusts and private sector' },
  { flag: '🇮🇪', market: 'Ireland', detail: 'NMBI / IMC / CORU registered — HSE and voluntary hospitals' },
  { flag: '🇺🇸', market: 'United States', detail: 'State-licensed RNs — EB-3 sponsored hospital systems' },
];

const faqs = [
  {
    q: 'Do I need to already have my licence to access the staffing service?',
    a: 'Ideally yes — but we work with candidates at multiple stages. Some of our employer partners offer conditional offers to candidates who are mid-licensing (particularly in the UAE and Ireland), where the offer is confirmed on PIN/licence issue. We flag these opportunities when relevant.',
  },
  {
    q: 'How do you match candidates to employers?',
    a: 'We match on profession, specialty, seniority, target country, salary expectations, and start date. We do not blast your CV to every open position — we present you to a maximum of three employers who are a genuine fit, with your consent before each introduction.',
  },
  {
    q: 'What does the employer pay for this service?',
    a: 'Employers pay a placement fee, structured as a percentage of first-year base salary. The placement fee does not come from the candidate — your salary offer is a direct employer decision, independent of our fee. Candidates pay nothing for employer matching if they are active engagement clients.',
  },
  {
    q: 'How are you different from a recruitment agency?',
    a: 'A recruitment agency fills roles — we build careers. Our candidates arrive at employers already licensed, oriented, and prepared — reducing your onboarding burden. And we stay involved post-placement, which reduces early attrition and protects both sides.',
  },
  {
    q: 'Can employers post roles directly on the MJN platform?',
    a: 'Partner employers can post opportunities via the Partner Portal (currently in development). In the meantime, employer partnerships are established via our business development team. Contact us to begin a partner verification conversation.',
  },
];

export default function StaffingPage() {
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
            Healthcare Staffing
          </Badge>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Healthcare Staffing — Connecting Licensed African Professionals to Global Employers
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-blue-100">
            We bridge the gap between internationally licensed African healthcare professionals and hospitals, clinics, and care systems in the UAE, UK, Ireland, and the US — with credential verification and 90-day post-placement support built in.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="rounded-xl bg-white px-8 text-primary shadow-lg hover:bg-white/90" asChild>
              <Link href="/get-started">Find a Position <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-xl border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20" asChild>
              <Link href="/partner">For Employers →</Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-blue-100">
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-teal-300" /> 1,200+ professionals placed</span>
            <span className="flex items-center gap-1.5"><Buildings className="h-4 w-4 text-teal-300" /> 80+ verified employer partners</span>
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-teal-300" /> 12 clinical specialties</span>
          </div>
        </div>
      </section>

      {/* FOR CANDIDATES + EMPLOYERS */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3">How It Works</Badge>
            <h2 className="text-4xl font-bold">For Candidates & Employers</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold text-foreground">For Healthcare Professionals</h3>
              </div>
              <ul className="space-y-3">
                {forCandidates.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <CheckCircle weight="fill" className="h-4 w-4 shrink-0 mt-0.5 text-teal-600" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-6" asChild>
                <Link href="/get-started">Find a Position <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <Buildings className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold text-foreground">For Healthcare Employers</h3>
              </div>
              <ul className="space-y-3">
                {forEmployers.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <CheckCircle weight="fill" className="h-4 w-4 shrink-0 mt-0.5 text-teal-600" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-6" variant="outline" asChild>
                <Link href="/partner">Become a Partner Employer <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SPECIALTIES */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">Specialties</Badge>
            <h2 className="text-4xl font-bold">Clinical Specialties We Recruit For</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {specialties.map(({ label, icon }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-border bg-white p-4">
                <span className="text-xl">{icon}</span>
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MARKETS */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">Markets</Badge>
            <h2 className="text-4xl font-bold">Where We Place</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {markets.map(({ flag, market, detail }) => (
              <div key={market} className="flex items-center gap-4 rounded-2xl border border-border bg-white p-6">
                <span className="text-4xl">{flag}</span>
                <div>
                  <p className="font-bold text-foreground">{market}</p>
                  <p className="text-sm text-muted-foreground">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">FAQ</Badge>
            <h2 className="text-4xl font-bold">Healthcare Staffing — Common Questions</h2>
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
            <h2 className="text-4xl font-bold">Licensed and Ready to Move? Let&apos;s Find You a Role.</h2>
            <p className="mx-auto mt-3 max-w-md text-blue-100">
              Book a placement consultation and we&apos;ll match your profile to verified employer openings within 5 business days.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="rounded-xl bg-white px-8 text-primary hover:bg-white/90" asChild>
                <Link href="/get-started">Find a Position</Link>
              </Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10" asChild>
                <Link href="/partner">Employer Partnership →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
