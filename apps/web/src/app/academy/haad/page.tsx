'use client';

import Link from 'next/link';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import { ArrowRight, CheckCircle, Clock, Users } from '@phosphor-icons/react';

const examDetails = [
  { label: 'Authority', value: 'Department of Health (DOH), Abu Dhabi' },
  { label: 'Former name', value: 'HAAD (Health Authority Abu Dhabi)' },
  { label: 'Format', value: 'Prometric computer-based test' },
  { label: 'Questions', value: '100–120 MCQs' },
  { label: 'Duration', value: '2–3 hours' },
  { label: 'Retake', value: '90-day waiting period' },
];

const differences = [
  { aspect: 'Jurisdiction', dha: 'Dubai emirate', doh: 'Abu Dhabi emirate' },
  { aspect: 'Exam difficulty', dha: 'Moderate', doh: 'Slightly more clinical focus' },
  { aspect: 'Salary range (nurses)', dha: 'AED 6,000–16,000', doh: 'AED 7,000–18,000' },
  { aspect: 'Hospital type', dha: 'Private + DHA public', doh: 'SEHA hospitals + private' },
  { aspect: 'Processing time', dha: '3–5 months', doh: '4–6 months' },
];

const topics = [
  'Advanced medical-surgical nursing (DOH/HAAD priority conditions)',
  'Critical care, ICU, and high-dependency unit nursing',
  'Pharmacology — Abu Dhabi formulary and DOH drug protocols',
  'Obstetrics and neonatal care',
  'Infection prevention (DOH-specific protocols)',
  'Patient safety and healthcare quality (DOH standards)',
  'Ethical and legal framework for nursing in Abu Dhabi',
  '700+ HAAD/DOH-format practice questions',
];

const faqs = [
  {
    q: 'What is the difference between HAAD and DOH?',
    a: 'HAAD (Health Authority Abu Dhabi) was rebranded as DOH (Department of Health) in 2016. The licensing exam is now administered under the DOH name, but still referred to colloquially as "HAAD" by many candidates. The exam format and content are broadly similar to the old HAAD exam, updated for current DOH standards.',
  },
  {
    q: 'Should I apply to DHA or DOH?',
    a: 'It depends entirely on where you want to work. If your target employer is in Dubai, apply to DHA. If your employer is in Abu Dhabi, apply to DOH. If you are open to either, your consultant will advise based on your profession\'s current processing times and exam pass rates — which vary by quarter.',
  },
  {
    q: 'Is the DOH exam harder than DHA?',
    a: 'Most candidates find the DOH exam slightly more clinically intensive, with a stronger emphasis on critical care and advanced practice scenarios. Our study plan adjusts for this — DOH preparation typically runs 8–12 weeks vs. 6–10 weeks for DHA.',
  },
  {
    q: 'Can I hold both DHA and DOH licences?',
    a: 'Yes — some professionals hold licences from both authorities if they work across emirates. This is uncommon but possible. The second licence application benefits from your DataFlow already being verified for the first.',
  },
];

export default function HAADPage() {
  return (
    <>
      <MarketingNav />

      <section className="relative overflow-hidden text-white bg-cover bg-center bg-no-repeat min-h-[520px] flex items-center" style={{ backgroundImage: "url('/examhero.jpg')" }}>
        <div className="relative mx-auto w-full max-w-6xl px-6 py-28 flex justify-end">
          <div className="w-full max-w-lg rounded-3xl bg-[#0F4C81]/80 p-8 backdrop-blur-md ring-1 ring-white/10 shadow-2xl">
            <Badge className="mb-4 border border-white/20 bg-white/10 text-white backdrop-blur-sm">
              Academy — HAAD / DOH
            </Badge>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              HAAD / DOH Exam Preparation — Abu Dhabi Health Authority Licensing
            </h1>
            <p className="mt-4 text-base text-blue-100 leading-relaxed">
              Targeted preparation for the DOH (formerly HAAD) Prometric exam — Abu Dhabi&apos;s health authority licensing assessment. 700+ DOH-format questions, clinical focus, and timed mock exams.
            </p>
            <div className="mt-6">
              <Button size="lg" className="rounded-xl bg-white px-8 text-primary shadow-lg hover:bg-white/90" asChild>
                <Link href="/get-started">Start DOH / HAAD Prep <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-blue-100">
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-teal-300" /> Abu Dhabi — higher salary bands</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-teal-300" /> 8–12 weeks recommended</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-teal-300" /> All licensed professions</span>
            </div>
          </div>
        </div>
      </section>

      {/* EXAM DETAILS + DHA vs DOH */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <Badge variant="outline" className="mb-3">Exam Details</Badge>
              <h2 className="text-4xl font-bold">About the DOH Exam</h2>
              <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-white overflow-hidden">
                {examDetails.map(({ label, value }) => (
                  <div key={label} className="flex justify-between px-5 py-3 text-sm">
                    <span className="font-medium text-foreground">{label}</span>
                    <span className="text-muted-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Badge variant="outline" className="mb-3">DHA vs DOH</Badge>
              <h2 className="text-4xl font-bold">Dubai vs Abu Dhabi</h2>
              <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-white overflow-hidden">
                <div className="grid grid-cols-3 px-5 py-3 text-xs font-semibold text-muted-foreground">
                  <span></span><span className="text-center">DHA (Dubai)</span><span className="text-center">DOH (Abu Dhabi)</span>
                </div>
                {differences.map(({ aspect, dha, doh }) => (
                  <div key={aspect} className="grid grid-cols-3 px-5 py-3 text-sm">
                    <span className="font-medium text-foreground">{aspect}</span>
                    <span className="text-center text-muted-foreground">{dha}</span>
                    <span className="text-center text-muted-foreground">{doh}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TOPICS */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <Badge variant="outline" className="mb-3">Curriculum</Badge>
            <h2 className="text-4xl font-bold">Topics Covered</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {topics.map((t) => (
              <div key={t} className="flex items-start gap-3 rounded-xl border border-border bg-white p-4">
                <CheckCircle weight="fill" className="h-4 w-4 shrink-0 mt-0.5 text-teal-600" />
                <span className="text-sm text-muted-foreground">{t}</span>
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
            <h2 className="text-4xl font-bold">HAAD / DOH — Common Questions</h2>
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

      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="gradient-hero relative overflow-hidden rounded-3xl p-10 text-center text-white">
            <h2 className="text-4xl font-bold">Aim for Abu Dhabi&apos;s Best Hospital Groups</h2>
            <p className="mx-auto mt-3 max-w-md text-blue-100">DOH-licensed professionals access the highest salary bands in the UAE. Start your preparation and get your Abu Dhabi licence.</p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="rounded-xl bg-white px-8 text-primary hover:bg-white/90" asChild>
                <Link href="/get-started">Start DOH Prep</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
