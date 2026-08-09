'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Skeleton } from '@mjn/ui';
import {
  ArrowLeft, User, Envelope, Phone, Globe, CheckCircle,
  Clock, CircleNotch, WarningCircle, CurrencyDollar,
  Seal, Signature, Flag, Check,
  CaretDown, X, Plus, BookOpen, Trash,
  Chat, PaperPlaneRight, ArrowDown, ChatCircle,
  Paperclip, FileText, UploadSimple, Image as ImageIcon,
  FilePdf, FileDoc, Link as LinkIcon,
  Note, ArrowSquareUpRight, Warning, Lock,
} from '@phosphor-icons/react';
import { api } from '../../../../lib/api';
import { useAdmin } from '../../../../contexts/admin-context';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:             'bg-primary/10 text-primary border-primary/20',
  PENDING_SIGNATURE:  'bg-amber-100 text-amber-700 border-amber-200',
  COMPLETED:          'bg-muted text-muted-foreground border-border',
  ON_HOLD:            'bg-orange-100 text-orange-700 border-orange-200',
  TERMINATED:         'bg-rose-100 text-rose-700 border-rose-200',
};

const ORDER_STATUS_STYLES: Record<string, string> = {
  PAID:           'bg-primary/10 text-primary border-primary/20',
  PENDING:        'bg-amber-100 text-amber-700 border-amber-200',
  PARTIALLY_PAID: 'bg-orange-100 text-orange-700 border-orange-200',
};

const QUICK_REPLIES = [
  'Documents verified and approved.',
  'Please upload the requested document.',
  'Your case is progressing well.',
  'We need to schedule a call.',
  'We are awaiting your payment to proceed.',
];

const DOC_REQUEST_TEMPLATES = [
  { label: 'Passport', text: 'Please upload a clear copy of your international passport (biographic page) to your document vault.' },
  { label: 'Nursing License', text: 'Please upload your current nursing license/registration certificate to your document vault.' },
  { label: 'Educational Certificate', text: 'Please upload your nursing/medical school certificate and transcripts to your document vault.' },
  { label: 'Experience Letter', text: 'Please upload an official work experience letter from your current/previous employer to your document vault.' },
  { label: 'DataFlow Verification', text: 'To proceed with your DataFlow verification, please upload all required credentials to your document vault and confirm your profession type.' },
];

function statusLabel(s: string) {
  return s?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? '—';
}

function dateSeparatorLabel(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}

function DetailSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-40 rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="lg:col-span-2 h-64 rounded-2xl" />
      </div>
      <Skeleton className="h-48 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );
}

