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
    template: '%s | MJN Healthcare Academy',
    default: 'MJN Healthcare Academy and Professional Services',
  },
  description:
    'Healthcare career consulting — global placement, licensing support, exam preparation, and student services across Africa, UAE, UK, US, and Ireland.',
  keywords: ['healthcare', 'nursing', 'NCLEX', 'DHA', 'HAAD', 'NMC', 'staffing', 'Africa', 'UAE', 'UK', 'Ireland', 'Cameroon'],
  authors: [{ name: 'MJN Healthcare Academy and Professional Services' }],
  creator: 'MJN Healthcare Academy',

  // Favicon — icon.tsx and apple-icon.tsx in this directory are picked up
  // automatically by Next.js App Router and generate the <link rel="icon">
  // and <link rel="apple-touch-icon"> tags. The entries below are explicit
  // fallbacks and supplement the file-based convention.
  icons: {
    icon: [
      // File-based icon.tsx generates this route automatically;
      // listing it explicitly ensures the correct sizes hint in <head>.
      { url: '/icon', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
    // Classic /favicon.ico fallback — place a favicon.ico in apps/web/src/app/
    // or apps/web/public/ to enable this. Without it, browsers fall back to /icon.
    shortcut: '/favicon.ico',
  },

  // Web app manifest — enables PWA install prompt and helps Google
  // associate brand identity with the domain.
  manifest: '/manifest.json',

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'MJN Healthcare Academy and Professional Services',
    title: 'MJN Healthcare Academy and Professional Services',
    description:
      'Healthcare career consulting — global placement, licensing support (UAE, UK, US, Ireland), exam preparation (NCLEX, DHA, NMC CBT), and student services.',
    images: [
      {
        url: `${BASE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'MJN Healthcare Academy and Professional Services',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MJN Healthcare Academy and Professional Services',
    description:
      'Global healthcare placement, licensing support, and exam prep — built for African health professionals.',
    images: [`${BASE_URL}/opengraph-image`],
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
      <head>
        {/* Explicit theme colour for Android Chrome address bar and
            for Google's brand-colour display in search results */}
        <meta name="theme-color" content="#0F4C81" />
      </head>
      <body className="bg-background font-sans text-foreground antialiased">
        {children}
        <CookieBanner />
        <SupportBot />
      </body>
    </html>
  );
}
