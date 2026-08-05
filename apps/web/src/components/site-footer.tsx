'use client';

import Link from 'next/link';
import { Envelope, ChatCircle } from '@phosphor-icons/react';

const footerServices = [
  { label: 'Global Placement', href: '/services/global-placement' },
  { label: 'UAE Licensing (DHA / MOH)', href: '/services/uae' },
  { label: 'UK Placement (NMC)', href: '/services/uk' },
  { label: 'US (NCLEX / CGFNS)', href: '/services/us' },
  { label: 'Ireland (NMBI)', href: '/services/ireland' },
  { label: 'Healthcare Staffing', href: '/services/staffing' },
  { label: 'Career Planning', href: '/services/career-planning' },
  { label: 'Onboarding & Relocation', href: '/services/relocation' },
  { label: 'Health Training', href: '/services/health-training' },
  { label: 'Health Consultation', href: '/consult' },
  { label: 'Student Support', href: '/services/student-support' },
  { label: 'CPD Programs', href: '/services/cpd' },
];

const footerAcademy = [
  { label: 'NCLEX Prep', href: '/academy/nclex' },
  { label: 'DHA Exam Prep', href: '/academy/dha' },
  { label: 'HAAD / DOH Prep', href: '/academy/haad' },
  { label: 'NMC CBT Prep', href: '/academy/cbt' },
  { label: 'AI Study Assistant', href: '/academy/ai-tutor' },
  { label: 'Live Classes', href: '/academy/live' },
];

const footerCompany = [
  { label: 'About Us', href: '/about' },
  { label: 'Our Team', href: '/team' },
  { label: 'Success Stories', href: '/success-stories' },
  { label: 'Blog & Articles', href: '/blog' },
  { label: 'Resources', href: '/resources' },
  { label: 'Careers', href: '/careers' },
  { label: 'Partner With Us', href: '/partner' },
  { label: 'Contact', href: '/contact' },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-white px-6 pt-12 pb-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <img src="/mjnlogo.png" alt="MJN Healthcare" className="h-9 w-auto object-contain" />
              <span className="font-bold text-foreground">MJN Healthcare</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Healthcare career consulting for nurses, physicians, and allied health professionals from Africa.
              Licensing, exam prep, and international placement — all in one engagement.
            </p>
            <div className="mt-5 space-y-2 text-sm">
              <a
                href="mailto:hello@mjnhealthcare.com"
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Envelope className="h-3.5 w-3.5" /> hello@mjnhealthcare.com
              </a>
              <a
                href="https://wa.me/971508638660"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChatCircle className="h-3.5 w-3.5" /> WhatsApp us
              </a>
            </div>
            <div className="mt-5 flex gap-3">
              <a
                href="https://www.facebook.com/mjnhealthacademy"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-8 items-center justify-center rounded-lg border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Facebook
              </a>
              <a
                href="https://www.linkedin.com/company/mjn-health-academy"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="flex h-8 items-center justify-center rounded-lg border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                LinkedIn
              </a>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">Services</p>
            <ul className="space-y-2">
              {footerServices.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">Academy</p>
            <ul className="space-y-2">
              {footerAcademy.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">Company</p>
            <ul className="space-y-2">
              {footerCompany.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 space-y-3">
          <p className="text-xs text-muted-foreground text-center">
            Ministerial Authorization No. M032517649867P/RC/YAO/2025/B/637
          </p>
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © 2026 MJN Health Academy and Professional Services Ltd. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-5">
            {[
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms of Service', href: '/terms' },
              { label: 'Cookie Policy', href: '/cookies' },
            ].map(({ label, href }) => (
              <Link key={label} href={href} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                {label}
              </Link>
            ))}
          </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
