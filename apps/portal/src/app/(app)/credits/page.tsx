'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../lib/api';
import { Skeleton } from '@mjn/ui';
import { toast } from 'sonner';
import {
  Gift, Copy, ArrowsLeftRight, CurrencyDollar, Clock,
  CheckCircle, ArrowDown, ArrowUp, TrendUp, Users, Info,
} from '@phosphor-icons/react';

type Wallet = {
  balanceCents: number;
  lifetimeEarnedCents: number;
  lifetimeSpentCents: number;
  transactions: Transaction[];
};

type Transaction = {
  id: string;
  type: string;
  amountCents: number;
  balanceAfterCents: number;
  reason: string;
  createdAt: string;
  expiresAt?: string;
};

type ReferralCode = {
  code: string;
  totalUses: number;
  totalRewardedCents: number;
  createdAt: string;
};

type ReferralUse = {
  id: string;
  status: string;
  rewardAmountCents: number;
  createdAt: string;
  referredPerson: { name?: string; email?: string };
};

const TX_ICON: Record<string, { icon: typeof Gift; color: string; label: string }> = {
  EARNED:          { icon: TrendUp,           color: 'text-emerald-600', label: 'Earned' },
  SPENT:           { icon: CurrencyDollar,    color: 'text-slate-500',   label: 'Spent' },
  TRANSFERRED_IN:  { icon: ArrowDown,         color: 'text-primary',     label: 'Received' },
  TRANSFERRED_OUT: { icon: ArrowUp,           color: 'text-amber-600',   label: 'Sent' },
  EXPIRED:         { icon: Clock,             color: 'text-rose-400',    label: 'Expired' },
  ADJUSTED:        { icon: CheckCircle,       color: 'text-teal-600',    label: 'Adjusted' },
};

function fmt(cents: number) {
  return `$${(Math.abs(cents) / 100).toFixed(2)}`;
}

