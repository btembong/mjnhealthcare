'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Badge, Button, Skeleton } from '@mjn/ui';
import {
  FileText, UploadSimple, CheckCircle, Clock, WarningCircle,
  X, Eye, FilePlus, CaretDown,
  Lock, ShieldCheck, TrendUp, CreditCard, Image, Trash,
} from '@phosphor-icons/react';
import { useUser } from '../../../contexts/user-context';
import { api } from '../../../lib/api';
import { toast } from 'sonner';

const DOCUMENT_TYPES = [
  'PASSPORT_COPY',
  'DIPLOMA_DEGREE',
  'DIPLOMA_TRANSCRIPT',
  'BACHELORS_DEGREE',
  'BACHELORS_TRANSCRIPT',
  'MASTERS_DEGREE',
  'MASTERS_TRANSCRIPT',
  'NURSING_LICENSE',
  'MEDICAL_LICENSE',
  'OTHER_LICENSE',
  'GOOD_STANDING_CERTIFICATE',
  'WORK_EXPERIENCE_CERTIFICATE',
  'HIGH_SCHOOL_CERTIFICATE',
  'ORDINARY_LEVEL_CERTIFICATE',
  'BIRTH_CERTIFICATE',
  'PHOTO_ID',
  'BANK_STATEMENT',
  'PERSONAL_STATEMENT',
  'REFERENCE_LETTER',
  'OTHER',
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const ALLOWED_EXT = /\.(pdf|jpg|jpeg|png)$/i;

function DocumentsSkeleton() {
  return (
    <div className="space-y-6">
      <div><Skeleton className="h-7 w-44 mb-2" /><Skeleton className="h-4 w-80" /></div>
      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <div className="hidden xl:block w-[280px] shrink-0 space-y-4">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

function statusIcon(status: string) {
  if (status === 'VERIFIED') return <CheckCircle weight="fill" className="h-4 w-4 text-primary" />;
  if (status === 'REJECTED') return <WarningCircle className="h-4 w-4 text-rose-500" />;
  return <Clock className="h-4 w-4 text-amber-500" />;
}

function badgeVariant(status: string): 'success' | 'destructive' | 'warning' | 'outline' {
  if (status === 'VERIFIED') return 'success';
  if (status === 'REJECTED') return 'destructive';
  return 'warning';
}

function formatType(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function isImageFile(fileName: string) {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
}

type UploadState = 'idle' | 'uploading' | 'confirming' | 'done' | 'error';

interface QueuedFile {
  id: string;
  file: File;
  documentType: string;
  expiryDate: string;
  state: UploadState;
  progress: number;
  error: string;
  previewObjectUrl: string | null; // blob URL for images
}

function validate(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) return `${file.name} exceeds 20 MB limit.`;
  if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXT.test(file.name)) {
    return `${file.name} is not a supported type (PDF, JPG, PNG).`;
  }
  return null;
}

// ── Right Sidebar ──────────────────────────────────────────────────────────────

function DocumentsSidebar({
  onUpload, stageRequiredDocs, documents, stageName, router,
}: {
  onUpload: () => void;
  stageRequiredDocs: string[];
  documents: any[];
  stageName: string;
  router: ReturnType<typeof useRouter>;
}) {
  const stageVerified = stageRequiredDocs.filter(
    (dt) => documents.find((d) => d.type === dt)?.status === 'VERIFIED'
  ).length;
  const stagePct = stageRequiredDocs.length > 0
    ? Math.round((stageVerified / stageRequiredDocs.length) * 100)
    : 0;

  return (
    <div className="hidden xl:block w-[280px] shrink-0 sticky top-6 self-start space-y-4">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Upload</p>
        <button
          onClick={onUpload}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors active:scale-[0.98]"
        >
          <UploadSimple className="h-4 w-4" /> Upload Document
        </button>
        <p className="mt-2.5 text-center text-xs text-muted-foreground">PDF, JPG, PNG · max 20 MB</p>
        <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" /> Encrypted at rest
        </div>
      </div>

      {stageRequiredDocs.length > 0 && (
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Stage Requirements</p>
          {stageName && <p className="text-xs font-medium text-foreground mb-3">{stageName}</p>}
          <div className="space-y-2">
            {stageRequiredDocs.slice(0, 7).map((docType) => {
              const uploaded = documents.find((d) => d.type === docType);
              const isVerified = uploaded?.status === 'VERIFIED';
              const isPending = uploaded?.status === 'PENDING';
              const isRejected = uploaded?.status === 'REJECTED';
              return (
                <div key={docType} className="flex items-center gap-2">
                  {isVerified ? (
                    <CheckCircle weight="fill" className="h-3.5 w-3.5 shrink-0 text-primary" />
                  ) : isRejected ? (
                    <WarningCircle className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                  ) : isPending ? (
                    <Clock className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  ) : (
                    <div className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-border" />
                  )}
                  <span className={`text-xs truncate ${isVerified ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {formatType(docType)}
                  </span>
                </div>
              );
            })}
            {stageRequiredDocs.length > 7 && (
              <p className="text-xs text-muted-foreground pl-5">+{stageRequiredDocs.length - 7} more</p>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-1.5 rounded-full bg-primary transition-all duration-700" style={{ width: `${stagePct}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{stageVerified}/{stageRequiredDocs.length} verified</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Vault Security</p>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <Lock className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs text-muted-foreground">AES-256 encryption at rest</span>
          </div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs text-muted-foreground">Cloudflare R2 secure storage</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle weight="fill" className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs text-muted-foreground">Consultant-reviewed</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Eye className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs text-muted-foreground">Audit-logged access</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Links</p>
        <div className="space-y-1.5">
          <button
            onClick={() => router.push('/case')}
            className="w-full flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            <TrendUp className="h-4 w-4 text-primary shrink-0" /> My case
          </button>
          <button
            onClick={() => router.push('/payments')}
            className="w-full flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            <CreditCard className="h-4 w-4 text-primary shrink-0" /> Payments
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Upload Drawer ──────────────────────────────────────────────────────────────

function UploadDrawer({
  open, onClose, personId, onUploaded, defaultType,
}: {
  open: boolean;
  onClose: () => void;
  personId: string;
  onUploaded: () => void;
  defaultType: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Reset queue when drawer opens
  useEffect(() => {
    if (open) setQueue([]);
  }, [open]);

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    const valid: QueuedFile[] = [];
    for (const file of arr) {
      const err = validate(file);
      if (err) { toast.error(err); continue; }
      valid.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        documentType: defaultType,
        expiryDate: '',
        state: 'idle',
        progress: 0,
        error: '',
        previewObjectUrl: isImageFile(file.name) ? URL.createObjectURL(file) : null,
      });
    }
    setQueue((q) => [...q, ...valid]);
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';
  }

  function removeFile(id: string) {
    setQueue((q) => {
      const item = q.find((f) => f.id === id);
      if (item?.previewObjectUrl) URL.revokeObjectURL(item.previewObjectUrl);
      return q.filter((f) => f.id !== id);
    });
  }

  function updateField(id: string, field: 'documentType' | 'expiryDate', value: string) {
    setQueue((q) => q.map((f) => f.id === id ? { ...f, [field]: value } : f));
  }

  async function uploadFile(item: QueuedFile): Promise<void> {
    setQueue((q) => q.map((f) => f.id === item.id ? { ...f, state: 'uploading', progress: 0, error: '' } : f));
    try {
      const { url, key } = await api.getUploadUrl(personId, item.documentType, item.file.name);

      // XHR for real upload progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', url);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 75); // 0–75%
            setQueue((q) => q.map((f) => f.id === item.id ? { ...f, progress: pct } : f));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Storage upload failed (${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(item.file);
      });

      setQueue((q) => q.map((f) => f.id === item.id ? { ...f, state: 'confirming', progress: 80 } : f));
      await api.confirmUpload(personId, item.documentType, key, item.expiryDate || undefined);
      setQueue((q) => q.map((f) => f.id === item.id ? { ...f, state: 'done', progress: 100 } : f));
      if (item.previewObjectUrl) URL.revokeObjectURL(item.previewObjectUrl);
    } catch (err: any) {
      setQueue((q) => q.map((f) => f.id === item.id ? { ...f, state: 'error', error: err.message } : f));
    }
  }

  async function uploadAll() {
    const pending = queue.filter((f) => f.state === 'idle' || f.state === 'error');
    if (!pending.length) return;
    setUploading(true);
    for (const item of pending) {
      await uploadFile(item);
    }
    setUploading(false);
    const doneCount = queue.filter((f) => f.state === 'done').length + pending.filter((f) => f.state !== 'error').length;
    if (doneCount > 0) {
      await onUploaded();
      setTimeout(onClose, 1500);
    }
  }

  const pendingCount = queue.filter((f) => f.state === 'idle' || f.state === 'error').length;
  const allDone = queue.length > 0 && queue.every((f) => f.state === 'done');

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Slide-over panel */}
      <div className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-semibold text-foreground">Upload Documents</h2>
            <p className="text-xs text-muted-foreground">PDF, JPG, PNG · max 20 MB each</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted/60 transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 transition-colors ${
              dragOver ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 hover:bg-muted/30'
            }`}
          >
            <UploadSimple className="mb-2 h-7 w-7 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Drop files or click to browse</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Select multiple files at once</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              multiple
              className="hidden"
              onChange={handleFileInput}
            />
          </div>

          {/* File queue */}
          {queue.length > 0 && (
            <div className="space-y-3">
              {queue.map((item) => (
                <div key={item.id} className="rounded-xl border border-border bg-white p-4 space-y-3">
                  {/* File preview + name row */}
                  <div className="flex items-center gap-3">
                    {item.previewObjectUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={item.previewObjectUrl}
                        alt="preview"
                        className="h-12 w-12 shrink-0 rounded-lg object-cover border border-border"
                      />
                    ) : (
                      <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-lg bg-muted/50 border border-border">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.file.name}</p>
                      <p className="text-xs text-muted-foreground">{(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    {item.state === 'idle' || item.state === 'error' ? (
                      <button onClick={() => removeFile(item.id)} className="rounded p-1 hover:bg-muted/60 shrink-0">
                        <Trash className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ) : item.state === 'done' ? (
                      <CheckCircle weight="fill" className="h-5 w-5 text-primary shrink-0" />
                    ) : null}
                  </div>

                  {/* Type + expiry selectors */}
                  {(item.state === 'idle' || item.state === 'error') && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-muted-foreground">Document type</label>
                        <div className="relative">
                          <select
                            value={item.documentType}
                            onChange={(e) => updateField(item.id, 'documentType', e.target.value)}
                            className="h-9 w-full appearance-none rounded-lg border border-border bg-white pl-2.5 pr-7 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            {DOCUMENT_TYPES.map((t) => (
                              <option key={t} value={t}>{formatType(t)}</option>
                            ))}
                          </select>
                          <CaretDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-muted-foreground">Expiry <span className="font-normal">(if any)</span></label>
                        <input
                          type="date"
                          value={item.expiryDate}
                          onChange={(e) => updateField(item.id, 'expiryDate', e.target.value)}
                          className="h-9 w-full rounded-lg border border-border bg-white px-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  )}

                  {/* Progress bar */}
                  {(item.state === 'uploading' || item.state === 'confirming') && (
                    <div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-1.5 rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.state === 'confirming' ? 'Confirming…' : `Uploading… ${item.progress}%`}
                      </p>
                    </div>
                  )}

                  {item.state === 'done' && (
                    <p className="text-xs font-medium text-primary">Uploaded — pending review.</p>
                  )}

                  {item.state === 'error' && (
                    <p className="text-xs text-rose-600">{item.error}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {queue.length > 0 && !allDone && (
          <div className="border-t border-border px-6 py-4 bg-white">
            <Button
              className="w-full"
              onClick={uploadAll}
              disabled={uploading || pendingCount === 0}
            >
              {uploading
                ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Uploading…</>
                : <><UploadSimple className="h-4 w-4" /> Upload {pendingCount} file{pendingCount !== 1 ? 's' : ''}</>}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const router = useRouter();
  const { me, documents, engagement, loading, refresh } = useUser();

  const [stageRequiredDocs, setStageRequiredDocs] = useState<string[]>([]);
  const [stageName, setStageName] = useState<string>('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDefaultType, setDrawerDefaultType] = useState(DOCUMENT_TYPES[0]);

  // Preview state
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (me && engagement) {
      api.getProgress(me.id, engagement.id).then((progress: any) => {
        if (progress?.currentStage) {
          setStageName(progress.currentStage.label ?? '');
          setStageRequiredDocs(progress.currentStage.requiredDocuments ?? []);
        }
      }).catch(() => {});
    }
  }, [me, engagement]);

  function openDrawer(type?: string) {
    setDrawerDefaultType(type ?? DOCUMENT_TYPES[0]);
    setDrawerOpen(true);
  }

  async function openPreview(doc: any) {
    setPreviewDoc(doc);
    setPreviewUrl('');
    setPreviewLoading(true);
    try {
      const { url } = await api.getDocumentViewUrl(doc.id);
      setPreviewUrl(url);
    } catch {
      setPreviewUrl(doc.fileUrl); // fallback to direct URL
    } finally {
      setPreviewLoading(false);
    }
  }

  // Sort: REJECTED → PENDING → VERIFIED
  const STATUS_ORDER: Record<string, number> = { REJECTED: 0, PENDING: 1, VERIFIED: 2 };
  const sortedDocuments = [...documents].sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3)
  );

  const verified = documents.filter((d) => d.status === 'VERIFIED').length;
  const pending = documents.filter((d) => d.status === 'PENDING').length;
  const rejected = documents.filter((d) => d.status === 'REJECTED').length;
  const expiringDocs = documents.filter((d) => {
    if (!d.expiryDate) return false;
    const daysLeft = Math.ceil((new Date(d.expiryDate).getTime() - Date.now()) / 86400000);
    return daysLeft <= 30;
  });

  if (loading) return <DocumentsSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Vault"
        subtitle="Upload and manage your credentials. All files are encrypted at rest."
        actions={
          <Button size="sm" onClick={() => openDrawer()}>
            <FilePlus className="h-4 w-4" /> Upload Document
          </Button>
        }
      />

      {/* Expiry alert banner */}
      {expiringDocs.length > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-100">
              <WarningCircle weight="fill" className="h-4 w-4 text-rose-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-rose-900">
                {expiringDocs.length} document{expiringDocs.length > 1 ? 's' : ''} expiring within 30 days
              </p>
              <p className="text-xs text-rose-700">
                {expiringDocs.map((d: any) => formatType(d.type)).join(', ')} — renew and re-upload to keep your case on track.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-6 items-start">
        {/* ── Main column ────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Stage-required docs checklist */}
          {stageRequiredDocs.length > 0 && (
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                  <CheckCircle weight="fill" className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Required for current stage{stageName ? `: ${stageName}` : ''}
                  </h3>
                  <p className="text-xs text-muted-foreground">Upload all required documents to advance your pathway</p>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {stageRequiredDocs.map((docType) => {
                  const uploaded = documents.find((d) => d.type === docType);
                  const isVerified = uploaded?.status === 'VERIFIED';
                  const isPending = uploaded?.status === 'PENDING';
                  const isRejected = uploaded?.status === 'REJECTED';
                  return (
                    <div
                      key={docType}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                        isVerified ? 'border-primary/20 bg-primary/5'
                        : isRejected ? 'border-rose-200 bg-rose-50'
                        : isPending ? 'border-amber-200 bg-amber-50'
                        : 'border-border bg-muted/20'
                      }`}
                    >
                      {isVerified ? (
                        <CheckCircle weight="fill" className="h-4 w-4 shrink-0 text-primary" />
                      ) : isRejected ? (
                        <WarningCircle className="h-4 w-4 shrink-0 text-rose-500" />
                      ) : isPending ? (
                        <Clock className="h-4 w-4 shrink-0 text-amber-500" />
                      ) : (
                        <div className="h-4 w-4 shrink-0 rounded-full border-2 border-border" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${
                          isVerified ? 'text-primary' : isRejected ? 'text-rose-800' : isPending ? 'text-amber-800' : 'text-foreground'
                        }`}>
                          {formatType(docType)}
                        </p>
                        <p className={`text-xs ${
                          isVerified ? 'text-primary/70' : isRejected ? 'text-rose-600' : isPending ? 'text-amber-600' : 'text-muted-foreground'
                        }`}>
                          {isVerified ? 'Verified' : isRejected ? 'Rejected — re-upload' : isPending ? 'Under review' : 'Not yet uploaded'}
                        </p>
                      </div>
                      {(!uploaded || isRejected) && (
                        <button
                          onClick={() => openDrawer(docType)}
                          className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                            isRejected
                              ? 'border-rose-300 bg-white text-rose-700 hover:bg-rose-50'
                              : 'border-border bg-white text-foreground hover:bg-muted/50'
                          }`}
                        >
                          {isRejected ? 'Re-upload' : 'Upload'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary stat cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-white p-4 shadow-sm flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5">
                <CheckCircle weight="fill" className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{verified}</p>
                <p className="text-xs text-muted-foreground">Verified</p>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-white p-4 shadow-sm flex items-center gap-3">
              <div className="rounded-xl bg-muted/60 p-2.5">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pending}</p>
                <p className="text-xs text-muted-foreground">Under Review</p>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-white p-4 shadow-sm flex items-center gap-3">
              <div className="rounded-xl bg-rose-100 p-2.5">
                <WarningCircle className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{rejected}</p>
                <p className="text-xs text-muted-foreground">Action Required</p>
              </div>
            </div>
          </div>

          {/* Documents list — sorted REJECTED → PENDING → VERIFIED */}
          <div className="rounded-2xl border border-border bg-white shadow-sm">
            <div className="border-b border-border px-6 py-4">
              <h3 className="font-semibold text-foreground">
                All Documents {documents.length > 0 && <span className="ml-1 text-sm font-normal text-muted-foreground">({documents.length})</span>}
              </h3>
            </div>

            {sortedDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 rounded-2xl bg-muted/50 p-6">
                  <UploadSimple className="h-10 w-10 text-muted-foreground" />
                </div>
                <h4 className="font-semibold text-foreground">No documents yet</h4>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Upload your credentials to get started. Your consultant will review each document.
                </p>
                <Button size="sm" className="mt-4" onClick={() => openDrawer()}>
                  <FilePlus className="h-4 w-4" /> Upload your first document
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {sortedDocuments.map((doc) => {
                  const isImage = isImageFile(doc.fileUrl ?? '');
                  return (
                    <div key={doc.id} className="flex items-center gap-4 px-6 py-4">
                      {/* Thumbnail or status icon */}
                      <div className="shrink-0">
                        {isImage ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={doc.fileUrl}
                            alt={doc.type}
                            className="h-10 w-10 rounded-lg object-cover border border-border"
                            onError={(e) => {
                              // If direct URL 403s, show fallback icon
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                              (e.currentTarget.nextSibling as HTMLElement | null)?.removeAttribute('hidden');
                            }}
                          />
                        ) : null}
                        <div
                          className={`rounded-lg bg-muted/50 p-2.5 ${isImage ? 'hidden' : ''}`}
                        >
                          {statusIcon(doc.status)}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{formatType(doc.type)}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>Uploaded {new Date(doc.uploadedAt ?? doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          {doc.expiryDate && (() => {
                            const daysLeft = Math.ceil((new Date(doc.expiryDate).getTime() - Date.now()) / 86400000);
                            const isExpired = daysLeft <= 0;
                            const isUrgent = daysLeft > 0 && daysLeft <= 14;
                            const isWarning = daysLeft > 14 && daysLeft <= 30;
                            return (
                              <>
                                <span>·</span>
                                {(isExpired || isUrgent || isWarning) ? (
                                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                    isExpired || isUrgent ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                  }`}>
                                    <WarningCircle className="h-3 w-3" />
                                    {isExpired ? 'Expired' : `Expires in ${daysLeft}d`}
                                  </span>
                                ) : (
                                  <span>Expires {new Date(doc.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                )}
                              </>
                            );
                          })()}
                          {doc.verifiedAt && (
                            <><span>·</span><span>Verified {new Date(doc.verifiedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></>
                          )}
                        </div>
                        {doc.status === 'REJECTED' && doc.rejectionReason && (
                          <p className="mt-1 rounded-lg bg-rose-50 px-2 py-1 text-xs text-rose-700 border border-rose-100">
                            <strong>Reason:</strong> {doc.rejectionReason}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={badgeVariant(doc.status)} className="text-xs">{doc.status}</Badge>
                        {doc.fileUrl && (
                          <button
                            onClick={() => openPreview(doc)}
                            className="rounded-lg border border-border p-1.5 hover:bg-muted/60 transition-colors"
                            title="View document"
                          >
                            {isImage ? <Image className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                          </button>
                        )}
                        {doc.status === 'REJECTED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => openDrawer(doc.type)}
                          >
                            Re-upload
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right sidebar ──────────────────────────────────────────── */}
        <DocumentsSidebar
          onUpload={() => openDrawer()}
          stageRequiredDocs={stageRequiredDocs}
          documents={documents}
          stageName={stageName}
          router={router}
        />
      </div>

      {/* Upload drawer */}
      {me && (
        <UploadDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          personId={me.id}
          onUploaded={refresh}
          defaultType={drawerDefaultType}
        />
      )}

      {/* Document preview modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="flex w-full max-w-3xl flex-col rounded-2xl border border-border bg-white shadow-2xl overflow-hidden" style={{ maxHeight: '90vh' }}>
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div>
                <p className="font-semibold text-foreground text-sm">{formatType(previewDoc.type)}</p>
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
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-xs text-muted-foreground">Loading secure preview…</p>
                </div>
              ) : previewUrl ? (
                isImageFile(previewDoc.fileUrl) ? (
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
    </div>
  );
}
