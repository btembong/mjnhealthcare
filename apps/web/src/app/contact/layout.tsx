import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with MJN Healthcare. Send a general enquiry, ask about a service, or reach us directly via email or WhatsApp. We respond within one business day.',
  openGraph: {
    title: 'Contact MJN Healthcare',
    description:
      'Send us an enquiry or reach out directly via WhatsApp. We respond to all messages within one business day.',
    url: 'https://mjnhealthcare.com/contact',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
