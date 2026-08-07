'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setToken } from '../../lib/api';
import Link from 'next/link';
import { Envelope, LockKey, ArrowRight, CircleNotch, CheckCircle, ShieldCheck } from '@phosphor-icons/react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      const { access_token } = await api.loginStaff(email.trim(), password);
      setToken(access_token);
      setDone(true);
      setTimeout(() => router.push('/'), 800);
    } catch (err: any) {
      setError(err.message ?? 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen bg-cover bg-center bg-no-repeat overflow-hidden" style={{ backgroundImage: "url('/hero-nurse.jpg')" }}>
      {/* Light overlay — keeps image visible while ensuring text is readable */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0F4C81]/70 via-[#1a6eb5]/50 to-[#00A896]/40 backdrop-blur-[1px]" />

      {/* Left panel */}
      <div className="relative z-10 hidden flex-col justify-between p-12 lg:flex lg:w-2/5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
            <span className="text-xs font-bold text-white">MJN</span>
          </div>
          <span className="font-bold text-white">Admin Console</span>
        </div>

        <div>
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold leading-tight text-white">
            Staff & Consultant<br />Operations Center
          </h1>
          <p className="mt-4 leading-relaxed text-white/60">
            Manage caseloads, verify documents, review AI-drafted communications, and track all client engagements from one place.
          </p>

          <div className="mt-8 space-y-3">
            {[
              'Caseload dashboard with engagement tracking',
              'Document verification queue',
              'AI draft review and approval',
              'Academy content management',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-white/60">
                <CheckCircle className="h-4 w-4 shrink-0 text-white/60" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/30">
          © 2026 MJN Health Academy and Professional Services Ltd · Internal use only
        </p>
      </div>

      {/* Right panel */}
      <div className="relative z-10 flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-8 backdrop-blur-md">
            {/* Mobile logo */}
            <div className="mb-8 flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                <span className="text-xs font-bold text-white">MJN</span>
              </div>
              <span className="font-bold text-white">Admin Console</span>
            </div>

            {done ? (
              <div className="py-10 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Access granted</h2>
                <p className="mt-1 text-sm text-white/60">Redirecting to dashboard…</p>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-extrabold text-white">Staff login</h2>
                  <p className="mt-1.5 text-sm text-white/60">
                    Use your MJN staff email and password.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
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

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-sm font-semibold text-white/80">Password</label>
                      <Link href="/forgot-password" className="text-xs text-white/40 hover:text-white/70 transition-colors">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <LockKey className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
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
                    disabled={loading || !email || !password}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
                  >
                    {loading
                      ? <><CircleNotch className="h-4 w-4 animate-spin" /> Authenticating…</>
                      : <>Sign in <ArrowRight className="h-4 w-4" /></>}
                  </button>
                </form>
              </>
            )}
          </div>

          <p className="mt-4 text-center text-xs text-white/40">
            This portal is restricted to authorised MJN Healthcare staff only.
          </p>
        </div>
      </div>
    </div>
  );
}
