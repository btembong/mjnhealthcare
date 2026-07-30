import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog — Healthcare Licensing & Career Guides',
  description:
    'Practical guides on healthcare licensing (DHA, NMC, NCLEX, AHPRA), DataFlow documentation, salary benchmarks, and career pathways for African health professionals going abroad.',
  openGraph: {
    title: 'Healthcare Licensing & Career Guides | MJN Health Blog',
    description:
      'Expert guides on DHA, NMC, NCLEX, DataFlow, Irish NMBI, and more. Written for African health professionals planning to work abroad.',
    url: 'https://mjnhealthcare.com/blog',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
