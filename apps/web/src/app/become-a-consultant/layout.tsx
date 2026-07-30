import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Become a Consultant — Join the MJN Health Network',
  description:
    'Apply to join the MJN Health consultant network. Offer paid video consultations to clients across Africa and beyond. Licensed healthcare professionals and career consultants welcome.',
  openGraph: {
    title: 'Become a Consultant | MJN Health',
    description:
      'Join the MJN Health consultant network. 75% of each session fee, fully remote, established client base. Apply today.',
    url: 'https://mjnhealthcare.com/become-a-consultant',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
