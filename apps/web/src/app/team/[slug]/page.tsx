import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { members } from '../data';

// ── Static generation ─────────────────────────────────────────────────────────

export function generateStaticParams() {
  return members.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const m = members.find((x) => x.slug === slug);
  if (!m) return {};

  const title = `${m.name} — ${m.role} | MJN Healthcare`;
  const description = m.credibility + ' ' + m.bio.slice(0, 120) + '…';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://mjnhealthcare.com/team/${slug}`,
      type: 'profile',
    },
    twitter: { card: 'summary', title, description },
    alternates: { canonical: `https://mjnhealthcare.com/team/${slug}` },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TeamMemberPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const member = members.find((m) => m.slug === slug);
  if (!member) notFound();

  const { name, role, initials, background, bio, expertise, credibility, credentials, languages, photo } = member;

  const currentIndex = members.indexOf(member);
  const prev = members[currentIndex - 1] ?? null;
  const next = members[currentIndex + 1] ?? null;

  // JSON-LD Person schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    jobTitle: role,
    worksFor: { '@type': 'Organization', name: 'MJN Health Academy and Professional Services', url: 'https://mjnhealthcare.com' },

    knowsAbout: expertise,
    url: `https://mjnhealthcare.com/team/${slug}`,
    ...(photo ? { image: `https://mjnhealthcare.com${photo}` } : {}),
  };

  return (
    <>
      <MarketingNav />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="gradient-hero relative overflow-hidden pt-28 pb-0">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 pb-20">
          <Link
            href="/team"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to Team
          </Link>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:gap-14">
            {/* Photo / avatar */}
            <div className="relative h-44 w-44 shrink-0 overflow-hidden rounded-3xl ring-4 ring-white/20 shadow-2xl">
              {photo ? (
                <img src={photo} alt={name} className="h-full w-full object-cover object-top" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/10 backdrop-blur-sm">
                  <span className="text-5xl font-extrabold text-white/90 tracking-tight select-none">{initials}</span>
                </div>
              )}
              {/* Language badges */}
              <div className="absolute bottom-2 right-2 flex gap-1">
                {languages.map((lang) => (
                  <span key={lang} className="rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            <div className="pb-2 text-white">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/50">{role}</p>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">{name}</h1>
              <div className="mt-5 flex flex-wrap gap-2">
                {expertise.map((e) => (
                  <span key={e} className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm ring-1 ring-white/10">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CREDIBILITY HOOK ───────────────────────────────────────────── */}
      <section className="border-b border-border bg-white px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-primary/15 bg-primary/5 px-6 py-5">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-primary">Why This Matters</p>
            <p className="text-base font-semibold text-foreground leading-relaxed">{credibility}</p>
          </div>
        </div>
      </section>

      {/* ── BIO + SIDEBAR ──────────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-10 lg:grid-cols-3">

            {/* Bio — main column */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Background</p>
                <div className="mt-3 h-0.5 w-8 rounded-full bg-primary mb-5" />
                <p className="text-foreground leading-relaxed">{bio}</p>
              </div>

              {/* What I handle */}
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Areas of Expertise</p>
                <div className="mt-3 h-0.5 w-8 rounded-full bg-primary mb-5" />
                <div className="grid gap-3 sm:grid-cols-2">
                  {expertise.map((e) => (
                    <div key={e} className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 px-4 py-3">
                      <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-primary/15 flex items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">{e}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Credentials */}
              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Credentials</p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{background}</p>
                <div className="flex flex-wrap gap-1.5">
                  {credentials.map((c) => (
                    <span key={c} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Languages</p>
                <div className="flex gap-2">
                  {languages.map((lang) => (
                    <span key={lang} className="rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm font-bold text-foreground">
                      {lang === 'EN' ? '🇬🇧 English' : lang === 'FR' ? '🇫🇷 French' : lang}
                    </span>
                  ))}
                </div>
              </div>

              {/* Book CTA */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                <p className="font-bold text-foreground">Work with {name.split(' ')[0]}</p>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Book a consultation and mention {name.split(' ')[0]} — we will match you based on your pathway and their availability.
                </p>
                <Link
                  href="/consult"
                  className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
                >
                  Book a Consultation
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PREV / NEXT ────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-muted/20 px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <p className="mb-5 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">Meet the rest of the team</p>
          <div className="flex items-stretch gap-4">
            {prev ? (
              <Link
                href={`/team/${prev.slug}`}
                className="group flex flex-1 items-center gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm hover:border-primary/30 hover:shadow-md transition-all"
              >
                <svg className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Previous</p>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{prev.name}</p>
                  <p className="text-xs text-muted-foreground">{prev.role.split('—')[0].trim()}</p>
                </div>
              </Link>
            ) : <div className="flex-1" />}

            {next ? (
              <Link
                href={`/team/${next.slug}`}
                className="group flex flex-1 items-center justify-end gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm hover:border-primary/30 hover:shadow-md transition-all text-right"
              >
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Next</p>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{next.name}</p>
                  <p className="text-xs text-muted-foreground">{next.role.split('—')[0].trim()}</p>
                </div>
                <svg className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            ) : <div className="flex-1" />}
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
