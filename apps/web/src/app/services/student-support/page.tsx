'use client';

import Link from 'next/link';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import {
  ArrowRight, CheckCircle, Clock, Shield, GraduationCap, Users, BookOpen,
} from '@phosphor-icons/react';

const services = [
  {
    icon: '🎓',
    title: 'University Application Assistance',
    desc: 'We guide healthcare students through the application process for partner universities in the UK, Ireland, Canada, and Australia — personal statement drafting, reference coordination, and submission tracking.',
  },
  {
    icon: '✈️',
    title: 'Study Abroad Placement',
    desc: 'Structured short and long-term study-abroad programmes at institutions with formal MJN partnerships. We handle application, visa orientation, pre-departure briefing, and in-country orientation.',
  },
  {
    icon: '🏥',
    title: 'Clinical Internship Placement',
    desc: 'Internship placement with partner hospitals and health facilities — locally within Africa and internationally. We match students to positions that count toward registration-eligible clinical hours.',
  },
  {
    icon: '📋',
    title: 'Licensing Pathway Planning',
    desc: 'For penultimate and final-year students: early pathway mapping so you graduate already knowing your credential requirements, exam timelines, and destination options. Start before you qualify — finish faster.',
  },
  {
    icon: '💰',
    title: 'Scholarship & Funding Guidance',
    desc: 'We maintain a curated database of scholarships, bursaries, and health-sector funding open to African students. Your consultant identifies applicable opportunities and guides the application.',
  },
  {
    icon: '🤝',
    title: 'Mentorship Matching',
    desc: 'We connect students with MJN-placed healthcare professionals working in their target country — for real-world advice on the profession, culture, and career pathway that no textbook provides.',
  },
];

const nonHealthcareServices = [
  {
    icon: '🎓',
    title: 'University Application Support',
    desc: 'Guidance on applying to pre-medicine, biomedical science, public health, and health management programmes at universities in the UK, Ireland, Canada, and Australia.',
  },
  {
    icon: '✈️',
    title: 'Study-Abroad Placement',
    desc: 'Short and long-term exchange placements at partner institutions — ideal for pre-med and science students who want international academic exposure before entering a health profession.',
  },
  {
    icon: '🔬',
    title: 'Research & Lab Internships',
    desc: 'Placement in research labs, public health organisations, and hospital administrative departments — for students who want health-adjacent experience without a clinical role.',
  },
  {
    icon: '💡',
    title: 'Career Pathway Advising',
    desc: 'Not sure whether to pursue medicine, nursing, pharmacy, or allied health? We map the realistic path from your current education to your target profession — including entry requirements, timelines, and costs.',
  },
];

const eligibility = [
  'Nursing students (year 2 and above)',
  'Medical / MBBS students (year 3 and above)',
  'Allied health students (physiotherapy, pharmacy, radiology, etc.)',
  'Recent graduates seeking internship placement',
  'Graduates awaiting licensing who want structured career planning',
];

const faqs = [
  {
    q: 'Do you work with students who have not yet graduated?',
    a: 'Yes — we actively recommend students engage with us in their penultimate year. Early pathway planning can save 6–12 months post-graduation by ensuring you graduate with the right clinical hours documentation, the right institution records, and a clear licensing plan already in motion.',
  },
  {
    q: 'Can you place me for a clinical internship that counts toward licensing requirements?',
    a: 'It depends on the destination. For UAE licensing (DataFlow), international clinical experience is counted — but specific minimum-hours requirements apply. For NMC (UK), post-registration hours count. Your consultant clarifies exactly what your target licensing body will recognise before we place you.',
  },
  {
    q: 'How are study-abroad programmes different from university applications?',
    a: 'University applications are for full degree programmes (3–6 years). Study-abroad placements are for shorter structured exchanges — typically 1–12 months — that supplement your home-university degree. We offer both, and the right choice depends on your stage and goals.',
  },
  {
    q: 'Do I need to be in Cameroon to access student support?',
    a: 'No — our student support services are remote-first. Consultations are online, document review is digital, and our university and internship network spans multiple countries. French and English support available.',
  },
];

export default function StudentSupportPage() {
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
            Student Support
          </Badge>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Student Support — From Student to Licensed Professional
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-blue-100">
            University applications, study-abroad placements, clinical internships, and early licensing pathway planning — all designed to bridge the gap between African healthcare education and international professional registration.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="rounded-xl bg-white px-8 text-primary shadow-lg hover:bg-white/90" asChild>
              <Link href="/get-started">Book Free Consultation <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-blue-100">
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-teal-300" /> 300+ students supported</span>
            <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4 text-teal-300" /> University + internship placement</span>
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-teal-300" /> English and French support</span>
          </div>
        </div>
      </section>

      {/* SERVICES — Healthcare students */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3">Healthcare Students</Badge>
            <h2 className="text-4xl font-bold">For Nursing, Medical &amp; Allied Health Students</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Six service tracks — each available as a standalone engagement or as part of an early-career bundle.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map(({ icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 text-xl">{icon}</div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES — Non-healthcare / pre-medicine students */}
      <section className="bg-muted/20 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3">Pre-Medicine &amp; General Health Students</Badge>
            <h2 className="text-4xl font-bold">Not Yet in a Health Programme?</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              We also support pre-medicine, biomedical, public health, and general science students who are working toward a health career — from university placement to career pathway mapping.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {nonHealthcareServices.map(({ icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-xl">{icon}</div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild>
              <Link href="/get-started">Book a Guidance Session <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ELIGIBILITY */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge variant="outline" className="mb-3">Who This Is For</Badge>
              <h2 className="text-4xl font-bold">Who Qualifies for Student Support</h2>
              <p className="mt-4 text-muted-foreground">
                Our student support services are designed for African healthcare students and recent graduates who intend to pursue international registration or gain clinical experience abroad.
              </p>
              <ul className="mt-6 space-y-3">
                {eligibility.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <CheckCircle weight="fill" className="h-4 w-4 shrink-0 mt-0.5 text-teal-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-8" asChild>
                <Link href="/get-started">Start Your Journey <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="rounded-3xl border border-border bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
              <div className="mb-5 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <p className="font-semibold text-foreground">Why Start Early?</p>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>Most internationally educated healthcare professionals lose 12–24 months post-graduation because they begin licensing preparation too late — documents are incomplete, institution records are hard to retrieve, and the licensing process is unfamiliar.</p>
                <p>Students who engage with us in their second or third year arrive at graduation with their licensing plan ready to execute immediately.</p>
                <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time saved by early planning</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Document preparation</span>
                      <span className="font-bold text-foreground">3–6 months</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Institution record retrieval</span>
                      <span className="font-bold text-foreground">2–4 months</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Exam preparation head start</span>
                      <span className="font-bold text-foreground">4–8 months</span>
                    </div>
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
            <h2 className="text-4xl font-bold">Student Support — Common Questions</h2>
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
            <h2 className="text-4xl font-bold">Start Planning Your International Career Now</h2>
            <p className="mx-auto mt-3 max-w-md text-blue-100">
              The earlier you start, the faster you qualify. Book a free consultation and we&apos;ll map your timeline from where you are today.
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
