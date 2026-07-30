'use client';

import Link from 'next/link';
import * as React from 'react';
import { MarketingNav } from '../../components/marketing-nav';
import { SiteFooter } from '../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import {
  ArrowRight, CheckCircle, Buildings, Users, Shield, Handshake,
} from '@phosphor-icons/react';

const partnerTypes = [
  {
    icon: '🏥',
    title: 'Healthcare Employer',
    subtitle: 'Hospitals, clinics, care groups',
    desc: 'Partner with MJN to access a pipeline of credential-verified, internationally licensed healthcare professionals — pre-screened and ready for employment. Ideal for NHS trusts, UAE hospital groups, Irish HSE facilities, and US hospital systems recruiting from Africa.',
    benefits: [
      'Pre-licensed, credential-verified candidate profiles',
      'Profession and specialty filtering',
      'Volume hiring support for unit or ward openings',
      '90-day post-placement follow-up included',
      'Replacement guarantee for probation non-completions',
      'Compliance documentation package per placement',
    ],
    cta: 'Apply as Employer Partner',
  },
  {
    icon: '🎓',
    title: 'University or Training Institution',
    subtitle: 'Universities, simulation centres, academies',
    desc: 'Partner with MJN to receive qualified African healthcare students for study-abroad programmes, clinical placements, or joint training initiatives. We handle recruitment, pre-screening, and visa orientation.',
    benefits: [
      'Vetted student applicants for your programmes',
      'Pre-assessed academic and language eligibility',
      'Bilateral collaboration on curriculum content',
      'Clinical internship hosting arrangements',
      'Co-delivery of CPD and simulation programmes',
    ],
    cta: 'Apply as Academic Partner',
  },
  {
    icon: '🌐',
    title: 'Agency or Referral Partner',
    subtitle: 'Staffing agencies, immigration firms, health NGOs',
    desc: 'Refer clients to MJN and earn a structured referral commission for licensing and placement engagements. Ideal for Africa-based immigration consultants, healthcare recruitment agencies, and health NGOs supporting professional development.',
    benefits: [
      'Transparent referral commission structure',
      'Dedicated partner dashboard (coming soon)',
      'Co-branded marketing materials available',
      'Regular partner webinars and training',
      'Priority case management for referred clients',
    ],
    cta: 'Apply as Referral Partner',
  },
];

const verificationSteps = [
  { n: '1', title: 'Submit Application', desc: 'Complete the partner application form below or email our partnerships team.' },
  { n: '2', title: 'Review & Due Diligence', desc: 'We verify your organisation — registration documents, employer references, regulatory standing. Typically 5–10 business days.' },
  { n: '3', title: 'Agreement Signing', desc: 'We issue a Partner Agreement covering fee structures, data handling, code of conduct, and replacement guarantees.' },
  { n: '4', title: 'Onboarding', desc: 'Access to the Partner Portal (for employers), co-branded materials, and a dedicated MJN partnerships contact.' },
];

const faqs = [
  {
    q: 'Do employers pay to access the MJN candidate pipeline?',
    a: 'Yes — employer partners pay a placement fee structured as a percentage of the placed professional\'s first-year base salary. This is invoiced on confirmed placement start date, not on introduction. We can discuss deferred billing arrangements for volume hirers.',
  },
  {
    q: 'How long does partner verification take?',
    a: 'Typically 5–10 business days from receipt of all required documentation. For recognised NHS trusts, HSE facilities, and accredited UAE hospitals, the process is faster due to existing regulatory standing.',
  },
  {
    q: 'Can we access candidate profiles before they are fully licensed?',
    a: 'We share candidate profiles at the pre-licence stage only with partners who have a conditional offer model — where the offer is confirmed contingent on licence issue. We do not share unlicensed candidate data without explicit candidate consent and a framework agreement.',
  },
  {
    q: 'What is the referral commission structure?',
    a: 'Referral commissions for licensing engagements are a fixed per-engagement amount; for placement referrals, they are a percentage of the placement fee earned by MJN. Full details are in the Referral Partner Agreement. Contact us for current rates.',
  },
];

export default function PartnerPage() {
  const [submitted, setSubmitted] = React.useState(false);

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
            Partner With Us
          </Badge>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Partner With MJN — Employers, Universities, and Agencies
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-blue-100">
            Access Africa&apos;s most prepared pipeline of internationally licensed healthcare professionals. Three partnership models — for employers, academic institutions, and referral partners.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="rounded-xl bg-white px-8 text-primary shadow-lg hover:bg-white/90" asChild>
              <Link href="#apply">Apply to Partner <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-blue-100">
            <span className="flex items-center gap-1.5"><Buildings className="h-4 w-4 text-teal-300" /> 80+ verified partner institutions</span>
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-teal-300" /> 1,200+ professionals placed</span>
            <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-teal-300" /> Full compliance documentation</span>
          </div>
        </div>
      </section>

      {/* PARTNER TYPES */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3">Partnership Types</Badge>
            <h2 className="text-4xl font-bold">Three Ways to Partner</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {partnerTypes.map(({ icon, title, subtitle, desc, benefits, cta }) => (
              <div key={title} className="flex flex-col rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/8 text-2xl">{icon}</div>
                <h3 className="font-bold text-foreground text-lg">{title}</h3>
                <p className="text-xs font-medium text-primary mb-3">{subtitle}</p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{desc}</p>
                <ul className="space-y-2 flex-1">
                  {benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle weight="fill" className="h-3.5 w-3.5 shrink-0 mt-0.5 text-teal-600" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 w-full" asChild>
                  <Link href="#apply">{cta} <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VERIFICATION PROCESS */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">Process</Badge>
            <h2 className="text-4xl font-bold">How Partner Verification Works</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {verificationSteps.map(({ n, title, desc }) => (
              <div key={n} className="flex gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">{n}</div>
                <div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* APPLICATION FORM */}
      <section id="apply" className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">Apply</Badge>
            <h2 className="text-4xl font-bold">Partner Application</h2>
            <p className="mt-3 text-muted-foreground">Complete this form and our partnerships team will respond within 2 business days.</p>
          </div>

          {submitted ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-white p-16 text-center shadow-sm">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-3xl">✓</div>
              <h3 className="text-xl font-bold text-foreground">Application Received</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm">Our partnerships team will review your application and respond within 2 business days.</p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="rounded-3xl border border-border bg-white p-8 shadow-sm space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Organisation Name *</label>
                  <input required type="text" placeholder="Hospital / University / Agency name" className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Partnership Type *</label>
                  <select required className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white">
                    <option value="">Select type</option>
                    <option value="employer">Healthcare Employer</option>
                    <option value="academic">University / Training Institution</option>
                    <option value="referral">Agency / Referral Partner</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Contact Name *</label>
                  <input required type="text" placeholder="HR Director / Partnerships Lead" className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Work Email *</label>
                  <input required type="email" placeholder="contact@yourhospital.com" className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Country / Region *</label>
                <input required type="text" placeholder="e.g. Dubai, UAE / London, UK / Dublin, Ireland" className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Tell us about your needs *</label>
                <textarea required rows={4} placeholder="What professions are you hiring? How many positions? Any specialty requirements?" className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none" />
              </div>
              <Button type="submit" className="w-full" size="lg">
                Submit Application <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">FAQ</Badge>
            <h2 className="text-4xl font-bold">Partnership — Common Questions</h2>
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

      <SiteFooter />
    </>
  );
}
