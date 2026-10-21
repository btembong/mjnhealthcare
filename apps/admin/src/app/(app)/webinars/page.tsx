'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader, Skeleton } from '@mjn/ui';
import { Plus, VideoCamera, Users, ArrowRight, CalendarBlank, Play, MonitorPlay } from '@mjn/ui';
import { api } from '../../../lib/api';
import { useAdmin } from '../../../contexts/admin-context';
import { LangPill, StatusPill, WebinarForm, btnPrimary, card, heading, stage, whenLabel, type Webinar } from '../../../components/webinar-kit';

const TABS = [
  ['upcoming', 'Upcoming'],
  ['draft', 'Drafts'],
  ['over', 'Past'],
  ['cancelled', 'Cancelled'],
] as const;
type Tab = (typeof TABS)[number][0];

export default function WebinarsPage() {
  const router = useRouter();
  const { me } = useAdmin();
  const role = (me?.role as string)?.toUpperCase() ?? '';
  const [rows, setRows] = useState<Webinar[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try { setRows(await api.listWebinars()); setFailed(false); } catch { setFailed(true); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const groups = useMemo(() => {
    const g: Record<Tab, Webinar[]> = { upcoming: [], draft: [], over: [], cancelled: [] };
    for (const w of rows ?? []) {
      const s = stage(w).key;
      (s === 'live' || s === 'scheduled' ? g.upcoming : s === 'draft' ? g.draft : s === 'over' ? g.over : g.cancelled).push(w);
    }
    g.upcoming.sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt));
    g.draft.sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt));
    return g;
  }, [rows]);

  const next = groups.upcoming[0];
  const shown = groups[tab];
  const totals = useMemo(() => {
    const past = groups.over;
    const reg = past.reduce((s, w) => s + w.registered, 0);
    const came = past.reduce((s, w) => s + (w.attended ?? 0), 0);
    return { held: past.length, registered: reg, showRate: reg ? Math.round((came / reg) * 100) : 0 };
  }, [groups]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Webinars"
        subtitle="Free live sessions. Registrants become leads; replays go public after each session."
        actions={(role === 'ADMIN' || role === 'CONSULTANT') && <button onClick={() => setCreating(true)} className={btnPrimary}><Plus className="h-4 w-4" /> New webinar</button>}
      />

      {failed && !rows && <div className={`${card} p-8 text-center text-sm text-muted-foreground`}>Webinars could not be loaded. <button onClick={load} className="font-bold text-primary hover:underline">Try again</button></div>}

      {!rows && !failed ? (
        <div className="space-y-4"><Skeleton className="h-40 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>
      ) : rows && (
        <>
          {/* Next session */}
          {next ? (
            <section data-tour="web-next" className={`rise relative overflow-hidden ${card} p-6`}>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><span className={heading}>Next session</span><StatusPill w={next} /><LangPill lang={next.language} /></div>
                  <h2 className="mt-2 truncate text-xl font-bold text-foreground">{next.title}</h2>
                  <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><CalendarBlank className="h-4 w-4" /> {whenLabel(next.startAt)} Douala</span>
                    <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {next.registered} of {next.capacity} registered</span>
                  </p>
                  <div className="mt-3 h-1.5 max-w-md overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${Math.min(100, (next.registered / next.capacity) * 100)}%` }} />
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {next.hostOpen && next.hosts.some((h) => h.id === me?.id) && (
                    <Link href={`/webinars/${next.id}/host`} className={btnPrimary}><VideoCamera className="h-4 w-4" /> Enter the room</Link>
                  )}
                  <Link href={`/webinars/${next.id}`} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-muted/60">Open <ArrowRight className="h-4 w-4" /></Link>
                </div>
              </div>
            </section>
          ) : null}

          {/* Results so far */}
          {totals.held > 0 && (
            <div className="grid gap-3 sm:grid-cols-3">
              {[['Webinars held', totals.held], ['People registered', totals.registered], ['Average show-up', `${totals.showRate}%`]].map(([label, value], i) => (
                <div key={label as string} className={`rise ${card} p-4`} style={{ animationDelay: `${i * 60}ms` }}>
                  <p className={heading}>{label}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* List */}
          <div data-tour="web-list" className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {TABS.map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)} className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${tab === key ? 'border-primary bg-primary text-white' : 'border-border bg-white text-muted-foreground hover:border-primary/40'}`}>
                  {label} <span className="ml-1 opacity-70">{groups[key].length}</span>
                </button>
              ))}
            </div>

            {shown.length === 0 ? (
              <div className={`${card} px-6 py-14 text-center`}>
                <MonitorPlay className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-bold text-foreground">{tab === 'upcoming' ? 'No webinar scheduled' : tab === 'draft' ? 'No drafts' : tab === 'over' ? 'No past webinars yet' : 'Nothing cancelled'}</p>
                {tab === 'upcoming' && <p className="mt-1 text-sm text-muted-foreground">Create one and publish it: it appears on the website for registration at once.</p>}
              </div>
            ) : (
              <ul className={`${card} divide-y divide-border overflow-hidden`}>
                {shown.map((w, i) => {
                  const s = stage(w);
                  const { day, month } = { day: new Date(w.startAt).toLocaleDateString('en-GB', { timeZone: 'Africa/Douala', day: 'numeric' }), month: new Date(w.startAt).toLocaleDateString('en-GB', { timeZone: 'Africa/Douala', month: 'short' }) };
                  return (
                    <li key={w.id} className="rise" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                      <button onClick={() => router.push(`/webinars/${w.id}`)} className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-muted/30">
                        <span className="flex w-12 shrink-0 flex-col items-center rounded-xl border border-border py-1">
                          <span className="text-[11px] font-bold uppercase text-primary">{month}</span>
                          <span className="text-lg font-extrabold leading-tight text-foreground">{day}</span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2"><span className="truncate text-sm font-bold text-foreground">{w.title}</span><LangPill lang={w.language} /></span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{whenLabel(w.startAt)} · {w.durationMinutes} min · {w.hosts.map((h) => h.name).join(', ') || 'No host'}</span>
                        </span>
                        <span className="hidden w-36 shrink-0 text-right text-xs text-muted-foreground sm:block">
                          {s.key === 'over'
                            ? <><span className="font-bold text-foreground">{w.attended ?? 0}</span> of {w.registered} came{w.recordingStatus === 'READY' && <span className="mt-0.5 flex items-center justify-end gap-1 text-secondary"><Play className="h-3 w-3" weight="fill" /> Replay online</span>}</>
                            : <><span className="font-bold text-foreground">{w.registered}</span> / {w.capacity} registered</>}
                        </span>
                        <span className="w-24 shrink-0 text-right"><StatusPill w={w} /></span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}

      {creating && (
        <WebinarForm
          meId={me?.id ?? ''}
          isAdmin={role === 'ADMIN'}
          onClose={() => setCreating(false)}
          onSaved={(w) => { setCreating(false); router.push(`/webinars/${w.id}`); }}
        />
      )}
    </div>
  );
}
