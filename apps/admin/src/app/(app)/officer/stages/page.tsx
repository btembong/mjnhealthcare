'use client';

import { useEffect, useState } from 'react';
import { Card } from '@mjn/ui';
import { ListChecks, ArrowRight } from '@phosphor-icons/react';
import { api } from '../../../lib/api';
import Link from 'next/link';

export default function OfficerStagesPage() {
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
        <ListChecks className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold">Stage Tracker</h1>
          <p className="text-xs text-muted-foreground">Milestone progress across your assigned cases</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i=><Card key={i} className="h-28 animate-pulse bg-muted"/>)}</div>
      ) : cases.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          <ListChecks className="h-10 w-10 mx-auto mb-3 opacity-30"/>
          <p className="font-medium">No cases assigned</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {cases.map(c => (
            <Card key={c.id} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-foreground">{c.person?.name}</p>
                  <p className="text-xs text-muted-foreground">{c.person?.profession}</p>
                </div>
                <Link
                  href={`/officer/cases/${c.id}`}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Open case <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {c.milestones?.length > 0 ? (
                <div className="space-y-1.5">
                  {c.milestones.map((m: any) => (
                    <div key={m.id} className="flex items-center gap-2 text-xs">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${m.completedAt ? 'bg-emerald-500' : 'bg-border'}`} />
                      <span className={m.completedAt ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                        {m.title}
                      </span>
                      {m.completedAt && (
                        <span className="ml-auto text-xs text-emerald-600">
                          {new Date(m.completedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No milestones yet.</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
