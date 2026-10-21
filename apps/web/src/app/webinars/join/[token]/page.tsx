import type { Metadata } from 'next';
import { WebinarRoom } from './webinar-room';

// A personal link: never listed by search engines.
export const metadata: Metadata = {
  title: 'Webinar',
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  return <WebinarRoom token={(await params).token} />;
}
