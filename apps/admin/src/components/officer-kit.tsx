'use client';

import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { CircleNotch, X } from '@mjn/ui';
import { api } from '../lib/api';

// Shared by the processing officer screens: My work, My caseload and the case workspace.

export const CASE_STATUS: Record<string, { label: string; dot: string }> = {
  PENDING_SIGNATURE: { label: 'Awaiting signature', dot: 'bg-accent' },
  ACTIVE:            { label: 'Active',             dot: 'bg-secondary' },
  ON_HOLD:           { label: 'On hold',            dot: 'bg-muted-foreground/50' },
  COMPLETED:         { label: 'Completed',          dot: 'bg-primary' },
  TERMINATED:        { label: 'Terminated',         dot: 'bg-rose-500' },
};

export const SUBMISSION_STATUS: Record<string, { label: string; dot: string }> = {
  SUBMITTED:    { label: 'Submitted',             dot: 'bg-primary/40' },
  IN_REVIEW:    { label: 'In review',             dot: 'bg-primary/40' },
  PENDING:      { label: 'In review',             dot: 'bg-primary/40' },
  PENDING_DOCS: { label: 'More documents needed', dot: 'bg-accent' },
  RESUBMITTED:  { label: 'Resubmitted',           dot: 'bg-primary/40' },
  APPROVED:     { label: 'Approved',              dot: 'bg-secondary' },
  REJECTED:     { label: 'Rejected',              dot: 'bg-rose-500' },
};
export const SUBMISSION_ORDER = ['SUBMITTED', 'IN_REVIEW', 'PENDING_DOCS', 'RESUBMITTED', 'APPROVED', 'REJECTED'];
export const SUBMISSION_DONE = ['APPROVED', 'REJECTED'];
export const PORTALS = ['DataFlow', 'DHA', 'MOH', 'DOH', 'NMC', 'NCLEX/CGFNS', 'NMBI', 'Other'];

export const DOC_STATUS: Record<string, { label: string; dot: string }> = {
  PENDING:        { label: 'Waiting for review', dot: 'bg-accent' },
  VERIFIED:       { label: 'Verified',           dot: 'bg-secondary' },
  REJECTED:       { label: 'Rejected',           dot: 'bg-rose-500' },
  PENDING_CLIENT: { label: 'With client',        dot: 'bg-primary/40' },
};

export const OPEN_CASE = ['PENDING_SIGNATURE', 'ACTIVE', 'ON_HOLD'];

