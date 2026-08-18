'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Skeleton } from '@mjn/ui';
import {
  MagnifyingGlass, CaretUp, CaretDown, CaretUpDown, Plus,
  Rows, Kanban, CalendarBlank, CheckSquare, Export, UserPlus,
  X as XIcon,
} from '@phosphor-icons/react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { api } from '../../../lib/api';
import { useAdmin } from '../../../contexts/admin-context';

function statusLabel(s: string) {
  return s?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? '—';
}

// SLA thresholds (days stuck in status before escalating)
const SLA_THRESHOLDS: Record<string, { red: number; amber: number }> = {
  PENDING_SIGNATURE: { red: 7,  amber: 3  },
  ACTIVE:            { red: 90, amber: 60 },
  ON_HOLD:           { red: 30, amber: 14 },
};

function getSLA(eng: Engagement): { label: string; color: string; dot: string } | null {
  if (!eng.createdAt || !SLA_THRESHOLDS[eng.status]) return null;
  const days = Math.floor((Date.now() - new Date(eng.createdAt).getTime()) / 86_400_000);
  const t = SLA_THRESHOLDS[eng.status];
  if (days >= t.red) return {
    label: `${days}d — Overdue`,
    color: 'bg-rose-100 text-rose-700 border-rose-200',
    dot: 'bg-rose-500 animate-pulse',
  };
  if (days >= t.amber) return {
    label: `${days}d — At risk`,
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-amber-400',
  };
  return {
    label: `${days}d — On track`,
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  };
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  PENDING_SIGNATURE: 'bg-amber-100 text-amber-700 border-amber-200',
  COMPLETED: 'bg-blue-100 text-blue-700 border-blue-200',
  ON_HOLD: 'bg-orange-100 text-orange-700 border-orange-200',
  TERMINATED: 'bg-rose-100 text-rose-700 border-rose-200',
};

type Engagement = {
  id: string;
  status: string;
  paymentMode?: string;
  consultantId?: string;
  consultantName?: string | null;
  consultantEmail?: string | null;
  createdAt?: string;
  person?: { name?: string; email?: string; profession?: string };
};

const col = createColumnHelper<Engagement>();

const columns = [
  col.accessor((row) => row.person?.name ?? '', {
    id: 'client',
    header: 'Client',
    cell: (info) => (
      <div>
        <p className="font-medium text-foreground text-sm">{info.row.original.person?.name ?? '—'}</p>
        <p className="text-[11px] text-muted-foreground">{info.row.original.person?.email ?? info.row.original.id}</p>
      </div>
    ),
  }),
  col.accessor((row) => row.person?.profession ?? '', {
    id: 'profession',
    header: 'Profession',
    cell: (info) => <span className="text-sm text-muted-foreground capitalize">{info.getValue() || '—'}</span>,
  }),
  col.accessor('status', {
    header: 'Status',
    cell: (info) => (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide border ${STATUS_STYLES[info.getValue()] ?? 'bg-muted text-muted-foreground border-border'}`}>
        {statusLabel(info.getValue())}
      </span>
    ),
  }),
  col.accessor((row) => row.consultantName ?? row.consultantId ?? '', {
    id: 'consultant',
    header: 'Consultant',
    cell: (info) => (
      <span className="text-xs text-muted-foreground">
        {info.row.original.consultantName ?? (info.row.original.consultantId ? '—' : '—')}
      </span>
    ),
  }),
  col.accessor('paymentMode', {
    header: 'Payment mode',
    cell: (info) => <span className="text-xs text-muted-foreground">{info.getValue() ?? '—'}</span>,
  }),
  col.accessor('createdAt', {
    header: 'Created',
    cell: (info) => (
      <span className="text-xs text-muted-foreground">
        {info.getValue() ? new Date(info.getValue()!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
      </span>
    ),
    sortingFn: 'datetime',
  }),
  col.display({
    id: 'sla',
    header: 'SLA',
    cell: (info) => {
      const sla = getSLA(info.row.original);
      if (!sla) return <span className="text-xs text-muted-foreground/40">—</span>;
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${sla.color}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${sla.dot}`} />
          {sla.label}
        </span>
      );
    },
  }),
];

function SortIcon({ state }: { state: false | 'asc' | 'desc' }) {
  if (state === 'asc') return <CaretUp className="h-3 w-3" />;
  if (state === 'desc') return <CaretDown className="h-3 w-3" />;
  return <CaretUpDown className="h-3 w-3 text-muted-foreground/40" />;
}

