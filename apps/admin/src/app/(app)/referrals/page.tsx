'use client';

import { useEffect, useState, useCallback } from 'react';
import { Skeleton } from '@mjn/ui';
import { toast } from 'sonner';
import {
  Gift, Users, CurrencyDollar, TrendUp, Prohibit,
  MagnifyingGlass, ArrowsLeftRight, Warning,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';

type ReferralCode = {
  id: string;
  code: string;
  totalUses: number;
  totalRewardedCents: number;
  isActive: boolean;
  createdAt: string;
  owner: { name?: string; email?: string };
  uses: { status: string }[];
};

type Wallet = {
  id: string;
  balanceCents: number;
  lifetimeEarnedCents: number;
  lifetimeSpentCents: number;
  person: { name?: string; email?: string };
};

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ReferralsPage() {
  const [tab, setTab] = useState<'codes' | 'wallets'>('codes');
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Adjust modal
  const [adjustWallet, setAdjustWallet] = useState<Wallet | null>(null);
  const [adjustAmt, setAdjustAmt] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [codesRes, walletsRes] = await Promise.all([
        api.getReferralCodes(1).catch(() => ({ codes: [] })),
        api.getCreditWallets(1).catch(() => ({ wallets: [] })),
      ]);
      setCodes(codesRes.codes ?? []);
      setWallets(walletsRes.wallets ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleVoid(id: string) {
    if (!confirm('Void this referral code? It will no longer accept new referrals.')) return;
    try {
      await api.voidReferralCode(id);
      toast.success('Code voided');
      load();
    } catch { toast.error('Failed to void code'); }
  }

  async function handleAdjust() {
    if (!adjustWallet || !adjustReason.trim()) { toast.error('Provide a reason'); return; }
    const cents = Math.round(parseFloat(adjustAmt) * 100);
    if (isNaN(cents) || cents === 0) { toast.error('Enter a valid non-zero amount'); return; }
    setAdjusting(true);
    try {
      await api.adminCreditAdjust(adjustWallet.person.email ?? '', cents, adjustReason);
      toast.success('Credits adjusted');
      setAdjustWallet(null);
      setAdjustAmt('');
      setAdjustReason('');
      load();
    } catch (e: any) {
      toast.error(e.message ?? 'Adjustment failed');
    } finally { setAdjusting(false); }
  }

  const filteredCodes = codes.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.code.toLowerCase().includes(q) || (c.owner.name ?? '').toLowerCase().includes(q) || (c.owner.email ?? '').toLowerCase().includes(q);
  });

  const filteredWallets = wallets.filter((w) => {
    const q = search.toLowerCase();
    return !q || (w.person.name ?? '').toLowerCase().includes(q) || (w.person.email ?? '').toLowerCase().includes(q);
  });

  // Summary stats
  const totalRewardedCents = codes.reduce((s, c) => s + c.totalRewardedCents, 0);
  const totalUses = codes.reduce((s, c) => s + c.totalUses, 0);
  const totalOutstandingCents = wallets.reduce((s, w) => s + w.balanceCents, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Referrals & Credits</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage referral codes, credit wallets, and manual adjustments.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Codes', value: codes.length, icon: Gift, color: 'text-primary', bg: 'bg-primary/8' },
          { label: 'Successful Referrals', value: totalUses, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Rewards Paid Out', value: fmt(totalRewardedCents), icon: TrendUp, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'Outstanding Liability', value: fmt(totalOutstandingCents), icon: CurrencyDollar, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl border border-border bg-white p-4 shadow-sm flex items-center gap-3">
            <div className={`rounded-xl p-2 ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + search */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex rounded-xl border border-border bg-white overflow-hidden shadow-sm">
          {(['codes', 'wallets'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 h-9 text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted/50'}`}
            >
              {t === 'codes' ? 'Referral Codes' : 'Credit Wallets'}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'codes' ? 'Search codes or owners…' : 'Search by name or email…'}
            className="h-9 w-full rounded-xl border border-border bg-white pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : tab === 'codes' ? (
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Code</th>
                  <th className="px-5 py-3 font-semibold">Owner</th>
                  <th className="px-5 py-3 font-semibold">Uses</th>
                  <th className="px-5 py-3 font-semibold">Rewarded</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Created</th>
                  <th className="px-5 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCodes.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">No referral codes found.</td></tr>
                ) : filteredCodes.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-bold text-foreground bg-muted/60 rounded px-2 py-1">{c.code}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-foreground">{c.owner.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{c.owner.email ?? '—'}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-foreground tabular-nums">{c.totalUses}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-emerald-600 tabular-nums">{fmt(c.totalRewardedCents)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {c.isActive ? 'Active' : 'Voided'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5">
                      {c.isActive && (
                        <button
                          onClick={() => handleVoid(c.id)}
                          className="flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Prohibit className="h-3 w-3" /> Void
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Person</th>
                  <th className="px-5 py-3 font-semibold">Balance</th>
                  <th className="px-5 py-3 font-semibold">Lifetime Earned</th>
                  <th className="px-5 py-3 font-semibold">Lifetime Spent</th>
                  <th className="px-5 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredWallets.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">No wallets found.</td></tr>
                ) : filteredWallets.map((w) => (
                  <tr key={w.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-foreground">{w.person.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{w.person.email ?? '—'}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold text-primary tabular-nums">{fmt(w.balanceCents)}</td>
                    <td className="px-5 py-3.5 text-sm text-emerald-600 tabular-nums">{fmt(w.lifetimeEarnedCents)}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground tabular-nums">{fmt(w.lifetimeSpentCents)}</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setAdjustWallet(w)}
                        className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <ArrowsLeftRight className="h-3 w-3" /> Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust modal */}
      {adjustWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-white shadow-2xl p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Adjust Credits</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {adjustWallet.person.name} · Current balance: {fmt(adjustWallet.balanceCents)}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Amount (USD, use negative to deduct)</label>
              <input
                value={adjustAmt}
                onChange={(e) => setAdjustAmt(e.target.value)}
                type="number"
                step="1"
                placeholder="e.g. 10 or -5"
                className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Reason (required)</label>
              <input
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. Goodwill bonus for early adopter"
                className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setAdjustWallet(null)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjust}
                disabled={adjusting}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {adjusting ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
