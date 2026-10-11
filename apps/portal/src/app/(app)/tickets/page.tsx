'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Skeleton } from '@mjn/ui';
import {
  Headset, Plus, X, CircleNotch, PaperPlaneTilt, FileText, ArrowLeft, ArrowRight, Paperclip, CheckCircle, ChatCircle,
} from '@mjn/ui';
import { api } from '../../../lib/api';
import { useUser } from '../../../contexts/user-context';

// ── Wording (the page follows the client's preferred language) ────────────────

type Locale = 'en' | 'fr';

const TEXT = {
  en: {
    title: 'Get help',
    sub: 'Our support team usually replies within one working day.',
    ask: 'Ask for help',
    quick: 'Quick answers',
    links: [
      ['Upload or replace a document', 'My documents', '/documents'],
      ['Pay, or find a receipt', 'Payments', '/payments'],
      ['Move or cancel a session', 'My sessions', '/bookings'],
      ['A question about my case', 'Messages', '/messages'],
    ],
    requests: 'Your requests',
    none: 'You have not asked for help yet.',
    noneBody: 'If one of the quick answers above does not solve it, tell us what happened and we will reply here and by email.',
    turn: { us: 'Waiting for us', client: 'We replied', solved: 'Solved' } as Record<string, string>,
    you: 'You',
    file: 'File',
    topics: { PAYMENT: 'Payment', DOCUMENT: 'Documents', ACCOUNT: 'My account', SESSIONS: 'Sessions and classes', GENERAL: 'Something else', LICENSING: 'Licensing', EXAM_PREP: 'Exam preparation' } as Record<string, string>,
    opened: 'opened',
    select: 'Select a request',
    selectBody: 'Choose a request on the left to read the conversation.',
    back: 'Back to your requests',
    today: 'Today',
    yesterday: 'Yesterday',
    reply: 'Write a reply…',
    hint: 'Enter to send · Shift+Enter for a new line · PDF, JPG, PNG or Word, up to 20 MB',
    attach: 'Attach a screenshot or file',
    removeFile: 'Remove file',
    send: 'Send',
    fixed: 'Problem fixed?',
    markSolved: 'Mark as solved',
    solvedOn: (d: string) => `Solved on ${d}`,
    stillWrong: 'Still not right? Reply below to reopen this request.',
    tooOld: 'This request was solved a while ago. If you need more help, start a new one.',
    solvedToast: 'Marked as solved. Thank you.',
    sent: 'We have your request. We will reply here and by email.',
    failed: 'That did not work. Please try again.',
    openFailed: 'The file could not be opened. Please try again.',
    tooBig: 'That file is larger than 20 MB.',
    badType: 'Only PDF, JPG, PNG and Word files can be sent.',
    uploadFailed: 'The file could not be uploaded. Please try again.',
    loadFailed: 'Your requests could not be loaded. Check your connection and reload the page.',
    form: {
      title: 'Ask for help',
      about: 'What is it about?',
      caseHint: 'For a question about your case or your licence, write to your team in',
      messages: 'Messages',
      subject: 'Subject',
      subjectPh: 'For example: my payment did not go through',
      what: 'What happened?',
      whatPh: 'What you did, what you expected, and what you saw instead.',
      addFile: 'Add a screenshot or file (optional)',
      promise: 'We reply here and by email, usually within one working day.',
      cancel: 'Cancel',
      send: 'Send',
    },
  },
  fr: {
    title: 'Obtenir de l’aide',
    sub: 'Notre équipe d’assistance répond généralement sous un jour ouvré.',
    ask: 'Demander de l’aide',
    quick: 'Réponses rapides',
    links: [
      ['Déposer ou remplacer un document', 'Mes documents', '/documents'],
      ['Payer, ou retrouver un reçu', 'Paiements', '/payments'],
      ['Déplacer ou annuler une séance', 'Mes séances', '/bookings'],
      ['Une question sur mon dossier', 'Messages', '/messages'],
    ],
    requests: 'Vos demandes',
    none: 'Vous n’avez pas encore demandé d’aide.',
    noneBody: 'Si aucune des réponses rapides ci-dessus ne règle le problème, dites-nous ce qui s’est passé : nous vous répondrons ici et par e-mail.',
    turn: { us: 'En attente de notre réponse', client: 'Nous avons répondu', solved: 'Résolue' } as Record<string, string>,
    you: 'Vous',
    file: 'Fichier',
    topics: { PAYMENT: 'Paiement', DOCUMENT: 'Documents', ACCOUNT: 'Mon compte', SESSIONS: 'Séances et cours', GENERAL: 'Autre chose', LICENSING: 'Autorisation d’exercer', EXAM_PREP: 'Préparation aux examens' } as Record<string, string>,
    opened: 'ouverte le',
    select: 'Sélectionnez une demande',
    selectBody: 'Choisissez une demande à gauche pour lire la conversation.',
    back: 'Retour à vos demandes',
    today: 'Aujourd’hui',
    yesterday: 'Hier',
    reply: 'Écrivez une réponse…',
    hint: 'Entrée pour envoyer · Maj+Entrée pour aller à la ligne · PDF, JPG, PNG ou Word, 20 Mo maximum',
    attach: 'Joindre une capture d’écran ou un fichier',
    removeFile: 'Retirer le fichier',
    send: 'Envoyer',
    fixed: 'Problème réglé ?',
    markSolved: 'Marquer comme résolue',
    solvedOn: (d: string) => `Résolue le ${d}`,
    stillWrong: 'Le problème persiste ? Répondez ci-dessous pour rouvrir cette demande.',
    tooOld: 'Cette demande a été résolue il y a un moment. Si vous avez encore besoin d’aide, ouvrez-en une nouvelle.',
    solvedToast: 'Demande marquée comme résolue. Merci.',
    sent: 'Nous avons bien reçu votre demande. Nous vous répondrons ici et par e-mail.',
    failed: 'Cela n’a pas fonctionné. Veuillez réessayer.',
    openFailed: 'Le fichier n’a pas pu être ouvert. Veuillez réessayer.',
    tooBig: 'Ce fichier dépasse 20 Mo.',
    badType: 'Seuls les fichiers PDF, JPG, PNG et Word peuvent être envoyés.',
    uploadFailed: 'Le fichier n’a pas pu être envoyé. Veuillez réessayer.',
    loadFailed: 'Vos demandes n’ont pas pu être chargées. Vérifiez votre connexion et rechargez la page.',
    form: {
      title: 'Demander de l’aide',
      about: 'De quoi s’agit-il ?',
      caseHint: 'Pour une question sur votre dossier ou votre autorisation d’exercer, écrivez à votre équipe dans',
      messages: 'Messages',
      subject: 'Objet',
      subjectPh: 'Par exemple : mon paiement n’est pas passé',
      what: 'Que s’est-il passé ?',
      whatPh: 'Ce que vous avez fait, ce que vous attendiez et ce que vous avez vu à la place.',
      addFile: 'Ajouter une capture d’écran ou un fichier (facultatif)',
      promise: 'Nous répondons ici et par e-mail, généralement sous un jour ouvré.',
      cancel: 'Annuler',
      send: 'Envoyer',
    },
  },
};
type Text = (typeof TEXT)['en'];

