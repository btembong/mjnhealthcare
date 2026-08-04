'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader, Skeleton } from '@mjn/ui';
import {
  CheckCircle, XCircle, Eye, X, CircleNotch, ArrowClockwise,
  MagnifyingGlass, WarningCircle, Clock, ShieldCheck, ArrowSquareOut,
  FileText, User, CalendarBlank, Funnel,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';

// ── Constants ────────────────────────────────────────────────────────────────

const DOC_TYPES = [
  'PASSPORT_COPY', 'DIPLOMA_DEGREE', 'DIPLOMA_TRANSCRIPT', 'BACHELORS_DEGREE',
  'BACHELORS_TRANSCRIPT', 'MASTERS_DEGREE', 'MASTERS_TRANSCRIPT', 'NURSING_LICENSE',
  'MEDICAL_LICENSE', 'OTHER_LICENSE', 'GOOD_STANDING_CERTIFICATE',
  'WORK_EXPERIENCE_CERTIFICATE', 'HIGH_SCHOOL_CERTIFICATE', 'ORDINARY_LEVEL_CERTIFICATE',
  'BIRTH_CERTIFICATE', 'PHOTO_ID', 'BANK_STATEMENT', 'PERSONAL_STATEMENT',
  'REFERENCE_LETTER', 'OTHER',
];

const STATUS_STYLES: Record<string, string> = {
  VERIFIED: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  REJECTED: 'bg-rose-100 text-rose-700',
};

function fmt(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function timeAgo(date: string | Date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

// ── Detail panel ─────────────────────────────────────────────────────────────

function DocPanel({
  doc,
  onClose,
  onVerified,
  onRejected,
}: {
  doc: any;
  onClose: () => void;
  onVerified: (id: string) => void;
  onRejected: (id: string) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<'verify' | 'reject' | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [confirmVerify, setConfirmVerify] = useState(false);

  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.fileUrl ?? '');

  useEffect(() => {
    setPreviewUrl('');
    setPreviewLoading(true);
    setRejectMode(false);
    setConfirmVerify(false);
    setRejectReason('');
    api.getDocumentViewUrl(doc.id)
      .then(({ url }) => setPreviewUrl(url))
      .catch(() => setPreviewUrl(doc.fileUrl ?? ''))
      .finally(() => setPreviewLoading(false));
  }, [doc.id, doc.fileUrl]);

  async function handleVerify() {
    setActionLoading('verify');
    try {
      await api.verifyDocument(doc.id, 'admin');
      toast.success('Document verified.');
      onVerified(doc.id);
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) { toast.error('Enter a rejection reason.'); return; }
    setActionLoading('reject');
    try {
      await api.rejectDocument(doc.id, 'admin', rejectReason);
      toast.success('Document rejected.');
      onRejected(doc.id);
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(null);
    }
  }

  const expiryDays = doc.expiryDate ? daysUntil(doc.expiryDate) : null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLES[doc.status] ?? 'bg-muted text-muted-foreground'}`}>
                {doc.status}
              </span>
              {doc.expiryDate && expiryDays !== null && expiryDays <= 30 && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${expiryDays <= 0 ? 'bg-rose-100 text-rose-700' : expiryDays <= 14 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                  <WarningCircle className="h-3 w-3" />
                  {expiryDays <= 0 ? 'Expired' : `Expires in ${expiryDays}d`}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-semibold text-foreground">{fmt(doc.type)}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Preview */}
        <div className="h-64 shrink-0 bg-muted/30 flex items-center justify-center border-b border-border">
          {previewLoading ? (
            <CircleNotch className="h-7 w-7 animate-spin text-primary" />
          ) : previewUrl ? (
            isImage ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={previewUrl} alt={doc.type} className="max-h-full max-w-full object-contain rounded" />
            ) : (
              <iframe src={previewUrl} className="h-full w-full border-0" title={doc.type} />
            )
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <FileText className="h-8 w-8" />
              <p className="text-xs">Preview unavailable</p>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-5 px-6 py-5">

          {/* Open in tab */}
          {previewUrl && (
            <a href={previewUrl} target="_blank" rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
              <ArrowSquareOut className="h-4 w-4" /> Open in new tab
            </a>
          )}

          {/* Client info */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Client</h3>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{doc.person?.name ?? doc.personId}</p>
                {doc.person?.email && <p className="text-xs text-muted-foreground">{doc.person.email}</p>}
              </div>
            </div>
          </section>

          {/* Document metadata */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Details</h3>
            <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium text-foreground">{fmt(doc.type)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uploaded</span>
                <span className="text-foreground">{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
              </div>
              {doc.expiryDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expiry</span>
                  <span className={`font-medium ${expiryDays !== null && expiryDays <= 14 ? 'text-rose-600' : expiryDays !== null && expiryDays <= 30 ? 'text-amber-600' : 'text-foreground'}`}>
                    {new Date(doc.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              )}
              {doc.verifiedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Verified</span>
                  <span className="text-emerald-700">{new Date(doc.verifiedAt).toLocaleDateString()}</span>
                </div>
              )}
              {doc.verifiedBy && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">By</span>
                  <span className="text-foreground">{doc.verifiedBy}</span>
                </div>
              )}
              {doc.rejectionReason && (
                <div className="rounded-lg bg-rose-50 border border-rose-100 px-3 py-2 text-xs text-rose-700">
                  <strong>Rejection reason:</strong> {doc.rejectionReason}
                </div>
              )}
            </div>
          </section>

          {/* Actions */}
          {doc.status === 'PENDING' && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</h3>

              {!confirmVerify && !rejectMode && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmVerify(true)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" /> Verify
                  </button>
                  <button
                    onClick={() => setRejectMode(true)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                </div>
              )}

              {confirmVerify && (
                <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-medium text-emerald-800">Verify this document?</p>
                  <p className="text-xs text-emerald-700">The client will be notified. This action is logged.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmVerify(false)}
                      className="flex-1 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-muted">
                      Cancel
                    </button>
                    <button onClick={handleVerify} disabled={actionLoading === 'verify'}
                      className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                      {actionLoading === 'verify' ? <CircleNotch className="mx-auto h-4 w-4 animate-spin" /> : 'Confirm Verify'}
                    </button>
                  </div>
                </div>
              )}

              {rejectMode && (
                <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-sm font-medium text-rose-800">Reject this document?</p>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection — client will see this and can re-upload…"
                    rows={3}
                    className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-300 resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setRejectMode(false)}
                      className="flex-1 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-muted">
                      Cancel
                    </button>
                    <button onClick={handleReject} disabled={actionLoading === 'reject' || !rejectReason.trim()}
                      className="flex-1 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">
                      {actionLoading === 'reject' ? <CircleNotch className="mx-auto h-4 w-4 animate-spin" /> : 'Confirm Reject'}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type TabKey = 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export default function DocumentsPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [tab, setTab] = useState<TabKey>('PENDING');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const searchRef = useRef<any>(null);

  const load = useCallback((t: TabKey) => {
    setLoading(true);
    const status = t === 'ALL' ? undefined : t;
    api.getAllDocuments(status)
      .then((data) => setDocs(data ?? []))
      .catch((e: any) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(tab); }, [load, tab]);

  function handleVerified(id: string) {
    setDocs((prev) => prev.map((d) => d.id === id ? { ...d, status: 'VERIFIED', verifiedAt: new Date().toISOString() } : d));
  }
  function handleRejected(id: string) {
    setDocs((prev) => prev.map((d) => d.id === id ? { ...d, status: 'REJECTED' } : d));
  }

  // Filtered view
  const filtered = docs.filter((d) => {
    const q = search.toLowerCase();
    const nameMatch = !q || d.person?.name?.toLowerCase().includes(q) || d.person?.email?.toLowerCase().includes(q) || d.type?.toLowerCase().includes(q);
    const typeMatch = !typeFilter || d.type === typeFilter;
    return nameMatch && typeMatch;
  });

  // Stats
  const pending = docs.filter((d) => d.status === 'PENDING').length;
  const verified = docs.filter((d) => d.status === 'VERIFIED').length;
  const rejected = docs.filter((d) => d.status === 'REJECTED').length;
  const expiringSoon = docs.filter((d) => {
    if (!d.expiryDate) return false;
    const days = daysUntil(d.expiryDate);
    return days >= 0 && days <= 30;
  }).length;

  const TABS: { key: TabKey; label: string; count?: number }[] = [
    { key: 'PENDING', label: 'Pending', count: pending },
    { key: 'ALL', label: 'All' },
    { key: 'VERIFIED', label: 'Verified', count: verified },
    { key: 'REJECTED', label: 'Rejected', count: rejected },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Document Verification"
          subtitle="Review, verify, and manage all client-uploaded credentials"
        />
        <button onClick={() => load(tab)}
          className="mt-1 flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-muted transition-colors">
          <ArrowClockwise className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-xl font-bold text-amber-700">{pending}</p>
            <p className="text-xs text-amber-600 font-medium">Pending Review</p>
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-xl font-bold text-emerald-700">{verified}</p>
            <p className="text-xs text-emerald-600 font-medium">Verified</p>
          </div>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-center gap-3">
          <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <div>
            <p className="text-xl font-bold text-rose-700">{rejected}</p>
            <p className="text-xs text-rose-600 font-medium">Rejected</p>
          </div>
        </div>
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 flex items-center gap-3">
          <WarningCircle className="h-5 w-5 text-orange-600 shrink-0" />
          <div>
            <p className="text-xl font-bold text-orange-700">{expiringSoon}</p>
            <p className="text-xs text-orange-600 font-medium">Expiring ≤30d</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); setTypeFilter(''); }}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${tab === t.key ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {t.label}
              {t.count !== undefined && (
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${tab === t.key ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search client or type…"
              className="h-9 w-56 rounded-xl border border-border bg-white pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="flex items-center gap-1.5 h-9 rounded-xl border border-border bg-white px-3">
            <Funnel className="h-3.5 w-3.5 text-muted-foreground" />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-sm outline-none text-foreground pr-1">
              <option value="">All types</option>
              {DOC_TYPES.map((t) => <option key={t} value={t}>{fmt(t)}</option>)}
            </select>
          </div>
          {(search || typeFilter) && (
            <button onClick={() => { setSearch(''); setTypeFilter(''); }}
              className="flex items-center gap-1 h-9 rounded-xl border border-border bg-white px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
          <span className="text-xs text-muted-foreground font-medium ml-1">
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-14 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle className="h-6 w-6 text-emerald-500" weight="fill" />
          </div>
          <h3 className="font-semibold text-foreground">
            {search || typeFilter ? 'No matches' : tab === 'PENDING' ? 'All clear — no documents pending' : `No ${tab.toLowerCase()} documents`}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search || typeFilter ? 'Try adjusting your search or filters.' : tab === 'PENDING' ? 'Nothing in the queue right now.' : ''}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Document Type</th>
                <th className="px-4 py-3 font-medium">Uploaded</th>
                <th className="px-4 py-3 font-medium">Expiry</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((doc) => {
                const expiryDays = doc.expiryDate ? daysUntil(doc.expiryDate) : null;
                return (
                  <tr key={doc.id}
                    onClick={() => setSelected(doc)}
                    className="cursor-pointer hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-foreground">{doc.person?.name ?? doc.personId}</p>
                      {doc.person?.email && <p className="text-xs text-muted-foreground">{doc.person.email}</p>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-foreground">{fmt(doc.type)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      <p>{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</p>
                      <p className="text-muted-foreground/70">{doc.uploadedAt ? timeAgo(doc.uploadedAt) : ''}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      {doc.expiryDate ? (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          expiryDays !== null && expiryDays <= 0 ? 'bg-rose-100 text-rose-700'
                          : expiryDays !== null && expiryDays <= 14 ? 'bg-rose-100 text-rose-700'
                          : expiryDays !== null && expiryDays <= 30 ? 'bg-amber-100 text-amber-700'
                          : 'bg-muted text-muted-foreground'
                        }`}>
                          {expiryDays !== null && expiryDays <= 30 && <WarningCircle className="h-3 w-3" />}
                          {expiryDays !== null && expiryDays <= 0 ? 'Expired'
                            : expiryDays !== null && expiryDays <= 30 ? `${expiryDays}d left`
                            : new Date(doc.expiryDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLES[doc.status] ?? 'bg-muted text-muted-foreground'}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button title="View document" onClick={() => setSelected(doc)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                        {doc.status === 'PENDING' && (
                          <>
                            <button title="Verify" onClick={() => setSelected(doc)}
                              className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors">
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button title="Reject" onClick={() => setSelected(doc)}
                              className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 transition-colors">
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <DocPanel
          doc={selected}
          onClose={() => setSelected(null)}
          onVerified={handleVerified}
          onRejected={handleRejected}
        />
      )}
    </div>
  );
}
