'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Skeleton } from '@mjn/ui';
import { MagnifyingGlass, UsersThree } from '@mjn/ui';
import { api } from '../../../../lib/api';
import {
  CASE_STATUS, OPEN_CASE, SUBMISSION_STATUS, Dot, ago, card, day, daysFromToday, title,
} from '../../../../components/officer-kit';

const CHIPS = [
  ['needs', 'Needs me'],
  ['followup', 'Follow-up due'],
  ['nosub', 'No submission yet'],
  ['quiet', 'Quiet'],
  ['all', 'All'],
] as const;
type Chip = (typeof CHIPS)[number][0];

const open = (c: any) => OPEN_CASE.includes(c.status);
const FILTER: Record<Chip, (c: any) => boolean> = {
  needs: (c) => open(c) && c.needs.length > 0,
  followup: (c) => c.followUpDue,
  nosub: (c) => c.status === 'ACTIVE' && c.submissionCount === 0,
  quiet: (c) => open(c) && c.quiet,
  all: () => true,
};

function FollowUp({ c }: { c: any }) {
  if (!c.nextFollowUp || !open(c)) return <span className="text-muted-foreground">—</span>;
  const days = daysFromToday(c.nextFollowUp.date);
  if (days > 0) return <span className="text-foreground">{day(c.nextFollowUp.date)}</span>;
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
      <Dot className="bg-accent" /> {days === 0 ? 'Today' : ago(c.nextFollowUp.date)}
    </span>
  );
}

export default function OfficerCaseloadPage() {
  const [cases, setCases] = useState<any[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [chip, setChip] = useState<Chip>('all');
  const [q, setQ] = useState('');

  useEffect(() => {
    api.getOfficerCases()
      .then((list) => {
        const all = list ?? [];
        setCases(all);
        const wanted = new URLSearchParams(window.location.search).get('chip') as Chip | null;
        if (wanted && FILTER[wanted]) setChip(wanted);
        else if (all.some(FILTER.needs)) setChip('needs');
      })
      .catch(() => setFailed(true));
  }, []);

  const counts = useMemo(
    () => Object.fromEntries(CHIPS.map(([key]) => [key, (cases ?? []).filter(FILTER[key]).length])) as Record<Chip, number>,
    [cases],
  );
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (cases ?? []).filter(FILTER[chip]).filter((c) =>
      !term || (c.person?.name ?? '').toLowerCase().includes(term) || (c.person?.email ?? '').toLowerCase().includes(term));
  }, [cases, chip, q]);

  return (
    <div className="space-y-4">
      <div>
        <h1 data-tour="page-title" className="text-xl font-bold text-foreground">My caseload</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">The cases assigned to you. Select one to work on it.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div data-tour="ocl-chips" className="flex flex-wrap gap-1.5">
          {CHIPS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setChip(key)}
              aria-pressed={chip === key}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${chip === key ? 'border-primary bg-primary text-white' : 'border-border bg-white text-foreground hover:bg-muted/60'}`}
            >
              {label} <span className={chip === key ? 'text-white/70' : 'text-muted-foreground'}>{cases ? counts[key] : ''}</span>
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            aria-label="Search by client name or email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search client"
            className="h-9 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {failed ? (
        <div className={`${card} p-10 text-center text-sm text-muted-foreground`}>Your caseload could not be loaded. Check your connection and reload the page.</div>
      ) : !cases ? (
        <div className="space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
      ) : shown.length === 0 ? (
        <div className={`${card} flex flex-col items-center p-10 text-center`}>
          <UsersThree className="mb-2 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm font-semibold text-foreground">
            {cases.length === 0 ? 'No cases are assigned to you yet' : q ? 'No case matches your search' : 'No cases here'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {cases.length === 0 ? 'An admin or consultant assigns cases to you. You are emailed when one arrives.' : chip !== 'all' ? 'Choose “All” to see every case assigned to you.' : ''}
          </p>
        </div>
      ) : (
        <div data-tour="ocl-list" className={`${card} overflow-hidden`}>
          <div className="hidden grid-cols-[1.3fr_1.4fr_1.5fr_0.9fr] gap-4 border-b border-border bg-muted/40 px-5 py-2.5 text-xs font-semibold text-muted-foreground md:grid">
            <span>Client</span><span>Stage</span><span>Submission</span><span>Next follow-up</span>
          </div>
          <ul className="divide-y divide-border/70">
            {shown.map((c) => {
              const sub = c.submission;
              const pct = c.stage.total > 0 ? Math.round((c.stage.done / c.stage.total) * 100) : 0;
              const hints = [
                c.waiting.approvals > 0 && 'Update with consultant',
                c.waiting.escalations > 0 && 'Escalation open',
                c.waiting.forms > 0 && 'Form with client',
              ].filter(Boolean) as string[];
              return (
                <li key={c.id}>
                  <Link href={`/officer/cases/${c.id}`} className="grid gap-x-4 gap-y-2.5 px-5 py-3.5 hover:bg-muted/40 md:grid-cols-[1.3fr_1.4fr_1.5fr_0.9fr] md:items-center">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">{c.person?.name ?? 'Client'}</p>
                      <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        {c.person?.profession && <span>{title(c.person.profession)}</span>}
                        {c.status !== 'ACTIVE' && <span className="inline-flex items-center gap-1.5"><Dot className={CASE_STATUS[c.status]?.dot ?? 'bg-muted'} /> {CASE_STATUS[c.status]?.label ?? title(c.status)}</span>}
                      </p>
                    </div>

                    <div className="min-w-0">
                      {c.stage.total === 0 ? <p className="text-xs text-muted-foreground">No stages yet</p> : (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-secondary" style={{ width: `${pct}%` }} /></div>
                            <span className="text-xs font-semibold text-muted-foreground">{c.stage.current ? `${c.stage.done + 1} of ${c.stage.total}` : 'All complete'}</span>
                          </div>
                          {c.stage.current && <p className="mt-1 truncate text-sm text-foreground">{c.stage.current}</p>}
                        </>
                      )}
                    </div>

                    <div className="min-w-0 text-sm">
                      {sub ? (
                        <p className="flex items-center gap-1.5 truncate text-foreground">
                          <Dot className={SUBMISSION_STATUS[sub.status]?.dot ?? 'bg-muted-foreground/40'} />
                          <span className="truncate"><span className="font-semibold">{sub.portal}</span> · {SUBMISSION_STATUS[sub.status]?.label ?? title(sub.status)}</span>
                        </p>
                      ) : <p className="text-muted-foreground">None recorded</p>}
                      {sub?.referenceNumber && <p className="truncate text-xs text-muted-foreground">Ref {sub.referenceNumber}{c.submissionCount > 1 ? ` · ${c.submissionCount} submissions` : ''}</p>}
                      {c.needs.filter((n: any) => n.key !== 'followup').map((n: any, i: number) => (
                        <p key={i} className="flex items-center gap-1.5 text-xs font-semibold text-foreground"><Dot className="bg-accent" /> {n.label}</p>
                      ))}
                      {hints.length > 0 && <p className="truncate text-xs text-muted-foreground">{hints.join(' · ')}</p>}
                    </div>

                    <div className="text-sm">
                      <span className="mr-2 text-xs text-muted-foreground md:hidden">Next follow-up</span>
                      <FollowUp c={c} />
                      {open(c) && c.quiet && <p className="text-xs text-muted-foreground">Quiet since {ago(c.lastActivityAt)}</p>}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
