import type { Metadata } from 'next';
import { Exo_2 } from 'next/font/google';
import { Toaster } from '@mjn/ui';
import { CommandPalette } from '../components/command-palette';
import '../styles/globals.css';

const exo2 = Exo_2({
  subsets: ['latin'],
  variable: '--font-exo2',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'My Dashboard | MJN Healthcare',
  description: 'Manage your licensing journey, documents, and academy access.',
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={exo2.variable}>
      <body className="bg-background font-sans text-foreground antialiased">
        {children}
        <CommandPalette />
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
