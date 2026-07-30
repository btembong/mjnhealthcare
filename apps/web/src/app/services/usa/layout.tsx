import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'USA NCLEX & CGFNS Licensing — US Nursing Placement',
  description:
    'End-to-end US nursing licensing for internationally educated nurses. CGFNS/ERES credential evaluation, VisaScreen, NCLEX-RN exam prep, and employer placement across US states.',
  openGraph: {
    title: 'USA NCLEX & CGFNS Licensing for Overseas Nurses | MJN Health',
    description:
      'CGFNS credential evaluation, VisaScreen, NCLEX-RN, and US nursing employer placement. Full support from Africa to the United States.',
    url: 'https://mjnhealthcare.com/services/usa',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
