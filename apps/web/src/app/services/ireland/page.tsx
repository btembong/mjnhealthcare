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
    title: 'Eligibility Assessment',
    desc: 'NMBI (nurses), IMC (doctors), and CORU (allied health) each have specific eligibility criteria — undergraduate hours in theory and clinical practice, recognised institution requirements, and English proficiency thresholds. We assess your qualifications before any application fee is paid.',
    weeks: '1–2 weeks',
  },
  {
    n: '2',
    title: 'English Language Test',
    desc: 'NMBI requires IELTS Academic overall 6.5 (no band below 6.0) or OET grade B. We assess your current level and, if needed, integrate OET preparation — its healthcare context makes it more accessible for clinical professionals.',
    weeks: '4–12 weeks prep',
  },
  {
    n: '3',
    title: 'Application Preparation & Submission',
    desc: 'We prepare your complete NMBI/IMC/CORU application — including degree certificates, transcripts, home-country registration, good-standing certificates, and proof of clinical experience. We coordinate attestation and submit on your behalf.',
    weeks: '4–6 weeks',
  },
  {
    n: '4',
    title: 'Competence Assessment (if required)',
    desc: 'NMBI may refer some applications for a Competence Assessment or adaptation period. We brief you on what to expect and connect you with Irish healthcare partners who host supervised practice for internationally educated nurses.',
    weeks: 'Varies',
  },
  {
    n: '5',
    title: 'Registration & Employer Matching',
    desc: 'On approval, your name is added to the NMBI / IMC / CORU register. We connect you to our network of Irish public and private healthcare employers — HSE, voluntary hospitals, and care groups actively recruiting from Africa.',
    weeks: '2–4 weeks',
  },
];

const included = [
  'Eligibility pre-assessment (NMBI / IMC / CORU)',
  'Application preparation and authority submission',
  'Document attestation and credential guidance',
  'English proficiency test preparation advice (IELTS / OET)',
  'Authority liaison and query response',
  'Competence assessment preparation (if applicable)',
  'Irish employer network access (HSE, voluntary sector)',
  'Employment permit / Critical Skills visa orientation',
  'Status updates at every stage',
];

const bodies = [
  {
    authority: 'NMBI',
    full: 'Nursing and Midwifery Board of Ireland',
    professions: 'Registered General Nurses, Midwives, Public Health Nurses',
    color: 'border-emerald-200 bg-emerald-50/60',
  },
  {
    authority: 'IMC',
    full: 'Irish Medical Council',
    professions: 'Physicians (General Practice, Specialist)',
    color: 'border-blue-200 bg-blue-50/60',
  },
  {
    authority: 'CORU',
    full: 'Health and Social Care Professionals Council',
    professions: 'Physiotherapy, Occupational Therapy, Radiology, Social Work, and others',
    color: 'border-amber-200 bg-amber-50/60',
  },
];

const faqs = [
  {
    q: 'How long does NMBI registration take for internationally educated nurses?',
    a: 'Typically 6–10 months from application submission to register entry. The longest variable is the competence assessment pathway — if NMBI requires an adaptation period or aptitude test, this can add 3–6 months. We assess at the outset whether your qualifications are likely to trigger this requirement.',
  },
  {
    q: 'Does Ireland have a nursing shortage?',
    a: 'Yes — Ireland consistently has one of the highest nurse vacancy rates in the EU. Nursing is on the Critical Skills Occupations List, which means Employment Permits are readily available and are processed faster than standard work permits.',
  },
  {
    q: 'Can my family come with me to Ireland?',
    a: 'Yes — Critical Skills Employment Permit holders can bring immediate family members (spouse and dependent children). Family members of Critical Skills permit holders can access the Irish labour market without their own permit. We provide orientation on this during your consultation.',
  },
  {
    q: 'Is Irish pay comparable to UK NHS pay?',
    a: 'Irish HSE nursing pay scales are broadly comparable to NHS Band 5–6. Net take-home pay is competitive given Ireland\'s tax credit system. Your consultant provides a current salary-band briefing at engagement start.',
  },
  {
    q: 'Do you handle IMC (physician) and CORU (allied health) applications too?',
    a: 'Yes — while most of our Ireland volume is NMBI nurses, we handle IMC physician registration and all CORU-regulated professions. Each has its own timeline and documentation requirements, which we assess at the free consultation.',
  },
];

export default function IrelandPage() {
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
            🇮🇪 Ireland — Critical Skills
          </Badge>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Ireland Healthcare Registration — NMBI, IMC & CORU
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-blue-100">
            Full-service Ireland registration and HSE placement for nurses, physicians, and allied health professionals — from eligibility assessment through Critical Skills Employment Permit.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="rounded-xl bg-white px-8 text-primary shadow-lg hover:bg-white/90" asChild>
              <Link href="/get-started">Book Free Consultation <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-blue-100">
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-teal-300" /> Critical Skills Occupation</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-teal-300" /> 6–10 months average</span>
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-teal-300" /> 150+ placed in Ireland</span>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3">The Process</Badge>
            <h2 className="text-4xl font-bold">From Your Home Country to the Irish Register</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Five stages managed by one consultant — eligibility through employment.
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
            <h2 className="text-4xl font-bold">Three Bodies, One Pathway Partner</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Ireland&apos;s healthcare regulation is split across three authorities by profession. We handle all three.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {bodies.map((b) => (
              <div key={b.authority} className={`rounded-2xl border p-6 ${b.color}`}>
                <p className="text-2xl font-extrabold text-foreground">{b.authority}</p>
                <p className="text-sm font-medium text-foreground">{b.full}</p>
                <p className="mt-4 text-xs text-muted-foreground">{b.professions}</p>
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
              <h2 className="text-4xl font-bold">Eligibility to Employment — All Managed</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Ireland&apos;s registration pathway has several points where applications stall without experienced guidance — particularly around clinical-hours documentation and competence assessment referrals. We pre-screen your documents to catch issues before NMBI does.
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
                <Link href="/get-started">Start Your Ireland Application <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="rounded-3xl border border-border bg-gradient-to-br from-emerald-50 to-teal-50 p-8">
              <div className="mb-5 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <p className="font-semibold text-foreground">Why Ireland?</p>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>Ireland offers a rare combination: English-speaking, EU member state, nursing on the Critical Skills list, and a healthcare system with genuine long-term staffing demand. For nurses who want EU residency rights and family reunification, Ireland is often the most accessible route.</p>
                <div className="mt-6 rounded-xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key advantages</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle weight="fill" className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>EU freedom of movement after 5 years residency</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle weight="fill" className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>Family reunification from day 1 (Critical Skills permit)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle weight="fill" className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>Spouse work authorisation — no separate permit needed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle weight="fill" className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>Pathway to Irish citizenship after 5 years</span>
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
            <h2 className="text-4xl font-bold">Ireland Registration — Common Questions</h2>
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
            <h2 className="text-4xl font-bold">Ready to Start Your Ireland Pathway?</h2>
            <p className="mx-auto mt-3 max-w-md text-blue-100">
              Book a free consultation. We&apos;ll assess your eligibility for NMBI and map your fastest route to the Irish register.
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
