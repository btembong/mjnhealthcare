'use client';

import Link from 'next/link';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import {
  ArrowRight, CheckCircle, Users, GraduationCap, Buildings, Heartbeat,
} from '@phosphor-icons/react';

const programmes = [
  {
    icon: '🏥',
    title: 'In-Facility Clinical Skills Training',
    audience: 'Hospital & clinic workforce',
    desc: 'On-site or live-virtual training delivered to hospital teams — covering clinical procedures, patient safety, infection control, and evidence-based practice updates. Customised to your facility\'s protocols and delivered by specialist clinical educators.',
    format: 'On-site / Live-virtual',
  },
  {
    icon: '🩺',
    title: 'Community Health Worker Training',
    audience: 'Community health workers, CHVs',
    desc: 'Structured training programmes for community health workers in disease surveillance, maternal and child health, health education, and basic clinical triage — designed for contexts where fully licensed professionals are limited.',
    format: 'In-person & blended',
  },
  {
    icon: '📋',
    title: 'Health Systems Strengthening',
    audience: 'Hospital management, MOH teams',
    desc: 'Training for health administrators and ministry staff on quality improvement, facility accreditation preparation, health data management, and WHO-aligned patient safety standards.',
    format: 'Workshop-based',
  },
  {
    icon: '🔬',
    title: 'Simulation-Based Training',
    audience: 'Nursing students, junior doctors, clinical teams',
    desc: 'Hands-on simulation training at partner simulation centres — covering resuscitation, airway management, obstetric emergencies, and surgical scrub technique. Designed to build confidence in high-acuity scenarios before the ward.',
    format: 'In-person (simulation lab)',
  },
  {
    icon: '🌐',
    title: 'Digital Health & Telehealth Training',
    audience: 'Clinical and administrative staff',
    desc: 'Introduction to electronic health records, telehealth consultation delivery, health informatics, and digital patient safety — aligned to the growing digitalisation of African health systems.',
    format: 'Live-virtual',
  },
  {
    icon: '💉',
    title: 'Public Health Emergency Preparedness',
    audience: 'District health teams, hospital emergency committees',
    desc: 'Training in outbreak response protocols, IPC during high-risk events, WHO Emergency Use Listing guidance, and rapid health assessment — grounded in Cameroon and West African public health experience.',
    format: 'Workshop-based',
  },
];

const partners = [
  'Public hospitals and district health offices',
  'Mission and faith-based health facilities',
  'Private hospital groups and clinic networks',
  'University health science faculties',
  'National and regional ministries of health',
  'NGOs and development organisations',
];

const faqs = [
  {
    q: 'Is health training only available in Cameroon?',
    a: 'No — while our founding team and many of our clinical educator partners are based in Cameroon, we deliver health training across francophone and anglophone West and Central Africa. We also deliver virtual training globally. Contact us with your location and we will advise on feasibility.',
  },
  {
    q: 'Can you design a bespoke training programme for our facility?',
    a: 'Yes — all health training engagements are needs-assessed first. We conduct a training needs assessment (TNA) with your team before designing the programme, to ensure content is relevant to your facility\'s actual gaps, not a generic curriculum.',
  },
  {
    q: 'Are your clinical educators certified?',
    a: 'Yes — all MJN clinical educators hold current professional registration in their discipline and have a minimum of 5 years clinical experience. Simulation-based trainers hold recognised simulation educator credentials.',
  },
  {
    q: 'Can training be accredited for CPD purposes?',
    a: 'Where participants are licensed professionals, we structure training to generate verifiable CPD hours and issue CEU certificates. For unlicensed community health workers, we issue MJN competency certificates, which can be presented to employers and health authorities.',
  },
];

export default function HealthTrainingPage() {
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
            Health Training — Africa
          </Badge>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Comprehensive Health Training Across Africa
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-blue-100">
            Clinical skills training, community health worker programmes, simulation-based learning, and health systems capacity-building — delivered in partnership with African health facilities, universities, and ministries.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="rounded-xl bg-white px-8 text-primary shadow-lg hover:bg-white/90" asChild>
              <Link href="/contact">Request a Training Proposal <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-blue-100">
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-teal-300" /> Facility-customised programmes</span>
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-teal-300" /> Francophone & anglophone Africa</span>
            <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4 text-teal-300" /> CEU-verifiable certificates</span>
          </div>
        </div>
      </section>

      {/* PROGRAMMES */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3">Programmes</Badge>
            <h2 className="text-4xl font-bold">Health Training Programmes</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Six programme types — each customised after a training needs assessment to match your facility, team, and context.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {programmes.map(({ icon, title, audience, desc, format }) => (
              <div key={title} className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 text-xl">{icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="mt-0.5 text-xs font-medium text-primary">{audience}</p>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
                <div className="rounded-lg bg-muted/60 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  {format}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNERS */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge variant="outline" className="mb-3">Who We Train</Badge>
              <h2 className="text-4xl font-bold">Our Training Partners</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                We work with healthcare institutions of all sizes — from district hospitals to national ministries — designing programmes that fit their context and budget, not the other way around.
              </p>
              <ul className="mt-6 space-y-3">
                {partners.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <CheckCircle weight="fill" className="h-4 w-4 shrink-0 mt-0.5 text-teal-600" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-8" asChild>
                <Link href="/contact">Request a Proposal <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="rounded-3xl border border-border bg-gradient-to-br from-emerald-50 to-teal-50 p-8">
              <div className="mb-5 flex items-center gap-2">
                <Heartbeat className="h-5 w-5 text-primary" />
                <p className="font-semibold text-foreground">Why Africa-First Training?</p>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>Global training curricula often fail African health contexts — they assume infrastructure, equipment, and disease burdens that do not match local realities. Our programmes are designed by clinicians with African health system experience and adapted for your specific setting.</p>
                <p>We deliver in French and English, with facilitation teams who understand your context from the inside — not consultants parachuting in with generic slides.</p>
                <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Our approach</p>
                  <div className="mt-3 space-y-2 text-sm">
                    {['Training Needs Assessment first — always', 'Context-adapted content, not imported curricula', 'Built-in competency verification', 'Post-training follow-up and support'].map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <CheckCircle weight="fill" className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
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
            <h2 className="text-4xl font-bold">Health Training — Common Questions</h2>
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
            <h2 className="text-4xl font-bold">Train Your Team. Strengthen Your Facility.</h2>
            <p className="mx-auto mt-3 max-w-md text-blue-100">
              Contact us to begin a training needs assessment and receive a customised programme proposal within 5 business days.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="rounded-xl bg-white px-8 text-primary hover:bg-white/90" asChild>
                <Link href="/contact">Request a Training Proposal</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
