'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader, Skeleton } from '@mjn/ui';
import {
  MagnifyingGlass, Plus, Rows, Kanban, CheckSquare, Export, UserPlus, CaretLeft, CaretRight,
  CheckCircle, X as XIcon,
} from '@mjn/ui';
import { api } from '../../../lib/api';
import { useAdmin } from '../../../contexts/admin-context';

// ── Types and helpers ─────────────────────────────────────────────────────────

type Need = { key: string; label: string; side: 'us' | 'client' };
type CaseRow = {
  id: string;
  personId: string;
  status: string;
  createdAt: string;
  person: { name?: string | null; email?: string | null; profession?: string | null } | null;
  consultantId: string | null;
  consultantName: string | null;
  officerName: string | null;
  stage: { done: number; total: number; current: string | null };
  needs: Need[];
  lane: 'us' | 'client' | 'progress' | 'hold' | 'closed';
  quiet: boolean;
  lastActivityAt: string;
};
type Overview = {
  items: CaseRow[]; total: number; page: number; pageSize: number;
  counts: { all: number; attention: number; unassigned: number; signature: number; hold: number };
  consultants: { id: string; name: string }[];
};

const STATUS: Record<string, { label: string; dot: string }> = {
  PENDING_SIGNATURE: { label: 'Awaiting signature', dot: 'bg-accent' },
  ACTIVE:            { label: 'Active',             dot: 'bg-secondary' },
  ON_HOLD:           { label: 'On hold',            dot: 'bg-muted-foreground/50' },
  COMPLETED:         { label: 'Completed',          dot: 'bg-primary' },
  TERMINATED:        { label: 'Terminated',         dot: 'bg-rose-500' },
};

const CHIPS: { key: string; label: string; count: keyof Overview['counts'] }[] = [
  { key: 'attention', label: 'Needs attention', count: 'attention' },
  { key: 'unassigned', label: 'Unassigned', count: 'unassigned' },
  { key: 'signature', label: 'Awaiting signature', count: 'signature' },
  { key: 'hold', label: 'On hold', count: 'hold' },
  { key: 'all', label: 'All', count: 'all' },
];

const LANES: { key: CaseRow['lane']; label: string; hint: string }[] = [
  { key: 'us', label: 'Waiting on us', hint: 'Your team’s work' },
  { key: 'client', label: 'Waiting on client', hint: 'Chase if it goes quiet' },
  { key: 'progress', label: 'In progress', hint: 'Nothing blocking' },
  { key: 'hold', label: 'On hold', hint: 'Paused' },
];

// Which part of the case a "needs" chip opens.
const NEED_TAB: Record<string, string> = {
  documents: 'documents', replace: 'documents', message: 'messages', payment: 'payments', escalation: 'activity',
};

const PAGE_SIZE = 25;

