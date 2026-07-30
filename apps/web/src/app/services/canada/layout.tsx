import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Canada NNAS & NCLEX-RN — Canadian Nursing Licensing',
  description:
    'NNAS credential assessment, provincial nursing registration, NCLEX-RN exam prep, and Canadian employer placement for internationally educated nurses and healthcare professionals.',
  openGraph: {
    title: 'Canada NNAS & NCLEX-RN Nursing Licensing | MJN Health',
    description:
      'NNAS assessment, NCLEX-RN prep, and Canadian employer placement. Full nursing licensing support from Africa to Canada.',
    url: 'https://mjnhealthcare.com/services/canada',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
