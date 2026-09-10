'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader, Skeleton } from '@mjn/ui';
import {
  CheckCircle, XCircle, Eye, X, CircleNotch, ArrowClockwise,
  MagnifyingGlass, WarningCircle, Clock, ShieldCheck, ArrowSquareOut,
  FileText, User, Funnel, Sparkle, ArrowUp, ArrowDown,
} from '@mjn/ui';
import { api } from '../../../lib/api';
import { useAdmin } from '../../../contexts/admin-context';

// ── Constants ────────────────────────────────────────────────────────────────

const DOC_TYPES = [
  'PASSPORT_COPY', 'DIPLOMA_DEGREE', 'DIPLOMA_TRANSCRIPT', 'BACHELORS_DEGREE',
  'BACHELORS_TRANSCRIPT', 'MASTERS_DEGREE', 'MASTERS_TRANSCRIPT', 'NURSING_LICENSE',
  'MEDICAL_LICENSE', 'OTHER_LICENSE', 'GOOD_STANDING_CERTIFICATE',
  'WORK_EXPERIENCE_CERTIFICATE', 'HIGH_SCHOOL_CERTIFICATE', 'ORDINARY_LEVEL_CERTIFICATE',
  'BIRTH_CERTIFICATE', 'PHOTO_ID', 'BANK_STATEMENT', 'PERSONAL_STATEMENT',
  'REFERENCE_LETTER', 'OTHER',
];

// Monochrome status — no rainbow
const STATUS_PILL: Record<string, string> = {
  VERIFIED: 'bg-slate-900 text-white',
  PENDING:  'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  REJECTED: 'bg-slate-200 text-slate-700',
};

type SortKey = 'client' | 'type' | 'uploaded' | 'expiry' | 'status';
type SortDir = 'asc' | 'desc';

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