function ago(date: string) {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 60) return `${days} days ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function title(s?: string | null) {
  return (s ?? '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function StageBar({ stage }: { stage: CaseRow['stage'] }) {
  if (stage.total === 0) return <p className="text-xs text-muted-foreground">No stages set up</p>;
  const pct = Math.round((stage.done / stage.total) * 100);
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full gradient-hero" style={{ width: `${pct}%` }} />
        </div>
        <span className="whitespace-nowrap text-xs font-semibold text-foreground">{stage.done} of {stage.total}</span>
      </div>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{stage.current ?? 'All stages complete'}</p>
    </div>
  );
}

function Needs({ row, onOpen }: { row: CaseRow; onOpen: (tab?: string) => void }) {
  if (row.needs.length === 0) {
    return <span className="text-xs text-muted-foreground">{row.lane === 'closed' ? '—' : 'Nothing waiting'}</span>;
  }
  return (
    <div className="flex flex-col items-start gap-1">
      {row.needs.slice(0, 3).map((n) => (
        <button
          key={n.key + n.label}
          onClick={(e) => { e.stopPropagation(); onOpen(NEED_TAB[n.key]); }}
          className="inline-flex items-center gap-1.5 text-left text-xs font-semibold text-foreground hover:text-primary hover:underline"
          title={n.side === 'us' ? 'Waiting on your team' : 'Waiting on the client'}
        >
          <span className={`h-2 w-2 shrink-0 rounded-full ${n.side === 'us' ? 'bg-accent' : 'bg-primary/40'}`} />
          {n.label}
        </button>
      ))}
      {row.needs.length > 3 && <span className="text-xs text-muted-foreground">+{row.needs.length - 3} more</span>}
    </div>
  );
}

function Activity({ row }: { row: CaseRow }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-foreground" title={row.quiet ? 'No recorded activity for a while' : undefined}>
        {row.quiet && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />}
        {ago(row.lastActivityAt)}
      </p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{row.consultantName ?? 'Unassigned'}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CaseloadPage() {
  const router = useRouter();
  const { me } = useAdmin();
  const isConsultant = (me?.role as string)?.toUpperCase() === 'CONSULTANT';

  const [view, setView] = useState<'list' | 'board'>('list');
  const [chip, setChip] = useState('attention');
  const [status, setStatus] = useState('');
  const [consultant, setConsultant] = useState('');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [profiles, setProfiles] = useState<any[]>([]);
  const [bulkAssignId, setBulkAssignId] = useState('');
  const [bulkWorking, setBulkWorking] = useState(false);

  useEffect(() => {
    try { if (localStorage.getItem('mjn_caseload_view') === 'board') setView('board'); } catch { /* ignore */ }
  }, []);
  useEffect(() => { const t = setTimeout(() => setQ(search), 300); return () => clearTimeout(t); }, [search]);
  useEffect(() => { setPage(1); }, [chip, status, consultant, q, view]);
  useEffect(() => {
    if (!isConsultant) api.getConsultants(true).then((list) => setProfiles(list ?? [])).catch(() => {});
  }, [isConsultant]);

  const load = useCallback(() => {
    setLoading(true);
    api.getCaseloadOverview(
      view === 'board'
        ? { view: 'board', consultant, q }
        : { chip, status, consultant, q, page, pageSize: PAGE_SIZE },
    )
      .then(setData)
      .catch((e: any) => toast.error(e.message ?? 'Could not load the caseload.'))
      .finally(() => setLoading(false));
  }, [view, chip, status, consultant, q, page]);

  useEffect(() => { load(); }, [load]);

  function changeView(next: 'list' | 'board') {
    setView(next);
    try { localStorage.setItem('mjn_caseload_view', next); } catch { /* ignore */ }
  }

  const open = (id: string, tab?: string) => router.push(`/caseload/${id}${tab ? `?tab=${tab}` : ''}`);

  const rows = data?.items ?? [];
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  function toggle(id: string) {
    setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }
  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) rows.forEach((r) => next.delete(r.id)); else rows.forEach((r) => next.add(r.id));
      return next;
    });
  }

  async function bulkAssign() {
    if (!bulkAssignId || selected.size === 0) return;
    setBulkWorking(true);
    try {
      await Promise.all([...selected].map((id) => api.assignConsultant(id, bulkAssignId)));
      toast.success(`${selected.size} case${selected.size !== 1 ? 's' : ''} assigned.`);
      setSelected(new Set()); setBulkAssignId('');
      load();
    } catch (e: any) {
      toast.error(e.message ?? 'Could not assign.');
    } finally {
      setBulkWorking(false);
    }
  }

  function exportCsv() {
    const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [
      ['Case', 'Client', 'Email', 'Profession', 'Status', 'Stage', 'Waiting on', 'Consultant', 'Last activity'].map(cell).join(','),
      ...rows.filter((r) => selected.has(r.id)).map((r) => [
        r.id, r.person?.name, r.person?.email, r.person?.profession, STATUS[r.status]?.label ?? r.status,
        r.stage.total ? `${r.stage.done} of ${r.stage.total}${r.stage.current ? ` - ${r.stage.current}` : ''}` : '',
        r.needs.map((n) => n.label).join('; '), r.consultantName, new Date(r.lastActivityAt).toISOString().slice(0, 10),
      ].map(cell).join(',')),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `caseload-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setSelected(new Set());
  }

  const counts = data?.counts;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const filtering = !!(q || status || consultant);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Caseload"
        subtitle={counts
          ? `${counts.all} case${counts.all !== 1 ? 's' : ''} · ${counts.attention} need attention · ${counts.unassigned} unassigned`
          : 'Loading cases…'}
        actions={
          <button
            onClick={() => router.push('/caseload/new')}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> New engagement
          </button>
        }
      />

      {/* Quick filters */}
      {view === 'list' && (
        <div data-tour="caseload-chips" className="flex flex-wrap gap-1.5">
          {CHIPS.map((c) => (
            <button
              key={c.key}
              onClick={() => setChip(c.key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${chip === c.key ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-white text-muted-foreground hover:text-foreground'}`}
            >
              {c.label}
              {counts && <span className="ml-1.5 tabular-nums opacity-70">{counts[c.count]}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Search, filters, view */}
      <div data-tour="caseload-filters" className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="caseload-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search client or case reference"
            className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        {!isConsultant && (
          <select id="caseload-consultant" value={consultant} onChange={(e) => setConsultant(e.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary">
            <option value="">All consultants</option>
            <option value="UNASSIGNED">Unassigned</option>
            {(data?.consultants ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        {view === 'list' && (
          <select id="caseload-status" value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary">
            <option value="">All statuses</option>
            {Object.entries(STATUS).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
          </select>
        )}
        <div className="flex overflow-hidden rounded-xl border border-border bg-white">
          {([['list', 'List', Rows], ['board', 'Board', Kanban]] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => changeView(key)}
              className={`flex h-10 items-center gap-1.5 px-3 text-sm font-semibold transition-colors ${view === key ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
            >
              <Icon className="h-4 w-4" /> <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : view === 'board' ? (
        /* ── Board: grouped by who the case is waiting on ── */
        <div data-tour="caseload-table" className={`flex gap-3 overflow-x-auto pb-3 ${loading ? 'opacity-60' : ''}`}>
          {LANES.map((lane) => {
            const cards = rows.filter((r) => r.lane === lane.key);
            return (
              <div key={lane.key} className="flex w-[270px] shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-muted/30">
                <div className="border-b border-border bg-white px-4 py-3">
                  <p className="flex items-center justify-between text-sm font-bold text-foreground">
                    {lane.label}
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold tabular-nums text-muted-foreground">{cards.length}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{lane.hint}</p>
                </div>
                <div className="flex max-h-[62vh] flex-col gap-2 overflow-y-auto p-2.5">
                  {cards.length === 0 && <p className="py-8 text-center text-xs text-muted-foreground">No cases</p>}
                  {cards.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => open(r.id)}
                      className="cursor-pointer rounded-xl border border-border bg-white p-3 transition-shadow hover:shadow-md"
                    >
                      <p className="truncate text-sm font-bold text-foreground">{r.person?.name ?? 'Unknown client'}</p>
                      <p className="mb-2 truncate text-xs text-muted-foreground">{title(r.person?.profession) || 'Profession not set'}</p>
                      <StageBar stage={r.stage} />
                      {r.needs.length > 0 && <div className="mt-2"><Needs row={r} onOpen={(tab) => open(r.id, tab)} /></div>}
                      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border/70 pt-2 text-xs text-muted-foreground">
                        <span className="truncate">{r.consultantName ?? 'Unassigned'}</span>
                        <span className="flex shrink-0 items-center gap-1.5 font-semibold text-foreground">
                          {r.quiet && <span className="h-2 w-2 rounded-full bg-accent" />}{ago(r.lastActivityAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center">
          {chip === 'attention' && !filtering ? (
            <>
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                <CheckCircle className="h-6 w-6 text-secondary" weight="fill" />
              </div>
              <h3 className="font-bold text-foreground">Nothing needs attention</h3>
              <p className="mt-1 text-sm text-muted-foreground">Every open case is moving and has nothing waiting.</p>
              <button onClick={() => setChip('all')} className="mt-4 text-sm font-bold text-primary hover:underline">Show all cases</button>
            </>
          ) : (
            <>
              <h3 className="font-bold text-foreground">No cases match</h3>
              <p className="mt-1 text-sm text-muted-foreground">Try a different filter or search.</p>
            </>
          )}
        </div>
      ) : (
        /* ── List ── */
        <div data-tour="caseload-table" className="overflow-hidden rounded-2xl border border-border bg-white">
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 border-b border-border bg-primary/5 px-4 py-2.5">
              <span className="flex items-center gap-2 text-sm font-bold text-primary"><CheckSquare className="h-4 w-4" /> {selected.size} selected</span>
              {!isConsultant && (
                <span className="flex items-center gap-2">
                  <select id="bulk-consultant" value={bulkAssignId} onChange={(e) => setBulkAssignId(e.target.value)} className="h-8 rounded-lg border border-border bg-white px-2 text-xs outline-none focus:border-primary">
                    <option value="">Assign consultant…</option>
                    {profiles.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button onClick={bulkAssign} disabled={!bulkAssignId || bulkWorking} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-40">
                    <UserPlus className="h-3.5 w-3.5" /> {bulkWorking ? 'Assigning…' : 'Assign'}
                  </button>
                </span>
              )}
              <button onClick={exportCsv} className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted/50">
                <Export className="h-3.5 w-3.5" /> Export CSV
              </button>
              <button onClick={() => setSelected(new Set())} className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <XIcon className="h-3.5 w-3.5" /> Clear
              </button>
            </div>
          )}

          <div className={`overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[46rem] text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr className="text-left text-xs font-semibold text-muted-foreground">
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" aria-label="Select all on this page" className="rounded border-border accent-primary" checked={allSelected} onChange={toggleAll} />
                  </th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Needs</th>
                  <th className="px-4 py-3">Last activity</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => open(r.id)} className={`cursor-pointer align-top transition-colors hover:bg-muted/30 ${selected.has(r.id) ? 'bg-primary/5' : ''}`}>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" aria-label={`Select ${r.person?.name ?? 'case'}`} className="rounded border-border accent-primary" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-foreground">{r.person?.name ?? 'Unknown client'}</p>
                      <p className="text-xs text-muted-foreground">{title(r.person?.profession) || r.person?.email || '—'}</p>
                    </td>
                    <td className="px-4 py-3.5"><StageBar stage={r.stage} /></td>
                    <td className="px-4 py-3.5"><Needs row={r} onOpen={(tab) => open(r.id, tab)} /></td>
                    <td className="px-4 py-3.5"><Activity row={r} /></td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-foreground">
                        <span className={`h-2 w-2 rounded-full ${STATUS[r.status]?.dot ?? 'bg-muted-foreground/40'}`} />
                        {STATUS[r.status]?.label ?? title(r.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
            <span>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data?.total ?? 0)} of {data?.total ?? 0}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} aria-label="Previous page" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-30"><CaretLeft className="h-4 w-4" /></button>
              <span className="px-1 font-semibold text-foreground">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} aria-label="Next page" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-30"><CaretRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
