'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Skeleton } from '@mjn/ui';
import {
  ArrowLeft, Envelope, Phone, Globe, CheckCircle, CircleNotch, DotsThree, X, Plus, Trash,
  PaperPlaneRight, Paperclip, FileText, UploadSimple, Note, Sparkle, Lock, Warning, ArrowDown,
  ChatCircle, Check, ArrowSquareOut, CurrencyDollar, Flag, BookOpen, Clock,
} from '@mjn/ui';
import { api } from '../../../../lib/api';
import { useAdmin } from '../../../../contexts/admin-context';
import { MessageBody } from '../../../../components/message-body';

// ── Constants and helpers ─────────────────────────────────────────────────────

const STATUS: Record<string, { label: string; dot: string }> = {
  PENDING_SIGNATURE: { label: 'Awaiting signature', dot: 'bg-accent' },
  ACTIVE:            { label: 'Active',             dot: 'bg-secondary' },
  ON_HOLD:           { label: 'On hold',            dot: 'bg-muted-foreground/50' },
  COMPLETED:         { label: 'Completed',          dot: 'bg-primary' },
  TERMINATED:        { label: 'Terminated',         dot: 'bg-rose-500' },
};

const DOC_STATUS: Record<string, { label: string; dot: string }> = {
  PENDING:        { label: 'Waiting for review', dot: 'bg-accent' },
  VERIFIED:       { label: 'Verified',           dot: 'bg-secondary' },
  REJECTED:       { label: 'Rejected',           dot: 'bg-rose-500' },
  PENDING_CLIENT: { label: 'With client',        dot: 'bg-primary/40' },
};

const ORDER_STATUS: Record<string, { label: string; dot: string }> = {
  PAID:           { label: 'Paid',      dot: 'bg-secondary' },
  PENDING:        { label: 'Due',       dot: 'bg-accent' },
  PARTIALLY_PAID: { label: 'Part paid', dot: 'bg-accent' },
};

const QUICK_REPLIES = [
  'Documents verified and approved.',
  'Please upload the requested document.',
  'Your case is progressing well.',
  'We need to schedule a call.',
  'We are awaiting your payment to proceed.',
];

const DOC_REQUESTS = [
  { label: 'Passport', text: 'Please upload a clear copy of your international passport (biographic page) to your document vault.' },
  { label: 'Nursing licence', text: 'Please upload your current nursing licence or registration certificate to your document vault.' },
  { label: 'Educational certificate', text: 'Please upload your nursing or medical school certificate and transcripts to your document vault.' },
  { label: 'Experience letter', text: 'Please upload an official work experience letter from your current or previous employer to your document vault.' },
  { label: 'DataFlow verification', text: 'To proceed with your DataFlow verification, please upload all required credentials to your document vault and confirm your profession type.' },
];

const CHECKLISTS: { group: string; options: [string, string][] }[] = [
  { group: 'UAE', options: [['UAE_DATAFLOW_NURSE', 'UAE DataFlow — Nurse'], ['UAE_DATAFLOW_PHYSICIAN', 'UAE DataFlow — Physician'], ['UAE_DHA', 'UAE DHA (Dubai Health Authority)'], ['UAE_MOH_DOH', 'UAE MOH / DOH']] },
  { group: 'United Kingdom', options: [['UK_NMC', 'UK NMC Registration']] },
  { group: 'United States', options: [['US_NCLEX_CGFNS', 'US NCLEX-RN / CGFNS']] },
  { group: 'Ireland', options: [['IRELAND_NMBI', 'Ireland NMBI Registration']] },
];

const TABS = ['overview', 'documents', 'payments', 'messages', 'activity', 'study'] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = {
  overview: 'Overview', documents: 'Documents', payments: 'Payments', messages: 'Messages', activity: 'Activity', study: 'Study plan',
};

