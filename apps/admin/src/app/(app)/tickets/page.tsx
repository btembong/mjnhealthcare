'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { PageHeader, Skeleton } from '@mjn/ui';
import { MagnifyingGlass, CircleNotch, X, ArrowLeft, PaperPlaneTilt, FileText, Headset, Plus } from '@mjn/ui';
import { api } from '../../../lib/api';
import { useAdmin } from '../../../contexts/admin-context';

// ── Shape and helpers ─────────────────────────────────────────────────────────

type Turn = 'us' | 'client' | 'solved';
type Staff = { id: string; name: string };
type Row = {
  id: string; subject: string; category: string; urgent: boolean; turn: Turn; waitingSince: string | null; lastActivityAt: string;
  createdAt: string; person: { id: string; name: string; email: string } | null; assignedTo: Staff | null; preview: string; notes: number; privacyDueAt: string | null;
};
type Reply = {
  id: string; authorId: string; authorRole: string; authorName: string | null; content: string; internal: boolean; createdAt: string;
  attachment: { name: string; type: string; isImage: boolean } | null;
};
type Detail = Omit<Row, 'person' | 'preview' | 'notes'> & {
  status: string; replies: Reply[]; engagementId: string | null;
  person: { id: string; name: string; email: string; phone?: string | null } | null;
};

const TOPIC: Record<string, string> = {
  DOCUMENT: 'Documents', PAYMENT: 'Payments', LICENSING: 'Licensing', EXAM_PREP: 'Exam prep',
  GENERAL: 'General', ACCOUNT: 'Account', SESSIONS: 'Sessions', PRIVACY: 'Privacy',
};
const TABS = [['us', 'Needs reply'], ['client', 'Waiting on client'], ['solved', 'Solved'], ['all', 'All']] as const;
type Tab = (typeof TABS)[number][0];
/** The portal tells clients "usually replies within one working day". */
const OVERDUE_HOURS = 24;
const FILE_ACCEPT = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
const FILE_MAX_MB = 20;

const card = 'rounded-2xl border border-border bg-white shadow-sm';
const heading = 'text-xs font-bold uppercase tracking-widest text-muted-foreground';
const btnPrimary = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-40';
const btnOutline = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted/60 disabled:opacity-40';
const field = 'w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';
const chip = (on: boolean) => `rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors ${on ? 'border-primary bg-primary text-white' : 'border-border bg-white text-muted-foreground hover:border-primary/40'}`;