const KANBAN_COLUMNS = [
  { key: 'PENDING_SIGNATURE', label: 'Pending Signature', dot: 'bg-amber-400' },
  { key: 'ACTIVE',            label: 'Active',            dot: 'bg-emerald-500' },
  { key: 'ON_HOLD',           label: 'On Hold',           dot: 'bg-slate-400' },
  { key: 'COMPLETED',         label: 'Completed',         dot: 'bg-slate-500' },
  { key: 'TERMINATED',        label: 'Terminated',        dot: 'bg-slate-400' },
];

function KanbanCard({ eng, onClick }: { eng: Engagement; onClick: () => void }) {
  const sla = getSLA(eng);
  const initials = (eng.person?.name ?? '??').slice(0, 2).toUpperCase();
  const consultantInitials = eng.consultantName ? eng.consultantName.slice(0, 2).toUpperCase() : null;
  const shortId = eng.id.slice(0, 8).toUpperCase();
  const created = eng.createdAt
    ? new Date(eng.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const urgencyBorder =
    sla?.label.includes('Overdue') ? 'border-l-rose-400' :
    sla?.label.includes('risk') ? 'border-l-amber-300' :
    'border-l-transparent';

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-xl border border-slate-200 border-l-4 bg-white p-3.5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-150 ${urgencyBorder}`}
    >
      {/* Client row */}
      <div className="flex items-start gap-2.5 mb-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary ring-2 ring-primary/10">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-800 leading-tight">
            {eng.person?.name ?? '—'}
          </p>
          <p className="truncate text-[11px] text-slate-500 mt-0.5">
            {eng.person?.email ?? `#${shortId}`}
          </p>
        </div>
      </div>

      {/* Tags row */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {eng.person?.profession && (
          <span className="rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-semibold text-primary capitalize">
            {eng.person.profession}
          </span>
        )}
        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-500">
          #{shortId}
        </span>
        {eng.paymentMode && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 capitalize">
            {eng.paymentMode.toLowerCase()}
          </span>
        )}
      </div>

      {/* Consultant row */}
      <div className="flex items-center justify-between mb-2.5">
        {consultantInitials ? (
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-600">
              {consultantInitials}
            </div>
            <span className="text-[11px] text-slate-500 font-medium truncate max-w-[120px]">
              {eng.consultantName}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400 italic">Unassigned</span>
        )}
        {created && (
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <CalendarBlank className="h-3 w-3" />
            {created}
          </div>
        )}
      </div>

      {/* SLA badge */}
      {sla && (
        <div className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${sla.color}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${sla.dot}`} />
          {sla.label}
        </div>
      )}
    </div>
  );
}

function KanbanView({ engagements, onCardClick }: { engagements: Engagement[]; onCardClick: (id: string) => void }) {
  const byStatus = useMemo(() => {
    const map: Record<string, Engagement[]> = {};
    for (const col of KANBAN_COLUMNS) map[col.key] = [];
    for (const eng of engagements) {
      if (map[eng.status]) map[eng.status].push(eng);
    }
    return map;
  }, [engagements]);

  const totalOverdue = useMemo(() =>
    engagements.filter((e) => getSLA(e)?.label.includes('Overdue')).length,
    [engagements],
  );
  const totalAtRisk = useMemo(() =>
    engagements.filter((e) => getSLA(e)?.label.includes('risk')).length,
    [engagements],
  );

  return (
    <div className="space-y-4">
      {/* Board summary strip */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Total</span>
          <span className="text-sm font-bold text-slate-800">{engagements.length}</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-emerald-700 font-medium">Active</span>
          <span className="text-sm font-bold text-emerald-800">{(byStatus['ACTIVE'] ?? []).length}</span>
        </div>
        {totalOverdue > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs text-rose-700 font-medium">Overdue SLA</span>
            <span className="text-sm font-bold text-rose-800">{totalOverdue}</span>
          </div>
        )}
        {totalAtRisk > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-xs text-amber-700 font-medium">At Risk</span>
            <span className="text-sm font-bold text-amber-800">{totalAtRisk}</span>
          </div>
        )}
      </div>

      {/* Board */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => {
          const cards = byStatus[col.key] ?? [];
          const colOverdue = cards.filter((e) => getSLA(e)?.label.includes('Overdue')).length;
          const colAtRisk = cards.filter((e) => getSLA(e)?.label.includes('risk')).length;

          return (
            <div key={col.key} className="flex w-[280px] shrink-0 flex-col rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shadow-sm">
              {/* Column header */}
              <div className="px-4 pt-3.5 pb-3 bg-white border-b border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                    <span className="text-sm font-semibold text-slate-700">{col.label}</span>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500">
                    {cards.length}
                  </span>
                </div>
                {/* SLA summary */}
                {(colOverdue > 0 || colAtRisk > 0) && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {colOverdue > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 border border-rose-200 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                        {colOverdue} overdue
                      </span>
                    )}
                    {colAtRisk > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        {colAtRisk} at risk
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 p-3 overflow-y-auto" style={{ maxHeight: 580 }}>
                {cards.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-10 gap-2">
                    <span className="text-2xl font-black text-slate-300">—</span>
                    <p className="text-xs font-medium text-slate-400">No cases</p>
                  </div>
                ) : (
                  // Overdue first, then at-risk, then on-track
                  [...cards]
                    .sort((a, b) => {
                      const order = (e: Engagement) =>
                        getSLA(e)?.label.includes('Overdue') ? 0 :
                        getSLA(e)?.label.includes('risk') ? 1 : 2;
                      return order(a) - order(b);
                    })
                    .map((eng) => (
                      <KanbanCard key={eng.id} eng={eng} onClick={() => onCardClick(eng.id)} />
                    ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CaseloadPage() {
  const router = useRouter();
  const { me } = useAdmin();
  const isConsultant = (me?.role as string)?.toUpperCase() === 'CONSULTANT';

  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [consultantFilter, setConsultantFilter] = useState('ALL');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAssignId, setBulkAssignId] = useState('');
  const [bulkWorking, setBulkWorking] = useState(false);

  const [consultants, setConsultants] = useState<any[]>([]);

  useEffect(() => {
    api.getAllEngagements()
      .then(setEngagements)
      .catch(console.error)
      .finally(() => setLoading(false));
    api.getConsultants(true).then(setConsultants).catch(() => {});
  }, []);

  const consultantOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: { label: string; email: string }[] = [];
    for (const e of engagements) {
      if (e.consultantEmail && !seen.has(e.consultantEmail)) {
        seen.add(e.consultantEmail);
        opts.push({ label: e.consultantName ?? e.consultantEmail, email: e.consultantEmail });
      }
    }
    return opts.sort((a, b) => a.label.localeCompare(b.label));
  }, [engagements]);

  const filtered = useMemo(() => {
    let result = engagements;
    // Consultants only see their own cases — not overridable
    if (isConsultant && me?.email) {
      result = result.filter((e) => e.consultantEmail === me.email);
    } else {
      if (consultantFilter !== 'ALL') {
        if (consultantFilter === 'UNASSIGNED') {
          result = result.filter((e) => !e.consultantEmail);
        } else {
          result = result.filter((e) => e.consultantEmail === consultantFilter);
        }
      }
    }
    if (statusFilter !== 'ALL') result = result.filter((e) => e.status === statusFilter);
    return result;
  }, [engagements, statusFilter, consultantFilter, isConsultant, me?.email]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
    globalFilterFn: (row, _colId, value) => {
      const q = String(value).toLowerCase();
      return (
        (row.original.person?.name ?? '').toLowerCase().includes(q) ||
        (row.original.person?.email ?? '').toLowerCase().includes(q) ||
        row.original.id.toLowerCase().includes(q)
      );
    },
  });

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const visibleIds = table.getRowModel().rows.map((r) => r.original.id);
    setSelected((prev) => {
      if (visibleIds.every((id) => prev.has(id))) {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...prev, ...visibleIds]);
    });
  }

  async function handleBulkAssign() {
    if (!bulkAssignId || selected.size === 0) return;
    setBulkWorking(true);
    try {
      await Promise.all([...selected].map((id) => api.assignConsultant(id, bulkAssignId)));
      const updated = await api.getAllEngagements();
      setEngagements(updated);
      setSelected(new Set());
      setBulkAssignId('');
    } catch (e: any) { alert(e.message); } finally { setBulkWorking(false); }
  }

  function handleBulkExport() {
    const rows = filtered.filter((e) => selected.has(e.id));
    const csv = [
      'ID,Client,Email,Profession,Status,Consultant,Created',
      ...rows.map((e) => [
        e.id, e.person?.name ?? '', e.person?.email ?? '',
        e.person?.profession ?? '', e.status,
        e.consultantName ?? '', e.createdAt ?? '',
      ].join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `caseload-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setSelected(new Set());
  }

  return (
    <div className="space-y-5">
        <PageHeader
          title="Caseload"
          subtitle={isConsultant ? `${filtered.length} case${filtered.length !== 1 ? 's' : ''} assigned to you` : `${engagements.length} total engagements`}
          actions={
            <button
              onClick={() => router.push('/caseload/new')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[#00A896] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" /> New engagement
            </button>
          }
        />

        {/* Filters + view toggle */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search by name, email or ID…"
              className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING_SIGNATURE">Pending signature</option>
            <option value="COMPLETED">Completed</option>
            <option value="ON_HOLD">On hold</option>
            <option value="TERMINATED">Terminated</option>
          </select>
          {!isConsultant && (
            <select
              value={consultantFilter}
              onChange={(e) => setConsultantFilter(e.target.value)}
              className="h-10 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary"
            >
              <option value="ALL">All consultants</option>
              <option value="UNASSIGNED">Unassigned</option>
              {consultantOptions.map((opt) => (
                <option key={opt.email} value={opt.email}>{opt.label}</option>
              ))}
            </select>
          )}
          {/* View toggle */}
          <div className="flex items-center rounded-xl border border-border bg-white overflow-hidden">
            <button
              onClick={() => setView('table')}
              className={`flex items-center gap-1.5 px-3 h-10 text-sm font-medium transition-colors ${view === 'table' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
              title="Table view"
            >
              <Rows className="h-4 w-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-1.5 px-3 h-10 text-sm font-medium transition-colors ${view === 'kanban' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
              title="Kanban view"
            >
              <Kanban className="h-4 w-4" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : view === 'kanban' ? (
          <KanbanView engagements={filtered} onCardClick={(id) => router.push('/caseload/' + id)} />
        ) : table.getRowModel().rows.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-10 text-center">
            <p className="text-sm text-muted-foreground">No engagements match your filters.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
            {/* Bulk action bar */}
            {selected.size > 0 && (
              <div className="flex items-center gap-3 border-b border-border bg-primary/5 px-4 py-2.5 flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">{selected.size} selected</span>
                </div>
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                  {!isConsultant && (
                    <div className="flex items-center gap-2">
                      <select
                        value={bulkAssignId}
                        onChange={(e) => setBulkAssignId(e.target.value)}
                        className="h-8 rounded-lg border border-border bg-white px-2 text-xs outline-none focus:border-primary"
                      >
                        <option value="">Assign consultant…</option>
                        {consultants.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleBulkAssign}
                        disabled={!bulkAssignId || bulkWorking}
                        className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        {bulkWorking ? 'Assigning…' : 'Assign'}
                      </button>
                    </div>
                  )}
                  <button
                    onClick={handleBulkExport}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Export className="h-3.5 w-3.5" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => setSelected(new Set())}
                    className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <XIcon className="h-3.5 w-3.5" /> Clear
                  </button>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id} className="text-left text-xs text-muted-foreground">
                      <th className="w-10 px-4 py-3">
                        <input
                          type="checkbox"
                          className="rounded border-border accent-primary"
                          checked={table.getRowModel().rows.length > 0 && table.getRowModel().rows.every((r) => selected.has(r.original.id))}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      {hg.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 font-medium select-none"
                          style={{ width: header.getSize() }}
                        >
                          {header.isPlaceholder ? null : (
                            <button
                              className={`flex items-center gap-1 ${header.column.getCanSort() ? 'cursor-pointer hover:text-foreground' : ''}`}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getCanSort() && (
                                <SortIcon state={header.column.getIsSorted()} />
                              )}
                            </button>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-border">
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-muted/20 transition-colors cursor-pointer ${selected.has(row.original.id) ? 'bg-primary/5' : ''}`}
                    >
                      <td className="px-4 py-3" onClick={(e) => { e.stopPropagation(); toggleSelect(row.original.id); }}>
                        <input
                          type="checkbox"
                          className="rounded border-border accent-primary"
                          checked={selected.has(row.original.id)}
                          onChange={() => toggleSelect(row.original.id)}
                        />
                      </td>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3" onClick={() => router.push('/caseload/' + row.original.id)}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Showing {table.getRowModel().rows.length} of {filtered.length} engagements
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs text-muted-foreground">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
