'use client';

import * as React from 'react';
import Link from 'next/link';
import { MarketingNav } from '../../components/marketing-nav';
import { SiteFooter } from '../../components/site-footer';
import { Button, Badge } from '@mjn/ui';
import {
  ArrowRight, CheckCircle, Users, Money, VideoCamera, Warning,
} from '@phosphor-icons/react';

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000') + '/api/v1';

const LANGUAGES = ['English', 'French', 'Arabic', 'Hausa', 'Yoruba', 'Igbo', 'Swahili', 'Portuguese'];

const perks = [
  { icon: Money, title: 'Earn on Your Schedule', desc: '75% of each session fee paid to you. Sessions run 45 minutes. Set your own availability.' },
  { icon: VideoCamera, title: 'Fully Remote', desc: 'All sessions via secure Daily.co video — no commute, no overhead. Conduct sessions from anywhere.' },
  { icon: Users, title: 'Established Client Base', desc: 'MJN Healthcare brings the clients. Your profile goes live on our public consultation page the moment you\'re approved.' },
  { icon: CheckCircle, title: 'Flexible Engagement', desc: 'List as a marketplace partner or discuss an employed/contracted arrangement. Both models are available.' },
];

export default function BecomeAConsultantPage() {
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [selectedLanguages, setSelectedLanguages] = React.useState<string[]>([]);
  const [category, setCategory] = React.useState('');

  function toggleLanguage(lang: string) {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedLanguages.length === 0) {
      setError('Please select at least one language.');
      return;
    }
    setLoading(true);
    setError('');
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: fd.get('name') as string,
      email: fd.get('email') as string,
      phone: fd.get('phone') as string,
      consultationCategory: category,
      specialty: fd.get('specialty') as string,
      licenseNumber: (fd.get('licenseNumber') as string) || undefined,
      licenseBody: (fd.get('licenseBody') as string) || undefined,
      bio: fd.get('bio') as string,
      languages: selectedLanguages,
      yearsExperience: parseInt(fd.get('yearsExperience') as string, 10),
    };
    try {
      const res = await fetch(`${API}/consultations/partners/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json() as { message?: string };
        throw new Error(err.message ?? 'Submission failed. Please try again.');
      }
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
            Join Our Network
          </Badge>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Become an MJN Healthcare Consultant
          </h1>
          <p className="mt-5 max-w-xl text-lg text-blue-100">
            Join our network of licensed healthcare professionals and career consultants. Offer paid video consultations to clients across Africa and beyond — on your own schedule.
          </p>
        </div>
      </section>

      {/* PERKS */}
      <section className="px-6 py-14 border-b border-border">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {perks.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* APPLICATION FORM */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">Application</Badge>
            <h2 className="text-4xl font-bold">Apply to Join</h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Applications are reviewed within 5 business days. We verify credentials before activating any profile.
            </p>
          </div>

          {submitted ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-white p-16 text-center shadow-sm">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
                <CheckCircle className="h-8 w-8 text-teal-600" weight="fill" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Application Received</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                Thank you for applying. Our team will review your credentials and respond within 5 business days. You will receive an email at the address you provided.
              </p>
              <Button className="mt-6" asChild>
                <Link href="/">Back to Home <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-white p-8 shadow-sm space-y-6">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                  <Warning className="h-4 w-4 mt-0.5 shrink-0" /> {error}
                </div>
              )}

              {/* Personal details */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Personal Details</p>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Full Name *</label>
                    <input required name="name" type="text" placeholder="Dr. Jane Amara"
                      className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Email Address *</label>
                    <input required name="email" type="email" placeholder="you@example.com"
                      className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">WhatsApp / Phone *</label>
                    <input required name="phone" type="tel" placeholder="+237 6XX XXX XXX"
                      className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Years of Experience *</label>
                    <input required name="yearsExperience" type="number" min="0" max="60" placeholder="e.g. 8"
                      className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                  </div>
                </div>
              </div>

              {/* Consultation type */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Consultation Type *</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { value: 'HEALTH', label: 'Health Advice', desc: 'Licensed clinician' },
                    { value: 'CAREER', label: 'Career & Licensing', desc: 'MJN-domain expertise' },
                    { value: 'BOTH', label: 'Both', desc: 'Dual expertise' },
                  ].map(({ value, label, desc }) => (
                    <button type="button" key={value}
                      onClick={() => setCategory(value)}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${category === value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                    >
                      <p className={`font-semibold text-sm ${category === value ? 'text-primary' : 'text-foreground'}`}>{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
                {!category && <input type="text" required className="sr-only" />}
              </div>

              {/* Professional details */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Professional Details</p>
                <div className="space-y-5">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Specialty / Role *</label>
                    <input required name="specialty" type="text"
                      placeholder="e.g. Internal Medicine Physician, NMC/DHA Licensing Consultant, RN – General Practice"
                      className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                  </div>
                  {(category === 'HEALTH' || category === 'BOTH') && (
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">License Number</label>
                        <input name="licenseNumber" type="text" placeholder="e.g. CM-MED-12345"
                          className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">Issuing Body</label>
                        <input name="licenseBody" type="text" placeholder="e.g. Cameroon Medical Council"
                          className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Short Bio *</label>
                    <textarea required name="bio" rows={4}
                      placeholder="Describe your background, experience, and what clients can expect from a session with you. Min. 100 characters."
                      minLength={100}
                      className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none" />
                  </div>
                </div>
              </div>

              {/* Languages */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Languages You Consult In *</p>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <button type="button" key={lang}
                      onClick={() => toggleLanguage(lang)}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all border ${selectedLanguages.includes(lang) ? 'border-primary bg-primary text-white' : 'border-border bg-white text-foreground hover:border-primary/50'}`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Consent */}
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input required type="checkbox" className="mt-0.5 h-4 w-4 rounded accent-primary shrink-0" />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    I confirm that the information provided is accurate. I understand that MJN Healthcare will verify my credentials and that providing false information will result in immediate rejection and potential reporting to the relevant regulatory body. I agree to the <Link href="/terms" className="text-primary hover:underline">Consultant Terms of Engagement</Link>. *
                  </span>
                </label>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading || !category}>
                {loading ? 'Submitting…' : 'Submit Application'} {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>
          )}
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
