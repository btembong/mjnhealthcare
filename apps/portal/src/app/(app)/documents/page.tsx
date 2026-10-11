'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader, Button, Skeleton } from '@mjn/ui';
import {
  FileText, UploadSimple, CheckCircle, X, Eye, FilePlus, Lock, Trash, DownloadSimple, MagnifyingGlass,
} from '@mjn/ui';
import { toast } from 'sonner';
import { useUser } from '../../../contexts/user-context';
import { api } from '../../../lib/api';

// ── Wording (the page follows the client's preferred language) ────────────────

type Locale = 'en' | 'fr';

const TEXT = {
  en: {
    title: 'My documents',
    summary: (ready: number, total: number) => `${ready} of ${total} ready`,
    checking: (n: number) => `${n} being checked`,
    toReplace: (n: number) => `${n} to replace`,
    secure: 'Stored securely',
    noneYet: 'Upload your credentials here. Our team checks each one.',
    upload: 'Upload document',
    uploadShort: 'Upload',
    neededNow: 'Needed now',
    readyOf: (a: number, b: number) => `${a} of ${b} ready`,
    notUploaded: 'Not uploaded',
    forms: 'Forms to complete',
    formsHelp: 'Download each form, complete it, then return it here.',
    from: 'Received',
    downloadForm: 'Download form',
    returnForm: 'Return completed',
    returning: 'Sending…',
    returned: 'Form returned. Your team has been notified.',
    returnFailed: 'The form was not returned. Please try again.',
    status: { VERIFIED: 'Ready', PENDING: 'Being checked', REJECTED: 'To replace', REPLACED: 'Replaced', PENDING_CLIENT: 'With you' } as Record<string, string>,
    filters: { ALL: 'All', REPLACE: 'To replace', CHECKING: 'Being checked', READY: 'Ready', EXPIRING: 'Expiring' },
    search: 'Search documents',
    cols: ['Document', 'Status', 'Uploaded', 'Expires'],
    returnedForm: 'returned form',
    expired: 'Expired',
    daysLeft: (n: number) => (n === 1 ? '1 day left' : `${n} days left`),
    view: 'View',
    download: 'Download',
    reupload: 'Re-upload',
    renew: 'Renew',
    remove: 'Remove',
    emptyTitle: 'No documents yet',
    emptyBody: 'Upload your credentials to get started. Our team checks each document and tells you if anything needs replacing.',
    emptyFilter: 'No documents match this view.',
    removeTitle: 'Remove this document?',
    removeBody: 'It has not been checked yet, so it will be deleted. You can upload a new copy at any time.',
    cancel: 'Cancel',
    removed: 'Document removed.',
    removeFailed: 'The document could not be removed.',
    linkFailed: 'The document could not be opened. Please try again.',
    loadingPreview: 'Opening securely…',
    noPreview: 'This document cannot be shown here.',
    openTab: 'Open in a new tab',
    close: 'Close',
    drawer: {
      title: 'Upload documents',
      sub: 'PDF, JPG or PNG · up to 20 MB each',
      drop: 'Drop files here or choose files',
      dropSub: 'You can add several at once',
      what: 'What is this document?',
      choose: 'Choose…',
      needed: 'Needed now',
      other: 'Other documents',
      expiry: 'Expiry date (if it has one)',
      tips: 'For a clear copy: all four corners visible, no glare, every word readable.',
      uploading: (p: number) => `Uploading… ${p}%`,
      saving: 'Saving…',
      done: 'Uploaded. Our team will check it.',
      uploadN: (n: number) => (n === 1 ? 'Upload 1 file' : `Upload ${n} files`),
      working: 'Uploading…',
      pickType: 'Say what each file is before uploading.',
      tooBig: (n: string) => `${n} is larger than 20 MB.`,
      badType: (n: string) => `${n} is not a PDF, JPG or PNG.`,
      remove: 'Remove file',
    },
    types: {
      PASSPORT_COPY: 'Passport', DIPLOMA_DEGREE: 'Diploma certificate', DIPLOMA_TRANSCRIPT: 'Diploma transcript', BACHELORS_DEGREE: 'Bachelor’s degree',
      BACHELORS_TRANSCRIPT: 'Bachelor’s transcript', MASTERS_DEGREE: 'Master’s degree', MASTERS_TRANSCRIPT: 'Master’s transcript', NURSING_LICENSE: 'Nursing licence',
      MEDICAL_LICENSE: 'Medical licence', OTHER_LICENSE: 'Other professional licence', GOOD_STANDING_CERTIFICATE: 'Good standing certificate',
      WORK_EXPERIENCE_CERTIFICATE: 'Work experience certificate', HIGH_SCHOOL_CERTIFICATE: 'High school certificate', ORDINARY_LEVEL_CERTIFICATE: 'Ordinary level certificate',
      BIRTH_CERTIFICATE: 'Birth certificate', PHOTO_ID: 'Photo ID', BANK_STATEMENT: 'Bank statement', PERSONAL_STATEMENT: 'Personal statement',
      REFERENCE_LETTER: 'Reference letter', OTHER: 'Other document',
    } as Record<string, string>,
  },
  fr: {
    title: 'Mes documents',
    summary: (ready: number, total: number) => `${ready} sur ${total} prêts`,
    checking: (n: number) => `${n} en vérification`,
    toReplace: (n: number) => `${n} à remplacer`,
    secure: 'Conservés en sécurité',
    noneYet: 'Déposez vos justificatifs ici. Notre équipe vérifie chacun d’eux.',
    upload: 'Déposer un document',
    uploadShort: 'Déposer',
    neededNow: 'À fournir maintenant',
    readyOf: (a: number, b: number) => `${a} sur ${b} prêts`,
    notUploaded: 'Non déposé',
    forms: 'Formulaires à remplir',
    formsHelp: 'Téléchargez chaque formulaire, remplissez-le, puis renvoyez-le ici.',
    from: 'Reçu le',
    downloadForm: 'Télécharger',
    returnForm: 'Renvoyer rempli',
    returning: 'Envoi…',
    returned: 'Formulaire renvoyé. Votre équipe a été prévenue.',
    returnFailed: 'Le formulaire n’a pas été renvoyé. Veuillez réessayer.',
    status: { VERIFIED: 'Prêt', PENDING: 'En vérification', REJECTED: 'À remplacer', REPLACED: 'Remplacé', PENDING_CLIENT: 'Chez vous' } as Record<string, string>,
    filters: { ALL: 'Tous', REPLACE: 'À remplacer', CHECKING: 'En vérification', READY: 'Prêts', EXPIRING: 'Expirent bientôt' },
    search: 'Rechercher un document',
    cols: ['Document', 'Statut', 'Déposé le', 'Expire'],
    returnedForm: 'formulaire renvoyé',
    expired: 'Expiré',
    daysLeft: (n: number) => (n === 1 ? '1 jour restant' : `${n} jours restants`),
    view: 'Voir',
    download: 'Télécharger',
    reupload: 'Redéposer',
    renew: 'Renouveler',
    remove: 'Retirer',
    emptyTitle: 'Aucun document pour le moment',
    emptyBody: 'Déposez vos justificatifs pour commencer. Notre équipe vérifie chaque document et vous prévient s’il faut en remplacer un.',
    emptyFilter: 'Aucun document ne correspond à cette vue.',
    removeTitle: 'Retirer ce document ?',
    removeBody: 'Il n’a pas encore été vérifié : il sera supprimé. Vous pourrez en déposer une nouvelle copie à tout moment.',
    cancel: 'Annuler',
    removed: 'Document retiré.',
    removeFailed: 'Le document n’a pas pu être retiré.',
    linkFailed: 'Le document n’a pas pu être ouvert. Veuillez réessayer.',
    loadingPreview: 'Ouverture sécurisée…',
    noPreview: 'Ce document ne peut pas être affiché ici.',
    openTab: 'Ouvrir dans un nouvel onglet',
    close: 'Fermer',
    drawer: {
      title: 'Déposer des documents',
      sub: 'PDF, JPG ou PNG · 20 Mo maximum par fichier',
      drop: 'Glissez vos fichiers ici ou choisissez-les',
      dropSub: 'Vous pouvez en ajouter plusieurs à la fois',
      what: 'De quel document s’agit-il ?',
      choose: 'Choisir…',
      needed: 'À fournir maintenant',
      other: 'Autres documents',
      expiry: 'Date d’expiration (s’il y en a une)',
      tips: 'Pour une copie nette : les quatre coins visibles, sans reflet, tout le texte lisible.',
      uploading: (p: number) => `Envoi… ${p} %`,
      saving: 'Enregistrement…',
      done: 'Déposé. Notre équipe va le vérifier.',
      uploadN: (n: number) => (n === 1 ? 'Déposer 1 fichier' : `Déposer ${n} fichiers`),
      working: 'Envoi…',
      pickType: 'Indiquez de quel document il s’agit pour chaque fichier.',
      tooBig: (n: string) => `${n} dépasse 20 Mo.`,
      badType: (n: string) => `${n} n’est pas un PDF, JPG ou PNG.`,
      remove: 'Retirer le fichier',
    },
    types: {
      PASSPORT_COPY: 'Passeport', DIPLOMA_DEGREE: 'Diplôme', DIPLOMA_TRANSCRIPT: 'Relevé de notes du diplôme', BACHELORS_DEGREE: 'Licence (diplôme)',
      BACHELORS_TRANSCRIPT: 'Relevé de notes de licence', MASTERS_DEGREE: 'Master (diplôme)', MASTERS_TRANSCRIPT: 'Relevé de notes de master', NURSING_LICENSE: 'Autorisation d’exercer (infirmier)',
      MEDICAL_LICENSE: 'Autorisation d’exercer (médecin)', OTHER_LICENSE: 'Autre autorisation d’exercer', GOOD_STANDING_CERTIFICATE: 'Certificat de bonne conduite professionnelle',
      WORK_EXPERIENCE_CERTIFICATE: 'Attestation d’expérience professionnelle', HIGH_SCHOOL_CERTIFICATE: 'Diplôme de fin d’études secondaires', ORDINARY_LEVEL_CERTIFICATE: 'Certificat Ordinary Level',
      BIRTH_CERTIFICATE: 'Acte de naissance', PHOTO_ID: 'Pièce d’identité avec photo', BANK_STATEMENT: 'Relevé bancaire', PERSONAL_STATEMENT: 'Lettre de motivation',
      REFERENCE_LETTER: 'Lettre de recommandation', OTHER: 'Autre document',
    } as Record<string, string>,
  },
};
type Text = (typeof TEXT)['en'];

