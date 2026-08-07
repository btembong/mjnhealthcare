'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { Envelope, ArrowLeft, CircleNotch, PaperPlaneTilt, ShieldCheck } from '@phosphor-icons/react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await api.forgotPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat overflow-hidden p-6"
      style={{ backgroundImage: "url('/hero-nurse.jpg')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#0F4C81]/70 via-[#1a6eb5]/50 to-[#00A896]/40 backdrop-blur-[1px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
            <span className="text-xs font-bold text-white">MJN</span>
          </div>
          <span className="font-bold text-white">Admin Console</span>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/10 p-8 backdrop-blur-md">
          {sent ? (
            /* ── Success state ── */
            <div className="py-6 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/20">
                <PaperPlaneTilt className="h-8 w-8 text-white" weight="fill" />
              </div>
              <h2 className="text-xl font-extrabold text-white">Check your inbox</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                If <span className="font-semibold text-white/80">{email}</span> is registered,
                you will receive a reset link within a minute. The link expires in 15 minutes.
              </p>
              <p className="mt-4 text-xs text-white/40">
                Check your spam folder if you don&apos;t see it.
              </p>
              <Link
                href="/login"
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back to login
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="mb-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-extrabold text-white">Forgot your password?</h2>
                <p className="mt-2 text-sm text-white/60">
                  Enter your staff email and we&apos;ll send you a secure reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-white/80">
                    Email address
                  </label>
                  <div className="relative">
                    <Envelope className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="staff@mjnhealth.com"
                      autoFocus
                      required
                      className="h-11 w-full rounded-xl border border-white/20 bg-white/10 pl-10 pr-4 text-sm text-white placeholder-white/40 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {error && (
                  <p className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-400 border border-rose-500/20">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading
                    ? <><CircleNotch className="h-4 w-4 animate-spin" /> Sending…</>
                    : <><PaperPlaneTilt className="h-4 w-4" /> Send reset link</>}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to login
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-white/30">
          This portal is restricted to authorised MJN Healthcare staff only.
        </p>
      </div>
    </div>
  );
}
