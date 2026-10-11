'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Skeleton } from '@mjn/ui';
import {
  PaperPlaneTilt, ChatCircle, ArrowDown, CheckCircle, Check, Paperclip, X, FileText, CircleNotch,
  CalendarBlank, Headset, Info,
} from '@mjn/ui';
import { api } from '../../../lib/api';
import { useUser } from '../../../contexts/user-context';

// ── Wording (the page follows the client's preferred language) ────────────────

type Locale = 'en' | 'fr';

const TEXT = {
  en: {
    title: 'Messages',
    teamFallback: 'MJN Healthcare team',
    consultant: 'Consultant',
    officer: 'Processing officer',
    replies: 'Usually replies within one working day',
    today: 'Today',
    yesterday: 'Yesterday',
    update: 'Update on your case',
    yourTeam: 'Your team',
    emptyTitle: 'Start the conversation',
    emptyBody: 'Ask about your case, your documents or what happens next.',
    suggestions: ['What is the status of my case?', 'I have uploaded the documents you asked for.', 'Can we schedule a call?'],
    newMessages: 'New messages',
    toBottom: 'Go to the latest message',
    placeholder: 'Write a message…',
    hint: 'Enter to send · Shift+Enter for a new line · PDF, JPG, PNG or Word, up to 20 MB',
    attach: 'Attach a file or photo',
    send: 'Send',
    removeFile: 'Remove file',
    tooBig: 'That file is larger than 20 MB.',
    badType: 'Only PDF, JPG, PNG and Word files can be sent.',
    uploadFailed: 'The file could not be uploaded. Please try again.',
    sendFailed: 'Your message was not sent. Please try again.',
    openFailed: 'The file could not be opened. Please try again.',
    open: 'Open',
    team: 'Your team',
    noTeam: 'A consultant will be assigned to you shortly. You can still write here.',
    bookCall: 'Book a call',
    files: 'Shared files',
    noFiles: 'Files sent in this conversation appear here.',
    you: 'You',
    help: 'Need something else?',
    helpBody: 'For a problem with the portal or a payment, our support team is faster.',
    helpCta: 'Get help',
    details: 'Team and shared files',
    close: 'Close',
    closed: 'This case is closed, so this conversation is read-only. If you need us, use Get help.',
    noCaseTitle: 'Messages open once your case starts',
    noCaseBody: 'After your first consultation you can write to your consultant here. Until then, reach us through Get help.',
    loadFailed: 'Messages could not be loaded. Check your connection.',
  },
  fr: {
    title: 'Messages',
    teamFallback: 'Équipe MJN Healthcare',
    consultant: 'Consultant',
    officer: 'Agent de traitement',
    replies: 'Répond généralement sous un jour ouvré',
    today: 'Aujourd’hui',
    yesterday: 'Hier',
    update: 'Nouvelle de votre dossier',
    yourTeam: 'Votre équipe',
    emptyTitle: 'Commencez la conversation',
    emptyBody: 'Posez vos questions sur votre dossier, vos documents ou la suite.',
    suggestions: ['Où en est mon dossier ?', 'J’ai déposé les documents demandés.', 'Pouvons-nous prévoir un appel ?'],
    newMessages: 'Nouveaux messages',
    toBottom: 'Aller au dernier message',
    placeholder: 'Écrivez un message…',
    hint: 'Entrée pour envoyer · Maj+Entrée pour aller à la ligne · PDF, JPG, PNG ou Word, 20 Mo maximum',
    attach: 'Joindre un fichier ou une photo',
    send: 'Envoyer',
    removeFile: 'Retirer le fichier',
    tooBig: 'Ce fichier dépasse 20 Mo.',
    badType: 'Seuls les fichiers PDF, JPG, PNG et Word peuvent être envoyés.',
    uploadFailed: 'Le fichier n’a pas pu être envoyé. Veuillez réessayer.',
    sendFailed: 'Votre message n’a pas été envoyé. Veuillez réessayer.',
    openFailed: 'Le fichier n’a pas pu être ouvert. Veuillez réessayer.',
    open: 'Ouvrir',
    team: 'Votre équipe',
    noTeam: 'Un consultant vous sera attribué très bientôt. Vous pouvez déjà écrire ici.',
    bookCall: 'Réserver un appel',
    files: 'Fichiers partagés',
    noFiles: 'Les fichiers envoyés dans cette conversation apparaissent ici.',
    you: 'Vous',
    help: 'Besoin d’autre chose ?',
    helpBody: 'Pour un problème avec le portail ou un paiement, notre équipe d’assistance répond plus vite.',
    helpCta: 'Obtenir de l’aide',
    details: 'Équipe et fichiers partagés',
    close: 'Fermer',
    closed: 'Ce dossier est clôturé : cette conversation est en lecture seule. Si vous avez besoin de nous, utilisez « Obtenir de l’aide ».',
    noCaseTitle: 'Les messages s’ouvrent au démarrage de votre dossier',
    noCaseBody: 'Après votre première consultation, vous pourrez écrire à votre consultant ici. D’ici là, contactez-nous via « Obtenir de l’aide ».',
    loadFailed: 'Les messages n’ont pas pu être chargés. Vérifiez votre connexion.',
  },
};
type Text = (typeof TEXT)['en'];

