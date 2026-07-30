'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader, Skeleton } from '@mjn/ui';
import {
  CircleNotch, CheckCircle, XCircle, Eye, X,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';

export default function DocumentsPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // Rejection modal state
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      setDocs(await api.getPendingDocuments() ?? []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(id: string) {
    setActionLoading(id + '_verify');
    try {
      await api.verifyDocument(id, 'admin');
      setDocs((prev) => prev.filter((d) => d.id !== id));
      toast.success('Document verified successfully.');
    } catch (err: any) {
      toast.error('Failed to verify: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRejectConfirm() {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget.id + '_reject');
    try {
      await api.rejectDocument(rejectTarget.id, 'admin', rejectionReason || undefined);
      setDocs((prev) => prev.filter((d) => d.id !== rejectTarget.id));
      toast.success('Document rejected.');
      setRejectTarget(null);
      setRejectionReason('');
    } catch (err: any) {
      toast.error('Failed to reject: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function openPreview(doc: any) {
    setPreviewDoc(doc);
    setPreviewUrl('');
    setPreviewLoading(true);
    try {
      const { url } = await api.getDocumentViewUrl(doc.id);
      setPreviewUrl(url);
    } catch {
      setPreviewUrl(doc.fileUrl); // fallback
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Document Verification"
          subtitle={`${docs.length} document${docs.length !== 1 ? 's' : ''} awaiting review`}
        />

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : docs.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle className="h-6 w-6 text-emerald-500" weight="fill" />
            </div>
            <h3 className="font-semibold text-foreground">All clear</h3>
            <p className="mt-1 text-sm text-muted-foreground">No documents pending verification.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map((doc: any) => (
              <div key={doc.id} className="flex flex-wrap items-start gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-amber-700">
                      {doc.type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{doc.person?.name ?? doc.personId}</p>
                  {doc.person?.email && <p className="text-xs text-muted-foreground">{doc.person.email}</p>}
                  {doc.expiryDate && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Expires: {new Date(doc.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {doc.fileUrl && (
                    <button
                      onClick={() => openPreview(doc)}
                      className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </button>
                  )}
                  <button
                    onClick={() => handleVerify(doc.id)}
                    disabled={!!actionLoading}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === doc.id + '_verify'
                      ? <CircleNotch className="h-3.5 w-3.5 animate-spin" />
                      : <CheckCircle className="h-3.5 w-3.5" />}
                    Verify
                  </button>
                  <button
                    onClick={() => { setRejectTarget(doc); setRejectionReason(''); }}
                    disabled={!!actionLoading}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === doc.id + '_reject'
                      ? <CircleNotch className="h-3.5 w-3.5 animate-spin" />
                      : <XCircle className="h-3.5 w-3.5" />}
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection reason modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-white shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Reject Document</h3>
              <button onClick={() => setRejectTarget(null)} className="rounded-lg p-1.5 hover:bg-muted/60">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Rejecting <strong>{rejectTarget.type?.replace(/_/g, ' ')}</strong> for <strong>{rejectTarget.person?.name ?? rejectTarget.personId}</strong>.
              The client will see this reason and can re-upload.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection (e.g. Document is blurry, expired, or incorrect type)…"
              rows={3}
              className="w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300 resize-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setRejectTarget(null)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!!actionLoading}
                className="flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-50 transition-colors"
              >
                {actionLoading === rejectTarget?.id + '_reject'
                  ? <CircleNotch className="h-3.5 w-3.5 animate-spin" />
                  : <XCircle className="h-3.5 w-3.5" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File preview modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="flex w-full max-w-3xl flex-col rounded-2xl border border-border bg-white shadow-2xl overflow-hidden" style={{ maxHeight: '90vh' }}>
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div>
                <p className="font-semibold text-foreground text-sm">{previewDoc.type} — {previewDoc.person?.name ?? previewDoc.personId}</p>
                <p className="text-xs text-muted-foreground">Uploaded {previewDoc.uploadedAt ? new Date(previewDoc.uploadedAt).toLocaleString() : '—'}</p>
              </div>
              <div className="flex items-center gap-2">
                {previewUrl && (
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors">
                    Open in new tab
                  </a>
                )}
                <button onClick={() => { setPreviewDoc(null); setPreviewUrl(''); }} className="rounded-lg p-1.5 hover:bg-muted/60 transition-colors">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-muted/30 p-2 flex items-center justify-center" style={{ minHeight: '400px' }}>
              {previewLoading ? (
                <CircleNotch className="h-8 w-8 animate-spin text-primary" />
              ) : previewUrl ? (
                /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(previewDoc.fileUrl) ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={previewUrl} alt={previewDoc.type} className="mx-auto max-h-[70vh] rounded-xl object-contain shadow" />
                ) : (
                  <iframe src={previewUrl} className="h-[70vh] w-full rounded-xl border-0" title={previewDoc.type} />
                )
              ) : (
                <p className="text-sm text-muted-foreground">Unable to load preview.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
