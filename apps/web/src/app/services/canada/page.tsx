'use client';

import Link from 'next/link';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import { ArrowRight, CheckCircle, Clock, Users, GraduationCap, IdentificationCard, FileText, Shield } from '@phosphor-icons/react';

// ── Express Entry steps ──────────────────────────────────────────────────────

const eeSteps = [
  {
    n: '1',
    title: 'Eligibility Assessment & Profile Creation',
    desc: 'We assess your eligibility under the Federal Skilled Worker (FSW), Canadian Experience Class (CEC), or Federal Skilled Trades (FST) programme. We build your Express Entry profile and calculate your initial CRS (Comprehensive Ranking System) score.',
    time: '1–2 weeks',
  },
  {
    n: '2',
    title: 'CRS Score Enhancement Strategy',
    desc: 'We identify the highest-impact ways to improve your score — language retests, additional qualifications, provincial nomination (PNP) alignment, or a qualifying Canadian job offer. Every point matters in competitive draw rounds.',
    time: '2–8 weeks',
  },
  {
    n: '3',
    title: 'Express Entry Pool — Active Monitoring',
    desc: 'Your profile is live in the pool. We monitor draw rounds and CRS cut-offs, alert you immediately when an Invitation to Apply (ITA) is issued, and advise on provincial nominee streams that could give you a guaranteed ITA outside the general draw.',
    time: 'Ongoing',
  },
  {
    n: '4',
    title: 'Invitation to Apply (ITA) Received',
    desc: 'You have 60 days to submit a complete PR application after receiving an ITA. We begin document collection and preparation immediately so nothing is rushed.',
    time: '60-day window',
  },
  {
    n: '5',
    title: 'Full PR Application Submitted to IRCC',
    desc: 'We compile and submit your complete application — police clearance certificates from every country you have lived in, proof of funds, employment history, passport photos, and relationship documents for dependants.',
    time: '4–6 weeks prep',
  },
  {
    n: '6',
    title: 'Medical Examination & Biometrics',
    desc: 'We guide you to an IRCC-approved panel physician for your immigration medical exam and to a VAC (Visa Application Centre) for biometrics. Both must be completed within IRCC\'s deadline.',
    time: '2–4 weeks',
  },
  {
    n: '7',
    title: 'COPR Issued & Landing in Canada',
    desc: 'Once IRCC approves your application, your Confirmation of Permanent Residence (COPR) and PR visa are issued. We brief you on the landing process, port of entry requirements, and SIN/provincial health card registration.',
    time: '1–2 weeks',
  },
];

// ── Study permit steps ───────────────────────────────────────────────────────

const spSteps = [
  {
    n: '1',
    title: 'School / College Selection & Application',
    desc: 'We help you identify DLI (Designated Learning Institution) schools matched to your academic profile, career goals, and budget — universities, colleges, and polytechnics across Ontario, BC, Alberta, Quebec, and beyond.',
    time: '2–4 weeks',
  },
  {
    n: '2',
    title: 'Letter of Acceptance (LOA) Secured',
    desc: 'We manage the application process with your chosen institution(s), follow up on admission decisions, and advise on conditional offers. Your LOA is the foundation of your study permit application.',
    time: '4–8 weeks',
  },
  {
    n: '3',
    title: 'Provincial Attestation Letter (PAL)',
    desc: 'Since Canada\'s 2024 study permit reforms, most applicants require a PAL from the provincial government before IRCC will process their study permit. We manage this submission on your behalf.',
    time: '2–4 weeks',
  },
  {
    n: '4',
    title: 'Study Permit Application (IMM 1294)',
    desc: 'We prepare your complete IRCC study permit application — LOA, PAL, proof of funds (tuition + living costs), police clearance, passport photos, and medical exam if required by your nationality.',
    time: '3–5 weeks',
  },
  {
    n: '5',
    title: 'Biometrics',
    desc: 'Most applicants must provide biometrics at a VAC. We confirm whether you are exempt (valid prior biometrics) and book your appointment if needed.',
    time: '1–2 weeks',
  },
  {
    n: '6',
    title: 'Study Permit Issued & Pre-departure Orientation',
    desc: 'We brief you on arrival requirements, port of entry confirmation, SIN registration, provincial health coverage (OHIP / MSP / AHCIP), and post-graduation work permit (PGWP) planning so you arrive prepared.',
    time: '1–2 weeks',
  },
];

// ── Healthcare licensing steps ───────────────────────────────────────────────