// ── Helpers ───────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_EXT = /\.(pdf|jpe?g|png|docx?)$/i;

const card = 'rounded-2xl border border-border bg-white shadow-sm';
const heading = 'text-xs font-bold uppercase tracking-widest text-muted-foreground';
const btnOutline = 'inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted/60';

function initials(name?: string | null) {
  return (name ?? '').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'M';
}
function sameDay(a: string | Date, b: string | Date) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}
function fileSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Older messages carried the file as a code inside the text. They still display. */
function parseLegacy(content: string): { text: string; name: string; url: string; isImage: boolean } {
  const m = content.match(/^([\s\S]*?)\n?\[(IMG|FILE)\]:([^:]+):([\s\S]+)$/);
  if (m) return { text: m[1].trim(), name: m[3], url: m[4].trim(), isImage: m[2] === 'IMG' };
  return { text: content, name: '', url: '', isImage: false };
}

async function openMessageFile(messageId: string, failed: string) {
  // Opened before the request so the browser does not treat it as a pop-up.
  const win = window.open('about:blank', '_blank');
  if (win) win.opener = null;
  try {
    const { url } = await api.getMessageAttachmentUrl(messageId);
    if (win) win.location.href = url; else window.location.href = url;
  } catch {
    win?.close();
    toast.error(failed);
  }
}

// ── A message's text and file ─────────────────────────────────────────────────

