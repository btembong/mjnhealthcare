'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader, Skeleton } from '@mjn/ui';
import { CurrencyDollar, VideoCamera } from '@phosphor-icons/react';
import { api } from '../../../lib/api';

const ORDER_STATUS_STYLES: Record<string, string> = {
  PAID: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  PARTIALLY_PAID: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
};

const BOOKING_STATUS_STYLES: Record<string, string> = {
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  AWAITING_PAYMENT: 'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  NO_SHOW: 'bg-muted text-muted-foreground',
};

export default function PaymentsPage() {
  const [tab, setTab] = useState<'orders' | 'consultations'>('orders');

  // Orders state
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState('');

  // Consultations state
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatus, setBookingStatus] = useState('');

  useEffect(() => {
    api.getAllOrders()
      .then(setOrders)
      .catch((err: any) => toast.error(err.message))
      .finally(() => setOrdersLoading(false));

    api.getAllConsultationSessions()
      .then(setBookings)
      .catch((err: any) => toast.error(err.message))
      .finally(() => setBookingsLoading(false));
  }, []);

  // ── Orders ──────────────────────────────────────────────────────────────────
  const filteredOrders = orders.filter((o) => {
    const person = o.person ?? o.engagement?.person;
    const q = orderSearch.toLowerCase();
    return (!q || person?.name?.toLowerCase().includes(q) || person?.email?.toLowerCase().includes(q) || o.id.toLowerCase().includes(q))
      && (!orderStatus || o.status === orderStatus);
  });

  const totalRevenue = orders.filter((o) => o.status === 'PAID').reduce((sum, o) => sum + Number(o.total ?? 0), 0);
  const pendingValue = orders.filter((o) => o.status === 'PENDING').reduce((sum, o) => sum + Number(o.total ?? 0), 0);

  // ── Consultations ────────────────────────────────────────────────────────────
  const filteredBookings = bookings.filter((b) => {
    const q = bookingSearch.toLowerCase();
    return (!q || b.clientName?.toLowerCase().includes(q) || b.clientEmail?.toLowerCase().includes(q) || b.slot?.consultant?.name?.toLowerCase().includes(q))
      && (!bookingStatus || b.status === bookingStatus);
  });

  const consultRevenue = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
    .reduce((sum, b) => sum + Number(b.slot?.consultant?.priceUsd ?? 0), 0);
  const consultPending = bookings.filter((b) => b.status === 'AWAITING_PAYMENT').length;

  const TABS = [
    { key: 'orders', label: 'Orders', count: orders.length },
    { key: 'consultations', label: 'Consultations', count: bookings.length },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" subtitle="All payment activity — orders and consultation bookings" />

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
              tab === t.key ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${tab === t.key ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── ORDERS TAB ──────────────────────────────────────────────────────── */}
      {tab === 'orders' && (
        <>
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

          <div className="flex flex-wrap items-center gap-3">
            <input value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)}
              placeholder="Search by name, email or order ID…"
              className="h-10 w-72 rounded-xl border border-border bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
            <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)}
              className="h-10 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">All statuses</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {ordersLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
              <CurrencyDollar className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-semibold text-foreground">No orders found</p>
              <p className="mt-1 text-sm text-muted-foreground">{orderSearch || orderStatus ? 'Try adjusting filters.' : 'Orders appear here once clients check out.'}</p>
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
                    {filteredOrders.map((o: any) => {
                      const person = o.person ?? o.engagement?.person;
                      return (
                        <tr key={o.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{person?.name ?? '—'}</div>
                            <div className="text-xs text-muted-foreground">{person?.email ?? '—'}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground capitalize">{o.orderType ?? '—'}</span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {o.lineItems?.length ?? 0} item{o.lineItems?.length !== 1 ? 's' : ''}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs capitalize">
                            {(o.paymentMode ?? '').replace(/_/g, ' ').toLowerCase()}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-foreground">
                            ${Number(o.total ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${ORDER_STATUS_STYLES[o.status] ?? 'bg-muted text-muted-foreground'}`}>
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
        </>
      )}

      {/* ── CONSULTATIONS TAB ────────────────────────────────────────────────── */}
      {tab === 'consultations' && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Consultation Revenue</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">${consultRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED').length} paid bookings</p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Awaiting Payment</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">{consultPending}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">payment not yet received</p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">All Attempts</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{bookings.length}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">failed + pending + confirmed</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input value={bookingSearch} onChange={(e) => setBookingSearch(e.target.value)}
              placeholder="Search by client name, email or consultant…"
              className="h-10 w-72 rounded-xl border border-border bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
            <select value={bookingStatus} onChange={(e) => setBookingStatus(e.target.value)}
              className="h-10 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">All statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="AWAITING_PAYMENT">Awaiting Payment</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
          </div>

          {bookingsLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
          ) : filteredBookings.length === 0 ? (
            <div className="rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
              <VideoCamera className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-semibold text-foreground">No bookings found</p>
              <p className="mt-1 text-sm text-muted-foreground">{bookingSearch || bookingStatus ? 'Try adjusting filters.' : 'Consultation booking attempts appear here.'}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 border-b border-border">
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Client</th>
                      <th className="px-4 py-3 font-medium">Consultant</th>
                      <th className="px-4 py-3 font-medium">Session</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium text-right">Amount</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Booked</th>
                      <th className="px-4 py-3 font-medium">Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredBookings.map((b: any) => (
                      <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{b.clientName ?? '—'}</div>
                          <div className="text-xs text-muted-foreground">{b.clientEmail ?? '—'}</div>
                          {b.clientPhone && <div className="text-xs text-muted-foreground">{b.clientPhone}</div>}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{b.slot?.consultant?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {b.slot?.startAt ? new Date(b.slot.startAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                            {b.consultationCategory ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">
                          ${Number(b.slot?.consultant?.priceUsd ?? 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${BOOKING_STATUS_STYLES[b.status] ?? 'bg-muted text-muted-foreground'}`}>
                            {b.status?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                          {b.paymentRef ? b.paymentRef.slice(0, 12) + '…' : '—'}
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
