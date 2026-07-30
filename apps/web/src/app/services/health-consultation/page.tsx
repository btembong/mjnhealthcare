'use client';

import Link from 'next/link';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import {
  ArrowRight, CheckCircle, Clock, Shield, Stethoscope, Users, ChatCircle,
} from '@phosphor-icons/react';

const consultationTypes = [
  {
    icon: '🩺',
    title: 'Career & Licensing Advisory',
    duration: '30 min',
    desc: 'A focused one-on-one session with a consultant to assess your specific situation — qualifications, target destination, and current stage — and receive a clear recommendation on your next steps. No preparation required; bring your questions.',
    best: 'Best for: First-time enquirers, professionals comparing options',
  },
  {
    icon: '📋',
    title: 'Document Pre-Review',
    duration: '45 min',
    desc: 'Bring your credential documents — degree certificates, transcripts, registration letter — and our consultant pre-screens them against the specific requirements of your target licensing authority. We identify gaps before you submit, not after.',
    best: 'Best for: Professionals ready to start applications',
  },
  {
    icon: '🏥',
    title: 'Clinical Pathway Consultation',
    duration: '60 min',
    desc: 'A deep-dive session for complex cases — multiple qualifications, career breaks, specialty changes, or previous rejected applications. Your consultant reviews your full clinical history and maps the most viable pathway forward.',
    best: 'Best for: Complex profiles, previous application difficulties',
  },
  {
    icon: '💼',
    title: 'Pre-Interview Coaching',
    duration: '60 min',
    desc: 'Preparation for interviews with UAE hospitals, NHS trusts, or Irish HSE employers. Covers common clinical competency questions, cultural expectations of the employer, salary negotiation approach, and professional presentation in the target market.',
    best: 'Best for: Candidates with confirmed interview invitations',
  },
  {
    icon: '🔄',
    title: 'Re-Application Strategy Session',
    duration: '60 min',
    desc: 'For professionals whose application was rejected or stalled. We review the rejection reason, identify what can be addressed, and map a revised strategy — including whether an alternative destination or authority is more viable.',
    best: 'Best for: Anyone who received a rejection or query from a licensing body',
  },
  {
    icon: '🌍',
    title: 'Employer & Institutional Advisory',
    duration: 'Custom',
    desc: 'For hospitals, clinics, universities, and NGOs seeking expert advice on international healthcare workforce, regulatory compliance, or training programme design. We provide written advisory reports and facilitated workshops.',
    best: 'Best for: Institutions, HR teams, health system planners',
  },
];

const principles = [
  {
    title: 'Honest, not optimistic',
    desc: 'We tell you what is realistic for your specific situation — including when a pathway is unlikely to succeed and why. Generic optimism does not serve your career.',
  },
  {
    title: 'No conflicts of interest',
    desc: 'Our consultation fee is fixed and transparent. We do not earn commissions from exam prep providers, visa agents, or employers — our advice is not influenced by who pays us referral fees.',
  },
  {
    title: 'Regulated-domain expertise',
    desc: 'Healthcare licensing is a regulated, high-stakes domain. Our consultants have personal licensing experience or direct case management experience — not general career coaching transferred to healthcare.',
  },
  {
    title: 'Human review of AI drafts',
    desc: 'Where we use AI tools to support our analysis, all outputs are reviewed and validated by a consultant before they reach you. You receive expert judgement, not raw AI output.',
  },
];

const faqs = [
  {
    q: 'Is a consultation required before I start a full engagement?',
    a: 'The initial 30-minute career and licensing advisory consultation is free and included as the first step of any full engagement. Specialist consultations (document pre-review, clinical pathway, re-application strategy) are billed separately and can be booked independently.',
  },
  {
    q: 'Can I book a consultation if I am not ready to commit to a full engagement?',
    a: 'Yes — all consultation types are available on a standalone basis. Many clients use an initial consultation to assess whether MJN is the right fit before signing an engagement. There is no obligation to proceed.',
  },
  {
    q: 'How are consultations delivered?',
    a: 'All consultations are delivered via video call (Google Meet or Zoom, your choice). Recordings are available if you want to refer back to the session. We accommodate scheduling across West African time zones (WAT), UK time, and Gulf time.',
  },
  {
    q: 'Are consultations available in French?',
    a: 'Yes — all consultation types are available in French. When booking, specify your language preference and we assign a French-speaking consultant. Written deliverables are also available in French.',
  },
  {
    q: 'What is the difference between a consultation and the AI Study Assistant?',
    a: 'The AI Study Assistant in the Academy is focused on exam preparation — answering clinical questions, explaining question rationale, and generating study plans for NCLEX, CBT, DHA, etc. A human consultation covers licensing strategy, document review, career planning, and interview coaching — domains that require professional judgement and accountability.',
  },
];

export default function HealthConsultationPage() {
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
            Personalised Consultation
          </Badge>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Personalised Healthcare Consultation — Expert Advice for Your Specific Situation
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-blue-100">
            One-on-one expert consultation with healthcare professionals who have lived the licensing journey — for career advisory, document pre-screening, pathway planning, interview coaching, and re-application strategy.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="rounded-xl bg-white px-8 text-primary shadow-lg hover:bg-white/90" asChild>
              <Link href="/get-started">Book a Consultation <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-blue-100">
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-teal-300" /> First consultation free</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-teal-300" /> 30–90 minute sessions</span>
            <span className="flex items-center gap-1.5"><ChatCircle className="h-4 w-4 text-teal-300" /> English and French</span>
          </div>
        </div>
      </section>

      {/* CONSULTATION TYPES */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3">Consultation Types</Badge>
            <h2 className="text-4xl font-bold">Six Consultation Formats</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Different career stages need different expert conversations. Choose the format that fits your situation.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {consultationTypes.map(({ icon, title, duration, desc, best }) => (
              <div key={title} className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 text-xl">{icon}</div>
                  <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {duration}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
                <p className="text-xs font-medium text-primary">{best}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">Our Principles</Badge>
            <h2 className="text-4xl font-bold">What Makes Our Consultations Different</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {principles.map(({ title, desc }) => (
              <div key={title} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground">{title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
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
            <h2 className="text-4xl font-bold">Consultations — Common Questions</h2>
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
            <h2 className="text-4xl font-bold">Get Expert Advice — Not Generic Guidance</h2>
            <p className="mx-auto mt-3 max-w-md text-blue-100">
              Book your free 30-minute advisory consultation. No obligation, no jargon — just honest, specific advice for your situation.
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
