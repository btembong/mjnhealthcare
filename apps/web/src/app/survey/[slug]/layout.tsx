import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Survey',
  description: 'Share your feedback with MJN Healthcare.',
  // Surveys are shared by link; they should not appear in search results.
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
