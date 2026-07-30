'use client';

import Link from 'next/link';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import {
  ArrowRight, CheckCircle, Clock, Shield, Users, Certificate, TrendUp,
} from '@phosphor-icons/react';

const programs = [
  {
    icon: '🩺',
    title: 'Clinical Skills Update',
    duration: '2–5 days',
    desc: 'Hands-on refresher covering current clinical guidelines, critical care protocols, and evidence-based practice updates relevant to your specialty. Suitable for nurses and allied health professionals returning from career breaks or transitioning specialties.',
    ceus: '15–30 CEUs',
  },
  {
    icon: '💊',
    title: 'Pharmacology for Clinical Practice',
    duration: '3 days',
    desc: 'High-yield pharmacology update covering drug classes, interactions, and administration protocols most relevant to ward and ICU settings. Aligned with current WHO essential medicines list and Gulf / UK formulary differences.',
    ceus: '18 CEUs',
  },
  {
    icon: '🫀',
    title: 'Advanced Cardiac Life Support (ACLS)',
    duration: '2 days',
    desc: 'AHA-aligned ACLS recertification course with simulation-based practicals. Mandatory for renewal in many UAE (DHA) and UK (NMC) annual practice assessments.',
    ceus: '12 CEUs',
  },
  {
    icon: '📊',
    title: 'Healthcare Leadership & Management',
    duration: '5 days',
    desc: 'Designed for senior nurses and allied health professionals in supervisory roles. Covers team leadership, quality improvement frameworks (Plan-Do-Study-Act), clinical governance, and staff appraisal in international settings.',
    ceus: '30 CEUs',
  },
  {
    icon: '🔬',
    title: 'Research & Evidence-Based Practice',
    duration: '3 days',
    desc: 'Introduction to clinical research methodology, systematic review reading, and applying evidence to bedside practice. Required for many specialist register renewals in the UK and Ireland.',
    ceus: '18 CEUs',
  },
  {
    icon: '🌍',
    title: 'Cross-Cultural Clinical Communication',
    duration: '1 day',
    desc: 'Practical training for healthcare professionals moving to the UAE, UK, or Ireland — covers cultural expectations, patient communication norms, documentation standards, and professional hierarchy differences in each setting.',
    ceus: '6 CEUs',
  },
];

const included = [
  'Pre-programme competency assessment',
  'Live virtual sessions with specialist instructors',
  'Study materials and reference guides',
  'Simulation-based practicals (where applicable)',
  'Assessment and competency verification',
  'Verifiable CPD certificate (CEU count specified)',
  'Progress tracking in your MJN portal',
  'Post-programme study plan for further development',
];

const faqs = [
  {
    q: 'Are your CPD certificates recognised by licensing bodies?',
    a: 'Our CPD certificates specify CEU/CPD hours and are structured to meet the annual requirements of DHA, NMC, NMBI, and HCPC. We recommend confirming with your specific licensing body as requirements vary by profession and registration year. We provide guidance on this at enrollment.',
  },
  {
    q: 'Are these programmes available online?',
    a: 'Most modules are delivered live-virtual via Daily.co, accessible from any device. Simulation-based practicals (ACLS, clinical skills) require in-person attendance at a partner simulation centre. We can advise on the nearest accredited centre to your location.',
  },
  {
    q: 'Can my employer pay for CPD programmes directly?',
    a: 'Yes — we issue invoices to organisations and support bulk enrollments for hospital CPD cohorts. Employer-funded CPD is handled separately from individual engagement billing.',
  },
  {
    q: 'I am not a current MJN client. Can I enrol in CPD?',
    a: 'Yes — CPD programmes are open to all licensed healthcare professionals, not just those on our licensing or placement pathways. You do not need an active engagement to enrol.',
  },
];

export default function CPDPage() {
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
            CPD Programs
          </Badge>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Continuing Professional Development for Licensed Healthcare Professionals
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-blue-100">
            Verifiable CPD programmes designed around the annual renewal requirements of DHA, NMC, NMBI, and HCPC — delivered live-virtual for healthcare professionals wherever they are.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="rounded-xl bg-white px-8 text-primary shadow-lg hover:bg-white/90" asChild>
              <Link href="/get-started">Explore CPD Programmes <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-blue-100">
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-teal-300" /> CEU-verified certificates</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-teal-300" /> 1–5 day programmes</span>
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-teal-300" /> Live-virtual, Africa-accessible</span>
          </div>
        </div>
      </section>

      {/* PROGRAMMES */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3">Programmes</Badge>
            <h2 className="text-4xl font-bold">Current CPD Programme Catalogue</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Six specialised programmes aligned to international licensing renewal requirements. New programmes added quarterly.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map(({ icon, title, duration, desc, ceus }) => (
              <div key={title} className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 text-xl">{icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-4 text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> {duration}</span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary">{ceus}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT'S INCLUDED */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge variant="outline" className="mb-3">What&apos;s Included</Badge>
              <h2 className="text-4xl font-bold">Every Programme Includes</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Our CPD programmes are not just video lectures. Each is a structured learning engagement with pre-assessment, live instruction, practical components (where applicable), and a verifiable certificate mapped to your licensing body&apos;s requirements.
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
                <Link href="/get-started">Enrol in a Programme <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="rounded-3xl border border-border bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
              <div className="mb-5 flex items-center gap-2">
                <TrendUp className="h-5 w-5 text-primary" />
                <p className="font-semibold text-foreground">For Employers</p>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>We work with hospitals, clinics, and care groups to design custom CPD programmes for their workforce — including mandatory annual updates, specialty upskilling, and leadership development cohorts.</p>
                <p>Group pricing and direct invoicing available. Programmes can be tailored to your facility&apos;s protocols and scheduling requirements.</p>
                <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
                  <p className="font-semibold text-foreground text-sm mb-3">Employer enquiries</p>
                  <p className="text-xs text-muted-foreground">Contact us for a tailored proposal covering your CPD requirements, cohort size, and delivery format preferences.</p>
                  <Button size="sm" className="mt-4 w-full" asChild>
                    <Link href="/contact">Get a Proposal <ArrowRight className="h-3.5 w-3.5" /></Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">FAQ</Badge>
            <h2 className="text-4xl font-bold">CPD Programmes — Common Questions</h2>
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
            <h2 className="text-4xl font-bold">Keep Your Licence Current — and Your Career Moving</h2>
            <p className="mx-auto mt-3 max-w-md text-blue-100">
              Explore our programme catalogue or get in touch to discuss a custom CPD engagement for yourself or your team.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="rounded-xl bg-white px-8 text-primary hover:bg-white/90" asChild>
                <Link href="/get-started">Explore Programmes</Link>
              </Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10" asChild>
                <Link href="/contact">Employer Enquiry →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
