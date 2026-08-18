'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { MarketingNav } from '../../components/marketing-nav';
import { SiteFooter } from '../../components/site-footer';
import { Badge } from '@mjn/ui';
import {
  ArrowRight, Clock, MagnifyingGlass, TrendUp,
  BookOpen, Users, CalendarBlank, X,
} from '@phosphor-icons/react';

// ── Data ──────────────────────────────────────────────────────────────────────

const categories = ['All', 'UAE Licensing', 'UK Placement', 'US & NCLEX', 'Ireland', 'Exam Prep', 'Career', 'Student Life'];

const posts = [
  {
    slug: 'dha-vs-haad-which-exam',
    title: 'DHA vs HAAD: Which UAE Licensing Exam Should You Take First?',
    excerpt: 'The right authority depends on where you want to work — and the wrong choice costs you months. Here is a clear breakdown of DHA, DOH/HAAD, and MOH exams by emirate, profession, and processing time.',
    category: 'UAE Licensing',
    readTime: '7 min',
    date: 'Jul 10, 2026',
    featured: true,
    primaryFeatured: true,
  },
  {
    slug: 'nmc-registration-african-nurses',
    title: 'Complete Guide to UK NMC Registration for African Nurses in 2026',
    excerpt: 'The NMC pathway has changed significantly since 2023. This updated guide covers English test requirements, CBT format changes, OSCE booking logistics, and realistic timelines for nurses from Cameroon, Nigeria, Ghana, and Kenya.',
    category: 'UK Placement',
    readTime: '12 min',
    date: 'Jul 5, 2026',
    featured: true,
    primaryFeatured: false,
  },
  {
    slug: 'nurse-salaries-dubai-2026',
    title: 'Nurse Salaries in Dubai 2026 — Full Breakdown by Specialty and Authority',
    excerpt: 'DHA-licensed nurses in Dubai earn between AED 6,000 and AED 18,000 per month depending on specialty, experience, and employer type. Here is the full breakdown — including allowances, benefits, and what the numbers actually mean after deductions.',
    category: 'Career',
    readTime: '5 min',
    date: 'Jun 28, 2026',
    featured: false,
    primaryFeatured: false,
  },
  {
    slug: 'nclex-75-questions-study-plan',
    title: 'How I Passed NCLEX in 75 Questions — A First-Timer\'s Study Plan',
    excerpt: 'Nurse Amara Diallo passed NCLEX on her first attempt in 75 questions after 10 weeks of preparation. She shares her exact study schedule, the resources that worked, and the NGN item types she was not prepared for.',
    category: 'Exam Prep',
    readTime: '9 min',
    date: 'Jun 20, 2026',
    featured: false,
    primaryFeatured: false,
  },
  {
    slug: 'nclex-vs-cbt-difference',
    title: 'NCLEX vs NMC CBT: Understanding the Difference',
    excerpt: 'Both are licensing exams for internationally educated nurses — but they test different things in different formats. If you are choosing between UAE/UK/US pathways, understanding the exam differences affects how much preparation time you actually need.',
    category: 'Exam Prep',
    readTime: '6 min',
    date: 'Jun 14, 2026',
    featured: false,
    primaryFeatured: false,
  },
  {
    slug: 'dataflow-documents-before-start',
    title: 'What Documents You Need Before Starting DataFlow — And How to Get Them Right',
    excerpt: 'DataFlow rejections are almost always document problems. Missing signatures, wrong attestation chains, expired good-standing certificates. We have seen them all. Here is what to prepare before you submit.',
    category: 'UAE Licensing',
    readTime: '4 min',
    date: 'Jun 8, 2026',
    featured: false,
    primaryFeatured: false,
  },
  {
    slug: 'ireland-critical-skills-nursing',
    title: 'Ireland\'s Critical Skills Permit for Nurses — Everything You Need to Know in 2026',
    excerpt: 'Nursing is on Ireland\'s Critical Skills Occupations List, meaning Employment Permits are readily available and your family can join you from day one. But the NMBI registration path has changed.',
    category: 'Ireland',
    readTime: '8 min',
    date: 'Jun 1, 2026',
    featured: false,
    primaryFeatured: false,
  },
  {
    slug: 'cgfns-vs-nclex-first',
    title: 'CGFNS vs NCLEX: Which Comes First, and Does the Order Matter?',
    excerpt: 'Most internationally educated nurses going to the US need CGFNS before NCLEX — but not all. The answer depends on your target state, your visa pathway, and your home institution\'s recognition status.',
    category: 'US & NCLEX',
    readTime: '7 min',
    date: 'May 25, 2026',
    featured: false,
    primaryFeatured: false,
  },
  {
    slug: 'start-licensing-before-graduating',
    title: 'Why You Should Start Your International Licensing Plan Before You Graduate',
    excerpt: 'Most nurses lose 12–18 months post-graduation on preventable delays — documents that should have been prepared in year 3, institution records that take 6 months to retrieve, exam prep that started too late.',
    category: 'Student Life',
    readTime: '6 min',
    date: 'May 18, 2026',
    featured: false,
    primaryFeatured: false,
  },
  {
    slug: 'nurses-week-2025-ceo-message',
    title: 'National Nurses Week: A Message from the CEO and Founder',
    excerpt: 'A personal message from John Nyah Mbout, BSN, RN — CEO and Founder of MJN Healthcare — honouring nurses on National Nurses Week 2025. On dedication, compassion, resilience, and the Nursing Mentorship and Coaching Programme.',
    category: 'Career',
    readTime: '3 min',
    date: 'May 12, 2025',
    featured: false,
    primaryFeatured: false,
  },
];

