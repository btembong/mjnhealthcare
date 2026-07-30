import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UAE Healthcare Licensing — DHA, MOH, DOH Support',
  description:
    'End-to-end UAE healthcare licensing support for nurses, physicians, and allied health professionals. DataFlow verification, DHA/MOH/DOH exam prep, and employer placement in Dubai and Abu Dhabi.',
  openGraph: {
    title: 'UAE Healthcare Licensing — DHA, MOH & DOH | MJN Health',
    description:
      'DataFlow verification, DHA/MOH/DOH licensing, and employer placement in Dubai and Abu Dhabi. Built for African health professionals.',
    url: 'https://mjnhealthcare.com/services/uae',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
