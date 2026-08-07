import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Team — Healthcare Licensing Specialists | MJN Healthcare',
  description:
    'Meet the MJN Healthcare team — six specialists across Cameroon, Nigeria, Ireland, and the UK who have personally navigated the licensing and placement pathways they advise on.',
  keywords: [
    'MJN Healthcare team', 'healthcare licensing consultants', 'international nurse licensing',
    'African healthcare professionals', 'NCLEX advisor', 'UAE DHA licensing specialist',
    'NMC registration consultant', 'NMBI Ireland nurse',
  ],
  openGraph: {
    title: 'Our Team | MJN Healthcare',
    description: 'Six specialists. Four countries. Every team member has personally navigated the process they now advise on.',
    url: 'https://mjnhealthcare.com/team',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Our Team | MJN Healthcare',
    description: 'Six specialists. Four countries. Every team member has personally navigated the process they now advise on.',
  },
  alternates: {
    canonical: 'https://mjnhealthcare.com/team',
  },
};

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
