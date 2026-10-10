'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, setToken } from '../../lib/api';
import {
  Envelope, ArrowRight, CircleNotch, CheckCircle, Key,
  ArrowCounterClockwise, User, Briefcase, Globe, Shield,
  Certificate, Buildings, Stethoscope,
} from '@mjn/ui';

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
    <div className="flex gap-2.5 justify-center">
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
            'h-14 w-12 rounded-2xl border-2 bg-white text-center text-2xl font-extrabold text-foreground outline-none transition-all duration-150 shadow-sm',
            value[i]
              ? 'border-primary bg-primary/5 shadow-primary/20 scale-105'
              : 'border-border hover:border-primary/40 focus:border-primary focus:shadow-md focus:shadow-primary/20 focus:scale-105',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl border border-border/40">
        {/* Header */}
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-border shadow-md p-2">
            <img src="/mjnlogo.png" alt="MJN Healthcare" className="h-full w-full object-contain" />
          </div>
          <h2 className="text-xl font-extrabold text-foreground">Welcome to MJN Healthcare</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Let's set up your profile — takes 30 seconds.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl gradient-hero px-6 py-3.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[.98] disabled:opacity-60 shadow-md"
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

// ── Step Progress Bar ────────────────────────────────────────────────────────

function StepProgress({ current }: { current: 'email' | 'otp' | 'done' }) {
  const steps = [
    { key: 'email', label: 'Email' },
    { key: 'otp',   label: 'Verify' },
    { key: 'done',  label: 'Access' },
  ];
  const currentIdx = steps.findIndex((s) => s.key === current);

  return (
    <div className="mb-8 flex items-center gap-0">
      {steps.map((step, idx) => {
        const done    = idx < currentIdx;
        const active  = idx === currentIdx;
        return (
          <div key={step.key} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={[
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300',
                done   ? 'gradient-hero text-white shadow-sm' : '',
                active ? 'gradient-hero text-white shadow-md ring-4 ring-primary/20 scale-110' : '',
                !done && !active ? 'bg-muted text-muted-foreground' : '',
              ].join(' ')}>
                {done ? <CheckCircle className="h-3.5 w-3.5" weight="fill" /> : idx + 1}
              </div>
              <span className={`text-[10px] font-semibold leading-none ${active ? 'text-primary' : done ? 'text-primary/60' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 mb-4 rounded-full transition-all duration-500 ${done ? 'bg-primary/40' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Left panel — pipeline preview card ──────────────────────────────────────

function PipelinePreview() {
  const stages = [
    { label: 'Documents Submitted',  done: true  },
    { label: 'DataFlow Verification', done: true  },
    { label: 'DHA Exam Registration', done: false, active: true },
    { label: 'License Issued',        done: false },
  ];

  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-5 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wide">Active Case</p>
          <p className="text-sm font-bold text-white mt-0.5">UAE — DHA Nurse Pathway</p>
        </div>
        <span className="rounded-full bg-emerald-400/20 border border-emerald-400/30 px-2.5 py-1 text-[10px] font-bold text-emerald-300 uppercase tracking-wide">
          Active
        </span>
      </div>
      <div className="space-y-2.5 mt-4">
        {stages.map((stage, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={[
              'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold transition-all',
              stage.done   ? 'bg-emerald-400 border-emerald-400 text-white' : '',
              stage.active ? 'border-white text-white bg-white/20 ring-2 ring-white/30' : '',
              !stage.done && !stage.active ? 'border-white/20 text-white/20' : '',
            ].join(' ')}>
              {stage.done ? '✓' : i + 1}
            </div>
            <span className={`text-sm leading-none ${stage.done ? 'text-white/60 line-through' : stage.active ? 'text-white font-semibold' : 'text-white/30'}`}>
              {stage.label}
            </span>
            {stage.active && (
              <span className="ml-auto text-[10px] font-bold text-amber-300 bg-amber-300/10 border border-amber-300/20 px-2 py-0.5 rounded-full">
                In progress
              </span>
            )}
          </div>
        ))}
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

  return (
    <>
      {showOnboarding && (
        <OnboardingModal email={email} onComplete={handleOnboardingComplete} />
      )}

      <div className="flex min-h-screen bg-slate-50">
        {/* ── Left panel ── */}
        <div className="hidden flex-col justify-between p-10 text-white lg:flex lg:w-[44%] xl:w-[42%] relative overflow-hidden"
          style={{ backgroundImage: 'url("https://res.cloudinary.com/dmxnsttmu/image/upload/v1791638383/african-american-female-doctor-using-smartphone-holding-takeaway-coffee-hospital-corridor_13339-355195_pbdde2.jpg")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          {/* Dark gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F4C81]/70 via-[#0F4C81]/50 to-[#00A896]/60" />

          {/* Logo */}
          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm">
              <img src="/mjnlogo.png" alt="MJN Healthcare" className="h-full w-full object-contain" />
            </div>
            <div>
              <span className="block text-sm font-bold tracking-tight">MJN Healthcare</span>
              <span className="block text-[10px] text-white/50 leading-none">Academy & Professional Services</span>
            </div>
          </div>

          {/* Hero copy */}
          <div className="relative space-y-7">
            <div>
              <h1 className="text-[2rem] font-extrabold leading-tight tracking-tight">
                Your licensing journey,<br />managed end to end.
              </h1>
              <p className="mt-3 text-blue-100/80 leading-relaxed text-sm max-w-sm">
                Track documents, follow licensing stages, access exam prep, and stay in sync with your consultant — all from one portal.
              </p>
            </div>

            {/* Pipeline preview card */}
            <PipelinePreview />

            {/* Trust stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: '2,400+', label: 'Professionals' },
                { value: '14',     label: 'Countries' },
                { value: '98%',    label: 'Satisfaction' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 px-3 py-2.5 text-center">
                  <p className="text-lg font-extrabold text-white">{stat.value}</p>
                  <p className="text-[10px] font-medium text-white/50 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-3.5">
              <p className="text-sm text-white/90 leading-relaxed italic">
                "MJN handled everything — DataFlow, DHA exam prep, even the job offer. I was in Dubai in 7 months."
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-white">
                  AN
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Aisha Nkomo</p>
                  <p className="text-[10px] text-white/50">RN · Dubai, UAE</p>
                </div>
                <div className="ml-auto flex">
                  {[0,1,2,3,4].map(i => <span key={i} className="text-amber-300 text-xs">★</span>)}
                </div>
              </div>
            </div>
          </div>

          <p className="relative text-[11px] text-white/30">© 2026 MJN Health Academy and Professional Services</p>
        </div>

        {/* ── Right panel ── */}
        <div className="flex flex-1 items-center justify-center p-6 relative"
          style={{ backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)', backgroundSize: '24px 24px' }}>

          {/* Soft white overlay so dots are very subtle */}
          <div className="absolute inset-0 bg-slate-50/80" />

          <div className="relative w-full max-w-[420px]">
            {/* Mobile logo */}
            <div className="mb-6 flex items-center gap-2.5 lg:hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-border p-1.5 shadow-sm">
                <img src="/mjnlogo.png" alt="MJN Healthcare" className="h-full w-full object-contain" />
              </div>
              <div>
                <span className="block text-sm font-bold text-foreground">MJN Healthcare</span>
                <span className="block text-[10px] text-muted-foreground">Portal</span>
              </div>
            </div>

            {/* Card */}
            <div className="rounded-3xl bg-white border border-border/60 shadow-xl shadow-slate-200/80 p-8">

              {/* ── Email step ── */}
              {step === 'email' && (
                <>
                  <StepProgress current="email" />

                  <div className="mb-7">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl gradient-hero shadow-md">
                      <Envelope className="h-5 w-5 text-white" weight="fill" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-foreground leading-tight">Sign in to your portal</h2>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                      Enter your email — we'll send a secure one-time code. No password needed.
                    </p>
                  </div>

                  <form onSubmit={handleRequestOtp} className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Email address
                      </label>
                      <div className="relative">
                        <Envelope className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="amara@example.com"
                          autoFocus
                          required
                          className="h-12 w-full rounded-xl border border-border bg-white pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                        <p className="text-sm text-rose-700">{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl gradient-hero px-6 py-3.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[.98] disabled:opacity-60 shadow-md shadow-primary/25 mt-2"
                    >
                      {loading
                        ? <><CircleNotch className="h-4 w-4 animate-spin" /> Sending code…</>
                        : <>Send verification code <ArrowRight className="h-4 w-4" /></>}
                    </button>
                  </form>

                  {/* Trust row */}
                  <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <Shield className="h-3.5 w-3.5 text-emerald-500" weight="fill" />
                    <span>Secure one-time code · expires in 10 min</span>
                  </div>

                  <div className="mt-5 pt-5 border-t border-border text-center text-xs text-muted-foreground">
                    New to MJN Healthcare?{' '}
                    <a href="https://mjnhealthcare.com/get-started" className="font-semibold text-primary hover:underline">
                      Book a free consultation first →
                    </a>
                  </div>
                </>
              )}

              {/* ── OTP step ── */}
              {step === 'otp' && (
                <>
                  <StepProgress current="otp" />

                  <div className="mb-7">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl gradient-hero shadow-md">
                      <Key className="h-5 w-5 text-white" weight="fill" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-foreground leading-tight">Check your inbox</h2>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                      We sent a 6-digit code to{' '}
                      <span className="font-semibold text-foreground break-all">{email}</span>.
                      It expires in 10 minutes.
                    </p>
                  </div>

                  <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <OtpInput value={otp} onChange={setOtp} />

                    {/* Progress indicator */}
                    <div className="flex justify-center gap-1.5">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 rounded-full transition-all duration-200 ${i < otp.length ? 'w-5 bg-primary' : 'w-3 bg-border'}`}
                        />
                      ))}
                    </div>

                    {error && (
                      <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                        <p className="text-sm text-rose-700">{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || otp.length !== 6}
                      className="flex w-full items-center justify-center gap-2 rounded-xl gradient-hero px-6 py-3.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[.98] disabled:opacity-60 shadow-md shadow-primary/25"
                    >
                      {loading
                        ? <><CircleNotch className="h-4 w-4 animate-spin" /> Verifying…</>
                        : <><CheckCircle className="h-4 w-4" weight="fill" /> Verify &amp; sign in</>}
                    </button>
                  </form>

                  <div className="mt-5 flex items-center justify-between text-sm pt-4 border-t border-border">
                    <button
                      onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                      className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition font-medium"
                    >
                      <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                      Different email
                    </button>
                    <button
                      onClick={handleResend}
                      disabled={resendCooldown > 0 || loading}
                      className="flex items-center gap-1.5 font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ArrowCounterClockwise className="h-3.5 w-3.5" />
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                    </button>
                  </div>
                </>
              )}

              {/* ── Done step ── */}
              {step === 'done' && !showOnboarding && (
                <>
                  <StepProgress current="done" />
                  <div className="py-8 text-center">
                    <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
                      <div className="absolute inset-0 rounded-full gradient-hero opacity-10 animate-ping" />
                      <div className="absolute inset-2 rounded-full gradient-hero opacity-20" />
                      <div className="relative flex h-16 w-16 items-center justify-center rounded-full gradient-hero shadow-xl shadow-primary/30">
                        <CheckCircle className="h-8 w-8 text-white" weight="fill" />
                      </div>
                    </div>
                    <h2 className="text-2xl font-extrabold text-foreground">
                      {isNew ? 'Welcome to MJN Healthcare!' : `Welcome back${resolvedName ? `, ${resolvedName.split(' ')[0]}` : ''}!`}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {isNew ? 'Setting up your profile…' : 'Taking you to your dashboard…'}
                    </p>
                    <div className="mt-6 flex justify-center gap-2">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="h-2 w-2 rounded-full gradient-hero animate-bounce"
                          style={{ animationDelay: `${i * 0.18}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
