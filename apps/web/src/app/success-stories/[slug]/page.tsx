'use client';

import { use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import {
  ArrowLeft,
  ArrowRight,
  Star,
  MapPin,
  Clock,
  CheckCircle,
  Quotes,
} from '@phosphor-icons/react';
import { stories } from '../../../lib/stories';

export default function StoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const story = stories.find((s) => s.slug === slug);
  if (!story) notFound();

  const {
    name,
    fullName,
    profession,
    from,
    to,
    pathway,
    duration,
    outcome,
    quote,
    rating,
    year,
    flag,
    photo,
    fullStory,
    timeline,
  } = story;

  return (
    <>
      <MarketingNav />

      {/* HERO */}
      <section className="relative overflow-hidden pt-20 sm:pt-24">
        {photo ? (
          /* Photo hero */
          <div className="relative h-72 w-full sm:h-96">
            <img
              src={photo}
              alt={fullName ?? name}
              className="h-full w-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A2540]/90 via-[#0A2540]/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end px-6 pb-8">
              <div className="mx-auto w-full max-w-4xl">
                <Link
                  href="/success-stories"
                  className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Success Stories
                </Link>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{flag}</span>
                  <Badge className="border border-white/20 bg-white/10 text-white backdrop-blur-sm text-xs">
                    {pathway}
                  </Badge>
                </div>
                <h1 className="text-3xl font-extrabold text-white leading-tight sm:text-4xl">
                  {fullName ?? name}
                </h1>
                <p className="mt-1 text-base text-blue-200 font-medium">{profession}</p>
              </div>
            </div>
          </div>
        ) : (
          /* Gradient hero (no photo) */
          <div className="gradient-hero px-6 pb-12 pt-8 text-white">
            <div className="mx-auto max-w-4xl">
              <Link
                href="/success-stories"
                className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Success Stories
              </Link>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{flag}</span>
                <Badge className="border border-white/20 bg-white/10 text-white backdrop-blur-sm text-xs">
                  {pathway}
                </Badge>
              </div>
              <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">
                {fullName ?? name}
              </h1>
              <p className="mt-2 text-lg text-blue-200 font-medium">{profession}</p>
            </div>
          </div>
        )}
      </section>

      {/* OUTCOME STRIP */}
      <section className="border-b border-border bg-gradient-to-r from-teal-500/10 to-primary/10 px-6 py-5">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 mb-1">Outcome</p>
          <p className="font-bold text-foreground text-base sm:text-lg leading-snug">{outcome}</p>
        </div>
      </section>

      {/* JOURNEY META */}
      <section className="border-b border-border bg-white px-6 py-5">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <span><span className="font-semibold text-foreground">{from}</span> → <span className="font-semibold text-foreground">{to}</span></span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0 text-primary" />
              <span>{duration}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Year</span>
              <span className="font-semibold text-foreground">{year}</span>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              {Array.from({ length: rating }).map((_, i) => (
                <Star key={i} weight="fill" className="h-4 w-4 text-amber-400" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-12 lg:grid-cols-3">

            {/* Left — story */}
            <div className="lg:col-span-2 space-y-10">

              {/* Pull quote */}
              <div className="relative rounded-2xl bg-gradient-to-br from-primary/5 to-teal-500/5 border border-primary/10 p-7 sm:p-9">
                <Quotes weight="fill" className="absolute top-5 left-5 h-8 w-8 text-primary/15" />
                <blockquote className="relative text-base sm:text-lg text-foreground leading-relaxed italic font-medium">
                  &ldquo;{quote}&rdquo;
                </blockquote>
                <p className="mt-5 text-sm font-semibold text-primary">— {name}</p>
              </div>

              {/* Full narrative */}
              <div>
                <h2 className="text-xl font-bold text-foreground mb-5">The Journey</h2>
                <div className="space-y-4">
                  {fullStory.map((para, i) => (
                    <p key={i} className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h2 className="text-xl font-bold text-foreground mb-6">Step by Step</h2>
                <ol className="relative border-l-2 border-primary/20 space-y-0">
                  {timeline.map(({ step, label, detail }, i) => (
                    <li key={step} className={`relative pl-8 ${i < timeline.length - 1 ? 'pb-7' : ''}`}>
                      {/* Step dot */}
                      <div className="absolute -left-[11px] top-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold ring-4 ring-white">
                        {step}
                      </div>
                      <p className="font-semibold text-foreground text-sm">{label}</p>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{detail}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-6">

              {/* Quick facts */}
              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Quick Facts</p>
                <ul className="space-y-3 text-sm">
                  {[
                    { label: 'Profession', value: profession },
                    { label: 'From', value: from },
                    { label: 'Destination', value: to },
                    { label: 'Pathway', value: pathway },
                    { label: 'Timeline', value: duration },
                  ].map(({ label, value }) => (
                    <li key={label} className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className="font-semibold text-foreground leading-snug">{value}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA card */}
              <div className="gradient-hero rounded-2xl p-6 text-white">
                <p className="font-bold text-base mb-2">Start your own journey</p>
                <p className="text-sm text-blue-100 leading-relaxed mb-5">
                  Book a free 30-minute consultation. We&apos;ll map your specific pathway with realistic timelines.
                </p>
                <Button
                  size="sm"
                  className="w-full rounded-xl bg-white text-primary hover:bg-white/90 font-bold"
                  asChild
                >
                  <Link href="/get-started">
                    Book Free Consultation <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>

              {/* Outcomes */}
              <div className="rounded-2xl border border-border bg-muted/30 p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">MJN Track Record</p>
                <ul className="space-y-2.5">
                  {[
                    '1,200+ professionals placed',
                    '94% first-attempt pass rate',
                    '98% DataFlow success rate',
                    '6 countries served',
                  ].map((fact) => (
                    <li key={fact} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle weight="fill" className="h-4 w-4 shrink-0 mt-0.5 text-teal-600" />
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* DISCLAIMER */}
      <section className="border-t border-border bg-white px-6 py-6">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs text-muted-foreground leading-relaxed">
            This story is based on a real client engagement. Name is abbreviated for privacy. Salary figures are as reported at time of placement and are not guarantees of future earnings. Individual outcomes depend on qualifications, exam performance, employer requirements, and regulatory decisions outside MJN&apos;s control — as stated in every client engagement letter.
          </p>
        </div>
      </section>

      {/* MORE STORIES */}
      <section className="bg-muted/30 px-6 py-10">
        <div className="mx-auto max-w-4xl flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="font-bold text-foreground">Read more success stories</p>
            <p className="text-sm text-muted-foreground mt-0.5">1,200+ professionals placed — real outcomes, real timelines.</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/success-stories">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> All Stories
            </Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
