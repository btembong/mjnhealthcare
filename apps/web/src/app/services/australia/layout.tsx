import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Australia AHPRA & AMC Registration — Skilled Visa Support',
  description:
    'AHPRA registration and AMC examination support for nurses, physicians, and allied health professionals. Employer placement and skilled visa (subclass 482/189/190) assistance across Australia.',
  openGraph: {
    title: 'Australia AHPRA & AMC Healthcare Registration | MJN Health',
    description:
      'AHPRA/AMC registration, English assessment, employer placement, and skilled PR visa pathway for African healthcare professionals.',
    url: 'https://mjnhealthcare.com/services/australia',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
