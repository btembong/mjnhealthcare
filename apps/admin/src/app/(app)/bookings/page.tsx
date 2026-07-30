'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader, Skeleton } from '@mjn/ui';
import { CalendarBlank } from '@phosphor-icons/react';
import { api } from '../../../lib/api';

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-amber-100 text-amber-700',
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getAllBookings()
      .then(setBookings)
      .catch((err: any) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = bookings.filter((b) => {
    const q = search.toLowerCase();
    return !q
      || b.person?.name?.toLowerCase().includes(q)
      || b.person?.email?.toLowerCase().includes(q)
      || b.type?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Bookings" subtitle={`${filtered.length} of ${bookings.length} bookings`} />

      <div className="relative max-w-sm">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or type…"
          className="h-10 w-full rounded-xl border border-border bg-white pl-4 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
          <CalendarBlank className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-semibold text-foreground">No bookings found</p>
          <p className="mt-1 text-sm text-muted-foreground">{search ? 'Try a different search.' : 'Bookings appear here once created.'}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Booked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((b: any) => (
                <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{b.person?.name ?? '—'}</div>
                    <div className="text-xs text-muted-foreground">{b.person?.email ?? '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{b.type ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {b.slot?.date ? new Date(b.slot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {b.slot?.startTime
                      ? new Date(b.slot.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                    {b.slot?.endTime
                      ? ' – ' + new Date(b.slot.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                      : ''}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_STYLES[b.status] ?? 'bg-muted text-muted-foreground'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
