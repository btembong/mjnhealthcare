'use client';

import * as React from 'react';
import Link from 'next/link';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import {
  ArrowRight,
  DownloadSimple,
  Books,
  FileText,
  CheckCircle,
  MagnifyingGlass,
  Globe,
  GraduationCap,
  Stethoscope,
  Briefcase,
  Scroll,
  ClipboardText,
  Money,
} from '@phosphor-icons/react';

// ─── DATA ──────────────────────────────────────────────────────────────────────

const categories = ['All', 'UAE Licensing', 'UK Placement', 'US & NCLEX', 'Ireland', 'Career Planning', 'Student Support', 'Checklists'];

const resources = [
  {
    id: 'dataflow-checklist',
    title: 'DataFlow Document Checklist 2026',
    category: 'UAE Licensing',
    type: 'Checklist',
    pages: 4,
    updated: 'Jul 2026',
    downloads: '8,200+',
    desc: 'Every document required for a successful DataFlow application — with attestation requirements, common rejection reasons, and a step-by-step submission order. Updated for 2026 DHA requirements.',
    tags: ['DataFlow', 'DHA', 'MOH', 'DOH', 'Document prep'],
    featured: true,
    href: '/get-started',
  },
  {
    id: 'nclex-study-guide',
    title: 'NCLEX-RN Study Guide for African Nurses',
    category: 'US & NCLEX',
    type: 'Guide',
    pages: 22,
    updated: 'Jun 2026',
    downloads: '11,500+',
    desc: 'Comprehensive NCLEX prep guide covering NGN item types, recommended question banks, 12-week study schedule, and CGFNS/ERES credential evaluation steps. Available in English and French.',
    tags: ['NCLEX', 'NGN', 'CGFNS', 'Study plan'],
    featured: true,
    href: '/get-started',
  },
  {
    id: 'dha-fee-schedule',
    title: 'UAE Regulatory Body Fee Schedule 2026',
    category: 'UAE Licensing',
    type: 'Fee Schedule',
    pages: 3,
    updated: 'Jul 2026',
    downloads: '5,900+',
    desc: 'Current fee tables for DHA, DOH, and MOH applications by profession — including DataFlow, exam registration, and licensing renewal fees. Updated quarterly.',
    tags: ['DHA fees', 'DOH fees', 'MOH fees', 'UAE costs'],
    featured: false,
    href: '/get-started',
  },
  {
    id: 'nmc-registration-guide',
    title: 'UK NMC Registration Guide for Internationally Educated Nurses',
    category: 'UK Placement',
    type: 'Guide',
    pages: 18,
    updated: 'May 2026',
    downloads: '6,300+',
    desc: 'Step-by-step NMC registration from OSCE booking to PIN issuance — with English test options, CBT structure, OSCE station types, and typical processing timelines for African applicants.',
    tags: ['NMC', 'CBT', 'OSCE', 'UK nursing'],
    featured: true,
    href: '/get-started',
  },
  {
    id: 'ireland-nmbi-checklist',
    title: 'Ireland NMBI Registration Checklist',
    category: 'Ireland',
    type: 'Checklist',
    pages: 5,
    updated: 'Apr 2026',
    downloads: '3,100+',
    desc: 'Document checklist and application sequence for NMBI registration — covering good-standing certificates, attestation requirements, English language evidence, and Critical Skills Permit steps.',
    tags: ['NMBI', 'Ireland', 'Critical Skills', 'Francophone'],
    featured: false,
    href: '/get-started',
  },
  {
    id: 'salary-benchmarks',
    title: 'Healthcare Salary Benchmarks by Country 2026',
    category: 'Career Planning',
    type: 'Guide',
    pages: 12,
    updated: 'Jul 2026',
    downloads: '9,800+',
    desc: 'Salary ranges for nurses, physicians, and allied health professionals across UAE, UK, US, Ireland, Canada, and Australia — broken down by specialty, experience level, and employer type with allowance notes.',
    tags: ['Salary', 'UAE', 'UK', 'US', 'Ireland', 'Benchmarks'],
    featured: false,
    href: '/get-started',
  },
  {
    id: 'dha-exam-blueprint',
    title: 'DHA Exam Blueprint and Topic Weights',
    category: 'UAE Licensing',
    type: 'Study Resource',
    pages: 8,
    updated: 'Jun 2026',
    downloads: '4,700+',
    desc: 'Official DHA exam content areas with MJN-annotated weightings based on candidate feedback — covers which topics appear most frequently and recommended preparation hours per domain.',
    tags: ['DHA exam', 'Blueprint', 'Exam prep', 'Study guide'],
    featured: false,
    href: '/get-started',
  },
  {
    id: 'contract-negotiation-guide',
    title: 'Healthcare Employment Contract Review Guide',
    category: 'Career Planning',
    type: 'Guide',
    pages: 10,
    updated: 'Mar 2026',
    downloads: '3,400+',
    desc: 'What to check before signing an international employment contract — allowances that are negotiable, red-flag clauses, bond periods, indemnity insurance requirements, and notice period norms by country.',
    tags: ['Employment contract', 'Negotiation', 'UAE', 'UK', 'Allowances'],
    featured: false,
    href: '/get-started',
  },
  {
    id: 'student-internship-guide',
    title: 'International Internship Application Guide for Healthcare Students',
    category: 'Student Support',
    type: 'Guide',
    pages: 14,
    updated: 'Feb 2026',
    downloads: '2,200+',
    desc: 'How to apply for international clinical internships — eligibility requirements, application timelines, letters of support, and how to use an internship to build your international licensing case before graduation.',
    tags: ['Internship', 'Students', 'UAE internship', 'Clinical placement'],
    featured: false,
    href: '/get-started',
  },
  {
    id: 'cgfns-eres-guide',
    title: 'CGFNS vs ERES: Which Credential Evaluation for Your NCLEX Pathway',
    category: 'US & NCLEX',
    type: 'Guide',
    pages: 7,
    updated: 'Apr 2026',
    downloads: '3,800+',
    desc: 'Comparison of CGFNS, ERES, and state-board credential evaluations — which states accept which, processing timelines, fees, and the correct submission sequence to avoid delays.',
    tags: ['CGFNS', 'ERES', 'NCLEX', 'Credential evaluation'],
    featured: false,
    href: '/get-started',
  },
  {
    id: 'haad-doh-checklist',
    title: 'HAAD / DOH Licensing Checklist for Abu Dhabi',
    category: 'UAE Licensing',
    type: 'Checklist',
    pages: 4,
    updated: 'May 2026',
    downloads: '3,600+',
    desc: 'Document and exam preparation checklist for DOH (formerly HAAD) licensing in Abu Dhabi — covering all professions from nurses to radiographers, with current fee schedules.',
    tags: ['DOH', 'HAAD', 'Abu Dhabi', 'UAE licensing'],
    featured: false,
    href: '/get-started',
  },
  {
    id: 'relocation-checklist',
    title: 'Pre-Departure Relocation Checklist — UAE & UK',
    category: 'Career Planning',
    type: 'Checklist',
    pages: 6,
    updated: 'Jun 2026',
    downloads: '4,100+',
    desc: 'Everything to arrange before departure — documents to carry in person, bank account setup, accommodation, shipping, professional registration timeline, and first-week employer checklist for UAE and UK placements.',
    tags: ['Relocation', 'Pre-departure', 'UAE move', 'UK move'],
    featured: false,
    href: '/get-started',
  },
];

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Checklist': ClipboardText,
  'Guide': Books,
  'Fee Schedule': Money,
  'Study Resource': GraduationCap,
};

