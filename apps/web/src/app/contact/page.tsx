'use client';

import Link from 'next/link';
import * as React from 'react';
import { MarketingNav } from '../../components/marketing-nav';
import { SiteFooter } from '../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import {
  ArrowRight, Envelope, Phone, MapPin, Clock, ChatCircle,
} from '@phosphor-icons/react';

const offices = [
  {
    city: 'Yaoundé',
    country: 'Cameroon (HQ)',
    address: 'Bastos, Yaoundé, Centre Region',
    hours: 'Mon–Fri 8:00 AM – 6:00 PM WAT',
    flag: '🇨🇲',
  },
  {
    city: 'Douala',
    country: 'Cameroon',
    address: 'Bonanjo, Douala, Littoral Region',
    hours: 'Mon–Fri 9:00 AM – 5:00 PM WAT',
    flag: '🇨🇲',
  },
];

const enquiryTypes = [
  { label: 'Licensing & Placement Enquiry', value: 'licensing' },
  { label: 'Academy / Exam Prep', value: 'academy' },
  { label: 'Student Support', value: 'student' },
  { label: 'CPD / Health Training (Individual)', value: 'cpd' },
  { label: 'Employer / Institutional Partnership', value: 'employer' },
  { label: 'Health Training (Facility / Organisation)', value: 'training' },
  { label: 'Media / Press', value: 'press' },
  { label: 'Other', value: 'other' },
];

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000') + '/api/v1';

export default function ContactPage() {
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const form = e.currentTarget;
    const data = new FormData(form);
    const firstName = data.get('firstName') as string;
    const lastName = data.get('lastName') as string;
    const email = data.get('email') as string;
    const phone = (data.get('phone') as string) || undefined;
    const serviceInterest = data.get('enquiryType') as string;
    const notes = data.get('message') as string;
    try {
      const res = await fetch(`${API}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${firstName} ${lastName}`.trim(),
          email,
          phone,
          serviceInterest,
          notes,
        }),
      });
      if (!res.ok) throw new Error('Failed to send message. Please try again or contact us via WhatsApp.');
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <MarketingNav />

      {/* HERO */}
      <section className="gradient-hero relative overflow-hidden pt-28 pb-16 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6">
          <Badge className="mb-4 border border-white/20 bg-white/10 text-white backdrop-blur-sm">
            Contact
          </Badge>
          <h1 className="max-w-2xl text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Get in Touch
          </h1>
          <p className="mt-5 max-w-xl text-lg text-blue-100">
            Whether you have a quick question or are ready to start your engagement — reach out. We respond to all enquiries within one business day.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-3">

            {/* CONTACT DETAILS */}
            <div className="space-y-8">
              <div>
                <Badge variant="outline" className="mb-4">Direct Contact</Badge>
                <div className="space-y-4">
                  <a
                    href="mailto:hello@mjnhealthcare.com"
                    className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 text-sm transition-colors hover:border-primary"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Envelope className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Email</p>
                      <p className="text-muted-foreground">hello@mjnhealthcare.com</p>
                    </div>
                  </a>
                  <a
                    href="https://wa.me/971508638660"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 text-sm transition-colors hover:border-primary"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <ChatCircle className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">WhatsApp</p>
                      <p className="text-muted-foreground">+237 000 000 000</p>
                    </div>
                  </a>
                </div>
              </div>

              <div>
                <Badge variant="outline" className="mb-4">Our Offices</Badge>
                <div className="space-y-4">
                  {offices.map(({ city, country, address, hours, flag }) => (
                    <div key={city} className="rounded-xl border border-border bg-white p-4 text-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span>{flag}</span>
                        <p className="font-semibold text-foreground">{city}</p>
                        <span className="text-xs text-muted-foreground">— {country}</span>
                      </div>
                      <p className="flex items-start gap-1.5 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        {address}
                      </p>
                      <p className="mt-1 flex items-start gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        {hours}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
                <p className="font-semibold text-foreground mb-2">Prefer to book a call?</p>
                <p className="text-muted-foreground mb-3">Use the Get Started flow to book a structured 30-minute consultation with an assigned consultant — rather than a general enquiry.</p>
                <Button size="sm" asChild className="w-full">
                  <Link href="/get-started">Book Free Consultation <ArrowRight className="h-3.5 w-3.5" /></Link>
                </Button>
              </div>
            </div>

            {/* CONTACT FORM */}
            <div className="lg:col-span-2">
              <Badge variant="outline" className="mb-4">Send a Message</Badge>
              {submitted ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-white p-16 text-center shadow-sm">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
                    <span className="text-3xl">✓</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Message Received</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                    Thank you for reaching out. A member of our team will respond within one business day. For urgent matters, please WhatsApp us directly.
                  </p>
                  <Button className="mt-6" onClick={() => setSubmitted(false)} variant="outline">
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-white p-8 shadow-sm space-y-5">
                  {error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
                  )}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">First Name *</label>
                      <input
                        required
                        name="firstName"
                        type="text"
                        placeholder="Your first name"
                        className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">Last Name *</label>
                      <input
                        required
                        name="lastName"
                        type="text"
                        placeholder="Your last name"
                        className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Email Address *</label>
                    <input
                      required
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">WhatsApp / Phone</label>
                    <input
                      name="phone"
                      type="tel"
                      placeholder="+237 6XX XXX XXX"
                      className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Enquiry Type *</label>
                    <select
                      required
                      name="enquiryType"
                      className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
                    >
                      <option value="">Select an enquiry type</option>
                      {enquiryTypes.map(({ label, value }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Message *</label>
                    <textarea
                      required
                      name="message"
                      rows={5}
                      placeholder="Tell us about your situation — your profession, current location, target destination, and any specific questions."
                      className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                    />
                  </div>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" required id="consent" className="mt-0.5 h-4 w-4 rounded border-border accent-primary" />
                    <label htmlFor="consent" className="text-xs text-muted-foreground leading-relaxed">
                      I agree to MJN Health contacting me in response to this enquiry. My details will be handled in accordance with the{' '}
                      <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                    </label>
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? 'Sending…' : 'Send Message'} {!loading && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
