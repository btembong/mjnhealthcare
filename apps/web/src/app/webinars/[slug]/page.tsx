import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { WebinarPage } from './webinar-page';
import type { PublicWebinar } from '../../../components/webinar-kit';

export const revalidate = 60;

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000') + '/api/v1';
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mjnhealthcare.com';

async function load(slug: string): Promise<PublicWebinar | null> {
  try {
    const res = await fetch(`${API}/webinars/public/${encodeURIComponent(slug)}`, { next: { revalidate: 60 } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const w = await load((await params).slug);
  if (!w) return { title: 'Webinar' };
  return {
    title: w.title,
    description: w.description.slice(0, 160),
    alternates: { canonical: `/webinars/${w.slug}` },
    openGraph: { title: w.title, description: w.description.slice(0, 200), url: `${SITE}/webinars/${w.slug}`, type: 'website' },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const w = await load((await params).slug);
  if (!w) notFound();
  // Lets search engines show the webinar as an event.
  const event = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: w.title,
    description: w.description,
    startDate: w.startAt,
    endDate: new Date(new Date(w.startAt).getTime() + w.durationMinutes * 60000).toISOString(),
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    eventStatus: w.cancelled ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
    inLanguage: w.language,
    isAccessibleForFree: true,
    location: { '@type': 'VirtualLocation', url: `${SITE}/webinars/${w.slug}` },
    organizer: { '@type': 'Organization', name: 'MJN Healthcare', url: SITE },
    offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD', availability: w.seatsLeft > 0 ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut', url: `${SITE}/webinars/${w.slug}` },
    ...(w.hosts.length ? { performer: w.hosts.map((name) => ({ '@type': 'Person', name })) } : {}),
  };
  return (
    <>
      <MarketingNav />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(event).replace(/</g, '\\u003c') }} />
      <WebinarPage initial={w} />
      <SiteFooter />
    </>
  );
}
