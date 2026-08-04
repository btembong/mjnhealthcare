'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import {
  ArrowRight, Clock, CaretLeft, ArrowUpRight,
  CalendarBlank, Link as LinkIcon, LinkedinLogo,
  WhatsappLogo, Check, List, ArrowUp,
} from '@phosphor-icons/react';

// ── Types ─────────────────────────────────────────────────────────────────────

type Block = { type: 'p' | 'h2' | 'h3' | 'ul' | 'callout'; text?: string; items?: string[] };

type Article = {
  title: string;
  category: string;
  date: string;
  readTime: string;
  excerpt: string;
  author?: { name: string; role: string };
  blocks: Block[];
};

// ── Category styles ───────────────────────────────────────────────────────────

const categoryColors: Record<string, string> = {
  'UAE Licensing':  'bg-amber-50 text-amber-700 border-amber-200',
  'UK Placement':   'bg-blue-50 text-blue-700 border-blue-200',
  'US & NCLEX':     'bg-red-50 text-red-700 border-red-200',
  'Ireland':        'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Exam Prep':      'bg-purple-50 text-purple-700 border-purple-200',
  'Career':         'bg-teal-50 text-teal-700 border-teal-200',
  'Student Life':   'bg-pink-50 text-pink-700 border-pink-200',
};

const categoryAccent: Record<string, string> = {
  'UAE Licensing':  'bg-amber-500',
  'UK Placement':   'bg-blue-500',
  'US & NCLEX':     'bg-red-500',
  'Ireland':        'bg-emerald-500',
  'Exam Prep':      'bg-purple-500',
  'Career':         'bg-teal-500',
  'Student Life':   'bg-pink-500',
};

// ── Article data ──────────────────────────────────────────────────────────────

