'use client';

import * as React from 'react';
import Link from 'next/link';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { Badge } from '@mjn/ui';
import {
  DownloadSimple, Books, FileText, MagnifyingGlass,
  GraduationCap, ClipboardText, Money, X, CheckCircle,
  CircleNotch, SortAscending, Funnel, Star,
  ArrowRight, Envelope, User,
} from '@phosphor-icons/react';

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000') + '/api/v1';

// ─── DATA ─────────────────────────────────────────────────────────────────────

const RESOURCES = [
  {
    id: 'dataflow-checklist',
    title: 'DataFlow Document Checklist 2026',
    category: 'UAE Licensing',
    type: 'Checklist',
    pages: 4,
    updatedMs: new Date('2026-07-01').getTime(),
    updated: 'Jul 2026',
    downloadCount: 8200,
    downloads: '8,200+',
    desc: 'Every document required for a successful DataFlow application — attestation requirements, common rejection reasons, and a step-by-step submission order. Updated for 2026 DHA, MOH, and DOH requirements.',
    tags: ['DataFlow', 'DHA', 'MOH', 'DOH', 'Document prep'],
    featured: true,
  },
  {
    id: 'nclex-study-guide',
    title: 'NCLEX-RN Study Guide for African Nurses',
    category: 'US & NCLEX',
    type: 'Guide',
    pages: 22,
    updatedMs: new Date('2026-06-01').getTime(),
    updated: 'Jun 2026',
    downloadCount: 11500,
    downloads: '11,500+',
    desc: 'Comprehensive NCLEX prep guide covering NGN item types, recommended question banks, a 12-week study schedule, and CGFNS/ERES credential evaluation steps. Available in English and French.',
    tags: ['NCLEX', 'NGN', 'CGFNS', 'Study plan'],
    featured: true,
  },
  {
    id: 'nmc-registration-guide',
    title: 'UK NMC Registration Guide for Internationally Educated Nurses',
    category: 'UK Placement',
    type: 'Guide',
    pages: 18,
    updatedMs: new Date('2026-05-01').getTime(),
    updated: 'May 2026',
    downloadCount: 6300,
    downloads: '6,300+',
    desc: 'Step-by-step NMC registration from OSCE booking to PIN issuance — English test options, CBT structure, OSCE station types, and typical processing timelines for African applicants.',
    tags: ['NMC', 'CBT', 'OSCE', 'UK nursing'],
    featured: true,
  },
  {
    id: 'dha-fee-schedule',
    title: 'UAE Regulatory Body Fee Schedule 2026',
    category: 'UAE Licensing',
    type: 'Fee Schedule',
    pages: 3,
    updatedMs: new Date('2026-07-01').getTime(),
    updated: 'Jul 2026',
    downloadCount: 5900,
    downloads: '5,900+',
    desc: 'Current fee tables for DHA, DOH, and MOH applications by profession — DataFlow, exam registration, and licensing renewal fees. Updated quarterly.',
    tags: ['DHA fees', 'DOH fees', 'MOH fees', 'UAE costs'],
    featured: false,
  },
  {
    id: 'ireland-nmbi-checklist',
    title: 'Ireland NMBI Registration Checklist',
    category: 'Ireland',
    type: 'Checklist',
    pages: 5,
    updatedMs: new Date('2026-04-01').getTime(),
    updated: 'Apr 2026',
    downloadCount: 3100,
    downloads: '3,100+',
    desc: 'Document checklist and application sequence for NMBI registration — good-standing certificates, attestation requirements, English language evidence, and Critical Skills Permit steps.',
    tags: ['NMBI', 'Ireland', 'Critical Skills', 'Francophone'],
    featured: false,
  },
  {
    id: 'salary-benchmarks',
    title: 'Healthcare Salary Benchmarks by Country 2026',
    category: 'Career Planning',
    type: 'Guide',
    pages: 12,
    updatedMs: new Date('2026-07-01').getTime(),
    updated: 'Jul 2026',
    downloadCount: 9800,
    downloads: '9,800+',
    desc: 'Salary ranges for nurses, physicians, and allied health across UAE, UK, US, Ireland, Canada, and Australia — broken down by specialty, experience level, and employer type with allowance notes.',
    tags: ['Salary', 'UAE', 'UK', 'US', 'Ireland', 'Benchmarks'],
    featured: false,
  },
  {
    id: 'dha-exam-blueprint',
    title: 'DHA Exam Blueprint and Topic Weights',
    category: 'UAE Licensing',
    type: 'Study Resource',
    pages: 8,
    updatedMs: new Date('2026-06-01').getTime(),
    updated: 'Jun 2026',
    downloadCount: 4700,
    downloads: '4,700+',
    desc: 'Official DHA exam content areas with MJN-annotated weightings based on candidate feedback — which topics appear most frequently and recommended preparation hours per domain.',
    tags: ['DHA exam', 'Blueprint', 'Exam prep', 'Study guide'],
    featured: false,
  },
  {
    id: 'contract-negotiation-guide',
    title: 'Healthcare Employment Contract Review Guide',
    category: 'Career Planning',
    type: 'Guide',
    pages: 10,
    updatedMs: new Date('2026-03-01').getTime(),
    updated: 'Mar 2026',
    downloadCount: 3400,
    downloads: '3,400+',
    desc: 'What to check before signing an international employment contract — allowances that are negotiable, red-flag clauses, bond periods, indemnity insurance requirements, and notice period norms by country.',
    tags: ['Employment contract', 'Negotiation', 'UAE', 'UK', 'Allowances'],
    featured: false,
  },
  {
    id: 'student-internship-guide',
    title: 'International Internship Application Guide for Healthcare Students',
    category: 'Student Support',
    type: 'Guide',
    pages: 14,
    updatedMs: new Date('2026-02-01').getTime(),
    updated: 'Feb 2026',
    downloadCount: 2200,
    downloads: '2,200+',
    desc: 'How to apply for international clinical internships — eligibility requirements, application timelines, letters of support, and how to use an internship to build your licensing case before graduation.',
    tags: ['Internship', 'Students', 'UAE internship', 'Clinical placement'],
    featured: false,
  },
  {
    id: 'cgfns-eres-guide',
    title: 'CGFNS vs ERES: Which Credential Evaluation for Your NCLEX Pathway',
    category: 'US & NCLEX',
    type: 'Guide',
    pages: 7,
    updatedMs: new Date('2026-04-01').getTime(),
    updated: 'Apr 2026',
    downloadCount: 3800,
    downloads: '3,800+',
    desc: 'Comparison of CGFNS, ERES, and state-board credential evaluations — which states accept which, processing timelines, fees, and the correct submission sequence to avoid delays.',
    tags: ['CGFNS', 'ERES', 'NCLEX', 'Credential evaluation'],
    featured: false,
  },
  {
    id: 'haad-doh-checklist',
    title: 'HAAD / DOH Licensing Checklist for Abu Dhabi',
    category: 'UAE Licensing',
    type: 'Checklist',
    pages: 4,
    updatedMs: new Date('2026-05-01').getTime(),
    updated: 'May 2026',
    downloadCount: 3600,
    downloads: '3,600+',
    desc: 'Document and exam preparation checklist for DOH (formerly HAAD) licensing in Abu Dhabi — all professions from nurses to radiographers, with current fee schedules.',
    tags: ['DOH', 'HAAD', 'Abu Dhabi', 'UAE licensing'],
    featured: false,
  },
  {
    id: 'relocation-checklist',
    title: 'Pre-Departure Relocation Checklist — UAE & UK',
    category: 'Career Planning',
    type: 'Checklist',
    pages: 6,
    updatedMs: new Date('2026-06-01').getTime(),
    updated: 'Jun 2026',
    downloadCount: 4100,
    downloads: '4,100+',
    desc: 'Everything to arrange before departure — documents to carry in person, bank setup, accommodation, shipping, professional registration timeline, and first-week employer checklist for UAE and UK placements.',
    tags: ['Relocation', 'Pre-departure', 'UAE move', 'UK move'],
    featured: false,
  },
];