// ── Style helpers ─────────────────────────────────────────────────────────────

const categoryConfig: Record<string, { pill: string; accent: string; filterActive: string }> = {
  'UAE Licensing': {
    pill: 'bg-amber-50 text-amber-700 border border-amber-200',
    accent: 'bg-amber-500',
    filterActive: 'bg-amber-500 text-white',
  },
  'UK Placement': {
    pill: 'bg-blue-50 text-blue-700 border border-blue-200',
    accent: 'bg-blue-500',
    filterActive: 'bg-blue-500 text-white',
  },
  'US & NCLEX': {
    pill: 'bg-red-50 text-red-700 border border-red-200',
    accent: 'bg-red-500',
    filterActive: 'bg-red-500 text-white',
  },
  'Ireland': {
    pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    accent: 'bg-emerald-500',
    filterActive: 'bg-emerald-500 text-white',
  },
  'Exam Prep': {
    pill: 'bg-purple-50 text-purple-700 border border-purple-200',
    accent: 'bg-purple-500',
    filterActive: 'bg-purple-500 text-white',
  },
  'Career': {
    pill: 'bg-teal-50 text-teal-700 border border-teal-200',
    accent: 'bg-teal-500',
    filterActive: 'bg-teal-500 text-white',
  },
  'Student Life': {
    pill: 'bg-pink-50 text-pink-700 border border-pink-200',
    accent: 'bg-pink-500',
    filterActive: 'bg-pink-500 text-white',
  },
};

function CategoryPill({ category }: { category: string }) {
  const cfg = categoryConfig[category];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg?.pill ?? 'bg-muted text-muted-foreground border border-border'}`}>
      {category}
    </span>
  );
}

// ── Hero featured card (primary — large magazine layout) ──────────────────────

function PrimaryFeaturedCard({ post }: { post: typeof posts[0] }) {
  const cfg = categoryConfig[post.category];
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative flex flex-col justify-end overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[#0a3560] min-h-[420px] shadow-xl transition-all hover:shadow-2xl hover:-translate-y-0.5"
    >
      {/* decorative circles */}
      <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/5" />
      <div className="absolute -left-8 top-1/3 h-48 w-48 rounded-full bg-white/5" />

      {/* top badge */}
      <div className="absolute top-6 left-6 flex items-center gap-3">
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white uppercase tracking-wide backdrop-blur-sm">
          Featured
        </span>
        <span className={`inline-flex items-center rounded-full border border-white/20 px-2.5 py-0.5 text-xs font-semibold bg-white/10 text-white backdrop-blur-sm`}>
          {post.category}
        </span>
      </div>

      {/* content */}
      <div className="relative px-8 pb-8 pt-20">
        <h2 className="text-2xl font-extrabold text-white leading-tight md:text-3xl group-hover:text-white/90 transition-colors">
          {post.title}
        </h2>
        <p className="mt-3 text-sm text-white/70 leading-relaxed line-clamp-2">{post.excerpt}</p>
        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-white/60">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {post.readTime} read</span>
            <span className="flex items-center gap-1"><CalendarBlank className="h-3.5 w-3.5" /> {post.date}</span>
          </div>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-white group-hover:gap-2.5 transition-all">
            Read article <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>

      {/* bottom accent bar */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${cfg?.accent ?? 'bg-secondary'}`} />
    </Link>
  );
}

// ── Secondary featured card ───────────────────────────────────────────────────

function SecondaryFeaturedCard({ post }: { post: typeof posts[0] }) {
  const cfg = categoryConfig[post.category];
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={`absolute top-0 left-0 right-0 h-1 ${cfg?.accent ?? 'bg-primary'}`} />
      <div className="pt-1">
        <CategoryPill category={post.category} />
      </div>
      <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
        {post.title}
      </h2>
      <p className="flex-1 text-sm text-muted-foreground leading-relaxed line-clamp-3">{post.excerpt}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readTime} read</span>
        <span>{post.date}</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity -mt-2">
        Read more <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  );
}

// ── Regular article card ──────────────────────────────────────────────────────

