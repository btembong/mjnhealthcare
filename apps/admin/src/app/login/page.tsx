'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setToken } from '../../lib/api';
import Link from 'next/link';
import {
  Envelope, LockKey, ArrowRight, CircleNotch, CheckCircle,
  ShieldCheck, Eye, EyeSlash, Warning, Users, FileText,
  Robot, Lock,
} from '@mjn/ui';

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  ADMIN:              { label: 'Admin',              color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  CONSULTANT:         { label: 'Consultant',         color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  PROCESSING_OFFICER: { label: 'Processing Officer', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  FINANCE:            { label: 'Finance',            color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
};

// ── Metrics preview card ─────────────────────────────────────────────────────

function OpsPreview() {
  const metrics = [
    { icon: Users,    label: 'Active Cases',  value: '142', delta: '+8 this week',  up: true  },
    { icon: FileText, label: 'Docs Pending',  value: '23',  delta: '4 expiring',    up: false },
    { icon: Robot,    label: 'AI Drafts',     value: '9',   delta: 'Awaiting review', up: null },
  ];

  return (
    <div className="rounded-2xl bg-white border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted/30">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Live Operations</span>
        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>
      <div className="divide-y divide-border">
        {metrics.map(({ icon: Icon, label, value, delta, up }) => (
          <div key={label} className="flex items-center gap-4 px-5 py-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/50">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground leading-none mb-0.5">{label}</p>
              <p className="text-lg font-extrabold text-foreground leading-none">{value}</p>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${
              up === true  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              up === false ? 'bg-rose-50 text-rose-600 border-rose-200' :
                             'bg-muted/50 text-muted-foreground border-border'
            }`}>{delta}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [done, setDone]         = useState(false);
  const [roleName, setRoleName] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      const { access_token } = await api.loginStaff(email.trim(), password);
      setToken(access_token);

      let role = '';
      try {
        const payload = JSON.parse(atob(access_token.split('.')[1]));
        role = (payload.role as string)?.toUpperCase() ?? '';
      } catch {}

      setRoleName(role);
      setDone(true);
      const dest = role === 'PROCESSING_OFFICER' ? '/officer/caseload' : '/';
      setTimeout(() => router.push(dest), 1000);
    } catch (err: any) {
      setError(err.message ?? 'Invalid credentials. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  }

  const roleInfo = ROLE_LABELS[roleName];

  return (
    <div
      className="relative flex min-h-screen overflow-hidden"
      style={{ backgroundImage: "url('/hero-nurse.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Gradient overlay — lighter so hero image shows through */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a2f52]/55 via-[#0F4C81]/40 to-[#00675f]/35" />
      {/* Subtle noise texture feel */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />

      {/* ── Left panel ── */}
      <div className="relative z-10 hidden flex-col justify-between bg-white p-10 lg:flex lg:w-[44%] xl:w-[42%]">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-hero shadow-md">
            <span className="text-xs font-extrabold text-white">MJN</span>
          </div>
          <div>
            <span className="block text-sm font-bold text-foreground">MJN Healthcare</span>
            <span className="block text-[10px] text-muted-foreground leading-none">Admin Console</span>
          </div>
        </div>

        {/* Hero */}
        <div className="space-y-7">
          <div>
            <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-hero shadow-lg">
              <ShieldCheck className="h-7 w-7 text-white" weight="duotone" />
            </div>
            <h1 className="text-[2rem] font-extrabold leading-tight tracking-tight text-foreground">
              Staff &amp; Consultant<br />Operations Center
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-sm">
              Manage caseloads, verify documents, review AI-drafted communications, and track all client engagements from one secured console.
            </p>
          </div>

          {/* Live ops card */}
          <OpsPreview />

          {/* Role access badges */}
          <div>
            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Access levels</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(ROLE_LABELS).map(([, { label }]) => (
                <span key={label} className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[10px] font-bold text-foreground">
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Lock className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Restricted · Authorised staff only</span>
          </div>
          <p className="text-[11px] text-muted-foreground/60">© 2026 MJN Health Academy and Professional Services Ltd</p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="relative z-10 flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/15">
              <span className="text-xs font-bold text-white">MJN</span>
            </div>
            <div>
              <span className="block text-sm font-bold text-white">MJN Healthcare</span>
              <span className="block text-[10px] text-white/40">Admin Console</span>
            </div>
          </div>

          {/* Glass card */}
          <div className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl shadow-2xl shadow-black/30 p-8">

            {done ? (
              /* ── Success state ── */
              <div className="py-8 text-center">
                <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
                  <div className="absolute inset-2 rounded-full bg-emerald-400/10" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/30 border border-emerald-400/40 shadow-lg shadow-emerald-500/20">
                    <CheckCircle className="h-8 w-8 text-emerald-300" weight="fill" />
                  </div>
                </div>
                <h2 className="text-xl font-extrabold text-white">Access granted</h2>
                {roleInfo && (
                  <span className={`mt-2 inline-block rounded-full border px-3 py-1 text-xs font-bold ${roleInfo.color}`}>
                    {roleInfo.label}
                  </span>
                )}
                <p className="mt-3 text-sm text-white/50">Redirecting to your dashboard…</p>
                <div className="mt-5 flex justify-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2 w-2 rounded-full bg-emerald-400/60 animate-bounce"
                      style={{ animationDelay: `${i * 0.18}s` }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="mb-7">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 border border-white/15">
                    <ShieldCheck className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-white leading-tight">Staff sign in</h2>
                  <p className="mt-1.5 text-sm text-white/50">
                    Use your MJN staff credentials to access the operations console.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
                      Email address
                    </label>
                    <div className="relative">
                      <Envelope className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="staff@mjnhealth.com"
                        autoFocus
                        required
                        className="h-12 w-full rounded-xl border border-white/15 bg-white/8 pl-10 pr-4 text-sm text-white placeholder-white/25 outline-none transition focus:border-white/40 focus:bg-white/12 focus:ring-2 focus:ring-white/10 shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-wide text-white/50">Password</label>
                      <Link href="/forgot-password" className="text-xs text-white/30 hover:text-white/60 transition-colors font-medium">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <LockKey className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="h-12 w-full rounded-xl border border-white/15 bg-white/8 pl-10 pr-11 text-sm text-white placeholder-white/25 outline-none transition focus:border-white/40 focus:bg-white/12 focus:ring-2 focus:ring-white/10 shadow-inner"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      >
                        {showPw
                          ? <EyeSlash className="h-4 w-4" />
                          : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-start gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3">
                      <Warning className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" weight="fill" />
                      <p className="text-sm text-rose-300">{error}</p>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading || !email || !password}
                    className="flex w-full items-center justify-center gap-2 rounded-xl gradient-hero px-6 py-3.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[.98] disabled:opacity-50 shadow-lg shadow-primary/30 mt-2"
                  >
                    {loading
                      ? <><CircleNotch className="h-4 w-4 animate-spin" /> Authenticating…</>
                      : <>Sign in to console <ArrowRight className="h-4 w-4" /></>}
                  </button>
                </form>

                {/* Security notice */}
                <div className="mt-6 flex items-center justify-center gap-1.5">
                  <Lock className="h-3 w-3 text-white/25" />
                  <span className="text-[11px] text-white/25">256-bit encrypted · session expires after 7 days</span>
                </div>
              </>
            )}
          </div>

          <p className="mt-4 text-center text-[11px] text-white/25">
            Restricted to authorised MJN Healthcare staff only.
            Unauthorised access is prohibited.
          </p>
        </div>
      </div>
    </div>
  );
}