// ── Helpers ───────────────────────────────────────────────────────────────────

const DOCUMENT_TYPES = Object.keys(TEXT.en.types);
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const ALLOWED_EXT = /\.(pdf|jpg|jpeg|png)$/i;
const DOT: Record<string, string> = {
  VERIFIED: 'bg-secondary', PENDING: 'bg-primary/40', REJECTED: 'bg-rose-500', REPLACED: 'bg-muted-foreground/40', PENDING_CLIENT: 'bg-accent',
};

const card = 'rounded-2xl border border-border bg-white shadow-sm';
const heading = 'text-xs font-bold uppercase tracking-widest text-muted-foreground';
const btnPrimary = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-40';
const btnOutline = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted/60 disabled:opacity-40';
const iconBtn = 'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground';
const field = 'h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

function Dot({ className }: { className: string }) {
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${className}`} />;
}

/** Fixed codes get a proper name; names written by the team are shown as written. */
function typeLabel(type: string | undefined | null, t: Text) {
  if (!type) return '';
  if (t.types[type]) return t.types[type];
  if (/^[A-Z0-9_]+$/.test(type)) return type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  return type.replace(/-return$/, '');
}
function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}
function shownStatus(doc: any) {
  return doc.superseded ? 'REPLACED' : doc.status;
}
function isLive(doc: any) {
  return doc.status === 'VERIFIED' || doc.status === 'PENDING';
}

// ── Upload panel ──────────────────────────────────────────────────────────────

type UploadState = 'idle' | 'uploading' | 'saving' | 'done' | 'error';
interface QueuedFile {
  id: string; file: File; documentType: string; expiryDate: string;
  state: UploadState; progress: number; error: string; preview: string | null;
}

function UploadDrawer({
  open, onClose, personId, onUploaded, presetType, needed, t,
}: {
  open: boolean; onClose: () => void; personId: string; onUploaded: () => Promise<void> | void;
  presetType: string; needed: string[]; t: Text;
}) {
  const d = t.drawer;
  const inputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) setQueue([]); }, [open]);

  const patch = (id: string, change: Partial<QueuedFile>) => setQueue((q) => q.map((f) => (f.id === id ? { ...f, ...change } : f)));

  function addFiles(files: FileList | File[]) {
    const next: QueuedFile[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) { toast.error(d.tooBig(file.name)); continue; }
      if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXT.test(file.name)) { toast.error(d.badType(file.name)); continue; }
      next.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`, file,
        // Only pre-filled when the client came from a specific document's button.
        documentType: presetType, expiryDate: '', state: 'idle', progress: 0, error: '',
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      });
    }
    setQueue((q) => [...q, ...next]);
  }

  function removeFile(id: string) {
    setQueue((q) => {
      const item = q.find((f) => f.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return q.filter((f) => f.id !== id);
    });
  }

  async function uploadOne(item: QueuedFile): Promise<boolean> {
    patch(item.id, { state: 'uploading', progress: 0, error: '' });
    try {
      const { url, key } = await api.getUploadUrl(personId, item.documentType, item.file.name);
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', url);
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) patch(item.id, { progress: Math.round((e.loaded / e.total) * 90) }); };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(item.file);
      });
      patch(item.id, { state: 'saving', progress: 95 });
      await api.confirmUpload(personId, item.documentType, key, item.expiryDate || undefined);
      patch(item.id, { state: 'done', progress: 100 });
      return true;
    } catch (err: any) {
      patch(item.id, { state: 'error', error: err.message ?? 'Upload failed' });
      return false;
    }
  }

  const waiting = queue.filter((f) => f.state === 'idle' || f.state === 'error');
  const untyped = waiting.some((f) => !f.documentType);
  const allDone = queue.length > 0 && queue.every((f) => f.state === 'done');

  async function uploadAll() {
    if (!waiting.length || untyped) return;
    setBusy(true);
    let ok = 0;
    for (const item of waiting) if (await uploadOne(item)) ok += 1;
    setBusy(false);
    if (ok > 0) await onUploaded();
    if (ok === waiting.length) setTimeout(onClose, 1200);
  }

  const neededOpen = needed.filter((n) => !DOCUMENT_TYPES.includes(n));
  const presetExtra = presetType && !needed.includes(presetType) && !DOCUMENT_TYPES.includes(presetType) ? presetType : '';

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />}
      <div role="dialog" aria-modal="true" aria-label={d.title} aria-hidden={!open} className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-bold text-foreground">{d.title}</h2>
            <p className="text-xs text-muted-foreground">{d.sub}</p>
          </div>
          <button onClick={onClose} aria-label={t.close} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <button
            type="button"
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
            className={`flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}
          >
            <UploadSimple className="mb-2 h-7 w-7 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">{d.drop}</span>
            <span className="mt-0.5 text-xs text-muted-foreground">{d.dropSub}</span>
          </button>
          <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" multiple className="hidden" onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />

          {queue.map((item) => {
            const editable = item.state === 'idle' || item.state === 'error';
            return (
              <div key={item.id} className="space-y-3 rounded-xl border border-border p-4">
                <div className="flex items-center gap-3">
                  {item.preview
                    /* eslint-disable-next-line @next/next/no-img-element */
                    ? <img src={item.preview} alt="" className="h-12 w-12 shrink-0 rounded-lg border border-border object-cover" />
                    : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50"><FileText className="h-5 w-5 text-muted-foreground" /></span>}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{item.file.name}</p>
                    <p className="text-xs text-muted-foreground">{(item.file.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  {editable && !busy && <button onClick={() => removeFile(item.id)} aria-label={d.remove} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60"><Trash className="h-4 w-4" /></button>}
                  {item.state === 'done' && <CheckCircle weight="fill" className="h-5 w-5 shrink-0 text-secondary" />}
                </div>

                {editable && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-foreground">
                      {d.what}
                      <select value={item.documentType} onChange={(e) => patch(item.id, { documentType: e.target.value })} className={`${field} mt-1 font-normal ${item.documentType ? '' : 'border-accent'}`}>
                        <option value="">{d.choose}</option>
                        {(neededOpen.length > 0 || presetExtra) && (
                          <optgroup label={d.needed}>
                            {presetExtra && <option value={presetExtra}>{typeLabel(presetExtra, t)}</option>}
                            {neededOpen.map((n) => <option key={n} value={n}>{typeLabel(n, t)}</option>)}
                          </optgroup>
                        )}
                        <optgroup label={d.other}>
                          {DOCUMENT_TYPES.map((code) => <option key={code} value={code}>{t.types[code]}</option>)}
                        </optgroup>
                      </select>
                    </label>
                    <label className="block text-xs font-bold text-foreground">
                      {d.expiry}
                      <input type="date" value={item.expiryDate} onChange={(e) => patch(item.id, { expiryDate: e.target.value })} className={`${field} mt-1 font-normal`} />
                    </label>
                  </div>
                )}

                {(item.state === 'uploading' || item.state === 'saving') && (
                  <div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary transition-all duration-300" style={{ width: `${item.progress}%` }} /></div>
                    <p className="mt-1 text-xs text-muted-foreground">{item.state === 'saving' ? d.saving : d.uploading(item.progress)}</p>
                  </div>
                )}
                {item.state === 'done' && <p className="text-xs font-semibold text-foreground">{d.done}</p>}
                {item.state === 'error' && <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground"><Dot className="bg-rose-500" /> {item.error}</p>}
              </div>
            );
          })}

          <p className="rounded-xl bg-muted/50 px-3.5 py-2.5 text-xs text-muted-foreground">{d.tips}</p>
        </div>

        {queue.length > 0 && !allDone && (
          <div className="border-t border-border px-5 py-4">
            {untyped && <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground"><Dot className="bg-accent" /> {d.pickType}</p>}
            <button onClick={uploadAll} disabled={busy || waiting.length === 0 || untyped} className={`${btnPrimary} w-full py-2.5 text-sm`}>
              <UploadSimple className="h-4 w-4" /> {busy ? d.working : d.uploadN(waiting.length)}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const FILTERS = ['ALL', 'REPLACE', 'CHECKING', 'READY', 'EXPIRING'] as const;
type Filter = (typeof FILTERS)[number];

export default function DocumentsPage() {
  const { me, documents, engagement, loading, refresh } = useUser();
  const locale: Locale = me?.locale === 'fr' ? 'fr' : 'en';
  const t = TEXT[locale];
  const day = (date?: string | null) => (date ? new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

  const [caseView, setCaseView] = useState<any>(null);
  const [forms, setForms] = useState<any[]>([]);
  const [drawer, setDrawer] = useState<{ type: string } | null>(null);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [q, setQ] = useState('');
  const [preview, setPreview] = useState<{ doc: any; url: string; loading: boolean } | null>(null);
  const [removing, setRemoving] = useState<any | null>(null);
  const [busyId, setBusyId] = useState('');
  const returnRef = useRef<HTMLInputElement>(null);
  const returnFor = useRef<any>(null);
  const eid: string | undefined = engagement?.id;

  const loadExtras = useCallback(() => {
    if (eid) api.getCaseView(eid).then(setCaseView).catch(() => {});
    api.getPendingForMeDocuments().then((l) => setForms(l ?? [])).catch(() => {});
  }, [eid]);

  useEffect(() => { if (me) loadExtras(); }, [me, loadExtras]);

  const reload = useCallback(async () => { await refresh(); loadExtras(); }, [refresh, loadExtras]);

  // The client's own documents. Blank forms sent by the team are listed separately.
  const own = useMemo(() => (documents ?? []).filter((d: any) => d.origin !== 'OFFICER_SENT'), [documents]);
  const expiring = (d: any) => isLive(d) && !!d.expiryDate && daysUntil(d.expiryDate) <= 30;
  const MATCH: Record<Filter, (d: any) => boolean> = {
    ALL: () => true,
    REPLACE: (d) => shownStatus(d) === 'REJECTED',
    CHECKING: (d) => d.status === 'PENDING',
    READY: (d) => d.status === 'VERIFIED',
    EXPIRING: expiring,
  };
  const counts = Object.fromEntries(FILTERS.map((f) => [f, own.filter(MATCH[f]).length])) as Record<Filter, number>;
  const ORDER: Record<string, number> = { REJECTED: 0, PENDING: 1, VERIFIED: 2, REPLACED: 3 };
  const shown = own
    .filter(MATCH[filter])
    .filter((d: any) => !q.trim() || typeLabel(d.type, t).toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a: any, b: any) => (ORDER[shownStatus(a)] ?? 9) - (ORDER[shownStatus(b)] ?? 9) || new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  const required: any[] = caseView?.requiredDocs ?? [];
  const requiredReady = required.filter((r) => r.status === 'VERIFIED').length;
  const stillNeeded = required.filter((r) => r.status !== 'VERIFIED').map((r) => r.type as string);

  async function secureUrl(doc: any) {
    const { url } = await api.getDocumentViewUrl(doc.id);
    return url;
  }
  async function openPreview(doc: any) {
    setPreview({ doc, url: '', loading: true });
    try { setPreview({ doc, url: await secureUrl(doc), loading: false }); } catch { setPreview({ doc, url: '', loading: false }); }
  }
  async function download(doc: any) {
    // Opened before the request so the browser does not treat it as a pop-up.
    const win = window.open('about:blank', '_blank');
    if (win) win.opener = null;
    try {
      const url = await secureUrl(doc);
      if (win) win.location.href = url; else window.location.href = url;
    } catch {
      win?.close();
      toast.error(t.linkFailed);
    }
  }
  async function confirmRemove() {
    if (!removing) return;
    setBusyId(removing.id);
    try {
      await api.removeDocument(removing.id);
      toast.success(t.removed);
      setRemoving(null);
      await reload();
    } catch (e: any) {
      toast.error(e.message ?? t.removeFailed);
    } finally {
      setBusyId('');
    }
  }
  async function returnForm(form: any, file: File) {
    if (!me) return;
    setBusyId(form.id);
    try {
      const { url, key } = await api.getUploadUrl(me.id, `${form.type}-return`, file.name);
      const put = await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      if (!put.ok) throw new Error('upload');
      await api.clientReturnDocument(form.id, key, `${form.type}-return`);
      toast.success(t.returned);
      await reload();
    } catch {
      toast.error(t.returnFailed);
    } finally {
      setBusyId('');
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  const ready = own.filter((d: any) => d.status === 'VERIFIED').length;
  const subtitle = own.length === 0
    ? t.noneYet
    : [t.summary(ready, own.length), counts.CHECKING > 0 && t.checking(counts.CHECKING), counts.REPLACE > 0 && t.toReplace(counts.REPLACE)].filter(Boolean).join(' · ');

  const rowActions = (doc: any) => {
    const status = shownStatus(doc);
    return (
      <>
        <button onClick={() => openPreview(doc)} aria-label={t.view} title={t.view} className={iconBtn}><Eye className="h-4 w-4" /></button>
        <button onClick={() => download(doc)} aria-label={t.download} title={t.download} className={iconBtn}><DownloadSimple className="h-4 w-4" /></button>
        {status === 'REJECTED' && <button onClick={() => setDrawer({ type: doc.type })} className={btnPrimary}>{t.reupload}</button>}
        {status !== 'REJECTED' && expiring(doc) && <button onClick={() => setDrawer({ type: doc.type })} className={btnOutline}>{t.renew}</button>}
        {doc.status === 'PENDING' && doc.origin === 'CLIENT_UPLOADED' && <button onClick={() => setRemoving(doc)} className={btnOutline}>{t.remove}</button>}
      </>
    );
  };
  const expiryCell = (doc: any) => {
    if (!doc.expiryDate) return <span className="text-muted-foreground">—</span>;
    const left = daysUntil(doc.expiryDate);
    if (!isLive(doc) || left > 30) return <span className="text-muted-foreground">{day(doc.expiryDate)}</span>;
    return <span className="inline-flex items-center gap-1.5 font-semibold text-foreground"><Dot className={left <= 0 ? 'bg-rose-500' : 'bg-accent'} /> {left <= 0 ? t.expired : t.daysLeft(left)}</span>;
  };
  const statusCell = (doc: any) => {
    const s = shownStatus(doc);
    return <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-semibold text-foreground"><Dot className={DOT[s] ?? 'bg-muted'} /> {t.status[s] ?? s}</span>;
  };
  const nameCell = (doc: any) => (
    <>
      <p className="font-semibold text-foreground">{typeLabel(doc.type, t)}{doc.origin === 'CLIENT_RETURN' && <span className="ml-2 text-xs font-medium text-muted-foreground">{t.returnedForm}</span>}</p>
      {shownStatus(doc) === 'REJECTED' && doc.rejectionReason && <p className="mt-0.5 text-xs text-muted-foreground">“{doc.rejectionReason}”</p>}
    </>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title={t.title}
        subtitle={subtitle}
        actions={<Button size="sm" onClick={() => setDrawer({ type: '' })}><FilePlus className="h-4 w-4" /> {t.upload}</Button>}
      />
      <p className="-mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5" /> {t.secure}</p>

      {/* Needed now */}
      {required.length > 0 && (
        <section data-tour="docs-checklist" className={card}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
            <h2 className={heading}>{t.neededNow}{caseView?.stage?.current ? <span className="normal-case tracking-normal text-foreground"> · {caseView.stage.current}</span> : null}</h2>
            <span className="text-xs font-semibold text-muted-foreground">{t.readyOf(requiredReady, required.length)}</span>
          </div>
          <ul className="divide-y divide-border/70">
            {required.map((r) => (
              <li key={r.type} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3">
                <Dot className={r.status ? DOT[r.status] : 'border border-muted-foreground/50'} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{typeLabel(r.type, t)}</p>
                  {r.status === 'REJECTED' && r.reason && <p className="text-xs text-muted-foreground">“{r.reason}”</p>}
                </div>
                <span className="text-xs text-muted-foreground">{r.status ? t.status[r.status] : t.notUploaded}</span>
                {(!r.status || r.status === 'REJECTED') && (
                  <button onClick={() => setDrawer({ type: r.type })} className={r.status ? btnPrimary : btnOutline}>
                    <UploadSimple className="h-3.5 w-3.5" /> {r.status ? t.reupload : t.uploadShort}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Forms to complete */}
      {forms.length > 0 && (
        <section data-tour="docs-forms" className={card}>
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
            <div>
              <h2 className={heading}>{t.forms}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{t.formsHelp}</p>
            </div>
            <span className="rounded-full bg-accent px-2 text-xs font-bold text-accent-foreground">{forms.length}</span>
          </div>
          <input
            ref={returnRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
            onChange={(e) => { const file = e.target.files?.[0]; if (file && returnFor.current) returnForm(returnFor.current, file); e.target.value = ''; }}
          />
          <ul className="divide-y divide-border/70">
            {forms.map((form) => (
              <li key={form.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-foreground"><FileText className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground">{typeLabel(form.type, t)}</p>
                  {form.officerNote && <p className="text-sm text-muted-foreground">“{form.officerNote}”</p>}
                  <p className="text-xs text-muted-foreground">{t.from} {day(form.uploadedAt)}</p>
                </div>
                <button onClick={() => download(form)} className={btnOutline}><DownloadSimple className="h-3.5 w-3.5" /> {t.downloadForm}</button>
                <button disabled={busyId === form.id} onClick={() => { returnFor.current = form; returnRef.current?.click(); }} className={btnPrimary}>
                  <UploadSimple className="h-3.5 w-3.5" /> {busyId === form.id ? t.returning : t.returnForm}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* All documents */}
      <div className="flex flex-wrap items-center gap-2">
        <div data-tour="docs-filters" className="flex flex-wrap gap-1.5">
          {FILTERS.filter((f) => f === 'ALL' || f === filter || counts[f] > 0).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${filter === f ? 'border-primary bg-primary text-white' : 'border-border bg-white text-foreground hover:bg-muted/60'}`}
            >
              {t.filters[f]} <span className={filter === f ? 'text-white/70' : 'text-muted-foreground'}>{counts[f]}</span>
            </button>
          ))}
        </div>
        {own.length > 5 && (
          <div className="relative ml-auto w-full sm:w-60">
            <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input aria-label={t.search} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} className={`${field} h-9 pl-9`} />
          </div>
        )}
      </div>

      {own.length === 0 ? (
        <div className={`${card} flex flex-col items-center px-6 py-14 text-center`}>
          <UploadSimple className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <h2 className="font-bold text-foreground">{t.emptyTitle}</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t.emptyBody}</p>
          <button onClick={() => setDrawer({ type: '' })} className={`${btnPrimary} mt-4`}><FilePlus className="h-4 w-4" /> {t.upload}</button>
        </div>
      ) : shown.length === 0 ? (
        <div className={`${card} px-6 py-10 text-center text-sm text-muted-foreground`}>{t.emptyFilter}</div>
      ) : (
        <div data-tour="docs-list" className={`${card} overflow-hidden`}>
          {/* Wider screens: a table */}
          <table className="hidden w-full text-sm md:table">
            <thead className="border-b border-border bg-muted/40 text-left text-xs font-semibold text-muted-foreground">
              <tr>{t.cols.map((c) => <th key={c} className="px-5 py-2.5 font-semibold">{c}</th>)}<th className="px-5 py-2.5" /></tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {shown.map((doc: any) => (
                <tr key={doc.id} className={doc.superseded ? 'opacity-60' : ''}>
                  <td className="px-5 py-3">{nameCell(doc)}</td>
                  <td className="px-5 py-3 text-xs">{statusCell(doc)}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{day(doc.uploadedAt)}</td>
                  <td className="px-5 py-3 text-xs">{expiryCell(doc)}</td>
                  <td className="px-5 py-3"><div className="flex items-center justify-end gap-2">{rowActions(doc)}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Phone: one card per document */}
          <ul className="divide-y divide-border/70 md:hidden">
            {shown.map((doc: any) => (
              <li key={doc.id} className={`space-y-2 px-4 py-3.5 ${doc.superseded ? 'opacity-60' : ''}`}>
                <div className="text-sm">{nameCell(doc)}</div>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">{statusCell(doc)} <span className="text-muted-foreground">{day(doc.uploadedAt)}</span> {doc.expiryDate && expiryCell(doc)}</p>
                <div className="flex flex-wrap items-center gap-2">{rowActions(doc)}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {me && (
        <UploadDrawer
          open={!!drawer}
          onClose={() => setDrawer(null)}
          personId={me.id}
          onUploaded={reload}
          presetType={drawer?.type ?? ''}
          needed={stillNeeded}
          t={t}
        />
      )}

      {/* Remove */}
      {removing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setRemoving(null)}>
          <div role="dialog" aria-modal="true" aria-label={t.removeTitle} className="w-full max-w-sm rounded-2xl border border-border bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-bold text-foreground">{t.removeTitle}</h2>
            <p className="mt-2 rounded-xl bg-muted/50 px-4 py-2.5 text-sm font-semibold text-foreground">{typeLabel(removing.type, t)}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t.removeBody}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setRemoving(null)} className={btnOutline}>{t.cancel}</button>
              <button onClick={confirmRemove} disabled={busyId === removing.id} className={btnPrimary}>{t.remove}</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3" onClick={() => setPreview(null)}>
          <div role="dialog" aria-modal="true" aria-label={typeLabel(preview.doc.type, t)} className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
              <p className="min-w-0 truncate text-sm font-bold text-foreground">{typeLabel(preview.doc.type, t)}</p>
              <div className="flex shrink-0 items-center gap-2">
                {preview.url && <a href={preview.url} target="_blank" rel="noopener noreferrer" className={btnOutline}>{t.openTab}</a>}
                <button onClick={() => setPreview(null)} aria-label={t.close} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="flex min-h-[50vh] flex-1 items-center justify-center overflow-auto bg-muted/30 p-2">
              {preview.loading ? (
                <p className="text-sm text-muted-foreground">{t.loadingPreview}</p>
              ) : !preview.url ? (
                <p className="text-sm text-muted-foreground">{t.noPreview}</p>
              ) : preview.doc.isImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={preview.url} alt={typeLabel(preview.doc.type, t)} className="mx-auto max-h-[78vh] rounded-xl object-contain" />
              ) : (
                <iframe src={preview.url} className="h-[78vh] w-full rounded-xl border-0" title={typeLabel(preview.doc.type, t)} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
