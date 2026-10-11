'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Skeleton } from '@mjn/ui';
import { CheckCircle } from '@mjn/ui';
import { api } from '../../../../lib/api';
import { Dot, ago, btnOutline, card, day } from '../../../../components/officer-kit';

export default function OfficerEscalationsPage() {
  const [escalations, setEscalations] = useState<any[] | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    api.getMyEscalations().then((l) => setEscalations(l ?? [])).catch(() => setEscalations([]));
  }, []);

  const open = (escalations ?? []).filter((e) => e.status === 'OPEN');
  const resolved = (escalations ?? []).filter((e) => e.status !== 'OPEN');
  const shown = showResolved ? resolved : open;

  return (
    <div className="space-y-4">
      <div>
        <h1 data-tour="page-title" className="text-xl font-bold text-foreground">Escalations</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Cases you raised with a consultant, and what they decided. To raise one, open the case and choose Escalate.</p>
      </div>

      <div data-tour="oesc-tabs" className="flex gap-1.5">
        {([[false, 'Open', open.length], [true, 'Resolved', resolved.length]] as const).map(([value, label, n]) => (
          <button
            key={label}
            onClick={() => setShowResolved(value)}
            aria-pressed={showResolved === value}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${showResolved === value ? 'border-primary bg-primary text-white' : 'border-border bg-white text-foreground hover:bg-muted/60'}`}
          >
            {label} <span className={showResolved === value ? 'text-white/70' : 'text-muted-foreground'}>{escalations ? n : ''}</span>
          </button>
        ))}
      </div>

      {!escalations ? (
        <div className="space-y-2">{[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : shown.length === 0 ? (
        <div className={`${card} flex flex-col items-center p-10 text-center`}>
          <CheckCircle className="mb-2 h-8 w-8 text-secondary" weight="fill" />
          <p className="text-sm font-semibold text-foreground">{showResolved ? 'No resolved escalations yet' : 'No open escalations'}</p>
          <p className="mt-1 text-sm text-muted-foreground">{showResolved ? 'Answers from consultants appear here.' : 'Nothing is waiting on a consultant.'}</p>
        </div>
      ) : (
        <ul className={`${card} divide-y divide-border/70`}>
          {shown.map((e) => (
            <li key={e.id} className="flex flex-wrap items-start gap-3 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                  <span className="font-bold text-foreground">{e.engagement?.person?.name ?? 'Client'}</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Dot className={e.status === 'OPEN' ? 'bg-accent' : 'bg-secondary'} />
                    {e.status === 'OPEN' ? `Open · raised ${ago(e.createdAt)}` : `Resolved ${day(e.resolvedAt)}`}
                  </span>
                  {e.consultant?.name && <span className="text-xs text-muted-foreground">with {e.consultant.name}</span>}
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground">{e.reason}</p>
                {e.resolution && (
                  <p className="mt-2 whitespace-pre-wrap rounded-xl bg-muted/50 px-3.5 py-2.5 text-sm text-foreground">
                    <span className="font-bold">Consultant’s answer: </span>{e.resolution}
                  </p>
                )}
              </div>
              <Link href={`/officer/cases/${e.engagementId}`} className={btnOutline}>Open case</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
