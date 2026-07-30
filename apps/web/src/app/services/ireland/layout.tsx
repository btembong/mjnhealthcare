import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ireland NMBI Registration — Critical Skills Employment Permit',
  description:
    'Full NMBI registration support for internationally educated nurses in Ireland. Competency assessment, English requirements, Critical Skills Employment Permit, and HSE/private employer placement.',
  openGraph: {
    title: 'Ireland NMBI Nursing Registration | MJN Health',
    description:
      'NMBI competency assessment, Critical Skills Employment Permit support, and Irish healthcare employer placement for African nurses.',
    url: 'https://mjnhealthcare.com/services/ireland',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
