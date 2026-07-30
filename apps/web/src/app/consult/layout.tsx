import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book an Expert Consultation — Health Advice & Career Guidance',
  description:
    'Book a 45-minute video consultation with a licensed healthcare professional or MJN career consultant. General health advice, licensing pathway planning, and career guidance. Pay online — no account needed.',
  openGraph: {
    title: 'Book an Expert Consultation | MJN Health',
    description:
      'Health advice or career & licensing guidance — 45 minutes, secure video call, pay online. No account needed.',
    url: 'https://mjnhealthcare.com/consult',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
