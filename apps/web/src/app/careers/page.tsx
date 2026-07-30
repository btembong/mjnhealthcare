'use client';

import Link from 'next/link';
import * as React from 'react';
import { MarketingNav } from '../../components/marketing-nav';
import { SiteFooter } from '../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import { ArrowRight, CheckCircle, MapPin, Clock } from '@phosphor-icons/react';

const openRoles = [
  {
    title: 'Licensing Consultant — UAE Pathways',
    type: 'Full-time',
    location: 'Yaoundé or Remote (Africa)',
    dept: 'Licensing Operations',
    desc: 'Manage a caseload of clients through DHA, DOH, and MOH licensing pathways. Requires personal UAE licensing experience (DHA or DOH) and knowledge of DataFlow process.',
    requirements: [
      'Minimum 2 years clinical practice as a registered nurse, physician, or allied health professional',
      'Personal DHA, DOH, or MOH registration (or actively completing the process)',
      'Excellent written and verbal communication in English (French a strong plus)',
      'Detail-oriented — comfortable managing multiple cases simultaneously with strict documentation standards',
    ],
  },
  {
    title: 'Academy Content Developer — NCLEX',
    type: 'Full-time or Contract',
    location: 'Remote',
    dept: 'Academy',
    desc: 'Develop and maintain NCLEX-RN question bank items, study plans, and video lesson scripts. Must have deep familiarity with the NGN (Next Generation NCLEX) item types.',
    requirements: [
      'Current RN with NCLEX pass (any jurisdiction)',
      'Experience writing standardised exam questions or clinical case studies',
      'Familiarity with NGN item types: case studies, bow-tie, cloze, matrix',
      'English first language or near-native proficiency',
    ],
  },
  {
    title: 'Employer Partnerships Associate',
    type: 'Full-time',
    location: 'London, UK or Remote (Europe)',
    dept: 'Staffing & Employer Relations',
    desc: 'Develop and manage relationships with NHS trusts, private hospital groups, and care organisations for candidate placement. Reports to Head of Staffing.',
    requirements: [
      '2+ years in healthcare recruitment, HR, or business development',
      'Understanding of NHS or private sector nurse/physician recruitment processes',
      'Strong relationship-building and negotiation skills',
      'Based in the UK or able to travel to UK quarterly',
    ],
  },
  {
    title: 'Student Support Advisor — Francophone Africa',
    type: 'Full-time',
    location: 'Cameroon (Yaoundé or Douala)',
    dept: 'Student Support',
    desc: 'Advise francophone healthcare students on study-abroad, internship, and early licensing planning. First point of contact for French-speaking student enquiries.',
    requirements: [
      'Healthcare background (nursing, medicine, or allied health student or graduate)',
      'Native or near-native French speaker; working English required',
      'Empathetic, organised, and reliable communicator',
      'Personal experience of international application processes is highly valued',
    ],
  },
];

const benefits = [
  { icon: '🌍', label: 'Remote-first culture — most roles are location-flexible within Africa or Europe' },
  { icon: '📚', label: 'Full Academy access — free CPD and exam prep for all team members' },
  { icon: '✈️', label: 'Professional development travel — conferences, regulatory body workshops' },
  { icon: '🤝', label: 'Mission-aligned work — every day you help someone build the career they deserve' },
  { icon: '💰', label: 'Competitive compensation — benchmarked against international consulting rates' },
  { icon: '🗣️', label: 'Bilingual environment — French and English equally valued' },
];

export default function CareersPage() {
  const [applied, setApplied] = React.useState<string | null>(null);

  return (
    <>
      <MarketingNav />

      {/* HERO */}
      <section className="gradient-hero relative overflow-hidden pt-28 pb-16 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6">
          <Badge className="mb-4 border border-white/20 bg-white/10 text-white backdrop-blur-sm">
            Careers
          </Badge>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Join a Team That Has Lived the Journey
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-blue-100">
            We hire healthcare professionals with personal international licensing experience — because the best consultants are the ones who have done it themselves.
          </p>
        </div>
      </section>

      {/* WHY MJN */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3">Why MJN</Badge>
            <h2 className="text-4xl font-bold">What Working Here Looks Like</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map(({ icon, label }) => (
              <div key={label} className="flex items-start gap-3 rounded-2xl border border-border bg-white p-5 shadow-sm">
                <span className="text-2xl shrink-0">{icon}</span>
                <p className="text-sm text-muted-foreground leading-relaxed">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OPEN ROLES */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">Open Positions</Badge>
            <h2 className="text-4xl font-bold">Current Openings</h2>
          </div>
          <div className="space-y-4">
            {openRoles.map(({ title, type, location, dept, desc, requirements }) => (
              <div key={title} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{dept}</span>
                      <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> {type}
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {location}
                      </span>
                    </div>
                    <h3 className="font-bold text-foreground text-lg">{title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
                    <ul className="mt-3 space-y-1.5">
                      {requirements.map((r) => (
                        <li key={r} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <CheckCircle weight="fill" className="h-3.5 w-3.5 shrink-0 mt-0.5 text-teal-600" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="shrink-0">
                    {applied === title ? (
                      <div className="rounded-xl bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700">
                        Application sent ✓
                      </div>
                    ) : (
                      <Button onClick={() => setApplied(title)}>
                        Apply <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SPECULATIVE */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-border bg-white p-10 text-center shadow-sm">
            <h2 className="text-3xl font-bold text-foreground">Don&apos;t See the Right Role?</h2>
            <p className="mt-3 max-w-md mx-auto text-sm text-muted-foreground">
              We review speculative applications from healthcare professionals with international licensing experience. Send us your CV and a short note on how you could contribute.
            </p>
            <Button className="mt-6" asChild>
              <Link href="mailto:careers@mjnhealthcare.com">Send Speculative Application <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
