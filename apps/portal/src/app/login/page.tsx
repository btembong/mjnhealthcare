'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, setToken } from '../../lib/api';
import {
  Envelope, ArrowRight, CircleNotch, CheckCircle, Key,
  ArrowCounterClockwise, User, Briefcase, Globe,
} from '@phosphor-icons/react';

type Step = 'email' | 'otp' | 'done';

const PROFESSIONS = [
  'Registered Nurse', 'Physician', 'Pharmacist', 'Physiotherapist',
  'Radiographer', 'Lab Technician', 'Midwife', 'Student', 'Other',
];

const COUNTRIES = ['UAE', 'United Kingdom', 'United States', 'Ireland', 'Canada', 'Australia', 'Other'];

// ── Split OTP Input ──────────────────────────────────────────────────────────

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (value[i]) {
        const next = value.slice(0, i) + ' ' + value.slice(i + 1);
        onChange(next.trimEnd());
      } else if (i > 0) {
        refs[i - 1].current?.focus();
        const next = value.slice(0, i - 1) + ' ' + value.slice(i);
        onChange(next.trimEnd());
      }
    }
  }

  function handleChange(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) return;
    const digits = raw.slice(-1);
    const arr = (value + '      ').slice(0, 6).split('');
    arr[i] = digits;
    const next = arr.join('').trimEnd();
    onChange(next);
    if (i < 5) refs[i + 1].current?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted);
      refs[Math.min(pasted.length, 5)].current?.focus();
      e.preventDefault();
    }
  }

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          autoFocus={i === 0}
          className={[
            'h-14 w-12 rounded-xl border-2 bg-white text-center text-xl font-bold text-foreground outline-none transition-all duration-150',
            value[i]
              ? 'border-primary bg-primary/5 shadow-sm shadow-primary/20'
              : 'border-border hover:border-muted-foreground focus:border-primary focus:shadow-sm focus:shadow-primary/20',
          ].join(' ')}
        />
      ))}
    </div>
  );
}

// ── Onboarding Modal ─────────────────────────────────────────────────────────

