'use client';

import { useEffect, useState, useCallback } from 'react';
import { Skeleton } from '@mjn/ui';
import {
  CurrencyDollar, TrendUp, Warning, Receipt, Users,
  Clock, ChartBar, Export, MagnifyingGlass, Gift,
  ArrowUp, ArrowDown, Minus, Stethoscope, FileText,
  ListChecks,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';
import { toast } from 'sonner';

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

type TabKey = 'overview' | 'outstanding' | 'payouts' | 'tax' | 'receipts' | 'payroll' | 'credits' | 'ledger';

type PayrollData = {
  summary: { totalConsultRevenue: number; totalPlatformFee: number; totalNetPayout: number; totalPaid: number; totalPending: number };
  byConsultant: { name: string; email: string; sessions: number; grossRevenue: number; platformFee: number; netPayout: number; paid: number; pending: number }[];
  payouts: { id: string; consultantName: string; grossAmount: number; platformFee: number; netAmount: number; status: string; createdAt: string; paidAt?: string }[];
};

export default function FinancePage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('overview');
  const [ledgerSearch, setLedgerSearch] = useState('');

  // Receipts tab state
  const [receiptFrom, setReceiptFrom] = useState('');
  const [receiptTo, setReceiptTo] = useState('');
  const [downloading, setDownloading] = useState(false);

  // Tax export state
  const [taxFrom, setTaxFrom] = useState('');
  const [taxTo, setTaxTo] = useState('');

  // Payroll tab state
  const [payrollData, setPayrollData] = useState<PayrollData | null>(null);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [payrollFrom, setPayrollFrom] = useState('');
  const [payrollTo, setPayrollTo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await (api as any).getFinanceDashboard();
      setData(d);
    } catch { /* endpoint may not be available to all roles */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadPayroll = useCallback(async () => {
    setPayrollLoading(true);
    try {
      const d = await (api as any).getPayrollSummary(payrollFrom || undefined, payrollTo || undefined);
      setPayrollData(d);
    } catch { toast.error('Failed to load payroll data'); }
    finally { setPayrollLoading(false); }
  }, [payrollFrom, payrollTo]);

  useEffect(() => {
    if (tab === 'payroll') loadPayroll();
  }, [tab, loadPayroll]);

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
    { key: 'payroll',      label: 'Payroll',       icon: ListChecks },
    { key: 'tax',          label: 'Tax',           icon: Receipt },
    { key: 'receipts',     label: 'Receipts',      icon: FileText },
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

              {/* Tax period export */}
              <div className="rounded-2xl border border-border bg-white shadow-sm p-5">
                <h2 className="text-sm font-bold text-foreground mb-3">Export Tax Report (by Period)</h2>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-medium">From</label>
                    <input type="date" value={taxFrom} onChange={(e) => setTaxFrom(e.target.value)}
                      className="h-9 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-medium">To</label>
                    <input type="date" value={taxTo} onChange={(e) => setTaxTo(e.target.value)}
                      className="h-9 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary" />
                  </div>
                  <button
                    onClick={async () => {
                      setDownloading(true);
                      try { await (api as any).downloadTaxExport(taxFrom || undefined, taxTo || undefined); toast.success('Tax export downloaded'); }
                      catch { toast.error('Export failed'); }
                      finally { setDownloading(false); }
                    }}
                    disabled={downloading}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    <Export className="h-3.5 w-3.5" /> {downloading ? 'Exporting…' : 'Export Tax CSV'}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Leave dates blank to export all time. CSV includes per-order tax breakdown + totals row.</p>
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

          {/* ── Receipts ────────────────────────────────────────────────────── */}
          {tab === 'receipts' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-white shadow-sm p-5">
                <h2 className="text-sm font-bold text-foreground mb-1">Bulk Receipt Download</h2>
                <p className="text-xs text-muted-foreground mb-4">Download all receipts for a date range as a CSV. Leave blank to download all receipts.</p>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-medium">From</label>
                    <input type="date" value={receiptFrom} onChange={(e) => setReceiptFrom(e.target.value)}
                      className="h-9 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-medium">To</label>
                    <input type="date" value={receiptTo} onChange={(e) => setReceiptTo(e.target.value)}
                      className="h-9 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary" />
                  </div>
                  <button
                    onClick={async () => {
                      setDownloading(true);
                      try { await (api as any).downloadBulkReceipts(receiptFrom || undefined, receiptTo || undefined); toast.success('Receipts downloaded'); }
                      catch { toast.error('Download failed'); }
                      finally { setDownloading(false); }
                    }}
                    disabled={downloading}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    <Export className="h-3.5 w-3.5" /> {downloading ? 'Downloading…' : 'Download Receipts CSV'}
                  </button>
                </div>
              </div>

              {/* Recent receipts preview */}
              <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <h2 className="text-sm font-bold text-foreground">Recent Receipts ({data.recentReceipts.length})</h2>
                  <button onClick={() => exportCSV(data.recentReceipts, 'recent-receipts.csv')} className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors">
                    <Export className="h-3.5 w-3.5" /> Export
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 border-b border-border">
                      <tr className="text-left text-xs text-muted-foreground">
                        <th className="px-5 py-3 font-semibold">Client</th>
                        <th className="px-5 py-3 font-semibold">Amount</th>
                        <th className="px-5 py-3 font-semibold">Issued</th>
                        <th className="px-5 py-3 font-semibold">PDF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.recentReceipts.length === 0 ? (
                        <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground">No receipts found.</td></tr>
                      ) : data.recentReceipts.map((r: any) => (
                        <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-foreground">{r.order?.engagement?.client?.name ?? '—'}</p>
                            <p className="text-xs text-muted-foreground">{r.order?.engagement?.client?.email ?? r.id.slice(0, 12)}</p>
                          </td>
                          <td className="px-5 py-3.5 font-bold tabular-nums">{fmt(r.order?.total ?? 0)}</td>
                          <td className="px-5 py-3.5 text-xs text-muted-foreground">
                            {new Date(r.issuedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-5 py-3.5">
                            {r.pdfUrl ? (
                              <a href={r.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-xs underline underline-offset-2">Download</a>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Payroll ──────────────────────────────────────────────────────── */}
          {tab === 'payroll' && (
            <div className="space-y-4">
              {/* Date range filter */}
              <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-white shadow-sm p-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-medium">From</label>
                  <input type="date" value={payrollFrom} onChange={(e) => setPayrollFrom(e.target.value)}
                    className="h-9 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-medium">To</label>
                  <input type="date" value={payrollTo} onChange={(e) => setPayrollTo(e.target.value)}
                    className="h-9 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary" />
                </div>
                <button onClick={loadPayroll} disabled={payrollLoading}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {payrollLoading ? 'Loading…' : 'Apply Filter'}
                </button>
              </div>

              {payrollLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
                </div>
              ) : !payrollData ? (
                <div className="rounded-2xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">No payroll data available.</div>
              ) : (
                <>
                  {/* Summary KPIs */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {[
                      { label: 'Gross Consult Revenue', value: fmt(payrollData.summary.totalConsultRevenue), color: 'text-foreground' },
                      { label: 'Platform Fee Retained', value: fmt(payrollData.summary.totalPlatformFee), color: 'text-primary' },
                      { label: 'Net Payout (total)', value: fmt(payrollData.summary.totalNetPayout), color: 'text-foreground' },
                      { label: 'Paid Out', value: fmt(payrollData.summary.totalPaid), color: 'text-emerald-600' },
                      { label: 'Pending Payout', value: fmt(payrollData.summary.totalPending), color: 'text-amber-600' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="rounded-2xl border border-border bg-white shadow-sm p-4">
                        <p className="text-xs text-muted-foreground font-medium">{label}</p>
                        <p className={`text-xl font-bold tabular-nums mt-0.5 ${color}`}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Per-consultant breakdown */}
                  <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                      <h2 className="text-sm font-bold text-foreground">By Consultant</h2>
                      <button onClick={() => exportCSV(payrollData.byConsultant, 'payroll-by-consultant.csv')} className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors">
                        <Export className="h-3.5 w-3.5" /> Export
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/40 border-b border-border">
                          <tr className="text-left text-xs text-muted-foreground">
                            <th className="px-5 py-3 font-semibold">Consultant</th>
                            <th className="px-5 py-3 font-semibold">Sessions</th>
                            <th className="px-5 py-3 font-semibold">Gross Revenue</th>
                            <th className="px-5 py-3 font-semibold">Platform Fee</th>
                            <th className="px-5 py-3 font-semibold">Net Payout</th>
                            <th className="px-5 py-3 font-semibold">Paid</th>
                            <th className="px-5 py-3 font-semibold">Pending</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {payrollData.byConsultant.length === 0 ? (
                            <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">No consultant payout data.</td></tr>
                          ) : payrollData.byConsultant.map((c, i) => (
                            <tr key={i} className="hover:bg-muted/20 transition-colors">
                              <td className="px-5 py-3.5">
                                <p className="font-medium text-foreground">{c.name}</p>
                                <p className="text-xs text-muted-foreground">{c.email}</p>
                              </td>
                              <td className="px-5 py-3.5 tabular-nums text-muted-foreground">{c.sessions}</td>
                              <td className="px-5 py-3.5 tabular-nums font-semibold text-foreground">{fmt(c.grossRevenue)}</td>
                              <td className="px-5 py-3.5 tabular-nums text-primary">{fmt(c.platformFee)}</td>
                              <td className="px-5 py-3.5 tabular-nums font-bold text-foreground">{fmt(c.netPayout)}</td>
                              <td className="px-5 py-3.5 tabular-nums text-emerald-600">{fmt(c.paid)}</td>
                              <td className="px-5 py-3.5">
                                {c.pending > 0
                                  ? <span className="font-semibold text-amber-600 tabular-nums">{fmt(c.pending)}</span>
                                  : <span className="text-muted-foreground">—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Payout history */}
                  <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                      <h2 className="text-sm font-bold text-foreground">Payout History ({payrollData.payouts.length})</h2>
                      <button onClick={() => exportCSV(payrollData.payouts, 'payout-history.csv')} className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors">
                        <Export className="h-3.5 w-3.5" /> Export
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/40 border-b border-border">
                          <tr className="text-left text-xs text-muted-foreground">
                            <th className="px-5 py-3 font-semibold">Consultant</th>
                            <th className="px-5 py-3 font-semibold">Gross</th>
                            <th className="px-5 py-3 font-semibold">Platform Fee</th>
                            <th className="px-5 py-3 font-semibold">Net</th>
                            <th className="px-5 py-3 font-semibold">Status</th>
                            <th className="px-5 py-3 font-semibold">Created</th>
                            <th className="px-5 py-3 font-semibold">Paid At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {payrollData.payouts.length === 0 ? (
                            <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">No payouts in this period.</td></tr>
                          ) : payrollData.payouts.map((p) => (
                            <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                              <td className="px-5 py-3.5 font-medium text-foreground">{p.consultantName}</td>
                              <td className="px-5 py-3.5 tabular-nums text-muted-foreground">{fmt(p.grossAmount)}</td>
                              <td className="px-5 py-3.5 tabular-nums text-primary">{fmt(p.platformFee)}</td>
                              <td className="px-5 py-3.5 tabular-nums font-bold text-foreground">{fmt(p.netAmount)}</td>
                              <td className="px-5 py-3.5">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-xs text-muted-foreground">
                                {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="px-5 py-3.5 text-xs text-muted-foreground">
                                {p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
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
