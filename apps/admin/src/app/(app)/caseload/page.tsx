'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Skeleton } from '@mjn/ui';
import {
  MagnifyingGlass, CaretUp, CaretDown, CaretUpDown, Plus,
  Rows, Kanban, CalendarBlank,
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

function statusLabel(s: string) {
  return s?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? '—';
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
  col.accessor('consultantId', {
    header: 'Consultant',
    cell: (info) => <span className="text-xs text-muted-foreground">{info.getValue() ?? '—'}</span>,
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
];

function SortIcon({ state }: { state: false | 'asc' | 'desc' }) {
  if (state === 'asc') return <CaretUp className="h-3 w-3" />;
  if (state === 'desc') return <CaretDown className="h-3 w-3" />;
  return <CaretUpDown className="h-3 w-3 text-muted-foreground/40" />;
}

const KANBAN_COLUMNS = [
  { key: 'PENDING_SIGNATURE', label: 'Pending Signature', dot: 'bg-amber-400', bg: 'bg-amber-50', header: 'border-b-2 border-amber-300' },
  { key: 'ACTIVE',            label: 'Active',            dot: 'bg-emerald-500', bg: 'bg-emerald-50', header: 'border-b-2 border-emerald-400' },
  { key: 'ON_HOLD',           label: 'On Hold',           dot: 'bg-orange-400', bg: 'bg-orange-50', header: 'border-b-2 border-orange-300' },
  { key: 'COMPLETED',         label: 'Completed',         dot: 'bg-blue-500', bg: 'bg-blue-50', header: 'border-b-2 border-blue-400' },
  { key: 'TERMINATED',        label: 'Terminated',        dot: 'bg-rose-500', bg: 'bg-rose-50', header: 'border-b-2 border-rose-400' },
];

function KanbanCard({ eng, onClick }: { eng: Engagement; onClick: () => void }) {
  const initials = (eng.person?.name ?? '??').slice(0, 2).toUpperCase();
  const shortId = eng.id.slice(0, 8).toUpperCase();
  const created = eng.createdAt
    ? new Date(eng.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-xl border border-border bg-white p-3.5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
    >
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground leading-tight">
            {eng.person?.name ?? '—'}
          </p>
          <p className="truncate text-[11px] text-muted-foreground mt-0.5">
            {eng.person?.email ?? shortId}
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {eng.person?.profession && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
            {eng.person.profession}
          </span>
        )}
        <span className="rounded-full bg-muted/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
          #{shortId}
        </span>
      </div>

      {created && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
          <CalendarBlank className="h-3 w-3" />
          {created}
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

  return (
    <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 400 }}>
      {KANBAN_COLUMNS.map((col) => {
        const cards = byStatus[col.key] ?? [];
        return (
          <div key={col.key} className="flex w-72 shrink-0 flex-col rounded-2xl border border-border bg-muted/30 overflow-hidden">
            {/* Column header */}
            <div className={`flex items-center justify-between px-4 py-3 bg-white ${col.header}`}>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                <span className="text-sm font-semibold text-foreground">{col.label}</span>
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                {cards.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-1 flex-col gap-2 p-3">
              {cards.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-border py-8">
                  <p className="text-xs text-muted-foreground">No cases</p>
                </div>
              ) : (
                cards.map((eng) => (
                  <KanbanCard key={eng.id} eng={eng} onClick={() => onCardClick(eng.id)} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CaseloadPage() {
  const router = useRouter();
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [view, setView] = useState<'table' | 'kanban'>('table');

  useEffect(() => {
    api.getAllEngagements()
      .then(setEngagements)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => statusFilter === 'ALL' ? engagements : engagements.filter((e) => e.status === statusFilter),
    [engagements, statusFilter],
  );

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

  return (
    <div className="space-y-5">
        <PageHeader
          title="Caseload"
          subtitle={`${engagements.length} total engagements`}
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
          {view === 'table' && (
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id} className="text-left text-xs text-muted-foreground">
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
                    <tr key={row.id} onClick={() => router.push('/caseload/' + row.original.id)} className="hover:bg-muted/20 transition-colors cursor-pointer">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3">
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
