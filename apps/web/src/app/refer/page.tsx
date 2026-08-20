'use client';

import * as React from 'react';
import Link from 'next/link';
import { MarketingNav } from '../../components/marketing-nav';
import { SiteFooter } from '../../components/site-footer';
import { ArrowRight, CheckCircle, CurrencyDollar, Link as LinkIcon, Users, Copy } from '@phosphor-icons/react';

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'https://api.mjnhealthcare.com') + '/api/v1';

const HOW_IT_WORKS = [
  { icon: Users, step: '1', title: 'Sign up in seconds', desc: 'Enter your name and contact info — no account, no password needed.' },
  { icon: LinkIcon, step: '2', title: 'Get your unique link', desc: 'We generate a personal referral link you can share anywhere — WhatsApp, social media, email.' },
  { icon: CurrencyDollar, step: '3', title: 'Earn $20 per referral', desc: 'When someone joins MJN through your link and makes their first payment, you earn $20 cash.' },
];

export default function ReferPage() {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{ code: string; link: string; alreadyExists?: boolean } | null>(null);
  const [error, setError] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!email.trim() && !phone.trim()) { setError('Please enter an email or phone number.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/public-referral/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Something went wrong');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!result?.link) return;
    navigator.clipboard.writeText(result.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0F4C81] to-[#00A896] py-20 text-white">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <span className="mb-4 inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold">
            Refer & Earn
          </span>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Earn $20 for every healthcare professional you refer
          </h1>
          <p className="mt-5 text-lg text-white/80">
            Know someone looking to advance their career globally? Share your link — when they join MJN and make their first payment, you get paid $20 cash. No limit on referrals.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-slate-50">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-10 text-center text-2xl font-bold text-slate-900">How it works</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {HOW_IT_WORKS.map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0F4C81] text-white">
                  <Icon className="h-7 w-7" />
                </div>
                <div className="mb-1 text-xs font-bold uppercase tracking-widest text-[#00A896]">Step {step}</div>
                <h3 className="mb-2 font-bold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signup / Result */}
      <section className="py-16">
        <div className="mx-auto max-w-lg px-6">
          {!result ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
              <h2 className="mb-2 text-xl font-bold text-slate-900">Get your referral link</h2>
              <p className="mb-6 text-sm text-slate-500">Free to join. Takes 30 seconds.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name *</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:border-[#0F4C81]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:border-[#0F4C81]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone number</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+237 6XX XXX XXX"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:border-[#0F4C81]"
                  />
                </div>
                <p className="text-xs text-slate-400">Provide at least one of email or phone.</p>

                {error && (
                  <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F4C81] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0F4C81]/90 disabled:opacity-60"
                >
                  {loading ? 'Generating your link…' : (
                    <><ArrowRight className="h-4 w-4" /> Get my referral link</>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 shadow-lg text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-8 w-8 text-emerald-600" weight="fill" />
              </div>
              <h2 className="mb-1 text-xl font-bold text-slate-900">
                {result.alreadyExists ? 'Welcome back!' : 'Your link is ready!'}
              </h2>
              <p className="mb-6 text-sm text-slate-600">
                Share this link — every person who joins and pays earns you <strong>$20</strong>.
              </p>

              <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-white p-3">
                <span className="flex-1 truncate text-left text-sm font-medium text-[#0F4C81]">{result.link}</span>
                <button
                  onClick={handleCopy}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0F4C81] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#0F4C81]/90"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <a
                  href={`whatsapp://send?text=I found a great platform for healthcare professionals looking to work abroad! Join MJN Health through my link: ${result.link}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Share on WhatsApp
                </a>
                <Link
                  href={`/refer/status/${result.code}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Track my referrals
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 bg-slate-50">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="mb-8 text-center text-xl font-bold text-slate-900">Common questions</h2>
          <div className="space-y-4">
            {[
              { q: 'Who can I refer?', a: 'Anyone interested in MJN Health services — nurses, physicians, allied health professionals, or students looking for licensing support, academy courses, or job placement.' },
              { q: 'When do I get paid?', a: 'As soon as your referred person makes their first payment on MJN. We process payouts within 7 business days via mobile money or bank transfer.' },
              { q: 'Is there a limit on how many people I can refer?', a: 'No limit. Refer as many people as you like — you earn $20 for every conversion.' },
              { q: 'How do I track my referrals?', a: 'Use the "Track my referrals" link after signing up, or visit mjnhealthcare.com/refer/status/YOUR-CODE anytime.' },
            ].map(({ q, a }) => (
              <div key={q} className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="font-semibold text-slate-900">{q}</p>
                <p className="mt-1.5 text-sm text-slate-600">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
