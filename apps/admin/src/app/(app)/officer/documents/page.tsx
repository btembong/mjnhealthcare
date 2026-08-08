'use client';

import { useEffect, useState } from 'react';
import { Card } from '@mjn/ui';
import { FileText } from '@phosphor-icons/react';
import { api } from '../../../lib/api';
import Link from 'next/link';

function statusBadge(status: string) {
  if (status === 'VERIFIED') return 'bg-emerald-100 text-emerald-700';
  if (status === 'PENDING') return 'bg-amber-100 text-amber-700';
  if (status === 'REJECTED') return 'bg-rose-100 text-rose-700';
  return 'bg-muted text-muted-foreground';
}

export default function OfficerDocumentsPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<any[]>([]);

  useEffect(() => {
    api.getOfficerCases().then(async (c) => {
      setCases(c);
      const personIds = [...new Set(c.map((x: any) => x.person?.id).filter(Boolean))];
      const allDocs: any[] = [];
      await Promise.all(
        personIds.map(async (pid) => {
          try {
            const d = await api.getDocumentsByPerson(pid as string);
            allDocs.push(...d);
          } catch {}
        }),
      );
      setDocs(allDocs);
    }).finally(() => setLoading(false));
  }, []);

  const pending = docs.filter(d => d.status === 'PENDING');
  const others = docs.filter(d => d.status !== 'PENDING');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold">Documents</h1>
          <p className="text-xs text-muted-foreground">Documents belonging to your assigned cases</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i=><Card key={i} className="h-16 animate-pulse bg-muted"/>)}</div>
      ) : docs.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-30"/>
          <p className="font-medium">No documents found</p>
        </Card>
      ) : (
        <>
          {pending.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-2">Pending Review ({pending.length})</h2>
              <div className="space-y-2">
                {pending.map(d => <DocRow key={d.id} doc={d} />)}
              </div>
            </div>
          )}
          {others.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-2 mt-4">Other Documents</h2>
              <div className="space-y-2">
                {others.map(d => <DocRow key={d.id} doc={d} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DocRow({ doc }: { doc: any }) {
  return (
    <Card className="p-3 flex items-center gap-3">
      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground truncate">{doc.type}</p>
        <p className="text-xs text-muted-foreground truncate">
          {doc.person?.name ?? 'Unknown'} · Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
        </p>
      </div>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(doc.status)}`}>
        {doc.status}
      </span>
    </Card>
  );
}