function title(s?: string | null) {
  return (s ?? '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
function day(date?: string | null) {
  return date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}
function ago(date?: string | null) {
  if (!date) return '—';
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 60) return `${days} days ago`;
  return day(date);
}
function caseRef(id: string) {
  return `ENG-${id.slice(-6).toUpperCase()}`;
}
function money(n: number) {
  return `$${Number(n ?? 0).toLocaleString('en-US')}`;
}
function Dot({ className }: { className: string }) {
  return <span className={`h-2 w-2 shrink-0 rounded-full ${className}`} />;
}

const card = 'rounded-2xl border border-border bg-white';
const btnPrimary = 'inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-40';
const btnOutline = 'inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted/60 disabled:opacity-40';
const field = 'w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

// ── Small building blocks ─────────────────────────────────────────────────────

function Modal({ title: heading, sub, onClose, children, wide }: { title: string; sub?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={heading} className={`w-full ${wide ? 'max-w-xl' : 'max-w-md'} rounded-2xl border border-border bg-white p-6 shadow-xl`} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-foreground">{heading}</h2>
            {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Section({ title: heading, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{heading}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <Icon className="mb-2 h-8 w-8 text-muted-foreground/30" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function bestDocStatus(docs: any[], type: string): string | null {
  const mine = docs.filter((d) => d.type === type || d.neededFor === type).map((d) => d.status);
  for (const s of ['VERIFIED', 'PENDING', 'REJECTED']) if (mine.includes(s)) return s;
  return null;
}

// ── Chat ──────────────────────────────────────────────────────────────────────

function Chat({
  eid, personName, staffName, documents, inject, onSent,
}: {
  eid: string; personName: string; staffName: string; documents: any[];
  inject: { text: string; id: number } | null; onSent: () => void;
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [compose, setCompose] = useState('');
  const [sending, setSending] = useState(false);
  const [attach, setAttach] = useState<null | 'refer' | 'request'>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [newBanner, setNewBanner] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const composeRef = useRef<HTMLTextAreaElement>(null);
  const count = useRef(0);
  const bottomState = useRef(true);
  bottomState.current = atBottom;

  const toBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  const load = useCallback(async (silent = false) => {
    try {
      const list = (await api.getEngagementMessages(eid)) ?? [];
      if (silent && list.length > count.current) {
        if (bottomState.current) setTimeout(toBottom, 50); else setNewBanner(true);
      }
      count.current = list.length;
      setMessages(list);
      if (!silent) setTimeout(toBottom, 100);
    } catch { /* keep what is on screen */ } finally {
      if (!silent) setLoading(false);
    }
  }, [eid]);

  useEffect(() => {
    load();
    const timer = setInterval(() => load(true), 20_000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (inject) { setCompose(inject.text); composeRef.current?.focus(); }
  }, [inject]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAtBottom(near);
    if (near) setNewBanner(false);
  }

  async function send() {
    const content = compose.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      await api.sendEngagementMessage(eid, content);
      setCompose(''); setAttach(null);
      await load(true);
      setTimeout(toBottom, 50);
      onSent();
    } catch (e: any) {
      toast.error(e.message ?? 'The message was not sent.');
    } finally {
      setSending(false);
    }
  }

  const rows = useMemo(() => messages.map((msg, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const d = new Date(msg.createdAt);
    const newDay = !prev || new Date(prev.createdAt).toDateString() !== d.toDateString();
    const today = new Date().toDateString() === d.toDateString();
    return {
      msg,
      dayLabel: newDay ? (today ? 'Today' : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })) : '',
      last: !next || next.senderType !== msg.senderType || next.senderId !== msg.senderId,
    };
  }), [messages]);

  return (
    <div data-tour="case-messages" className={`${card} flex h-[calc(100vh-22rem)] min-h-[28rem] flex-col overflow-hidden`}>
      <div ref={scrollRef} onScroll={onScroll} className="relative min-h-0 flex-1 space-y-0.5 overflow-y-auto bg-muted/40 px-4 py-4">
        {loading ? (
          <div className="flex h-full items-center justify-center"><CircleNotch className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <ChatCircle className="mb-3 h-10 w-10 text-muted-foreground/30" weight="fill" />
            <p className="text-sm font-semibold text-foreground">No messages yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Start the conversation with {personName} below.</p>
          </div>
        ) : (
          <>
            {rows.map(({ msg, dayLabel, last }) => {
              const staff = msg.senderType !== 'CLIENT';
              return (
                <div key={msg.id}>
                  {dayLabel && (
                    <div className="my-3 flex justify-center">
                      <span className="rounded-full border border-border/60 bg-white px-3 py-1 text-xs font-medium text-muted-foreground">{dayLabel}</span>
                    </div>
                  )}
                  <div className={`mb-0.5 flex items-end gap-1.5 ${staff ? 'flex-row-reverse' : ''}`}>
                    <div className="h-7 w-7 shrink-0">
                      {last && (
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${staff ? 'bg-primary' : 'bg-secondary'}`}>
                          {(staff ? (msg.sender?.name ?? staffName) : personName).slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className={`max-w-[72%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${staff ? 'rounded-br-sm bg-primary text-white' : 'rounded-bl-sm border border-border/60 bg-white text-foreground'}`}>
                      <MessageBody msg={msg} onDark={staff} />
                      {last && (
                        <p className={`mt-1 flex items-center gap-1 text-[11px] ${staff ? 'justify-end text-white/60' : 'text-muted-foreground'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          {staff && (msg.readAt ? <CheckCircle className="h-3 w-3" weight="fill" /> : <Check className="h-3 w-3" />)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
        {newBanner && (
          <div className="sticky bottom-2 flex justify-center">
            <button onClick={() => { toBottom(); setNewBanner(false); }} className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-white shadow-lg">
              <ArrowDown className="h-3.5 w-3.5" /> New messages
            </button>
          </div>
        )}
      </div>

      <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-border/70 bg-white px-4 py-2">
        {QUICK_REPLIES.map((text) => (
          <button key={text} onClick={() => { setCompose(text); composeRef.current?.focus(); }} className="shrink-0 whitespace-nowrap rounded-full border border-border px-3 py-1 text-xs text-foreground hover:border-primary/40 hover:bg-muted/60">
            {text}
          </button>
        ))}
      </div>

      {attach && (
        <div className="shrink-0 border-t border-border bg-white">
          <div className="flex border-b border-border">
            {([['refer', 'Refer to a document on file', FileText], ['request', 'Request a document', UploadSimple]] as const).map(([key, label, Icon]) => (
              <button key={key} onClick={() => setAttach(key)} className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-xs font-bold ${attach === key ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
          <div className="max-h-40 divide-y divide-border/60 overflow-y-auto">
            {attach === 'refer' && (documents.length === 0
              ? <p className="py-5 text-center text-xs text-muted-foreground">This client has no documents on file.</p>
              : documents.map((d) => (
                <button
                  key={d.id}
                  // The message names the document; it never carries a link to the file itself.
                  onClick={() => { setCompose(`Regarding your document on file: ${title(d.type)} (uploaded ${day(d.uploadedAt)}).\n`); setAttach(null); composeRef.current?.focus(); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/40"
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">{title(d.type)}</span>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground"><Dot className={DOC_STATUS[d.status]?.dot ?? 'bg-muted'} /> {DOC_STATUS[d.status]?.label ?? title(d.status)}</span>
                </button>
              )))}
            {attach === 'request' && DOC_REQUESTS.map((t) => (
              <button key={t.label} onClick={() => { setCompose(t.text); setAttach(null); composeRef.current?.focus(); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/40">
                <UploadSimple className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-foreground">{t.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{t.text}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex shrink-0 items-end gap-2 border-t border-border bg-white px-4 py-3">
        <button
          onClick={() => setAttach((v) => (v ? null : 'request'))}
          aria-label="Request or refer to a document"
          title="Request or refer to a document"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${attach ? 'bg-primary text-white' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'}`}
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <textarea
          ref={composeRef}
          id="case-compose"
          value={compose}
          onChange={(e) => setCompose(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={`Message ${personName}. Enter to send, Shift+Enter for a new line.`}
          rows={compose.split('\n').length > 2 || compose.length > 160 ? 3 : 1}
          className="max-h-32 min-h-10 flex-1 resize-none rounded-2xl border border-border bg-muted/40 px-4 py-2.5 text-sm leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button onClick={send} disabled={!compose.trim() || sending} aria-label="Send" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 disabled:opacity-40">
          {sending ? <CircleNotch className="h-4 w-4 animate-spin" /> : <PaperPlaneRight className="h-4 w-4" weight="fill" />}
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { me } = useAdmin();
  const role = (me?.role as string)?.toUpperCase() ?? '';
  const isAdmin = role === 'ADMIN';
  const canAssignOfficer = isAdmin || role === 'CONSULTANT';
  const staffName = me?.name || me?.email || 'Staff';

  const [engagement, setEngagement] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [ctx, setCtx] = useState<any>(null);
  const [consultants, setConsultants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTabState] = useState<Tab>('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState('');

  // Dialogs
  const [dialog, setDialog] = useState<null | 'checklist' | 'status' | 'consultant' | 'officer' | 'summary'>(null);
  const [checklist, setChecklist] = useState('UAE_DATAFLOW_NURSE');
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');
  const [pickConsultant, setPickConsultant] = useState('');
  const [officers, setOfficers] = useState<any[]>([]);
  const [pickOfficer, setPickOfficer] = useState('');
  const [completing, setCompleting] = useState<any | null>(null);
  const [summaryText, setSummaryText] = useState('');
  const [aiDraft, setAiDraft] = useState<{ draftId: string; draft: string } | null>(null);
  const [inject, setInject] = useState<{ text: string; id: number } | null>(null);

  // Stages
  const [stageLabel, setStageLabel] = useState('');
  const [addingStage, setAddingStage] = useState(false);

  // Activity and study plan
  const [activity, setActivity] = useState<any>(null);
  const [activityFilter, setActivityFilter] = useState('all');
  const [studyPlan, setStudyPlan] = useState<any>(null);
  const [planItems, setPlanItems] = useState<{ topic: string; dueDate: string }[] | null>(null);

  const eid: string | undefined = engagement?.id;
  const person = engagement?.person ?? {};

  const setTab = useCallback((next: Tab) => {
    setTabState(next);
    try { window.history.replaceState(null, '', `${window.location.pathname}${next === 'overview' ? '' : `?tab=${next}`}`); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('tab') as Tab | null;
    if (wanted && TABS.includes(wanted)) setTabState(wanted);
  }, []);

  const refreshSummary = useCallback(async (engagementId: string, personId?: string) => {
    const [s, c] = await Promise.allSettled([
      api.getEngagementSummary(engagementId),
      personId ? api.getDocumentReviewContext(personId) : Promise.resolve(null),
    ]);
    if (s.status === 'fulfilled') setSummary(s.value);
    if (c.status === 'fulfilled' && c.value) setCtx(c.value);
  }, []);

  const load = useCallback(async () => {
    try {
      let eng: any = null;
      try {
        eng = await api.getEngagementById(id);
      } catch {
        // The link may carry a client id (for example from the leads page): open that client's case.
        const list = await api.getClientEngagements(id).catch(() => []);
        eng = (list ?? []).find((e: any) => e.status === 'ACTIVE') ?? list?.[0] ?? null;
        if (eng) eng = await api.getEngagementById(eng.id);
      }
      if (!eng) { setError('No case was found. It may not exist, or you may not have access to it.'); return; }
      setEngagement(eng);
      await refreshSummary(eng.id, eng.person?.id);
      if (eng.person?.id) api.getStudyPlan(eng.person.id).then(setStudyPlan).catch(() => {});
    } finally {
      setLoading(false);
    }
  }, [id, refreshSummary]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.getConsultants(true).then((l) => setConsultants(l ?? [])).catch(() => {}); }, []);

  useEffect(() => {
    if (tab === 'activity' && eid && !activity) api.getOfficerActivity(eid).then(setActivity).catch(() => setActivity({ timeline: [] }));
  }, [tab, eid, activity]);

  async function run(key: string, action: () => Promise<any>, done?: string) {
    setBusy(key);
    try {
      await action();
      if (done) toast.success(done);
      return true;
    } catch (e: any) {
      toast.error(e.message ?? 'That did not work. Please try again.');
      return false;
    } finally {
      setBusy('');
    }
  }

  const reload = () => load();

  async function sendLetter() {
    if (eid) await run('letter', () => api.sendEngagementLetter(eid).then(reload), 'Engagement letter sent to the client.');
  }
  async function sendChecklist() {
    if (!eid) return;
    if (await run('checklist', () => api.sendDocumentChecklist(eid, checklist), 'Checklist sent by email and posted in the chat.')) setDialog(null);
  }
  async function changeStatus() {
    if (!eid || !newStatus) return;
    if (await run('status', () => api.updateEngagementStatus(eid, newStatus, reason.trim() || undefined).then(reload), 'Status updated.')) {
      setDialog(null); setNewStatus(''); setReason(''); setActivity(null);
    }
  }
  async function assignConsultant() {
    if (!eid || !pickConsultant) return;
    if (await run('consultant', () => api.assignConsultant(eid, pickConsultant).then(reload), 'Consultant assigned.')) { setDialog(null); setPickConsultant(''); }
  }
  async function assignOfficer() {
    if (!eid) return;
    if (await run('officer', () => api.assignOfficer(eid, pickOfficer || null).then(reload), pickOfficer ? 'Officer assigned.' : 'Officer removed.')) setDialog(null);
  }
  async function completeStage() {
    if (!completing) return;
    if (await run('stage', () => api.completeMilestone(completing.id).then(reload), 'Stage marked complete.')) setCompleting(null);
  }
  async function addStage() {
    if (!eid || !stageLabel.trim()) return;
    if (await run('addStage', () => api.addMilestone(eid, stageLabel.trim()).then(reload))) { setStageLabel(''); setAddingStage(false); }
  }
  async function summarise() {
    if (!eid) return;
    setMenuOpen(false); setSummaryText(''); setDialog('summary');
    await run('summary', async () => { setSummaryText((await api.summariseCase(eid)).summary ?? ''); });
  }
  async function draftUpdate() {
    if (!eid) return;
    setMenuOpen(false);
    await run('draft', async () => { setAiDraft(await api.draftClientUpdate(eid)); });
  }
  async function savePlan() {
    const items = (planItems ?? []).filter((i) => i.topic.trim());
    if (!person.id || items.length === 0) return;
    if (await run('plan', async () => {
      setStudyPlan(await api.createStudyPlan(person.id, items.map((i) => ({ topic: i.topic.trim(), dueDate: i.dueDate || undefined }))));
    }, 'Study plan saved.')) setPlanItems(null);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-14 rounded-2xl" />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }
  if (!engagement || !eid) {
    return (
      <div className={`${card} p-10 text-center`}>
        <h3 className="font-bold text-foreground">Case not found</h3>
        <p className="mt-1 text-sm text-muted-foreground">{error || 'This case could not be loaded.'}</p>
        <Link href="/caseload" className="mt-4 inline-block text-sm font-bold text-primary hover:underline">Back to caseload</Link>
      </div>
    );
  }

  const milestones: any[] = engagement.milestones ?? [];
  const orders: any[] = engagement.orders ?? [];
  const documents: any[] = ctx?.documents ?? [];
  const required: string[] = ctx?.requiredDocTypes ?? [];
  const done = milestones.filter((m) => m.completedAt).length;
  const currentStage = milestones.find((m) => !m.completedAt) ?? null;
  const paid = summary?.paid ?? 0;
  const total = summary?.total ?? 0;
  const needs: { key: string; label: string }[] = summary?.needs ?? [];
  const closed = engagement.status === 'COMPLETED' || engagement.status === 'TERMINATED';
  const consultantName = summary?.consultantName ?? consultants.find((c) => c.id === engagement.consultantId)?.name ?? null;
  const pendingDocs = documents.filter((d) => d.status === 'PENDING');
  const firstPendingDoc = pendingDocs[0];

  // The single most useful thing to do next on this case.
  const first = needs[0];
  const nextStep: { text: string; action?: { label: string; run: () => void } } | null =
    closed ? { text: `This case is ${STATUS[engagement.status].label.toLowerCase()}.` }
    : !first ? null
    : first.key === 'escalation' ? { text: 'This case has an open escalation from a processing officer.', action: { label: 'See activity', run: () => setTab('activity') } }
    : first.key === 'message' ? { text: `${person.name ?? 'The client'} is waiting for a reply.`, action: { label: 'Reply', run: () => setTab('messages') } }
    : first.key === 'documents' ? { text: `${pendingDocs.length || ''} document${pendingDocs.length === 1 ? ' is' : 's are'} waiting for review.`.trim(), action: { label: 'Review documents', run: () => setTab('documents') } }
    : first.key === 'consultant' ? { text: 'No consultant is assigned to this case.', action: isAdmin ? { label: 'Assign consultant', run: () => setDialog('consultant') } : undefined }
    : first.key === 'letter' ? { text: 'The engagement letter is not signed. The client cannot pay until it is.', action: isAdmin ? { label: 'Send letter', run: sendLetter } : undefined }
    : first.key === 'payment' ? { text: `${first.label}.`, action: { label: 'View payments', run: () => setTab('payments') } }
    : { text: `The client needs to replace ${first.label.replace(' to replace', '')}.`, action: { label: 'View documents', run: () => setTab('documents') } };

  const tabBadge: Partial<Record<Tab, ReactNode>> = {
    documents: pendingDocs.length > 0 ? <span className="ml-1.5 rounded-full bg-accent px-1.5 text-xs font-bold text-accent-foreground">{pendingDocs.length}</span> : null,
    messages: needs.some((n) => n.key === 'message') ? <Dot className="ml-1.5 inline-block bg-accent" /> : null,
  };

  // One merged history for the Activity tab.
  type Entry = { id: string; kind: string; at: Date; label: string; sub?: string; internal?: boolean };
  const entries: Entry[] = [
    { id: 'opened', kind: 'stages', at: new Date(engagement.createdAt), label: 'Case opened' },
    ...(engagement.letterSignedAt ? [{ id: 'letter', kind: 'stages', at: new Date(engagement.letterSignedAt), label: 'Engagement letter signed' }] : []),
    ...milestones.filter((m) => m.completedAt).map((m) => ({ id: `m${m.id}`, kind: 'stages', at: new Date(m.completedAt), label: `Stage completed · ${m.label}` })),
    ...orders.map((o) => ({ id: `o${o.id}`, kind: 'payments', at: new Date(o.createdAt), label: `Order ${o.status === 'PAID' ? 'paid' : 'created'} · ${money(o.total)}` })),
    ...documents.map((d) => ({ id: `d${d.id}`, kind: 'documents', at: new Date(d.uploadedAt), label: `${title(d.type)} uploaded`, sub: DOC_STATUS[d.status]?.label })),
    ...((activity?.timeline ?? []) as any[]).map((t: any, i: number): Entry => t.type === 'note'
      ? { id: `n${t.data.id ?? i}`, kind: 'notes', at: new Date(t.ts), label: `Note · ${t.data.author?.name ?? 'Staff'}`, sub: t.data.content, internal: t.data.isInternal }
      : t.type === 'tracking'
        ? { id: `t${t.data.id ?? i}`, kind: 'submissions', at: new Date(t.ts), label: `Submission · ${t.data.portal} · ${title(t.data.status)}`, sub: [t.data.referenceNumber && `Ref ${t.data.referenceNumber}`, t.data.notes].filter(Boolean).join(' · ') }
        : { id: `e${t.data.id ?? i}`, kind: 'escalations', at: new Date(t.ts), label: `Escalation · ${title(t.data.status)}`, sub: [t.data.reason, t.data.resolution && `Resolution: ${t.data.resolution}`].filter(Boolean).join(' · ') }),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());
  const shownEntries = activityFilter === 'all' ? entries : entries.filter((e) => e.kind === activityFilter);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div data-tour="case-header" className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/caseload" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Caseload
          </Link>
          <h1 data-tour="page-title" className="mt-1 truncate text-xl font-bold text-foreground">{person.name ?? 'Case'}</h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {person.profession && <span>{title(person.profession)}</span>}
            <span className="font-mono">{caseRef(eid)}</span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
              <Dot className={STATUS[engagement.status]?.dot ?? 'bg-muted'} /> {STATUS[engagement.status]?.label ?? title(engagement.status)}
            </span>
          </p>
        </div>
        <div className="relative flex items-center gap-2">
          <button onClick={() => setTab('messages')} className={btnPrimary}><Envelope className="h-4 w-4" /> Message</button>
          <button onClick={() => setDialog('checklist')} className={btnOutline}><FileText className="h-4 w-4" /> Send checklist</button>
          <button onClick={() => setMenuOpen((v) => !v)} aria-label="More actions" aria-expanded={menuOpen} className={`${btnOutline} px-2.5`}><DotsThree className="h-4 w-4" /></button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-xl">
                {[
                  { label: 'AI summary of this case', icon: Sparkle, show: true, run: summarise },
                  { label: busy === 'draft' ? 'Drafting…' : 'AI draft update for client', icon: Note, show: true, run: draftUpdate },
                  { label: engagement.consultantId ? 'Reassign consultant' : 'Assign consultant', icon: Flag, show: isAdmin, run: () => { setMenuOpen(false); setDialog('consultant'); } },
                  { label: engagement.officerId ? 'Change officer' : 'Assign officer', icon: Flag, show: canAssignOfficer, run: () => { setMenuOpen(false); setPickOfficer(engagement.officerId ?? ''); setDialog('officer'); api.listOfficers().then((l) => setOfficers(l ?? [])).catch(() => {}); } },
                  { label: 'Change status', icon: Flag, show: isAdmin, run: () => { setMenuOpen(false); setNewStatus(''); setReason(''); setDialog('status'); } },
                ].filter((i) => i.show).map((item) => (
                  <button key={item.label} onClick={item.run} className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-foreground hover:bg-muted/60">
                    <item.icon className="h-4 w-4 text-muted-foreground" /> {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Next step */}
      <div data-tour="case-next" className={`${card} flex flex-wrap items-center justify-between gap-3 px-5 py-3.5`}>
        {nextStep ? (
          <>
            <p className="flex min-w-0 items-center gap-2.5 text-sm text-foreground">
              <span className="shrink-0 text-xs font-bold uppercase tracking-widest text-muted-foreground">Next step</span>
              {!closed && <Dot className="bg-accent" />}
              <span className="font-semibold">{nextStep.text}</span>
            </p>
            {nextStep.action && (
              <button onClick={nextStep.action.run} disabled={busy === 'letter'} className={btnPrimary}>
                {busy === 'letter' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} {nextStep.action.label}
              </button>
            )}
          </>
        ) : (
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CheckCircle className="h-4 w-4 text-secondary" weight="fill" />
            {summary?.quiet ? `Nothing is waiting, but there has been no recorded activity since ${ago(summary.lastActivityAt)}.` : 'Nothing is waiting on this case.'}
          </p>
        )}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        {/* Main column */}
        <div className="min-w-0 space-y-4">
          <div data-tour="case-tabs" className="flex gap-1 overflow-x-auto border-b border-border">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`-mb-px flex shrink-0 items-center whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                {TAB_LABEL[t]}{tabBadge[t]}
              </button>
            ))}
          </div>

          {/* ── Overview ── */}
          {tab === 'overview' && (
            <div className={`${card} space-y-6 p-5`}>
              <Section
                title="Stages"
                action={milestones.length > 0 ? <span className="text-xs font-semibold text-muted-foreground">{currentStage ? `Stage ${done + 1} of ${milestones.length}` : `All ${milestones.length} complete`}</span> : undefined}
              >
                {milestones.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No stages yet. Add the steps of this case so the client can follow their progress.</p>
                ) : (
                  <>
                    <div className="mb-4 flex gap-1">
                      {milestones.map((m) => (
                        <div key={m.id} title={m.label} className={`h-2 flex-1 rounded-full ${m.completedAt ? 'gradient-hero' : m.id === currentStage?.id ? 'bg-primary/30' : 'bg-muted'}`} />
                      ))}
                    </div>
                    <div className="divide-y divide-border/70">
                      {milestones.map((m) => {
                        const isCurrent = m.id === currentStage?.id;
                        return (
                          <div key={m.id} className="flex items-center gap-3 py-2.5">
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${m.completedAt ? 'bg-secondary text-white' : isCurrent ? 'border-2 border-primary' : 'border-2 border-border'}`}>
                              {m.completedAt && <Check className="h-3 w-3" />}
                            </span>
                            <span className={`min-w-0 flex-1 truncate text-sm ${m.completedAt ? 'text-muted-foreground' : isCurrent ? 'font-bold text-foreground' : 'text-foreground'}`}>{m.label}</span>
                            {m.completedAt
                              ? <span className="shrink-0 text-xs text-muted-foreground">{day(m.completedAt)}</span>
                              : isCurrent && !closed
                                ? <button onClick={() => setCompleting(m)} className={btnOutline}>Mark complete</button>
                                : null}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                {!closed && (addingStage ? (
                  <div className="mt-3 flex gap-2">
                    <input id="new-stage" value={stageLabel} onChange={(e) => setStageLabel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addStage()} placeholder="Stage name, for example DataFlow submitted" className={field} autoFocus />
                    <button onClick={addStage} disabled={!stageLabel.trim() || busy === 'addStage'} className={btnPrimary}>Add</button>
                    <button onClick={() => { setAddingStage(false); setStageLabel(''); }} className={btnOutline}>Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setAddingStage(true)} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"><Plus className="h-3.5 w-3.5" /> Add stage</button>
                ))}
              </Section>

              {required.length > 0 && (
                <Section title={`This stage needs${ctx?.stage?.label ? ` · ${ctx.stage.label}` : ''}`}>
                  <div className="divide-y divide-border/70">
                    {required.map((type) => {
                      const s = bestDocStatus(documents, type);
                      const doc = documents.find((d) => (d.type === type || d.neededFor === type) && d.status === 'PENDING');
                      return (
                        <div key={type} className="flex items-center gap-3 py-2.5">
                          <Dot className={s ? DOC_STATUS[s].dot : 'border border-muted-foreground/50'} />
                          <span className="min-w-0 flex-1 truncate text-sm text-foreground">{title(type)}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">{s ? DOC_STATUS[s].label : 'Not uploaded'}</span>
                          {doc && <Link href={`/documents?doc=${doc.id}`} className={btnOutline}>Review</Link>}
                          {!s && <button onClick={() => { setInject({ text: `Please upload your ${title(type).toLowerCase()} to your document vault.`, id: Date.now() }); setTab('messages'); }} className={btnOutline}>Request</button>}
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}
            </div>
          )}

          {/* ── Documents ── */}
          {tab === 'documents' && (
            <div className={`${card} overflow-hidden`}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
                <p className="text-sm font-semibold text-foreground">
                  {documents.filter((d) => d.status === 'VERIFIED').length} of {documents.length} verified
                  <span className="ml-2 font-normal text-muted-foreground">{pendingDocs.length} waiting · {documents.filter((d) => d.status === 'REJECTED').length} rejected</span>
                </p>
                {firstPendingDoc && <Link href={`/documents?doc=${firstPendingDoc.id}`} className={btnPrimary}>Review waiting documents</Link>}
              </div>
              {documents.length === 0 ? <Empty icon={FileText} text="This client has not uploaded any documents yet." /> : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[34rem] text-sm">
                    <thead className="border-b border-border bg-muted/40 text-left text-xs font-semibold text-muted-foreground">
                      <tr><th className="px-5 py-2.5">Document</th><th className="px-4 py-2.5">Uploaded</th><th className="px-4 py-2.5">Expiry</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5" /></tr>
                    </thead>
                    <tbody className="divide-y divide-border/70">
                      {documents.map((d) => {
                        const left = d.expiryDate ? Math.ceil((new Date(d.expiryDate).getTime() - Date.now()) / 86400000) : null;
                        return (
                          <tr key={d.id}>
                            <td className="px-5 py-3 font-semibold text-foreground">{title(d.type)}{(d.neededFor || required.includes(d.type)) && <span className="ml-2 text-xs font-medium text-muted-foreground">needed for this stage</span>}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{ago(d.uploadedAt)}</td>
                            <td className="px-4 py-3 text-xs">
                              {left === null ? <span className="text-muted-foreground">—</span>
                                : left < 0 ? <span className="inline-flex items-center gap-1.5 font-semibold text-foreground"><Dot className="bg-rose-500" /> Expired</span>
                                : left <= 30 ? <span className="inline-flex items-center gap-1.5 font-semibold text-foreground"><Dot className="bg-accent" /> {left} days left</span>
                                : <span className="text-muted-foreground">{day(d.expiryDate)}</span>}
                            </td>
                            <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-foreground"><Dot className={DOC_STATUS[d.status]?.dot ?? 'bg-muted'} /> {DOC_STATUS[d.status]?.label ?? title(d.status)}</span></td>
                            <td className="px-4 py-3 text-right">{d.status === 'PENDING' && <Link href={`/documents?doc=${d.id}`} className={btnOutline}>Review</Link>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex flex-wrap gap-2 border-t border-border px-5 py-3">
                <button onClick={() => setTab('messages')} className={btnOutline}><UploadSimple className="h-3.5 w-3.5" /> Request a document</button>
                <button onClick={() => setDialog('checklist')} className={btnOutline}><FileText className="h-3.5 w-3.5" /> Send document checklist</button>
              </div>
            </div>
          )}

          {/* ── Payments ── */}
          {tab === 'payments' && (
            <div className={`${card} overflow-hidden`}>
              <div className="border-b border-border px-5 py-4">
                <div className="mb-2 flex items-end justify-between">
                  <p className="text-sm text-muted-foreground"><span className="text-xl font-extrabold text-foreground">{money(paid)}</span> paid of {money(total)}</p>
                  <span className="text-sm font-bold text-foreground">{total > 0 ? Math.round((paid / total) * 100) : 0}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${total > 0 && paid >= total ? 'bg-secondary' : 'gradient-hero'}`} style={{ width: `${total > 0 ? Math.min(100, (paid / total) * 100) : 0}%` }} />
                </div>
              </div>
              {orders.length === 0 ? <Empty icon={CurrencyDollar} text="No orders yet for this case." /> : (
                <div className="divide-y divide-border/70">
                  {orders.map((o) => (
                    <div key={o.id} className="px-5 py-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">Order · {day(o.createdAt)}{o.paymentMode ? ` · ${title(o.paymentMode)}` : ''}</p>
                        <p className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground"><Dot className={ORDER_STATUS[o.status]?.dot ?? 'bg-muted'} /> {ORDER_STATUS[o.status]?.label ?? title(o.status)}</span>
                          <span className="text-base font-extrabold text-foreground">{money(o.total)}</span>
                        </p>
                      </div>
                      <div className="space-y-1">
                        {(o.lineItems ?? []).map((li: any) => (
                          <p key={li.id} className="flex justify-between gap-3 text-sm text-foreground"><span className="min-w-0 truncate">{li.serviceItem?.name ?? 'Service'}</span><span className="shrink-0 tabular-nums text-muted-foreground">{money(li.priceCharged)}</span></p>
                        ))}
                        {(o.installmentSchedules ?? []).map((inst: any) => (
                          <p key={inst.id} className="flex justify-between gap-3 text-xs text-muted-foreground">
                            <span>Instalment {inst.installmentNo}</span>
                            <span className="inline-flex items-center gap-1.5"><Dot className={inst.status === 'PAID' ? 'bg-secondary' : 'bg-accent'} /> {title(inst.status)} · {money(inst.amount)}</span>
                          </p>
                        ))}
                      </div>
                      {o.receipts?.length > 0 && <p className="mt-2 text-xs text-muted-foreground">{o.receipts.length} receipt{o.receipts.length !== 1 ? 's' : ''} issued</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Messages ── */}
          {tab === 'messages' && (
            <div className="space-y-2">
              <Chat eid={eid} personName={person.name ?? 'the client'} staffName={staffName} documents={documents} inject={inject} onSent={() => refreshSummary(eid, person.id)} />
              <p className="flex flex-wrap items-center gap-2 px-1 text-xs text-muted-foreground">
                <button onClick={draftUpdate} disabled={busy === 'draft'} className={btnOutline}>
                  {busy === 'draft' ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <Sparkle className="h-3.5 w-3.5" />} Draft with AI
                </button>
                An AI draft is only a starting point. Read and edit it before you send; you are responsible for what the client receives.
              </p>
            </div>
          )}

          {/* ── Activity ── */}
          {tab === 'activity' && (
            <div className={`${card} p-5`}>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {[['all', 'All'], ['stages', 'Stages'], ['documents', 'Documents'], ['payments', 'Payments'], ['notes', 'Notes'], ['submissions', 'Submissions'], ['escalations', 'Escalations']].map(([key, label]) => (
                  <button key={key} onClick={() => setActivityFilter(key)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${activityFilter === key ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>{label}</button>
                ))}
              </div>
              {!activity && <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground"><CircleNotch className="h-3.5 w-3.5 animate-spin" /> Loading notes, submissions and escalations…</p>}
              {activity?.slaAlert && (
                <p className="mb-4 flex items-center gap-2 rounded-xl bg-accent/15 px-3.5 py-2.5 text-xs font-semibold text-foreground">
                  <Warning className="h-4 w-4 shrink-0" /> No submission update has been recorded for {activity.daysSinceUpdate} days.
                </p>
              )}
              {shownEntries.length === 0 ? <Empty icon={Clock} text="Nothing recorded here yet." /> : (
                <ol className="space-y-4">
                  {shownEntries.map((e) => (
                    <li key={e.id} className="flex gap-3">
                      <Dot className={`mt-1.5 ${e.kind === 'escalations' ? 'bg-accent' : e.kind === 'stages' ? 'bg-secondary' : 'bg-primary/40'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-x-2 text-sm font-semibold text-foreground">
                          {e.label}
                          {e.internal && <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"><Lock className="h-3 w-3" /> internal</span>}
                        </p>
                        {e.sub && <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted-foreground">{e.sub}</p>}
                        <p className="mt-0.5 text-xs text-muted-foreground">{day(e.at.toISOString())}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {/* ── Study plan ── */}
          {tab === 'study' && (
            <div className={`${card} p-5`}>
              <Section title="Study plan" action={!planItems ? <button onClick={() => setPlanItems([{ topic: '', dueDate: '' }])} className={btnOutline}><Plus className="h-3.5 w-3.5" /> {studyPlan?.items?.length ? 'New plan' : 'Create plan'}</button> : undefined}>
                {planItems && (
                  <div className="mb-4 space-y-2 rounded-xl border border-border p-3">
                    {planItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input aria-label={`Topic ${i + 1}`} value={item.topic} onChange={(e) => setPlanItems((p) => (p ?? []).map((x, j) => (j === i ? { ...x, topic: e.target.value } : x)))} placeholder="Topic, for example Pharmacology fundamentals" className={field} />
                        <input aria-label={`Due date ${i + 1}`} type="date" value={item.dueDate} onChange={(e) => setPlanItems((p) => (p ?? []).map((x, j) => (j === i ? { ...x, dueDate: e.target.value } : x)))} className={`${field} w-40`} />
                        {planItems.length > 1 && <button onClick={() => setPlanItems((p) => (p ?? []).filter((_, j) => j !== i))} aria-label="Remove topic" className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><Trash className="h-3.5 w-3.5" /></button>}
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-1">
                      <button onClick={() => setPlanItems((p) => [...(p ?? []), { topic: '', dueDate: '' }])} className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"><Plus className="h-3 w-3" /> Add topic</button>
                      <span className="flex gap-2">
                        <button onClick={() => setPlanItems(null)} className={btnOutline}>Cancel</button>
                        <button onClick={savePlan} disabled={busy === 'plan' || !planItems.some((i) => i.topic.trim())} className={btnPrimary}>Save plan</button>
                      </span>
                    </div>
                  </div>
                )}
                {studyPlan?.items?.length > 0 ? (
                  <div className="divide-y divide-border/70">
                    {(studyPlan.items as any[]).map((item) => (
                      <div key={item.id} className="flex items-center gap-3 py-2.5">
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${item.completed || item.completedAt ? 'bg-secondary text-white' : 'border-2 border-border'}`}>{(item.completed || item.completedAt) && <Check className="h-3 w-3" />}</span>
                        <span className="min-w-0 flex-1 truncate text-sm text-foreground">{item.topic}</span>
                        {item.dueDate && <span className="shrink-0 text-xs text-muted-foreground">Due {day(item.dueDate)}</span>}
                      </div>
                    ))}
                  </div>
                ) : !planItems && <Empty icon={BookOpen} text="No study plan yet. Create one to guide this client's exam preparation." />}
              </Section>
            </div>
          )}
        </div>

        {/* Side panel */}
        <aside data-tour="case-rail" className={`${card} divide-y divide-border/70`}>
          <div className="p-4">
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">Client</h3>
            <div className="space-y-2 text-sm text-foreground">
              {person.email && <p className="flex items-center gap-2"><Envelope className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="min-w-0 select-all truncate">{person.email}</span></p>}
              {person.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="select-all">{person.phone}</span></p>}
              <p className="flex items-center gap-2"><Globe className="h-4 w-4 shrink-0 text-muted-foreground" />{person.locale === 'fr' ? 'French' : 'English'}</p>
            </div>
            {person.id && <Link href={`/clients/${person.id}`} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">Open client profile <ArrowSquareOut className="h-3.5 w-3.5" /></Link>}
          </div>
          <div className="p-4">
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">Team</h3>
            {[['Consultant', consultantName], ['Officer', summary?.officerName ?? null]].map(([label, name]) => (
              <p key={label as string} className="flex items-center justify-between gap-3 py-1 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className={`truncate ${name ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{name ?? 'Not assigned'}</span>
              </p>
            ))}
          </div>
          <div className="p-4">
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">Key facts</h3>
            {[
              ['Letter', engagement.letterSignedAt ? `Signed ${day(engagement.letterSignedAt)}` : 'Not signed'],
              ['Paid', `${money(paid)} of ${money(total)}`],
              ['Documents', `${documents.filter((d) => d.status === 'VERIFIED').length} of ${documents.length} verified`],
              ['Last activity', ago(summary?.lastActivityAt)],
              ['Opened', day(engagement.createdAt)],
            ].map(([label, value]) => (
              <p key={label} className="flex items-center justify-between gap-3 py-1 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-right font-semibold text-foreground">{value}</span>
              </p>
            ))}
          </div>
        </aside>
      </div>

      {/* ── Dialogs ── */}
      {dialog === 'checklist' && (
        <Modal title="Send document checklist" sub="Emails the checklist to the client and posts it in the chat." onClose={() => setDialog(null)}>
          <label htmlFor="checklist-pathway" className="mb-1.5 block text-xs font-bold text-foreground">Pathway or regulatory body</label>
          <select id="checklist-pathway" value={checklist} onChange={(e) => setChecklist(e.target.value)} className={field}>
            {CHECKLISTS.map((g) => (
              <optgroup key={g.group} label={g.group}>{g.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</optgroup>
            ))}
          </select>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setDialog(null)} className={btnOutline}>Cancel</button>
            <button onClick={sendChecklist} disabled={busy === 'checklist'} className={btnPrimary}>{busy === 'checklist' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} Send checklist</button>
          </div>
        </Modal>
      )}

      {dialog === 'status' && (
        <Modal title="Change case status" sub="The client sees the status of their case in their portal." onClose={() => setDialog(null)}>
          <label htmlFor="status-new" className="mb-1.5 block text-xs font-bold text-foreground">New status</label>
          <select id="status-new" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className={field}>
            <option value="">Select a status…</option>
            {['ACTIVE', 'ON_HOLD', 'COMPLETED', 'TERMINATED'].filter((s) => s !== engagement.status).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
          </select>
          <label htmlFor="status-reason" className="mb-1.5 mt-4 block text-xs font-bold text-foreground">
            Reason {['ON_HOLD', 'TERMINATED'].includes(newStatus) ? '(required)' : '(optional)'}
          </label>
          <textarea id="status-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Kept on the case as an internal note." className={`${field} resize-none`} />
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setDialog(null)} className={btnOutline}>Cancel</button>
            <button onClick={changeStatus} disabled={!newStatus || busy === 'status' || (['ON_HOLD', 'TERMINATED'].includes(newStatus) && !reason.trim())} className={btnPrimary}>
              {busy === 'status' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} Change status
            </button>
          </div>
        </Modal>
      )}

      {dialog === 'consultant' && (
        <Modal title={engagement.consultantId ? 'Reassign consultant' : 'Assign consultant'} sub="The consultant will see this case in their caseload." onClose={() => setDialog(null)}>
          <label htmlFor="pick-consultant" className="mb-1.5 block text-xs font-bold text-foreground">Consultant</label>
          <select id="pick-consultant" value={pickConsultant} onChange={(e) => setPickConsultant(e.target.value)} className={field}>
            <option value="">Select a consultant…</option>
            {consultants.map((c) => <option key={c.id} value={c.id}>{c.name ?? c.id}</option>)}
          </select>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setDialog(null)} className={btnOutline}>Cancel</button>
            <button onClick={assignConsultant} disabled={!pickConsultant || busy === 'consultant'} className={btnPrimary}>Assign</button>
          </div>
        </Modal>
      )}

      {dialog === 'officer' && (
        <Modal title={engagement.officerId ? 'Change processing officer' : 'Assign processing officer'} sub="The officer is notified and the case appears in their caseload." onClose={() => setDialog(null)}>
          <label htmlFor="pick-officer" className="mb-1.5 block text-xs font-bold text-foreground">Processing officer</label>
          <select id="pick-officer" value={pickOfficer} onChange={(e) => setPickOfficer(e.target.value)} className={field}>
            <option value="">No officer</option>
            {officers.filter((o) => o.isActive !== false).map((o) => <option key={o.id} value={o.id}>{o.name ?? o.email}</option>)}
          </select>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setDialog(null)} className={btnOutline}>Cancel</button>
            <button onClick={assignOfficer} disabled={busy === 'officer' || pickOfficer === (engagement.officerId ?? '')} className={btnPrimary}>Save</button>
          </div>
        </Modal>
      )}

      {completing && (
        <Modal title="Mark this stage complete?" sub="The client sees this in their portal. It cannot be undone from here." onClose={() => setCompleting(null)}>
          <p className="rounded-xl bg-muted/50 px-4 py-3 text-sm font-semibold text-foreground">{completing.label}</p>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setCompleting(null)} className={btnOutline}>Cancel</button>
            <button onClick={completeStage} disabled={busy === 'stage'} className={btnPrimary}>{busy === 'stage' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} Mark complete</button>
          </div>
        </Modal>
      )}

      {dialog === 'summary' && (
        <Modal title="AI summary of this case" sub="A quick brief generated from the case history. Check details against the case before relying on it." onClose={() => setDialog(null)} wide>
          {busy === 'summary' ? (
            <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground"><CircleNotch className="h-5 w-5 animate-spin" /> Generating summary…</p>
          ) : (
            <div className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl bg-muted/50 p-4 text-sm leading-relaxed text-foreground">{summaryText || 'No summary is available.'}</div>
          )}
          <div className="mt-5 flex justify-end"><button onClick={() => setDialog(null)} className={btnOutline}>Close</button></div>
        </Modal>
      )}

      {aiDraft && (
        <Modal title="AI draft update for the client" sub="Generated from the case data. Nothing is sent until you send it yourself." onClose={() => setAiDraft(null)} wide>
          <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl bg-muted/50 p-4 text-sm leading-relaxed text-foreground">{aiDraft.draft}</div>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setAiDraft(null)} className={btnOutline}>Discard</button>
            <button
              onClick={() => {
                // Record that a person took this draft forward, then let them edit it before sending.
                api.approveDraft(aiDraft.draftId, staffName).catch(() => {});
                setInject({ text: aiDraft.draft, id: Date.now() });
                setAiDraft(null);
                setTab('messages');
              }}
              className={btnPrimary}
            >
              Edit in the message box
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