export default function CreditsPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [referrals, setReferrals] = useState<ReferralUse[]>([]);
  const [loading, setLoading] = useState(true);

  // Transfer form
  const [showTransfer, setShowTransfer] = useState(false);
  const [toPersonId, setToPersonId] = useState('');
  const [transferAmt, setTransferAmt] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferring, setTransferring] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [w, rc, refs] = await Promise.all([
        api.getCreditWallet().catch(() => null),
        api.getMyReferralCode().catch(() => null),
        api.getMyReferrals().catch(() => []),
      ]);
      setWallet(w);
      setReferralCode(rc);
      const allUses: ReferralUse[] = (refs as any[]).flatMap((r: any) => r.uses ?? []);
      setReferrals(allUses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleTransfer() {
    const cents = Math.round(parseFloat(transferAmt) * 100);
    if (!toPersonId.trim() || isNaN(cents) || cents < 500) {
      toast.error('Enter a valid recipient ID and minimum $5');
      return;
    }
    setTransferring(true);
    try {
      await api.transferCredits(toPersonId.trim(), cents, transferNote || undefined);
      toast.success('Credits transferred successfully');
      setShowTransfer(false);
      setToPersonId(''); setTransferAmt(''); setTransferNote('');
      load();
    } catch (e: any) {
      toast.error(e.message ?? 'Transfer failed');
    } finally {
      setTransferring(false);
    }
  }

  const referralLink = referralCode
    ? `${typeof window !== 'undefined' ? window.location.origin.replace(':3002', ':3001') : 'https://mjnhealthcare.com'}/ref/${referralCode.code}`
    : '';

  function copyLink() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied!');
  }

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
      <Skeleton className="h-48 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Credits & Referrals</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Earn credits by referring new clients. Apply credits at checkout or transfer them to others.
        </p>
      </div>

      {/* Wallet stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Available Balance',
            value: fmt(wallet?.balanceCents ?? 0),
            icon: CurrencyDollar,
            color: 'text-primary',
            bg: 'bg-primary/8',
            highlight: true,
          },
          {
            label: 'Total Earned',
            value: fmt(wallet?.lifetimeEarnedCents ?? 0),
            icon: TrendUp,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Total Spent',
            value: fmt(wallet?.lifetimeSpentCents ?? 0),
            icon: CheckCircle,
            color: 'text-slate-500',
            bg: 'bg-slate-100',
          },
        ].map(({ label, value, icon: Icon, color, bg, highlight }) => (
          <div
            key={label}
            className={`rounded-2xl border p-5 shadow-sm flex items-center gap-4 ${highlight ? 'bg-primary/[0.03] border-primary/20' : 'bg-white border-border'}`}
          >
            <div className={`rounded-xl p-2.5 ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
              <p className={`text-2xl font-bold tabular-nums ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Referral card */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Your Referral Link</h2>
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {referralCode?.totalUses ?? 0} use{(referralCode?.totalUses ?? 0) !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="p-5 space-y-4">
          {/* How it works */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { step: '1', text: 'Share your link with a friend or colleague' },
              { step: '2', text: 'They sign up and complete their first payment' },
              { step: '3', text: 'You earn $10 in credits — instantly' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">{step}</span>
                <p className="text-xs text-slate-600">{text}</p>
              </div>
            ))}
          </div>

          {/* Link copy */}
          {referralCode ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-xl border border-border bg-muted/40 px-3 py-2.5 font-mono text-xs text-muted-foreground truncate">
                {referralLink}
              </div>
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors shadow-sm shrink-0"
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Generating your referral code…</p>
          )}

          <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
            <Info className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700">
              Bonus: if a referred friend books a consultation, you earn an extra 5% of their booking as credits.
            </p>
          </div>
        </div>
      </div>

      {/* Referred people */}
      {referrals.length > 0 && (
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-bold text-foreground">People You Referred</h2>
          </div>
          <div className="divide-y divide-border">
            {referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.referredPerson?.name ?? r.referredPerson?.email ?? 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-2">
                  {r.status === 'REWARDED' && (
                    <span className="text-sm font-bold text-emerald-600">+{fmt(r.rewardAmountCents)}</span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    r.status === 'REWARDED' ? 'bg-emerald-100 text-emerald-700' :
                    r.status === 'PENDING'  ? 'bg-amber-100 text-amber-700' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transfer */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowsLeftRight className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-bold text-foreground">Transfer Credits</h2>
          </div>
          <button
            onClick={() => setShowTransfer((v) => !v)}
            className="rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
          >
            {showTransfer ? 'Cancel' : 'Transfer'}
          </button>
        </div>
        {showTransfer && (
          <div className="p-5 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Recipient Person ID</label>
              <input
                value={toPersonId}
                onChange={(e) => setToPersonId(e.target.value)}
                placeholder="e.g. clxyz..."
                className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Amount (USD)</label>
              <input
                value={transferAmt}
                onChange={(e) => setTransferAmt(e.target.value)}
                type="number"
                min="5"
                step="1"
                placeholder="Minimum $5"
                className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Note (optional)</label>
              <input
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                placeholder="e.g. covering exam prep fees"
                className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={handleTransfer}
              disabled={transferring}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {transferring ? 'Transferring…' : 'Confirm Transfer'}
            </button>
          </div>
        )}
        {!showTransfer && (
          <div className="px-5 py-4">
            <p className="text-xs text-muted-foreground">
              Send credits to any other MJN Healthcare member. Minimum transfer is $5. Credits can be used by the recipient at checkout.
            </p>
          </div>
        )}
      </div>

      {/* Transaction history */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-bold text-foreground">Transaction History</h2>
        </div>
        {!wallet?.transactions?.length ? (
          <div className="px-5 py-10 text-center">
            <CurrencyDollar className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm font-medium text-foreground">No transactions yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">Share your referral link to start earning credits.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {wallet.transactions.map((tx) => {
              const meta = TX_ICON[tx.type] ?? { icon: CurrencyDollar, color: 'text-muted-foreground', label: tx.type };
              const Icon = meta.icon;
              const isPositive = tx.amountCents > 0;
              return (
                <div key={tx.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100`}>
                    <Icon className={`h-4 w-4 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{tx.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {tx.expiresAt && (
                        <span className="ml-2 text-amber-600">· expires {new Date(tx.expiresAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold tabular-nums ${isPositive ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {isPositive ? '+' : ''}{fmt(tx.amountCents)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Bal: {fmt(tx.balanceAfterCents)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
