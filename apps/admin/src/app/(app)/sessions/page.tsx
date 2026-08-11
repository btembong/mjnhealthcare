'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@mjn/ui';
import {
  VideoCamera, MagnifyingGlass, CheckCircle, Clock, X,
  ArrowSquareOut, CircleNotch, Warning, CalendarBlank,
  CurrencyDollar, CaretDown, User, CaretLeft, CaretRight, Rows,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';
import { useAdmin } from '../../../contexts/admin-context';
import {
  format, formatDistanceToNow, isPast, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths,
  getDay, startOfWeek, endOfWeek,
} from 'date-fns';

type Session = {
  id: string;
  clientName: string;
  clientEmail: string;
  category: string;
  status: string;
  paidAmount: number;
  roomUrl?: string;
  createdAt: string;
  slot?: {
    startAt: string;
    endAt: string;
    consultant?: { id: string; name: string };
  };
};

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED:  'bg-primary/10 text-primary border-primary/20',
  COMPLETED:  'bg-muted text-muted-foreground border-border',
  CANCELLED:  'bg-rose-100 text-rose-700 border-rose-200',
  PENDING:    'bg-amber-100 text-amber-700 border-amber-200',
};

function statusLabel(s: string) {
  return s?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? '—';
}

function SessionsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full rounded-xl" />
      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
    </div>
  );
}