export function title(s?: string | null) {
  return (s ?? '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
export function day(date?: string | Date | null) {
  return date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}
export function shortDay(date?: string | Date | null) {
  return date ? new Date(date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }) : '—';
}
/** Whole calendar days from today: negative is past, 0 is today. */
export function daysFromToday(date: string | Date) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Math.round((new Date(date).setHours(0, 0, 0, 0) - start.getTime()) / 86400000);
}
export function ago(date?: string | Date | null) {
  if (!date) return '—';
  const days = -daysFromToday(date);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 60) return `${days} days ago`;
  return day(date);
}
export function caseRef(id: string) {
  return `ENG-${id.slice(-6).toUpperCase()}`;
}
export function money(n: number) {
  return `$${Number(n ?? 0).toLocaleString('en-US')}`;
}
/** yyyy-mm-dd for a date input. */
export function inputDate(date?: string | Date | null) {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const card = 'rounded-2xl border border-border bg-white';
export const btnPrimary = 'inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-40';
export const btnOutline = 'inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted/60 disabled:opacity-40';
export const field = 'w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';
export const fieldLabel = 'mb-1.5 block text-xs font-bold text-foreground';
export const heading = 'text-xs font-bold uppercase tracking-widest text-muted-foreground';

export function Dot({ className }: { className: string }) {
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${className}`} />;
}

export function Modal({ title: head, sub, onClose, children, wide }: { title: string; sub?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={head} className={`my-auto w-full ${wide ? 'max-w-xl' : 'max-w-md'} rounded-2xl border border-border bg-white p-6 shadow-xl`} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-foreground">{head}</h2>
            {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Record or update a submission ─────────────────────────────────────────────

function plusDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return inputDate(d);
}

/** Opens over the case so the officer never leaves it. Pass `record` to update an existing submission. */
export function SubmissionDialog({ engagementId, record, onClose, onSaved }: { engagementId: string; record?: any | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    portal: record?.portal ?? 'DataFlow',
    referenceNumber: record?.referenceNumber ?? '',
    submittedAt: record ? inputDate(record.submittedAt) : inputDate(new Date()),
    status: record?.status ?? 'SUBMITTED',
    nextActionDate: record ? inputDate(record.nextActionDate) : plusDays(7),
    notes: record?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const finished = SUBMISSION_DONE.includes(form.status);
  const portals = PORTALS.includes(form.portal) ? PORTALS : [form.portal, ...PORTALS];

  async function save() {
    setSaving(true);
    try {
      const data = {
        portal: form.portal,
        referenceNumber: form.referenceNumber.trim(),
        status: form.status,
        notes: form.notes.trim(),
        submittedAt: form.submittedAt || undefined,
      };
      if (record) {
        await api.updateTracking(engagementId, record.id, { ...data, nextActionDate: finished ? null : form.nextActionDate || null });
        toast.success('Submission updated.');
      } else {
        await api.addTracking(engagementId, { ...data, nextActionDate: finished ? undefined : form.nextActionDate || undefined });
        toast.success('Submission recorded.');
      }
      onSaved();
    } catch (e: any) {
      toast.error(e.message ?? 'The submission was not saved.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={record ? 'Update submission' : 'Record a submission'}
      sub={record ? 'Change the status or the next follow-up date as the application moves.' : 'What you submitted, to which body, and when to follow up.'}
      onClose={onClose}
      wide
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sub-portal" className={fieldLabel}>Body or portal</label>
          <select id="sub-portal" value={form.portal} onChange={(e) => set({ portal: e.target.value })} className={field}>
            {portals.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="sub-ref" className={fieldLabel}>Reference number</label>
          <input id="sub-ref" value={form.referenceNumber} onChange={(e) => set({ referenceNumber: e.target.value })} placeholder="For example DHA-2026-001234" className={field} />
        </div>
        <div>
          <label htmlFor="sub-date" className={fieldLabel}>Submitted on</label>
          <input id="sub-date" type="date" value={form.submittedAt} onChange={(e) => set({ submittedAt: e.target.value })} className={field} />
        </div>
        <div>
          <label htmlFor="sub-status" className={fieldLabel}>Status</label>
          <select id="sub-status" value={form.status} onChange={(e) => set({ status: e.target.value })} className={field}>
            {(SUBMISSION_ORDER.includes(form.status) ? SUBMISSION_ORDER : [form.status, ...SUBMISSION_ORDER]).map((s) => (
              <option key={s} value={s}>{SUBMISSION_STATUS[s]?.label ?? title(s)}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="sub-next" className={fieldLabel}>Next follow-up</label>
          {finished ? (
            <p className="rounded-xl bg-muted/50 px-3 py-2 text-sm text-muted-foreground">No follow-up is needed once a submission is {SUBMISSION_STATUS[form.status].label.toLowerCase()}.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <input id="sub-next" type="date" value={form.nextActionDate} onChange={(e) => set({ nextActionDate: e.target.value })} className={`${field} w-44`} />
              {[['In 3 days', 3], ['In 7 days', 7], ['In 14 days', 14]].map(([label, n]) => (
                <button key={label as string} type="button" onClick={() => set({ nextActionDate: plusDays(n as number) })} className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-foreground">{label}</button>
              ))}
              {form.nextActionDate && <button type="button" onClick={() => set({ nextActionDate: '' })} className="text-xs font-semibold text-muted-foreground hover:text-foreground">Clear</button>}
            </div>
          )}
          {!finished && <p className="mt-1.5 text-xs text-muted-foreground">This case appears under “Do first” on that day until you update the submission.</p>}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="sub-notes" className={fieldLabel}>Notes (internal)</label>
          <textarea id="sub-notes" value={form.notes} onChange={(e) => set({ notes: e.target.value })} rows={3} placeholder="What happened, who you spoke to, what is outstanding." className={`${field} resize-none`} />
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className={btnOutline}>Cancel</button>
        <button onClick={save} disabled={saving || !form.portal} className={btnPrimary}>
          {saving && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} {record ? 'Save changes' : 'Record submission'}
        </button>
      </div>
    </Modal>
  );
}
