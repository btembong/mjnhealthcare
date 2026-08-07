'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, setToken } from '../../lib/api';
import { LockKey, Eye, EyeSlash, ArrowLeft, CircleNotch, CheckCircle, WarningCircle } from '@phosphor-icons/react';

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) setError('No reset token found. Please request a new link.');
  }, [token]);

  const mismatch = confirm.length > 0 && password !== confirm;
  const weak = password.length > 0 && password.length < 8;
  const canSubmit = token && password.length >= 8 && password === confirm && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const { access_token } = await api.resetPassword(token, password);
      setToken(access_token);
      setDone(true);
      setTimeout(() => router.push('/'), 1500);
    } catch (err: any) {
      setError(err.message ?? 'Reset failed. The link may have expired.');
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

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          {done ? (
            /* ── Success state ── */
            <div className="py-6 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                <CheckCircle className="h-8 w-8 text-white" weight="fill" />
              </div>
              <h2 className="text-xl font-extrabold text-white">Password updated</h2>
              <p className="mt-3 text-sm text-white/60">
                You are now signed in. Redirecting to your dashboard…
              </p>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="mb-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <LockKey className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-extrabold text-white">Set a new password</h2>
                <p className="mt-2 text-sm text-white/60">
                  Choose a strong password — at least 8 characters.
                </p>
              </div>

              {!token && (
                <div className="mb-4 flex items-start gap-2 rounded-xl bg-rose-500/10 px-4 py-3 border border-rose-500/20">
                  <WarningCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-rose-400">
                    No reset token found. Please{' '}
                    <Link href="/forgot-password" className="underline">request a new link</Link>.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New password */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-white/80">
                    New password
                  </label>
                  <div className="relative">
                    <LockKey className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      required
                      autoFocus
                      className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-10 text-sm text-white placeholder-white/30 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                    >
                      {showPw ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {weak && (
                    <p className="mt-1.5 text-xs text-amber-400">Password must be at least 8 characters.</p>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-white/80">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <LockKey className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repeat your new password"
                      required
                      className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder-white/30 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  {mismatch && (
                    <p className="mt-1.5 text-xs text-rose-400">Passwords do not match.</p>
                  )}
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl bg-rose-500/10 px-4 py-3 border border-rose-500/20">
                    <WarningCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-rose-400">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading
                    ? <><CircleNotch className="h-4 w-4 animate-spin" /> Updating…</>
                    : 'Set new password'}
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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
