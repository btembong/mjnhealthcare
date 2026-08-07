import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Resource Library — Checklists, Guides & Fee Schedules | MJN Healthcare',
  description:
    'Download free licensing checklists, exam guides, fee schedules, and career resources for healthcare professionals pursuing UAE, UK, US, and Ireland registration. Updated 2026.',
  keywords: [
    'DataFlow checklist', 'DHA licensing guide', 'NCLEX study guide', 'NMC registration guide',
    'UAE healthcare licensing', 'NMBI checklist Ireland', 'healthcare salary benchmarks',
    'free nursing resources', 'MJN healthcare guides',
  ],
  openGraph: {
    title: 'Free Resource Library | MJN Healthcare',
    description: 'Checklists, guides, and fee schedules for international healthcare licensing — UAE, UK, US, Ireland. Free to download.',
    url: 'https://mjnhealthcare.com/resources/library',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Resource Library | MJN Healthcare',
    description: 'Checklists, guides, and fee schedules for international healthcare licensing. Free to download.',
  },
  alternates: {
    canonical: 'https://mjnhealthcare.com/resources/library',
  },
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
