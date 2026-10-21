import type { Metadata } from 'next';
import { MarketingNav } from '../../../components/marketing-nav';
import { SiteFooter } from '../../../components/site-footer';
import { WebinarsBrowser } from './webinars-browser';
import type { PublicWebinar } from '../../../components/webinar-kit';

export const metadata: Metadata = {
  title: 'Free webinars',
  description: 'Free live webinars on licensing, exams and working abroad, hosted by MJN Healthcare consultants in English and in French. Replays available to everyone.',
  alternates: { canonical: '/resources/webinars' },
};

// Refreshed every minute, so new webinars and seat counts appear without a rebuild.
export const revalidate = 60;

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000') + '/api/v1';

async function load(): Promise<{ upcoming: PublicWebinar[]; replays: PublicWebinar[] }> {
  try {
    const res = await fetch(`${API}/webinars/public`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  } catch {
    return { upcoming: [], replays: [] };
  }
}

export default async function WebinarsPage() {
  const data = await load();
  return (
    <>
      <MarketingNav />
      <WebinarsBrowser upcoming={data.upcoming} replays={data.replays} />
      <SiteFooter />
    </>
  );
}
