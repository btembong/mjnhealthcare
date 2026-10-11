'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Skeleton } from '@mjn/ui';
import { CheckCircle, Clock, FileText, Note, ArrowRight, CalendarBlank } from '@mjn/ui';
import { api } from '../../../lib/api';
import { useAdmin } from '../../../contexts/admin-context';
import {
  SUBMISSION_ORDER, SUBMISSION_STATUS, Dot, ago, btnOutline, btnPrimary, card, heading, shortDay,
} from '../../../components/officer-kit';

const NEED: Record<string, { icon: any; action: string; link: (n: any) => string }> = {
  followup: { icon: Clock, action: 'Update submission', link: (n) => `/officer/cases/${n.engagementId}?tab=submissions&edit=${n.trackingId}` },
  form: { icon: FileText, action: 'Open form', link: (n) => `/officer/cases/${n.engagementId}?tab=documents` },
  declined: { icon: Note, action: 'Open notes', link: (n) => `/officer/cases/${n.engagementId}?tab=notes` },
};

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

export default function OfficerWorkPage() {
  const { me } = useAdmin();
  const [data, setData] = useState<any>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.getOfficerWork().then(setData).catch(() => setFailed(true));
  }, []);

  if (failed) {
    return (
      <div className={`${card} p-10 text-center`}>
        <h1 data-tour="page-title" className="font-bold text-foreground">Your work could not be loaded</h1>
        <p className="mt-1 text-sm text-muted-foreground">Check your connection and reload the page.</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = (me?.name ?? '').trim().split(/\s+/)[0];
  const { counts, doFirst, comingUp, waiting, submissions, thisWeek } = data;
  const nothingWaiting = waiting.approvals === 0 && waiting.formsWithClient === 0 && waiting.escalations.length === 0;
  const otherStatuses = Object.keys(submissions).filter((s) => !SUBMISSION_ORDER.includes(s));

  return (
    <div className="space-y-4">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 data-tour="page-title" className="text-xl font-bold text-foreground">{greeting}{firstName ? `, ${firstName}` : ''}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {plural(counts.openCases, 'open case', 'open cases')}
            {' · '}{plural(counts.followUpsDue, 'follow-up due', 'follow-ups due')}
            {' · '}{plural(counts.formsReturned, 'form returned', 'forms returned')}
          </p>
        </div>
        <Link href="/officer/caseload" className={btnOutline}>My caseload <ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>

      {/* Do first */}
      <section data-tour="work-first" className={card}>
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <h2 className={heading}>Do first</h2>
          {doFirst.length > 0 && <span className="rounded-full bg-accent px-2 text-xs font-bold text-accent-foreground">{doFirst.length}</span>}
        </div>
        {doFirst.length === 0 ? (
          <p className="flex items-center gap-2 px-5 py-6 text-sm font-semibold text-foreground">
            <CheckCircle className="h-4 w-4 text-secondary" weight="fill" /> Nothing needs you right now.
          </p>
        ) : (
          <ul className="divide-y divide-border/70">
            {doFirst.map((n: any, i: number) => {
              const kind = NEED[n.key] ?? NEED.followup;
              return (
                <li key={`${n.key}-${n.engagementId}-${i}`} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-foreground"><kind.icon className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{n.clientName}</p>
                    <p className="text-sm text-muted-foreground">{n.text}{n.key !== 'followup' && <span> · {ago(n.at)}</span>}</p>
                  </div>
                  <Link href={kind.link(n)} className={i === 0 ? btnPrimary : btnOutline}>{kind.action}</Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        {/* Coming up */}
        <section data-tour="work-coming" className={card}>
          <div className="border-b border-border px-5 py-3.5"><h2 className={heading}>Coming up · next 7 days</h2></div>
          {comingUp.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">No follow-ups are due in the next 7 days.</p>
          ) : (
            <ul className="divide-y divide-border/70">
              {comingUp.map((u: any) => (
                <li key={u.trackingId}>
                  <Link href={`/officer/cases/${u.engagementId}?tab=submissions`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40">
                    <CalendarBlank className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="w-24 shrink-0 text-sm font-semibold text-foreground">{shortDay(u.date)}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{u.portal} follow-up · {u.clientName}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Waiting on others */}
        <section data-tour="work-waiting" className={card}>
          <div className="border-b border-border px-5 py-3.5"><h2 className={heading}>Waiting on others</h2></div>
          {nothingWaiting ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">Nothing is with a consultant or a client at the moment.</p>
          ) : (
            <ul className="divide-y divide-border/70 text-sm">
              {waiting.approvals > 0 && (
                <li className="flex items-center gap-3 px-5 py-3">
                  <Dot className="bg-primary/40" />
                  <span className="text-foreground">{plural(waiting.approvals, 'client update', 'client updates')} with a consultant for approval</span>
                </li>
              )}
              {waiting.escalations.map((e: any) => (
                <li key={e.id}>
                  <Link href={`/officer/cases/${e.engagementId}?tab=activity`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40">
                    <Dot className="bg-primary/40" />
                    <span className="min-w-0 flex-1 truncate text-foreground">Escalation open · {e.clientName}{e.consultantName ? ` · with ${e.consultantName}` : ''}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{ago(e.createdAt)}</span>
                  </Link>
                </li>
              ))}
              {waiting.formsWithClient > 0 && (
                <li className="flex items-center gap-3 px-5 py-3">
                  <Dot className="bg-primary/40" />
                  <span className="text-foreground">{plural(waiting.formsWithClient, 'form', 'forms')} with clients to complete</span>
                </li>
              )}
            </ul>
          )}
        </section>
      </div>

      {/* Summary */}
      <section data-tour="work-summary" className={`${card} divide-y divide-border/70`}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3.5">
          <h2 className={`${heading} w-28 shrink-0`}>Submissions</h2>
          {[...SUBMISSION_ORDER, ...otherStatuses].filter((s) => submissions[s] > 0).map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Dot className={SUBMISSION_STATUS[s]?.dot ?? 'bg-muted-foreground/40'} /> {SUBMISSION_STATUS[s]?.label ?? s}
              <span className="font-bold text-foreground">{submissions[s]}</span>
            </span>
          ))}
          {Object.keys(submissions).length === 0 && <span className="text-sm text-muted-foreground">None recorded on your open cases yet.</span>}
          {counts.noSubmission > 0 && (
            <Link href="/officer/caseload?chip=nosub" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              {plural(counts.noSubmission, 'active case', 'active cases')} with no submission yet
            </Link>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3.5">
          <h2 className={`${heading} w-28 shrink-0`}>This week</h2>
          {[
            [thisWeek.submissions, 'submission recorded', 'submissions recorded'],
            [thisWeek.notes, 'internal note', 'internal notes'],
            [thisWeek.clientUpdates, 'client update', 'client updates'],
          ].map(([n, one, many]) => (
            <span key={one as string} className="text-sm text-muted-foreground"><span className="font-bold text-foreground">{n}</span> {n === 1 ? one : many}</span>
          ))}
        </div>
      </section>
    </div>
  );
}
