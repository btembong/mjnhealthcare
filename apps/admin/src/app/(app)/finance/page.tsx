'use client';

import { useEffect, useState, useCallback } from 'react';
import { Skeleton } from '@mjn/ui';
import {
  CurrencyDollar, TrendUp, Warning, Receipt, Users,
  Clock, ChartBar, Export, MagnifyingGlass, Gift,
  ArrowUp, ArrowDown, Minus, Stethoscope,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';

type FinanceData = {
  summary: {
    totalRevenue: number;
    orderRevenue: number;
    consultationRevenue: number;
    thisMonthRevenue: number;
    lastMonthRevenue: number;
    totalOutstanding: number;
    taxCollected: number;
    taxThisMonth: number;
    totalCreditLiabilityCents: number;
    payoutQueueTotal: number;
  };
  byCategory: { name: string; amount: number }[];
  monthly: { month: string; revenue: number; tax: number }[];
  pendingOrders: any[];
  overdueInstallments: any[];
  payoutQueue: any[];
  recentReceipts: any[];
  clientLedger: { name: string; email: string; totalBilled: number; totalPaid: number; outstanding: number }[];
};

function fmt(n: number) {
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  const up = pct >= 0;
  const Icon = pct === 0 ? Minus : up ? ArrowUp : ArrowDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${up ? 'text-emerald-600' : 'text-rose-500'}`}>
      <Icon className="h-3 w-3" />{Math.abs(pct)}%
    </span>
  );
}

type TabKey = 'overview' | 'outstanding' | 'payouts' | 'tax' | 'credits' | 'ledger';

export default function FinancePage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('overview');
  const [ledgerSearch, setLedgerSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await (api as any).getFinanceDashboard();
      setData(d);
    } catch { /* endpoint may not be available to all roles */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function exportCSV(rows: any[], filename: string) {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(','), ...rows.map((r) => keys.map((k) => JSON.stringify(r[k] ?? '')).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = filename;
    a.click();
  }

  const TABS: { key: TabKey; label: string; icon: typeof CurrencyDollar }[] = [
    { key: 'overview',     label: 'Overview',      icon: ChartBar },
    { key: 'outstanding',  label: 'Outstanding',   icon: Clock },
    { key: 'payouts',      label: 'Payouts',       icon: Users },
    { key: 'tax',          label: 'Tax',           icon: Receipt },
    { key: 'credits',      label: 'Credits',       icon: Gift },
    { key: 'ledger',       label: 'Client Ledger', icon: Users },
  ];

  const filteredLedger = (data?.clientLedger ?? []).filter((c) => {
    const q = ledgerSearch.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Finance Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Revenue, outstanding payments, payouts, tax, and client ledger.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : !data ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
          <Warning className="mx-auto mb-3 h-10 w-10 text-rose-400" />
          <p className="text-sm font-semibold text-foreground">Finance data unavailable</p>
          <p className="text-xs text-muted-foreground mt-1">This section is restricted to Finance role accounts.</p>
        </div>
      ) : (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total Revenue', value: fmt(data.summary.totalRevenue), icon: TrendUp,
                delta: <DeltaBadge current={data.summary.thisMonthRevenue} previous={data.summary.lastMonthRevenue} /> },
              { label: 'This Month', value: fmt(data.summary.thisMonthRevenue), icon: CurrencyDollar,
                delta: <DeltaBadge current={data.summary.thisMonthRevenue} previous={data.summary.lastMonthRevenue} /> },
              { label: 'Order Revenue', value: fmt(data.summary.orderRevenue ?? 0), icon: Receipt },
              { label: 'Consultation Revenue', value: fmt(data.summary.consultationRevenue ?? 0), icon: Stethoscope },
              { label: 'Outstanding', value: fmt(data.summary.totalOutstanding), icon: Clock },
              { label: 'Tax Collected', value: fmt(data.summary.taxCollected), icon: Receipt },
              { label: 'This Month Tax', value: fmt(data.summary.taxThisMonth), icon: ChartBar },
              { label: 'Pending Payouts', value: fmt(data.summary.payoutQueueTotal), icon: Users },
              { label: 'Credit Liability', value: `$${(data.summary.totalCreditLiabilityCents / 100).toFixed(2)}`, icon: Gift },
              { label: 'Overdue Orders', value: data.pendingOrders.length, icon: Warning },
            ].map(({ label, value, icon: Icon, delta }: any) => (
              <div key={label} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                <div className="mb-2 inline-flex rounded-lg p-2 bg-slate-100">
                  <Icon className="h-5 w-5 text-slate-600" />
                </div>
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
                  {delta}
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto gap-1 rounded-xl border border-border bg-muted/30 p-1 w-fit">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 h-8 text-xs font-medium whitespace-nowrap transition-colors ${tab === key ? 'bg-white shadow-sm text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Icon className="h-3.5 w-3.5" />{label}
              </button>
            ))}
          </div>

          {/* ── Overview ─────────────────────────────────────────────────────── */}
          {tab === 'overview' && (
            <div className="space-y-4">
              {/* Monthly bar chart (simple visual) */}
              <div className="rounded-2xl border border-border bg-white shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-foreground">Revenue — Last 12 Months</h2>
                  <button
                    onClick={() => exportCSV(data.monthly, 'revenue-monthly.csv')}
                    className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Export className="h-3.5 w-3.5" /> Export
                  </button>
                </div>
                <div className="flex items-end gap-2 h-40">
                  {data.monthly.map((m, i) => {
                    const max = Math.max(...data.monthly.map((x) => x.revenue), 1);
                    const h = Math.round((m.revenue / max) * 100);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] text-muted-foreground tabular-nums">
                          {m.revenue > 0 ? `$${Math.round(m.revenue / 1000)}k` : ''}
                        </span>
                        <div className="w-full rounded-t-md bg-primary/80 transition-all" style={{ height: `${Math.max(h, 2)}%` }} />
                        <span className="text-[9px] text-muted-foreground">{m.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* By category */}
              <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <h2 className="text-sm font-bold text-foreground">Revenue by Service Category</h2>
                </div>
                <div className="divide-y divide-border">
                  {data.byCategory.map((c) => {
                    const max = data.byCategory[0]?.amount ?? 1;
                    const pct = Math.round((c.amount / max) * 100);
                    return (
                      <div key={c.name} className="px-5 py-3 flex items-center gap-4">
                        <div className="w-32 shrink-0 text-xs font-medium text-foreground truncate">{c.name}</div>
                        <div className="flex-1 h-2 rounded-full bg-muted/60 overflow-hidden">
                          <div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm font-bold text-foreground tabular-nums w-20 text-right shrink-0">{fmt(c.amount)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Outstanding ─────────────────────────────────────────────────── */}
          {tab === 'outstanding' && (
            <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-sm font-bold text-foreground">Outstanding Orders ({data.pendingOrders.length})</h2>
                <button onClick={() => exportCSV(data.pendingOrders, 'outstanding-orders.csv')} className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors">
                  <Export className="h-3.5 w-3.5" /> Export
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 border-b border-border">
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="px-5 py-3 font-semibold">Client</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold">Amount Due</th>
                      <th className="px-5 py-3 font-semibold">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.pendingOrders.length === 0 ? (
                      <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground">No outstanding orders.</td></tr>
                    ) : data.pendingOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-foreground">{o.person?.name ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">{o.person?.email ?? o.id.slice(0, 12)}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${o.status === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                            {o.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-foreground tabular-nums">{fmt(o.total)}</td>
                        <td className="px-5 py-3.5 text-xs text-muted-foreground">
                          {new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Payouts ─────────────────────────────────────────────────────── */}
          {tab === 'payouts' && (
            <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-sm font-bold text-foreground">Consultant Payout Queue ({data.payoutQueue.length})</h2>
                <button onClick={() => exportCSV(data.payoutQueue, 'payout-queue.csv')} className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors">
                  <Export className="h-3.5 w-3.5" /> Export
                </button>
              </div>
              {data.payoutQueue.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-muted-foreground">No pending payouts.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 border-b border-border">
                      <tr className="text-left text-xs text-muted-foreground">
                        <th className="px-5 py-3 font-semibold">Consultant</th>
                        <th className="px-5 py-3 font-semibold">Gross</th>
                        <th className="px-5 py-3 font-semibold">Platform Fee</th>
                        <th className="px-5 py-3 font-semibold">Net Payout</th>
                        <th className="px-5 py-3 font-semibold">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.payoutQueue.map((p: any) => (
                        <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-foreground">{p.consultant?.name ?? '—'}</p>
                            <p className="text-xs text-muted-foreground">{p.consultant?.email ?? '—'}</p>
                          </td>
                          <td className="px-5 py-3.5 tabular-nums">{fmt(p.grossAmount ?? 0)}</td>
                          <td className="px-5 py-3.5 text-muted-foreground tabular-nums">{fmt(p.platformFee ?? 0)}</td>
                          <td className="px-5 py-3.5 font-bold text-emerald-600 tabular-nums">{fmt(p.netAmount ?? 0)}</td>
                          <td className="px-5 py-3.5 text-xs text-muted-foreground">
                            {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Tax ─────────────────────────────────────────────────────────── */}
          {tab === 'tax' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Total Tax Collected (all time)', value: fmt(data.summary.taxCollected) },
                  { label: 'Tax Collected This Month', value: fmt(data.summary.taxThisMonth) },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-2xl border border-border bg-white shadow-sm p-5">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-3xl font-bold text-foreground tabular-nums mt-1">{value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-border bg-white shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-foreground">Monthly Tax (12 months)</h2>
                  <button onClick={() => exportCSV(data.monthly, 'tax-monthly.csv')} className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors">
                    <Export className="h-3.5 w-3.5" /> Export
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 border-b border-border">
                      <tr className="text-left text-xs text-muted-foreground">
                        <th className="px-4 py-2 font-semibold">Month</th>
                        <th className="px-4 py-2 font-semibold">Revenue</th>
                        <th className="px-4 py-2 font-semibold">Tax (3.25%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.monthly.map((m) => (
                        <tr key={m.month} className="hover:bg-muted/20">
                          <td className="px-4 py-2.5 font-medium text-foreground">{m.month}</td>
                          <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{fmt(m.revenue)}</td>
                          <td className="px-4 py-2.5 font-semibold text-foreground tabular-nums">{fmt(m.tax)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Credits ─────────────────────────────────────────────────────── */}
          {tab === 'credits' && (
            <div className="rounded-2xl border border-border bg-white shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-bold text-foreground">Credit Wallet Liability</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border p-4">
                  <p className="text-xs text-muted-foreground">Outstanding Balance (all wallets)</p>
                  <p className="text-3xl font-bold text-primary tabular-nums mt-1">
                    ${(data.summary.totalCreditLiabilityCents / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Credits owed to clients — reduce as they spend at checkout.</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                To manage individual wallets and grant/deduct credits, go to the{' '}
                <a href="/referrals" className="text-primary underline underline-offset-2">Referrals & Credits</a> page.
              </p>
            </div>
          )}

          {/* ── Client Ledger ────────────────────────────────────────────────── */}
          {tab === 'ledger' && (
            <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border gap-4 flex-wrap">
                <h2 className="text-sm font-bold text-foreground">Client Ledger</h2>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={ledgerSearch}
                      onChange={(e) => setLedgerSearch(e.target.value)}
                      placeholder="Search client…"
                      className="h-9 rounded-xl border border-border bg-white pl-9 pr-4 text-sm outline-none focus:border-primary w-48"
                    />
                  </div>
                  <button onClick={() => exportCSV(data.clientLedger, 'client-ledger.csv')} className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors">
                    <Export className="h-3.5 w-3.5" /> Export
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 border-b border-border">
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="px-5 py-3 font-semibold">Client</th>
                      <th className="px-5 py-3 font-semibold">Total Billed</th>
                      <th className="px-5 py-3 font-semibold">Total Paid</th>
                      <th className="px-5 py-3 font-semibold">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredLedger.length === 0 ? (
                      <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground">No clients found.</td></tr>
                    ) : filteredLedger.map((c, i) => (
                      <tr key={i} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.email}</p>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-foreground tabular-nums">{fmt(c.totalBilled)}</td>
                        <td className="px-5 py-3.5 text-emerald-600 tabular-nums">{fmt(c.totalPaid)}</td>
                        <td className="px-5 py-3.5">
                          {c.outstanding > 0 ? (
                            <span className="font-bold text-amber-600 tabular-nums">{fmt(c.outstanding)}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