function Bubble({ msg, mine, t }: { msg: any; mine: boolean; t: Text }) {
  const legacy = parseLegacy(msg.content ?? '');
  const attachment = msg.attachment as { name: string; isImage: boolean } | null;
  const [thumb, setThumb] = useState('');

  useEffect(() => {
    let live = true;
    if (attachment?.isImage) api.getMessageAttachmentUrl(msg.id).then((r) => { if (live) setThumb(r.url); }).catch(() => {});
    return () => { live = false; };
  }, [msg.id, attachment?.isImage]);

  const chip = `flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors ${mine ? 'border-white/30 bg-white/10 text-white hover:bg-white/20' : 'border-border bg-muted/40 text-foreground hover:bg-muted'}`;
  const open = () => openMessageFile(msg.id, t.openFailed);

  return (
    <div className="space-y-2">
      {legacy.text && <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{legacy.text}</p>}

      {legacy.url && (legacy.isImage ? (
        <a href={legacy.url} target="_blank" rel="noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={legacy.url} alt={legacy.name} className="max-h-64 max-w-full rounded-xl object-cover" />
        </a>
      ) : (
        <a href={legacy.url} target="_blank" rel="noreferrer" className={chip}><FileText className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1 truncate">{legacy.name}</span></a>
      ))}

      {attachment && (attachment.isImage && thumb ? (
        <button onClick={open} className="block" aria-label={`${t.open} ${attachment.name}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumb} alt={attachment.name} className="max-h-64 max-w-full rounded-xl object-cover" />
        </button>
      ) : (
        <button onClick={open} className={chip}><FileText className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1 truncate">{attachment.name}</span></button>
      ))}
    </div>
  );
}

// ── Team, shared files and help (side panel on wide screens, sheet on a phone) ──

function Details({ team, files, meId, t, day }: { team: { name: string; role: string }[]; files: any[]; meId?: string; t: Text; day: (d: string) => string }) {
  return (
    <div className="space-y-4">
      <section className={`${card} p-5`}>
        <h2 className={`mb-3 ${heading}`}>{t.team}</h2>
        {team.length === 0 ? <p className="text-sm text-muted-foreground">{t.noTeam}</p> : (
          <ul className="space-y-3">
            {team.map((m) => (
              <li key={m.role} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{initials(m.name)}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-foreground">{m.name}</span>
                  <span className="block text-xs text-muted-foreground">{m.role}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/bookings" className={`${btnOutline} mt-4 w-full`}><CalendarBlank className="h-3.5 w-3.5" /> {t.bookCall}</Link>
      </section>

      <section className={`${card} p-5`}>
        <h2 className={`mb-2 flex items-center justify-between ${heading}`}>{t.files}{files.length > 0 && <span>{files.length}</span>}</h2>
        {files.length === 0 ? <p className="text-sm text-muted-foreground">{t.noFiles}</p> : (
          <ul className="divide-y divide-border/70">
            {files.slice(0, 12).map((m) => (
              <li key={m.id}>
                <button onClick={() => openMessageFile(m.id, t.openFailed)} className="flex w-full items-center gap-2.5 py-2.5 text-left hover:text-primary">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">{m.attachment.name}</span>
                    <span className="block text-xs text-muted-foreground">{m.senderId === meId ? t.you : m.sender?.name ?? t.yourTeam} · {day(m.createdAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={`${card} p-5`}>
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground"><Headset className="h-4 w-4 text-primary" /> {t.help}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.helpBody}</p>
        <Link href="/tickets" className={`${btnOutline} mt-3 w-full`}>{t.helpCta}</Link>
      </section>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { engagement, me, loading: userLoading } = useUser();
  const locale: Locale = me?.locale === 'fr' ? 'fr' : 'en';
  const t = TEXT[locale];
  const dateLocale = locale === 'fr' ? 'fr-FR' : 'en-US';
  const day = (d: string) => new Date(d).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' });
  const time = (d: string) => new Date(d).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' });

  const [messages, setMessages] = useState<any[]>([]);
  const [caseView, setCaseView] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const [newBanner, setNewBanner] = useState(false);
  const [sheet, setSheet] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const seen = useRef(0);
  const bottomState = useRef(true);
  bottomState.current = atBottom;

  const eid: string | undefined = engagement?.id;
  const meId: string | undefined = me?.id;
  const toBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  const load = useCallback(async (silent = false) => {
    if (!eid) { setLoading(false); return; }
    try {
      const list = (await api.getMessages(eid)) ?? [];
      const arrived = list.length > seen.current;
      const fromTeam = arrived && list.slice(seen.current).some((m: any) => m.senderId !== meId);
      seen.current = list.length;
      setMessages(list);
      setFailed(false);
      // Whatever is on screen has been seen, including messages that arrive while the page is open.
      if (!silent || fromTeam) api.markMessagesRead(eid).catch(() => {});
      if (!silent) setTimeout(toBottom, 100);
      else if (arrived) { if (bottomState.current) setTimeout(toBottom, 50); else setNewBanner(true); }
    } catch {
      if (!silent) setFailed(true);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [eid, meId]);

  useEffect(() => {
    seen.current = 0;
    load();
    if (!eid) return;
    api.getCaseView(eid).then(setCaseView).catch(() => {});
    const timer = setInterval(() => load(true), 20_000);
    return () => clearInterval(timer);
  }, [eid, load]);

  function onScroll() {
    const el = listRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAtBottom(near);
    if (near) setNewBanner(false);
  }

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    e.target.value = '';
    if (!picked) return;
    if (picked.size > MAX_FILE_SIZE) { toast.error(t.tooBig); return; }
    if (!ALLOWED_EXT.test(picked.name)) { toast.error(t.badType); return; }
    setFile(picked);
  }

  async function send(text?: string) {
    const body = (text ?? content).trim();
    if ((!body && !file) || !eid || busy) return;
    setBusy(true);
    try {
      let attachment: { key: string; name: string; type?: string } | undefined;
      if (file) {
        try {
          const { url, key } = await api.getMessageUploadUrl(eid, file.name);
          const put = await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'application/octet-stream' } });
          if (!put.ok) throw new Error('upload');
          attachment = { key, name: file.name, type: file.type };
        } catch {
          toast.error(t.uploadFailed);
          return;
        }
      }
      const msg = await api.sendMessage(eid, body, attachment);
      seen.current += 1;
      setMessages((prev) => [...prev, msg]);
      setContent('');
      setFile(null);
      if (boxRef.current) boxRef.current.style.height = 'auto';
      setTimeout(toBottom, 50);
    } catch (e: any) {
      toast.error(e?.message && e.message !== 'Unauthorised' ? e.message : t.sendFailed);
    } finally {
      setBusy(false);
    }
  }

  // Messages and the team's case updates, in one timeline.
  const timeline = useMemo(() => {
    const updates = ((caseView?.updates ?? []) as any[]).map((u) => ({ kind: 'update' as const, id: `u${u.id}`, at: u.at as string, update: u }));
    const msgs = messages.map((m) => ({ kind: 'message' as const, id: m.id as string, at: m.createdAt as string, msg: m }));
    return [...msgs, ...updates].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }, [messages, caseView]);

  const team = [
    caseView?.team?.consultant && { name: caseView.team.consultant.name as string, role: t.consultant },
    caseView?.team?.officer && { name: caseView.team.officer.name as string, role: t.officer },
  ].filter(Boolean) as { name: string; role: string }[];
  const files = useMemo(() => messages.filter((m) => m.attachment).reverse(), [messages]);
  const closed = engagement?.status === 'COMPLETED' || engagement?.status === 'TERMINATED';
  const dayLabel = (d: string) => {
    if (sameDay(d, new Date())) return t.today;
    if (sameDay(d, new Date(Date.now() - 86400000))) return t.yesterday;
    return new Date(d).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (userLoading || loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-40 rounded-xl" />
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!eid) {
    return (
      <div className="space-y-4">
        <h1 data-tour="page-title" className="text-2xl font-bold tracking-tight text-foreground">{t.title}</h1>
        <div className={`${card} flex flex-col items-center px-6 py-14 text-center`}>
          <ChatCircle className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <h2 className="font-bold text-foreground">{t.noCaseTitle}</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t.noCaseBody}</p>
          <Link href="/tickets" className={`${btnOutline} mt-4`}><Headset className="h-3.5 w-3.5" /> {t.helpCta}</Link>
        </div>
      </div>
    );
  }

  const details = <Details team={team} files={files} meId={meId} t={t} day={day} />;

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col">
      <h1 data-tour="page-title" className="shrink-0 pb-3 text-2xl font-bold tracking-tight text-foreground">{t.title}</h1>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
        {/* Conversation */}
        <div className={`${card} relative flex min-h-0 flex-col overflow-hidden`}>
          {/* Who the client is talking to */}
          <div data-tour="msg-header" className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
            <div className="flex shrink-0 -space-x-2">
              {(team.length ? team : [{ name: 'MJN', role: '' }]).map((m) => (
                <span key={m.role || m.name} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-primary text-xs font-bold text-white">{initials(m.name)}</span>
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">{team.length ? team.map((m) => m.name).join(', ') : t.teamFallback}</p>
              <p className="truncate text-xs text-muted-foreground">{t.replies}</p>
            </div>
            <button onClick={() => setSheet(true)} aria-label={t.details} title={t.details} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground xl:hidden">
              <Info className="h-5 w-5" />
            </button>
          </div>

          {/* Timeline */}
          <div ref={listRef} onScroll={onScroll} data-tour="msg-thread" className="min-h-0 flex-1 overflow-y-auto bg-muted/40 px-4 py-4">
            {failed && <p className="mb-3 rounded-xl bg-white px-4 py-3 text-center text-sm text-muted-foreground">{t.loadFailed}</p>}

            {timeline.length === 0 && !failed ? (
              <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                <ChatCircle className="mb-3 h-10 w-10 text-primary/40" weight="fill" />
                <p className="font-bold text-foreground">{t.emptyTitle}</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">{t.emptyBody}</p>
                {!closed && (
                  <div className="mt-4 flex max-w-md flex-wrap justify-center gap-2">
                    {t.suggestions.map((s) => (
                      <button key={s} onClick={() => { setContent(s); boxRef.current?.focus(); }} className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/40">{s}</button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {timeline.map((item, i) => {
                  const prev = timeline[i - 1];
                  const next = timeline[i + 1];
                  const newDay = !prev || !sameDay(prev.at, item.at);
                  const separator = newDay && (
                    <div className="my-3 flex justify-center">
                      <span className="rounded-full border border-border/60 bg-white px-3 py-1 text-xs font-medium text-muted-foreground">{dayLabel(item.at)}</span>
                    </div>
                  );

                  if (item.kind === 'update') {
                    const u = item.update;
                    return (
                      <div key={item.id}>
                        {separator}
                        <div className="flex items-end gap-1.5 py-1">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-white">{initials(u.authorName ?? 'MJN')}</span>
                          <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-primary/20 bg-white px-3.5 py-2.5">
                            <p className="text-xs font-bold uppercase tracking-wide text-primary">{t.update}</p>
                            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">{u.content}</p>
                            <p className="mt-1 text-[11px] text-muted-foreground">{u.authorName ?? t.yourTeam} · {time(item.at)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const msg = item.msg;
                  const mine = msg.senderId === meId;
                  const last = !next || next.kind !== 'message' || next.msg.senderId !== msg.senderId || !sameDay(next.at, item.at);
                  return (
                    <div key={item.id}>
                      {separator}
                      <div className={`flex items-end gap-1.5 ${mine ? 'flex-row-reverse' : ''}`}>
                        {!mine && (
                          <span className="h-7 w-7 shrink-0">
                            {last && <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-bold text-white">{initials(msg.sender?.name ?? 'MJN')}</span>}
                          </span>
                        )}
                        <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 ${mine ? 'rounded-br-sm bg-primary text-white' : 'rounded-bl-sm border border-border/60 bg-white text-foreground'}`}>
                          <Bubble msg={msg} mine={mine} t={t} />
                          {last && (
                            <p className={`mt-1 flex items-center gap-1 text-[11px] ${mine ? 'justify-end text-white/60' : 'text-muted-foreground'}`}>
                              {!mine && msg.sender?.name ? `${msg.sender.name} · ` : ''}{time(msg.createdAt)}
                              {mine && (msg.readAt ? <CheckCircle className="h-3 w-3" weight="fill" /> : <Check className="h-3 w-3" />)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {(newBanner || !atBottom) && timeline.length > 0 && (
            <button
              onClick={() => { toBottom(); setNewBanner(false); }}
              aria-label={t.toBottom}
              className={`absolute bottom-28 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold shadow-lg ${newBanner ? 'bg-primary text-white' : 'border border-border bg-white text-foreground'}`}
            >
              <ArrowDown className="h-3.5 w-3.5" /> {newBanner ? t.newMessages : ''}
            </button>
          )}

          {/* Compose */}
          {closed ? (
            <p className="shrink-0 border-t border-border bg-white px-4 py-3.5 text-sm text-muted-foreground">{t.closed} <Link href="/tickets" className="font-bold text-primary hover:underline">{t.helpCta}</Link></p>
          ) : (
            <div data-tour="msg-compose" className="shrink-0 border-t border-border bg-white">
              {file && (
                <div className="flex items-center gap-2.5 border-b border-border/70 px-4 py-2.5">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{file.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{fileSize(file.size)}</span>
                  {!busy && <button onClick={() => setFile(null)} aria-label={t.removeFile} className="rounded-lg p-1 text-muted-foreground hover:bg-muted/60"><X className="h-4 w-4" /></button>}
                </div>
              )}
              <div className="flex items-end gap-2 px-3 pt-3">
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,.pdf,.doc,.docx" className="hidden" onChange={pickFile} />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} aria-label={t.attach} title={t.attach} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40">
                  <Paperclip className="h-5 w-5" />
                </button>
                <textarea
                  ref={boxRef}
                  aria-label={t.placeholder}
                  value={content}
                  maxLength={5000}
                  onChange={(e) => { setContent(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`; }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder={t.placeholder}
                  rows={1}
                  className="max-h-32 min-h-10 flex-1 resize-none rounded-2xl border border-border bg-muted/40 px-4 py-2.5 text-sm leading-relaxed outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                />
                <button onClick={() => send()} disabled={busy || (!content.trim() && !file)} aria-label={t.send} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 disabled:opacity-40">
                  {busy ? <CircleNotch className="h-4 w-4 animate-spin" /> : <PaperPlaneTilt className="h-4 w-4" weight="fill" />}
                </button>
              </div>
              <p className="hidden px-4 pb-2 pt-1.5 text-[11px] text-muted-foreground sm:block">{t.hint}</p>
              <div className="h-3 sm:hidden" />
            </div>
          )}
        </div>

        {/* Side panel on wide screens */}
        <aside data-tour="msg-side" className="hidden min-h-0 overflow-y-auto xl:block">{details}</aside>
      </div>

      {/* The same details as a sheet on smaller screens */}
      {sheet && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center sm:p-4 xl:hidden" onClick={() => setSheet(false)}>
          <div role="dialog" aria-modal="true" aria-label={t.details} className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-muted p-4 sm:max-w-md sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">{t.details}</p>
              <button onClick={() => setSheet(false)} aria-label={t.close} className="rounded-lg p-1.5 text-muted-foreground hover:bg-white"><X className="h-5 w-5" /></button>
            </div>
            {details}
          </div>
        </div>
      )}
    </div>
  );
}