const articles: Record<string, Article> = {
  'dha-vs-haad-which-exam': {
    title: 'DHA vs HAAD: Which UAE Licensing Exam Should You Take First?',
    category: 'UAE Licensing',
    date: 'Jul 10, 2026',
    readTime: '7 min',
    excerpt: 'The right authority depends on where you want to work — and the wrong choice costs you months.',
    author: { name: 'MJN Advisory Team', role: 'UAE Licensing Specialists' },
    blocks: [
      { type: 'p', text: 'The UAE has three main health authorities that issue licenses for healthcare professionals: the Dubai Health Authority (DHA), the Department of Health Abu Dhabi (DOH, formerly HAAD), and the Ministry of Health (MOH) for the northern emirates. Each authority is jurisdiction-specific — a DHA license only allows you to practice in Dubai, while a DOH license is valid in Abu Dhabi and Al Ain. The MOH license covers Sharjah, Ajman, Umm Al Quwain, Ras Al Khaimah, and Fujairah.' },
      { type: 'h2', text: 'Which Authority Should You Target?' },
      { type: 'p', text: 'The answer is determined by where your employer is located — not by which exam is "easier." This sounds obvious but is a common mistake: candidates start DHA preparation because they heard the exam is slightly more straightforward, then discover their target hospital is in Abu Dhabi (DOH jurisdiction) and have to restart the process.' },
      { type: 'p', text: 'If you have a specific job offer: apply to the authority that covers that employer\'s location. If you do not yet have an offer: DHA (Dubai) has the highest volume of private healthcare employment and the most active international recruitment, making it the default choice for most nurses and allied health professionals starting out.' },
      { type: 'h2', text: 'The Exam Differences' },
      { type: 'ul', items: [
        'DHA exam: 100 multiple-choice questions, 2 hours. Prometric-based. Profession-specific question banks are available. Pass mark is approximately 60%.',
        'DOH/HAAD exam: 150 multiple-choice questions, 3 hours. Also Prometric-based. Slightly more clinical depth, particularly for nursing and physician categories.',
        'MOH exam: 100 questions, Prometric format. Often considered the most accessible of the three, but is limited to the northern emirates which have lower salary scales.',
      ]},
      { type: 'h2', text: 'DataFlow Is Required for All Three' },
      { type: 'p', text: 'Regardless of which authority you target, all three require DataFlow Primary Source Verification before the exam can be scheduled. DataFlow verifies your academic credentials, professional registration, and work experience directly with the issuing institutions. This takes 8–12 weeks on average and is the most common bottleneck in the UAE licensing process.' },
      { type: 'callout', text: 'Start DataFlow as early as possible — before you have a job offer. DataFlow reports are valid for all three authorities, so you are not committed to a specific one when you apply.' },
      { type: 'h2', text: 'Can I Hold Multiple UAE Licenses?' },
      { type: 'p', text: 'Yes, but only one can be your "primary" license linked to an employer. Some professionals obtain DHA and DOH licenses sequentially to maximise their job market access. However, both require DataFlow (once submitted, the report can be shared) and a separate exam. The most practical approach is to target one authority based on your intended work location and add a second license later if needed.' },
      { type: 'p', text: 'If you are unsure which authority fits your profile and career goals, book a free consultation. We assess your qualifications, target location, and profession before recommending a pathway — choosing wrong costs 3–6 months.' },
    ],
  },

  'nmc-registration-african-nurses': {
    title: 'Complete Guide to UK NMC Registration for African Nurses in 2026',
    category: 'UK Placement',
    date: 'Jul 5, 2026',
    readTime: '12 min',
    excerpt: 'The NMC pathway has changed significantly since 2023. This updated guide covers English test requirements, CBT format changes, OSCE booking logistics, and realistic timelines.',
    author: { name: 'MJN Advisory Team', role: 'UK Placement Specialists' },
    blocks: [
      { type: 'p', text: 'The UK remains one of the most sought-after destinations for internationally educated nurses from Africa — NHS pay scales, career progression, and the pathway to UK settlement make it a compelling long-term option. But the NMC registration process is multi-stage, and the rules have changed enough since 2023 that much of what you will find online is outdated.' },
      { type: 'h2', text: 'Step 1: English Language Test' },
      { type: 'p', text: 'The NMC accepts either IELTS Academic (overall 7.0, with no individual band below 6.5) or OET (Occupational English Test, minimum grade B in all four components — reading, writing, listening, speaking). OET is nursing-specific and many candidates find the clinical scenarios more intuitive, but IELTS is more widely available across Africa.' },
      { type: 'p', text: 'Important: English test results must be no more than two years old at the point of NMC application. If you passed IELTS three years ago for another purpose, you will need to re-sit.' },
      { type: 'h2', text: 'Step 2: NMC Application and Credential Verification' },
      { type: 'p', text: 'The NMC reviews your nursing qualification and registration history. For most African applicants this means your home-country nursing council certifies your training and good standing directly to the NMC. This verification can take 8–12 weeks depending on your council\'s responsiveness. We manage all communication with your home registration authority on your behalf.' },
      { type: 'h2', text: 'Step 3: Computer-Based Test (CBT)' },
      { type: 'p', text: 'The CBT tests nursing knowledge in a UK clinical context. It is 120 questions, computer-adaptive, administered at Pearson VUE centres. The CBT can be sat in your home country (including Nigeria, Ghana, Kenya, and Cameroon) before travelling to the UK — this is the preferred approach as it avoids the cost of an additional UK visit.' },
      { type: 'callout', text: 'CBT results are valid for three years. Pass the CBT before you have a UK job offer secured — it gives employers confidence and removes one variable from your offer timeline.' },
      { type: 'h2', text: 'Step 4: OSCE (Objective Structured Clinical Examination)' },
      { type: 'p', text: 'The OSCE must be taken in the UK at an NMC-approved test centre. It assesses practical nursing competencies through clinical scenarios with simulated patients. Most candidates need to be in the UK on a visitor visa or, if they already have a Skilled Worker visa through a sponsoring employer, through that route.' },
      { type: 'p', text: 'OSCE preparation centres offer 3–5 day intensive programs. We refer candidates to accredited preparation programmes and advise on the logistics of UK arrival, visa type, and accommodation for the test period.' },
      { type: 'h2', text: 'Realistic Timeline' },
      { type: 'ul', items: [
        'English test: 4–12 weeks preparation depending on current level',
        'NMC application + credential verification: 8–12 weeks',
        'CBT preparation and sitting: 6–10 weeks',
        'OSCE preparation and sitting (in UK): 4–8 weeks after arrival',
        'NMC PIN issuance: 2–4 weeks after successful OSCE',
        'Total: 6–9 months from starting the process to NMC registration',
      ]},
    ],
  },

  'nurse-salaries-dubai-2026': {
    title: 'Nurse Salaries in Dubai 2026 — Full Breakdown by Specialty and Authority',
    category: 'Career',
    date: 'Jun 28, 2026',
    readTime: '5 min',
    excerpt: 'DHA-licensed nurses in Dubai earn between AED 6,000 and AED 18,000 per month depending on specialty, experience, and employer type.',
    author: { name: 'MJN Advisory Team', role: 'Career & Placement Specialists' },
    blocks: [
      { type: 'p', text: 'Dubai nurse salaries vary significantly by licensing authority, employer type (private vs. semi-government), specialty, and years of experience. The figures below are based on 2026 market data from active recruitment across our employer network and exclude accommodation and transport allowances, which are commonly provided separately.' },
      { type: 'h2', text: 'Salary Ranges by Sector' },
      { type: 'ul', items: [
        'Private hospitals (DHA-licensed): AED 7,000–14,000 per month basic',
        'Semi-government hospitals (e.g. Mediclinic, NMC Health): AED 9,000–16,000',
        'Government hospitals (Dubai Health Authority hospitals): AED 10,000–18,000',
        'Clinics and polyclinics: AED 5,500–9,000',
        'Home healthcare and nursing agencies: AED 5,000–8,000',
      ]},
      { type: 'h2', text: 'Specialty Premiums' },
      { type: 'p', text: 'ICU, CCU, NICU, and operating theatre nurses command the highest premiums — typically AED 2,000–4,000 above the base range for their sector. Oncology and dialysis specialties also attract above-average salaries due to skill scarcity. Emergency department and ward nurses are at the baseline.' },
      { type: 'h2', text: 'Allowances and Benefits' },
      { type: 'ul', items: [
        'Accommodation: Either provided or an allowance of AED 2,000–5,000/month',
        'Transport: Either provided or AED 500–1,500/month',
        'Annual leave: 30 days standard, plus UAE public holidays',
        'Annual flights: Usually one return ticket to home country per year',
        'Health insurance: Mandatory, employer-provided',
        'End-of-service gratuity: 21 days pay per year for the first 5 years',
      ]},
      { type: 'callout', text: 'Tax-free income is the key advantage. A nurse earning AED 10,000/month (≈ $2,720) takes home the full amount. Equivalent gross salary in the UK after tax would need to be ≈ £50,000+ to achieve the same net position.' },
      { type: 'h2', text: 'DOH vs DHA — Does the License Affect Salary?' },
      { type: 'p', text: 'DOH (Abu Dhabi) government hospitals typically pay 10–20% more than equivalent DHA (Dubai) private sector roles, but Abu Dhabi has a higher cost of living and fewer private-sector employment options. Dubai\'s larger private sector means more vacancies and faster placement, which is why most of our candidates target DHA first.' },
    ],
  },

  'nclex-75-questions-study-plan': {
    title: 'How I Passed NCLEX in 75 Questions — A First-Timer\'s Study Plan',
    category: 'Exam Prep',
    date: 'Jun 20, 2026',
    readTime: '9 min',
    excerpt: 'Nurse Amara Diallo passed NCLEX on her first attempt in 75 questions after 10 weeks of preparation. She shares her exact study schedule.',
    author: { name: 'Amara Diallo, RN', role: 'MJN Academy Graduate · NCLEX Passer' },
    blocks: [
      { type: 'p', text: 'I graduated from nursing school in Yaoundé in December 2025. By February I had started the NCLEX process through MJN. By April I sat the exam in Paris (the closest Pearson VUE centre to Cameroon at the time) and passed in 75 questions. This is what I actually did — no fluff, no sponsored content, just the honest 10-week plan that worked for me.' },
      { type: 'h2', text: 'Weeks 1–2: Understand the NGN Format First' },
      { type: 'p', text: 'The biggest mistake I see from other candidates is jumping straight into question banks without understanding how the Next Generation NCLEX (NGN) actually works. NGN is not just multiple choice anymore. It includes bow-tie items (cause/condition/action), matrix questions, highlight-the-text, and cloze (drop-down). If you do not understand the item formats, you will panic in the exam even if you know the clinical content.' },
      { type: 'p', text: 'Spend the first two weeks exclusively on understanding the Clinical Judgement Measurement Model (CJMM) — the six-step framework NCLEX uses to structure almost all its questions. Every NGN item maps to one or more of these steps: recognise cues, analyse cues, prioritise hypotheses, generate solutions, take action, evaluate outcomes.' },
      { type: 'h2', text: 'Weeks 3–7: Systematic Content + Questions Together' },
      { type: 'ul', items: [
        'Week 3: Pharmacology — high-yield drug classes, priority nursing interventions, the "5 rights plus 3"',
        'Week 4: Med-Surg — cardiovascular, respiratory, neurological priority conditions',
        'Week 5: Maternal/newborn — fetal monitoring, postpartum haemorrhage, neonatal assessment',
        'Week 6: Mental health — therapeutic communication, medication management, legal/ethical',
        'Week 7: Leadership, delegation, infection control, safety — the "management of care" category is 17–23% of the exam',
      ]},
      { type: 'p', text: 'For each content week, I did 60–80 questions per day on that topic. After each question, regardless of whether I got it right, I read the full rationale. I kept a notebook of patterns: "When the question says X and I see Y, the answer is usually Z." Clinical judgement is pattern recognition.' },
      { type: 'h2', text: 'Weeks 8–9: Full Practice Exams' },
      { type: 'p', text: 'I took two full-length adaptive practice exams (100–145 questions) per week in weeks 8 and 9. Each exam was timed and done under exam conditions — no phone, no breaks. After each exam I reviewed every wrong answer the same day while the reasoning was fresh.' },
      { type: 'callout', text: 'My practice exam scores were: Week 8 exam 1: 68%, Week 8 exam 2: 71%, Week 9 exam 1: 79%, Week 9 exam 2: 82%. Anything consistently above 75% in practice is a strong indicator of readiness.' },
      { type: 'h2', text: 'Week 10: Review and Confidence' },
      { type: 'p', text: 'No new content in week 10. I reviewed my error notebook, revisited pharmacology (it is always worth one more pass), and did 30 questions per day to stay warm without fatiguing myself. The day before the exam I did nothing — watched a film, slept early.' },
      { type: 'p', text: 'The AI tutor in the MJN Academy was genuinely useful in weeks 3–7 for explaining clinical reasoning behind wrong answers. I would paste the question and my reasoning and it would point out exactly where my thinking broke down. That kind of instant feedback is hard to replicate from a textbook.' },
    ],
  },

  'nclex-vs-cbt-difference': {
    title: 'NCLEX vs NMC CBT: Understanding the Difference',
    category: 'Exam Prep',
    date: 'Jun 14, 2026',
    readTime: '6 min',
    excerpt: 'Both are licensing exams for internationally educated nurses — but they test different things in different formats.',
    author: { name: 'MJN Advisory Team', role: 'Exam Preparation Specialists' },
    blocks: [
      { type: 'p', text: 'Internationally educated nurses choosing between UAE/UK/US pathways often ask us to compare NCLEX and NMC CBT. Both are licensing exams for nurses, both are computer-based, and both are required before you can practice in their respective countries. Beyond that, they are quite different in what they test, how they are structured, and what they cost.' },
      { type: 'h2', text: 'NCLEX (US) — Clinical Judgement at Scale' },
      { type: 'p', text: 'NCLEX-RN (Next Generation NCLEX) is adaptive — it adjusts difficulty based on your answers. Minimum 75 questions, maximum 145. The exam does not have a fixed pass score; instead it measures your clinical judgement ability using the Clinical Judgement Measurement Model (CJMM). The exam can end at 75 questions if the computer is confident you are above or below the passing standard.' },
      { type: 'ul', items: [
        'Format: Adaptive, 75–145 questions, 5 hours maximum',
        'Location: Pearson VUE centres globally (some in Africa)',
        'Cost: $200 USD + CGFNS/state board application fees ($300–500 additional)',
        'Preparation time: 8–14 weeks typically',
        'Tests: Clinical judgement, prioritisation, safety, delegation',
      ]},
      { type: 'h2', text: 'NMC CBT (UK) — UK-Contextualised Knowledge' },
      { type: 'p', text: 'The NMC Computer-Based Test is 120 questions, non-adaptive, with a fixed time of 3.5 hours. It tests nursing knowledge specifically in the context of UK healthcare practice — you need to understand NHS structures, UK legislation (Mental Health Act, NMC Code), and UK clinical protocols. It is not a clinical judgement exam in the same way as NCLEX.' },
      { type: 'ul', items: [
        'Format: Fixed, 120 questions, 3.5 hours',
        'Location: Pearson VUE centres — can be sat in home country',
        'Cost: £83 GBP per attempt',
        'Preparation time: 6–8 weeks typically',
        'Tests: UK nursing knowledge, NMC standards, UK healthcare law',
      ]},
      { type: 'h2', text: 'Which Is Harder?' },
      { type: 'p', text: 'NCLEX is generally considered harder due to the adaptive format, the NGN item types (bow-tie, matrix, cloze, highlight) that require clinical reasoning rather than fact recall, and the higher stakes of failing (more expensive and more re-sit restrictions). NMC CBT is more knowledge-based — if you study the right content (NMC Code, UK-specific clinical contexts) diligently, pass rates are high.' },
      { type: 'callout', text: 'Our Academy pass rates: NCLEX 94%, NMC CBT 96%. The higher CBT pass rate reflects the more predictable nature of the content — UK-contextualised study is very focused.' },
      { type: 'h2', text: 'Which Should You Choose?' },
      { type: 'p', text: 'Choose based on your target country, not which exam seems easier. If you want to work in the US or Canada, you need NCLEX. If you want to work in the UK, you need NMC CBT (plus OSCE). For UAE/Ireland/Australia, neither NCLEX nor CBT applies — those have their own licensing exams. Book a consultation if you are unsure which pathway fits your profile and circumstances.' },
    ],
  },

  'dataflow-documents-before-start': {
    title: 'What Documents You Need Before Starting DataFlow — And How to Get Them Right',
    category: 'UAE Licensing',
    date: 'Jun 8, 2026',
    readTime: '4 min',
    excerpt: 'DataFlow rejections are almost always document problems. Here is what to prepare before you submit.',
    author: { name: 'MJN Advisory Team', role: 'UAE Licensing Specialists' },
    blocks: [
      { type: 'p', text: 'DataFlow Primary Source Verification is the UAE\'s mandatory credential verification system for all healthcare professionals. It contacts your educational institutions, professional registration bodies, and employers directly to confirm the authenticity of your documents. Rejections and delays are almost always caused by problems that could have been identified before submission.' },
      { type: 'h2', text: 'The Core Documents Required' },
      { type: 'ul', items: [
        'Passport: Clear scanned copy, valid for at least 6 months beyond expected DataFlow completion date',
        'Nursing/medical degree certificate: Original-quality scan. Must match the name on your passport exactly — including spelling and order of names',
        'Official academic transcripts: Must be issued by your institution and sealed/stamped. Unofficial transcripts are rejected',
        'Home-country professional registration certificate: Must be current and show your full registration number',
        'Good standing certificate: Issued by your home nursing/medical council. Must be dated within 3 months of DataFlow submission — this is the one most people get wrong',
        'Work experience letters: Must be on employer letterhead, signed by HR or a senior manager, and include your start date, end date, position, and full-time/part-time status',
        'Passport-size photographs: White background, recent. Specific size requirements vary by authority',
      ]},
      { type: 'h2', text: 'The Most Common Rejection Reasons' },
      { type: 'ul', items: [
        'Name mismatch: Your degree says "Marie-Claire" but your passport says "Marieclaire" — even a hyphen difference will trigger a rejection. Get a name affidavit from a notary if your name appears differently across documents',
        'Expired good standing certificate: Many councils issue certificates dated "within 6 months" but DataFlow requires it to be within 3 months of submission. Request it last, just before you submit',
        'Unrecognised institution: If your university or nursing council cannot be reached by DataFlow\'s verification team, your application stalls. We flag institutions with known verification delays before you submit',
        'Missing attestation chain: Documents from some countries require: institution stamp → ministry of education attestation → foreign affairs apostille → UAE embassy attestation. Each country has a different chain. We provide country-specific attestation guides',
        'Work experience gaps: If you list 3 years of experience but your letters only cover 2 years and 8 months, DataFlow flags the gap. Either explain the gap with a statutory declaration or omit the gap period from your application',
      ]},
      { type: 'callout', text: 'One rejected DataFlow costs you 8–12 weeks and the re-submission fee. Our document review catches issues before submission — every client gets a pre-submission document check as part of the UAE licensing engagement.' },
    ],
  },

  'ireland-critical-skills-nursing': {
    title: 'Ireland\'s Critical Skills Permit for Nurses — Everything You Need to Know in 2026',
    category: 'Ireland',
    date: 'Jun 1, 2026',
    readTime: '8 min',
    excerpt: 'Nursing is on Ireland\'s Critical Skills Occupations List — Employment Permits are readily available and your family can join you from day one.',
    author: { name: 'MJN Advisory Team', role: 'Ireland Placement Specialists' },
    blocks: [
      { type: 'p', text: 'Ireland is one of the most accessible European destinations for internationally educated nurses, largely because nursing consistently appears on the Critical Skills Occupations List (CSOL). This means Employment Permits are issued without Labour Market Needs Tests — employers do not need to prove they cannot find an Irish or EU candidate first. For nurses from Africa, this is a significant advantage over other EU destinations.' },
      { type: 'h2', text: 'The NMBI Registration Pathway' },
      { type: 'p', text: 'All nurses practicing in Ireland must be registered with the Nursing and Midwifery Board of Ireland (NMBI). For internationally educated nurses, NMBI assesses your qualification for comparability with Irish nursing standards. This assessment takes 8–12 weeks and results in one of three outcomes: full registration, adaptation (a supervised practice period in an Irish healthcare setting), or non-recognition.' },
      { type: 'p', text: 'Most nurses from Anglophone African countries (Nigeria, Ghana, Kenya, Cameroon) with a 3-year or 4-year nursing programme receive either full registration or a short adaptation period of 20–40 weeks. The NMBI assessment fee is €390 and is non-refundable regardless of outcome.' },
      { type: 'h2', text: 'English Language Requirements' },
      { type: 'p', text: 'NMBI requires either IELTS Academic (overall 7.0, no band below 6.5) or OET (grade B in all components). Candidates who completed their entire nursing education in English — including clinical placements — may be eligible for an English language exemption. We assess this on a case-by-case basis during your consultation.' },
      { type: 'h2', text: 'Critical Skills Employment Permit' },
      { type: 'ul', items: [
        'Minimum salary: €32,000 per year (nurses typically earn €35,000–€55,000 in Ireland)',
        'Permit validity: 2 years initially, renewable',
        'Family reunification: Immediate — your spouse/partner and dependent children can join you in Ireland from day one, unlike many other work permits',
        'Pathway to permanent residency: Eligible for Stamp 4 after 21 months, which allows unrestricted work rights',
        'Processing time: 4–6 weeks for the permit once an offer is in place',
      ]},
      { type: 'h2', text: 'Adaptation Period — What It Means in Practice' },
      { type: 'p', text: 'An adaptation period means you practice under the supervision of a registered nurse in an Irish healthcare setting for the prescribed period. During adaptation you receive a salary (typically 80–90% of a registered nurse rate) and may live and work in Ireland legally on an Atypical Working Scheme visa. At the end of the adaptation period, NMBI assesses your competency and grants full registration.' },
      { type: 'callout', text: 'The adaptation period is not a failure — it is a structured bridge. Most candidates complete it successfully and it gives you Irish clinical experience before starting your career proper.' },
      { type: 'h2', text: 'Realistic Timeline' },
      { type: 'ul', items: [
        'NMBI application + assessment: 8–12 weeks',
        'English test (if required): 4–8 weeks preparation',
        'Job offer sourcing: 4–8 weeks (we connect you to HSE and private hospital partners)',
        'Critical Skills Employment Permit: 4–6 weeks',
        'Adaptation period (if required): 20–40 weeks in Ireland',
        'Total to full registration: 5–8 months (without adaptation) / 12–18 months (with adaptation)',
      ]},
    ],
  },

  'cgfns-vs-nclex-first': {
    title: 'CGFNS vs NCLEX: Which Comes First, and Does the Order Matter?',
    category: 'US & NCLEX',
    date: 'May 25, 2026',
    readTime: '7 min',
    excerpt: 'Most internationally educated nurses going to the US need CGFNS before NCLEX — but not all. The answer depends on your target state, visa pathway, and home institution.',
    author: { name: 'MJN Advisory Team', role: 'US & NCLEX Specialists' },
    blocks: [
      { type: 'p', text: 'The Commission on Graduates of Foreign Nursing Schools (CGFNS) and NCLEX are two separate requirements for internationally educated nurses pursuing US licensure. They are not alternatives to each other — most nurses need both. But the order and whether CGFNS is required at all depends on your target state and visa pathway.' },
      { type: 'h2', text: 'What CGFNS Actually Does' },
      { type: 'p', text: 'CGFNS does not issue a nursing license — it provides credential evaluation and, through its Credentials Evaluation Service (CES), determines whether your foreign nursing education is equivalent to US standards. Many State Boards of Nursing (SBONs) require CGFNS CES before they will process an NCLEX application from an internationally educated nurse.' },
      { type: 'p', text: 'CGFNS also administers the CGFNS Qualifying Exam — a separate exam that was historically required for the VisaScreen Certificate needed for EB-3 immigration. The VisaScreen is still required for most employment-based green card sponsorships for nurses.' },
      { type: 'h2', text: 'Which States Require CGFNS First?' },
      { type: 'p', text: 'The majority of states — including California, New York, Florida, and Texas — require CGFNS CES before they issue an Authorization to Test (ATT) for NCLEX. A minority of states (including some compact states) allow direct NCLEX application without CGFNS. We review your target state\'s requirements during consultation before you invest in either process.' },
      { type: 'h2', text: 'The Most Common Sequence' },
      { type: 'ul', items: [
        '1. CGFNS Credentials Evaluation Service (CES) — 3–6 months',
        '2. State Board of Nursing application — 4–8 weeks after CES',
        '3. NCLEX Authorization to Test (ATT) — 2–4 weeks after SBON approval',
        '4. NCLEX-RN — sat within 90 days of ATT issuance (ATT expires in 90 days)',
        '5. State licence issued — within 24 hours of passing NCLEX (many states)',
        '6. VisaScreen Certificate (CGFNS) — required for EB-3 sponsorship, run in parallel or after NCLEX',
      ]},
      { type: 'h2', text: 'Cost Overview' },
      { type: 'ul', items: [
        'CGFNS CES application: $350 USD',
        'NCLEX application (State Board): $200–400 USD depending on state',
        'NCLEX exam fee (Pearson VUE): $200 USD',
        'VisaScreen Certificate (CGFNS): $400 USD (required for green card sponsorship)',
        'Total minimum: approximately $1,150 USD before employer reimbursement',
      ]},
      { type: 'callout', text: 'Many US healthcare employers sponsoring EB-3 green cards reimburse NCLEX and VisaScreen costs as part of the employment agreement. Negotiate this before signing — it is a common benefit you should not leave on the table.' },
    ],
  },

  'nurses-week-2025-ceo-message': {
    title: 'National Nurses Week: A Message from the CEO and Founder',
    category: 'Career',
    date: 'May 12, 2025',
    readTime: '3 min',
    excerpt: 'A personal message from John Nyah Mbout, BSN, RN — CEO and Founder of MJN Healthcare Consulting — honouring nurses everywhere on National Nurses Week 2025.',
    author: { name: 'John Nyah Mbout, BSN, RN', role: 'CEO & Founder, MJN Healthcare Consulting' },
    blocks: [
      { type: 'p', text: 'Dear Nurses,' },
      { type: 'p', text: 'As we celebrate National Nurses Week, I want to take this moment to extend my deepest gratitude to each one of you. At MJN Healthcare Academy and Professional Services Ltd, the healthcare staffing arm of MJN Healthcare Consulting, we recognise that nurses are the heartbeat of healthcare. Your dedication, compassion, and resilience are what keep the system moving forward — especially in times of great challenge.' },
      { type: 'p', text: 'Whether you are providing direct patient care, leading healthcare teams, educating future professionals, or working behind the scenes, your contributions are powerful and far-reaching. Your unwavering commitment to excellence, advocacy, and lifelong learning not only saves lives but also strengthens our communities.' },
      { type: 'callout', text: 'You embody the core values we uphold at MJN: integrity, empathy, innovation, and service.' },
      { type: 'h2', text: 'Nursing Mentorship and Coaching Programme' },
      { type: 'p', text: 'In recognition of your invaluable role, we proudly offer our Nursing Mentorship and Coaching Programme — a dedicated initiative that supports professional development, leadership growth, and clinical excellence. Through this programme, we are shaping the future of nursing across Africa, one country and one nurse at a time, equipping both students and practicing nurses with the tools they need to thrive in an evolving healthcare landscape.' },
      { type: 'p', text: 'Thank you for the sacrifices you make, the lives you touch, and the hope you bring. This week — and every week — we honour and celebrate you.' },
      { type: 'p', text: 'With heartfelt appreciation,' },
    ],
  },

  'start-licensing-before-graduating': {
    title: 'Why You Should Start Your International Licensing Plan Before You Graduate',
    category: 'Student Life',
    date: 'May 18, 2026',
    readTime: '6 min',
    excerpt: 'Most nurses lose 12–18 months post-graduation on preventable delays. Here is what to do while you are still studying.',
    author: { name: 'MJN Advisory Team', role: 'Student Support Specialists' },
    blocks: [
      { type: 'p', text: 'The most common mistake we see from internationally educated nurses is treating international licensing as a post-graduation task. It is not. Many of the documents, institutional verifications, and processes required for DataFlow, CGFNS, NMBI, or NNAS can — and should — be started while you are in your final year of nursing school.' },
      { type: 'h2', text: 'Why the Delay Happens' },
      { type: 'p', text: 'The typical pattern: nurse graduates in June, starts thinking about international licensing in August, requests transcripts in September, discovers the institution takes 8 weeks to process requests, gets transcripts in November, begins DataFlow in December, DataFlow takes 12 weeks, receives DataFlow report in March — 9 months post-graduation before anything meaningful has happened. That is 9 months of working in a local hospital when the process could have been running in parallel.' },
      { type: 'h2', text: 'What You Can Do in Final Year' },
      { type: 'ul', items: [
        'Request an official transcript from your institution: Some nursing schools in Cameroon, Nigeria, and Ghana take 3–6 months to process formal transcript requests. Request it in year 3 for delivery at graduation.',
        'Contact your national nursing council: Understand the process for obtaining a Good Standing / Registration Certificate. Some councils require you to be registered for 12 months before they issue this — knowing this in advance prevents surprise delays.',
        'Start IELTS or OET preparation: English test preparation can take 3–6 months. Starting in year 3 means you can sit in year 4 and have a valid result ready at graduation.',
        'Research your target country and authority: Spend time understanding the specific requirements for your target destination. This is free and prevents the common mistake of starting the wrong process.',
        'Book a consultation: A 30-minute consultation in year 3 maps your full pathway — what you need, in what order, and what you can start now. It costs nothing.',
      ]},
      { type: 'h2', text: 'Documents That Expire — Plan Around Them' },
      { type: 'p', text: 'Several documents have expiry dates that cause problems if obtained too early or too late. Good Standing Certificates are typically valid for 3–6 months, so requesting one 12 months before your DataFlow submission is counterproductive. Passport validity must extend beyond the expected end of the licensing process. Police clearance certificates (required for some countries) are typically valid for 6 months.' },
      { type: 'callout', text: 'The ideal window to request a Good Standing Certificate is 4–6 weeks before your DataFlow or CGFNS submission — not earlier. Everything else can and should be prepared as early as possible.' },
      { type: 'h2', text: 'Student Support Services' },
      { type: 'p', text: 'MJN\'s Student Support services include pathway planning for final-year nursing and medical students, internship placement that builds the work experience record needed for international applications, and study-abroad guidance. A structured plan in year 3 or 4 sets you up to apply internationally within 6 months of graduation rather than 18.' },
    ],
  },
};

