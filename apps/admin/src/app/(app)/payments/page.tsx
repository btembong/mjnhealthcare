'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader, Skeleton } from '@mjn/ui';
import { CurrencyDollar } from '@phosphor-icons/react';
import { api } from '../../../lib/api';

const STATUS_STYLES: Record<string, string> = {
  PAID: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  PARTIALLY_PAID: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
};

export default function PaymentsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    api.getAllOrders()
      .then(setOrders)
      .catch((err: any) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) => {
    const person = o.person ?? o.engagement?.person;
    const q = search.toLowerCase();
    const matchesSearch = !q
      || person?.name?.toLowerCase().includes(q)
      || person?.email?.toLowerCase().includes(q)
      || o.id.toLowerCase().includes(q);
    const matchesStatus = !statusFilter || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = orders.filter((o) => o.status === 'PAID').reduce((sum, o) => sum + Number(o.total ?? 0), 0);
  const pendingValue = orders.filter((o) => o.status === 'PENDING').reduce((sum, o) => sum + Number(o.total ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" subtitle={`${orders.length} orders across all clients`} />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Revenue</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{orders.filter((o) => o.status === 'PAID').length} paid orders</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">${pendingValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{orders.filter((o) => o.status === 'PENDING').length} awaiting payment</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Orders</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{orders.length}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">pipeline + standalone</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or order ID…"
          className="h-10 w-72 rounded-xl border border-border bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All statuses</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
          <CurrencyDollar className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-semibold text-foreground">No orders found</p>
          <p className="mt-1 text-sm text-muted-foreground">{search || statusFilter ? 'Try adjusting filters.' : 'Orders appear here once clients check out.'}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Mode</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((o: any) => {
                const person = o.person ?? o.engagement?.person;
                return (
                  <tr key={o.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{person?.name ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">{person?.email ?? '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground capitalize">
                        {o.orderType ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {o.lineItems?.length ?? 0} line item{o.lineItems?.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs capitalize">
                      {(o.paymentMode ?? '').replace(/_/g, ' ').toLowerCase()}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground">
                      ${Number(o.total ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_STYLES[o.status] ?? 'bg-muted text-muted-foreground'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
