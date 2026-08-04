import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Get Started — Book a Free Consultation',
  description:
    'Start your healthcare career journey with a free 30-minute consultation. Tell us your profession, destination, and goals — we will map the right pathway and give you a realistic timeline.',
  openGraph: {
    title: 'Book a Free Consultation | MJN Healthcare',
    description:
      'Free 30-minute consultation with an assigned MJN Healthcare consultant. We map your licensing pathway, timeline, and costs — no obligation.',
    url: 'https://mjnhealthcare.com/get-started',
  },
  robots: { index: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