// ── All posts list (for related articles) ─────────────────────────────────────

const allPosts = [
  { slug: 'dha-vs-haad-which-exam', title: 'DHA vs HAAD: Which UAE Licensing Exam Should You Take First?', category: 'UAE Licensing', readTime: '7 min', date: 'Jul 10, 2026' },
  { slug: 'nmc-registration-african-nurses', title: 'Complete Guide to UK NMC Registration for African Nurses in 2026', category: 'UK Placement', readTime: '12 min', date: 'Jul 5, 2026' },
  { slug: 'nurse-salaries-dubai-2026', title: 'Nurse Salaries in Dubai 2026 — Full Breakdown by Specialty and Authority', category: 'Career', readTime: '5 min', date: 'Jun 28, 2026' },
  { slug: 'nclex-75-questions-study-plan', title: 'How I Passed NCLEX in 75 Questions — A First-Timer\'s Study Plan', category: 'Exam Prep', readTime: '9 min', date: 'Jun 20, 2026' },
  { slug: 'nclex-vs-cbt-difference', title: 'NCLEX vs NMC CBT: Understanding the Difference', category: 'Exam Prep', readTime: '6 min', date: 'Jun 14, 2026' },
  { slug: 'dataflow-documents-before-start', title: 'What Documents You Need Before Starting DataFlow', category: 'UAE Licensing', readTime: '4 min', date: 'Jun 8, 2026' },
  { slug: 'ireland-critical-skills-nursing', title: 'Ireland\'s Critical Skills Permit for Nurses', category: 'Ireland', readTime: '8 min', date: 'Jun 1, 2026' },
  { slug: 'cgfns-vs-nclex-first', title: 'CGFNS vs NCLEX: Which Comes First, and Does the Order Matter?', category: 'US & NCLEX', readTime: '7 min', date: 'May 25, 2026' },
  { slug: 'start-licensing-before-graduating', title: 'Why You Should Start Your International Licensing Plan Before You Graduate', category: 'Student Life', readTime: '6 min', date: 'May 18, 2026' },
  { slug: 'nurses-week-2025-ceo-message', title: 'National Nurses Week: A Message from the CEO and Founder', category: 'Career', readTime: '3 min', date: 'May 12, 2025' },
];

