import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UK NMC Registration — NMC CBT & OSCE Support',
  description:
    'Full support for UK NMC registration for internationally educated nurses. NMC CBT prep, OSCE preparation, and NHS/private employer placement in England, Scotland, Wales, and Northern Ireland.',
  openGraph: {
    title: 'UK NMC Registration for Overseas Nurses | MJN Healthcare',
    description:
      'NMC CBT, OSCE support, and NHS employer placement. The complete pathway for African nurses registering with the UK Nursing and Midwifery Council.',
    url: 'https://mjnhealthcare.com/services/uk',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
