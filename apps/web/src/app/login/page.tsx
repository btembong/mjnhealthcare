'use client';

import Link from 'next/link';
import * as React from 'react';
import { Button, Badge } from '@mjn/ui';
import {
  ArrowRight, EnvelopeSimple, Lock, Eye, EyeSlash, Phone,
} from '@phosphor-icons/react';

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000') + '/api/v1';
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3002';

type Tab = 'candidate' | 'staff';

export default function LoginPage() {
  const [tab, setTab] = React.useState<Tab>('candidate');
  const [showPassword, setShowPassword] = React.useState(false);
  const [otpSent, setOtpSent] = React.useState(false);
  const [phone, setPhone] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  async function handleSendOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) throw new Error('Could not send OTP. Check the number and try again.');
      setOtpSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      if (!res.ok) throw new Error('Invalid or expired code. Please try again.');
      const data = await res.json();
      localStorage.setItem('mjn_token', data.access_token);
      window.location.href = PORTAL_URL;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStaffLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/auth/staff/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Invalid email or password.');
      const data = await res.json();
      localStorage.setItem('mjn_token', data.access_token);
      window.location.href = PORTAL_URL;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">

        {/* LOGO */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <span className="text-sm font-bold text-white">MJN</span>
            </div>
            <span className="font-bold text-foreground text-lg">MJN Healthcare Academy</span>
          </Link>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        {/* CARD */}
        <div className="rounded-3xl border border-border bg-white p-8 shadow-sm">
          {/* TAB SWITCHER */}
          <div className="mb-6 flex gap-1 rounded-xl bg-muted p-1">
            <button
              onClick={() => { setTab('candidate'); setOtpSent(false); }}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${tab === 'candidate' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Candidate / Client
            </button>
            <button
              onClick={() => { setTab('staff'); setOtpSent(false); }}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${tab === 'staff' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Staff / Partner
            </button>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* CANDIDATE LOGIN — Phone OTP */}
          {tab === 'candidate' && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Sign in with Phone</h2>
              <p className="text-sm text-muted-foreground mb-6">We&apos;ll send a one-time code to your WhatsApp or SMS.</p>

              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        required
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+237 6XX XXX XXX"
                        className="w-full rounded-xl border border-border pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? 'Sending…' : 'Send Code'} {!loading && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <p className="text-sm text-muted-foreground rounded-xl bg-muted/60 px-4 py-3">
                    Code sent to <span className="font-semibold text-foreground">{phone}</span>. Check your WhatsApp or SMS.
                  </p>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">One-Time Code</label>
                    <input
                      required
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="6-digit code"
                      className="w-full rounded-xl border border-border px-4 py-2.5 text-sm text-center tracking-widest outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? 'Verifying…' : 'Sign In'} {!loading && <ArrowRight className="h-4 w-4" />}
                  </Button>
                  <button type="button" onClick={() => { setOtpSent(false); setOtp(''); setError(''); }} className="w-full text-center text-xs text-muted-foreground hover:text-foreground">
                    Use a different number
                  </button>
                </form>
              )}
            </div>
          )}

          {/* STAFF / PARTNER LOGIN — Email + Password */}
          {tab === 'staff' && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Staff & Partner Sign In</h2>
              <p className="text-sm text-muted-foreground mb-6">Use your MJN email address and password.</p>
              <form onSubmit={handleStaffLogin} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Email Address</label>
                  <div className="relative">
                    <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@mjnhealthcare.com"
                      className="w-full rounded-xl border border-border pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-border pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-muted-foreground">
                    <input type="checkbox" className="rounded accent-primary" />
                    Remember me
                  </label>
                  <a href="#" className="text-primary hover:underline">Forgot password?</a>
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign In'} {!loading && <ArrowRight className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* FOOTER LINKS */}
        <div className="mt-6 text-center space-y-2">
          {tab === 'candidate' && (
            <p className="text-sm text-muted-foreground">
              New to MJN?{' '}
              <Link href="/get-started" className="text-primary hover:underline font-medium">
                Book a free consultation
              </Link>
            </p>
          )}
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
            <Link href="/contact" className="hover:text-foreground">Help</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
