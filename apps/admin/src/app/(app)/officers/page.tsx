'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Skeleton } from '@mjn/ui';
import { MagnifyingGlass, Plus, X, CaretDown, DotsThree, CircleNotch, CheckCircle } from '@mjn/ui';
import { api } from '../../../lib/api';

// ── Types and helpers ─────────────────────────────────────────────────────────

type Officer = { id: string; name: string | null; email: string | null; isActive?: boolean; isAvailable?: boolean };
type CaseRow = {
  id: string;
  status: string;
  person: { name?: string | null } | null;
  officerId: string | null;
  stage: { done: number; total: number; current: string | null };
  needs: { key: string; label: string; side: 'us' | 'client' }[];
  lane: string;
  quiet: boolean;
  lastActivityAt: string;
};
type Load = { open: number; waiting: number; quiet: number; cases: CaseRow[] };

const OPEN = ['ACTIVE', 'PENDING_SIGNATURE', 'ON_HOLD'];

function ago(date: string) {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days`;
}
function stageText(s: CaseRow['stage']) {
  if (s.total === 0) return 'No stages';
  return `${s.done} of ${s.total}${s.current ? ` · ${s.current}` : ''}`;
}

const btnPrimary = 'inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-40';
const btnOutline = 'inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted/60 disabled:opacity-40';
const field = 'w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';
const label = 'mb-1.5 block text-xs font-bold text-foreground';

function Dot({ className }: { className: string }) {
  return <span className={`h-2 w-2 shrink-0 rounded-full ${className}`} />;
}

function Modal({ title, sub, onClose, children, wide }: { title: string; sub?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`flex max-h-[90vh] w-full ${wide ? 'max-w-2xl' : 'max-w-md'} flex-col rounded-2xl border border-border bg-white shadow-xl`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 px-6 pb-4 pt-6">
          <div>
            <h2 className="text-base font-bold text-foreground">{title}</h2>
            {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="min-h-0 overflow-y-auto px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OfficersPage() {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [menuAt, setMenuAt] = useState({ top: 0, right: 0 });
  const [busy, setBusy] = useState('');

  // Panels and dialogs
  const [panelId, setPanelId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [moveTo, setMoveTo] = useState('');
  const [moveNote, setMoveNote] = useState('');
  const [dialog, setDialog] = useState<null | 'add' | 'edit' | 'password' | 'unavailable' | 'deactivate' | 'assign'>(null);
  const [target, setTarget] = useState<Officer | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [absence, setAbsence] = useState<'keep' | 'move' | 'release'>('keep');
  const [absenceTo, setAbsenceTo] = useState('');
  const [plan, setPlan] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [o, c] = await Promise.allSettled([api.listOfficers(), api.getCaseloadOverview({ view: 'board' })]);
    if (o.status === 'fulfilled') setOfficers(o.value ?? []); else toast.error('Could not load officers.');
    if (c.status === 'fulfilled') setCases((c.value.items ?? []) as CaseRow[]); else toast.error('Could not load cases.');
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const active = useMemo(() => officers.filter((o) => o.isActive !== false), [officers]);
  const inactive = useMemo(() => officers.filter((o) => o.isActive === false), [officers]);
  const assignable = useMemo(() => active.filter((o) => o.isAvailable !== false), [active]);

  const loads = useMemo(() => {
    const map = new Map<string, Load>();
    for (const o of officers) map.set(o.id, { open: 0, waiting: 0, quiet: 0, cases: [] });
    for (const c of cases) {
      if (!c.officerId || !OPEN.includes(c.status)) continue;
      const l = map.get(c.officerId);
      if (!l) continue;
      l.open += 1;
      if (c.lane === 'us') l.waiting += 1;
      if (c.quiet) l.quiet += 1;
      l.cases.push(c);
    }
    return map;
  }, [officers, cases]);

  const loadOf = (id: string): Load => loads.get(id) ?? { open: 0, waiting: 0, quiet: 0, cases: [] };
  const busiest = Math.max(1, ...active.map((o) => loadOf(o.id).open));
  const unassigned = useMemo(() => cases.filter((c) => !c.officerId && (c.status === 'ACTIVE' || c.status === 'PENDING_SIGNATURE')), [cases]);
  const openTotal = active.reduce((sum, o) => sum + loadOf(o.id).open, 0);

  const shown = active.filter((o) => {
    const q = search.trim().toLowerCase();
    return !q || (o.name ?? '').toLowerCase().includes(q) || (o.email ?? '').toLowerCase().includes(q);
  });

  const menuOfficer = menuFor ? officers.find((o) => o.id === menuFor) ?? null : null;
  const panelOfficer = panelId ? officers.find((o) => o.id === panelId) ?? null : null;
  const panelCases = panelOfficer ? loadOf(panelOfficer.id).cases : [];

  async function run(key: string, action: () => Promise<any>, done: string) {
    setBusy(key);
    try {
      await action();
      toast.success(done);
      await load();
      return true;
    } catch (e: any) {
      toast.error(e.message ?? 'That did not work. Please try again.');
      return false;
    } finally {
      setBusy('');
    }
  }

  const close = () => { setDialog(null); setTarget(null); };

  function open(kind: NonNullable<typeof dialog>, officer?: Officer) {
    setMenuFor(null);
    setTarget(officer ?? null);
    setForm({ name: officer?.name ?? '', email: officer?.email ?? '', password: '' });
    setAbsence('keep'); setAbsenceTo('');
    setDialog(kind);
  }

  // Suggest the least-loaded available officer for each unassigned case.
  function openAssign() {
    const counts = new Map(assignable.map((o) => [o.id, loadOf(o.id).open]));
    const next: Record<string, string> = {};
    for (const c of unassigned) {
      let best = '';
      for (const o of assignable) if (!best || (counts.get(o.id) ?? 0) < (counts.get(best) ?? 0)) best = o.id;
      next[c.id] = best;
      if (best) counts.set(best, (counts.get(best) ?? 0) + 1);
    }
    setPlan(next);
    setMenuFor(null);
    setDialog('assign');
  }

  // Each officer's count once the current plan is applied, shown beside their name.
  const planned = useMemo(() => {
    const counts = new Map(assignable.map((o) => [o.id, loadOf(o.id).open]));
    Object.values(plan).forEach((id) => { if (id) counts.set(id, (counts.get(id) ?? 0) + 1); });
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, assignable, loads]);

  async function saveAssign() {
    const groups = new Map<string, string[]>();
    Object.entries(plan).forEach(([caseId, officerId]) => { if (officerId) groups.set(officerId, [...(groups.get(officerId) ?? []), caseId]); });
    const count = [...groups.values()].reduce((n, ids) => n + ids.length, 0);
    if (count === 0) return;
    if (await run('assign', async () => { for (const [officerId, ids] of groups) await api.reassignCases(ids, officerId); }, `${count} case${count !== 1 ? 's' : ''} assigned.`)) close();
  }

  async function moveSelected(toOfficer: string | null) {
    const ids = [...selected];
    if (ids.length === 0) return;
    const text = toOfficer ? `${ids.length} case${ids.length !== 1 ? 's' : ''} moved.` : `Officer removed from ${ids.length} case${ids.length !== 1 ? 's' : ''}.`;
    if (await run('move', () => api.reassignCases(ids, toOfficer, moveNote.trim() || undefined), text)) { setSelected(new Set()); setMoveTo(''); setMoveNote(''); }
  }

  async function saveOfficer() {
    if (dialog === 'add') {
      if (await run('save', () => api.createOfficer({ name: form.name.trim(), email: form.email.trim(), password: form.password }), 'Officer account created.')) close();
    } else if (target) {
      if (await run('save', () => api.updateOfficer(target.id, { name: form.name.trim(), email: form.email.trim() }), 'Details updated.')) close();
    }
  }
  async function resetPassword() {
    if (target && await run('save', () => api.updateStaffCredentials(target.id, { password: form.password }), 'Password reset. Share the new password with the officer securely.')) close();
  }
  async function markUnavailable() {
    if (!target) return;
    const n = loadOf(target.id).open;
    const done = absence === 'keep' ? `${target.name} is unavailable and keeps ${n} case${n !== 1 ? 's' : ''}.`
      : absence === 'move' ? `${target.name} is unavailable. ${n} case${n !== 1 ? 's' : ''} moved.`
      : `${target.name} is unavailable. ${n} case${n !== 1 ? 's' : ''} now have no officer.`;
    if (await run('save', () => api.setOfficerAvailability(target.id, false, absence === 'move' ? absenceTo : null, absence === 'keep'), done)) close();
  }
  async function markAvailable(officer: Officer) {
    setMenuFor(null);
    await run('avail', () => api.setOfficerAvailability(officer.id, true), `${officer.name} is available again.`);
  }
  async function deactivate() {
    if (target && await run('save', () => api.deactivateOfficer(target.id), `${target.name} deactivated.`)) { close(); setPanelId(null); }
  }
  async function reactivate(officer: Officer) {
    await run('react' + officer.id, () => api.reactivateOfficer(officer.id), `${officer.name} reactivated.`);
  }

  const officerOptions = (excludeId?: string, counts?: Map<string, number>) =>
    [...assignable].filter((o) => o.id !== excludeId)
      .sort((a, b) => loadOf(a.id).open - loadOf(b.id).open)
      .map((o) => <option key={o.id} value={o.id}>{o.name ?? o.email} · {counts?.get(o.id) ?? loadOf(o.id).open} case{(counts?.get(o.id) ?? loadOf(o.id).open) !== 1 ? 's' : ''}</option>);

  const emailOk = /^\S+@\S+\.\S+$/.test(form.email.trim());

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 data-tour="page-title" className="text-2xl font-bold tracking-tight text-foreground">Processing Officers</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {loading ? 'Loading…' : `${active.length} officer${active.length !== 1 ? 's' : ''} · ${assignable.length} available · ${openTotal} open case${openTotal !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={() => open('add')} className={btnPrimary}><Plus className="h-4 w-4" /> Add officer</button>
      </div>

      {/* Unassigned cases */}
      {!loading && unassigned.length > 0 && (
        <div data-tour="officers-banner" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white px-5 py-3.5">
          <p className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
            <Dot className="bg-accent" /> {unassigned.length} open case{unassigned.length !== 1 ? 's have' : ' has'} no officer.
          </p>
          <button onClick={openAssign} disabled={assignable.length === 0} className={btnPrimary} title={assignable.length === 0 ? 'No officer is available' : undefined}>Assign cases</button>
        </div>
      )}

      <div className="relative max-w-xs">
        <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input id="officer-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search officer" className={`${field} pl-9`} />
      </div>

      {/* Workload table */}
      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center">
          <h3 className="font-bold text-foreground">{search ? 'No officer matches that search' : 'No processing officers yet'}</h3>
          {!search && <p className="mt-1 text-sm text-muted-foreground">Add your first officer to start assigning cases.</p>}
        </div>
      ) : (
        <div data-tour="officers-grid" className="rounded-2xl border border-border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Officer</th>
                  <th className="px-4 py-3">Availability</th>
                  <th className="px-4 py-3">Open cases</th>
                  <th className="px-4 py-3" title="Cases where something is waiting on your team">Waiting</th>
                  <th className="px-4 py-3" title="Cases with no recorded activity for too long">Quiet</th>
                  <th className="w-12 px-2 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {shown.map((o) => {
                  const l = loadOf(o.id);
                  const available = o.isAvailable !== false;
                  return (
                    <tr key={o.id} onClick={() => { setPanelId(o.id); setSelected(new Set()); setMoveTo(''); setMoveNote(''); }} className="cursor-pointer transition-colors hover:bg-muted/30">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-foreground">{o.name ?? 'Unnamed officer'}</p>
                        <p className="text-xs text-muted-foreground">{o.email}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-foreground">
                          <Dot className={available ? 'bg-secondary' : 'border border-muted-foreground/60'} /> {available ? 'Available' : 'Unavailable'}
                        </span>
                        {!available && l.open > 0 && <p className="mt-0.5 text-xs text-muted-foreground">keeping their cases</p>}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-2 w-28 shrink-0 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full gradient-hero" style={{ width: `${(l.open / busiest) * 100}%` }} />
                          </div>
                          <span className="text-sm font-bold tabular-nums text-foreground">{l.open}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm font-semibold tabular-nums text-foreground">{l.waiting}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums text-foreground">
                          {l.quiet > 0 && <Dot className="bg-accent" />}{l.quiet}
                        </span>
                      </td>
                      <td className="px-2 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            const r = e.currentTarget.getBoundingClientRect();
                            setMenuAt({ top: r.bottom + 4, right: window.innerWidth - r.right });
                            setMenuFor(menuFor === o.id ? null : o.id);
                          }}
                          aria-label={`Actions for ${o.name ?? 'officer'}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <DotsThree className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Row menu: placed on the page itself so the table's scroll area cannot clip it */}
      {menuOfficer && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenuFor(null)} />
          <div className="fixed z-40 w-48 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-xl" style={{ top: menuAt.top, right: menuAt.right }}>
            {([
              ['View cases', () => { setMenuFor(null); setPanelId(menuOfficer.id); setSelected(new Set()); }],
              ['Edit details', () => open('edit', menuOfficer)],
              ['Reset password', () => open('password', menuOfficer)],
              [menuOfficer.isAvailable !== false ? 'Mark unavailable' : 'Mark available', () => (menuOfficer.isAvailable !== false ? open('unavailable', menuOfficer) : markAvailable(menuOfficer))],
              ['Deactivate', () => open('deactivate', menuOfficer)],
            ] as [string, () => void][]).map(([text, action]) => (
              <button key={text} onClick={action} className="block w-full px-3.5 py-2 text-left text-sm text-foreground hover:bg-muted/60">{text}</button>
            ))}
          </div>
        </>
      )}

      {/* Deactivated officers */}
      {inactive.length > 0 && (
        <div>
          <button onClick={() => setShowInactive((v) => !v)} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <CaretDown className={`h-4 w-4 transition-transform ${showInactive ? '' : '-rotate-90'}`} /> Deactivated officers ({inactive.length})
          </button>
          {showInactive && (
            <div className="mt-2 divide-y divide-border/70 rounded-2xl border border-border bg-white">
              {inactive.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{o.name ?? 'Unnamed officer'}</p>
                    <p className="truncate text-xs text-muted-foreground">{o.email} · cannot log in</p>
                  </div>
                  <button onClick={() => reactivate(o)} disabled={busy === 'react' + o.id} className={btnOutline}>Reactivate</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── An officer's cases ── */}
      {panelOfficer && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="flex-1 bg-black/30" onClick={() => setPanelId(null)} />
          <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
            <div className="border-b border-border px-6 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-foreground">{panelOfficer.name ?? 'Officer'}</h2>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    <span className="truncate">{panelOfficer.email}</span>
                    <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                      <Dot className={panelOfficer.isAvailable !== false ? 'bg-secondary' : 'border border-muted-foreground/60'} />
                      {panelOfficer.isAvailable !== false ? 'Available' : 'Unavailable'}
                    </span>
                    <span>{panelCases.length} open case{panelCases.length !== 1 ? 's' : ''}</span>
                  </p>
                </div>
                <button onClick={() => setPanelId(null)} aria-label="Close" className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {panelOfficer.isAvailable !== false
                  ? <button onClick={() => open('unavailable', panelOfficer)} className={btnOutline}>Mark unavailable</button>
                  : <button onClick={() => markAvailable(panelOfficer)} disabled={busy === 'avail'} className={btnOutline}>Mark available</button>}
                <button onClick={() => open('edit', panelOfficer)} className={btnOutline}>Edit details</button>
                <button onClick={() => open('password', panelOfficer)} className={btnOutline}>Reset password</button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {panelCases.length === 0 ? (
                <p className="p-10 text-center text-sm text-muted-foreground">This officer has no open cases.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 border-b border-border bg-muted/60 text-left text-xs font-semibold text-muted-foreground backdrop-blur">
                    <tr>
                      <th className="w-10 px-4 py-2.5">
                        <input type="checkbox" aria-label="Select all cases" className="rounded border-border accent-primary" checked={panelCases.every((c) => selected.has(c.id))} onChange={() => setSelected((prev) => (panelCases.every((c) => prev.has(c.id)) ? new Set() : new Set(panelCases.map((c) => c.id))))} />
                      </th>
                      <th className="px-2 py-2.5">Client</th><th className="px-3 py-2.5">Stage</th><th className="px-3 py-2.5">Needs</th><th className="px-3 py-2.5">Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {panelCases.map((c) => (
                      <tr key={c.id} className={selected.has(c.id) ? 'bg-primary/5' : ''}>
                        <td className="px-4 py-3">
                          <input type="checkbox" aria-label={`Select ${c.person?.name ?? 'case'}`} className="rounded border-border accent-primary" checked={selected.has(c.id)} onChange={() => setSelected((prev) => { const next = new Set(prev); if (next.has(c.id)) next.delete(c.id); else next.add(c.id); return next; })} />
                        </td>
                        <td className="px-2 py-3"><Link href={`/caseload/${c.id}`} className="font-semibold text-foreground hover:text-primary hover:underline">{c.person?.name ?? 'Unknown client'}</Link></td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">{stageText(c.stage)}</td>
                        <td className="px-3 py-3 text-xs">
                          {c.needs.length === 0 ? <span className="text-muted-foreground">Nothing waiting</span> : (
                            <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                              <Dot className={c.needs[0].side === 'us' ? 'bg-accent' : 'bg-primary/40'} /> {c.needs[0].label}{c.needs.length > 1 ? ` +${c.needs.length - 1}` : ''}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs"><span className="inline-flex items-center gap-1.5 whitespace-nowrap font-semibold text-foreground">{c.quiet && <Dot className="bg-accent" />}{ago(c.lastActivityAt)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {selected.size > 0 && (
              <div className="space-y-2.5 border-t border-border bg-muted/30 px-6 py-4">
                <p className="text-sm font-bold text-foreground">{selected.size} selected</p>
                <div className="flex flex-wrap items-center gap-2">
                  <select id="move-to" aria-label="Move to officer" value={moveTo} onChange={(e) => setMoveTo(e.target.value)} className={`${field} max-w-[16rem]`}>
                    <option value="">Move to…</option>
                    {officerOptions(panelOfficer.id)}
                  </select>
                  <button onClick={() => moveSelected(moveTo)} disabled={!moveTo || busy === 'move'} className={btnPrimary}>{busy === 'move' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} Move</button>
                  <button onClick={() => moveSelected(null)} disabled={busy === 'move'} className={btnOutline}>Remove officer</button>
                </div>
                <input id="move-note" value={moveNote} onChange={(e) => setMoveNote(e.target.value)} placeholder="Handover note for the new officer (optional)" className={field} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Dialogs ── */}
      {(dialog === 'add' || dialog === 'edit') && (
        <Modal title={dialog === 'add' ? 'Add processing officer' : 'Edit officer details'} sub={dialog === 'add' ? 'Creates a staff login with officer access.' : target?.name ?? undefined} onClose={close}>
          <div className="space-y-4">
            <div><label htmlFor="officer-name" className={label}>Full name</label><input id="officer-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} placeholder="For example Grace Mensah" /></div>
            <div><label htmlFor="officer-email" className={label}>Email address</label><input id="officer-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} placeholder="name@mjnhealthcare.com" /></div>
            {dialog === 'add' && (
              <div>
                <label htmlFor="officer-password" className={label}>Temporary password</label>
                <input id="officer-password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={field} placeholder="At least 8 characters" />
                <p className="mt-1.5 text-xs text-muted-foreground">Share it with the officer securely and ask them to change it under Settings after their first login.</p>
              </div>
            )}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={close} className={btnOutline}>Cancel</button>
            <button onClick={saveOfficer} disabled={busy === 'save' || !form.name.trim() || !emailOk || (dialog === 'add' && form.password.length < 8)} className={btnPrimary}>
              {busy === 'save' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} {dialog === 'add' ? 'Create officer' : 'Save changes'}
            </button>
          </div>
        </Modal>
      )}

      {dialog === 'password' && target && (
        <Modal title="Reset password" sub={target.name ?? undefined} onClose={close}>
          <label htmlFor="new-password" className={label}>New password</label>
          <input id="new-password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={field} placeholder="At least 8 characters" />
          <p className="mt-1.5 text-xs text-muted-foreground">The officer is not emailed. Share the new password securely and ask them to change it under Settings.</p>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={close} className={btnOutline}>Cancel</button>
            <button onClick={resetPassword} disabled={busy === 'save' || form.password.length < 8} className={btnPrimary}>Reset password</button>
          </div>
        </Modal>
      )}

      {dialog === 'unavailable' && target && (() => {
        const n = loadOf(target.id).open;
        const others = assignable.filter((o) => o.id !== target.id);
        return (
          <Modal title={`Mark ${target.name ?? 'officer'} unavailable`} sub={`They will not be offered new cases.${n > 0 ? ` What should happen to their ${n} open case${n !== 1 ? 's' : ''}?` : ''}`} onClose={close}>
            {n > 0 && (
              <div className="space-y-2.5">
                {([
                  ['keep', 'Keep them with this officer', 'For a short absence.'],
                  ['move', 'Move all to another officer', others.length === 0 ? 'No other officer is available.' : ''],
                  ['release', 'Leave them without an officer', 'They will appear as unassigned.'],
                ] as const).map(([key, text, hint]) => (
                  <label key={key} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${absence === key ? 'border-primary bg-primary/5' : 'border-border'} ${key === 'move' && others.length === 0 ? 'cursor-not-allowed opacity-50' : ''}`}>
                    <input type="radio" name="absence" className="mt-0.5 accent-primary" checked={absence === key} disabled={key === 'move' && others.length === 0} onChange={() => setAbsence(key)} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-foreground">{text}</span>
                      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
                      {key === 'move' && absence === 'move' && (
                        <select id="absence-to" aria-label="Move cases to" value={absenceTo} onChange={(e) => setAbsenceTo(e.target.value)} className={`${field} mt-2`}>
                          <option value="">Choose an officer…</option>
                          {officerOptions(target.id)}
                        </select>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={close} className={btnOutline}>Cancel</button>
              <button onClick={markUnavailable} disabled={busy === 'save' || (n > 0 && absence === 'move' && !absenceTo)} className={btnPrimary}>
                {busy === 'save' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} Mark unavailable
              </button>
            </div>
          </Modal>
        );
      })()}

      {dialog === 'deactivate' && target && (() => {
        const n = loadOf(target.id).open;
        return (
          <Modal title={`Deactivate ${target.name ?? 'officer'}?`} onClose={close}>
            <p className="text-sm text-muted-foreground">
              They will no longer be able to log in.
              {n > 0 ? ` Their ${n} open case${n !== 1 ? 's' : ''} will have no officer until you assign ${n !== 1 ? 'them' : 'it'}.` : ''} You can reactivate them later.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={close} className={btnOutline}>Cancel</button>
              <button onClick={deactivate} disabled={busy === 'save'} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-foreground px-3.5 py-2 text-xs font-bold text-white hover:bg-foreground/90 disabled:opacity-40">Deactivate</button>
            </div>
          </Modal>
        );
      })()}

      {dialog === 'assign' && (() => {
        const count = Object.values(plan).filter(Boolean).length;
        return (
          <Modal title={`Assign cases · ${unassigned.length} without an officer`} sub="Suggested by lightest workload. Change any before saving; nothing is assigned until you confirm." onClose={close} wide>
            {unassigned.length === 0 ? (
              <p className="flex items-center gap-2 py-6 text-sm font-semibold text-foreground"><CheckCircle className="h-4 w-4 text-secondary" weight="fill" /> Every open case has an officer.</p>
            ) : (
              <div className="divide-y divide-border/70 rounded-xl border border-border">
                {unassigned.map((c) => (
                  <div key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{c.person?.name ?? 'Unknown client'}</p>
                      <p className="truncate text-xs text-muted-foreground">{stageText(c.stage)}</p>
                    </div>
                    <select aria-label={`Officer for ${c.person?.name ?? 'case'}`} value={plan[c.id] ?? ''} onChange={(e) => setPlan((p) => ({ ...p, [c.id]: e.target.value }))} className={`${field} w-56`}>
                      <option value="">Leave unassigned</option>
                      {officerOptions(undefined, planned)}
                    </select>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={close} className={btnOutline}>Cancel</button>
              <button onClick={saveAssign} disabled={busy === 'assign' || count === 0} className={btnPrimary}>
                {busy === 'assign' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} Assign {count || ''}
              </button>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}