function OnboardingModal({
  email,
  onComplete,
}: {
  email: string;
  onComplete: (data: { name: string; profession: string; targetCountry: string }) => void;
}) {
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !profession || !country) return;
    setLoading(true);
    await api.updateMe({ name: name.trim(), profession, locale: 'en' }).catch(() => {});
    setLoading(false);
    onComplete({ name: name.trim(), profession, targetCountry: country });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <span className="text-lg font-extrabold text-white">MJN</span>
          </div>
          <h2 className="text-xl font-extrabold text-foreground">Welcome to MJN Health</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Let's set up your profile — takes 30 seconds.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Full name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Amara Diallo"
                autoFocus
                required
                className="h-11 w-full rounded-xl border border-border bg-white pl-9 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Profession */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Profession
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                required
                className="h-11 w-full appearance-none rounded-xl border border-border bg-white pl-9 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select your profession</option>
                {PROFESSIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Target country */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Target country
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                className="h-11 w-full appearance-none rounded-xl border border-border bg-white pl-9 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Where do you want to work?</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim() || !profession || !country}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
          >
            {loading
              ? <><CircleNotch className="h-4 w-4 animate-spin" /> Saving…</>
              : <>Continue to dashboard <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Login Page ──────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isNew, setIsNew] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [resolvedName, setResolvedName] = useState('');

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.requestOtp(email.trim());
      setStep('otp');
      startResendCooldown();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) { setError('Please enter all 6 digits.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.verifyOtp(email.trim(), otp.trim());
      setToken(res.access_token);
      setIsNew(res.isNew);
      setStep('done');
      if (res.isNew) {
        setTimeout(() => setShowOnboarding(true), 1200);
      } else {
        // Fetch name for returning users
        api.getMe().then((me) => setResolvedName(me?.name ?? '')).catch(() => {});
        setTimeout(() => router.push('/'), 2000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError('');
    try {
      await api.requestOtp(email.trim());
      startResendCooldown();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startResendCooldown() {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  function handleOnboardingComplete(data: { name: string; profession: string; targetCountry: string }) {
    setShowOnboarding(false);
    setResolvedName(data.name);
    router.push('/');
  }

  const firstName = resolvedName ? resolvedName.split(' ')[0] : email.split('@')[0];

  return (
    <>
      {showOnboarding && (
        <OnboardingModal email={email} onComplete={handleOnboardingComplete} />
      )}

      <div className="flex min-h-screen bg-muted/20">
        {/* Left panel */}
        <div className="gradient-hero hidden flex-col justify-between p-12 text-white lg:flex lg:w-2/5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <span className="text-xs font-extrabold">MJN</span>
            </div>
            <span className="font-bold tracking-tight">MJN Health Academy</span>
          </div>

          <div>
            <h1 className="text-3xl font-extrabold leading-tight">
              Your licensing journey,<br />managed end to end.
            </h1>
            <p className="mt-4 text-blue-100 leading-relaxed text-sm">
              Track your documents, follow your licensing stages, access exam prep,
              and stay in sync with your consultant — all in one place.
            </p>
            <div className="mt-8 space-y-3">
              {[
                'Real-time pipeline status',
                'Secure document vault',
                'Exam prep & AI study assistant',
                'Direct messaging with your consultant',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-sm text-blue-100">
                  <CheckCircle className="h-4 w-4 shrink-0 text-white/70" weight="fill" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-blue-200/70">© 2026 MJN Health Academy and Professional Services</p>
        </div>

        {/* Right panel */}
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="mb-8 flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
                <span className="text-xs font-bold text-white">MJN</span>
              </div>
              <span className="font-bold text-foreground">MJN Health Academy</span>
            </div>

            {/* ── Email step ── */}
            {step === 'email' && (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-extrabold text-foreground">Sign in to your portal</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Enter your email and we'll send a one-time code — no password needed.
                  </p>
                </div>

                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Email address
                    </label>
                    <div className="relative">
                      <Envelope className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="amara@example.com"
                        autoFocus
                        required
                        className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3">
                      <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                      <p className="text-sm text-rose-700">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-primary/90 active:scale-[.98] disabled:opacity-60"
                  >
                    {loading
                      ? <><CircleNotch className="h-4 w-4 animate-spin" /> Sending code…</>
                      : <>Send verification code <ArrowRight className="h-4 w-4" /></>}
                  </button>
                </form>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                  New to MJN Health?{' '}
                  <a href="http://localhost:3001/get-started" className="font-medium text-primary hover:underline">
                    Book a free consultation first
                  </a>
                </p>
              </>
            )}

            {/* ── OTP step ── */}
            {step === 'otp' && (
              <>
                <div className="mb-8">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <Key weight="duotone" className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-foreground">Check your inbox</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    We sent a 6-digit code to{' '}
                    <span className="font-semibold text-foreground">{email}</span>.
                    It expires in 10 minutes.
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <OtpInput value={otp} onChange={setOtp} />

                  {error && (
                    <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3">
                      <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                      <p className="text-sm text-rose-700">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-primary/90 active:scale-[.98] disabled:opacity-60"
                  >
                    {loading
                      ? <><CircleNotch className="h-4 w-4 animate-spin" /> Verifying…</>
                      : <>Verify & sign in <ArrowRight className="h-4 w-4" /></>}
                  </button>
                </form>

                <div className="mt-5 flex items-center justify-between text-sm">
                  <button
                    onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                    className="text-muted-foreground hover:text-foreground transition"
                  >
                    ← Different email
                  </button>
                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    className="flex items-center gap-1.5 font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowCounterClockwise className="h-3.5 w-3.5" />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>
              </>
            )}

            {/* ── Done step ── */}
            {step === 'done' && !showOnboarding && (
              <div className="py-10 text-center">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border-4 border-primary/20">
                  <CheckCircle className="h-10 w-10 text-primary" weight="fill" />
                </div>
                <h2 className="text-2xl font-extrabold text-foreground">
                  {isNew ? 'Welcome to MJN Health!' : `Welcome back${resolvedName ? `, ${resolvedName.split(' ')[0]}` : ''}!`}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {isNew ? 'Setting up your profile…' : 'Taking you to your dashboard…'}
                </p>
                <div className="mt-6 flex justify-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
