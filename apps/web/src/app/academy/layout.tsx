import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Academy & Exam Prep — NCLEX, DHA, HAAD, NMC CBT',
  description:
    'Structured exam preparation for NCLEX-RN, DHA, HAAD/DOH, and NMC CBT. AI study assistant, live virtual classes, 5,000+ questions, and a 94% average pass rate. Available in English and French.',
  openGraph: {
    title: 'Healthcare Exam Prep — NCLEX, DHA, NMC CBT | MJN Healthcare',
    description:
      'Pass your licensing exam first attempt. AI tutor, live classes, and 5,000+ exam-specific questions. EN & FR. 94% pass rate.',
    url: 'https://mjnhealthcare.com/academy',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
