'use client';

import Link from 'next/link';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import {
  ArrowRight, CheckCircle, Clock, Shield, MapPin, House, Airplane,
} from '@phosphor-icons/react';

const phases = [
  {
    phase: 'Pre-Departure',
    icon: '📋',
    items: [
      'Destination country orientation briefing (culture, laws, workplace norms)',
      'Cost-of-living breakdown and initial budgeting guide',
      'Banking setup guide (opening a UAE/UK/Irish bank account before arrival)',
      'SIM card and mobile plan recommendations',
      'What to pack — climate, professional dress code, and documentation checklist',
    ],
  },
  {
    phase: 'Arrival & First 30 Days',
    icon: '✈️',
    items: [
      'Airport pickup coordination with verified partner',
      'Temporary accommodation (first 1–4 weeks) — serviced apartment bookings near your employer',
      'Emirates ID / Irish PPS / UK NI Number registration support',
      'Health insurance registration (mandatory in UAE; NHS registration in UK/Ireland)',
      'Driving licence conversion or international licence guidance',
    ],
  },
  {
    phase: 'Settling In',
    icon: '🏠',
    items: [
      'Long-term housing search support — areas near your hospital, realistic rent budgets, contract review',
      'School search for accompanying children (British curriculum, CBSE, Irish schools)',
      'Spouse/dependent visa registration steps',
      'Professional registration card (UAE ID, NMC smartcard, etc.) tracking',
      'Community connection — MJN alumni network in your destination city',
    ],
  },
  {
    phase: 'First 90 Days',
    icon: '📞',
    items: [
      'Check-in call at 30, 60, and 90 days post-arrival',
      'Escalation support if employer onboarding issues arise',
      'Salary/payroll first-payment confirmation support',
      'Referral to trusted local professionals (accountants, family lawyers, tax advisors)',
    ],
  },
];

const destinations = ['UAE (Dubai, Abu Dhabi, Sharjah)', 'United Kingdom (England, Scotland, Wales)', 'Ireland (Dublin and regional HSE)', 'United States (select employer-sponsored placements)'];

const faqs = [
  {
    q: 'Is relocation assistance included in the licensing service or is it separate?',
    a: 'Relocation assistance is a separate service add-on, available to all clients who have a confirmed job offer — whether from our employer network or independently sourced. It can be added to your existing engagement at any stage.',
  },
  {
    q: 'Do you arrange airport pickup and accommodation directly?',
    a: 'Yes — we coordinate with verified local partners in each destination city. We do not directly own accommodation or transport, but we have pre-vetted partners with track records of supporting newly arrived healthcare professionals.',
  },
  {
    q: 'What about my family — spouse and children?',
    a: 'Family relocation is explicitly part of our service. We cover dependant visa steps, school search for children, and spouse work authorisation orientation (especially relevant for UAE and Ireland where rules differ significantly by visa type).',
  },
  {
    q: 'What if I have a problem with my employer after I arrive?',
    a: 'We remain your point of contact for 90 days post-arrival. If employment issues arise, we escalate with the employer on your behalf and advise on the appropriate regulatory or legal steps. We refer to employment lawyers in-country where needed.',
  },
];

export default function RelocationPage() {
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
            Relocation & Onboarding
          </Badge>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Onboarding & Relocation Assistance — From Offer Letter to Settled In
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-blue-100">
            Landing in a new country with a new job and no local knowledge is overwhelming. Our relocation service handles the practical details — housing, banking, registration, schools, and 90-day check-ins — so you can focus on excelling in your new role.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="rounded-xl bg-white px-8 text-primary shadow-lg hover:bg-white/90" asChild>
              <Link href="/get-started">Add Relocation Support <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-blue-100">
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-teal-300" /> Pre-departure through 90 days settled</span>
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-teal-300" /> UAE, UK, Ireland, US</span>
            <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-teal-300" /> Family relocation included</span>
          </div>
        </div>
      </section>

      {/* PHASES */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3">What&apos;s Covered</Badge>
            <h2 className="text-4xl font-bold">Four Phases, Zero Surprises</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              From the moment you accept your offer to 90 days after arrival — every practical need covered.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {phases.map(({ phase, icon, items }) => (
              <div key={phase} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-2xl">{icon}</span>
                  <h3 className="font-bold text-foreground">{phase}</h3>
                </div>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle weight="fill" className="h-3.5 w-3.5 shrink-0 mt-0.5 text-teal-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DESTINATIONS */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="outline" className="mb-3">Available Destinations</Badge>
          <h2 className="text-4xl font-bold mb-8">Where We Have Local Partner Networks</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {destinations.map((d) => (
              <div key={d} className="flex items-center gap-3 rounded-xl border border-border bg-white p-4">
                <MapPin weight="fill" className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground">{d}</span>
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
            <h2 className="text-4xl font-bold">Relocation — Common Questions</h2>
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
            <h2 className="text-4xl font-bold">Move With Confidence — Not Just a Plane Ticket</h2>
            <p className="mx-auto mt-3 max-w-md text-blue-100">
              Add relocation support to your existing engagement or start a standalone relocation consultation if you have a confirmed offer.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="rounded-xl bg-white px-8 text-primary hover:bg-white/90" asChild>
                <Link href="/get-started">Book Relocation Consultation</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
