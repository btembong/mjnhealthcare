'use client';

import Link from 'next/link';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import { ArrowRight, CheckCircle, Brain, Sparkle, ChatCircle, ChartLine } from '@phosphor-icons/react';

const capabilities = [
  {
    icon: <ChatCircle className="h-6 w-6 text-primary" />,
    title: 'Clinical Question Answering',
    desc: 'Ask any clinical question — pathophysiology, pharmacology, patient scenarios, rationale behind answer choices. The AI explains concepts in plain language, tailored to your exam context (NCLEX, DHA, CBT, HAAD).',
  },
  {
    icon: <Brain className="h-6 w-6 text-primary" />,
    title: 'Rationale Explanation',
    desc: 'Struggling with a practice question? Paste it in. The AI breaks down why the correct answer is right, why the wrong answers are wrong, and what the question is actually testing.',
  },
  {
    icon: <ChartLine className="h-6 w-6 text-primary" />,
    title: 'Personalised Study Plans',
    desc: 'Based on your practice test results and diagnostic scores, the AI generates a week-by-week study plan prioritising your weak areas — integrated with your target exam date and available study hours.',
  },
  {
    icon: <Sparkle className="h-6 w-6 text-primary" />,
    title: 'Weak Area Detection',
    desc: 'The AI monitors your question-bank performance over time, identifies consistently weak content areas, and surfaces them for focused review. No more discovering your weak spots on exam day.',
  },
];

const guardrails = [
  'Exam content and clinical education: fully AI-driven, no review required',
  'Licensing eligibility advice: AI provides information only; consultant confirms before action',
  'Visa and immigration guidance: out of scope for the AI — consultant only',
  'Case-specific advice (your actual DataFlow, your specific documents): consultant only',
];

const faqs = [
  {
    q: 'What AI model powers the Study Assistant?',
    a: 'The MJN AI Study Assistant is powered by Claude (Anthropic). We chose Claude specifically for its strong clinical reasoning, its ability to explain concepts clearly, and its support for French-language interactions. The assistant is embedded directly in the Academy — you do not need a separate account.',
  },
  {
    q: 'Is the AI available in French?',
    a: 'Yes — the AI Study Assistant is fully bilingual. Ask your question in French and it responds in French. You can switch languages mid-conversation. We recommend practising exam-related content in English (since exams are English-only), but conceptual explanations and study support work well in either language.',
  },
  {
    q: 'Can the AI give me advice about my licensing application?',
    a: 'No — and we are deliberate about this. The AI Study Assistant is scoped to exam preparation and clinical education. For licensing eligibility, document requirements, DataFlow status, and any advice that could affect your regulatory submission — you speak to your consultant. The AI does not substitute for professional judgement in those domains.',
  },
  {
    q: 'How is this different from using general AI tools like ChatGPT?',
    a: 'The MJN AI Study Assistant is trained on our proprietary question bank, grounded in the specific exam frameworks of NCLEX, DHA, DOH, and CBT, and integrated with your personal study plan and performance data. A general AI tool has no knowledge of your weak areas, your exam date, or MJN\'s question bank rationale.',
  },
  {
    q: 'Is the AI tutor available 24/7?',
    a: 'Yes — the AI Study Assistant is available around the clock. Many of our students study in the early morning or late evening to fit around work schedules. Having instant, responsive study support at any hour is one of the core reasons we built it.',
  },
];

export default function AITutorPage() {
  return (
    <>
      <MarketingNav />

      <section className="relative overflow-hidden text-white bg-cover bg-center bg-no-repeat min-h-[520px] flex items-center" style={{ backgroundImage: "url('/aitutor-hero.jpg')" }}>
        <div className="relative mx-auto w-full max-w-6xl px-6 py-28 flex justify-end">
          <div className="w-full max-w-lg rounded-3xl bg-[#0F4C81]/80 p-8 backdrop-blur-md ring-1 ring-white/10 shadow-2xl">
            <Badge className="mb-4 border border-white/20 bg-white/10 text-white backdrop-blur-sm">
              Academy — AI Study Assistant
            </Badge>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              AI Study Assistant — Personalised Exam Prep, Available 24/7
            </h1>
            <p className="mt-4 text-base text-blue-100 leading-relaxed">
              A Claude-powered clinical tutor embedded in the Academy — answering questions, explaining rationale, detecting weak areas, and building personalised study plans. In English and French.
            </p>
            <div className="mt-6">
              <Button size="lg" className="rounded-xl bg-white px-8 text-primary shadow-lg hover:bg-white/90" asChild>
                <Link href="/get-started">Access the AI Tutor <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-blue-100">
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-teal-300" /> Powered by Claude (Anthropic)</span>
              <span className="flex items-center gap-1.5"><Brain className="h-4 w-4 text-teal-300" /> NCLEX · DHA · HAAD · CBT</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-teal-300" /> English and French</span>
            </div>
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3">Capabilities</Badge>
            <h2 className="text-4xl font-bold">What the AI Study Assistant Does</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {capabilities.map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  {icon}
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO CHAT */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <Badge variant="outline" className="mb-3">Example</Badge>
            <h2 className="text-4xl font-bold">What a Session Looks Like</h2>
          </div>
          <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
            <div className="bg-muted/50 px-5 py-3 text-xs font-semibold text-muted-foreground border-b border-border">
              AI Study Assistant — NCLEX Session
            </div>
            <div className="p-5 space-y-4">
              {[
                { role: 'user', text: 'I keep getting questions about fluid and electrolytes wrong. Can you help me understand hyponatraemia?' },
                { role: 'ai', text: 'Absolutely — hyponatraemia is one of the most tested fluid/electrolyte imbalances on NCLEX. It means serum sodium is below 135 mEq/L. The key NCLEX concept is understanding the cause (water excess vs. sodium loss), because the interventions are completely different. Let me break this down with a clinical scenario...' },
                { role: 'user', text: 'Why is fluid restriction used instead of giving sodium directly?' },
                { role: 'ai', text: 'Great question — this is exactly what NCLEX tests. In dilutional hyponatraemia (too much water), the problem is not a sodium deficit — the total body sodium may be normal or even high. Adding sodium would miss the actual problem. Fluid restriction removes the excess water, which concentrates the existing sodium back to normal range. If we gave sodium directly in this case, we could correct too quickly and risk osmotic demyelination syndrome...' },
              ].map(({ role, text }, i) => (
                <div key={i} className={`flex gap-3 ${role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${role === 'user' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                    {role === 'user' ? 'You' : 'AI'}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${role === 'user' ? 'bg-primary text-white' : 'bg-muted/60 text-foreground'}`}>
                    {text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* GUARDRAILS */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle weight="fill" className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-foreground">What the AI Does and Does Not Do</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">The AI Study Assistant is scoped to exam preparation and clinical education. These guardrails are enforced in code — not just policy:</p>
            <ul className="space-y-2.5">
              {guardrails.map((g) => (
                <li key={g} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle weight="fill" className="h-4 w-4 shrink-0 mt-0.5 text-teal-600" />
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">FAQ</Badge>
            <h2 className="text-4xl font-bold">AI Study Assistant — Common Questions</h2>
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
            <h2 className="text-4xl font-bold">Study Smarter — With AI That Knows Your Exam</h2>
            <p className="mx-auto mt-3 max-w-md text-blue-100">Access the AI Study Assistant as part of any Academy Plus or Full Engagement plan.</p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="rounded-xl bg-white px-8 text-primary hover:bg-white/90" asChild>
                <Link href="/get-started">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