const hlSteps = [
  {
    n: '1',
    title: 'NNAS Advisory Report',
    desc: 'The National Nursing Assessment Service (NNAS) evaluates international nursing credentials for all Canadian provinces. We compile and submit your full NNAS application — transcripts, registration verification, and language test results.',
    time: '4–6 months',
  },
  {
    n: '2',
    title: 'Provincial College Application',
    desc: 'Once NNAS issues your Advisory Report, we apply to your target provincial college — CNO (Ontario), BCCNM (BC), CARNA (Alberta) — on your behalf. Requirements vary slightly by province; we advise on the fastest route for your credentials.',
    time: '4–8 weeks',
  },
  {
    n: '3',
    title: 'Language Proficiency',
    desc: 'IELTS Academic (overall 7.0) or CELBAN (CLB 9 in all areas) for nurses. We assess your current level and recommend the most efficient preparation route.',
    time: '4–8 weeks prep',
  },
  {
    n: '4',
    title: 'NCLEX-RN Examination',
    desc: 'Canada adopted NCLEX-RN for RN licensure. We enrol you in our NCLEX Academy module — structured study plan, 2,500+ NGN-format questions, and live instructor sessions.',
    time: '8–14 weeks prep',
  },
  {
    n: '5',
    title: 'Registration & Job Placement',
    desc: 'On registration, we connect you to our healthcare employer network across Ontario, BC, Alberta, and Saskatchewan. For those also pursuing PR, we align the job offer with your Express Entry profile for maximum CRS impact.',
    time: '4–8 weeks',
  },
];

// ── Shared data ──────────────────────────────────────────────────────────────