function docTypeIcon(type: string) {
  if (/pdf/i.test(type)) return <FilePdf className="h-4 w-4 text-rose-500" />;
  if (/doc/i.test(type)) return <FileDoc className="h-4 w-4 text-blue-500" />;
  if (/image|jpg|jpeg|png/i.test(type)) return <ImageIcon className="h-4 w-4 text-emerald-500" />;
  return <FileText className="h-4 w-4 text-muted-foreground" />;
}

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { me } = useAdmin();
  const role = (me?.role as string)?.toUpperCase() ?? 'ADMIN';

  const [engagement, setEngagement] = useState<any>(null);
  const [consultants, setConsultants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Assign consultant
  const [assigning, setAssigning] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState('');

  // Status update
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  // Add milestone
  const [showMilestoneInput, setShowMilestoneInput] = useState(false);
  const [milestoneLabel, setMilestoneLabel] = useState('');
  const [addingMilestone, setAddingMilestone] = useState(false);

  // Send letter
  const [sendingLetter, setSendingLetter] = useState(false);

  // Document checklist
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [checklistPathway, setChecklistPathway] = useState('UAE_DATAFLOW_NURSE');
  const [sendingChecklist, setSendingChecklist] = useState(false);

  // Study plan
  const [studyPlan, setStudyPlan] = useState<any>(null);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planItems, setPlanItems] = useState<{ topic: string; dueDate: string }[]>([{ topic: '', dueDate: '' }]);
  const [savingPlan, setSavingPlan] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  // Officer Activity
  const [officerActivity, setOfficerActivity] = useState<any>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityLoaded, setActivityLoaded] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  // Messages
  const [messages, setMessages] = useState<any[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [compose, setCompose] = useState('');
  const [sending, setSending] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const [newBanner, setNewBanner] = useState(false);

  // Attachment panel
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachTab, setAttachTab] = useState<'vault' | 'request'>('vault');
  const [personDocs, setPersonDocs] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const composeRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevMsgCount = useRef(0);

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!id) return;
    loadMessages();
    pollRef.current = setInterval(() => loadMessages(true), 20_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [id]);

  async function load() {
    setLoading(true);
    try {
      const [engRes, cons] = await Promise.allSettled([
        api.getEngagementById(id),
        api.getConsultants(),
      ]);

      let engValue: any = null;
      if (engRes.status === 'fulfilled') {
        engValue = engRes.value;
      } else {
        // `id` might be a person ID (e.g. navigating from leads page) — try client lookup
        try {
          const clientEngs = await api.getClientEngagements(id);
          const active = (clientEngs ?? []).find((e: any) => e.status === 'ACTIVE') ?? clientEngs?.[0] ?? null;
          engValue = active;
          if (!active) setError('No engagement found for this client yet.');
        } catch {
          setError('Failed to load case.');
        }
      }

      if (engValue) {
        setEngagement(engValue);
        const personId = engValue?.person?.id;
        if (personId) {
          api.getStudyPlan(personId).then((plan) => setStudyPlan(plan)).catch(() => {});
        }
      }
      if (cons.status === 'fulfilled') setConsultants(cons.value ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(silent = false) {
    if (!silent) setMsgLoading(true);
    try {
      const msgs = await api.getEngagementMessages(id);
      const list = msgs ?? [];
      if (silent && list.length > prevMsgCount.current) {
        if (atBottom) {
          setTimeout(scrollToBottom, 50);
        } else {
          setNewBanner(true);
        }
      }
      prevMsgCount.current = list.length;
      setMessages(list);
      if (!silent) setTimeout(scrollToBottom, 100);
    } catch {} finally {
      if (!silent) setMsgLoading(false);
    }
  }

  async function loadPersonDocs(personId: string) {
    setLoadingDocs(true);
    try {
      const docs = await api.getDocumentsByPerson(personId);
      setPersonDocs(docs ?? []);
    } catch {} finally {
      setLoadingDocs(false);
    }
  }

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAtBottom(nearBottom);
    if (nearBottom) setNewBanner(false);
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  async function handleSendMessage(text?: string) {
    const content = (text ?? compose).trim();
    if (!content || sending) return;
    setSending(true);
    setCompose('');
    setAttachOpen(false);
    if (composeRef.current) {
      composeRef.current.style.height = 'auto';
    }
    try {
      await api.sendEngagementMessage(id, content);
      await loadMessages(true);
      setTimeout(scrollToBottom, 50);
    } catch {} finally {
      setSending(false);
    }
  }

  function handleAttachFromVault(doc: any) {
    const docName = doc.type?.replace(/_/g, ' ') ?? 'Document';
    const msg = `[Document shared: ${docName}]${doc.fileUrl ? `\n${doc.fileUrl}` : ''}`;
    setCompose(msg);
    setAttachOpen(false);
    composeRef.current?.focus();
  }

  function handleRequestTemplate(template: { label: string; text: string }) {
    setCompose(template.text);
    setAttachOpen(false);
    composeRef.current?.focus();
  }

  async function handleSavePlan() {
    const personId = engagement?.person?.id;
    if (!personId) return;
    const validItems = planItems.filter((i) => i.topic.trim());
    if (!validItems.length) return;
    setSavingPlan(true);
    try {
      const created = await api.createStudyPlan(
        personId,
        validItems.map((i) => ({ topic: i.topic.trim(), dueDate: i.dueDate || undefined })),
      );
      setStudyPlan(created);
      setShowPlanForm(false);
      setPlanItems([{ topic: '', dueDate: '' }]);
    } catch (e: any) { setError(e.message); } finally { setSavingPlan(false); }
  }

  async function handleAssign() {
    if (!selectedConsultant) return;
    setAssigning(true);
    try {
      await api.assignConsultant(id, selectedConsultant);
      await load();
      setSelectedConsultant('');
    } catch (e: any) { setError(e.message); } finally { setAssigning(false); }
  }

  async function handleStatusUpdate() {
    if (!newStatus) return;
    setUpdatingStatus(true);
    try {
      await api.updateEngagementStatus(id, newStatus);
      setEngagement((prev: any) => ({ ...prev, status: newStatus }));
      setNewStatus('');
    } catch (e: any) { setError(e.message); } finally { setUpdatingStatus(false); }
  }

  async function handleAddMilestone() {
    if (!milestoneLabel.trim()) return;
    setAddingMilestone(true);
    try {
      const m = await api.addMilestone(id, milestoneLabel.trim());
      setEngagement((prev: any) => ({ ...prev, milestones: [...(prev.milestones ?? []), m] }));
      setMilestoneLabel('');
      setShowMilestoneInput(false);
    } catch (e: any) { setError(e.message); } finally { setAddingMilestone(false); }
  }

  async function handleCompleteMilestone(milestoneId: string) {
    try {
      await api.completeMilestone(milestoneId);
      setEngagement((prev: any) => ({
        ...prev,
        milestones: prev.milestones.map((m: any) =>
          m.id === milestoneId ? { ...m, completedAt: new Date().toISOString() } : m,
        ),
      }));
    } catch (e: any) { setError(e.message); }
  }

  async function handleSendLetter() {
    setSendingLetter(true);
    try {
      await api.sendEngagementLetter(id);
      await load();
    } catch (e: any) { setError(e.message); } finally { setSendingLetter(false); }
  }

  // Group messages: date separators + consecutive sender grouping
  const groupedMessages = useMemo(() => {
    return messages.map((msg, i) => {
      const prev = messages[i - 1];
      const next = messages[i + 1];
      const msgDate = new Date(msg.createdAt);
      const prevDate = prev ? new Date(prev.createdAt) : null;

      const showDateSep = !prev || format(msgDate, 'yyyy-MM-dd') !== format(prevDate!, 'yyyy-MM-dd');
      const dateLabel = showDateSep ? dateSeparatorLabel(msgDate) : '';

      const isLastInGroup = !next || next.senderType !== msg.senderType || next.senderId !== msg.senderId;

      return { msg, showDateSep, dateLabel, isLastInGroup };
    });
  }, [messages]);

  async function loadOfficerActivity() {
    if (activityLoaded) return;
    setActivityLoading(true);
    try {
      const data = await api.getOfficerActivity(id);
      setOfficerActivity(data);
      setActivityLoaded(true);
    } catch {} finally {
      setActivityLoading(false);
    }
  }

  async function handleSendChecklist() {
    setSendingChecklist(true);
    try {
      await api.sendDocumentChecklist(id, checklistPathway);
      setChecklistOpen(false);
      await loadMessages();
    } catch (e: any) { setError(e.message); } finally { setSendingChecklist(false); }
  }

  if (loading) return <DetailSkeleton />;
  if (!engagement) return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
      {error || 'Case not found.'}
    </div>
  );

  const person = engagement.person ?? {};
  const milestones: any[] = engagement.milestones ?? [];
  const orders: any[] = engagement.orders ?? [];
  const totalPaid = orders.filter((o: any) => o.status === 'PAID').reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);
  const totalPending = orders.filter((o: any) => o.status !== 'PAID').reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);

  const isStaffSender = (msg: any) => msg.senderType === 'STAFF' || msg.senderType === 'ADMIN';

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{person.name ?? 'Case Detail'}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Engagement · {id.slice(0, 8)}…</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setChecklistOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
          >
            <FileText className="h-3.5 w-3.5" /> Send Checklist
          </button>
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[engagement.status] ?? 'bg-muted text-muted-foreground border-border'}`}>
            {statusLabel(engagement.status)}
          </span>
        </div>
      </div>

      {/* Document checklist modal */}
      {checklistOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-white shadow-xl p-6 space-y-5 mx-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-foreground">Send Document Checklist</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Sends a formatted email to the client and posts it in the portal chat.</p>
              </div>
              <button onClick={() => setChecklistOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Select pathway / regulatory body</label>
              <select
                value={checklistPathway}
                onChange={(e) => setChecklistPathway(e.target.value)}
                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
              >
                <optgroup label="UAE">
                  <option value="UAE_DATAFLOW_NURSE">UAE DataFlow — Nurse</option>
                  <option value="UAE_DATAFLOW_PHYSICIAN">UAE DataFlow — Physician</option>
                  <option value="UAE_DHA">UAE DHA (Dubai Health Authority)</option>
                  <option value="UAE_MOH_DOH">UAE MOH / DOH</option>
                </optgroup>
                <optgroup label="United Kingdom">
                  <option value="UK_NMC">UK NMC Registration</option>
                </optgroup>
                <optgroup label="United States">
                  <option value="US_NCLEX_CGFNS">US NCLEX-RN / CGFNS</option>
                </optgroup>
                <optgroup label="Ireland">
                  <option value="IRELAND_NMBI">Ireland NMBI Registration</option>
                </optgroup>
              </select>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setChecklistOpen(false)}
                className="flex-1 rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendChecklist}
                disabled={sendingChecklist}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {sendingChecklist ? <CircleNotch className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                {sendingChecklist ? 'Sending…' : 'Send checklist'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <WarningCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* 3-column grid: profile | engagement detail | financial */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Client profile */}
        <div className="rounded-2xl border border-border bg-white shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-lg font-bold text-white">
              {(person.name ?? 'UN').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-foreground">{person.name ?? '—'}</p>
              <p className="text-xs text-muted-foreground capitalize">{person.profession ?? 'Unknown profession'}</p>
            </div>
          </div>

          <div className="space-y-2.5 text-sm">
            {person.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Envelope className="h-4 w-4 shrink-0" />
                <a href={`mailto:${person.email}`} className="hover:text-primary truncate">{person.email}</a>
              </div>
            )}
            {person.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                <span>{person.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-4 w-4 shrink-0" />
              <span>{person.locale === 'fr' ? 'French' : 'English'}</span>
            </div>
            {person.createdAt && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4 shrink-0" />
                <span>Member since {format(new Date(person.createdAt), 'MMM yyyy')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Engagement detail */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="border-b border-border bg-muted/20 px-5 py-3.5 flex items-center justify-between">
            <p className="font-semibold text-foreground text-sm">Engagement</p>
            <span className="text-xs text-muted-foreground">
              Created {engagement.createdAt ? formatDistanceToNow(new Date(engagement.createdAt), { addSuffix: true }) : '—'}
            </span>
          </div>
          <div className="p-5 space-y-4">

            {/* Engagement letter status */}
            <div className="flex items-start gap-3 rounded-xl border border-border p-4">
              {engagement.letterSignedAt ? (
                <>
                  <Seal className="h-5 w-5 text-primary shrink-0 mt-0.5" weight="fill" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Engagement letter signed</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Signed {format(new Date(engagement.letterSignedAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Signature className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-800">Engagement letter pending</p>
                    <p className="text-xs text-amber-700 mt-0.5">Client has not yet signed the engagement letter.</p>
                  </div>
                  {role === 'ADMIN' && (
                    <button
                      onClick={handleSendLetter}
                      disabled={sendingLetter}
                      className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
                    >
                      {sendingLetter ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <Signature className="h-3.5 w-3.5" />}
                      Send letter
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Assigned consultant */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Assigned consultant</p>
                {engagement.consultantId ? (
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {(consultants.find((c) => c.id === engagement.consultantId)?.name ?? 'CN').slice(0, 2).toUpperCase()}
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {consultants.find((c) => c.id === engagement.consultantId)?.name ?? engagement.consultantId}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Unassigned</p>
                )}
              </div>

              {role === 'ADMIN' && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    {engagement.consultantId ? 'Reassign' : 'Assign'} consultant
                  </p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select
                        value={selectedConsultant}
                        onChange={(e) => setSelectedConsultant(e.target.value)}
                        className="h-9 w-full appearance-none rounded-xl border border-border bg-white pl-3 pr-7 text-sm outline-none focus:border-primary"
                      >
                        <option value="">Select consultant…</option>
                        {consultants.map((c) => (
                          <option key={c.id} value={c.id}>{c.name ?? c.id}</option>
                        ))}
                      </select>
                      <CaretDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    </div>
                    <button
                      onClick={handleAssign}
                      disabled={!selectedConsultant || assigning}
                      className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
                    >
                      {assigning ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Status update (admin only) */}
            {role === 'ADMIN' && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Update status</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="h-9 w-full appearance-none rounded-xl border border-border bg-white pl-3 pr-7 text-sm outline-none focus:border-primary"
                    >
                      <option value="">Select new status…</option>
                      {['ACTIVE', 'ON_HOLD', 'COMPLETED', 'TERMINATED'].map((s) => (
                        <option key={s} value={s}>{statusLabel(s)}</option>
                      ))}
                    </select>
                    <CaretDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  </div>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={!newStatus || updatingStatus}
                    className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
                  >
                    {updatingStatus ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <Flag className="h-3.5 w-3.5" />}
                    Update
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="border-b border-border bg-muted/20 px-5 py-3.5 flex items-center justify-between">
          <p className="font-semibold text-foreground text-sm">Milestones</p>
          <button
            onClick={() => setShowMilestoneInput((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>

        {showMilestoneInput && (
          <div className="flex gap-2 border-b border-border px-5 py-3">
            <input
              value={milestoneLabel}
              onChange={(e) => setMilestoneLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddMilestone()}
              placeholder="Milestone label (e.g. DataFlow submitted)"
              className="flex-1 h-9 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              onClick={handleAddMilestone}
              disabled={addingMilestone || !milestoneLabel.trim()}
              className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              {addingMilestone ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </button>
            <button onClick={() => { setShowMilestoneInput(false); setMilestoneLabel(''); }} className="rounded-xl p-2 hover:bg-muted/60">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        )}

        {milestones.length === 0 && !showMilestoneInput ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Flag className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No milestones yet. Add one to track case progress.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {milestones.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3.5">
                <button
                  onClick={() => !m.completedAt && handleCompleteMilestone(m.id)}
                  disabled={!!m.completedAt}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all ${
                    m.completedAt
                      ? 'border-primary bg-primary cursor-default'
                      : 'border-border bg-white hover:border-primary/50 cursor-pointer'
                  }`}
                >
                  {m.completedAt && (
                    <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${m.completedAt ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {m.label}
                  </p>
                  {m.completedAt && (
                    <p className="text-xs text-muted-foreground">
                      Completed {formatDistanceToNow(new Date(m.completedAt), { addSuffix: true })}
                    </p>
                  )}
                </div>
                {!m.completedAt && <Clock className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
                {m.completedAt && <CheckCircle className="h-4 w-4 text-primary shrink-0" weight="fill" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Orders / payments */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="border-b border-border bg-muted/20 px-5 py-3.5 flex items-center justify-between">
          <p className="font-semibold text-foreground text-sm">Payments</p>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">Paid: <span className="font-bold text-primary">${totalPaid.toLocaleString()}</span></span>
            {totalPending > 0 && <span className="text-muted-foreground">Pending: <span className="font-bold text-amber-600">${totalPending.toLocaleString()}</span></span>}
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CurrencyDollar className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No orders yet for this engagement.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((order: any) => (
              <div key={order.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${ORDER_STATUS_STYLES[order.status] ?? 'bg-muted text-muted-foreground border-border'}`}>
                        {statusLabel(order.status)}
                      </span>
                      <span className="text-xs text-muted-foreground">{order.paymentMode?.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="space-y-0.5">
                      {(order.lineItems ?? []).map((li: any) => (
                        <p key={li.id} className="text-xs text-muted-foreground">
                          · {li.serviceItem?.name ?? 'Service'} — ${Number(li.priceCharged).toLocaleString()}
                        </p>
                      ))}
                    </div>
                    {order.installmentSchedules?.length > 0 && (
                      <div className="mt-2 space-y-0.5">
                        {order.installmentSchedules.map((inst: any) => (
                          <p key={inst.id} className="text-xs text-muted-foreground">
                            Instalment #{inst.installmentNo}: ${Number(inst.amount).toLocaleString()} ·{' '}
                            <span className={inst.status === 'PAID' ? 'text-primary' : 'text-amber-600'}>{inst.status}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-foreground">${Number(order.total).toLocaleString()}</p>
                    {order.receipts?.length > 0 && (
                      <p className="text-xs text-primary mt-0.5">{order.receipts.length} receipt{order.receipts.length > 1 ? 's' : ''}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Study Plan */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="border-b border-border bg-muted/20 px-5 py-3.5 flex items-center justify-between">
          <p className="font-semibold text-foreground text-sm">Study Plan</p>
          <button
            onClick={() => { setShowPlanForm((v) => !v); setPlanItems([{ topic: '', dueDate: '' }]); }}
            className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> {studyPlan?.items?.length ? 'New plan' : 'Create plan'}
          </button>
        </div>

        {showPlanForm && (
          <div className="border-b border-border p-5 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Plan items</p>
            <div className="space-y-2">
              {planItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    value={item.topic}
                    onChange={(e) => setPlanItems((prev) => prev.map((p, i) => i === idx ? { ...p, topic: e.target.value } : p))}
                    placeholder="Topic (e.g. Pharmacology fundamentals)"
                    className="flex-1 h-9 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="date"
                    value={item.dueDate}
                    onChange={(e) => setPlanItems((prev) => prev.map((p, i) => i === idx ? { ...p, dueDate: e.target.value } : p))}
                    className="h-9 w-36 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  {planItems.length > 1 && (
                    <button
                      onClick={() => setPlanItems((prev) => prev.filter((_, i) => i !== idx))}
                      className="rounded-xl p-2 hover:bg-rose-50 text-muted-foreground hover:text-rose-600 transition-colors"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPlanItems((prev) => [...prev, { topic: '', dueDate: '' }])}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <Plus className="h-3 w-3" /> Add item
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowPlanForm(false); setPlanItems([{ topic: '', dueDate: '' }]); }}
                  className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePlan}
                  disabled={savingPlan || !planItems.some((i) => i.topic.trim())}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
                >
                  {savingPlan ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Save plan
                </button>
              </div>
            </div>
          </div>
        )}

        {studyPlan?.items?.length > 0 ? (
          <div className="divide-y divide-border">
            {(studyPlan.items as any[]).map((item: any) => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${item.completedAt ? 'border-primary bg-primary' : 'border-border bg-white'}`}>
                  {item.completedAt && (
                    <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${item.completedAt ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {item.topic}
                  </p>
                  {item.dueDate && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Due {format(new Date(item.dueDate), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
                {item.completedAt
                  ? <CheckCircle className="h-4 w-4 text-primary shrink-0" weight="fill" />
                  : <Clock className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
              </div>
            ))}
          </div>
        ) : !showPlanForm ? (
          <div className="flex flex-col items-center py-8 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No study plan yet. Create one to guide this client's exam prep.</p>
          </div>
        ) : null}
      </div>

      {/* ── Officer Activity ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => {
            const next = !activityOpen;
            setActivityOpen(next);
            if (next) loadOfficerActivity();
          }}
          className="w-full flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/20 hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Note className="h-4 w-4 text-primary" />
            <p className="font-semibold text-foreground text-sm">Officer Activity</p>
            {officerActivity?.slaAlert && (
              <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                <Warning className="h-3 w-3" /> SLA alert
              </span>
            )}
          </div>
          <CaretDown className={`h-4 w-4 text-muted-foreground transition-transform ${activityOpen ? 'rotate-180' : ''}`} />
        </button>

        {activityOpen && (
          <div className="p-5">
            {activityLoading ? (
              <div className="flex items-center justify-center py-8">
                <CircleNotch className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !officerActivity || officerActivity.timeline?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No officer activity yet for this case.</p>
            ) : (
              <>
                {officerActivity.slaAlert && (
                  <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <Warning className="h-4 w-4 shrink-0" />
                    No tracking update in {officerActivity.daysSinceUpdate} days — SLA threshold exceeded.
                  </div>
                )}
                <div className="space-y-3">
                  {(officerActivity.timeline as any[]).map((item: any, i: number) => {
                    if (item.type === 'note') {
                      const n = item.data;
                      return (
                        <div key={n.id ?? i} className={`rounded-xl px-4 py-3 text-xs ${n.isInternal ? 'bg-muted/50 border border-border' : 'bg-teal-50 border border-teal-200'}`}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Note className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-semibold text-foreground">{n.author?.name ?? 'Officer'}</span>
                            {!n.isInternal && (
                              <span className="rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold text-teal-700">Sent to client</span>
                            )}
                            {n.isInternal && (
                              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground flex items-center gap-0.5">
                                <Lock className="h-2.5 w-2.5" /> Internal
                              </span>
                            )}
                            <span className="ml-auto text-muted-foreground">{new Date(item.ts).toLocaleDateString()}</span>
                          </div>
                          <p className="text-foreground">{n.content}</p>
                        </div>
                      );
                    }
                    if (item.type === 'tracking') {
                      const t = item.data;
                      return (
                        <div key={t.id ?? i} className="rounded-xl border border-border bg-blue-50/50 px-4 py-3 text-xs">
                          <div className="flex items-center gap-1.5 mb-1">
                            <ArrowSquareUpRight className="h-3.5 w-3.5 text-primary" />
                            <span className="font-semibold text-foreground">{t.portal}</span>
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary font-medium">{t.status}</span>
                            <span className="ml-auto text-muted-foreground">{new Date(item.ts).toLocaleDateString()}</span>
                          </div>
                          {t.referenceNumber && <p className="text-muted-foreground">Ref: {t.referenceNumber}</p>}
                          {t.notes && <p className="text-muted-foreground mt-0.5">{t.notes}</p>}
                        </div>
                      );
                    }
                    if (item.type === 'escalation') {
                      const e = item.data;
                      return (
                        <div key={e.id ?? i} className={`rounded-xl border px-4 py-3 text-xs ${e.status === 'RESOLVED' ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <Warning className={`h-3.5 w-3.5 ${e.status === 'RESOLVED' ? 'text-emerald-600' : 'text-rose-600'}`} />
                            <span className="font-semibold text-foreground">Escalation</span>
                            <span className={`rounded-full px-2 py-0.5 font-medium ${e.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {e.status}
                            </span>
                            <span className="ml-auto text-muted-foreground">{new Date(item.ts).toLocaleDateString()}</span>
                          </div>
                          <p className="text-foreground">{e.reason}</p>
                          {e.resolution && <p className="text-emerald-700 mt-1">Resolution: {e.resolution}</p>}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Messages (WhatsApp-style) ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden flex flex-col" style={{ height: 580 }}>

        {/* Chat header */}
        <div className="shrink-0 flex items-center gap-3 border-b border-border bg-[#0F4C81] px-5 py-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
            {(person.name ?? 'CL').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm leading-tight">{person.name ?? 'Client'}</p>
            <p className="text-xs text-white/60">
              {person.profession ? person.profession.replace(/_/g, ' ') : 'Engagement client'} · auto-refreshes every 20s
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-white/70">Active</span>
            {msgLoading && <CircleNotch className="h-3.5 w-3.5 animate-spin text-white/60 ml-2" />}
          </div>
        </div>

        {/* Messages scroll area */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="relative flex-1 overflow-y-auto px-4 py-4 space-y-0.5"
          style={{ background: '#f0f2f5' }}
        >
          {messages.length === 0 && !msgLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ChatCircle className="h-12 w-12 text-muted-foreground/20 mb-3" weight="fill" />
              <p className="text-sm font-medium text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Start the conversation with {person.name ?? 'this client'} below</p>
            </div>
          ) : (
            <>
              {groupedMessages.map((item, gi) => {
                const { msg, showDateSep, dateLabel, isLastInGroup } = item;
                const staff = isStaffSender(msg);

                return (
                  <div key={msg.id ?? gi}>
                    {/* Date separator */}
                    {showDateSep && (
                      <div className="flex items-center justify-center my-3">
                        <span className="rounded-full bg-white/90 border border-border/40 px-3 py-1 text-[11px] text-muted-foreground font-medium shadow-sm">
                          {dateLabel}
                        </span>
                      </div>
                    )}

                    {/* Bubble row */}
                    <div className={`flex items-end gap-1.5 mb-0.5 ${staff ? 'flex-row-reverse' : 'flex-row'}`}>

                      {/* Avatar — only on last bubble in a group */}
                      <div className="h-7 w-7 shrink-0">
                        {isLastInGroup ? (
                          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                            staff ? 'bg-primary text-white' : 'bg-[#00A896] text-white'
                          }`}>
                            {staff
                              ? (me?.name ?? 'A').slice(0, 1).toUpperCase()
                              : (person.name ?? 'C').slice(0, 1).toUpperCase()
                            }
                          </div>
                        ) : null}
                      </div>

                      {/* Bubble */}
                      <div
                        className={`relative max-w-[68%] px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                          staff
                            ? 'bg-[#0F4C81] text-white rounded-2xl rounded-br-sm'
                            : 'bg-white text-foreground rounded-2xl rounded-bl-sm'
                        } ${!isLastInGroup ? (staff ? 'rounded-br-2xl' : 'rounded-bl-2xl') : ''}`}
                      >
                        {/* Check if it's a document reference */}
                        {msg.content?.startsWith('[Document shared:') ? (
                          <div className="flex items-start gap-2">
                            <FileText className={`h-4 w-4 shrink-0 mt-0.5 ${staff ? 'text-white/70' : 'text-primary'}`} />
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        )}

                        {/* Timestamp + read receipts (last in group only) */}
                        {isLastInGroup && (
                          <div className={`flex items-center gap-1 mt-1 ${staff ? 'justify-end' : 'justify-start'}`}>
                            <span className={`text-[10px] ${staff ? 'text-white/50' : 'text-muted-foreground/50'}`}>
                              {format(new Date(msg.createdAt), 'HH:mm')}
                            </span>
                            {staff && (
                              msg.readAt
                                ? <CheckCircle className="h-3 w-3 text-white/60" weight="fill" />
                                : <Check className="h-3 w-3 text-white/40" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </>
          )}

          {/* New messages banner */}
          {newBanner && (
            <div className="sticky bottom-3 flex justify-center">
              <button
                onClick={() => { scrollToBottom(); setNewBanner(false); }}
                className="flex items-center gap-1.5 rounded-full bg-primary/90 px-4 py-1.5 text-xs font-semibold text-white shadow-lg hover:bg-primary transition-colors"
              >
                <ArrowDown className="h-3.5 w-3.5" /> New messages
              </button>
            </div>
          )}
        </div>

        {/* Scroll-to-bottom FAB */}
        {!atBottom && !newBanner && (
          <div className="relative">
            <button
              onClick={scrollToBottom}
              className="absolute bottom-2 right-4 -translate-y-full flex h-8 w-8 items-center justify-center rounded-full bg-white border border-border shadow-md hover:bg-muted/50 transition-all z-10"
            >
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Quick replies */}
        {messages.length > 0 && (
          <div className="shrink-0 flex gap-2 overflow-x-auto px-4 py-2 border-t border-border/60 bg-white scrollbar-hide">
            {QUICK_REPLIES.map((qr) => (
              <button
                key={qr}
                onClick={() => { setCompose(qr); composeRef.current?.focus(); }}
                className="whitespace-nowrap shrink-0 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-foreground hover:bg-muted/80 hover:border-primary/40 transition-colors"
              >
                {qr}
              </button>
            ))}
          </div>
        )}

        {/* Attachment panel */}
        {attachOpen && (
          <div className="shrink-0 border-t border-border bg-white">
            {/* Tab switcher */}
            <div className="flex border-b border-border">
              <button
                onClick={() => { setAttachTab('vault'); if (person.id) loadPersonDocs(person.id); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-colors ${
                  attachTab === 'vault' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="h-3.5 w-3.5" /> Attach from vault
              </button>
              <button
                onClick={() => setAttachTab('request')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-colors ${
                  attachTab === 'request' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <UploadSimple className="h-3.5 w-3.5" /> Request upload
              </button>
            </div>

            {/* Vault tab */}
            {attachTab === 'vault' && (
              <div className="max-h-40 overflow-y-auto divide-y divide-border/60">
                {loadingDocs ? (
                  <div className="flex items-center justify-center py-6">
                    <CircleNotch className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : personDocs.length === 0 ? (
                  <p className="py-5 text-center text-xs text-muted-foreground">No documents in vault for this client.</p>
                ) : (
                  personDocs.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => handleAttachFromVault(doc)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/40 transition-colors"
                    >
                      {docTypeIcon(doc.type ?? '')}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{doc.type?.replace(/_/g, ' ') ?? 'Document'}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {doc.status} · {doc.uploadedAt ? format(new Date(doc.uploadedAt), 'MMM d, yyyy') : '—'}
                        </p>
                      </div>
                      <LinkIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Request upload tab */}
            {attachTab === 'request' && (
              <div className="max-h-40 overflow-y-auto divide-y divide-border/60">
                {DOC_REQUEST_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.label}
                    onClick={() => handleRequestTemplate(tmpl)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/40 transition-colors"
                  >
                    <UploadSimple className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{tmpl.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{tmpl.text}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Compose bar */}
        <div className="shrink-0 flex items-end gap-2 border-t border-border bg-white px-4 py-3">
          {/* Attach button */}
          <button
            onClick={() => {
              setAttachOpen((v) => !v);
              if (!attachOpen && attachTab === 'vault' && person.id) loadPersonDocs(person.id);
            }}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
              attachOpen ? 'bg-primary text-white' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            title="Attach document or request upload"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          {/* Textarea */}
          <div className="relative flex-1">
            <textarea
              ref={composeRef}
              value={compose}
              onChange={(e) => { setCompose(e.target.value); autoResize(e.target); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
              }}
              placeholder={`Message ${person.name ?? 'client'}… (Enter to send, Shift+Enter for newline)`}
              rows={1}
              className="w-full resize-none rounded-full border border-border bg-[#f0f2f5] px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 max-h-[120px] leading-relaxed pr-16"
            />
            {compose.length > 300 && (
              <span className={`absolute bottom-2.5 right-3 text-[10px] ${compose.length > 1000 ? 'text-rose-500' : 'text-muted-foreground/60'}`}>
                {compose.length}/1000
              </span>
            )}
          </div>

          {/* Send button */}
          <button
            onClick={() => handleSendMessage()}
            disabled={!compose.trim() || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 disabled:opacity-40 transition-colors shadow-sm"
          >
            {sending ? <CircleNotch className="h-4 w-4 animate-spin" /> : <PaperPlaneRight className="h-4 w-4" weight="fill" />}
          </button>
        </div>
      </div>
    </div>
  );
}
