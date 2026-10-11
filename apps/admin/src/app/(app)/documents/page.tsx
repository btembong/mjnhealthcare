'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Skeleton } from '@mjn/ui';
import {
  CheckCircle, XCircle, X, CircleNotch, ArrowClockwise, MagnifyingGlass, WarningCircle,
  ArrowSquareOut, FileText, Funnel, Sparkle, ArrowUp, ArrowDown, CaretLeft, CaretRight,
  Plus, Minus, Flag, ListChecks,
} from '@mjn/ui';
import { api } from '../../../lib/api';
import { useAdmin } from '../../../contexts/admin-context';

// ── Constants and helpers ─────────────────────────────────────────────────────

const DOC_TYPES = [
  'PASSPORT_COPY', 'DIPLOMA_DEGREE', 'DIPLOMA_TRANSCRIPT', 'BACHELORS_DEGREE',
  'BACHELORS_TRANSCRIPT', 'MASTERS_DEGREE', 'MASTERS_TRANSCRIPT', 'NURSING_LICENSE',
  'MEDICAL_LICENSE', 'OTHER_LICENSE', 'GOOD_STANDING_CERTIFICATE',
  'WORK_EXPERIENCE_CERTIFICATE', 'HIGH_SCHOOL_CERTIFICATE', 'ORDINARY_LEVEL_CERTIFICATE',
  'BIRTH_CERTIFICATE', 'PHOTO_ID', 'BANK_STATEMENT', 'PERSONAL_STATEMENT',
  'REFERENCE_LETTER', 'OTHER',
];

const STATUS: Record<string, { label: string; dot: string }> = {
  PENDING:        { label: 'Waiting',     dot: 'bg-accent' },
  VERIFIED:       { label: 'Verified',    dot: 'bg-secondary' },
  REJECTED:       { label: 'Rejected',    dot: 'bg-rose-500' },
  PENDING_CLIENT: { label: 'With client', dot: 'bg-primary/40' },
};

// What the client reads when a document is rejected for a common reason.
const REJECT_REASONS: { label: string; text: string }[] = [
  { label: 'Blurry or unreadable', text: 'The document is blurry or hard to read. Please upload a clear, well-lit copy.' },
  { label: 'Wrong document', text: 'This is not the document we asked for. Please upload the correct one.' },
  { label: 'Expired', text: 'This document has expired. Please upload a current, valid version.' },
  { label: 'Cropped or incomplete', text: 'Part of the document is cut off or pages are missing. Please upload the complete document.' },
  { label: 'Name does not match', text: 'The name on this document does not match your profile. Please upload a matching document or contact your consultant.' },
];

type Mode = 'review' | 'all';
type Counts = { all: number; pending: number; verified: number; rejected: number; expiring: number; expired: number; oldestPendingAt: string | null };
type Check = { flags: string[]; summary: string; confidence: string };

function fmt(type: string) {
  return (type ?? '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

function waited(date?: string) {
  if (!date) return '';
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  return `${Math.floor(mins / 1440)}d`;
}

function waitedLong(date?: string | null) {
  if (!date) return '';
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 60) return 'under an hour';
  if (mins < 1440) { const h = Math.floor(mins / 60); return `${h} hour${h !== 1 ? 's' : ''}`; }
  const d = Math.floor(mins / 1440);
  return `${d} day${d !== 1 ? 's' : ''}`;
}

function shortDate(date?: string) {
  return date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}

function StatusPill({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: fmt(status), dot: 'bg-muted-foreground/40' };
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-foreground">
      <span className={`h-2 w-2 rounded-full ${s.dot}`} /> {s.label}
    </span>
  );
}