const TOTAL_DOWNLOADS = RESOURCES.reduce((s, r) => s + r.downloadCount, 0);

const CATEGORIES = ['All', 'UAE Licensing', 'UK Placement', 'US & NCLEX', 'Ireland', 'Career Planning', 'Student Support'];
const TYPES = ['All Types', 'Checklist', 'Guide', 'Fee Schedule', 'Study Resource'];
const SORTS = [
  { value: 'downloads', label: 'Most Downloaded' },
  { value: 'newest', label: 'Newest' },
] as const;

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Checklist: ClipboardText,
  Guide: Books,
  'Fee Schedule': Money,
  'Study Resource': GraduationCap,
};

const CATEGORY_COLORS: Record<string, string> = {
  'UAE Licensing':   'bg-amber-50  text-amber-700  border-amber-200',
  'UK Placement':    'bg-blue-50   text-blue-700   border-blue-200',
  'US & NCLEX':      'bg-red-50    text-red-700    border-red-200',
  'Ireland':         'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Career Planning': 'bg-teal-50   text-teal-700   border-teal-200',
  'Student Support': 'bg-purple-50 text-purple-700 border-purple-200',
};

// ─── LEAD-GATE MODAL ──────────────────────────────────────────────────────────

function GateModal({
  resource,
  onClose,
}: {
  resource: typeof RESOURCES[0];
  onClose: () => void;
}) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState('');

  // Close on backdrop click / Escape
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await fetch(`${API}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          serviceInterest: 'library',
          notes: `Requested free resource: "${resource.title}"`,
        }),
      });
      setDone(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const Icon = TYPE_ICONS[resource.type] ?? FileText;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="gradient-hero px-6 py-5 text-white">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">{resource.type} · {resource.pages} pages</span>
          </div>
          <h2 className="text-lg font-bold leading-snug">{resource.title}</h2>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {done ? (
            <div className="py-4 text-center space-y-3">
              <div className="flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle className="h-7 w-7 text-emerald-500" weight="fill" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-foreground">Check your inbox!</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We&apos;ve sent <strong>{resource.title}</strong> to <strong>{email}</strong>.
                A consultant may also follow up if this guide raises questions about your pathway.
              </p>
              <div className="pt-2 space-y-2">
                <Link
                  href="/academy"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
                >
                  Study on the Academy <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  onClick={onClose}
                  className="w-full rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  Browse more resources
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
                Enter your details and we&apos;ll email you this resource instantly — free, no commitment.
              </p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border bg-muted/30 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="relative">
                  <Envelope className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border bg-muted/30 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                {error && <p className="text-xs text-rose-500">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting || !name.trim() || !email.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {submitting
                    ? <><CircleNotch className="h-4 w-4 animate-spin" /> Sending…</>
                    : <><DownloadSimple className="h-4 w-4" /> Get Free Access</>}
                </button>
              </form>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                No spam. Unsubscribe any time. Your data is handled per our{' '}
                <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">privacy policy</Link>.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function LibraryPage() {
  const [category, setCategory]   = React.useState('All');
  const [type, setType]           = React.useState('All Types');
  const [sort, setSort]           = React.useState<'downloads' | 'newest'>('downloads');
  const [query, setQuery]         = React.useState('');
  const [gating, setGating]       = React.useState<typeof RESOURCES[0] | null>(null);

  const filtered = React.useMemo(() => {
    let list = RESOURCES.filter((r) => {
      const matchesCat  = category === 'All' || r.category === category;
      const matchesType = type === 'All Types' || r.type === type;
      const q = query.toLowerCase();
      const matchesQ    = !q || r.title.toLowerCase().includes(q) ||
        r.desc.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCat && matchesType && matchesQ;
    });

    if (sort === 'downloads') list = [...list].sort((a, b) => b.downloadCount - a.downloadCount);
    else list = [...list].sort((a, b) => b.updatedMs - a.updatedMs);

    return list;
  }, [category, type, sort, query]);

  const hasFilters = category !== 'All' || type !== 'All Types' || query !== '';

  function clearFilters() {
    setCategory('All');
    setType('All Types');
    setQuery('');
  }

  const totalDownloadsLabel = TOTAL_DOWNLOADS >= 1000
    ? `${(TOTAL_DOWNLOADS / 1000).toFixed(0)}k+`
    : `${TOTAL_DOWNLOADS}+`;

  return (
    <>
      <MarketingNav />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="gradient-hero relative overflow-hidden pt-28 pb-16 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-60 w-60 rounded-full bg-teal-400/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6">
          <Badge className="mb-4 border border-white/20 bg-white/10 text-white backdrop-blur-sm">
            Free Library
          </Badge>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Checklists, Guides & Fee Schedules — All Free
          </h1>
          <p className="mt-4 max-w-xl text-lg text-blue-100">
            Written by MJN consultants from their own licensing and placement experience.
            Enter your email and receive any guide instantly.
          </p>

          {/* Live stats */}
          <div className="mt-10 flex flex-wrap gap-8">
            {[
              { value: `${RESOURCES.length}`, label: 'Free resources' },
              { value: totalDownloadsLabel, label: 'Total downloads' },
              { value: 'EN & FR', label: 'Select guides bilingual' },
              { value: 'Jul 2026', label: 'Latest update' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-2xl font-extrabold text-white">{value}</p>
                <p className="text-xs text-blue-200 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FILTERS + LIBRARY ────────────────────────────────────────────── */}
      <section className="px-6 py-10">
        <div className="mx-auto max-w-6xl">

          {/* Search + sort row */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative sm:w-80">
              <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by topic, exam, or country…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <SortAscending className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex rounded-xl border border-border bg-white shadow-sm overflow-hidden">
                {SORTS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSort(s.value)}
                    className={`px-3.5 py-2 text-sm font-medium transition-colors ${
                      sort === s.value
                        ? 'bg-primary text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Category pills — horizontal scroll on mobile */}
          <div className="mb-3 -mx-6 px-6 overflow-x-auto">
            <div className="flex gap-2 pb-1 min-w-max sm:min-w-0 sm:flex-wrap">
              {CATEGORIES.map((cat) => {
                const count = cat === 'All' ? RESOURCES.length : RESOURCES.filter((r) => r.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                      category === cat
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-white border border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
                    }`}
                  >
                    {cat}
                    <span className={`rounded-full px-1.5 py-px text-[10px] font-bold ${
                      category === cat ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Type filter row */}
          <div className="mb-6 flex items-center gap-2 flex-wrap">
            <Funnel className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                  type === t
                    ? 'bg-foreground text-background'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                {t}
              </button>
            ))}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline underline-offset-2"
              >
                <X className="h-3 w-3" /> Clear all
              </button>
            )}
          </div>

          {/* Result count */}
          <p className="mb-5 text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {RESOURCES.length} resources
            {hasFilters && (
              <span className="ml-1 text-xs">
                — <button onClick={clearFilters} className="text-primary hover:underline underline-offset-2">clear filters</button>
              </span>
            )}
          </p>

          {/* Empty state */}
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-border bg-white py-20 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60">
                <MagnifyingGlass className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground">No resources match those filters</p>
              <p className="mt-1.5 text-sm text-muted-foreground max-w-xs mx-auto">
                Try a different search term or remove one of the active filters.
              </p>
              <button
                onClick={clearFilters}
                className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((r) => {
                const Icon = TYPE_ICONS[r.type] ?? FileText;
                return (
                  <div
                    key={r.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm hover:shadow-md hover:border-primary/25 transition-all"
                  >
                    {/* Card header */}
                    <div className="flex items-center justify-between border-b border-border px-5 py-3 bg-muted/20">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${CATEGORY_COLORS[r.category] ?? 'bg-muted text-muted-foreground border-border'}`}>
                        {r.category}
                      </span>
                      <div className="flex items-center gap-2">
                        {r.featured && (
                          <span className="flex items-center gap-0.5 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            <Star className="h-3 w-3" weight="fill" /> Top
                          </span>
                        )}
                        <span className="text-[11px] text-muted-foreground">{r.pages}pp · {r.updated}</span>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="flex flex-1 flex-col p-5">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 group-hover:bg-primary/12 transition-colors">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>

                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                          {r.type}
                        </span>
                      </div>

                      <h3 className="font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                        {r.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {r.desc}
                      </p>

                      {/* Tags */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {r.tags.slice(0, 4).map((t) => (
                          <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-border">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <DownloadSimple className="h-3.5 w-3.5" /> {r.downloads}
                        </span>
                        <button
                          onClick={() => setGating(r)}
                          className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white hover:bg-primary/90 transition-colors"
                        >
                          Get Free Access <DownloadSimple className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────────────────────── */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="gradient-hero relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center text-white">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
              <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-teal-400/10 blur-2xl" />
            </div>
            <div className="relative">
              <Books className="mx-auto mb-4 h-10 w-10 text-teal-300" />
              <h2 className="text-3xl font-bold">Guides prepare you. Consultants guide you.</h2>
              <p className="mx-auto mt-3 max-w-md text-blue-100 leading-relaxed">
                Every resource here was written to answer the questions consultants hear most often.
                When you are ready for answers specific to your case, book a free call.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/get-started"
                  className="flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-bold text-primary hover:bg-white/90 transition-colors"
                >
                  Book Free Consultation <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/blog"
                  className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-7 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
                >
                  Read the Blog
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />

      {/* ── GATE MODAL ───────────────────────────────────────────────────── */}
      {gating && <GateModal resource={gating} onClose={() => setGating(null)} />}
    </>
  );
}
