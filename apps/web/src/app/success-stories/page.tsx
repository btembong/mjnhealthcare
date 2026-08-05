'use client';

import Link from 'next/link';
import { MarketingNav } from '../../components/marketing-nav';
import { SiteFooter } from '../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import { ArrowRight, Star, Clock, MapPin } from '@phosphor-icons/react';
import { stories } from '../../lib/stories';

const stats = [
  { value: '1,200+', label: 'Professionals placed' },
  { value: '6', label: 'Countries served' },
  { value: '94%', label: 'First-attempt pass rate' },
  { value: '98%', label: 'DataFlow success rate' },
];

const destinations = [
  { flag: '🇦🇪', label: 'UAE', count: '600+', href: '/services/uae' },
  { flag: '🇬🇧', label: 'UK', count: '400+', href: '/services/uk' },
  { flag: '🇮🇪', label: 'Ireland', count: '150+', href: '/services/ireland' },
  { flag: '🇺🇸', label: 'US', count: '200+', href: '/services/us' },
];

export default function SuccessStoriesPage() {
  return (
    <>
      <MarketingNav />

      {/* HERO */}
      <section className="gradient-hero relative overflow-hidden pt-28 pb-16 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6">
          <Badge className="mb-4 border border-white/20 bg-white/10 text-white backdrop-blur-sm">
            Success Stories
          </Badge>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            1,200+ African Healthcare Professionals. Real Outcomes.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-blue-100">
            These are not testimonials we wrote. These are summaries of real engagements — with real timelines, real salaries, and real candour about what worked and why.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map(({ value, label }) => (
              <div key={label} className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur-sm">
                <p className="text-2xl font-extrabold sm:text-3xl">{value}</p>
                <p className="mt-1 text-xs text-blue-100">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DESTINATIONS FILTER BAR */}
      <section className="border-b border-border bg-white px-6 py-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:flex-wrap sm:pb-0">
            <span className="shrink-0 text-xs font-semibold text-muted-foreground uppercase tracking-wider">By destination:</span>
            {destinations.map(({ flag, label, count, href }) => (
              <Link
                key={label}
                href={href}
                className="shrink-0 flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm font-medium text-foreground hover:border-primary hover:bg-primary/5 transition-colors"
              >
                {flag} {label} <span className="text-xs text-muted-foreground">({count})</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* STORIES */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-2">
            {stories.map(({ slug, name, profession, from, to, pathway, duration, outcome, quote, rating, year, flag, photo }) => (
              <div key={name} className={`flex overflow-hidden rounded-2xl border border-border bg-white shadow-sm hover:shadow-md hover:border-primary/20 transition-all ${photo ? 'flex-col sm:flex-row' : 'flex-col'}`}>

                {/* Photo panel — stacks on mobile, side panel on sm+ */}
                {photo && (
                  <div className="relative h-44 w-full shrink-0 sm:h-auto sm:w-44">
                    <img
                      src={photo}
                      alt={name}
                      className="h-full w-full object-cover [object-position:center_20%] sm:object-top"
                    />
                    {/* Gradient overlay — bottom fade on mobile, right fade on sm+ */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white/10 to-transparent sm:inset-y-0 sm:inset-x-auto sm:right-0 sm:w-4 sm:h-auto sm:bg-gradient-to-r sm:from-transparent sm:to-white/10" />
                  </div>
                )}

                <div className="flex flex-col flex-1 min-w-0">
                  {/* Outcome headline — the visual anchor */}
                  <div className="bg-gradient-to-r from-teal-500/10 to-primary/10 border-b border-border px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 mb-1">Outcome</p>
                    <p className="font-bold text-foreground leading-snug text-sm">{outcome}</p>
                  </div>

                  <div className="flex flex-col gap-4 p-5 flex-1">
                    {/* Person + stars */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{flag}</span>
                          <p className="font-bold text-foreground">{name}</p>
                        </div>
                        <p className="text-sm font-medium text-primary">{profession}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {from} → {to}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex gap-0.5 justify-end">
                          {Array.from({ length: rating }).map((_, i) => (
                            <Star key={i} weight="fill" className="h-3.5 w-3.5 text-amber-400" />
                          ))}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{year}</p>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">{pathway}</span>
                      <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                        <Clock className="h-3 w-3" /> {duration}
                      </span>
                    </div>

                    {/* Quote */}
                    <blockquote className="border-l-2 border-primary/25 pl-4 text-sm text-muted-foreground leading-relaxed italic line-clamp-4">
                      &ldquo;{quote}&rdquo;
                    </blockquote>

                    {/* Read full story */}
                    <Link
                      href={`/success-stories/${slug}`}
                      className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      Read full story <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COULD THIS BE YOU */}
      <section className="bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">Could This Be You?</Badge>
            <h2 className="text-3xl font-bold">The Common Thread in Every Story</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Every professional above had the right clinical qualifications. What they were missing was a guide who knew the regulatory system from the inside.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'They had tried on their own first', sub: 'And lost months to preventable errors in documentation or exam prep.' },
              { label: 'They were matched to the right pathway', sub: 'Not a generic plan — a specific route based on their profession, nationality, and target market.' },
              { label: 'Their consultant had done it personally', sub: 'Every MJN advisor has personally completed the process they advise on, as an African professional.' },
            ].map(({ label, sub }) => (
              <div key={label} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="mb-3 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                </div>
                <p className="font-semibold text-foreground mb-2">{label}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DISCLAIMER */}
      <section className="border-t border-border bg-white px-6 py-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs text-muted-foreground leading-relaxed">
            All stories are based on real client engagements. Names are abbreviated for privacy. Salary figures are as reported at time of placement and are not guarantees of future earnings. Individual outcomes depend on qualifications, exam performance, employer requirements, and regulatory decisions outside MJN&apos;s control — as stated in every client engagement letter.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="gradient-hero relative overflow-hidden rounded-3xl p-7 sm:p-10 text-center text-white">
            <h2 className="text-4xl font-bold">Your Story Starts With a Conversation</h2>
            <p className="mx-auto mt-3 max-w-md text-blue-100">
              Book a free 30-minute consultation. We&apos;ll map your specific pathway — honestly, with realistic timelines.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="rounded-xl bg-white px-8 text-primary hover:bg-white/90" asChild>
                <Link href="/get-started">Book Free Consultation</Link>
              </Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10" asChild>
                <Link href="/services/global-placement">View All Services <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
