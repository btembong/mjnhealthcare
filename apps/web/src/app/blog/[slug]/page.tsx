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
} from '@mjn/ui';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.mjnhealthcare.com/api/v1';

type Block = { type: 'p' | 'h2' | 'h3' | 'ul' | 'callout'; text?: string; items?: string[] };

type Article = {
  id: string; title: string; slug: string; excerpt: string;
  category: string; readTime: string; author: string; authorRole: string;
  publishedAt: string | null; content: Block[];
};

const categoryColors: Record<string, string> = {
  'UAE Licensing':  'bg-amber-50 text-amber-700 border-amber-200',
  'UK Placement':   'bg-blue-50 text-blue-700 border-blue-200',
  'US & NCLEX':     'bg-red-50 text-red-700 border-red-200',
  'Ireland':        'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Exam Prep':      'bg-purple-50 text-purple-700 border-purple-200',
  'Career':         'bg-teal-50 text-teal-700 border-teal-200',
  'Student Life':   'bg-pink-50 text-pink-700 border-pink-200',
  'Canada':         'bg-rose-50 text-rose-700 border-rose-200',
  'Australia':      'bg-orange-50 text-orange-700 border-orange-200',
};

const categoryAccent: Record<string, string> = {
  'UAE Licensing':  'bg-amber-500',
  'UK Placement':   'bg-blue-500',
  'US & NCLEX':     'bg-red-500',
  'Ireland':        'bg-emerald-500',
  'Exam Prep':      'bg-purple-500',
  'Career':         'bg-teal-500',
  'Student Life':   'bg-pink-500',
  'Canada':         'bg-rose-500',
  'Australia':      'bg-orange-500',
};

function formatDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderBlock(block: Block, i: number) {
  switch (block.type) {
    case 'h2':
      return (
        <h2 key={i} id={`section-${i}`} className="mt-10 mb-4 text-2xl font-bold text-foreground scroll-mt-24 pb-2 border-b border-border/60">
          {block.text}
        </h2>
      );
    case 'h3':
      return <h3 key={i} className="mt-7 mb-3 text-lg font-bold text-foreground">{block.text}</h3>;
    case 'p':
      return <p key={i} className="mb-5 text-[15.5px] text-foreground/80 leading-[1.8]">{block.text}</p>;
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

function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const encoded = encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '');
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Share</span>
      <button onClick={copyLink} title="Copy link" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
        {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <LinkIcon className="h-3.5 w-3.5" />}
      </button>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`} target="_blank" rel="noopener noreferrer" title="Share on LinkedIn"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:text-[#0077b5] hover:border-[#0077b5]/30 transition-colors">
        <LinkedinLogo className="h-3.5 w-3.5" />
      </a>
      <a href={`https://wa.me/?text=${encodedTitle}%20${encoded}`} target="_blank" rel="noopener noreferrer" title="Share on WhatsApp"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:text-[#25d366] hover:border-[#25d366]/30 transition-colors">
        <WhatsappLogo className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

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
      {headings.map(({ text, blockIndex }) => (
        <a key={blockIndex} href={`#section-${blockIndex}`}
          className={`block text-sm leading-snug py-1 px-2 rounded-lg transition-colors ${activeSection === blockIndex ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
          {text}
        </a>
      ))}
    </nav>
  );
}

export default function BlogArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null | 'loading'>('loading');
  const [scrollPct, setScrollPct] = useState(0);
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API}/blog/${slug}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setArticle(data))
      .catch(() => setArticle(null));
  }, [slug]);

  useEffect(() => {
    const art = article && article !== 'loading' ? article : null;
    function onScroll() {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPct(docH > 0 ? Math.min(100, Math.round((window.scrollY / docH) * 100)) : 0);
      setShowBackToTop(window.scrollY > 600);
      if (!art) return;
      const h2Indices = art.content.reduce<number[]>((acc, b, i) => {
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

  if (article === 'loading') {
    return (
      <>
        <MarketingNav />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
        <SiteFooter />
      </>
    );
  }

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

  return (
    <>
      <div className="fixed top-0 left-0 z-50 h-0.5 bg-primary transition-all duration-150" style={{ width: `${scrollPct}%` }} />
      <MarketingNav />

      <section className="border-b border-border bg-white px-6 pt-28 pb-10">
        <div className="mx-auto max-w-6xl">
          <Link href="/blog" className="mb-7 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <CaretLeft className="h-4 w-4" /> Back to Blog
          </Link>
          <div className="grid gap-10 lg:grid-cols-[1fr_300px] items-start">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}`}>{article.category}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" /> {article.readTime} read</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarBlank className="h-3.5 w-3.5" /> {formatDate(article.publishedAt)}</span>
              </div>
              <h1 className="text-3xl font-extrabold text-foreground leading-tight md:text-4xl xl:text-5xl">{article.title}</h1>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-2xl">{article.excerpt}</p>
              <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary shrink-0">
                    {article.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{article.author}</p>
                    <p className="text-xs text-muted-foreground">{article.authorRole}</p>
                  </div>
                </div>
                <ShareButton title={article.title} />
              </div>
            </div>
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

      <section className="px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-[1fr_260px]">
            <div ref={articleRef}>
              {article.content.map((block, i) => renderBlock(block, i))}
            </div>
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-5">
                <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                  <TableOfContents blocks={article.content} activeSection={activeSection} />
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-primary to-[#0a3560] p-5 text-white">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/60 mb-3">Get Started</p>
                  <p className="text-sm font-bold leading-snug mb-1">Ready to begin your journey?</p>
                  <p className="text-xs text-white/70 leading-relaxed mb-4">Free 30-min consultation. We map your full pathway — documents, exams, timeline, and costs.</p>
                  <Link href="/get-started" className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-primary hover:bg-white/90 transition-colors">
                    Book Free Consultation <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Progress</p>
                    <span className="text-xs font-bold text-primary">{scrollPct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-2 rounded-full ${accentClass} transition-all duration-300`} style={{ width: `${scrollPct}%` }} />
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="gradient-hero rounded-3xl p-8 text-white shadow-xl">
            <Badge className="mb-3 bg-white/20 text-white border-none">Free Consultation</Badge>
            <h2 className="text-2xl font-bold mb-2">Ready to Start Your Journey?</h2>
            <p className="text-blue-100 text-sm mb-6 max-w-md leading-relaxed">Book a free 30-minute consultation with one of our advisors.</p>
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

      {showBackToTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-all hover:scale-110" title="Back to top">
          <ArrowUp className="h-4 w-4" />
        </button>
      )}

      <SiteFooter />
    </>
  );
}
