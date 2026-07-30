import type { Metadata } from 'next';
import { Exo_2 } from 'next/font/google';
import '../styles/globals.css';

const exo2 = Exo_2({ subsets: ['latin'], variable: '--font-exo2', display: 'swap', weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: 'Partner Portal | MJN Health',
  description: 'Post opportunities, review candidates, and manage your MJN Health partnership.',
};

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' className={exo2.variable}>
      <body className='bg-background font-sans text-foreground antialiased'>
        {children}
      </body>
    </html>
  );
}
