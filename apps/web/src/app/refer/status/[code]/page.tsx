'use client';

import * as React from 'react';
import Link from 'next/link';
import { use } from 'react';
import { MarketingNav } from '../../../../components/marketing-nav';
import { SiteFooter } from '../../../../components/site-footer';
import { CurrencyDollar, CheckCircle, Clock, LinkSimple, Copy, ArrowLeft } from '@phosphor-icons/react';

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'https://api.mjnhealthcare.com') + '/api/v1';

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONVERTED: 'bg-emerald-100 text-emerald-700',
  PAID: 'bg-sky-100 text-sky-700',
  VOID: 'bg-slate-100 text-slate-500',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  CONVERTED: 'Payout Due',
  PAID: 'Paid',
  VOID: 'Voided',
};

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export default function ReferralStatusPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    fetch(`${API}/public-referral/status/${code}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.statusCode && d.statusCode >= 400) throw new Error(d.message ?? 'Not found');
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [code]);

  function handleCopy() {
    if (!data?.link) return;
    navigator.clipboard.writeText(data.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <MarketingNav />

      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/refer" className="mb-6 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Refer & Earn
        </Link>

        {loading && (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-white animate-pulse border border-slate-200" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
            <p className="font-semibold text-rose-700">Referral code not found</p>
            <p className="mt-1 text-sm text-rose-600">Check your link or <Link href="/refer" className="underline">sign up here</Link>.</p>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {/* Header */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Hi, {data.name} 👋</h1>
                  <p className="text-sm text-slate-500">Your referral dashboard · Code: <span className="font-mono font-bold text-slate-700">{data.code}</span></p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="max-w-[200px] truncate text-xs text-[#0F4C81] font-medium">{data.link}</span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-xl bg-[#0F4C81] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0F4C81]/90"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? 'Copied!' : 'Copy link'}
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Total Referrals" value={String(data.stats.total)} sub="people who joined via your link" color="text-slate-900" />
              <StatCard label="Converted" value={String(data.stats.converted)} sub="made first payment" color="text-emerald-600" />
              <StatCard label="Total Earned" value={`$${data.stats.totalEarned}`} sub="paid out so far" color="text-sky-600" />
              <StatCard label="Pending Payout" value={`$${data.stats.totalDue}`} sub="awaiting transfer" color="text-amber-600" />
            </div>

            {/* Referrals list */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h2 className="font-semibold text-slate-900">Referral Activity</h2>
                <span className="text-xs text-slate-400">{data.referrals.length} total</span>
              </div>

              {data.referrals.length === 0 ? (
                <div className="py-12 text-center">
                  <LinkSimple className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                  <p className="font-medium text-slate-600">No referrals yet</p>
                  <p className="mt-1 text-sm text-slate-400">Share your link to start earning</p>
                  <a
                    href={`whatsapp://send?text=Looking to advance your healthcare career internationally? MJN Health can help! Join via my link: ${data.link}`}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Share on WhatsApp
                  </a>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {data.referrals.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between px-5 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{r.personName}</p>
                        <p className="text-xs text-slate-400">
                          Joined {r.joinedAt ? new Date(r.joinedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          {r.convertedAt && ` · Converted ${new Date(r.convertedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-700">${r.amountDue}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLE[r.status] ?? 'bg-slate-100 text-slate-500'}`}>
                          {STATUS_LABEL[r.status] ?? r.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payout info */}
            {data.stats.totalDue > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-semibold text-amber-900">Payout of ${data.stats.totalDue} pending</p>
                    <p className="mt-0.5 text-sm text-amber-700">Our team processes payouts within 7 business days via mobile money or bank transfer. If you haven't heard from us, email <a href="mailto:info@mjnhealthcare.com" className="underline">info@mjnhealthcare.com</a>.</p>
                  </div>
                </div>
              </div>
            )}

            {data.stats.paid > 0 && data.stats.totalDue === 0 && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600" weight="fill" />
                  <p className="font-medium text-emerald-800">All payouts have been processed. Keep referring to earn more!</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