export default function SessionsPage() {
  const router = useRouter();
  const { me } = useAdmin();
  const role = (me?.role as string)?.toUpperCase() ?? 'ADMIN';

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [completing, setCompleting] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<{ url: string; token: string | null; clientName: string } | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [view, setView] = useState<'table' | 'calendar'>('table');
  const [calMonth, setCalMonth] = useState(new Date());

  useEffect(() => { loadSessions(); }, [me]);

  async function loadSessions() {
    setLoading(true);
    try {
      let consultantId: string | undefined;
      if (role === 'CONSULTANT' && me?.email) {
        const profiles = await api.getConsultants().catch(() => []);
        const myProfile = profiles.find((p: any) => p.email?.toLowerCase() === me.email?.toLowerCase());
        consultantId = myProfile?.id;
      }
      const raw = await api.getSessions(consultantId ? { consultantId } : undefined) as any[];
      setSessions(raw.map((s: any) => ({
        id: s.id,
        clientName: s.clientName ?? '—',
        clientEmail: s.clientEmail ?? '—',
        category: s.category ?? '—',
        status: s.status ?? 'PENDING',
        paidAmount: Number(s.amountPaid ?? s.paidAmount ?? 0),
        roomUrl: s.dailyRoomUrl ?? s.roomUrl,
        createdAt: s.createdAt,
        slot: s.slot ? {
          startAt: s.slot.startAt,
          endAt: s.slot.endAt,
          consultant: s.slot.consultant,
        } : undefined,
      })));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  async function handleJoin(sessionId: string) {
    setJoiningId(sessionId);
    try {
      const data = await api.getHostJoinInfo(sessionId);
      if (!data.roomUrl) { alert(data.message ?? 'Room not ready.'); return; }
      const url = data.token ? `${data.roomUrl}?t=${data.token}` : data.roomUrl;
      setActiveRoom({ url, token: data.token ?? null, clientName: data.clientName });
    } catch (e) { console.error(e); alert('Could not load session room.'); }
    finally { setJoiningId(null); }
  }

  async function handleMarkCompleted(id: string) {
    setCompleting(id);
    try {
      await api.markSessionCompleted(id);
      setSessions((prev) => prev.map((s) => s.id === id ? { ...s, status: 'COMPLETED' } : s));
    } catch (e) { console.error(e); } finally { setCompleting(null); }
  }

  const filtered = sessions.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      s.clientName.toLowerCase().includes(q) ||
      s.clientEmail.toLowerCase().includes(q) ||
      (s.slot?.consultant?.name ?? '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const confirmed = sessions.filter((s) => s.status === 'CONFIRMED').length;
  const completed = sessions.filter((s) => s.status === 'COMPLETED').length;
  const totalRevenue = sessions.filter((s) => s.status !== 'CANCELLED').reduce((sum, s) => sum + s.paidAmount, 0);
  const upcoming = sessions.filter((s) => s.status === 'CONFIRMED' && s.slot?.startAt && !isPast(new Date(s.slot.startAt))).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {role === 'CONSULTANT' ? 'My Sessions' : 'Consultation Sessions'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {role === 'CONSULTANT'
              ? 'Your upcoming and past video consultation sessions.'
              : 'All video consultation sessions across all consultants.'}
          </p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Upcoming', value: upcoming, icon: CalendarBlank, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Confirmed', value: confirmed, icon: VideoCamera, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Completed', value: completed, icon: CheckCircle, color: 'text-muted-foreground', bg: 'bg-muted/60' },
          { label: 'Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: CurrencyDollar, color: 'text-primary', bg: 'bg-primary/10' },
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client or consultant…"
            className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 appearance-none rounded-xl border border-border bg-white pl-3 pr-8 text-sm outline-none focus:border-primary"
          >
            <option value="ALL">All statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="PENDING">Pending</option>
          </select>
          <CaretDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
        {/* View toggle */}
        <div className="flex items-center rounded-xl border border-border bg-white overflow-hidden">
          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-1.5 px-3 h-10 text-sm font-medium transition-colors ${view === 'table' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
          >
            <Rows className="h-4 w-4" />
            <span className="hidden sm:inline">List</span>
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex items-center gap-1.5 px-3 h-10 text-sm font-medium transition-colors ${view === 'calendar' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
          >
            <CalendarBlank className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar</span>
          </button>
        </div>
      </div>

      {/* Calendar View */}
      {view === 'calendar' && (() => {
        const monthStart = startOfMonth(calMonth);
        const monthEnd = endOfMonth(calMonth);
        const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start: calStart, end: calEnd });
        const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        return (
          <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
            {/* Month nav */}
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <button
                onClick={() => setCalMonth((m) => subMonths(m, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-border hover:bg-muted/50 transition-colors"
              >
                <CaretLeft className="h-4 w-4" />
              </button>
              <h2 className="text-sm font-bold text-foreground">
                {format(calMonth, 'MMMM yyyy')}
              </h2>
              <button
                onClick={() => setCalMonth((m) => addMonths(m, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-border hover:bg-muted/50 transition-colors"
              >
                <CaretRight className="h-4 w-4" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-border">
              {DAYS.map((d) => (
                <div key={d} className="py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                const daySessions = sessions.filter(
                  (s) => s.slot?.startAt && isSameDay(new Date(s.slot.startAt), day),
                );
                const isCurrentMonth = isSameMonth(day, calMonth);
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={i}
                    className={`min-h-[90px] border-b border-r border-border p-1.5 ${!isCurrentMonth ? 'bg-muted/20' : 'bg-white'} ${i % 7 === 6 ? 'border-r-0' : ''}`}
                  >
                    <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      isToday ? 'bg-primary text-white' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/40'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-0.5">
                      {daySessions.slice(0, 3).map((s) => (
                        <div
                          key={s.id}
                          className={`truncate rounded px-1.5 py-0.5 text-[10px] font-medium cursor-pointer hover:opacity-80 ${
                            s.status === 'CONFIRMED' ? 'bg-primary/10 text-primary' :
                            s.status === 'COMPLETED' ? 'bg-muted text-muted-foreground' :
                            s.status === 'CANCELLED' ? 'bg-rose-100 text-rose-600' :
                            'bg-amber-100 text-amber-700'
                          }`}
                          title={`${s.clientName} · ${s.slot?.startAt ? format(new Date(s.slot.startAt), 'h:mm a') : ''}`}
                        >
                          {s.slot?.startAt ? format(new Date(s.slot.startAt), 'h:mm') : ''} {s.clientName}
                        </div>
                      ))}
                      {daySessions.length > 3 && (
                        <div className="text-[10px] text-muted-foreground px-1">+{daySessions.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 border-t border-border px-5 py-3">
              {[
                { label: 'Confirmed', color: 'bg-primary/10 text-primary' },
                { label: 'Completed', color: 'bg-muted text-muted-foreground' },
                { label: 'Cancelled', color: 'bg-rose-100 text-rose-600' },
                { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
              ].map(({ label, color }) => (
                <div key={label} className={`rounded px-2 py-0.5 text-[10px] font-medium ${color}`}>{label}</div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Table */}
      {view === 'table' && (() => {
        if (loading) return <SessionsSkeleton />;
        if (filtered.length === 0) return (
          <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
            <VideoCamera className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-semibold text-foreground">No sessions found</p>
            <p className="mt-1 text-xs text-muted-foreground">Sessions booked via the public consultation page will appear here.</p>
          </div>
        );
        return (
          <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="px-5 py-3 font-semibold">Client</th>
                    {role === 'ADMIN' && <th className="px-5 py-3 font-semibold">Consultant</th>}
                    <th className="px-5 py-3 font-semibold">Scheduled</th>
                    <th className="px-5 py-3 font-semibold">Type</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Paid</th>
                    <th className="px-5 py-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((s) => {
                    const isUpcoming = s.status === 'CONFIRMED' && s.slot?.startAt && !isPast(new Date(s.slot.startAt));
                    const isExpanded = expandedId === s.id;
                    return (
                      <React.Fragment key={s.id}>
                        <tr
                          onClick={() => setExpandedId(isExpanded ? null : s.id)}
                          className={`hover:bg-muted/20 transition-colors cursor-pointer ${isUpcoming ? 'bg-primary/[0.02]' : ''}`}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                                {s.clientName.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{s.clientName}</p>
                                <p className="text-xs text-muted-foreground">{s.clientEmail}</p>
                              </div>
                            </div>
                          </td>
                          {role === 'ADMIN' && (
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{s.slot?.consultant?.name ?? '—'}</span>
                              </div>
                            </td>
                          )}
                          <td className="px-5 py-4">
                            {s.slot?.startAt ? (
                              <div>
                                <p className="text-sm font-medium text-foreground">{format(new Date(s.slot.startAt), 'MMM d, yyyy')}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(s.slot.startAt), 'h:mm a')}
                                  {isUpcoming && <span className="ml-1 text-primary">· {formatDistanceToNow(new Date(s.slot.startAt), { addSuffix: true })}</span>}
                                </p>
                              </div>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                          <td className="px-5 py-4">
                            <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground capitalize">
                              {s.category?.toLowerCase().replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[s.status] ?? 'bg-muted text-muted-foreground border-border'}`}>
                              {s.status === 'CONFIRMED' && isUpcoming && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
                              {statusLabel(s.status)}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-semibold text-foreground">${s.paidAmount.toLocaleString()}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              {s.roomUrl && s.status === 'CONFIRMED' && (
                                <button onClick={() => handleJoin(s.id)} disabled={joiningId === s.id}
                                  className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
                                >
                                  {joiningId === s.id ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <VideoCamera className="h-3.5 w-3.5" />}
                                  Join as host
                                </button>
                              )}
                              {s.status === 'CONFIRMED' && (
                                <button onClick={() => handleMarkCompleted(s.id)} disabled={completing === s.id}
                                  className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/50 disabled:opacity-50 transition-colors"
                                >
                                  {completing === s.id ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                                  Done
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${s.id}-exp`} className="bg-muted/20">
                            <td colSpan={role === 'ADMIN' ? 7 : 6} className="px-5 py-4">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                <div>
                                  <p className="font-semibold text-muted-foreground uppercase tracking-wide mb-1">Session ID</p>
                                  <p className="font-mono text-foreground break-all">{s.id}</p>
                                </div>
                                <div>
                                  <p className="font-semibold text-muted-foreground uppercase tracking-wide mb-1">Booked</p>
                                  <p className="text-foreground">{format(new Date(s.createdAt), 'MMM d, yyyy h:mm a')}</p>
                                </div>
                                {s.slot?.endAt && (
                                  <div>
                                    <p className="font-semibold text-muted-foreground uppercase tracking-wide mb-1">Duration</p>
                                    <p className="text-foreground">{Math.round((new Date(s.slot.endAt).getTime() - new Date(s.slot.startAt!).getTime()) / 60000)} min</p>
                                  </div>
                                )}
                                {s.roomUrl && (
                                  <div>
                                    <p className="font-semibold text-muted-foreground uppercase tracking-wide mb-1">Room</p>
                                    <a href={s.roomUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 truncate block">Open Daily.co room</a>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-border px-5 py-3">
              <p className="text-xs text-muted-foreground">
                {filtered.length} session{filtered.length !== 1 ? 's' : ''} shown
              </p>
            </div>
          </div>
        );
      })()}

      {/* ── Host video modal ───────────────────────────────────────────────── */}
      {activeRoom && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center justify-between bg-gray-900 px-4 py-2 shrink-0">
            <span className="text-sm font-semibold text-white">
              Session with {activeRoom.clientName} — Host View
            </span>
            <button
              onClick={() => setActiveRoom(null)}
              className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Leave session
            </button>
          </div>
          <iframe
            src={activeRoom.url}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="flex-1 w-full border-0"
          />
        </div>
      )}
    </div>
  );
}
