import type { Metadata } from 'next';
import { FeedbackClient } from './feedback-client';

export const metadata: Metadata = { title: 'Webinar feedback', robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  return <FeedbackClient token={(await params).token} />;
}
