'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Badge, Button, Skeleton } from '@mjn/ui';
import {
  FileText, CalendarBlank,
  CheckCircle, Clock,
  TrendUp, UploadSimple, Flag, Envelope, Signature,
  Seal, ArrowSquareOut,
  X, PaperPlaneTilt, ChatText, CreditCard, BookOpen,
  Copy, MapPin, Buildings,
} from '@phosphor-icons/react';
import { useUser } from '../../../contexts/user-context';
import { toast } from 'sonner';

const COUNTRY_FLAGS: Record<string, string> = {
  UAE: '🇦🇪', UK: '🇬🇧', US: '🇺🇸', Ireland: '🇮🇪', Canada: '🇨🇦', Australia: '🇦🇺',
};

function engagementStatusVariant(status: string): 'success' | 'warning' | 'outline' | 'destructive' {
  if (status === 'ACTIVE') return 'success';
  if (status === 'ON_HOLD') return 'warning';
  if (status === 'TERMINATED') return 'destructive';
  return 'outline';
}

function formatCaseRef(id: string | undefined): string {
  if (!id) return '—';
  return `ENG-${id.slice(-6).toUpperCase()}`;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CaseSkeleton() {
  return (
    <div className="space-y-6">
      <div><Skeleton className="h-8 w-44 mb-2" /><Skeleton className="h-4 w-80" /></div>
      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-6">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
        <div className="hidden xl:block w-[280px] shrink-0 space-y-4">
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ── Message Modal ─────────────────────────────────────────────────────────────

function MessageModal({ consultant, onClose }: { consultant: any; onClose: () => void }) {
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  async function send() {
    if (!msg.trim()) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 600));
    toast.success('Message sent to your consultant.');
    setSending(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Message your consultant</p>
            {consultant?.name && <p className="text-xs text-muted-foreground">{consultant.name}</p>}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition"><X className="h-4 w-4" /></button>
        </div>
        <textarea
          ref={ref}
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Ask a question or share an update…"
          rows={4}
          className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
        />
        <div className="mt-3 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            onClick={send}
            disabled={!msg.trim() || sending}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            <PaperPlaneTilt className="h-3.5 w-3.5" /> {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mini Progress Ring ────────────────────────────────────────────────────────

function MiniRing({ pct }: { pct: number }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative flex items-center justify-center">
      <svg width="76" height="76" viewBox="0 0 68 68" className="-rotate-90">
        <circle cx="34" cy="34" r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-muted" />
        <circle
          cx="34" cy="34" r={r}
          fill="none" stroke="currentColor" strokeWidth="7" className="text-primary"
          strokeDasharray={`${(pct / 100) * circ} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.9s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-foreground leading-none">{pct}%</span>
      </div>
    </div>
  );
}

// ── Right Sidebar ─────────────────────────────────────────────────────────────

function CaseSidebar({
  consultant, engagement, progressPct, completedCount, milestones, onMessage, router,
}: {
  consultant: any;
  engagement: any;
  progressPct: number;
  completedCount: number;
  milestones: any[];
  onMessage: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const caseRef = formatCaseRef(engagement?.id);

  function copyRef() {
    navigator.clipboard.writeText(caseRef).then(() => toast.success('Case reference copied.'));
  }

  return (
    <div className="hidden xl:block w-[280px] shrink-0 sticky top-6 self-start space-y-4">

      {/* Consultant card */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Your Consultant</p>
        {consultant ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-sm font-bold text-white shadow-sm">
                {consultant.name?.slice(0, 2).toUpperCase() ?? 'CN'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight">{consultant.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                  <p className="text-xs text-muted-foreground">Case Consultant</p>
                </div>
                {consultant.email && (
                  <a
                    href={`mailto:${consultant.email}`}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-0.5 transition-colors"
                  >
                    <Envelope className="h-3 w-3" />
                    {consultant.email}
                  </a>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onMessage}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
              >
                <ChatText className="h-3.5 w-3.5" /> Message
              </button>
              <button
                onClick={() => router.push('/bookings')}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
              >
                <CalendarBlank className="h-3.5 w-3.5" /> Book
              </button>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">No consultant assigned yet.</p>
            <button onClick={() => router.push('/bookings')} className="mt-2 text-xs font-semibold text-primary hover:underline">
              Book a consultation →
            </button>
          </div>
        )}
      </div>

      {/* Case reference + progress */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Case Details</p>
        <div className="flex items-center justify-between mb-4">
          <MiniRing pct={progressPct} />
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Milestones</p>
            <p className="text-xl font-bold text-foreground">{completedCount}<span className="text-sm font-normal text-muted-foreground">/{milestones.length}</span></p>
            <p className="text-xs text-muted-foreground">completed</p>
          </div>
        </div>
        <div className="space-y-2.5 text-xs border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Reference</span>
            <button
              onClick={copyRef}
              className="flex items-center gap-1.5 font-mono font-bold text-foreground hover:text-primary transition-colors"
            >
              {caseRef}
              <Copy className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={engagementStatusVariant(engagement.status)} className="text-xs">
              {engagement.status.replace(/_/g, ' ')}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Opened</span>
            <span className="font-medium text-foreground">
              {new Date(engagement.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          {engagement.letterSignedAt && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Letter signed</span>
              <span className="font-medium text-foreground">
                {new Date(engagement.letterSignedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Actions</p>
        <div className="space-y-1.5">
          <button
            onClick={() => router.push('/documents')}
            className="w-full flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            <UploadSimple className="h-4 w-4 text-primary shrink-0" />
            Upload documents
          </button>
          <button
            onClick={() => router.push('/payments')}
            className="w-full flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            <CreditCard className="h-4 w-4 text-primary shrink-0" />
            Payments
          </button>
          <button
            onClick={() => router.push('/academy')}
            className="w-full flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            <BookOpen className="h-4 w-4 text-primary shrink-0" />
            My courses
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CasePage() {
  const router = useRouter();
  const { engagement, progress, loading } = useUser();
  const [messageOpen, setMessageOpen] = useState(false);

  const milestones: any[] = engagement?.milestones ?? [];
  const completedCount = milestones.filter((m) => !!m.completedAt).length;
  const progressPct = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;
  const consultant = engagement?.consultants?.[0] ?? engagement?.consultant ?? null;

  if (loading) return <CaseSkeleton />;

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="My Case"
          subtitle="Track your licensing journey and stay up to date with your consultant."
          actions={
            consultant ? (
              <button
                onClick={() => setMessageOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
              >
                <ChatText className="h-4 w-4" /> Message consultant
              </button>
            ) : undefined
          }
        />

        {/* No engagement state */}
        {!engagement && (
          <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
              <Buildings className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground">No active engagement</h3>
            <p className="mt-2 max-w-sm mx-auto text-sm text-muted-foreground">
              Your consulting engagement will appear here once your consultant sets it up after your initial session.
            </p>
            <button
              onClick={() => router.push('/bookings')}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              <CalendarBlank className="h-4 w-4" /> Book a consultation
            </button>
          </div>
        )}

        {engagement && (
          <div className="flex gap-6 items-start">

            {/* ── Main column ──────────────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-6">

              {/* Engagement letter */}
              <div className={`rounded-2xl border p-6 shadow-sm ${
                !!engagement.letterSignedAt
                  ? 'border-primary/20 bg-primary/5'
                  : 'border-amber-200 bg-amber-50/60'
              }`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      !!engagement.letterSignedAt ? 'bg-primary/10' : 'bg-amber-100'
                    }`}>
                      {!!engagement.letterSignedAt
                        ? <Seal weight="fill" className="h-5 w-5 text-primary" />
                        : <Signature className="h-5 w-5 text-amber-600" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Engagement Letter</h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {!!engagement.letterSignedAt
                          ? 'Signed and on file — your engagement is formally active.'
                          : 'Your engagement letter requires your signature before we can proceed.'}
                      </p>
                      {engagement.letterSignedAt && (
                        <p className="mt-1 text-xs font-medium text-primary">
                          Signed {new Date(engagement.letterSignedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!!engagement.letterSignedAt ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                        <CheckCircle weight="fill" className="h-3.5 w-3.5" /> Signed
                      </span>
                    ) : (
                      <a
                        href={`/sign/${engagement.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
                      >
                        <Signature className="h-4 w-4" /> Sign Letter
                      </a>
                    )}
                  </div>
                </div>
                {!engagement.letterSignedAt && !engagement.letterUrl && (
                  <div className="mt-4 rounded-xl bg-white/70 px-4 py-3 text-xs text-muted-foreground">
                    No engagement letter has been sent yet. Your consultant will send one shortly.
                  </div>
                )}
              </div>

              {/* Engagement overview */}
              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">Engagement Overview</h3>
                      <Badge variant={engagementStatusVariant(engagement.status)} className="text-xs">
                        {engagement.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Opened {new Date(engagement.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  {progress?.currentStage?.pathway?.country && (
                    <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-2.5">
                      <span className="text-2xl leading-none">
                        {COUNTRY_FLAGS[progress.currentStage.pathway.country] ?? ''}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{progress.currentStage.pathway.country} Pathway</p>
                        {progress.currentStage.pathway.regulatoryBody && (
                          <p className="text-xs text-muted-foreground">{progress.currentStage.pathway.regulatoryBody}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {milestones.length > 0 && (
                  <div className="mt-5">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{completedCount} of {milestones.length} milestones complete</span>
                      <span className="font-semibold text-foreground">{progressPct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-primary transition-all duration-700"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {engagement.consultants?.length > 0 && (
                  <div className="mt-5 border-t border-border pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your Team</p>
                    <div className="flex flex-wrap gap-3">
                      {engagement.consultants.map((c: any) => (
                        <div key={c.id} className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/30 px-3 py-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shrink-0">
                            {c.name?.slice(0, 2).toUpperCase() ?? 'CN'}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground">{c.name}</p>
                            {c.email && (
                              <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                                <Envelope className="h-3 w-3" />{c.email}
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Milestone pipeline */}
              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-2">
                  <TrendUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Licensing Pipeline</h3>
                  {milestones.length > 0 && (
                    <span className="ml-auto text-xs text-muted-foreground">{completedCount}/{milestones.length} stages</span>
                  )}
                </div>

                {milestones.length === 0 && (
                  <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-muted/20 py-10 text-center">
                    <Clock className="mb-2 h-7 w-7 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-foreground">Milestones being configured</p>
                    <p className="mt-1 text-xs text-muted-foreground">Your consultant is setting up your licensing stages. Check back soon.</p>
                  </div>
                )}

                {milestones.length > 0 && (
                  <div className="space-y-0">
                    {milestones.map((m: any, i: number) => {
                      const isDone = !!m.completedAt;
                      const isActive = !isDone && i === milestones.findIndex((x: any) => !x.completedAt);
                      const isLast = i === milestones.length - 1;

                      return (
                        <div key={m.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                              isDone
                                ? 'border-primary bg-primary text-white'
                                : isActive
                                ? 'border-primary bg-primary text-white ring-4 ring-primary/15'
                                : 'border-border bg-white text-muted-foreground'
                            }`}>
                              {isDone ? <CheckCircle weight="fill" className="h-4 w-4" /> : i + 1}
                            </div>
                            {!isLast && (
                              <div className={`mt-1 mb-1 w-0.5 flex-1 min-h-8 transition-colors ${
                                isDone ? 'bg-primary/40' : 'bg-border'
                              }`} />
                            )}
                          </div>

                          <div className={`flex-1 min-w-0 ${isLast ? 'pb-0' : 'pb-8'}`}>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className={`text-sm font-semibold ${!isDone && !isActive ? 'text-muted-foreground' : 'text-foreground'}`}>
                                {m.label}
                              </p>
                              {isActive && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                  In Progress
                                </span>
                              )}
                              {isDone && (
                                <span className="text-xs text-muted-foreground">
                                  Completed {new Date(m.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              )}
                            </div>

                            {m.description && (
                              <p className="mt-1 text-xs text-muted-foreground">{m.description}</p>
                            )}

                            {isActive && progress?.currentStage?.requiredDocuments?.length > 0 && (
                              <div className="mt-3 rounded-xl border border-border bg-muted/20 p-4">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Required for this stage
                                </p>
                                <div className="space-y-1.5">
                                  {progress.currentStage.requiredDocuments.map((docType: string, j: number) => (
                                    <div key={j} className="flex items-center gap-2 text-xs text-foreground">
                                      <div className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                                      {docType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                    </div>
                                  ))}
                                </div>
                                <button
                                  onClick={() => router.push('/documents')}
                                  className="mt-3 flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
                                >
                                  <UploadSimple className="h-3.5 w-3.5" /> Upload documents
                                </button>
                              </div>
                            )}

                            {!isDone && !isActive && (
                              <p className="mt-0.5 text-xs text-muted-foreground">Pending previous stage</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Current licensing stage detail */}
              {progress?.currentStage && (
                <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Current Stage Detail</h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-muted/30 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Stage</p>
                      <p className="mt-1 text-sm font-bold text-foreground">{progress.currentStage.label}</p>
                    </div>
                    {progress.currentStage.pathway?.country && (
                      <div className="rounded-xl bg-muted/30 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Destination</p>
                        <p className="mt-1 text-sm font-bold text-foreground">
                          {COUNTRY_FLAGS[progress.currentStage.pathway.country] ?? ''} {progress.currentStage.pathway.country}
                        </p>
                      </div>
                    )}
                    {progress.currentStage.pathway?.regulatoryBody && (
                      <div className="rounded-xl bg-muted/30 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Regulatory Body</p>
                        <p className="mt-1 text-sm font-bold text-foreground">{progress.currentStage.pathway.regulatoryBody}</p>
                      </div>
                    )}
                    {progress.startedAt && (
                      <div className="rounded-xl bg-muted/30 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Stage Started</p>
                        <p className="mt-1 text-sm font-bold text-foreground">
                          {new Date(progress.startedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Right sidebar ─────────────────────────────────────── */}
            <CaseSidebar
              consultant={consultant}
              engagement={engagement}
              progressPct={progressPct}
              completedCount={completedCount}
              milestones={milestones}
              onMessage={() => setMessageOpen(true)}
              router={router}
            />
          </div>
        )}
      </div>

      {messageOpen && (
        <MessageModal consultant={consultant} onClose={() => setMessageOpen(false)} />
      )}
    </>
  );
}
