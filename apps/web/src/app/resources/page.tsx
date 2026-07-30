'use client';

import { MarketingNav } from '../../components/marketing-nav';
import { SiteFooter } from '../../components/site-footer';
import { ResourcesTabs } from '../../components/resources-tabs';
import { Badge } from '@mjn/ui';

export default function ResourcesPage() {
  return (
    <>
      <MarketingNav />

      {/* HERO */}
      <section className="border-b border-border bg-white px-6 pt-28 pb-10">
        <div className="mx-auto max-w-6xl">
          <Badge variant="outline" className="mb-3">Resources</Badge>
          <h1 className="text-5xl font-extrabold text-foreground">
            Free Resources for Healthcare Professionals
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Checklists, guides, webinars, articles, and tools — everything you need to understand your licensing pathway before committing to a consultation.
          </p>
        </div>
      </section>

      {/* TABS */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <ResourcesTabs />
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