function ArticleCard({ post }: { post: typeof posts[0] }) {
  const cfg = categoryConfig[post.category];
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${cfg?.accent ?? 'bg-primary'} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <CategoryPill category={post.category} />
      <h2 className="flex-1 font-semibold text-foreground group-hover:text-primary transition-colors leading-snug text-[15px]">
        {post.title}
      </h2>
      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{post.excerpt}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-1 border-t border-border/50">
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readTime} read</span>
        <span>{post.date}</span>
      </div>
    </Link>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const matchesCat = activeCategory === 'All' || p.category === activeCategory;
      const q = search.toLowerCase();
      const matchesSearch = !q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, search]);

  const primaryFeatured = posts.find((p) => p.primaryFeatured);
  const secondaryFeatured = posts.filter((p) => p.featured && !p.primaryFeatured);

  const showFeatured = activeCategory === 'All' && !search;
  const gridPosts = showFeatured ? filtered.filter((p) => !p.featured) : filtered;

  return (
    <>
      <MarketingNav />

      {/* HERO ──────────────────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-white px-6 pt-28 pb-12">
        <div className="mx-auto max-w-6xl">
          <Badge variant="outline" className="mb-4">Blog & Articles</Badge>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-foreground md:text-5xl leading-tight">
                Licensing Guides,<br className="hidden md:block" /> Exam Tips & Career Advice
              </h1>
              <p className="mt-3 max-w-lg text-muted-foreground leading-relaxed">
                Practical, honest articles from consultants and placed professionals who have lived the international healthcare licensing journey.
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-5 shrink-0">
              <div className="text-center">
                <p className="text-2xl font-extrabold text-primary">{posts.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Articles</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-2xl font-extrabold text-primary">{categories.length - 1}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Topics</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-2xl font-extrabold text-primary">Weekly</p>
                <p className="text-xs text-muted-foreground mt-0.5">Updates</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mt-8 relative max-w-lg">
            <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles — DHA, NCLEX, salary, DataFlow..."
              className="w-full rounded-xl border border-border bg-white pl-10 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors shadow-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* CATEGORY FILTER ───────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-white/80 backdrop-blur-sm px-6 py-3 sticky top-0 z-10 shadow-sm">
        <div className="mx-auto max-w-6xl">
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            {categories.map((cat) => {
              const isActive = cat === activeCategory;
              const cfg = categoryConfig[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                    isActive
                      ? cat === 'All'
                        ? 'bg-primary text-white shadow-sm'
                        : `${cfg?.filterActive ?? 'bg-primary text-white'} shadow-sm`
                      : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* RESULTS INFO (when filtered) ─────────────────────────────────────── */}
      {(search || activeCategory !== 'All') && (
        <div className="px-6 pt-6 pb-0">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm text-muted-foreground">
              {filtered.length === 0
                ? 'No articles found.'
                : `${filtered.length} article${filtered.length !== 1 ? 's' : ''}${activeCategory !== 'All' ? ` in ${activeCategory}` : ''}${search ? ` matching "${search}"` : ''}`}
            </p>
          </div>
        </div>
      )}

      {/* FEATURED SECTION ─────────────────────────────────────────────────── */}
      {showFeatured && primaryFeatured && (
        <section className="px-6 py-10">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center gap-2 mb-6">
              <TrendUp className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Featured This Week</p>
            </div>
            <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
              <PrimaryFeaturedCard post={primaryFeatured} />
              <div className="flex flex-col gap-5">
                {secondaryFeatured.map((p) => (
                  <SecondaryFeaturedCard key={p.slug} post={p} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ALL / FILTERED ARTICLES ──────────────────────────────────────────── */}
      <section className={`px-6 pb-16 ${showFeatured ? 'bg-muted/30 pt-8' : 'pt-8'}`}>
        <div className="mx-auto max-w-6xl">
          {showFeatured && (
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">All Articles</p>
            </div>
          )}

          {gridPosts.length === 0 && (search || activeCategory !== 'All') ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
                <BookOpen className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground">No articles found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Try a different search term or browse another category.
              </p>
              <button
                onClick={() => { setSearch(''); setActiveCategory('All'); }}
                className="mt-4 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gridPosts.map((post) => (
                <ArticleCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* NEWSLETTER ───────────────────────────────────────────────────────── */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[#0a3560] px-8 py-12 text-center shadow-xl">
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
            <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-white/5" />
            <div className="relative">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <Users className="h-6 w-6 text-white" />
              </div>
              <Badge className="mb-3 bg-white/20 text-white border-none hover:bg-white/30">
                Join 2,400+ subscribers
              </Badge>
              <h2 className="text-3xl font-bold text-white">New articles every week</h2>
              <p className="mt-2 text-sm text-white/70 max-w-sm mx-auto leading-relaxed">
                Licensing updates, exam changes, salary benchmarks, and career guides. No spam — unsubscribe anytime.
              </p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="mt-7 flex flex-col gap-3 sm:flex-row sm:max-w-md sm:mx-auto"
              >
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/15 transition-colors backdrop-blur-sm"
                />
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-primary hover:bg-white/90 transition-colors shrink-0"
                >
                  Subscribe <ArrowRight className="h-4 w-4" />
                </button>
              </form>
              <p className="mt-3 text-xs text-white/40">Weekly digest. No spam. Unsubscribe at any time.</p>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