function Dot({ className }: { className: string }) {
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${className}`} />;
}
/** "40 min", "5 h", "2 d" — how long something has been going on. */
function span(iso: string, now: number) {
  const mins = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}
function overdue(r: { turn: Turn; waitingSince: string | null }, now: number) {
  return r.turn === 'us' && !!r.waitingSince && now - new Date(r.waitingSince).getTime() > OVERDUE_HOURS * 3600000;
}
function day(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
function dayTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function fileProblem(file: File) {
  if (!/\.(pdf|jpe?g|png|docx?)$/i.test(file.name)) return 'Only PDF, JPG, PNG and Word files can be sent.';
  if (file.size > FILE_MAX_MB * 1024 * 1024) return `That file is larger than ${FILE_MAX_MB} MB.`;
  return '';
}
async function openFile(replyId: string) {
  // Opened before the request so the browser does not treat it as a pop-up.
  const win = window.open('about:blank', '_blank');
  if (win) win.opener = null;
  try {
    const { url } = await api.getTicketAttachmentUrl(replyId);
    if (win) win.location.href = url; else window.location.href = url;
  } catch {
    win?.close();
    toast.error('The file could not be opened.');
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SupportRequestsPage() {
  const { me } = useAdmin();
  const role = (me?.role as string)?.toUpperCase();
  const isAdmin = role === 'ADMIN';
  const isOfficer = role === 'PROCESSING_OFFICER';

  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [tab, setTab] = useState<Tab>('us');
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('');
  const [owner, setOwner] = useState<'all' | 'mine' | 'none'>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);

  const load = useCallback(async () => {
    try {
      setRows(await api.getSupportRequests() as Row[]);
      setNow(Date.now());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    load();
    api.getTicketAssignees().then(setStaff).catch(() => setStaff([]));
    // A link from an alert email opens that request directly.
    const wanted = new URLSearchParams(window.location.search).get('ticket');
    if (wanted) { setOpenId(wanted); setTab('all'); }
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  const all = rows ?? [];
  const count = (t: Tab) => (t === 'all' ? all.length : all.filter((r) => r.turn === t).length);
  const q = search.trim().toLowerCase();
  const shown = useMemo(() => {
    const list = all.filter((r) =>
      (tab === 'all' || r.turn === tab) &&
      (!topic || r.category === topic) &&
      (owner === 'all' || (owner === 'mine' ? r.assignedTo?.id === me?.id : !r.assignedTo)) &&
      (!q || r.subject.toLowerCase().includes(q) || (r.person?.name ?? '').toLowerCase().includes(q) || (r.person?.email ?? '').toLowerCase().includes(q)));
    // Waiting clients: urgent first, then whoever has waited longest. Everything else: newest activity first.
    return list.sort((a, b) => {
      if (a.turn === 'us' && b.turn === 'us') {
        if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
        return new Date(a.waitingSince ?? a.createdAt).getTime() - new Date(b.waitingSince ?? b.createdAt).getTime();
      }
      if ((a.turn === 'us') !== (b.turn === 'us')) return a.turn === 'us' ? -1 : 1;
      return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
    });
  }, [all, tab, topic, owner, q, me?.id]);

  const waiting = all.filter((r) => r.turn === 'us');
  const oldest = waiting.reduce<string | null>((o, r) => (r.waitingSince && (!o || r.waitingSince < o) ? r.waitingSince : o), null);
  const privacy = all.filter((r) => r.privacyDueAt).length;
  const topics = [...new Set(all.map((r) => r.category))];

  if (failed && !rows) {
    return (
      <div className="space-y-6">
        <PageHeader title="Support requests" />
        <div className={`${card} p-10 text-center`}>
          <p className="text-sm font-bold text-foreground">Support requests could not be loaded.</p>
          <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
          <button onClick={load} className={`${btnPrimary} mt-4`}>Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Support requests"
        subtitle={!rows ? 'Questions and problems clients raise from their portal.'
          : waiting.length === 0 ? 'No client is waiting for a reply.'
          : `${waiting.length} ${waiting.length === 1 ? 'needs' : 'need'} a reply${oldest ? ` · the oldest has waited ${span(oldest, now)}` : ''}${privacy ? ` · ${privacy} privacy ${privacy === 1 ? 'request' : 'requests'} open` : ''}`}
      />

      <div data-tour="tix-filters" className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map(([key, label]) => <button key={key} onClick={() => setTab(key)} className={chip(tab === key)}>{label} <span className="ml-1 opacity-70">{count(key)}</span></button>)}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:w-72">
            <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search subject, name or email" className={`${field} pl-9`} />
          </div>
          <select value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Topic" className={`${field} sm:w-44`}>
            <option value="">All topics</option>
            {topics.map((t) => <option key={t} value={t}>{TOPIC[t] ?? t}</option>)}
          </select>
          <select value={owner} onChange={(e) => setOwner(e.target.value as typeof owner)} aria-label="Assigned to" className={`${field} sm:w-44`}>
            <option value="all">Everyone’s</option>
            <option value="mine">Assigned to me</option>
            <option value="none">Unassigned</option>
          </select>
        </div>
      </div>

      <div className={`${card} grid overflow-hidden lg:h-[calc(100vh-290px)] lg:min-h-[480px] lg:grid-cols-[360px_1fr]`}>
        {/* ── List ── */}
        <div data-tour="tix-list" className={`${openId ? 'hidden lg:block' : 'block'} overflow-y-auto border-border lg:border-r`}>
          {!rows ? (
            <div className="space-y-2 p-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          ) : shown.length === 0 ? (
            <div className="p-8 text-center">
              <Headset className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
              <p className="text-sm font-bold text-foreground">{q || topic || owner !== 'all' ? 'No requests match.' : tab === 'us' ? 'Nobody is waiting for a reply.' : 'Nothing here.'}</p>
              {!isAdmin && all.length === 0 && <p className="mt-1 text-xs text-muted-foreground">You see requests from your own clients. Privacy requests go to admins.</p>}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {shown.map((r) => {
                const late = overdue(r, now);
                return (
                  <li key={r.id}>
                    <button onClick={() => setOpenId(r.id)} aria-current={openId === r.id} className={`w-full px-4 py-3 text-left transition-colors ${openId === r.id ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <Dot className={r.turn === 'us' ? (late || r.urgent ? 'bg-accent' : 'bg-primary') : r.turn === 'client' ? 'bg-muted-foreground/40' : 'bg-secondary'} />
                          <span className="truncate text-sm font-bold text-foreground">{r.person?.name ?? 'Client'}</span>
                          {r.urgent && <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Urgent</span>}
                        </span>
                        <span className={`shrink-0 text-xs ${late ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                          {r.turn === 'us' && r.waitingSince ? `waited ${span(r.waitingSince, now)}` : r.turn === 'solved' ? 'solved' : `${span(r.lastActivityAt, now)} ago`}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-foreground">{r.subject}</p>
                      {r.preview && <p className="truncate text-xs text-muted-foreground">{r.preview}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {TOPIC[r.category] ?? r.category} · {r.assignedTo ? r.assignedTo.name : 'unassigned'}
                        {r.privacyDueAt && <span className="font-bold text-foreground"> · answer by {day(r.privacyDueAt)}</span>}
                        {r.notes > 0 && <span> · {r.notes} staff {r.notes === 1 ? 'note' : 'notes'}</span>}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── Conversation ── */}
        <div data-tour="tix-thread" className={`${openId ? 'flex' : 'hidden lg:flex'} min-h-0 flex-col`}>
          {openId ? (
            <Conversation
              key={openId}
              id={openId}
              meId={me?.id ?? ''}
              staff={staff}
              now={now}
              caseHref={(engagementId) => (isOfficer ? `/officer/cases/${engagementId}` : `/caseload/${engagementId}`)}
              clientHref={isOfficer ? null : (personId) => `/clients/${personId}`}
              onBack={() => setOpenId(null)}
              onChanged={load}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
              <Headset className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-bold text-foreground">Choose a request to read it.</p>
              <p className="mt-1 text-sm text-muted-foreground">Clients who have waited longest are at the top.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── One request ───────────────────────────────────────────────────────────────

function Conversation({ id, meId, staff, now, caseHref, clientHref, onBack, onChanged }: {
  id: string; meId: string; staff: Staff[]; now: number;
  caseHref: (engagementId: string) => string; clientHref: ((personId: string) => string) | null;
  onBack: () => void; onChanged: () => void;
}) {
  const [d, setD] = useState<Detail | null>(null);
  const [failed, setFailed] = useState(false);
  const [mode, setMode] = useState<'reply' | 'note'>('reply');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const bottom = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setD(await api.getTicket(id) as Detail);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }); }, [d?.replies.length]);

  async function change(key: string, work: () => Promise<unknown>, done: string) {
    setBusy(key);
    try {
      await work();
      if (done) toast.success(done);
      await load();
      onChanged();
    } catch (e: any) {
      toast.error(e.message ?? 'That could not be saved.');
    } finally {
      setBusy('');
    }
  }

  function pick(f: File | undefined) {
    if (!f) return;
    const problem = fileProblem(f);
    if (problem) { toast.error(problem); return; }
    setFile(f);
  }

  async function send(solve: boolean) {
    if (!text.trim() && !file) return;
    setBusy(solve ? 'solve' : 'send');
    try {
      let attachment: { key: string; name: string; type?: string } | undefined;
      if (file) {
        const { url, key } = await api.getTicketUploadUrl(file.name);
        const put = await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'application/octet-stream' } });
        if (!put.ok) throw new Error('The file could not be uploaded. Try again.');
        attachment = { key, name: file.name, type: file.type };
      }
      await api.replyToTicket(id, { content: text.trim(), attachment, internal: mode === 'note', solve: mode === 'reply' && solve });
      setText('');
      setFile(null);
      toast.success(mode === 'note' ? 'Note saved. The client cannot see it.' : solve ? 'Reply sent and request marked solved.' : 'Reply sent. The client has been emailed.');
      await load();
      onChanged();
    } catch (e: any) {
      toast.error(e.message ?? 'The message could not be sent.');
    } finally {
      setBusy('');
    }
  }

  if (failed) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
        <p className="text-sm font-bold text-foreground">This request could not be opened.</p>
        <p className="mt-1 text-sm text-muted-foreground">It may belong to another consultant’s client, or be a privacy request.</p>
        <div className="mt-4 flex gap-2"><button onClick={onBack} className={btnOutline}>Back to the list</button><button onClick={load} className={btnPrimary}>Try again</button></div>
      </div>
    );
  }
  if (!d) return <div className="space-y-3 p-5"><Skeleton className="h-16 rounded-xl" /><Skeleton className="h-40 rounded-xl" /></div>;

  const solved = d.turn === 'solved';
  const late = overdue(d, now);
  const assignees = d.assignedTo && !staff.some((s) => s.id === d.assignedTo!.id) ? [...staff, d.assignedTo] : staff;

  return (
    <>
      <header className="shrink-0 space-y-3 border-b border-border p-4">
        <div className="flex items-start gap-2">
          <button onClick={onBack} aria-label="Back to the list" className="mt-0.5 rounded-lg p-1 text-muted-foreground hover:bg-muted lg:hidden"><ArrowLeft className="h-4 w-4" /></button>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-foreground">{d.subject}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {d.person?.name ?? 'Client'} · {d.person?.email}{d.person?.phone ? ` · ${d.person.phone}` : ''} · {TOPIC[d.category] ?? d.category} · raised {day(d.createdAt)}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs">
              <span className="inline-flex items-center gap-1.5 font-bold text-foreground">
                <Dot className={solved ? 'bg-secondary' : d.turn === 'us' ? (late ? 'bg-accent' : 'bg-primary') : 'bg-muted-foreground/40'} />
                {solved ? 'Solved' : d.turn === 'us' ? `Needs a reply${d.waitingSince ? ` · client has waited ${span(d.waitingSince, now)}` : ''}` : 'Waiting on the client'}
              </span>
              {d.privacyDueAt && <span className="font-bold text-foreground">· Privacy request: answer by {day(d.privacyDueAt)}</span>}
              {d.engagementId && <Link href={caseHref(d.engagementId)} className="font-bold text-primary hover:underline">Open case</Link>}
              {d.person && clientHref && <Link href={clientHref(d.person.id)} className="font-bold text-primary hover:underline">Open client</Link>}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Assigned to
            <select
              value={d.assignedTo?.id ?? ''}
              disabled={!!busy}
              onChange={(e) => change('assign', () => api.assignTicket(id, e.target.value || null), e.target.value ? 'Assigned.' : 'Unassigned.')}
              className="rounded-lg border border-border bg-white px-2 py-1.5 text-xs font-bold text-foreground outline-none focus:border-primary"
            >
              <option value="">Nobody</option>
              {assignees.map((s) => <option key={s.id} value={s.id}>{s.id === meId ? `${s.name} (me)` : s.name}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <input type="checkbox" checked={d.urgent} disabled={!!busy} onChange={(e) => change('urgent', () => api.setTicketUrgent(id, e.target.checked), '')} className="h-4 w-4 accent-[#0F4C81]" /> Urgent
          </label>
          <span className="ml-auto">
            {solved
              ? <button onClick={() => change('status', () => api.updateTicketStatus(id, 'IN_PROGRESS'), 'Reopened.')} disabled={!!busy} className={btnOutline}>Reopen</button>
              : <button onClick={() => change('status', () => api.updateTicketStatus(id, 'RESOLVED'), 'Marked solved. The client has been emailed.')} disabled={!!busy} className={btnOutline}>{busy === 'status' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} Mark solved</button>}
          </span>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted/20 p-4">
        {d.replies.map((r) => {
          const fromClient = r.authorRole === 'CLIENT';
          return (
            <div key={r.id} className={`flex ${fromClient ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${r.internal ? 'border border-dashed border-muted-foreground/40 bg-muted' : fromClient ? 'border border-border bg-white' : 'bg-primary/10'}`}>
                <p className="text-[11px] font-bold text-muted-foreground">
                  {r.internal && <span className="uppercase tracking-wide text-foreground">Note for staff · </span>}
                  {r.authorName ?? (fromClient ? 'Client' : 'Staff')}{r.authorId === meId ? ' (me)' : ''} · {dayTime(r.createdAt)}
                </p>
                {r.content && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">{r.content}</p>}
                {r.attachment && (
                  <button onClick={() => openFile(r.id)} className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-muted/60">
                    <FileText className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{r.attachment.name}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      <footer className="shrink-0 space-y-2 border-t border-border p-4">
        <div className="flex gap-2" role="tablist" aria-label="What to write">
          <button role="tab" aria-selected={mode === 'reply'} onClick={() => setMode('reply')} className={chip(mode === 'reply')}>Reply to client</button>
          <button role="tab" aria-selected={mode === 'note'} onClick={() => setMode('note')} className={chip(mode === 'note')}>Note for staff</button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={5000}
          aria-label={mode === 'note' ? 'Note for staff' : 'Reply to the client'}
          placeholder={mode === 'note' ? 'Only staff can see this. The client is not told.' : 'Write a reply. The client is emailed.'}
          className={`${field} ${mode === 'note' ? 'border-dashed bg-muted/40' : ''}`}
        />
        {file && (
          <p className="flex items-center gap-2 text-xs text-foreground">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" /> <span className="truncate">{file.name}</span>
            <button onClick={() => setFile(null)} aria-label="Remove the file" className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <input ref={fileInput} type="file" accept={FILE_ACCEPT} className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
            <button onClick={() => fileInput.current?.click()} disabled={!!busy} className={btnOutline}><Plus className="h-3.5 w-3.5" /> Attach a file</button>
          </div>
          <div className="flex gap-2">
            {mode === 'reply' && !solved && (
              <button onClick={() => send(true)} disabled={!!busy || (!text.trim() && !file)} className={btnOutline}>{busy === 'solve' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} Send and mark solved</button>
            )}
            <button onClick={() => send(false)} disabled={!!busy || (!text.trim() && !file)} className={btnPrimary}>
              {busy === 'send' ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <PaperPlaneTilt className="h-3.5 w-3.5" />} {mode === 'note' ? 'Save note' : 'Send reply'}
            </button>
          </div>
        </div>
        {solved && mode === 'reply' && <p className="text-xs text-muted-foreground">This request is solved. A reply is still emailed to the client but does not reopen it.</p>}
      </footer>
    </>
  );
}
