'use client';

import { useEffect, useState } from 'react';
import { Card } from '@mjn/ui';
import { Note, User } from '@phosphor-icons/react';
import { api } from '../../../lib/api';
import Link from 'next/link';

export default function OfficerNotesPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [allNotes, setAllNotes] = useState<Array<{ note: any; caseName: string; caseId: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOfficerCases().then(async (c) => {
      setCases(c);
      const notes: typeof allNotes = [];
      await Promise.all(
        c.map(async (engagement: any) => {
          try {
            const n = await api.getCaseNotes(engagement.id);
            n.forEach((note: any) =>
              notes.push({ note, caseName: engagement.person?.name ?? 'Unknown', caseId: engagement.id }),
            );
          } catch {}
        }),
      );
      notes.sort((a, b) => new Date(b.note.createdAt).getTime() - new Date(a.note.createdAt).getTime());
      setAllNotes(notes);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Note className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold">Case Notes</h1>
          <p className="text-xs text-muted-foreground">All notes across your assigned cases</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i=><Card key={i} className="h-20 animate-pulse bg-muted"/>)}</div>
      ) : allNotes.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          <Note className="h-10 w-10 mx-auto mb-3 opacity-30"/>
          <p className="font-medium">No notes yet</p>
          <p className="text-xs mt-1">Open a case to add internal notes</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {allNotes.map(({ note, caseName, caseId }) => (
            <Card key={note.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-foreground">{note.author?.name ?? 'Staff'}</span>
                    <Link href={`/officer/cases/${caseId}`} className="text-xs text-primary hover:underline">
                      {caseName}
                    </Link>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-foreground">{note.content}</p>
                  {note.isInternal && (
                    <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 font-medium">
                      Internal
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
