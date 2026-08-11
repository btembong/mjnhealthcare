'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader, Skeleton, Badge } from '@mjn/ui';
import {
  ArrowLeft, User, EnvelopeSimple, Phone, Globe, Briefcase,
  FileText, CalendarCheck, Clock, CheckCircle, XCircle, HourglassSimple,
} from '@phosphor-icons/react';
import { api } from '../../../../lib/api';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:    'bg-emerald-100 text-emerald-700',
  ON_HOLD:   'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
  PENDING:   'bg-muted text-muted-foreground',
};

const DOC_STATUS_ICON: Record<string, React.ReactNode> = {
  VERIFIED: <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />,
  REJECTED: <XCircle className="h-3.5 w-3.5 text-rose-500" />,
  PENDING:  <HourglassSimple className="h-3.5 w-3.5 text-amber-500" />,
};

function fmt(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDate(ts?: string | null) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [person, setPerson]           = useState<any>(null);
  const [engagements, setEngagements] = useState<any[]>([]);
  const [documents, setDocuments]     = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([
      api.getPerson(id),
      api.getClientEngagements(id),
      api.getDocumentsByPerson(id),
    ])
      .then(([p, e, d]) => { setPerson(p); setEngagements(e); setDocuments(d); })
      .catch((err: any) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="rounded-2xl border border-border bg-white p-10 text-center">
        <p className="font-semibold text-foreground">Client not found.</p>
      </div>
    );
  }

  const initials = person.name?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <PageHeader title={person.name ?? 'Unknown'} subtitle={`Client profile · joined ${fmtDate(person.createdAt)}`} />
      </div>

      {/* Identity card */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary">
            {initials}
          </div>
          <div className="flex-1 min-w-0 grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span className="font-medium text-foreground">{person.name ?? '—'}</span>
                <Badge variant="outline" className="text-[10px] capitalize">{person.role?.toLowerCase()}</Badge>
              </div>
              {person.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <EnvelopeSimple className="h-3.5 w-3.5 shrink-0" />
                  <a href={`mailto:${person.email}`} className="hover:text-foreground transition-colors">{person.email}</a>
                </div>
              )}
              {person.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{person.phone}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {person.profession && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Briefcase className="h-3.5 w-3.5 shrink-0" />
                  <span className="capitalize">{person.profession.toLowerCase()}</span>
                </div>
              )}
              {person.locale && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-3.5 w-3.5 shrink-0" />
                  <span className="uppercase">{person.locale}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Engagements */}
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <CalendarCheck className="h-4 w-4 text-primary" />
            <p className="font-bold text-foreground">Engagements</p>
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{engagements.length}</span>
          </div>
          {engagements.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No engagements yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {engagements.map((eng: any) => (
                <li key={eng.id} className="flex items-start justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{eng.title ?? `Engagement ${eng.id.slice(0, 8)}`}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{fmtDate(eng.createdAt)}</p>
                    {eng.letterStatus && (
                      <p className="mt-0.5 text-xs text-muted-foreground">Letter: {fmt(eng.letterStatus)}</p>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[eng.status] ?? 'bg-muted text-muted-foreground'}`}>
                    {fmt(eng.status ?? 'PENDING')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Documents */}
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <FileText className="h-4 w-4 text-primary" />
            <p className="font-bold text-foreground">Documents</p>
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{documents.length}</span>
          </div>
          {documents.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No documents uploaded yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {documents.map((doc: any) => (
                <li key={doc.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {DOC_STATUS_ICON[doc.status] ?? DOC_STATUS_ICON.PENDING}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{fmt(doc.type ?? 'Document')}</p>
                      {doc.expiryDate && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Expires {fmtDate(doc.expiryDate)}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    doc.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700'
                    : doc.status === 'REJECTED' ? 'bg-rose-100 text-rose-700'
                    : 'bg-amber-100 text-amber-700'
                  }`}>
                    {fmt(doc.status ?? 'PENDING')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
