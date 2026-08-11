'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from '@mjn/ui';
import {
  CurrencyDollar, CheckCircle, Clock, Warning,
  TrendUp, Calendar,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';
import { useAdmin } from '../../../contexts/admin-context';
import { format } from 'date-fns';

type Payout = {
  id: string;
  consultantName: string;
  consultantEmail?: string;
  sessionId: string;
  clientName?: string;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  status: 'PENDING' | 'PAID';
  paidAt?: string;
  createdAt: string;
};

const STATUS_STYLES: Record<string, string> = {
  PAID:    'bg-emerald-100 text-emerald-700 border-emerald-200',
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
};

export default function EarningsPage() {
  const { me } = useAdmin();
  const isConsultant = (me?.role as string)?.toUpperCase() === 'CONSULTANT';

  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    api.getPayoutQueue()
      .then((raw) => {
        const list = (raw ?? []) as any[];
        // Consultants only see their own payouts
        const filtered = isConsultant && me?.email
          ? list.filter((p: any) =>
              (p.consultant?.email ?? p.consultantEmail ?? '').toLowerCase() === me.email!.toLowerCase(),
            )
          : list;
        setPayouts(filtered.map((p: any) => ({
          id: p.id,
          consultantName: p.consultant?.name ?? p.consultantName ?? '—',
          consultantEmail: p.consultant?.email ?? p.consultantEmail,
          sessionId: p.bookingId ?? p.sessionId ?? p.id,
          clientName: p.booking?.clientName ?? p.clientName,
          grossAmount: Number(p.grossAmount ?? p.paidAmount ?? 0),
          platformFee: Number(p.platformFee ?? 0),
          netAmount: Number(p.netAmount ?? p.consultantAmount ?? 0),
          status: p.status ?? 'PENDING',
          paidAt: p.paidAt,
          createdAt: p.createdAt,
        })));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [me?.email]);

  async function handleMarkPaid(id: string) {
    setMarkingId(id);
    try {
      await api.markPayoutPaid(id);
      setPayouts((prev) => prev.map((p) => p.id === id ? { ...p, status: 'PAID', paidAt: new Date().toISOString() } : p));
    } catch (e: any) { alert(e.message); } finally { setMarkingId(null); }
  }

  const totalEarned  = payouts.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.netAmount, 0);
  const totalPending = payouts.filter((p) => p.status === 'PENDING').reduce((s, p) => s + p.netAmount, 0);
  const totalGross   = payouts.reduce((s, p) => s + p.grossAmount, 0);
  const totalFees    = payouts.reduce((s, p) => s + p.platformFee, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {isConsultant ? 'My Earnings' : 'Payout Queue'}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isConsultant
            ? 'Your consultation earnings and payout history.'
            : 'All consultant payouts — mark as paid when transferred.'}
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total earned', value: `$${totalEarned.toLocaleString()}`, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pending payout', value: `$${totalPending.toLocaleString()}`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Gross revenue', value: `$${totalGross.toLocaleString()}`, icon: TrendUp, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Platform fees', value: `$${totalFees.toLocaleString()}`, icon: Warning, color: 'text-muted-foreground', bg: 'bg-muted/60' },
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

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
      ) : payouts.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
          <CurrencyDollar className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm font-semibold text-foreground">No payouts yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Payouts are created when a consultation is marked completed.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr className="text-left text-xs text-muted-foreground">
                  {!isConsultant && <th className="px-5 py-3 font-semibold">Consultant</th>}
                  <th className="px-5 py-3 font-semibold">Client</th>
                  <th className="px-5 py-3 font-semibold">Gross</th>
                  <th className="px-5 py-3 font-semibold">Platform fee</th>
                  <th className="px-5 py-3 font-semibold">Net payout</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  {!isConsultant && <th className="px-5 py-3 font-semibold"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    {!isConsultant && (
                      <td className="px-5 py-4">
                        <p className="font-medium text-sm text-foreground">{p.consultantName}</p>
                        {p.consultantEmail && <p className="text-xs text-muted-foreground">{p.consultantEmail}</p>}
                      </td>
                    )}
                    <td className="px-5 py-4 text-sm text-foreground">
                      {p.clientName ?? '—'}
                    </td>
                    <td className="px-5 py-4 font-semibold text-foreground">
                      ${p.grossAmount.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-sm text-rose-600">
                      −${p.platformFee.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 font-bold text-emerald-700">
                      ${p.netAmount.toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[p.status] ?? 'bg-muted text-muted-foreground border-border'}`}>
                        {p.status === 'PAID'
                          ? <CheckCircle className="h-3 w-3" weight="fill" />
                          : <Clock className="h-3 w-3" />}
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(p.paidAt ?? p.createdAt), 'MMM d, yyyy')}
                      </div>
                    </td>
                    {!isConsultant && (
                      <td className="px-5 py-4">
                        {p.status === 'PENDING' && (
                          <button
                            onClick={() => handleMarkPaid(p.id)}
                            disabled={markingId === p.id}
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            {markingId === p.id ? 'Marking…' : 'Mark paid'}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-5 py-3">
            <p className="text-xs text-muted-foreground">
              {payouts.length} payout record{payouts.length !== 1 ? 's' : ''} · {payouts.filter((p) => p.status === 'PENDING').length} pending
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
