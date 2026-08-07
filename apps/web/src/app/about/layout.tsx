import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About MJN Healthcare — Founded by Professionals Who Lived This Journey',
  description:
    'MJN Healthcare was founded in 2016 by Mbout John Nyah, a registered nurse and MBA, after witnessing how preventable documentation failures derailed qualified African healthcare professionals. Today we have placed 350+ professionals across UAE, UK, US, and Ireland.',
  keywords: [
    'MJN Healthcare about', 'MJN Healthcare founder', 'Mbout John Nyah',
    'African healthcare consulting', 'international nursing agency', 'healthcare licensing Africa',
    'DHA licensing consultants', 'NMC registration help', 'NCLEX preparation Africa',
    'Cameroon healthcare professionals abroad',
  ],
  openGraph: {
    title: 'About MJN Healthcare | Founded by Professionals Who Lived This Journey',
    description: 'Founded in 2016 by a registered nurse who navigated international licensing himself. 350+ professionals placed. 6 countries. Every consultant has done it themselves.',
    url: 'https://mjnhealthcare.com/about',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About MJN Healthcare',
    description: 'Founded in 2016 by a registered nurse who navigated international licensing himself. 350+ professionals placed across UAE, UK, US, and Ireland.',
  },
  alternates: {
    canonical: 'https://mjnhealthcare.com/about',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
