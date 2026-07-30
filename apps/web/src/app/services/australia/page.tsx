'use client';

import Link from 'next/link';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import { ArrowRight, CheckCircle, Clock, FileText, Users, Star } from '@phosphor-icons/react';

const steps = [
  {
    n: '1',
    title: 'AHPRA / AMC Application',
    desc: 'AHPRA (Australian Health Practitioner Regulation Agency) registers nurses and allied health; AMC (Australian Medical Council) assesses international doctors. We prepare and submit your complete application — credentials, good-standing certificate, English evidence.',
    weeks: '4–8 weeks',
  },
  {
    n: '2',
    title: 'Credential & Skills Assessment',
    desc: 'AHPRA conducts a skills assessment of your overseas qualifications. For nurses this includes verification with your home country registration authority. For allied health, profession-specific assessment bodies apply. We manage all correspondence.',
    weeks: '8–16 weeks',
  },
  {
    n: '3',
    title: 'English Language Requirements',
    desc: 'IELTS Academic (overall 7.0, no band below 7.0) or OET (Grade B in all four components). Exemptions apply in limited circumstances. We assess your eligibility and recommend the most efficient preparation route.',
    weeks: '4–8 weeks prep',
  },
  {
    n: '4',
    title: 'AMC MCQ + Clinical Exam (Physicians)',
    desc: 'Physicians sit the AMC Multiple Choice Questionnaire examination followed by the AMC Clinical Examination (OSCE-based). We connect you with AMC MCQ preparation resources through the Academy and support with clinical exam logistics.',
    weeks: '6–12 months total',
  },
  {
    n: '5',
    title: 'Registration & Job Placement',
    desc: 'Once AHPRA/AMC grants registration we connect you to healthcare employer partners across New South Wales, Victoria, Queensland, and Western Australia. We support your skilled visa application (subclass 482 or 189/190 for permanent residency track).',
    weeks: '4–8 weeks',
  },
];

const included = [
  'AHPRA / AMC application preparation and submission',
  'Skills and credential assessment management',
  'English test eligibility assessment (IELTS vs. OET)',
  'AMC MCQ exam preparation access via Academy',
  'OSCE / Clinical exam preparation referral',
  'Employer network — NSW, VIC, QLD, WA',
  'Skilled visa support (subclass 482 / 189 / 190)',
  'Status updates at every stage',
];

const bodies = [
  { authority: 'AHPRA', full: 'Australian Health Practitioner Regulation Agency', profession: 'Nurses & Allied Health', flag: '🇦🇺' },
  { authority: 'AMC', full: 'Australian Medical Council', profession: 'Physicians', flag: '🇦🇺' },
  { authority: 'NMBA', full: 'Nursing and Midwifery Board of Australia', profession: 'Nurses & Midwives (via AHPRA)', flag: '🇦🇺' },
  { authority: 'ANMAC', full: 'Australian Nursing & Midwifery Accreditation Council', profession: 'Skilled migration pathway', flag: '🇦🇺' },
];

const faqs = [
  {
    q: 'How long does AHPRA registration take for nurses?',
    a: 'From application submission to registration decision, AHPRA typically takes 3–6 months depending on how quickly your home country authority responds to verification requests. We manage all follow-up to minimise delays.',
  },
  {
    q: 'Do I need to complete the AMC examinations?',
    a: 'Yes, for physicians. The AMC MCQ exam is held multiple times per year and can be sat internationally at select centres. The AMC Clinical Examination is held in Australia and must be passed before specialist recognition. We help you plan the timeline.',
  },
  {
    q: 'What states have the most demand for overseas nurses?',
    a: 'New South Wales, Queensland, and Western Australia currently have the highest active recruitment from overseas-trained nurses, including active state-sponsored visa pathways. We match you to employers in states where your profile has the strongest fit.',
  },
  {
    q: 'Can I get permanent residency through healthcare?',
    a: 'Yes. Nursing and several allied health professions are on Australia\'s Medium and Long-term Strategic Skills List (MLTSSL), making direct PR pathways (subclass 189 or state-sponsored 190) available after skill assessment. We connect you to a registered migration agent for this step.',
  },
];

