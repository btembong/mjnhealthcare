'use client';

import Link from 'next/link';
import React from 'react';
import { Envelope, ChatCircle, Plus, Minus } from '@phosphor-icons/react';

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

const footerSections = [
  { title: 'Services', links: footerServices },
  { title: 'Academy', links: footerAcademy },
  { title: 'Company', links: footerCompany },
];

export function SiteFooter() {
  const [openSection, setOpenSection] = React.useState<string | null>('Company');

  function toggle(title: string) {
    setOpenSection((prev) => (prev === title ? null : title));
  }

  return (
    <footer className="border-t border-border bg-white px-6 pt-12 pb-8">
      <div className="mx-auto max-w-6xl">

        {/* Brand — always visible */}
        <div className="mb-8 lg:hidden">
          <div className="flex items-center gap-2">
            <img src="/mjnlogo.png" alt="MJN Healthcare" className="h-9 w-auto object-contain" />
            <span className="font-bold text-foreground">MJN Healthcare</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Healthcare career consulting for nurses, physicians, and allied health professionals from Africa.
          </p>
          <div className="mt-4 space-y-2 text-sm">
            <a href="mailto:hello@mjnhealthcare.com" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <Envelope className="h-3.5 w-3.5" /> hello@mjnhealthcare.com
            </a>
            <a href="https://wa.me/971508638660" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ChatCircle className="h-3.5 w-3.5" /> WhatsApp us
            </a>
          </div>
          <div className="mt-4 flex gap-3">
            <a href="https://www.facebook.com/mjnhealthacademy" target="_blank" rel="noopener noreferrer" className="flex h-8 items-center justify-center rounded-lg border border-border px-2.5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary">Facebook</a>
            <a href="https://www.linkedin.com/company/mjn-health-academy" target="_blank" rel="noopener noreferrer" className="flex h-8 items-center justify-center rounded-lg border border-border px-2.5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary">LinkedIn</a>
          </div>
        </div>

        {/* Mobile: accordion link sections */}
        <div className="divide-y divide-border border-t border-border lg:hidden">
          {footerSections.map(({ title, links }) => (
            <div key={title}>
              <button
                onClick={() => toggle(title)}
                className="flex w-full items-center justify-between py-4 text-sm font-semibold text-foreground"
              >
                {title}
                {openSection === title
                  ? <Minus className="h-4 w-4 text-muted-foreground" />
                  : <Plus className="h-4 w-4 text-muted-foreground" />}
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openSection === title ? 'max-h-96 pb-4' : 'max-h-0'}`}>
                <ul className="space-y-3">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <Link href={href} className="text-sm text-muted-foreground hover:text-foreground">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: 5-column grid — unchanged */}
        <div className="hidden lg:grid gap-10 grid-cols-5">
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <img src="/mjnlogo.png" alt="MJN Healthcare" className="h-9 w-auto object-contain" />
              <span className="font-bold text-foreground">MJN Healthcare</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Healthcare career consulting for nurses, physicians, and allied health professionals from Africa.
              Licensing, exam prep, and international placement — all in one engagement.
            </p>
            <div className="mt-5 space-y-2 text-sm">
              <a href="mailto:hello@mjnhealthcare.com" className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground">
                <Envelope className="h-3.5 w-3.5" /> hello@mjnhealthcare.com
              </a>
              <a href="https://wa.me/971508638660" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground">
                <ChatCircle className="h-3.5 w-3.5" /> WhatsApp us
              </a>
            </div>
            <div className="mt-5 flex gap-3">
              <a href="https://www.facebook.com/mjnhealthacademy" target="_blank" rel="noopener noreferrer" className="flex h-8 items-center justify-center rounded-lg border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary">Facebook</a>
              <a href="https://www.linkedin.com/company/mjn-health-academy" target="_blank" rel="noopener noreferrer" className="flex h-8 items-center justify-center rounded-lg border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary">LinkedIn</a>
            </div>
          </div>
          {footerSections.map(({ title, links }) => (
            <div key={title}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">{title}</p>
              <ul className="space-y-2">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
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
                <Link key={label} href={href} className="text-xs text-muted-foreground transition-colors hover:text-foreground">{label}</Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
