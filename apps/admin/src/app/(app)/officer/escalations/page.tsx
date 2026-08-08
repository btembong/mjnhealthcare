'use client';

import { useEffect, useState } from 'react';
import { Card } from '@mjn/ui';
import { Warning, CheckCircle } from '@phosphor-icons/react';
import { api } from '../../../../lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

export default function OfficerEscalationsPage() {
  const [escalations, setEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    api.getMyEscalations()
      .then(setEscalations)
      .catch(() => setEscalations([]))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Warning className="h-6 w-6 text-rose-500" />
        <div>
          <h1 className="text-xl font-bold">My Escalations</h1>
          <p className="text-xs text-muted-foreground">Cases you have escalated to a consultant</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <Card key={i} className="h-20 animate-pulse bg-muted" />)}
        </div>
      ) : escalations.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          <CheckCircle className="h-10 w-10 mx-auto mb-3 text-emerald-400" />
          <p className="font-medium">No escalations</p>
          <p className="text-xs mt-1">All cases are within normal parameters</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {escalations.map(e => (
            <Card key={e.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      e.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {e.status}
                    </span>
                    <Link
                      href={`/officer/cases/${e.engagementId}`}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      View Case →
                    </Link>
                  </div>
                  <p className="text-sm text-foreground">{e.reason}</p>
                  {e.resolution && (
                    <p className="text-xs text-muted-foreground mt-1">Resolution: {e.resolution}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(e.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