const categoryColors: Record<string, string> = {
  'UAE Licensing': 'bg-amber-50 text-amber-700 border-amber-200',
  'UK Placement': 'bg-blue-50 text-blue-700 border-blue-200',
  'US & NCLEX': 'bg-red-50 text-red-700 border-red-200',
  'Ireland': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Career Planning': 'bg-teal-50 text-teal-700 border-teal-200',
  'Student Support': 'bg-purple-50 text-purple-700 border-purple-200',
  'Checklists': 'bg-slate-50 text-slate-700 border-slate-200',
};

// ─── PAGE ──────────────────────────────────────────────────────────────────────

export default function LibraryPage() {
  const [activeCategory, setActiveCategory] = React.useState('All');
  const [query, setQuery] = React.useState('');

  const filtered = resources.filter((r) => {
    const matchesCat = activeCategory === 'All' || r.category === activeCategory ||
      (activeCategory === 'Checklists' && r.type === 'Checklist');
    const matchesQuery = !query ||
      r.title.toLowerCase().includes(query.toLowerCase()) ||
      r.tags.some(t => t.toLowerCase().includes(query.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const featured = resources.filter(r => r.featured);

  return (
    <>
      <MarketingNav />

      {/* HERO */}
      <section className="gradient-hero relative overflow-hidden pt-28 pb-16 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-56 w-56 rounded-full bg-teal-400/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6">
          <Badge className="mb-4 border border-white/20 bg-white/10 text-white backdrop-blur-sm">
            Free Library
          </Badge>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Checklists, Guides & Fee Schedules — All Free
          </h1>
          <p className="mt-4 max-w-xl text-lg text-blue-100">
            Downloadable resources written by MJN consultants from their own licensing experience.
            No email required. No paywall.
          </p>

          <div className="mt-10 flex flex-wrap gap-6">
            {[
              { value: '12', label: 'Free resources' },
              { value: '58,000+', label: 'Total downloads' },
              { value: 'EN & FR', label: 'Select guides' },
              { value: 'Jul 2026', label: 'Latest update' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-extrabold text-white">{value}</p>
                <p className="text-xs text-blue-200">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <Badge variant="outline" className="mb-2">Most Downloaded</Badge>
            <h2 className="text-2xl font-bold">Start Here</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((r) => {
              const Icon = typeIcons[r.type] ?? FileText;
              return (
                <div
                  key={r.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm ring-1 ring-primary/10"
                >
                  <div className="flex items-center justify-between border-b border-border px-5 py-3">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${categoryColors[r.category]}`}>
                      {r.category}
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground">{r.pages}pp · Updated {r.updated}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground leading-snug">{r.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">{r.desc}</p>
                    <div className="mt-4 flex flex-wrap gap-1">
                      {r.tags.slice(0, 3).map(t => (
                        <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{t}</span>
                      ))}
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-4">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <DownloadSimple className="h-3.5 w-3.5" /> {r.downloads} downloads
                      </span>
                      <Button size="sm" className="rounded-xl gap-1.5" asChild>
                        <Link href={r.href}>
                          Download <DownloadSimple className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FILTER + FULL LIBRARY */}
      <section className="bg-muted/30 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge variant="outline" className="mb-1">Full Library</Badge>
              <h2 className="text-2xl font-bold">All Resources</h2>
            </div>
            {/* Search */}
            <div className="relative sm:w-72">
              <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by topic or exam…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Category pills */}
          <div className="mb-6 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? 'bg-primary text-white'
                    : 'bg-white border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No resources match that search. <button className="text-primary underline" onClick={() => { setQuery(''); setActiveCategory('All'); }}>Clear filters</button></p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((r) => {
                const Icon = typeIcons[r.type] ?? FileText;
                return (
                  <div
                    key={r.id}
                    className="group flex items-start gap-4 rounded-2xl border border-border bg-white p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="mb-1 flex items-center gap-2 flex-wrap">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${categoryColors[r.category]}`}>
                          {r.category}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{r.type} · {r.pages}pp</span>
                      </div>
                      <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {r.title}
                      </h3>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <DownloadSimple className="h-3 w-3" /> {r.downloads}
                        </span>
                        <Link
                          href={r.href}
                          className="flex items-center gap-1 rounded-lg bg-primary/8 px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/15"
                        >
                          Download <DownloadSimple className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="gradient-hero relative overflow-hidden rounded-3xl p-7 sm:p-10 text-center text-white">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
            </div>
            <div className="relative">
              <Books className="mx-auto mb-4 h-10 w-10 text-teal-300" />
              <h2 className="text-3xl font-bold">Guides prepare you. Consultants guide you.</h2>
              <p className="mx-auto mt-3 max-w-md text-blue-100">
                Every resource in this library was written to answer the questions consultants hear most often.
                When you are ready for answers specific to your case, book a free call.
              </p>
              <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button size="lg" className="rounded-xl bg-white px-8 text-primary hover:bg-white/90" asChild>
                  <Link href="/get-started">Book Free Consultation</Link>
                </Button>
                <Button size="lg" variant="ghost" className="text-white hover:bg-white/10" asChild>
                  <Link href="/blog">Read the Blog →</Link>
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
