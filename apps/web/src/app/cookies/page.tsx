'use client';

import Link from 'next/link';
import { MarketingNav } from '../../components/marketing-nav';
import { SiteFooter } from '../../components/site-footer';
import { Badge } from '@mjn/ui';

const cookieTypes = [
  {
    name: 'Strictly Necessary',
    canDisable: false,
    desc: 'Required for the website and portal to function. Includes session cookies, authentication tokens, and security cookies. Cannot be disabled.',
    examples: 'Session ID, CSRF protection token, authentication JWT',
  },
  {
    name: 'Functional',
    canDisable: true,
    desc: 'Remember your preferences to improve your experience — such as language selection, tab state, and form autofill.',
    examples: 'Locale preference, last-visited tab, theme preference',
  },
  {
    name: 'Analytics',
    canDisable: true,
    desc: 'Help us understand how visitors use the site — which pages are most visited, where users drop off, and how to improve the experience. Data is anonymised.',
    examples: 'Page views, session duration, referral source (via Plausible Analytics — no personal data shared)',
  },
  {
    name: 'Marketing',
    canDisable: true,
    desc: 'Used to measure the effectiveness of our marketing campaigns. We use these sparingly and do not use third-party advertising networks.',
    examples: 'Conversion attribution (first-touch/last-touch for paid campaigns)',
  },
];

export default function CookiesPage() {
  return (
    <>
      <MarketingNav />

      <section className="px-6 pt-28 pb-8">
        <div className="mx-auto max-w-3xl">
          <Badge variant="outline" className="mb-4">Legal</Badge>
          <h1 className="text-4xl font-extrabold text-foreground">Cookie Policy</h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: 1 July 2026</p>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-3xl">
          <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">

            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">What Are Cookies</h2>
              <p>Cookies are small text files stored on your device when you visit a website. They allow the website to remember information about your visit — such as your login session, preferences, and usage patterns.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">How We Use Cookies</h2>
              <p>We use cookies for four purposes — detailed in the table below. We do not use advertising cookies from third-party networks (Google Ads, Meta Pixel, etc.) and do not sell cookie data to any third party.</p>
            </div>

            <div className="space-y-4">
              {cookieTypes.map(({ name, canDisable, desc, examples }) => (
                <div key={name} className="rounded-2xl border border-border bg-white p-5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-foreground">{name}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${canDisable ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {canDisable ? 'Optional' : 'Required'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                  <p className="mt-2 text-xs text-muted-foreground"><span className="font-semibold text-foreground">Examples:</span> {examples}</p>
                </div>
              ))}
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">Managing Your Cookie Preferences</h2>
              <p>You can manage optional cookies through the cookie preference banner that appears on your first visit. You can also:</p>
              <ul className="mt-2 space-y-1.5 list-disc list-inside">
                <li>Update preferences at any time via the &ldquo;Cookie Settings&rdquo; link in the site footer</li>
                <li>Clear cookies through your browser settings — note this will log you out of the portal</li>
                <li>Use your browser&apos;s private/incognito mode to browse without persistent cookies</li>
              </ul>
              <p className="mt-2">Disabling strictly necessary cookies is not possible without disabling the website&apos;s core functionality.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">Third-Party Cookies</h2>
              <p>Our platform integrates with the following third-party services that may set their own cookies:</p>
              <ul className="mt-2 space-y-1.5 list-disc list-inside">
                <li><strong>Daily.co</strong> — Live virtual classrooms (functional cookies for session state)</li>
                <li><strong>Plausible Analytics</strong> — Privacy-first analytics (no personal data, no cross-site tracking, no cookies stored on your device — uses a first-party approach)</li>
              </ul>
              <p className="mt-2">We have specifically chosen Plausible Analytics over Google Analytics because it does not use cookies and does not collect personal data.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">Cookie Retention</h2>
              <ul className="mt-2 space-y-1.5 list-disc list-inside">
                <li><strong>Session cookies:</strong> Deleted when you close your browser</li>
                <li><strong>Authentication cookies:</strong> 30 days (renewable on each login)</li>
                <li><strong>Preference cookies:</strong> 12 months</li>
                <li><strong>Analytics cookies:</strong> None — Plausible is cookieless</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">Contact</h2>
              <p>Cookie-related enquiries: <a href="mailto:privacy@mjnhealthcare.com" className="text-primary hover:underline">privacy@mjnhealthcare.com</a></p>
              <p className="mt-1">See also: <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> · <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link></p>
            </div>

          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
