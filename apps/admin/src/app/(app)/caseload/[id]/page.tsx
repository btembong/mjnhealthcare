'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Skeleton } from '@mjn/ui';
import {
  ArrowLeft, User, Envelope, Phone, Globe, CheckCircle,
  Clock, CircleNotch, WarningCircle, CurrencyDollar,
  Seal, Signature, Flag, Check,
  CaretDown, X, Plus, BookOpen, Trash,
} from '@phosphor-icons/react';
import { api } from '../../../../lib/api';
import { useAdmin } from '../../../../contexts/admin-context';
import { format, formatDistanceToNow } from 'date-fns';

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

function statusLabel(s: string) {
  return s?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? '—';
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

  // Study plan
  const [studyPlan, setStudyPlan] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planItems, setPlanItems] = useState<{ topic: string; dueDate: string }[]>([{ topic: '', dueDate: '' }]);
  const [savingPlan, setSavingPlan] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    try {
      const [eng, cons] = await Promise.allSettled([
        api.getEngagementById(id),
        api.getConsultants(),
      ]);
      if (eng.status === 'fulfilled') {
        setEngagement(eng.value);
        // Load study plan for this person
        const personId = (eng.value as any)?.person?.id;
        if (personId) {
          api.getStudyPlan(personId).then((plan) => setStudyPlan(plan)).catch(() => {});
        }
      }
      if (cons.status === 'fulfilled') setConsultants(cons.value ?? []);
      if (eng.status === 'rejected') setError('Failed to load case.');
    } finally {
      setLoading(false);
    }
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
        <span className={`ml-auto inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[engagement.status] ?? 'bg-muted text-muted-foreground border-border'}`}>
          {statusLabel(engagement.status)}
        </span>
      </div>

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

        {/* Create form */}
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

        {/* Existing plan items */}
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
    </div>
  );
}