function sortDocs(docs: any[], key: SortKey, dir: SortDir): any[] {
  return [...docs].sort((a, b) => {
    let av: any, bv: any;
    switch (key) {
      case 'client':   av = a.person?.name ?? ''; bv = b.person?.name ?? ''; break;
      case 'type':     av = a.type ?? '';          bv = b.type ?? '';         break;
      case 'uploaded': av = a.uploadedAt ?? '';    bv = b.uploadedAt ?? '';   break;
      case 'expiry':   av = a.expiryDate ?? '9999'; bv = b.expiryDate ?? '9999'; break;
      case 'status': {
        const order: Record<string, number> = { PENDING: 0, VERIFIED: 1, REJECTED: 2 };
        av = order[a.status] ?? 9; bv = order[b.status] ?? 9; break;
      }
    }
    if (av < bv) return dir === 'asc' ? -1 : 1;
    if (av > bv) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}

// ── Sort header cell ──────────────────────────────────────────────────────────

function SortTh({
  label, sortKey, current, dir, onSort,
}: { label: string; sortKey: SortKey; current: SortKey; dir: SortDir; onSort: (k: SortKey) => void }) {
  const active = current === sortKey;
  return (
    <th
      className="px-4 py-3 font-semibold cursor-pointer select-none whitespace-nowrap group"
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1 text-slate-500 group-hover:text-slate-800 transition-colors">
        {label}
        <span className="text-slate-300 group-hover:text-slate-500">
          {active ? (dir === 'asc' ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />) : <ArrowDown className="h-3 w-3" />}
        </span>
      </span>
    </th>
  );
}

// ── Detail panel ─────────────────────────────────────────────────────────────

function DocPanel({
  doc, reviewerName, onClose, onVerified, onRejected,
}: {
  doc: any; reviewerName: string;
  onClose: () => void; onVerified: (id: string) => void; onRejected: (id: string) => void;
}) {
  const [previewUrl, setPreviewUrl]   = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [actionLoading, setActionLoading]   = useState<'verify' | 'reject' | null>(null);
  const [rejectMode, setRejectMode]         = useState(false);
  const [rejectReason, setRejectReason]     = useState('');
  const [confirmVerify, setConfirmVerify]   = useState(false);

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
      await api.verifyDocument(doc.id, reviewerName);
      toast.success('Document verified.');
      onVerified(doc.id); onClose();
    } catch (e: any) { toast.error(e.message); }
    finally { setActionLoading(null); }
  }

  async function handleReject() {
    if (!rejectReason.trim()) { toast.error('Enter a rejection reason.'); return; }
    setActionLoading('reject');
    try {
      await api.rejectDocument(doc.id, reviewerName, rejectReason);
      toast.success('Document rejected.');
      onRejected(doc.id); onClose();
    } catch (e: any) { toast.error(e.message); }
    finally { setActionLoading(null); }
  }

  const expiryDays = doc.expiryDate ? daysUntil(doc.expiryDate) : null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex rounded-md px-2.5 py-0.5 text-xs font-bold ${STATUS_PILL[doc.status] ?? 'bg-slate-100 text-slate-600'}`}>
                {doc.status}
              </span>
              {doc.expiryDate && expiryDays !== null && expiryDays <= 30 && (
                <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 ring-1 ring-slate-200">
                  <WarningCircle className="h-3 w-3" />
                  {expiryDays <= 0 ? 'Expired' : `Expires in ${expiryDays}d`}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-900">{fmt(doc.type)}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Preview */}
        <div className="h-64 shrink-0 bg-slate-50 flex items-center justify-center border-b border-slate-100">
          {previewLoading ? (
            <CircleNotch className="h-7 w-7 animate-spin text-slate-400" />
          ) : previewUrl ? (
            isImage
              ? <img src={previewUrl} alt={doc.type} className="max-h-full max-w-full object-contain rounded" />
              : <iframe src={previewUrl} className="h-full w-full border-0" title={doc.type} />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <FileText className="h-8 w-8" />
              <p className="text-xs">Preview unavailable</p>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-5 px-6 py-5">

          {/* Open in tab */}
          {previewUrl && (
            <a href={previewUrl} target="_blank" rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors">
              <ArrowSquareOut className="h-4 w-4" /> Open in new tab
            </a>
          )}

          {/* Client info */}
          <section>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Client</h3>
            <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-200">
                <User className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{doc.person?.name ?? doc.personId}</p>
                {doc.person?.email && <p className="text-xs text-slate-500">{doc.person.email}</p>}
              </div>
            </div>
          </section>

          {/* Document metadata */}
          <section>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Details</h3>
            <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Type</span>
                <span className="font-medium text-slate-900">{fmt(doc.type)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Uploaded</span>
                <span className="text-slate-700">{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
              </div>
              {doc.expiryDate && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Expiry</span>
                  <span className={`font-medium ${expiryDays !== null && expiryDays <= 14 ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                    {new Date(doc.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {expiryDays !== null && expiryDays <= 30 && ` (${expiryDays <= 0 ? 'expired' : `${expiryDays}d left`})`}
                  </span>
                </div>
              )}
              {doc.verifiedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Verified</span>
                  <span className="text-slate-700">{new Date(doc.verifiedAt).toLocaleDateString()}</span>
                </div>
              )}
              {doc.verifiedBy && (
                <div className="flex justify-between">
                  <span className="text-slate-500">By</span>
                  <span className="text-slate-700">{doc.verifiedBy}</span>
                </div>
              )}
              {doc.rejectionReason && (
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                  <strong className="text-slate-900">Rejection reason:</strong> {doc.rejectionReason}
                </div>
              )}
            </div>
          </section>

          {/* Actions */}
          {doc.status === 'PENDING' && (
            <section>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Actions</h3>

              {!confirmVerify && !rejectMode && (
                <div className="flex gap-2">
                  <button onClick={() => setConfirmVerify(true)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
                    <CheckCircle className="h-4 w-4" /> Verify
                  </button>
                  <button onClick={() => setRejectMode(true)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                </div>
              )}

              {confirmVerify && (
                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Verify this document?</p>
                  <p className="text-xs text-slate-500">The client will be notified. This action is logged.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmVerify(false)}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                      Cancel
                    </button>
                    <button onClick={handleVerify} disabled={actionLoading === 'verify'}
                      className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
                      {actionLoading === 'verify' ? <CircleNotch className="mx-auto h-4 w-4 animate-spin" /> : 'Confirm Verify'}
                    </button>
                  </div>
                </div>
              )}

              {rejectMode && (
                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Reject this document?</p>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection — client will see this and can re-upload…"
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setRejectMode(false)}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                      Cancel
                    </button>
                    <button onClick={handleReject} disabled={actionLoading === 'reject' || !rejectReason.trim()}
                      className="flex-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
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
  const { me } = useAdmin();
  const isConsultant = (me?.role as string)?.toUpperCase() === 'CONSULTANT';
  const reviewerName = me?.name || me?.email || 'admin';

  const [docs, setDocs]               = useState<any[]>([]);
  const [myPersonIds, setMyPersonIds] = useState<Set<string> | null>(null);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState<any | null>(null);
  const [tab, setTab]                 = useState<TabKey>('PENDING');
  const [search, setSearch]           = useState('');
  const [typeFilter, setTypeFilter]   = useState('');
  const [sortKey, setSortKey]         = useState<SortKey>('uploaded');
  const [sortDir, setSortDir]         = useState<SortDir>('desc');

  const [prescreening, setPrescreening]     = useState<Set<string>>(new Set());
  const [prescreenResult, setPrescreenResult] = useState<{ docId: string; docType: string; flags: string[]; summary: string; confidence: number } | null>(null);

  useEffect(() => {
    if (!isConsultant || !me?.email) { setMyPersonIds(null); return; }
    api.getAllEngagements()
      .then((engs: any[]) => {
        const ids = new Set(
          engs.filter((e) => e.consultantEmail?.toLowerCase() === me.email?.toLowerCase())
              .map((e) => e.personId).filter(Boolean)
        );
        setMyPersonIds(ids);
      })
      .catch(() => setMyPersonIds(new Set()));
  }, [isConsultant, me?.email]);

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

  async function handlePrescreen(doc: any, e: React.MouseEvent) {
    e.stopPropagation();
    setPrescreening((prev) => new Set(prev).add(doc.id));
    try {
      const result = await api.prescreenDocument(doc.id);
      setPrescreenResult({ docId: doc.id, docType: doc.type, flags: result.flags ?? [], summary: result.summary ?? '', confidence: Number(result.confidence ?? 0) });
    } catch (err: any) {
      toast.error(err.message ?? 'Pre-screen failed');
    } finally {
      setPrescreening((prev) => { const s = new Set(prev); s.delete(doc.id); return s; });
    }
  }

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  // Filter
  const filtered = docs.filter((d) => {
    if (isConsultant && myPersonIds !== null && !myPersonIds.has(d.personId)) return false;
    const q = search.toLowerCase();
    const nameMatch = !q || d.person?.name?.toLowerCase().includes(q) || d.person?.email?.toLowerCase().includes(q) || d.type?.toLowerCase().includes(q);
    const typeMatch = !typeFilter || d.type === typeFilter;
    return nameMatch && typeMatch;
  });

  // Sort
  const sorted = sortDocs(filtered, sortKey, sortDir);

  // Stats (always from full list)
  const pending     = docs.filter((d) => d.status === 'PENDING').length;
  const verified    = docs.filter((d) => d.status === 'VERIFIED').length;
  const rejected    = docs.filter((d) => d.status === 'REJECTED').length;
  const expiringSoon = docs.filter((d) => {
    if (!d.expiryDate) return false;
    const days = daysUntil(d.expiryDate);
    return days >= 0 && days <= 30;
  }).length;

  const TABS: { key: TabKey; label: string; count?: number }[] = [
    { key: 'PENDING',  label: 'Pending',  count: pending  },
    { key: 'ALL',      label: 'All'                       },
    { key: 'VERIFIED', label: 'Verified', count: verified  },
    { key: 'REJECTED', label: 'Rejected', count: rejected  },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Document Verification</h1>
          <p className="text-xs text-slate-400 mt-0.5">Review, verify, and manage all client-uploaded credentials</p>
        </div>
        <button onClick={() => load(tab)}
          className="mt-1 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-slate-50 transition-colors">
          <ArrowClockwise className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* KPI bar — monochrome */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Clock,         value: pending,      label: 'Pending Review', primary: true  },
          { icon: ShieldCheck,   value: verified,     label: 'Verified',       primary: false },
          { icon: XCircle,       value: rejected,     label: 'Rejected',       primary: false },
          { icon: WarningCircle, value: expiringSoon, label: 'Expiring ≤30d',  primary: false },
        ].map(({ icon: Icon, value, label, primary }) => (
          <div key={label} className={`rounded-xl border shadow-sm p-4 flex items-center gap-3 bg-white ${primary && pending > 0 ? 'border-slate-300' : 'border-slate-100'}`}>
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${primary ? 'bg-primary/10' : 'bg-slate-100'}`}>
              <Icon className={`h-4.5 w-4.5 ${primary ? 'text-primary' : 'text-slate-500'}`} />
            </div>
            <div>
              <p className={`text-xl font-bold tabular-nums ${primary ? 'text-slate-900' : 'text-slate-800'}`}>{value}</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); setTypeFilter(''); }}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${tab === t.key ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}>
              {t.label}
              {t.count !== undefined && (
                <span className={`ml-1.5 rounded-md px-1.5 py-0.5 text-xs ${tab === t.key ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-500'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search client or type…"
              className="h-9 w-56 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="flex items-center gap-1.5 h-9 rounded-lg border border-slate-200 bg-white px-3">
            <Funnel className="h-3.5 w-3.5 text-slate-400" />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-sm outline-none text-slate-700 pr-1">
              <option value="">All types</option>
              {DOC_TYPES.map((t) => <option key={t} value={t}>{fmt(t)}</option>)}
            </select>
          </div>
          {(search || typeFilter) && (
            <button onClick={() => { setSearch(''); setTypeFilter(''); }}
              className="flex items-center gap-1 h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors">
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
          <span className="text-xs text-slate-400 font-medium ml-1">
            {sorted.length} record{sorted.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border border-slate-100 bg-white p-14 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
            <CheckCircle className="h-6 w-6 text-slate-400" weight="fill" />
          </div>
          <h3 className="font-semibold text-slate-900">
            {search || typeFilter ? 'No matches' : tab === 'PENDING' ? 'All clear — nothing pending' : `No ${tab.toLowerCase()} documents`}
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            {search || typeFilter ? 'Try adjusting your filters.' : tab === 'PENDING' ? 'Nothing in the queue right now.' : ''}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-100 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-left text-xs">
                <SortTh label="Client"   sortKey="client"   current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Type"     sortKey="type"     current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Uploaded" sortKey="uploaded" current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Expiry"   sortKey="expiry"   current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Status"   sortKey="status"   current={sortKey} dir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-slate-500 font-semibold text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((doc) => {
                const expiryDays = doc.expiryDate ? daysUntil(doc.expiryDate) : null;
                const expiryWarning = expiryDays !== null && expiryDays <= 14;
                return (
                  <tr key={doc.id} onClick={() => setSelected(doc)}
                    className="cursor-pointer hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-900">{doc.person?.name ?? doc.personId}</p>
                      {doc.person?.email && <p className="text-xs text-slate-400">{doc.person.email}</p>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-slate-800">{fmt(doc.type)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      <p>{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</p>
                      <p className="text-slate-400">{doc.uploadedAt ? timeAgo(doc.uploadedAt) : ''}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      {doc.expiryDate ? (
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${
                          expiryDays !== null && expiryDays <= 0  ? 'bg-slate-900 text-white ring-slate-700'
                          : expiryWarning                         ? 'bg-slate-800 text-white ring-slate-600'
                          : expiryDays !== null && expiryDays <= 30 ? 'bg-slate-100 text-slate-700 ring-slate-200'
                          : 'bg-transparent text-slate-500 ring-transparent'
                        }`}>
                          {expiryWarning && <WarningCircle className="h-3 w-3" />}
                          {expiryDays !== null && expiryDays <= 0 ? 'Expired'
                            : expiryDays !== null && expiryDays <= 30 ? `${expiryDays}d left`
                            : new Date(doc.expiryDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                      ) : <span className="text-xs text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex rounded-md px-2.5 py-0.5 text-xs font-bold ${STATUS_PILL[doc.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button title="View" onClick={() => setSelected(doc)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button title="AI pre-screen" onClick={(e) => handlePrescreen(doc, e)} disabled={prescreening.has(doc.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 transition-colors">
                          {prescreening.has(doc.id) ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Sparkle className="h-4 w-4" />}
                        </button>
                        {doc.status === 'PENDING' && (
                          <>
                            <button title="Verify" onClick={() => setSelected(doc)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary transition-colors">
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button title="Reject" onClick={() => setSelected(doc)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors">
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
        <DocPanel doc={selected} reviewerName={reviewerName}
          onClose={() => setSelected(null)}
          onVerified={handleVerified} onRejected={handleRejected} />
      )}

      {/* AI Pre-screen modal */}
      {prescreenResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-100 bg-white shadow-xl p-6 space-y-5 mx-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Sparkle className="h-4 w-4 text-slate-500" />
                  <h2 className="text-base font-bold text-slate-900">AI Pre-screen Result</h2>
                </div>
                <p className="text-xs text-slate-400">{fmt(prescreenResult.docType)}</p>
              </div>
              <button onClick={() => setPrescreenResult(null)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Confidence bar — monochrome */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${prescreenResult.confidence}%` }} />
              </div>
              <span className="text-xs font-bold text-slate-700 tabular-nums w-20 text-right">
                {prescreenResult.confidence}% confidence
              </span>
            </div>

            {/* Summary */}
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700 leading-relaxed">
              {prescreenResult.summary}
            </div>

            {/* Flags */}
            {prescreenResult.flags.length > 0 ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Issues flagged</p>
                <ul className="space-y-1.5">
                  {prescreenResult.flags.map((flag, i) => (
                    <li key={i} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                      <WarningCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-slate-500" />
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <CheckCircle className="h-4 w-4 shrink-0 text-slate-500" />
                No issues detected — document looks complete.
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button onClick={() => setPrescreenResult(null)}
                className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