const faqs = [
  {
    q: 'Can I do Express Entry and healthcare licensing at the same time?',
    a: 'Yes — and it is often the smartest strategy. A Canadian job offer from a healthcare employer can add up to 200 CRS points to your Express Entry profile, potentially guaranteeing an ITA outside the general draw. We coordinate both tracks simultaneously.',
  },
  {
    q: 'What CRS score do I need for Express Entry?',
    a: 'Cut-off scores vary by draw round and programme. General FSW draws have ranged from 470–560 in recent years. Provincial Nominee Programme (PNP) aligned draws often have lower cut-offs and provide a near-guaranteed ITA. We assess your realistic score at the outset.',
  },
  {
    q: 'Which province should I target for my study permit?',
    a: 'Ontario and British Columbia host the largest institution networks, but Manitoba, New Brunswick, and Saskatchewan offer faster admission pipelines and lower cost of living. We match province to your programme, budget, and post-graduation work goals.',
  },
  {
    q: 'How long does NNAS take for nursing registration?',
    a: 'NNAS Advisory Reports typically take 4–6 months from submission, depending on how quickly your institutions respond to verification requests. We manage all follow-up communications and flag delays early.',
  },
  {
    q: 'Can I bring my family on a study permit or during Express Entry?',
    a: 'Study permit holders can include a spouse on an open work permit and dependent children. Express Entry PR holders can include family members in the same application. We provide full dependant briefings as part of your engagement.',
  },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CanadaPage() {
  return (
    <>
      <MarketingNav />

      {/* HERO */}
      <section className="gradient-hero relative overflow-hidden pt-28 pb-16 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-red-400/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-5xl">🇨🇦</span>
            <Badge className="border border-white/20 bg-white/10 text-white backdrop-blur-sm text-sm px-3 py-1">Canada</Badge>
          </div>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Canada — Three Pathways, One Partner
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-blue-100">
            Express Entry PR · Healthcare Licensing (NNAS / NCLEX) · Student Support (Study Permit).
            We manage the full journey — whichever route you take.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="rounded-xl bg-white px-7 text-primary shadow-lg hover:bg-white/90" asChild>
              <Link href="/get-started">Book Free Consultation <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-blue-200">
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> Nurses · Physicians · Students · Skilled Workers</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> All routes managed in-house</span>
          </div>
        </div>
      </section>

      {/* ROUTE SELECTOR CARDS */}
      <section className="px-6 py-14 border-b border-border bg-muted/20">
        <div className="mx-auto max-w-6xl">
          <p className="mb-8 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">Choose your pathway</p>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                icon: <IdentificationCard className="h-7 w-7 text-primary" />,
                title: 'Express Entry PR',
                desc: 'Permanent residency via the federal points-based system — Federal Skilled Worker, CEC, or Provincial Nominee. Fastest route to Canadian PR for qualified professionals.',
                time: '6–18 months',
                href: '#express-entry',
                color: 'border-primary/20 bg-primary/5',
              },
              {
                icon: <GraduationCap className="h-7 w-7 text-emerald-600" />,
                title: 'Student Support',
                desc: 'School selection, Letter of Acceptance, Provincial Attestation Letter, Study Permit (IMM 1294), and pre-departure orientation. Full end-to-end management.',
                time: '3–6 months',
                href: '#student-support',
                color: 'border-emerald-200 bg-emerald-50/60',
              },
              {
                icon: <FileText className="h-7 w-7 text-violet-600" />,
                title: 'Healthcare Licensing',
                desc: 'NNAS Advisory Report, provincial college registration (CNO, BCCNM, CARNA), NCLEX-RN preparation, and employer matching across Ontario, BC, Alberta, and Saskatchewan.',
                time: '8–14 months',
                href: '#healthcare',
                color: 'border-violet-200 bg-violet-50/60',
              },
            ].map((r) => (
              <a key={r.title} href={r.href} className={`group rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow ${r.color}`}>
                <div className="mb-4">{r.icon}</div>
                <h3 className="font-bold text-foreground text-lg mb-2">{r.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{r.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {r.time}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* EXPRESS ENTRY */}
      <section id="express-entry" className="px-6 py-16 scroll-mt-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10">
            <Badge variant="outline" className="mb-3">Express Entry PR</Badge>
            <h2 className="text-4xl font-bold">Your Route to Canadian Permanent Residency</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">
              Express Entry is Canada&apos;s federal points-based system for skilled worker immigration. IRCC runs draw rounds regularly — applicants above the CRS cut-off receive an Invitation to Apply for PR. We manage the full process from profile creation to landing.
            </p>
          </div>
          <div className="space-y-4">
            {eeSteps.map(({ n, title, desc, time }) => (
              <div key={n} className="flex gap-5 rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">{n}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-bold text-foreground">{title}</h3>
                    <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground whitespace-nowrap">{time}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Healthcare professionals have a CRS advantage</p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  A qualifying Canadian job offer from a healthcare employer adds up to 200 CRS points — often the difference between a general draw and a guaranteed ITA. If you are also pursuing NNAS registration, we align both timelines so your job offer and licensing are coordinated.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STUDENT SUPPORT */}
      <section id="student-support" className="bg-muted/20 px-6 py-16 scroll-mt-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10">
            <Badge variant="outline" className="mb-3">Student Support</Badge>
            <h2 className="text-4xl font-bold">Study in Canada — End-to-End Managed</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">
              From school selection to arriving at your institution, we handle every step of the Canadian study permit process — including the new Provincial Attestation Letter requirement introduced in 2024.
            </p>
          </div>
          <div className="space-y-4">
            {spSteps.map(({ n, title, desc, time }) => (
              <div key={n} className="flex gap-5 rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-700">{n}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-bold text-foreground">{title}</h3>
                    <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground whitespace-nowrap">{time}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <div className="flex items-start gap-3">
              <GraduationCap className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Post-Graduation Work Permit (PGWP)</p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Most graduates of eligible Canadian programmes can apply for a PGWP of up to 3 years — giving you Canadian work experience that directly feeds into an Express Entry CEC profile. We plan your PGWP strategy from day one of your study permit engagement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HEALTHCARE LICENSING */}
      <section id="healthcare" className="px-6 py-16 scroll-mt-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10">
            <Badge variant="outline" className="mb-3">Healthcare Licensing</Badge>
            <h2 className="text-4xl font-bold">NNAS, NCLEX-RN & Provincial Registration</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">
              Canadian nursing registration is provincially controlled — NNAS is the national gateway, but provincial colleges each set their own requirements. We manage every submission and follow-up across the process.
            </p>
          </div>
          <div className="grid gap-10 lg:grid-cols-3 mb-10">
            {[
              { authority: 'NNAS', full: 'National Nursing Assessment Service', note: 'All nurses — national gateway' },
              { authority: 'CNO / BCCNM / CARNA', full: 'Provincial Nursing Colleges', note: 'Ontario · BC · Alberta (and others)' },
              { authority: 'MCCQE / CEHPEA', full: 'Medical Council of Canada / CEHPEA', note: 'Physicians & Allied Health' },
            ].map((b) => (
              <div key={b.authority} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <p className="text-lg font-extrabold text-primary">{b.authority}</p>
                <p className="text-xs font-medium text-foreground mt-1">{b.full}</p>
                <p className="mt-2 text-xs text-muted-foreground">{b.note}</p>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {hlSteps.map(({ n, title, desc, time }) => (
              <div key={n} className="flex gap-5 rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-sm font-bold text-violet-700">{n}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-bold text-foreground">{title}</h3>
                    <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground whitespace-nowrap">{time}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/20 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">FAQ</Badge>
            <h2 className="text-4xl font-bold">Canada — Common Questions</h2>
          </div>
          <div className="divide-y divide-border rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
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
            <h2 className="text-4xl font-bold">Ready to Start Your Canada Journey?</h2>
            <p className="mx-auto mt-3 max-w-md text-blue-100">
              Book a free consultation. We&apos;ll assess which route fits your profile — PR, study permit, or licensing — and give you a realistic timeline.
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
