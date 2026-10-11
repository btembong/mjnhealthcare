'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Skeleton } from '@mjn/ui';
import {
  ArrowLeft, Envelope, Phone, Globe, CheckCircle, CircleNotch, Plus, PaperPlaneRight, FileText,
  UploadSimple, Note, Lock, Warning, Check, Clock, PencilSimple, Eye,
} from '@mjn/ui';
import { api } from '../../../../../lib/api';
import {
  CASE_STATUS, DOC_STATUS, SUBMISSION_DONE, SUBMISSION_STATUS, Dot, Modal, SubmissionDialog,
  ago, btnOutline, btnPrimary, card, caseRef, day, daysFromToday, field, fieldLabel, heading, money, title,
} from '../../../../../components/officer-kit';

const TABS = ['overview', 'submissions', 'documents', 'notes', 'activity'] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = {
  overview: 'Overview', submissions: 'Submissions', documents: 'Documents', notes: 'Notes', activity: 'Activity',
};

type NoteKind = 'internal' | 'client';

function Section({ title: head, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className={heading}>{head}</h3>
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
  const mine = docs.filter((d) => d.type === type).map((d) => d.status);
  for (const s of ['VERIFIED', 'PENDING', 'REJECTED']) if (mine.includes(s)) return s;
  return null;
}

/** How a note reads in the list: who saw it, or why they did not. */
function noteState(n: any): { label: string; dot?: string; lock?: boolean } {
  if (n.rejectedAt) return { label: 'Not approved · kept internal', dot: 'bg-accent' };
  if (n.isInternal) return { label: 'Internal', lock: true };
  if (n.requiresApproval && !n.approvedAt) return { label: 'Waiting for consultant approval', dot: 'bg-accent' };
  return { label: 'Sent to client', dot: 'bg-secondary' };
}

export default function OfficerCasePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [ctx, setCtx] = useState<any>(null);
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTabState] = useState<Tab>('overview');
  const [busy, setBusy] = useState('');

  // Dialogs
  const [submission, setSubmission] = useState<{ record: any | null } | null>(null);
  const [dialog, setDialog] = useState<null | 'form' | 'escalate'>(null);
  const [completing, setCompleting] = useState<any | null>(null);

  // Notes
  const [noteKind, setNoteKind] = useState<NoteKind>('internal');
  const [needsApproval, setNeedsApproval] = useState(false);
  const [noteText, setNoteText] = useState('');

  // Send a form
  const [formType, setFormType] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Escalate
  const [consultants, setConsultants] = useState<any[]>([]);
  const [consultantId, setConsultantId] = useState('');
  const [reason, setReason] = useState('');

  const pending = useRef<{ edit?: string | null; action?: string | null }>({});

  const setTab = useCallback((next: Tab) => {
    setTabState(next);
    try { window.history.replaceState(null, '', `${window.location.pathname}${next === 'overview' ? '' : `?tab=${next}`}`); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wanted = params.get('tab') as Tab | null;
    if (wanted && TABS.includes(wanted)) setTabState(wanted);
    pending.current = { edit: params.get('edit'), action: params.get('action') };
  }, []);

  const load = useCallback(async () => {
    try {
      const c = await api.getOfficerCase(id);
      setData(c);
      const [rCtx, rForms] = await Promise.allSettled([
        c.person?.id ? api.getDocumentReviewContext(c.person.id) : Promise.resolve(null),
        api.getOfficerSentDocuments(id),
      ]);
      if (rCtx.status === 'fulfilled' && rCtx.value) setCtx(rCtx.value);
      if (rForms.status === 'fulfilled') setForms(rForms.value ?? []);
      return c;
    } catch (e: any) {
      setError(e.message ?? '');
      return null;
    } finally {
      setLoading(false);
    }
  }, [id]);

  const openEscalate = useCallback((c: any) => {
    setReason('');
    setDialog('escalate');
    api.getConsultants(true).then((list) => {
      const all = list ?? [];
      setConsultants(all);
      // Default to the consultant already on this case.
      setConsultantId(all.some((x: any) => x.id === c.consultantId) ? c.consultantId : all[0]?.id ?? '');
    }).catch(() => setConsultants([]));
  }, []);

  useEffect(() => {
    load().then((c) => {
      if (!c) return;
      // A link from "My work" can open straight onto the thing to do.
      const { edit, action } = pending.current;
      pending.current = {};
      const record = edit ? (c.applicationTracking ?? []).find((t: any) => t.id === edit) : null;
      if (record) setSubmission({ record });
      else if (action === 'submission') setSubmission({ record: null });
      else if (action === 'escalate') openEscalate(c);
    });
  }, [load, openEscalate]);

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

  async function viewDocument(documentId: string) {
    // Opened before the request so the browser does not treat it as a pop-up.
    const win = window.open('about:blank', '_blank');
    if (win) win.opener = null;
    try {
      const { url } = await api.getDocumentViewUrl(documentId);
      if (win) win.location.href = url; else window.location.href = url;
    } catch (e: any) {
      win?.close();
      toast.error(e.message ?? 'The document could not be opened.');
    }
  }

  async function saveNote() {
    const content = noteText.trim();
    if (!content) return;
    const toClient = noteKind === 'client';
    const ok = await run(
      'note',
      () => api.addCaseNote(id, content, !toClient, toClient && needsApproval).then(load),
      !toClient ? 'Note added.' : needsApproval ? 'Sent to the consultant for approval.' : 'Update sent to the client.',
    );
    if (ok) { setNoteText(''); setNoteKind('internal'); setNeedsApproval(false); }
  }

  async function sendForm() {
    const personId = data?.person?.id;
    if (!formFile || !formType.trim() || !personId) return;
    const ok = await run('form', async () => {
      const { url, key } = await api.getUploadUrl(personId, 'officer-form', formFile.name);
      const put = await fetch(url, { method: 'PUT', body: formFile, headers: { 'Content-Type': formFile.type } });
      if (!put.ok) throw new Error('The file could not be uploaded. Please try again.');
      await api.officerSendDocument(id, key, formType.trim(), formNote.trim() || undefined);
      await load();
    }, 'Form sent. The client has been notified.');
    if (ok) { setDialog(null); setFormType(''); setFormNote(''); setFormFile(null); }
  }

  async function escalate() {
    if (!reason.trim() || !consultantId) return;
    if (await run('escalate', () => api.escalateCase(id, consultantId, reason.trim()).then(load), 'Case escalated. The consultant has been notified.')) {
      setDialog(null);
    }
  }

  async function completeStage() {
    if (!completing) return;
    if (await run('stage', () => api.completeMilestone(completing.id).then(load), 'Stage marked complete.')) setCompleting(null);
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
  if (!data) {
    return (
      <div className={`${card} p-10 text-center`}>
        <h1 data-tour="page-title" className="font-bold text-foreground">Case not available</h1>
        <p className="mt-1 text-sm text-muted-foreground">{error || 'This case could not be loaded.'} You can only open cases that are assigned to you.</p>
        <Link href="/officer/caseload" className="mt-4 inline-block text-sm font-bold text-primary hover:underline">Back to my caseload</Link>
      </div>
    );
  }

  const person = data.person ?? {};
  const work = data.work ?? { needs: [], waiting: { approvals: 0, escalations: 0, forms: 0 }, docs: { verified: 0, total: 0 }, paid: 0, total: 0 };
  const milestones: any[] = data.milestones ?? [];
  const trackings: any[] = data.applicationTracking ?? [];
  const notes: any[] = data.caseNotes ?? [];
  const escalations: any[] = data.escalations ?? [];
  const allDocs: any[] = ctx?.documents ?? [];
  const clientDocs = allDocs.filter((d) => d.origin !== 'OFFICER_SENT' && d.origin !== 'CLIENT_RETURN');
  const required: string[] = ctx?.requiredDocTypes ?? [];
  const done = milestones.filter((m) => m.completedAt).length;
  const currentStage = milestones.find((m) => !m.completedAt) ?? null;
  const closed = data.status === 'COMPLETED' || data.status === 'TERMINATED';
  const returnedForms = forms.filter((f) => f.linkedReturns?.length > 0);
  const openEscalation = escalations.find((e) => e.status === 'OPEN');
  const verifiedDocs = clientDocs.filter((d) => d.status === 'VERIFIED').length;

  // The single most useful thing to do next on this case.
  const need = work.needs[0];
  const nextStep: { text: string; dot?: boolean; action?: { label: string; run: () => void } } =
    closed ? { text: `This case is ${(CASE_STATUS[data.status]?.label ?? 'closed').toLowerCase()}.` }
    : need?.key === 'followup' ? { text: `${need.text}.`, dot: true, action: { label: 'Update submission', run: () => setSubmission({ record: trackings.find((t) => t.id === need.trackingId) ?? null }) } }
    : need?.key === 'form' ? { text: `${need.text}.`, dot: true, action: { label: 'Open documents', run: () => setTab('documents') } }
    : need?.key === 'declined' ? { text: `${need.text}.`, dot: true, action: { label: 'Open notes', run: () => setTab('notes') } }
    : data.status === 'ACTIVE' && trackings.length === 0 ? { text: 'No submission has been recorded for this case yet.', dot: true, action: { label: 'Record submission', run: () => setSubmission({ record: null }) } }
    : openEscalation ? { text: `Waiting for ${openEscalation.consultant?.name ?? 'the consultant'} to answer your escalation.` }
    : work.waiting.approvals > 0 ? { text: 'Your client update is waiting for consultant approval.' }
    : work.nextFollowUp ? { text: `Next follow-up: ${work.nextFollowUp.portal} on ${day(work.nextFollowUp.date)}.` }
    : { text: 'Nothing is waiting on you for this case.' };

  const tabBadge: Partial<Record<Tab, ReactNode>> = {
    submissions: trackings.length > 0 ? <span className="ml-1.5 text-xs font-semibold text-muted-foreground">{trackings.length}</span> : null,
    documents: work.needs.some((n: any) => n.key === 'form') ? <Dot className="ml-1.5 bg-accent" /> : null,
    notes: work.needs.some((n: any) => n.key === 'declined') ? <Dot className="ml-1.5 bg-accent" /> : null,
  };

  // One merged history for the Activity tab.
  type Entry = { id: string; at: Date; label: string; sub?: string; dot: string; internal?: boolean };
  const entries: Entry[] = [
    { id: 'opened', at: new Date(data.createdAt), label: 'Case opened', dot: 'bg-secondary' },
    ...(data.letterSignedAt ? [{ id: 'letter', at: new Date(data.letterSignedAt), label: 'Engagement letter signed', dot: 'bg-secondary' }] : []),
    ...milestones.filter((m) => m.completedAt).map((m) => ({ id: `m${m.id}`, at: new Date(m.completedAt), label: `Stage completed · ${m.label}`, dot: 'bg-secondary' })),
    ...trackings.map((t) => ({ id: `t${t.id}`, at: new Date(t.createdAt), label: `Submission recorded · ${t.portal}`, sub: [t.referenceNumber && `Ref ${t.referenceNumber}`, SUBMISSION_STATUS[t.status]?.label].filter(Boolean).join(' · '), dot: 'bg-primary/40' })),
    ...notes.map((n) => ({ id: `n${n.id}`, at: new Date(n.createdAt), label: `${n.isInternal ? 'Note' : 'Client update'} · ${n.author?.name ?? 'Staff'}`, sub: n.content, dot: 'bg-primary/40', internal: n.isInternal })),
    ...forms.map((f) => ({ id: `f${f.id}`, at: new Date(f.uploadedAt), label: `Form sent · ${f.type}`, dot: 'bg-primary/40' })),
    ...returnedForms.map((f) => ({ id: `r${f.id}`, at: new Date(f.linkedReturns[0].uploadedAt), label: `Form returned by client · ${f.type}`, dot: 'bg-secondary' })),
    ...escalations.flatMap((e) => [
      { id: `e${e.id}`, at: new Date(e.createdAt), label: `Escalated to ${e.consultant?.name ?? 'a consultant'}`, sub: e.reason, dot: 'bg-accent' },
      ...(e.resolvedAt ? [{ id: `x${e.id}`, at: new Date(e.resolvedAt), label: 'Escalation resolved', sub: e.resolution ?? undefined, dot: 'bg-secondary' }] : []),
    ]),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  const noteButton = noteKind === 'internal' ? 'Add note' : needsApproval ? 'Send for approval' : 'Send to client';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div data-tour="ocase-header" className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/officer/caseload" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> My caseload
          </Link>
          <h1 data-tour="page-title" className="mt-1 truncate text-xl font-bold text-foreground">{person.name ?? 'Case'}</h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {person.profession && <span>{title(person.profession)}</span>}
            <span className="font-mono">{caseRef(data.id)}</span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
              <Dot className={CASE_STATUS[data.status]?.dot ?? 'bg-muted'} /> {CASE_STATUS[data.status]?.label ?? title(data.status)}
            </span>
          </p>
        </div>
        <div data-tour="ocase-actions" className="flex flex-wrap items-center gap-2">
          <button onClick={() => setSubmission({ record: null })} disabled={closed} className={btnPrimary}><Plus className="h-4 w-4" /> Record submission</button>
          <button onClick={() => setDialog('form')} disabled={closed} className={btnOutline}><PaperPlaneRight className="h-4 w-4" /> Send form</button>
          <button onClick={() => openEscalate(data)} disabled={closed} className={btnOutline}><Warning className="h-4 w-4" /> Escalate</button>
        </div>
      </div>

      {/* Next step */}
      <div data-tour="ocase-next" className={`${card} flex flex-wrap items-center justify-between gap-3 px-5 py-3.5`}>
        <p className="flex min-w-0 items-center gap-2.5 text-sm text-foreground">
          <span className={`shrink-0 ${heading}`}>Next step</span>
          {nextStep.dot ? <Dot className="bg-accent" /> : !closed && !openEscalation && work.waiting.approvals === 0 && !work.nextFollowUp ? <CheckCircle className="h-4 w-4 shrink-0 text-secondary" weight="fill" /> : null}
          <span className="font-semibold">{nextStep.text}</span>
        </p>
        {nextStep.action && <button onClick={nextStep.action.run} className={btnPrimary}>{nextStep.action.label}</button>}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        {/* Main column */}
        <div className="min-w-0 space-y-4">
          <div data-tour="ocase-tabs" className="flex gap-1 overflow-x-auto border-b border-border">
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
              {data.handoverNotes && (
                <Section title="Handover note">
                  <p className="whitespace-pre-wrap rounded-xl bg-muted/50 px-4 py-3 text-sm text-foreground">{data.handoverNotes}</p>
                </Section>
              )}

              <Section
                title="Stages"
                action={milestones.length > 0 ? <span className="text-xs font-semibold text-muted-foreground">{currentStage ? `Stage ${done + 1} of ${milestones.length}` : `All ${milestones.length} complete`}</span> : undefined}
              >
                {milestones.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No stages have been set up for this case yet. The consultant adds them.</p>
                ) : (
                  <>
                    <div className="mb-4 flex gap-1">
                      {milestones.map((m) => (
                        <div key={m.id} title={m.label} className={`h-2 flex-1 rounded-full ${m.completedAt ? 'bg-secondary' : m.id === currentStage?.id ? 'bg-primary/30' : 'bg-muted'}`} />
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
              </Section>

              {required.length > 0 && (
                <Section title={`This stage needs${ctx?.stage?.label ? ` · ${ctx.stage.label}` : ''}`}>
                  <div className="divide-y divide-border/70">
                    {required.map((type) => {
                      const s = bestDocStatus(allDocs, type);
                      return (
                        <div key={type} className="flex items-center gap-3 py-2.5">
                          <Dot className={s ? DOC_STATUS[s].dot : 'border border-muted-foreground/50'} />
                          <span className="min-w-0 flex-1 truncate text-sm text-foreground">{title(type)}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">{s ? DOC_STATUS[s].label : 'Not uploaded'}</span>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}
            </div>
          )}

          {/* ── Submissions ── */}
          {tab === 'submissions' && (
            <div data-tour="ocase-submissions" className={`${card} overflow-hidden`}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
                <p className="text-sm font-semibold text-foreground">
                  {trackings.length === 0 ? 'No submissions recorded' : `${trackings.length} submission${trackings.length === 1 ? '' : 's'}`}
                </p>
                <button onClick={() => setSubmission({ record: null })} disabled={closed} className={btnPrimary}><Plus className="h-3.5 w-3.5" /> Record submission</button>
              </div>
              {trackings.length === 0 ? (
                <Empty icon={FileText} text="Record each application you submit to a licensing body, with its reference and when to follow up." />
              ) : (
                <div className="divide-y divide-border/70">
                  {trackings.map((t) => {
                    const finished = SUBMISSION_DONE.includes(t.status);
                    const due = !finished && t.nextActionDate && daysFromToday(t.nextActionDate) <= 0;
                    return (
                      <div key={t.id} className="px-5 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 text-sm">
                            <span className="font-bold text-foreground">{t.portal}</span>
                            <span className="inline-flex items-center gap-1.5 font-semibold text-foreground"><Dot className={SUBMISSION_STATUS[t.status]?.dot ?? 'bg-muted-foreground/40'} /> {SUBMISSION_STATUS[t.status]?.label ?? title(t.status)}</span>
                            {t.referenceNumber && <span className="select-all font-mono text-xs text-muted-foreground">Ref {t.referenceNumber}</span>}
                          </p>
                          <button onClick={() => setSubmission({ record: t })} disabled={closed} className={btnOutline}><PencilSimple className="h-3.5 w-3.5" /> Update</button>
                        </div>
                        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                          <span>{t.submittedAt ? `Submitted ${day(t.submittedAt)}` : `Recorded ${day(t.createdAt)}`}</span>
                          {!finished && t.nextActionDate && (
                            <span className={`inline-flex items-center gap-1.5 ${due ? 'font-semibold text-foreground' : ''}`}>
                              · {due && <Dot className="bg-accent" />} Follow up {day(t.nextActionDate)}{due ? ` (${daysFromToday(t.nextActionDate) === 0 ? 'today' : ago(t.nextActionDate)})` : ''}
                            </span>
                          )}
                          {!finished && !t.nextActionDate && <span>· No follow-up date set</span>}
                        </p>
                        {t.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{t.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Documents ── */}
          {tab === 'documents' && (
            <div data-tour="ocase-documents" className={`${card} divide-y divide-border`}>
              <div className="p-5">
                <Section title="Client documents" action={<span className="text-xs font-semibold text-muted-foreground">{verifiedDocs} of {clientDocs.length} verified</span>}>
                  {clientDocs.length === 0 ? <p className="text-sm text-muted-foreground">This client has not uploaded any documents yet.</p> : (
                    <div className="divide-y divide-border/70">
                      {clientDocs.map((d) => (
                        <div key={d.id} className="flex flex-wrap items-center gap-3 py-2.5">
                          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{title(d.type)}</span>
                          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-foreground"><Dot className={DOC_STATUS[d.status]?.dot ?? 'bg-muted'} /> {DOC_STATUS[d.status]?.label ?? title(d.status)}</span>
                          <button onClick={() => viewDocument(d.id)} className={btnOutline}><Eye className="h-3.5 w-3.5" /> View</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">The compliance team verifies documents. Each time a document is opened it is recorded in the audit log.</p>
                </Section>
              </div>
              <div className="p-5">
                <Section title="Forms sent to the client" action={<button onClick={() => setDialog('form')} disabled={closed} className={btnOutline}><PaperPlaneRight className="h-3.5 w-3.5" /> Send a form</button>}>
                  {forms.length === 0 ? <p className="text-sm text-muted-foreground">No forms sent yet. Send a blank form for the client to complete and return.</p> : (
                    <div className="divide-y divide-border/70">
                      {forms.map((f) => {
                        const back = f.linkedReturns?.[0];
                        return (
                          <div key={f.id} className="flex flex-wrap items-center gap-3 py-2.5">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-foreground">{f.type}</p>
                              {f.officerNote && <p className="truncate text-xs text-muted-foreground">{f.officerNote}</p>}
                            </div>
                            <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-foreground">
                              <Dot className={back ? 'bg-secondary' : 'bg-primary/40'} /> {back ? `Returned ${day(back.uploadedAt)}` : `With client since ${day(f.uploadedAt)}`}
                            </span>
                            {back && <button onClick={() => viewDocument(back.id)} className={btnOutline}><Eye className="h-3.5 w-3.5" /> Open</button>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Section>
              </div>
            </div>
          )}

          {/* ── Notes ── */}
          {tab === 'notes' && (
            <div data-tour="ocase-notes" className={`${card} divide-y divide-border`}>
              {!closed && (
                <div className="p-5">
                  <fieldset>
                    <legend className={`mb-2.5 ${heading}`}>New note</legend>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {([
                        ['internal', 'Internal note', 'Stays with the team. The client never sees it.'],
                        ['client', 'Update for the client', 'Emailed to the client and sent on WhatsApp.'],
                      ] as const).map(([value, label, sub]) => (
                        <label key={value} className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3.5 py-3 ${noteKind === value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'}`}>
                          <input type="radio" name="note-kind" value={value} checked={noteKind === value} onChange={() => setNoteKind(value)} className="mt-0.5 accent-[#0F4C81]" />
                          <span>
                            <span className="block text-sm font-bold text-foreground">{label}</span>
                            <span className="block text-xs text-muted-foreground">{sub}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  {noteKind === 'client' && (
                    <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-xl bg-muted/50 px-3.5 py-3">
                      <input type="checkbox" checked={needsApproval} onChange={(e) => setNeedsApproval(e.target.checked)} className="mt-0.5 accent-[#0F4C81]" />
                      <span>
                        <span className="block text-sm font-bold text-foreground">Needs consultant approval first</span>
                        <span className="block text-xs text-muted-foreground">Tick this for anything about eligibility, outcomes or timelines. The consultant reviews it before the client receives anything.</span>
                      </span>
                    </label>
                  )}
                  <label htmlFor="note-text" className="sr-only">Note</label>
                  <textarea
                    id="note-text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows={4}
                    placeholder={noteKind === 'internal' ? 'What happened, what you did, what is outstanding.' : 'Write the update exactly as the client should read it.'}
                    className={`${field} mt-3 resize-none`}
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      {noteKind === 'internal' ? 'Only staff can read this.' : needsApproval ? 'Nothing is sent until a consultant approves it.' : 'This is sent to the client straight away and cannot be recalled.'}
                    </p>
                    <button onClick={saveNote} disabled={!noteText.trim() || busy === 'note'} className={btnPrimary}>
                      {busy === 'note' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} {noteButton}
                    </button>
                  </div>
                </div>
              )}
              <div className="p-5">
                {notes.length === 0 ? <Empty icon={Note} text="No notes on this case yet." /> : (
                  <ol className="space-y-4">
                    {notes.map((n) => {
                      const state = noteState(n);
                      return (
                        <li key={n.id}>
                          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                              {state.lock ? <Lock className="h-3 w-3 text-muted-foreground" /> : <Dot className={state.dot ?? 'bg-muted'} />} {state.label}
                            </span>
                            <span>· {n.author?.name ?? 'Staff'} · {ago(n.createdAt)}</span>
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{n.content}</p>
                          {n.rejectedAt && (
                            <p className="mt-1.5 rounded-xl bg-accent/15 px-3 py-2 text-xs text-foreground">
                              <span className="font-bold">Not approved {ago(n.rejectedAt)}.</span> {n.rejectionReason ? `Reason: ${n.rejectionReason}` : 'No reason was given; ask the consultant if you are unsure.'} Nothing was sent to the client. Write a new update if one is still needed.
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </div>
          )}

          {/* ── Activity ── */}
          {tab === 'activity' && (
            <div className={`${card} p-5`}>
              <ol className="space-y-4">
                {entries.map((e) => (
                  <li key={e.id} className="flex gap-3">
                    <Dot className={`mt-1.5 ${e.dot}`} />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-x-2 text-sm font-semibold text-foreground">
                        {e.label}
                        {e.internal && <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"><Lock className="h-3 w-3" /> internal</span>}
                      </p>
                      {e.sub && <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted-foreground">{e.sub}</p>}
                      <p className="mt-0.5 text-xs text-muted-foreground">{day(e.at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Side panel */}
        <aside data-tour="ocase-rail" className={`${card} divide-y divide-border/70`}>
          <div className="p-4">
            <h3 className={`mb-2.5 ${heading}`}>Client</h3>
            <div className="space-y-2 text-sm text-foreground">
              {person.email && <p className="flex items-center gap-2"><Envelope className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="min-w-0 select-all truncate">{person.email}</span></p>}
              {person.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="select-all">{person.phone}</span></p>}
              <p className="flex items-center gap-2"><Globe className="h-4 w-4 shrink-0 text-muted-foreground" />{person.locale === 'fr' ? 'French' : 'English'}</p>
            </div>
          </div>
          <div className="p-4">
            <h3 className={`mb-2.5 ${heading}`}>Team</h3>
            {[['Consultant', work.consultantName ?? null], ['Officer', 'You']].map(([label, name]) => (
              <p key={label as string} className="flex items-center justify-between gap-3 py-1 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className={`truncate ${name ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{name ?? 'Not assigned'}</span>
              </p>
            ))}
          </div>
          <div className="p-4">
            <h3 className={`mb-2.5 ${heading}`}>Key facts</h3>
            {[
              ['Letter', data.letterSignedAt ? `Signed ${day(data.letterSignedAt)}` : 'Not signed'],
              ['Paid', `${money(work.paid)} of ${money(work.total)}`],
              ['Documents', `${verifiedDocs} of ${clientDocs.length} verified`],
              ['Last activity', ago(work.lastActivityAt)],
              ['Opened', day(data.createdAt)],
            ].map(([label, value]) => (
              <p key={label} className="flex items-center justify-between gap-3 py-1 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-right font-semibold text-foreground">{value}</span>
              </p>
            ))}
          </div>
          {(work.waiting.approvals > 0 || openEscalation || work.waiting.forms > 0) && (
            <div className="p-4">
              <h3 className={`mb-2.5 ${heading}`}>Waiting on others</h3>
              <div className="space-y-1.5 text-sm text-foreground">
                {work.waiting.approvals > 0 && <p className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0 text-muted-foreground" /> Update with consultant</p>}
                {openEscalation && <p className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0 text-muted-foreground" /> Escalation open since {day(openEscalation.createdAt)}</p>}
                {work.waiting.forms > 0 && <p className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0 text-muted-foreground" /> {work.waiting.forms} form{work.waiting.forms === 1 ? '' : 's'} with client</p>}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ── Dialogs ── */}
      {submission && (
        <SubmissionDialog
          engagementId={id}
          record={submission.record}
          onClose={() => setSubmission(null)}
          onSaved={() => { setSubmission(null); setTab('submissions'); load(); }}
        />
      )}

      {dialog === 'form' && (
        <Modal title="Send a form to the client" sub="The client is notified, downloads the form from their portal, completes it and returns it to you." onClose={() => setDialog(null)}>
          <label htmlFor="form-type" className={fieldLabel}>Form name</label>
          <input id="form-type" value={formType} onChange={(e) => setFormType(e.target.value)} placeholder="For example DataFlow employment history" className={field} />
          <label htmlFor="form-note" className={`${fieldLabel} mt-4`}>Instructions for the client (optional)</label>
          <textarea id="form-note" value={formNote} onChange={(e) => setFormNote(e.target.value)} rows={2} placeholder="What the client needs to do with this form." className={`${field} resize-none`} />
          <span className={`${fieldLabel} mt-4`}>Blank form</span>
          <input ref={fileRef} type="file" aria-label="Blank form file" onChange={(e) => setFormFile(e.target.files?.[0] ?? null)} className="hidden" />
          <button type="button" onClick={() => fileRef.current?.click()} className={btnOutline}><UploadSimple className="h-3.5 w-3.5" /> {formFile ? formFile.name : 'Choose file'}</button>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setDialog(null)} className={btnOutline}>Cancel</button>
            <button onClick={sendForm} disabled={busy === 'form' || !formFile || !formType.trim()} className={btnPrimary}>{busy === 'form' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} Send to client</button>
          </div>
        </Modal>
      )}

      {dialog === 'escalate' && (
        <Modal title="Escalate this case" sub="Use this when the case needs a consultant to decide: a compliance issue, a client dispute, or a question about eligibility." onClose={() => setDialog(null)}>
          {openEscalation && (
            <p className="mb-4 rounded-xl bg-accent/15 px-3.5 py-2.5 text-xs text-foreground">This case already has an open escalation from {day(openEscalation.createdAt)}. Raise another only if this is a different issue.</p>
          )}
          <label htmlFor="esc-consultant" className={fieldLabel}>Consultant</label>
          <select id="esc-consultant" value={consultantId} onChange={(e) => setConsultantId(e.target.value)} className={field}>
            {consultants.length === 0 && <option value="">Loading consultants…</option>}
            {consultants.map((c) => <option key={c.id} value={c.id}>{c.name ?? c.id}{c.id === data.consultantId ? ' (on this case)' : ''}</option>)}
          </select>
          <label htmlFor="esc-reason" className={`${fieldLabel} mt-4`}>What do you need decided?</label>
          <textarea id="esc-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="Describe the issue and what you have already tried." className={`${field} resize-none`} />
          <p className="mt-1.5 text-xs text-muted-foreground">The consultant is emailed and the case appears in their escalation inbox. You are told when they resolve it.</p>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setDialog(null)} className={btnOutline}>Cancel</button>
            <button onClick={escalate} disabled={busy === 'escalate' || !reason.trim() || !consultantId} className={btnPrimary}>{busy === 'escalate' && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} Escalate</button>
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
    </div>
  );
}
