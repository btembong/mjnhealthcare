import type { Metadata } from 'next';
import { Exo_2 } from 'next/font/google';
import { Toaster } from '@mjn/ui';
import { CommandPalette } from '../components/command-palette';
import '../styles/globals.css';

const exo2 = Exo_2({ subsets: ['latin'], variable: '--font-exo2', display: 'swap', weight: ['400', '500', '600', '700', '800'] });

export const metadata: Metadata = {
  title: 'Admin Console | MJN Health',
  description: 'Internal operations — caseload, compliance, and reporting.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
