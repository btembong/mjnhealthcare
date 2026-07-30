'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import { ArrowLeft, ArrowRight, MapPin } from '@phosphor-icons/react';
import { members } from '../page';

interface Props {
  params: Promise<{ slug: string }>;
}

export default function TeamMemberPage({ params }: Props) {
  const { slug } = use(params);
  const member = members.find((m) => m.slug === slug);
  if (!member) notFound();

  const { name, role, initials, location, flag, background, bio, expertise, credibility, photo } = member;

  const currentIndex = members.indexOf(member);
  const prev = members[currentIndex - 1] ?? null;
  const next = members[currentIndex + 1] ?? null;

  return (
    <>
      <MarketingNav />

      {/* HERO */}
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
            <ArrowLeft className="h-4 w-4" /> Back to Team
          </Link>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:gap-14">
            {/* Photo area */}
            <div className="relative h-48 w-48 shrink-0 overflow-hidden rounded-3xl ring-4 ring-white/20">
              {photo ? (
                <img src={photo} alt={name} className="h-full w-full object-cover object-top" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/10 backdrop-blur-sm">
                  <span className="text-6xl font-extrabold text-white/90 tracking-tight">{initials}</span>
                </div>
              )}
            </div>

            <div className="pb-2 text-white">
              <p className="mb-2 text-sm font-semibold text-white/60 uppercase tracking-widest">{role}</p>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">{name}</h1>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-white/70">
                <MapPin className="h-4 w-4" /> {flag} {location}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {expertise.map((e) => (
                  <span key={e} className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CREDIBILITY HOOK */}
      <section className="border-b border-border bg-white px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl bg-primary/5 border border-primary/15 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Why This Matters</p>
            <p className="text-base font-semibold text-foreground leading-relaxed">{credibility}</p>
          </div>
        </div>
      </section>

      {/* BIO + BACKGROUND */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Badge variant="outline" className="mb-4">Background</Badge>
              <p className="text-foreground leading-relaxed">{bio}</p>
            </div>
            <div>
              <Badge variant="outline" className="mb-4">Credentials</Badge>
              <div className="rounded-2xl border border-border bg-muted/30 p-5">
                <p className="text-sm text-muted-foreground leading-relaxed">{background}</p>
              </div>
              <div className="mt-5">
                <Badge variant="outline" className="mb-3">Areas of Expertise</Badge>
                <div className="flex flex-wrap gap-2">
                  {expertise.map((e) => (
                    <span key={e} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BOOK WITH THIS CONSULTANT */}
      <section className="bg-muted/30 px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-white p-8 text-center shadow-sm sm:flex-row sm:text-left">
            <div className="flex-1">
              <p className="font-bold text-foreground text-lg">Book a Consultation</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Mention {name.split(' ')[0]} in your consultation request and we will do our best to match you with them based on your pathway and availability.
              </p>
            </div>
            <Button className="shrink-0 rounded-xl" asChild>
              <Link href="/get-started">Book Free Consultation <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* PREV / NEXT NAVIGATION */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-4xl flex items-center justify-between gap-4">
          {prev ? (
            <Link
              href={`/team/${prev.slug}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 shadow-sm hover:border-primary/30 hover:shadow-md transition-all flex-1"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Previous</p>
                <p className="text-sm font-semibold text-foreground">{prev.name}</p>
              </div>
            </Link>
          ) : <div className="flex-1" />}

          {next ? (
            <Link
              href={`/team/${next.slug}`}
              className="flex items-center justify-end gap-3 rounded-xl border border-border bg-white p-4 shadow-sm hover:border-primary/30 hover:shadow-md transition-all flex-1 text-right"
            >
              <div>
                <p className="text-xs text-muted-foreground">Next</p>
                <p className="text-sm font-semibold text-foreground">{next.name}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          ) : <div className="flex-1" />}
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