// ── Block renderer ────────────────────────────────────────────────────────────

function renderBlock(block: Block, i: number) {
  switch (block.type) {
    case 'h2':
      return (
        <h2
          key={i}
          id={`section-${i}`}
          className="mt-10 mb-4 text-2xl font-bold text-foreground scroll-mt-24 pb-2 border-b border-border/60"
        >
          {block.text}
        </h2>
      );
    case 'h3':
      return (
        <h3 key={i} className="mt-7 mb-3 text-lg font-bold text-foreground">
          {block.text}
        </h3>
      );
    case 'p':
      return (
        <p key={i} className="mb-5 text-[15.5px] text-foreground/80 leading-[1.8]">
          {block.text}
        </p>
      );
    case 'ul':
      return (
        <ul key={i} className="mb-5 space-y-2.5 pl-1">
          {block.items?.map((item, j) => (
            <li key={j} className="flex items-start gap-3 text-[15px] text-foreground/80">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span className="leading-[1.75]">{item}</span>
            </li>
          ))}
        </ul>
      );
    case 'callout':
      return (
        <div key={i} className="my-7 flex gap-4 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
          <div className="shrink-0 mt-0.5">
            <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-primary" />
            </div>
          </div>
          <p className="text-[15px] font-medium text-primary leading-relaxed">{block.text}</p>
        </div>
      );
    default:
      return null;
  }
}

