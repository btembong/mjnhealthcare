'use client';

import Link from 'next/link';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import {
  ArrowRight, CheckCircle, Globe, MapPin, Users, Clock, Shield, CaretRight,
} from '@phosphor-icons/react';

const destinations = [
  {
    flag: '🇦🇪',
    country: 'United Arab Emirates',
    detail: 'DHA · DOH · MOH · DataFlow verification',
    avg: '3–5 months',
    href: '/services/uae',
    highlight: 'Most Requested',
  },
  {
    flag: '🇬🇧',
    country: 'United Kingdom',
    detail: 'NMC · GMC · HCPC · NHS placement',
    avg: '9–14 months',
    href: '/services/uk',
    highlight: 'High Demand',
  },
  {
    flag: '🇺🇸',
    country: 'United States',
    detail: 'NCLEX-RN · CGFNS · USMLE · EB-3 visa',
    avg: '12–24 months',
    href: '/services/us',
    highlight: null,
  },
  {
    flag: '🇮🇪',
    country: 'Ireland',
    detail: 'NMBI · IMC · CORU · Critical Skills Permit',
    avg: '6–10 months',
    href: '/services/ireland',
    highlight: 'EU Pathway',
  },
  {
    flag: '🇨🇦',
    country: 'Canada',
    detail: 'NCLEX-RN (provincial) · NNAS · CEHPEA',
    avg: '12–18 months',
    href: '/services/uae',
    highlight: 'Coming Soon',
  },
  {
    flag: '🇦🇺',
    country: 'Australia',
    detail: 'AHPRA · NCLEX (2023) · Employer sponsorship',
    avg: '8–14 months',
    href: '/services/uae',
    highlight: 'Coming Soon',
  },
  {
    flag: '🇶🇦',
    country: 'Qatar',
    detail: 'QCHP · DataFlow verification · Prometric exams',
    avg: '3–6 months',
    href: '/get-started',
    highlight: 'Gulf Region',
  },
  {
    flag: '🇸🇦',
    country: 'Saudi Arabia',
    detail: 'SCFHS · DataFlow · Prometric · Mumaris+ portal',
    avg: '4–8 months',
    href: '/get-started',
    highlight: 'Gulf Region',
  },
];

const process = [
  {
    n: '1',
    title: 'Free Destination Consultation',
    desc: 'Your consultant reviews your qualifications, language level, and career goals across all destinations simultaneously — giving you a side-by-side comparison of timelines, costs, and visa outcomes.',
  },
  {
    n: '2',
    title: 'Destination & Pathway Selection',
    desc: 'Based on your assessment, we agree on the primary destination (and a backup where applicable). A signed engagement letter defines scope, fees, and what is — and is not — guaranteed.',
  },
  {
    n: '3',
    title: 'Document Collection',
    desc: 'A single personalised document checklist covers everything needed across your destination\'s regulatory body requirements — no duplicate requests, no surprises mid-process.',
  },
  {
    n: '4',
    title: 'Licensing & Credential Verification',
    desc: 'We manage submission to the relevant authority — DataFlow (UAE), CGFNS (US), NMBI (Ireland), NMC (UK) — and monitor status, respond to queries, and escalate delays on your behalf.',
  },
  {
    n: '5',
    title: 'Exam Preparation',
    desc: 'Academy study plans and question banks run in parallel with licensing — so exam readiness and pathway progress happen simultaneously, not sequentially. Time saved: 2–6 months.',
  },
  {
    n: '6',
    title: 'Employer Matching & Visa Support',
    desc: 'Once licenced, we introduce you to our verified employer network in your target country and support the early stages of the visa / employment permit process.',
  },
];

const professions = [
  { label: 'Registered Nurses', icon: '👩‍⚕️' },
  { label: 'Physicians / Doctors', icon: '🩺' },
  { label: 'Dentists', icon: '🦷' },
  { label: 'Pharmacists', icon: '💊' },
  { label: 'Physiotherapists', icon: '🏋️' },
  { label: 'Radiographers', icon: '🔬' },
  { label: 'Occupational Therapists', icon: '🤝' },
  { label: 'Midwives', icon: '👶' },
];

export default function GlobalPlacementPage() {
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
            Global Placement
          </Badge>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            International Healthcare Placement — All Destinations, One Consultant
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-blue-100">
            We place nurses, physicians, and allied health professionals from Africa in the UAE, UK, US, Ireland, and beyond — managing licensing, exam preparation, and employer matching end-to-end.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="rounded-xl bg-white px-8 text-primary shadow-lg hover:bg-white/90" asChild>
              <Link href="/get-started">Book Free Consultation <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-blue-100">
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-teal-300" /> 1,200+ professionals placed</span>
            <span className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-teal-300" /> 8 destination countries</span>
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-teal-300" /> 8 professions served</span>
          </div>
        </div>
      </section>

      {/* DESTINATIONS */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3">Destinations</Badge>
            <h2 className="text-4xl font-bold">Where We Place Healthcare Professionals</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Each destination has a dedicated service page with full process detail, regulatory body information, and FAQs.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((d) => (
              <Link
                key={d.country}
                href={d.href}
                className="group flex flex-col gap-3 rounded-2xl border border-border bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-3xl">{d.flag}</span>
                  {d.highlight && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                      {d.highlight}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-bold text-foreground">{d.country}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{d.detail}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {d.avg} avg</span>
                  <span className="flex items-center gap-1 font-medium text-primary group-hover:gap-2 transition-all">
                    Learn more <CaretRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* PROFESSIONS */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">Who We Serve</Badge>
            <h2 className="text-4xl font-bold">Professions We Support</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              From nurses to specialists — if your profession is regulated in the destination country, we can manage the pathway.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {professions.map(({ label, icon }) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4">
                <span className="text-2xl">{icon}</span>
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3">How It Works</Badge>
            <h2 className="text-4xl font-bold">One Process, Any Destination</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              The underlying engagement model is the same regardless of destination — what changes is the regulatory body, timeline, and exam.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {process.map((step) => (
              <div key={step.n} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                  {step.n}
                </div>
                <h3 className="font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMITMENT */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-border bg-white p-10">
            <div className="mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <p className="font-semibold text-foreground">Our Commitment and Limitations</p>
            </div>
            <div className="grid gap-6 text-sm text-muted-foreground sm:grid-cols-2">
              <div>
                <p className="mb-2 font-semibold text-foreground">What we commit to:</p>
                <ul className="space-y-2">
                  {[
                    'Professional, complete, on-time submissions',
                    'Honest assessment of your specific situation',
                    'Transparent fees with no hidden charges',
                    'A dedicated consultant for your entire engagement',
                    'Responsive communication at every stage',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle weight="fill" className="h-4 w-4 shrink-0 mt-0.5 text-teal-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 font-semibold text-foreground">What we are honest about:</p>
                <ul className="space-y-2">
                  {[
                    'Exam pass rates depend on your preparation',
                    'Visa approvals are government decisions — not ours',
                    'Licensing timelines vary by regulatory body workload',
                    'Job offers depend on employer requirements',
                    'We disclose all third-party fees upfront',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="gradient-hero relative overflow-hidden rounded-3xl p-10 text-center text-white">
            <h2 className="text-4xl font-bold">Not Sure Which Destination is Right for You?</h2>
            <p className="mx-auto mt-3 max-w-md text-blue-100">
              Book a free 30-minute consultation. We&apos;ll compare all destinations side-by-side for your specific qualifications and career goals.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="rounded-xl bg-white px-8 text-primary hover:bg-white/90" asChild>
                <Link href="/get-started">Book Free Consultation</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
