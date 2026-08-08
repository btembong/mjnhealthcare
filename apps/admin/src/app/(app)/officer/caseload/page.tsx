'use client';

import { useEffect, useState } from 'react';
import { Card } from '@mjn/ui';
import { UsersThree, ArrowRight, ClockCounterClockwise } from '@phosphor-icons/react';
import { api } from '../../../lib/api';
import Link from 'next/link';

function statusColor(status: string) {
  const s = status.toUpperCase();
  if (s === 'ACTIVE') return 'bg-emerald-100 text-emerald-700';
  if (s === 'ON_HOLD') return 'bg-amber-100 text-amber-700';
  if (s === 'COMPLETED') return 'bg-sky-100 text-sky-700';
  if (s === 'TERMINATED') return 'bg-rose-100 text-rose-700';
  return 'bg-muted text-muted-foreground';
}

export default function OfficerCaseloadPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOfficerCases()
      .then(setCases)
      .catch(() => setCases([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <UsersThree className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold text-foreground">My Caseload</h1>
          <p className="text-xs text-muted-foreground">Cases assigned to you for document processing</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-24 animate-pulse bg-muted" />
          ))}
        </div>
      ) : cases.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          <UsersThree className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No cases assigned yet</p>
          <p className="text-xs mt-1">Contact your administrator to get cases assigned</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => (
            <Card key={c.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {c.person?.name ?? 'Unknown Client'}
                    </p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor(c.status)}`}>
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.person?.email} · {c.person?.profession ?? 'N/A'}
                  </p>
                  {c.milestones?.[0] && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ClockCounterClockwise className="h-3.5 w-3.5" />
                      Last milestone: {c.milestones[0].title}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-foreground">{c._count?.caseNotes ?? 0} notes</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    href={`/officer/cases/${c.id}`}
                    className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
                  >
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