// ── Share button ──────────────────────────────────────────────────────────────

function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const encoded = encodeURIComponent(window.location.href);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Share</span>
      <button
        onClick={copyLink}
        title="Copy link"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <LinkIcon className="h-3.5 w-3.5" />}
      </button>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Share on LinkedIn"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:text-[#0077b5] hover:border-[#0077b5]/30 transition-colors"
      >
        <LinkedinLogo className="h-3.5 w-3.5" />
      </a>
      <a
        href={`https://wa.me/?text=${encodedTitle}%20${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Share on WhatsApp"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:text-[#25d366] hover:border-[#25d366]/30 transition-colors"
      >
        <WhatsappLogo className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

// ── TOC ───────────────────────────────────────────────────────────────────────

function TableOfContents({ blocks, activeSection }: { blocks: Block[]; activeSection: number | null }) {
  const headings = blocks.reduce<{ text: string; blockIndex: number }[]>((acc, b, i) => {
    if (b.type === 'h2' && b.text) acc.push({ text: b.text, blockIndex: i });
    return acc;
  }, []);

  if (headings.length === 0) return null;

  return (
    <nav className="space-y-1">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
        <List className="h-3.5 w-3.5" /> Contents
      </p>
      {headings.map(({ text, blockIndex }) => {
        const isActive = activeSection === blockIndex;
        return (
          <a
            key={blockIndex}
            href={`#section-${blockIndex}`}
            className={`block text-sm leading-snug py-1 px-2 rounded-lg transition-colors ${
              isActive
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {text}
          </a>
        );
      })}
    </nav>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BlogArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? articles[slug] : null;
  const [scrollPct, setScrollPct] = useState(0);
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onScroll() {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPct(docH > 0 ? Math.min(100, Math.round((window.scrollY / docH) * 100)) : 0);
      setShowBackToTop(window.scrollY > 600);

      // find active section
      if (!article) return;
      const h2Indices = article.blocks.reduce<number[]>((acc, b, i) => {
        if (b.type === 'h2') acc.push(i);
        return acc;
      }, []);
      let current: number | null = null;
      for (const idx of h2Indices) {
        const el = document.getElementById(`section-${idx}`);
        if (el && el.getBoundingClientRect().top <= 120) current = idx;
      }
      setActiveSection(current);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [article]);

  if (!article) {
    return (
      <>
        <MarketingNav />
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-3">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">This article may have moved or is no longer available.</p>
          <Button asChild>
            <Link href="/blog">Back to Blog <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <SiteFooter />
      </>
    );
  }

  const badgeClass = categoryColors[article.category] ?? 'bg-muted text-muted-foreground border-border';
  const accentClass = categoryAccent[article.category] ?? 'bg-primary';

  // Related articles: same category first, then others, exclude current
  const related = allPosts
    .filter((p) => p.slug !== slug)
    .sort((a, b) => (a.category === article.category ? -1 : b.category === article.category ? 1 : 0))
    .slice(0, 3);

  return (
    <>
      {/* Reading progress bar */}
      <div
        className="fixed top-0 left-0 z-50 h-0.5 bg-primary transition-all duration-150"
        style={{ width: `${scrollPct}%` }}
      />

      <MarketingNav />

      {/* ARTICLE HEADER ──────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-white px-6 pt-28 pb-10">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/blog"
            className="mb-7 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <CaretLeft className="h-4 w-4" /> Back to Blog
          </Link>

          <div className="grid gap-10 lg:grid-cols-[1fr_300px] items-start">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                  {article.category}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> {article.readTime} read
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarBlank className="h-3.5 w-3.5" /> {article.date}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-foreground leading-tight md:text-4xl xl:text-5xl">
                {article.title}
              </h1>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-2xl">{article.excerpt}</p>

              {/* Author + Share */}
              <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
                {article.author && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary shrink-0">
                      {article.author.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{article.author.name}</p>
                      <p className="text-xs text-muted-foreground">{article.author.role}</p>
                    </div>
                  </div>
                )}
                <ShareButton title={article.title} />
              </div>
            </div>

            {/* Read-time visual — desktop only */}
            <div className="hidden lg:block">
              <div className="rounded-2xl border border-border bg-muted/30 p-5 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reading time</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-extrabold text-primary leading-none">{article.readTime.split(' ')[0]}</span>
                  <span className="text-sm text-muted-foreground mb-1">minutes</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-1.5 rounded-full ${accentClass} transition-all duration-300`} style={{ width: `${scrollPct}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">{scrollPct}% read</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ARTICLE BODY ──────────────────────────────────────────────────────── */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-[1fr_260px]">

            {/* Article content */}
            <div ref={articleRef}>
              {article.blocks.map((block, i) => renderBlock(block, i))}
            </div>

            {/* Sticky sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-5">
                {/* Table of contents */}
                <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                  <TableOfContents blocks={article.blocks} activeSection={activeSection} />
                </div>

                {/* CTA card */}
                <div className="rounded-2xl bg-gradient-to-br from-primary to-[#0a3560] p-5 text-white">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/60 mb-3">Get Started</p>
                  <p className="text-sm font-bold leading-snug mb-1">Ready to begin your journey?</p>
                  <p className="text-xs text-white/70 leading-relaxed mb-4">
                    Free 30-min consultation. We map your full pathway — documents, exams, timeline, and costs.
                  </p>
                  <Link
                    href="/get-started"
                    className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-primary hover:bg-white/90 transition-colors"
                  >
                    Book Free Consultation <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Reading progress */}
                <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Progress</p>
                    <span className="text-xs font-bold text-primary">{scrollPct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${accentClass} transition-all duration-300`}
                      style={{ width: `${scrollPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* RELATED ARTICLES ─────────────────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="bg-muted/30 px-6 py-14 border-t border-border">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">Related Articles</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => {
                const cfg = categoryColors[p.category];
                const acc = categoryAccent[p.category];
                return (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className={`absolute top-0 left-0 right-0 h-0.5 ${acc ?? 'bg-primary'} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg ?? 'bg-muted text-muted-foreground border-border'}`}>
                      {p.category}
                    </span>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors leading-snug text-sm">
                      {p.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto border-t border-border/50 pt-3">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {p.readTime} read</span>
                      <span>{p.date}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ARTICLE CTA ──────────────────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="gradient-hero rounded-3xl p-8 text-white shadow-xl">
            <Badge className="mb-3 bg-white/20 text-white border-none">Free Consultation</Badge>
            <h2 className="text-2xl font-bold mb-2">Ready to Start Your Journey?</h2>
            <p className="text-blue-100 text-sm mb-6 max-w-md leading-relaxed">
              Book a free 30-minute consultation with one of our advisors. We will assess your qualifications, map your pathway, and give you a realistic timeline and cost estimate.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button className="bg-white text-primary hover:bg-white/90" asChild>
                <Link href="/get-started">Book Free Consultation <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button variant="ghost" className="text-white border border-white/30 hover:bg-white/10" asChild>
                <Link href="/blog">More Articles <ArrowUpRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Back to top */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-all hover:scale-110"
          title="Back to top"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}

      <SiteFooter />
    </>
  );
}