// ── Helpers ───────────────────────────────────────────────────────────────────

const TOPICS = ['PAYMENT', 'DOCUMENT', 'ACCOUNT', 'SESSIONS', 'GENERAL'] as const;
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_EXT = /\.(pdf|jpe?g|png|docx?)$/i;
const TURN_DOT: Record<string, string> = { us: 'bg-primary/40', client: 'bg-accent', solved: 'bg-secondary' };

const card = 'rounded-2xl border border-border bg-white shadow-sm';
const heading = 'text-xs font-bold uppercase tracking-widest text-muted-foreground';
const btnPrimary = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-40';
const btnOutline = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted/60 disabled:opacity-40';
const field = 'w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

function Dot({ className }: { className: string }) {
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${className}`} />;
}
function sameDay(a: string | Date, b: string | Date) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}
function fileProblem(file: File, t: Text) {
  if (file.size > MAX_FILE_SIZE) return t.tooBig;
  if (!ALLOWED_EXT.test(file.name)) return t.badType;
  return '';
}
async function uploadFile(file: File) {
  const { url, key } = await api.getTicketUploadUrl(file.name);
  const put = await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'application/octet-stream' } });
  if (!put.ok) throw new Error('upload');
  return { key, name: file.name, type: file.type };
}
async function openFile(replyId: string, failed: string) {
  // Opened before the request so the browser does not treat it as a pop-up.
  const win = window.open('about:blank', '_blank');
  if (win) win.opener = null;
  try {
    const { url } = await api.getTicketAttachmentUrl(replyId);
    if (win) win.location.href = url; else window.location.href = url;
  } catch {
    win?.close();
    toast.error(failed);
  }
}

function FileRow({ file, onRemove, t }: { file: File; onRemove?: () => void; t: Text }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2">
      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{file.name}</span>
      {onRemove && <button type="button" onClick={onRemove} aria-label={t.removeFile} className="rounded-lg p-1 text-muted-foreground hover:bg-muted/60"><X className="h-4 w-4" /></button>}
    </div>
  );
}

// ── Ask for help ──────────────────────────────────────────────────────────────

function AskForm({ t, topic, onClose, onCreated }: { t: Text; topic: string; onClose: () => void; onCreated: (ticket: any) => void }) {
  const f = t.form;
  const [category, setCategory] = useState(TOPICS.includes(topic as any) ? topic : 'GENERAL');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit() {
    if (!subject.trim() || !message.trim() || busy) return;
    setBusy(true);
    try {
      let attachment;
      if (file) {
        try { attachment = await uploadFile(file); } catch { toast.error(t.uploadFailed); return; }
      }
      onCreated(await api.createTicket(subject.trim(), category, message.trim(), attachment));
    } catch (e: any) {
      toast.error(e?.message && !/^Request failed/.test(e.message) ? e.message : t.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={f.title} className="flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-border bg-white shadow-xl sm:max-w-lg sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
          <h2 className="text-base font-bold text-foreground">{f.title}</h2>
          <button onClick={onClose} aria-label={f.cancel} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <fieldset>
            <legend className="mb-2 text-xs font-bold text-foreground">{f.about}</legend>
            <div className="flex flex-wrap gap-1.5">
              {TOPICS.map((key) => (
                <button key={key} type="button" onClick={() => setCategory(key)} aria-pressed={category === key} className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${category === key ? 'border-primary bg-primary text-white' : 'border-border bg-white text-foreground hover:bg-muted/60'}`}>
                  {t.topics[key]}
                </button>
              ))}
            </div>
          </fieldset>
          <p className="rounded-xl bg-muted/50 px-3.5 py-2.5 text-xs text-muted-foreground">{f.caseHint} <Link href="/messages" className="font-bold text-primary hover:underline">{f.messages}</Link>.</p>
          <label className="block text-xs font-bold text-foreground">
            {f.subject}
            <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} placeholder={f.subjectPh} className={`${field} mt-1.5 font-normal`} />
          </label>
          <label className="block text-xs font-bold text-foreground">
            {f.what}
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} maxLength={5000} placeholder={f.whatPh} className={`${field} mt-1.5 resize-none font-normal leading-relaxed`} />
          </label>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,.pdf,.doc,.docx" className="hidden" onChange={(e) => { const picked = e.target.files?.[0]; e.target.value = ''; if (!picked) return; const problem = fileProblem(picked, t); if (problem) toast.error(problem); else setFile(picked); }} />
          {file
            ? <FileRow file={file} onRemove={busy ? undefined : () => setFile(null)} t={t} />
            : <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"><Paperclip className="h-3.5 w-3.5" /> {f.addFile}</button>}
          <p className="text-xs text-muted-foreground">{f.promise}</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <button onClick={onClose} className={btnOutline}>{f.cancel}</button>
          <button onClick={submit} disabled={busy || !subject.trim() || !message.trim()} className={btnPrimary}>{busy && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} {f.send}</button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TicketsPage() {
  const { me } = useUser();
  const locale: Locale = me?.locale === 'fr' ? 'fr' : 'en';
  const t = TEXT[locale];
  const dl = locale === 'fr' ? 'fr-FR' : 'en-GB';
  const day = (d: string | Date) => new Date(d).toLocaleDateString(dl, { day: 'numeric', month: 'short' });
  const clock = (d: string | Date) => new Date(d).toLocaleTimeString(dl, { hour: '2-digit', minute: '2-digit' });
  const when = (d: string | Date) => (sameDay(d, new Date()) ? clock(d) : sameDay(d, new Date(Date.now() - 86400000)) ? t.yesterday : day(d));
  const dayLabel = (d: string | Date) => (sameDay(d, new Date()) ? t.today : sameDay(d, new Date(Date.now() - 86400000)) ? t.yesterday : new Date(d).toLocaleDateString(dl, { day: 'numeric', month: 'long', year: 'numeric' }));

  const [tickets, setTickets] = useState<any[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [asking, setAsking] = useState<string | null>(null);
  const [compose, setCompose] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const first = useRef(true);

  const load = useCallback(async () => {
    try {
      const list = (await api.getMyTickets()) ?? [];
      setTickets(list);
      setFailed(false);
      if (first.current) {
        first.current = false;
        // A link from an email opens that request; a link from another page opens the form on a topic.
        const params = new URLSearchParams(window.location.search);
        const wanted = params.get('ticket');
        if (wanted && list.some((x: any) => x.id === wanted)) setSelectedId(wanted);
        else if (params.get('topic')) setAsking(params.get('topic'));
      }
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, [load]);

  const selected = useMemo(() => (tickets ?? []).find((x) => x.id === selectedId) ?? null, [tickets, selectedId]);
  const replyCount = selected?.replies?.length ?? 0;

  // Opening a request, or watching it when we reply, counts as reading it.
  useEffect(() => {
    if (!selected?.unread) return;
    api.markTicketSeen(selected.id).catch(() => {});
    setTickets((prev) => prev?.map((x) => (x.id === selected.id ? { ...x, unread: false } : x)) ?? prev);
  }, [selected?.id, selected?.unread]);

  useEffect(() => {
    setCompose(''); setFile(null);
  }, [selectedId]);
  useEffect(() => {
    if (selectedId) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
  }, [selectedId, replyCount]);

  async function send() {
    const text = compose.trim();
    if ((!text && !file) || !selected || busy) return;
    setBusy(true);
    try {
      let attachment;
      if (file) {
        try { attachment = await uploadFile(file); } catch { toast.error(t.uploadFailed); return; }
      }
      await api.replyToTicket(selected.id, text, attachment);
      setCompose(''); setFile(null);
      if (boxRef.current) boxRef.current.style.height = 'auto';
      await load();
    } catch (e: any) {
      toast.error(e?.message && !/^Request failed/.test(e.message) ? e.message : t.failed);
    } finally {
      setBusy(false);
    }
  }

  async function solve() {
    if (!selected || busy) return;
    setBusy(true);
    try {
      await api.solveTicket(selected.id);
      toast.success(t.solvedToast);
      await load();
    } catch {
      toast.error(t.failed);
    } finally {
      setBusy(false);
    }
  }

  const list = tickets ?? [];
  const turnOf = (x: any) => (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground"><Dot className={TURN_DOT[x.turn] ?? 'bg-muted'} /> {t.turn[x.turn] ?? x.turn}</span>
  );
  const canWrite = selected && (selected.turn !== 'solved' || selected.canReopen);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div data-tour="page-header">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{t.sub}</p>
        </div>
        <button data-tour="help-ask" onClick={() => setAsking('GENERAL')} className={`${btnPrimary} px-4 py-2.5 text-sm`}><Plus className="h-4 w-4" /> {t.ask}</button>
      </div>

      {/* Quick answers */}
      <section data-tour="help-quick" className={selected ? 'hidden lg:block' : ''}>
        <h2 className={`mb-2 ${heading}`}>{t.quick}</h2>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {t.links.map(([question, page, href]) => (
            <Link key={href} href={href} className={`${card} group flex items-center gap-3 px-4 py-3 transition-colors hover:border-primary/40`}>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">{question}</span>
                <span className="block text-xs font-bold text-primary">{page}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </section>

      {failed && <div className={`${card} px-5 py-4 text-sm text-muted-foreground`}>{t.loadFailed}</div>}

      {tickets === null && !failed ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : list.length === 0 ? (
        <div data-tour="help-requests" className={`${card} flex flex-col items-center px-6 py-12 text-center`}>
          <Headset className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <h2 className="font-bold text-foreground">{t.none}</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t.noneBody}</p>
          <button onClick={() => setAsking('GENERAL')} className={`${btnPrimary} mt-4`}><Plus className="h-3.5 w-3.5" /> {t.ask}</button>
        </div>
      ) : (
        <div data-tour="help-requests" className={`${card} flex h-[34rem] max-h-[calc(100vh-9rem)] overflow-hidden`}>
          {/* Requests */}
          <div className={`w-full shrink-0 flex-col border-r border-border lg:flex lg:w-80 xl:w-96 ${selected ? 'hidden' : 'flex'}`}>
            <div className="border-b border-border px-4 py-3"><h2 className={heading}>{t.requests}</h2></div>
            <ul className="min-h-0 flex-1 divide-y divide-border/60 overflow-y-auto">
              {list.map((x) => {
                const last = x.replies?.[x.replies.length - 1];
                const preview = last ? `${last.authorRole === 'CLIENT' ? `${t.you}: ` : 'MJN: '}${last.content || (last.attachment ? `${t.file}: ${last.attachment.name}` : '')}` : '';
                return (
                  <li key={x.id}>
                    <button onClick={() => setSelectedId(x.id)} aria-current={x.id === selectedId ? 'true' : undefined} className={`w-full px-4 py-3 text-left transition-colors ${x.id === selectedId ? 'bg-primary/5' : 'hover:bg-muted/40'}`}>
                      <span className="flex items-center gap-2">
                        <span className={`min-w-0 flex-1 truncate text-sm text-foreground ${x.unread ? 'font-bold' : 'font-semibold'}`}>{x.subject}</span>
                        {x.unread && <Dot className="bg-accent" />}
                      </span>
                      <span className="mt-0.5 flex items-center justify-between gap-2">{turnOf(x)}<span className="shrink-0 text-xs text-muted-foreground">{when(x.lastActivityAt)}</span></span>
                      {preview && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{preview}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Conversation */}
          <div className={`min-w-0 flex-1 flex-col lg:flex ${selected ? 'flex' : 'hidden'}`}>
            {!selected ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
                <ChatCircle className="h-10 w-10 text-muted-foreground/30" />
                <p className="font-bold text-foreground">{t.select}</p>
                <p className="text-sm text-muted-foreground">{t.selectBody}</p>
              </div>
            ) : (
              <>
                <div className="flex shrink-0 items-start gap-3 border-b border-border px-4 py-3">
                  <button onClick={() => setSelectedId(null)} aria-label={t.back} className="mt-0.5 rounded-lg p-1.5 text-muted-foreground hover:bg-muted lg:hidden"><ArrowLeft className="h-4 w-4" /></button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{selected.subject}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      <span>{t.topics[selected.category] ?? selected.category}</span>
                      <span>· {t.opened} {day(selected.createdAt)}</span>
                      {turnOf(selected)}
                    </p>
                  </div>
                </div>

                <div className="min-h-0 flex-1 space-y-1 overflow-y-auto bg-muted/40 px-4 py-4">
                  {(selected.replies ?? []).map((reply: any, i: number) => {
                    const prev = selected.replies[i - 1];
                    const next = selected.replies[i + 1];
                    const mine = reply.authorRole === 'CLIENT';
                    const last = !next || (next.authorRole === 'CLIENT') !== mine || !sameDay(next.createdAt, reply.createdAt);
                    return (
                      <div key={reply.id}>
                        {(!prev || !sameDay(prev.createdAt, reply.createdAt)) && (
                          <div className="my-3 flex justify-center"><span className="rounded-full border border-border/60 bg-white px-3 py-1 text-xs font-medium text-muted-foreground">{dayLabel(reply.createdAt)}</span></div>
                        )}
                        <div className={`flex items-end gap-1.5 ${mine ? 'flex-row-reverse' : ''}`}>
                          {!mine && <span className="h-7 w-7 shrink-0">{last && <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-white">MJN</span>}</span>}
                          <div className={`max-w-[78%] space-y-2 rounded-2xl px-3.5 py-2.5 ${mine ? 'rounded-br-sm bg-primary text-white' : 'rounded-bl-sm border border-border/60 bg-white text-foreground'}`}>
                            {reply.content && <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{reply.content}</p>}
                            {reply.attachment && (
                              <button onClick={() => openFile(reply.id, t.openFailed)} className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors ${mine ? 'border-white/30 bg-white/10 text-white hover:bg-white/20' : 'border-border bg-muted/40 text-foreground hover:bg-muted'}`}>
                                <FileText className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1 truncate">{reply.attachment.name}</span>
                              </button>
                            )}
                            {last && <p className={`text-[11px] ${mine ? 'text-right text-white/60' : 'text-muted-foreground'}`}>{clock(reply.createdAt)}</p>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                <div className="shrink-0 border-t border-border bg-white">
                  {selected.turn === 'solved' && (
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border/70 px-4 py-2.5 text-sm text-foreground">
                      <CheckCircle weight="fill" className="h-4 w-4 shrink-0 text-secondary" />
                      <span className="font-semibold">{t.solvedOn(day(selected.resolvedAt ?? selected.updatedAt))}</span>
                      <span className="text-muted-foreground">{selected.canReopen ? t.stillWrong : t.tooOld}</span>
                    </p>
                  )}
                  {canWrite && (
                    <>
                      {file && <div className="px-4 pt-3"><FileRow file={file} onRemove={busy ? undefined : () => setFile(null)} t={t} /></div>}
                      <div className="flex items-end gap-2 px-3 pt-3">
                        <input ref={fileRef} type="file" accept="image/jpeg,image/png,.pdf,.doc,.docx" className="hidden" onChange={(e) => { const picked = e.target.files?.[0]; e.target.value = ''; if (!picked) return; const problem = fileProblem(picked, t); if (problem) toast.error(problem); else setFile(picked); }} />
                        <button onClick={() => fileRef.current?.click()} disabled={busy} aria-label={t.attach} title={t.attach} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"><Paperclip className="h-5 w-5" /></button>
                        <textarea
                          ref={boxRef}
                          aria-label={t.reply}
                          value={compose}
                          maxLength={5000}
                          onChange={(e) => { setCompose(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`; }}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                          placeholder={t.reply}
                          rows={1}
                          className="max-h-32 min-h-10 flex-1 resize-none rounded-2xl border border-border bg-muted/40 px-4 py-2.5 text-sm leading-relaxed outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                        />
                        <button onClick={send} disabled={busy || (!compose.trim() && !file)} aria-label={t.send} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 disabled:opacity-40">
                          {busy ? <CircleNotch className="h-4 w-4 animate-spin" /> : <PaperPlaneTilt className="h-4 w-4" weight="fill" />}
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-2.5 pt-1.5">
                        <p className="hidden text-[11px] text-muted-foreground sm:block">{t.hint}</p>
                        {selected.turn !== 'solved' && (
                          <p className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">{t.fixed} <button onClick={solve} disabled={busy} className="font-bold text-primary hover:underline">{t.markSolved}</button></p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {asking !== null && (
        <AskForm
          t={t}
          topic={asking}
          onClose={() => setAsking(null)}
          onCreated={(ticket) => { setAsking(null); toast.success(t.sent); setTickets((prev) => [ticket, ...(prev ?? [])]); setSelectedId(ticket.id); load(); }}
        />
      )}
    </div>
  );
}