function ExpiryText({ date }: { date?: string | null }) {
  if (!date) return <span className="text-xs text-muted-foreground">—</span>;
  const days = daysUntil(date);
  if (days < 0) {
    return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground"><span className="h-2 w-2 rounded-full bg-rose-500" /> Expired</span>;
  }
  if (days <= 30) {
    return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground"><span className="h-2 w-2 rounded-full bg-accent" /> {days} day{days !== 1 ? 's' : ''} left</span>;
  }
  return <span className="text-xs text-muted-foreground">{new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>;
}

// ── Document viewer ───────────────────────────────────────────────────────────

function Viewer({ doc, className }: { doc: any; className: string }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.fileUrl ?? '');

  // The file is fetched only when the reviewer reaches this document: each fetch is recorded in the audit log.
  useEffect(() => {
    let cancelled = false;
    setUrl(''); setLoading(true); setFailed(false); setZoom(1); setRotation(0);
    api.getDocumentViewUrl(doc.id)
      .then(({ url: signed }) => { if (!cancelled) setUrl(signed); })
      .catch(() => { if (!cancelled) setFailed(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [doc.id]);

  const tool = 'flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40';

  return (
    <div data-tour="docs-viewer" className={`flex flex-col overflow-hidden rounded-2xl border border-border bg-white ${className}`}>
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5">
        <p className="min-w-0 truncate text-xs font-semibold text-foreground">
          {fmt(doc.type)}
          <span className="ml-2 font-normal text-muted-foreground">uploaded {shortDate(doc.uploadedAt)}</span>
        </p>
        <div className="flex shrink-0 items-center gap-0.5">
          {isImage && (
            <>
              <button className={tool} onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} disabled={zoom <= 0.5} aria-label="Zoom out"><Minus className="h-4 w-4" /></button>
              <button className="h-8 rounded-lg px-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => { setZoom(1); setRotation(0); }} aria-label="Reset zoom">
                {Math.round(zoom * 100)}%
              </button>
              <button className={tool} onClick={() => setZoom((z) => Math.min(4, z + 0.25))} disabled={zoom >= 4} aria-label="Zoom in"><Plus className="h-4 w-4" /></button>
              <button className={tool} onClick={() => setRotation((r) => (r + 90) % 360)} aria-label="Rotate"><ArrowClockwise className="h-4 w-4" /></button>
            </>
          )}
          {url && (
            <a href={url} target="_blank" rel="noreferrer" className={tool} aria-label="Open in new tab" title="Open in new tab">
              <ArrowSquareOut className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-auto bg-muted/40">
        {loading ? (
          <div className="flex h-full min-h-64 items-center justify-center"><CircleNotch className="h-7 w-7 animate-spin text-muted-foreground" /></div>
        ) : failed || !url ? (
          <div className="flex h-full min-h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
            <FileText className="h-8 w-8" />
            <p className="text-sm font-semibold text-foreground">This file could not be loaded</p>
            <p className="text-xs">Refresh the page and try again.</p>
          </div>
        ) : isImage ? (
          <div className="flex min-h-full items-start justify-center p-4">
            <img
              src={url}
              alt={fmt(doc.type)}
              className="rounded shadow-sm transition-transform"
              style={{ width: `${zoom * 100}%`, maxWidth: 'none', transform: `rotate(${rotation}deg)` }}
            />
          </div>
        ) : (
          <iframe src={url} className="h-full min-h-[28rem] w-full border-0" title={fmt(doc.type)} />
        )}
      </div>
    </div>
  );
}

// ── Client and stage context ──────────────────────────────────────────────────

function bestStatus(docs: any[], type: string): string | null {
  const mine = docs.filter((d) => d.type === type).map((d) => d.status);
  for (const s of ['VERIFIED', 'PENDING', 'REJECTED']) if (mine.includes(s)) return s;
  return null;
}

function ContextStrip({ doc, ctx }: { doc: any; ctx: any | 'loading' | 'error' | undefined }) {
  const person = doc.person ?? {};
  const loaded = ctx && ctx !== 'loading' && ctx !== 'error' ? ctx : null;
  const required: string[] = loaded?.requiredDocTypes ?? [];
  const needed = required.includes(doc.type);

  return (
    <div className="rounded-2xl border border-border bg-white px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">
            {person.name ?? 'Unknown client'}
            {person.profession && <span className="ml-2 text-xs font-medium text-muted-foreground">{fmt(person.profession)}</span>}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {ctx === 'loading' || ctx === undefined ? 'Loading case details…'
              : ctx === 'error' ? 'Case details could not be loaded.'
              : loaded?.stage ? <>Stage {loaded.stage.index} of {loaded.stage.total} · <span className="font-semibold text-foreground">{loaded.stage.label}</span>{loaded.stage.pathway ? ` · ${loaded.stage.pathway}` : ''}</>
              : loaded?.engagement ? 'No stages set up for this case yet.'
              : 'This client has no case yet.'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {needed && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-2.5 py-1 text-xs font-bold text-foreground">
              <Flag className="h-3.5 w-3.5" /> Needed for this stage
            </span>
          )}
          {loaded?.engagement && (
            <Link href={`/caseload/${loaded.engagement.id}`} className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
              Open case <ArrowSquareOut className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      {required.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border/70 pt-2.5">
          <span className="text-xs font-semibold text-muted-foreground">This stage needs:</span>
          {required.map((type) => {
            const s = bestStatus(loaded.documents ?? [], type);
            return (
              <span key={type} className={`inline-flex items-center gap-1.5 text-xs ${type === doc.type ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                <span className={`h-2 w-2 rounded-full ${s ? STATUS[s].dot : 'border border-muted-foreground/50'}`} />
                {fmt(type)}
                <span className="text-muted-foreground/70">{s ? STATUS[s].label.toLowerCase() : 'missing'}</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Suggested checks (AI) ─────────────────────────────────────────────────────

function CheckPanel({ check, running, onRun }: { check?: Check; running: boolean; onRun: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-bold text-foreground"><ListChecks className="h-4 w-4 text-primary" /> What to check</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            AI suggestions based on the document type and dates. The AI has not seen the file; the decision is yours.
          </p>
        </div>
        {!check && (
          <button
            onClick={onRun}
            disabled={running}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-muted/60 disabled:opacity-50"
          >
            {running ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <Sparkle className="h-3.5 w-3.5" />}
            Suggest checks
          </button>
        )}
      </div>
      {check && (
        <div className="mt-2.5 border-t border-border/70 pt-2.5">
          <p className="text-xs text-foreground">{check.summary}</p>
          {check.flags.length > 0 && (
            <ul className="mt-2 space-y-1">
              {check.flags.map((flag, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" /> {flag}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ── Decision bar ──────────────────────────────────────────────────────────────

function DecisionBar({
  doc, busy, rejectOpen, setRejectOpen, onVerify, onReject,
}: {
  doc: any; busy: 'verify' | 'reject' | null; rejectOpen: boolean; setRejectOpen: (open: boolean) => void;
  onVerify: () => void; onReject: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setReason(''); }, [doc.id]);
  useEffect(() => { if (rejectOpen) textRef.current?.focus(); }, [rejectOpen]);

  if (doc.status !== 'PENDING') {
    return (
      <div className="rounded-2xl border border-border bg-white px-4 py-3 text-xs text-muted-foreground">
        <StatusPill status={doc.status} />
        {doc.verifiedBy && <span className="ml-3">by {doc.verifiedBy}{doc.verifiedAt ? ` on ${shortDate(doc.verifiedAt)}` : ''}</span>}
        {doc.rejectionReason && <p className="mt-1.5 text-foreground"><span className="font-semibold">Reason given to the client:</span> {doc.rejectionReason}</p>}
      </div>
    );
  }

  if (rejectOpen) {
    return (
      <div className="rounded-2xl border border-border bg-white p-4">
        <p className="text-sm font-bold text-foreground">Why is this being rejected?</p>
        <p className="mt-0.5 text-xs text-muted-foreground">The client will see this and can upload a corrected copy.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {REJECT_REASONS.map((r) => (
            <button
              key={r.label}
              onClick={() => { setReason(r.text); textRef.current?.focus(); }}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${reason === r.text ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground hover:bg-muted/60'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <textarea
          ref={textRef}
          id="reject-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Choose a reason above, or write your own…"
          rows={2}
          className="mt-3 w-full resize-none rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
        <div className="mt-3 flex justify-end gap-2">
          <button onClick={() => setRejectOpen(false)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted/60">
            Cancel
          </button>
          <button
            onClick={() => onReject(reason.trim())}
            disabled={!reason.trim() || busy === 'reject'}
            className="flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-bold text-white hover:bg-foreground/90 disabled:opacity-40"
          >
            {busy === 'reject' && <CircleNotch className="h-4 w-4 animate-spin" />} Reject and continue
          </button>
        </div>
      </div>
    );
  }

  const key = 'ml-1 rounded border border-current/30 px-1 text-[10px] font-bold opacity-70';
  return (
    <div data-tour="docs-decision" className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-white p-3">
      <button
        onClick={() => setRejectOpen(true)}
        disabled={!!busy}
        className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-muted/60 disabled:opacity-40"
      >
        <XCircle className="h-4 w-4" /> Reject <span className={key}>R</span>
      </button>
      <button
        onClick={onVerify}
        disabled={!!busy}
        className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-40"
      >
        {busy === 'verify' ? <CircleNotch className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
        Verify <span className={key}>V</span>
      </button>
    </div>
  );
}

// ── Workspace: context, viewer, checks and decision for one document ───────────

function Workspace(props: {
  doc: any; ctx: any; check?: Check; checkRunning: boolean; onRunCheck: () => void;
  busy: 'verify' | 'reject' | null; rejectOpen: boolean; setRejectOpen: (open: boolean) => void;
  onVerify: () => void; onReject: (reason: string) => void;
  /** On very large screens, put the details in a column beside the document. */
  wide?: boolean;
}) {
  const { doc, wide } = props;
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col gap-3 ${
        wide ? '2xl:grid 2xl:min-h-0 2xl:grid-cols-[minmax(0,1fr)_21rem] 2xl:grid-rows-[minmax(0,1fr)_auto]' : ''
      }`}
    >
      <div className={wide ? '2xl:hidden' : ''}><ContextStrip doc={doc} ctx={props.ctx} /></div>
      <Viewer doc={doc} className={`h-[68vh] min-h-[24rem] ${wide ? '2xl:row-span-2 2xl:h-auto 2xl:min-h-0' : ''}`} />
      <div className={`flex flex-col gap-3 ${wide ? '2xl:col-start-2 2xl:row-start-1 2xl:min-h-0 2xl:overflow-y-auto' : ''}`}>
        {wide && <div className="hidden 2xl:block"><ContextStrip doc={doc} ctx={props.ctx} /></div>}
        {doc.expiryDate && (
          <p className="flex flex-wrap items-center gap-2 px-1 text-xs text-muted-foreground">
            Expiry on file: <span className="font-semibold text-foreground">{shortDate(doc.expiryDate)}</span> <ExpiryText date={doc.expiryDate} />
          </p>
        )}
        {doc.status === 'PENDING' && <CheckPanel check={props.check} running={props.checkRunning} onRun={props.onRunCheck} />}
      </div>
      {/* A direct child of the workspace so it can stay pinned to the bottom of the screen while the page scrolls. */}
      <div className={`sticky bottom-0 z-10 ${wide ? '2xl:static 2xl:col-start-2 2xl:row-start-2' : ''}`}>
        <DecisionBar
          doc={doc} busy={props.busy} rejectOpen={props.rejectOpen} setRejectOpen={props.setRejectOpen}
          onVerify={props.onVerify} onReject={props.onReject}
        />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const FILTERS: { key: string; label: string; count: keyof Counts }[] = [
  { key: 'ALL', label: 'All', count: 'all' },
  { key: 'PENDING', label: 'Waiting', count: 'pending' },
  { key: 'VERIFIED', label: 'Verified', count: 'verified' },
  { key: 'REJECTED', label: 'Rejected', count: 'rejected' },
  { key: 'EXPIRING', label: 'Expiring', count: 'expiring' },
  { key: 'EXPIRED', label: 'Expired', count: 'expired' },
];

const COLUMNS: { key: string; label: string }[] = [
  { key: 'client', label: 'Client' },
  { key: 'type', label: 'Document' },
  { key: 'uploaded', label: 'Uploaded' },
  { key: 'expiry', label: 'Expiry' },
  { key: 'status', label: 'Status' },
];

const PAGE_SIZE = 25;

export default function DocumentsPage() {
  const { me } = useAdmin();
  const reviewerName = me?.name || me?.email || 'staff';

  const [mode, setMode] = useState<Mode>('review');
  const [counts, setCounts] = useState<Counts | null>(null);

  // Review queue
  const [queue, setQueue] = useState<any[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueSearch, setQueueSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Shared across both modes
  const [contexts, setContexts] = useState<Record<string, any>>({});
  const [checks, setChecks] = useState<Record<string, Check>>({});
  const [checkRunning, setCheckRunning] = useState<string | null>(null);
  const [busy, setBusy] = useState<'verify' | 'reject' | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);

  // Lookup table
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sort, setSort] = useState('uploaded');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [table, setTable] = useState<{ items: any[]; total: number } | null>(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);

  const loadCounts = useCallback(() => {
    api.getDocumentCounts().then(setCounts).catch(() => {});
  }, []);

  const loadQueue = useCallback(() => {
    setQueueLoading(true);
    api.getDocumentQueue()
      .then((data) => setQueue(data ?? []))
      .catch((e: any) => toast.error(e.message))
      .finally(() => setQueueLoading(false));
  }, []);

  useEffect(() => { loadQueue(); loadCounts(); }, [loadQueue, loadCounts]);

  // Queue grouped by client; both the groups and the documents inside are longest-waiting first.
  const groups = useMemo(() => {
    const q = queueSearch.trim().toLowerCase();
    const map = new Map<string, { personId: string; name: string; docs: any[] }>();
    for (const d of queue) {
      const name = d.person?.name ?? 'Unknown client';
      if (q && !name.toLowerCase().includes(q) && !(d.person?.email ?? '').toLowerCase().includes(q)) continue;
      if (!map.has(d.personId)) map.set(d.personId, { personId: d.personId, name, docs: [] });
      map.get(d.personId)!.docs.push(d);
    }
    return [...map.values()];
  }, [queue, queueSearch]);

  const flat = useMemo(() => groups.flatMap((g) => g.docs), [groups]);
  const selected = flat.find((d) => d.id === selectedId) ?? flat[0] ?? null;
  const position = selected ? flat.findIndex((d) => d.id === selected.id) : -1;
  const active = mode === 'review' ? selected : viewing;

  const loadContext = useCallback((personId: string) => {
    setContexts((prev) => (prev[personId] ? prev : { ...prev, [personId]: 'loading' }));
    api.getDocumentReviewContext(personId)
      .then((ctx) => setContexts((prev) => ({ ...prev, [personId]: ctx })))
      .catch(() => setContexts((prev) => ({ ...prev, [personId]: 'error' })));
  }, []);

  const activePersonId: string | undefined = active?.personId;
  useEffect(() => {
    if (activePersonId && contexts[activePersonId] === undefined) loadContext(activePersonId);
  }, [activePersonId, contexts, loadContext]);

  useEffect(() => { setRejectOpen(false); }, [active?.id]);

  const move = useCallback((delta: number) => {
    if (position < 0) return;
    const next = flat[position + delta];
    if (next) setSelectedId(next.id);
  }, [flat, position]);

  // Lookup table loading
  useEffect(() => { const t = setTimeout(() => setDebounced(search), 300); return () => clearTimeout(t); }, [search]);
  useEffect(() => { setPage(1); }, [filter, debounced, typeFilter, sort, dir]);

  const loadTable = useCallback(() => {
    setTableLoading(true);
    api.searchDocuments({ filter, q: debounced, type: typeFilter, page, pageSize: PAGE_SIZE, sort, dir })
      .then((res) => setTable({ items: res.items ?? [], total: res.total ?? 0 }))
      .catch((e: any) => toast.error(e.message))
      .finally(() => setTableLoading(false));
  }, [filter, debounced, typeFilter, page, sort, dir]);

  useEffect(() => { if (mode === 'all') loadTable(); }, [mode, loadTable]);

  function refreshAll() {
    loadQueue(); loadCounts();
    if (mode === 'all') loadTable();
  }

  // ── Decisions ──

  function afterDecision(doc: any, status: 'VERIFIED' | 'REJECTED', reason?: string) {
    const index = flat.findIndex((d) => d.id === doc.id);
    const next = index >= 0 ? (flat[index + 1] ?? flat[index - 1] ?? null) : null;
    setQueue((prev) => prev.filter((d) => d.id !== doc.id));
    if (mode === 'review') setSelectedId(next?.id ?? null);
    setContexts((prev) => { const copy = { ...prev }; delete copy[doc.personId]; return copy; });
    setViewing(null);
    loadCounts();
    if (mode === 'all') loadTable();

    toast.success(status === 'VERIFIED' ? `${fmt(doc.type)} verified` : `${fmt(doc.type)} rejected`, {
      description: status === 'REJECTED' ? reason : undefined,
      action: { label: 'Undo', onClick: () => undo(doc) },
    });
  }

  async function undo(doc: any) {
    try {
      await api.reopenDocument(doc.id);
      setQueue((prev) => {
        if (prev.some((d) => d.id === doc.id)) return prev;
        return [...prev, { ...doc, status: 'PENDING' }].sort(
          (a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime(),
        );
      });
      setSelectedId(doc.id);
      setContexts((prev) => { const copy = { ...prev }; delete copy[doc.personId]; return copy; });
      loadCounts();
      if (mode === 'all') loadTable();
      toast.success('Decision undone. The document is back in the queue.');
    } catch (e: any) {
      toast.error(e.message ?? 'Could not undo.');
    }
  }

  async function verify(doc: any) {
    if (busy) return;
    setBusy('verify');
    try {
      await api.verifyDocument(doc.id, reviewerName);
      afterDecision(doc, 'VERIFIED');
    } catch (e: any) {
      toast.error(e.message ?? 'Could not verify.');
    } finally {
      setBusy(null);
    }
  }

  async function reject(doc: any, reason: string) {
    if (busy || !reason) return;
    setBusy('reject');
    try {
      await api.rejectDocument(doc.id, reviewerName, reason);
      setRejectOpen(false);
      afterDecision(doc, 'REJECTED', reason);
    } catch (e: any) {
      toast.error(e.message ?? 'Could not reject.');
    } finally {
      setBusy(null);
    }
  }

  async function runCheck(doc: any) {
    setCheckRunning(doc.id);
    try {
      const result = await api.prescreenDocument(doc.id);
      setChecks((prev) => ({ ...prev, [doc.id]: { flags: result.flags ?? [], summary: result.summary ?? '', confidence: String(result.confidence ?? '') } }));
    } catch (e: any) {
      toast.error(e.message ?? 'Suggestions are unavailable right now.');
    } finally {
      setCheckRunning(null);
    }
  }

  // Keyboard shortcuts for the review queue
  const keyState = useRef({ selected, busy, rejectOpen, mode, viewing });
  keyState.current = { selected, busy, rejectOpen, mode, viewing };
  const actions = useRef({ verify, move });
  actions.current = { verify, move };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const s = keyState.current;
      if (s.mode !== 'review' || s.viewing || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable)) {
        if (e.key === 'Escape' && s.rejectOpen) setRejectOpen(false);
        return;
      }
      // Do nothing while a guided tour or another dialog is open.
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      const key = e.key.toLowerCase();
      if (key === 'escape' && s.rejectOpen) { setRejectOpen(false); return; }
      if (key === 'arrowdown' || key === 'j') { e.preventDefault(); actions.current.move(1); return; }
      if (key === 'arrowup' || key === 'k') { e.preventDefault(); actions.current.move(-1); return; }
      if (!s.selected || s.busy || s.rejectOpen) return;
      if (key === 'v') { e.preventDefault(); actions.current.verify(s.selected); }
      if (key === 'r') { e.preventDefault(); setRejectOpen(true); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function toggleSort(key: string) {
    if (key === sort) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSort(key); setDir('asc'); }
  }

  const pending = counts?.pending ?? queue.length;
  const totalPages = table ? Math.max(1, Math.ceil(table.total / PAGE_SIZE)) : 1;

  const workspaceProps = (doc: any) => ({
    doc,
    ctx: contexts[doc.personId],
    check: checks[doc.id],
    checkRunning: checkRunning === doc.id,
    onRunCheck: () => runCheck(doc),
    busy,
    rejectOpen,
    setRejectOpen,
    onVerify: () => verify(doc),
    onReject: (reason: string) => reject(doc, reason),
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 data-tour="page-title" className="text-xl font-bold text-foreground">Document Verification</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" /> <b className="text-foreground">{pending}</b> waiting</span>
            {counts && counts.expiring > 0 && <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" /> <b className="text-foreground">{counts.expiring}</b> expiring within 30 days</span>}
            {counts && counts.expired > 0 && <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" /> <b className="text-foreground">{counts.expired}</b> expired</span>}
            {counts?.oldestPendingAt && <span>Longest wait: <b className="text-foreground">{waitedLong(counts.oldestPendingAt)}</b></span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div data-tour="docs-modes" className="flex rounded-xl border border-border bg-muted/40 p-1">
            {([['review', `Review${pending ? ` ${pending}` : ''}`], ['all', 'All documents']] as [Mode, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${mode === key ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <button onClick={refreshAll} aria-label="Refresh" title="Refresh" className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground hover:bg-muted/60 hover:text-foreground">
            <ArrowClockwise className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Review mode ── */}
      {mode === 'review' && (
        queueLoading ? (
          <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
            <Skeleton className="hidden h-[32rem] rounded-2xl lg:block" />
            <Skeleton className="h-[32rem] rounded-2xl" />
          </div>
        ) : queue.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-14 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
              <CheckCircle className="h-6 w-6 text-secondary" weight="fill" />
            </div>
            <h3 className="font-bold text-foreground">All clear</h3>
            <p className="mt-1 text-sm text-muted-foreground">No documents are waiting for review.</p>
            <button onClick={() => setMode('all')} className="mt-4 text-sm font-bold text-primary hover:underline">Browse all documents</button>
          </div>
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-[250px_minmax(0,1fr)] 2xl:h-[calc(100vh-14rem)] 2xl:min-h-[34rem] 2xl:items-stretch">
            {/* Queue */}
            <aside data-tour="docs-queue" className="hidden min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-white lg:sticky lg:top-0 lg:flex lg:max-h-[calc(100vh-8rem)] 2xl:static 2xl:max-h-none">
              <div className="border-b border-border p-3">
                <p className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Queue <span className="font-medium normal-case tracking-normal">longest wait first</span>
                </p>
                <div className="relative">
                  <MagnifyingGlass className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="queue-search"
                    value={queueSearch}
                    onChange={(e) => setQueueSearch(e.target.value)}
                    placeholder="Search client"
                    className="h-8 w-full rounded-lg border border-border bg-white pl-8 pr-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {groups.length === 0 && <p className="p-4 text-center text-xs text-muted-foreground">No client matches that search.</p>}
                {groups.map((g) => (
                  <div key={g.personId} className="mb-2">
                    <p className="flex items-center justify-between gap-2 px-2 py-1 text-xs font-bold text-foreground">
                      <span className="truncate">{g.name}</span>
                      <span className="shrink-0 font-medium text-muted-foreground" title="Longest wait for this client">{waited(g.docs[0]?.uploadedAt)}</span>
                    </p>
                    {g.docs.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setSelectedId(d.id)}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${selected?.id === d.id ? 'bg-primary/10 font-semibold text-primary' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}
                      >
                        <span className="truncate">{fmt(d.type)}</span>
                        {d.expiryDate && daysUntil(d.expiryDate) <= 30 && (
                          <span className={`h-2 w-2 shrink-0 rounded-full ${daysUntil(d.expiryDate) < 0 ? 'bg-rose-500' : 'bg-accent'}`} title={daysUntil(d.expiryDate) < 0 ? 'Expired' : 'Expiring soon'} />
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted-foreground">
                <span>{position >= 0 ? `${position + 1} of ${flat.length}` : `${flat.length} waiting`}</span>
                <span className="hidden xl:inline">↑ ↓ to move · V verify · R reject</span>
              </div>
            </aside>

            <div className="flex min-h-0 min-w-0 flex-col gap-3">
              {/* Compact queue navigation when the list is hidden */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-white px-3 py-2 lg:hidden">
                <button onClick={() => move(-1)} disabled={position <= 0} aria-label="Previous document" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30"><CaretLeft className="h-4 w-4" /></button>
                <span className="text-xs font-semibold text-foreground">{position + 1} of {flat.length} waiting</span>
                <button onClick={() => move(1)} disabled={position >= flat.length - 1} aria-label="Next document" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30"><CaretRight className="h-4 w-4" /></button>
              </div>
              {selected ? (
                <div className="flex min-w-0 flex-1 flex-col 2xl:min-h-0">
                  <Workspace {...workspaceProps(selected)} wide />
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center rounded-2xl border border-border bg-white p-10 text-sm text-muted-foreground">
                  No document matches that search.
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* ── All documents ── */}
      {mode === 'all' && (
        <>
          <div data-tour="docs-filters" className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${filter === f.key ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-white text-muted-foreground hover:text-foreground'}`}
                >
                  {f.label}
                  {counts && <span className="ml-1.5 tabular-nums opacity-70">{counts[f.count] as number}</span>}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="docs-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search client or document"
                  className="h-9 w-56 rounded-xl border border-border bg-white pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex h-9 items-center gap-1.5 rounded-xl border border-border bg-white px-3">
                <Funnel className="h-3.5 w-3.5 text-muted-foreground" />
                <select id="docs-type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-transparent pr-1 text-sm text-foreground outline-none">
                  <option value="">All types</option>
                  {DOC_TYPES.map((t) => <option key={t} value={t}>{fmt(t)}</option>)}
                </select>
              </div>
              {(search || typeFilter) && (
                <button onClick={() => { setSearch(''); setTypeFilter(''); }} className="flex h-9 items-center gap-1 rounded-xl border border-border bg-white px-3 text-sm text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" /> Clear
                </button>
              )}
            </div>
          </div>

          <div data-tour="docs-table" className="overflow-hidden rounded-2xl border border-border bg-white">
            {tableLoading && !table ? (
              <div className="space-y-2 p-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
            ) : !table || table.items.length === 0 ? (
              <div className="p-14 text-center">
                <h3 className="font-bold text-foreground">{search || typeFilter || filter !== 'ALL' ? 'No documents match' : 'No documents yet'}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{search || typeFilter || filter !== 'ALL' ? 'Try a different filter or search.' : 'Documents appear here as clients upload them.'}</p>
              </div>
            ) : (
              <div className={`overflow-x-auto ${tableLoading ? 'opacity-60' : ''}`}>
                <table className="w-full min-w-[44rem] text-sm">
                  <thead className="border-b border-border bg-muted/40">
                    <tr className="text-left text-xs">
                      {COLUMNS.map((c) => (
                        <th key={c.key} className="px-4 py-3 font-semibold">
                          <button onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                            {c.label}
                            {sort === c.key && (dir === 'asc' ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />)}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {table.items.map((doc) => (
                      <tr key={doc.id} onClick={() => setViewing(doc)} className="cursor-pointer transition-colors hover:bg-muted/40">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-foreground">{doc.person?.name ?? 'Unknown client'}</p>
                          {doc.person?.email && <p className="text-xs text-muted-foreground">{doc.person.email}</p>}
                        </td>
                        <td className="px-4 py-3 text-foreground">{fmt(doc.type)}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{shortDate(doc.uploadedAt)}</td>
                        <td className="px-4 py-3"><ExpiryText date={doc.expiryDate} /></td>
                        <td className="px-4 py-3"><StatusPill status={doc.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {table && table.total > 0 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
                <span>
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, table.total)} of {table.total}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} aria-label="Previous page" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-30"><CaretLeft className="h-4 w-4" /></button>
                  <span className="px-1 font-semibold text-foreground">Page {page} of {totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} aria-label="Next page" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-30"><CaretRight className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* A document opened from the table */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="flex-1 bg-black/30" onClick={() => setViewing(null)} />
          <div className="flex h-full w-full max-w-3xl flex-col gap-3 overflow-y-auto bg-[#F8FAFC] p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                {fmt(viewing.type)} <StatusPill status={viewing.status} />
                {viewing.expiryDate && daysUntil(viewing.expiryDate) <= 30 && <WarningCircle className="h-4 w-4 text-accent" />}
              </p>
              <button onClick={() => setViewing(null)} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-1 flex-col">
              <Workspace {...workspaceProps(viewing)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