export default function AustraliaPage() {
  return (
    <>
      <MarketingNav />

      {/* HERO */}
      <section className="gradient-hero relative overflow-hidden pt-28 pb-16 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">🇦🇺</span>
            <Badge className="border border-white/20 bg-white/10 text-white backdrop-blur-sm">Australia</Badge>
          </div>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Australian Healthcare Licensing — AHPRA, AMC & Skilled Visa Support
          </h1>
          <p className="mt-5 max-w-xl text-lg text-blue-100">
            End-to-end support for nurses, physicians, and allied health professionals through AHPRA registration, AMC examination, and employer placement across Australia.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="rounded-xl bg-white px-7 text-primary shadow-lg hover:bg-white/90" asChild>
              <Link href="/get-started">Book Free Consultation <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20" asChild>
              <Link href="/pricing">See Pricing</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-6 text-sm text-blue-200">
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Avg. 9–15 months</span>
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> Nurses · Physicians · Allied Health</span>
            <span className="flex items-center gap-1.5"><Star className="h-4 w-4" /> PR pathway available</span>
          </div>
        </div>
      </section>

      {/* REGULATORY BODIES */}
      <section className="px-6 py-12 border-b border-border">
        <div className="mx-auto max-w-6xl">
          <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Regulatory bodies we work with</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {bodies.map(({ authority, full, profession, flag }) => (
              <div key={authority} className="flex items-start gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm">
                <span className="text-2xl mt-0.5">{flag}</span>
                <div>
                  <p className="font-bold text-foreground">{authority}</p>
                  <p className="text-xs text-muted-foreground">{full}</p>
                  <p className="mt-1 text-xs font-medium text-primary">{profession}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PATHWAY STEPS */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">The Pathway</Badge>
            <h2 className="text-4xl font-bold">Five Steps to Australian Registration</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Australia requires some of the highest English standards globally — but the PR pathway and working conditions make it one of the most sought-after destinations.
            </p>
          </div>
          <div className="space-y-4">
            {steps.map(({ n, title, desc, weeks }) => (
              <div key={n} className="flex gap-5 rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">{n}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-bold text-foreground">{title}</h3>
                    <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">{weeks}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT'S INCLUDED */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <div>
              <Badge variant="outline" className="mb-3">What's Included</Badge>
              <h2 className="text-4xl font-bold">Full Support Through Every Stage</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                The Australian pathway involves multiple bodies — AHPRA or AMC for registration, ANMAC for skills migration, and the Department of Home Affairs for visa. We coordinate all of them.
              </p>
              <ul className="mt-6 space-y-3">
                {included.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" weight="fill" />
                    <span className="text-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl bg-primary/5 border border-primary/20 p-8">
              <FileText className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">The PR Advantage</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Nursing and several allied health professions are on Australia's MLTSSL — meaning direct permanent residency pathways (subclass 189 or state-sponsored 190) are available after successful skill assessment. This makes Australia one of the few destinations where a healthcare career can lead to PR within 2–3 years.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We connect you to a registered migration agent at the right stage — not as an afterthought once you're already licensed.
              </p>
              <Button className="mt-6 w-full" asChild>
                <Link href="/get-started">Assess My Eligibility <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">FAQ</Badge>
            <h2 className="text-4xl font-bold">Australia — Common Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map(({ q, a }) => (
              <div key={q} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <h3 className="font-bold text-foreground mb-2">{q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-4xl">
          <div className="gradient-hero relative overflow-hidden rounded-3xl p-10 text-center text-white">
            <div className="relative">
              <h2 className="text-4xl font-bold">Ready to Start Your Australian Journey?</h2>
              <p className="mx-auto mt-3 max-w-md text-blue-100">
                Book a free consultation to assess your eligibility, map the right pathway, and get a realistic timeline including PR options.
              </p>
              <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button size="lg" className="rounded-xl bg-white px-8 text-primary hover:bg-white/90" asChild>
                  <Link href="/get-started">Book Free Consultation</Link>
                </Button>
                <Button size="lg" variant="ghost" className="text-white hover:bg-white/10" asChild>
                  <Link href="/pricing">See Pricing →</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
