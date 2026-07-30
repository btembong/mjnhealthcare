import type { Metadata } from 'next';
import { Exo_2 } from 'next/font/google';
import '../styles/globals.css';
import { CookieBanner } from '../components/cookie-banner';
import { SupportBot } from '../components/support-bot';

const exo2 = Exo_2({
  subsets: ['latin'],
  variable: '--font-exo2',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mjnhealthcare.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: '%s | MJN Health Academy',
    default: 'MJN Health Academy and Professional Services',
  },
  description:
    'Healthcare career consulting — global placement, licensing support, exam preparation, and student services across Africa, UAE, UK, US, and Ireland.',
  keywords: ['healthcare', 'nursing', 'NCLEX', 'DHA', 'HAAD', 'NMC', 'staffing', 'Africa', 'UAE', 'UK', 'Ireland', 'Cameroon'],
  authors: [{ name: 'MJN Health Academy and Professional Services' }],
  creator: 'MJN Health Academy',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'MJN Health Academy and Professional Services',
    title: 'MJN Health Academy and Professional Services',
    description:
      'Healthcare career consulting — global placement, licensing support (UAE, UK, US, Ireland), exam preparation (NCLEX, DHA, NMC CBT), and student services.',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'MJN Health Academy and Professional Services',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MJN Health Academy and Professional Services',
    description:
      'Global healthcare placement, licensing support, and exam prep — built for African health professionals.',
    images: ['/og-default.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={exo2.variable}>
      <body className="bg-background font-sans text-foreground antialiased">
        {children}
        <CookieBanner />
        <SupportBot />
      </body>
    </html>
  );
}
