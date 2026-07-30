'use client';

import * as React from 'react';
import { CaretDown } from '@phosphor-icons/react';

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

const faqs = [
  {
    q: 'Can I apply if I have never worked abroad before?',
    a: 'Yes. Most of our clients are applying internationally for the first time. We guide you through every step — from document preparation to licensing exams and job placement. You just need a valid nursing or medical qualification from your home country.',
  },
  {
    q: 'Do you guarantee exam pass or job placement?',
    a: 'No — and we are transparent about this from day one. Our engagement letter explicitly states that exam pass rates, visa approvals, and job offers are outside our control. What we guarantee is professional, thorough handling of your application and full support throughout the process.',
  },
  {
    q: 'What documents do I need to start?',
    a: 'Typically: valid passport, nursing/medical degree certificate, transcripts, registration/license from your home regulatory body, and a recent CV. The exact list depends on your destination country and profession. We generate a personalized checklist when you sign your engagement.',
  },
  {
    q: 'Do you support French speakers?',
    a: "Yes — French is a first-class language at MJN Health. Your consultant, your study materials, the AI Study Assistant, and all official communications are available in French. Our francophone team serves Cameroon, Côte d'Ivoire, Senegal, DRC, and other French-speaking markets.",
  },
  {
    q: 'How long does the UAE DHA licensing process take?',
    a: 'On average, 3–5 months from document submission to exam clearance and license issue. This includes DataFlow verification (8–12 weeks), exam preparation (4–8 weeks), and DHA exam booking. Actual timelines depend on your document readiness and exam scheduling availability.',
  },
  {
    q: 'Can I do Academy exam prep without the full placement service?',
    a: 'Yes. Academy enrollment (NCLEX, DHA, HAAD, CBT, DA) is available as a standalone service. You get access to live virtual classes, the AI Study Assistant, question banks, and a personalized study plan — without needing to purchase the full licensing placement package.',
  },
  {
    q: 'What is the engagement fee and what does it cover?',
    a: 'A $50 engagement fee is charged at the start of every client relationship. It covers initial case assessment, consultant assignment, personalized document checklist, and signing of your engagement letter — the formal agreement that defines the scope of what we will do on your behalf.',
  },
  {
    q: 'How does installment payment work?',
    a: 'For services with installment options, only the first installment is charged at checkout. The second installment is auto-invoiced on a schedule or when a defined milestone is reached — you will receive a WhatsApp and email notification before any charge is made.',
  },
];

export function FAQAccordion() {
  const [open, setOpen] = React.useState<number | null>(null);

  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-white overflow-hidden">
      {faqs.map(({ q, a }, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-start justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-muted/40"
          >
            <span className="text-sm font-semibold text-foreground leading-snug">{q}</span>
            <CaretDown
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                open === i && 'rotate-180 text-primary',
              )}
            />
          </button>
          {open === i && (
            <div className="border-t border-border/60 bg-muted/20 px-6 py-5">
              <p className="text-sm leading-relaxed text-muted-foreground">{a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
