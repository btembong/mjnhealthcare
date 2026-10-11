'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Skeleton } from '@mjn/ui';
import {
  FileText, CalendarBlank, CheckCircle, Check, UploadSimple, Signature, ChatText, CreditCard,
  Copy, Buildings, ArrowRight, Warning, Headset, DownloadSimple, X,
} from '@mjn/ui';
import { toast } from 'sonner';
import { useUser } from '../../../contexts/user-context';
import { api } from '../../../lib/api';

// ── Wording (the page follows the client's preferred language) ────────────────

type Locale = 'en' | 'fr';

const TEXT = {
  en: {
    title: 'My case',
    copied: 'Case reference copied.',
    copyRef: 'Copy case reference',
    messageTeam: 'Message team',
    switchCase: 'Case',
    status: { PENDING_SIGNATURE: 'Awaiting your signature', ACTIVE: 'Active', ON_HOLD: 'On hold', COMPLETED: 'Completed', TERMINATED: 'Closed' } as Record<string, string>,
    hold: 'Your case is paused. Message your team to find out what is needed to continue.',
    noCaseTitle: 'Your case starts after your first consultation',
    noCaseBody: 'Once your consultant opens your case, you will follow every step of it here.',
    book: 'Book a consultation',
    loadFailed: 'Your case could not be loaded. Check your connection and reload the page.',
    journey: 'Your journey',
    stageOf: (a: number, b: number) => `Stage ${a} of ${b}`,
    allDone: 'All stages complete',
    youAreHere: 'You are here',
    since: 'since',
    noStages: 'Your consultant is setting up the stages of your case. They will appear here.',
    signFirst: 'Your journey starts once your engagement letter is signed.',
    todo: 'What you need to do',
    nothingTodo: 'Nothing is needed from you right now.',
    caseComplete: 'Your case is complete.',
    tasks: {
      letter: { title: 'Sign your engagement letter', detail: 'Your case cannot start, and no payment can be taken, until it is signed.', cta: 'Sign now' },
      replace: { title: (d: string) => `Replace your ${d}`, detail: (r: string | null) => (r ? `Not accepted: “${r}”` : 'It was not accepted. Please upload a new copy.'), cta: 'Re-upload' },
      form: { title: (d: string) => `Complete and return: ${d}`, detail: (n: string | null) => n ?? 'Your team sent you a form to fill in.', cta: 'Open form' },
      payment: { title: 'Payment due', detail: (a: string) => `${a} is due now.`, cta: 'Pay now' },
      upload: { title: (d: string) => `Upload your ${d}`, detail: 'Needed for your current stage.', cta: 'Upload' },
    },
    doing: 'What we are doing',
    doingNothingYet: 'Your team is preparing your file. Submissions to licensing bodies and updates will appear here.',
    submitted: 'Submitted',
    ref: 'Ref',
    latestUpdate: 'Latest update',
    seeAllUpdates: 'See all updates',
    sub: { SUBMITTED: 'Submitted', IN_REVIEW: 'In review', PENDING: 'In review', PENDING_DOCS: 'More documents requested', RESUBMITTED: 'Resubmitted', APPROVED: 'Approved', REJECTED: 'Not approved' } as Record<string, string>,
    tabs: { stages: 'Stages', updates: 'Updates', submissions: 'Submissions', history: 'History' },
    inProgress: 'in progress',
    stageNeeds: 'This stage needs',
    doc: { VERIFIED: 'Ready', PENDING: 'Being checked', REJECTED: 'To replace', NONE: 'Not uploaded' } as Record<string, string>,
    reupload: 'Re-upload',
    upload: 'Upload',
    noUpdates: 'No updates yet. Your team will post here as your case moves.',
    noSubmissions: 'Nothing has been submitted to a licensing body yet.',
    team: 'Your team',
    consultant: 'Consultant',
    officer: 'Processing officer',
    noTeam: 'A consultant will be assigned to you shortly.',
    message: 'Message',
    bookCall: 'Book a call',
    glance: 'At a glance',
    documents: 'Documents',
    docsReady: (a: number, b: number) => `${a} of ${b} ready`,
    payments: 'Payments',
    paidOf: (a: string, b: string) => `${a} of ${b} paid`,
    noOrders: 'No orders yet',
    letter: 'Engagement letter',
    signed: (d: string) => `Signed ${d}`,
    notSigned: 'Not signed',
    preparing: 'Being prepared',
    download: 'Download',
    downloadFailed: 'The letter could not be downloaded.',
    opened: 'Opened',
    askTitle: 'Ask about your case',
    askBody: 'Quick answers from your own case: what is needed, what is paid, what comes next.',
    askCta: 'Ask a question',
    hist: { opened: 'Case opened', letter: 'Engagement letter signed', stage: (l: string) => `Stage completed: ${l}`, doc: (l: string) => `You uploaded: ${l}`, sub: (p: string) => `Submitted to ${p}`, update: (n: string) => `Update from ${n}` },
    yourTeam: 'your team',
    bot: {
      name: 'Case assistant',
      sub: 'Answers from your own case data',
      thinking: 'Thinking…',
      welcome: (n: string) => `Hi${n ? ` ${n}` : ''}! I can answer questions about your case: documents needed, stages, payments, or what happens next. What would you like to know?`,
      quick: ['What documents do I still need?', 'What is my current case status?', 'Do I have any outstanding payments?', 'What happens next?'],
      placeholder: 'Ask about your case…',
      error: 'Sorry, something went wrong. Please try again.',
      note: 'For questions about eligibility or outcomes, message your consultant.',
      close: 'Close',
      send: 'Send',
    },
  },
  fr: {
    title: 'Mon dossier',
    copied: 'Référence du dossier copiée.',
    copyRef: 'Copier la référence du dossier',
    messageTeam: 'Écrire à mon équipe',
    switchCase: 'Dossier',
    status: { PENDING_SIGNATURE: 'En attente de votre signature', ACTIVE: 'Actif', ON_HOLD: 'En pause', COMPLETED: 'Terminé', TERMINATED: 'Clôturé' } as Record<string, string>,
    hold: 'Votre dossier est en pause. Écrivez à votre équipe pour savoir ce qu’il faut pour continuer.',
    noCaseTitle: 'Votre dossier commence après votre première consultation',
    noCaseBody: 'Dès que votre consultant ouvre votre dossier, vous en suivrez chaque étape ici.',
    book: 'Réserver une consultation',
    loadFailed: 'Votre dossier n’a pas pu être chargé. Vérifiez votre connexion et rechargez la page.',
    journey: 'Votre parcours',
    stageOf: (a: number, b: number) => `Étape ${a} sur ${b}`,
    allDone: 'Toutes les étapes sont terminées',
    youAreHere: 'Vous êtes ici',
    since: 'depuis le',
    noStages: 'Votre consultant prépare les étapes de votre dossier. Elles apparaîtront ici.',
    signFirst: 'Votre parcours commence dès que votre lettre d’engagement est signée.',
    todo: 'Ce que vous devez faire',
    nothingTodo: 'Rien n’est attendu de vous pour le moment.',
    caseComplete: 'Votre dossier est terminé.',
    tasks: {
      letter: { title: 'Signez votre lettre d’engagement', detail: 'Votre dossier ne peut pas démarrer, et aucun paiement ne peut être effectué, tant qu’elle n’est pas signée.', cta: 'Signer' },
      replace: { title: (d: string) => `Remplacez ce document : ${d}`, detail: (r: string | null) => (r ? `Non accepté : « ${r} »` : 'Il n’a pas été accepté. Merci d’en déposer une nouvelle copie.'), cta: 'Redéposer' },
      form: { title: (d: string) => `À remplir et à renvoyer : ${d}`, detail: (n: string | null) => n ?? 'Votre équipe vous a envoyé un formulaire à remplir.', cta: 'Ouvrir' },
      payment: { title: 'Paiement à effectuer', detail: (a: string) => `${a} à régler maintenant.`, cta: 'Payer' },
      upload: { title: (d: string) => `Déposez ce document : ${d}`, detail: 'Nécessaire pour votre étape actuelle.', cta: 'Déposer' },
    },
    doing: 'Ce que nous faisons',
    doingNothingYet: 'Votre équipe prépare votre dossier. Les dépôts auprès des organismes et les nouvelles apparaîtront ici.',
    submitted: 'Déposé le',
    ref: 'Réf.',
    latestUpdate: 'Dernière nouvelle',
    seeAllUpdates: 'Voir toutes les nouvelles',
    sub: { SUBMITTED: 'Déposé', IN_REVIEW: 'En cours d’examen', PENDING: 'En cours d’examen', PENDING_DOCS: 'Documents complémentaires demandés', RESUBMITTED: 'Déposé à nouveau', APPROVED: 'Approuvé', REJECTED: 'Non approuvé' } as Record<string, string>,
    tabs: { stages: 'Étapes', updates: 'Nouvelles', submissions: 'Dépôts', history: 'Historique' },
    inProgress: 'en cours',
    stageNeeds: 'Cette étape demande',
    doc: { VERIFIED: 'Prêt', PENDING: 'En vérification', REJECTED: 'À remplacer', NONE: 'Non déposé' } as Record<string, string>,
    reupload: 'Redéposer',
    upload: 'Déposer',
    noUpdates: 'Pas encore de nouvelles. Votre équipe publiera ici à mesure que votre dossier avance.',
    noSubmissions: 'Rien n’a encore été déposé auprès d’un organisme.',
    team: 'Votre équipe',
    consultant: 'Consultant',
    officer: 'Agent de traitement',
    noTeam: 'Un consultant vous sera attribué très bientôt.',
    message: 'Écrire',
    bookCall: 'Réserver un appel',
    glance: 'En bref',
    documents: 'Documents',
    docsReady: (a: number, b: number) => `${a} sur ${b} prêts`,
    payments: 'Paiements',
    paidOf: (a: string, b: string) => `${a} payés sur ${b}`,
    noOrders: 'Aucune commande',
    letter: 'Lettre d’engagement',
    signed: (d: string) => `Signée le ${d}`,
    notSigned: 'Non signée',
    preparing: 'En préparation',
    download: 'Télécharger',
    downloadFailed: 'La lettre n’a pas pu être téléchargée.',
    opened: 'Ouvert le',
    askTitle: 'Une question sur votre dossier ?',
    askBody: 'Des réponses rapides tirées de votre dossier : ce qui manque, ce qui est payé, la suite.',
    askCta: 'Poser une question',
    hist: { opened: 'Dossier ouvert', letter: 'Lettre d’engagement signée', stage: (l: string) => `Étape terminée : ${l}`, doc: (l: string) => `Vous avez déposé : ${l}`, sub: (p: string) => `Déposé auprès de ${p}`, update: (n: string) => `Nouvelle de ${n}` },
    yourTeam: 'votre équipe',
    bot: {
      name: 'Assistant dossier',
      sub: 'Réponses tirées de votre dossier',
      thinking: 'Réflexion…',
      welcome: (n: string) => `Bonjour${n ? ` ${n}` : ''} ! Je peux répondre à vos questions sur votre dossier : documents à fournir, étapes, paiements ou la suite. Que souhaitez-vous savoir ?`,
      quick: ['Quels documents me manque-t-il ?', 'Où en est mon dossier ?', 'Ai-je des paiements en attente ?', 'Quelle est la suite ?'],
      placeholder: 'Votre question…',
      error: 'Désolé, une erreur est survenue. Veuillez réessayer.',
      note: 'Pour toute question d’admissibilité ou de résultat, écrivez à votre consultant.',
      close: 'Fermer',
      send: 'Envoyer',
    },
  },
};
type Text = (typeof TEXT)['en'];

// ── Helpers ───────────────────────────────────────────────────────────────────

const SUB_DOT: Record<string, string> = {
  APPROVED: 'bg-secondary', REJECTED: 'bg-rose-500', PENDING_DOCS: 'bg-accent',
};
const DOC_DOT: Record<string, string> = { VERIFIED: 'bg-secondary', PENDING: 'bg-primary/40', REJECTED: 'bg-rose-500' };
const STATUS_DOT: Record<string, string> = {
  PENDING_SIGNATURE: 'bg-accent', ACTIVE: 'bg-secondary', ON_HOLD: 'bg-muted-foreground/50', COMPLETED: 'bg-primary', TERMINATED: 'bg-muted-foreground/50',
};

function caseRef(id: string) {
  return `ENG-${id.slice(-6).toUpperCase()}`;
}
function docLabel(type?: string | null) {
  return (type ?? '').replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}
function money(n: number) {
  return `$${Number(n ?? 0).toLocaleString('en-US')}`;
}
function useDay(locale: Locale) {
  return (date?: string | Date | null) =>
    date ? new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}
function initials(name?: string | null) {
  return (name ?? '').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
}

const card = 'rounded-2xl border border-border bg-white shadow-sm';
const heading = 'text-xs font-bold uppercase tracking-widest text-muted-foreground';
const btnPrimary = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-40';
const btnOutline = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted/60 disabled:opacity-40';

function Dot({ className }: { className: string }) {
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${className}`} />;
}

// ── Journey line ──────────────────────────────────────────────────────────────

function Journey({ view, t, day }: { view: any; t: Text; day: (d?: string | Date | null) => string }) {
  const stages: any[] = view.stages ?? [];
  const { done, total, current, startedAt } = view.stage;
  const unsigned = !view.letter.signedAt;

  return (
    <section data-tour="case-pipeline" className={`${card} p-5`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className={heading}>{t.journey}</h2>
        {total > 0 && <span className="text-xs font-semibold text-muted-foreground">{current ? t.stageOf(done + 1, total) : t.allDone}</span>}
      </div>

      {total === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{unsigned ? t.signFirst : t.noStages}</p>
      ) : (
        <>
          {/* Phone: one bar */}
          <div className="mt-3 flex gap-1 md:hidden">
            {stages.map((s, i) => (
              <div key={s.id} className={`h-2 flex-1 rounded-full ${s.completedAt ? 'bg-secondary' : i === done ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>

          {/* Wider screens: every stage by name */}
          <ol className={`mt-4 hidden md:grid ${unsigned ? 'opacity-50' : ''}`} style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
            {stages.map((s, i) => {
              const isDone = !!s.completedAt;
              const isCurrent = i === done;
              return (
                <li key={s.id} className="relative flex flex-col items-center px-1 text-center" aria-current={isCurrent ? 'step' : undefined}>
                  {i > 0 && <span className={`absolute right-1/2 top-2.5 h-0.5 w-full -translate-y-1/2 ${isDone || isCurrent ? 'bg-secondary' : 'bg-border'}`} />}
                  <span className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full ${isDone ? 'bg-secondary text-white' : isCurrent ? 'bg-primary ring-4 ring-primary/15' : 'border-2 border-border bg-white'}`}>
                    {isDone && <Check className="h-3 w-3" />}
                  </span>
                  <span title={s.label} className={`mt-2 line-clamp-2 text-xs leading-tight ${isCurrent ? 'font-bold text-foreground' : isDone ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
                </li>
              );
            })}
          </ol>

          {current && (
            <p className="mt-4 text-sm text-foreground">
              <span className="text-muted-foreground">{t.youAreHere}: </span>
              <span className="font-bold">{current}</span>
              {startedAt && !unsigned && <span className="text-muted-foreground"> · {t.since} {day(startedAt)}</span>}
            </p>
          )}
        </>
      )}
    </section>
  );
}

// ── Case assistant ────────────────────────────────────────────────────────────

type BotMsg = { role: 'user' | 'assistant'; content: string };

function CaseAssistant({ personId, engagementId, name, t, onClose }: { personId: string; engagementId: string; name?: string; t: Text; onClose: () => void }) {
  const b = t.bot;
  const [messages, setMessages] = useState<BotMsg[]>([{ role: 'assistant', content: b.welcome((name ?? '').split(' ')[0] ?? '') }]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getCaseConversation(personId).then((h) => { if (h && h.length > 0) setMessages(h); }).catch(() => {});
  }, [personId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages, sending]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    const next: BotMsg[] = [...messages, { role: 'user', content: msg }];
    setMessages(next);
    setInput('');
    setSending(true);
    try {
      const res = await api.caseChat(engagementId, personId, next);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.content || b.error }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: b.error }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 flex max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[400px]" role="dialog" aria-label={b.name}>
      <div className="flex shrink-0 items-center gap-3 bg-primary px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15"><Headset weight="fill" className="h-4 w-4 text-white" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-tight text-white">{b.name}</p>
          <p className="text-xs text-white/70">{sending ? b.thinking : b.sub}</p>
        </div>
        <button onClick={onClose} aria-label={b.close} className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted/40 p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === 'user' ? 'rounded-br-sm bg-primary text-white' : 'rounded-bl-sm border border-border/60 bg-white text-foreground'}`}>{m.content}</div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="flex gap-1.5 rounded-2xl rounded-bl-sm border border-border/60 bg-white px-4 py-3">
              {[0, 150, 300].map((d) => <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-primary/40" style={{ animationDelay: `${d}ms` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length === 1 && (
        <div className="flex shrink-0 flex-wrap gap-1.5 border-t border-border bg-white px-3 py-2.5">
          {b.quick.map((q) => (
            <button key={q} onClick={() => send(q)} className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-muted/60">{q}</button>
          ))}
        </div>
      )}

      <div className="shrink-0 border-t border-border bg-white px-3 pb-2 pt-3">
        <div className="flex gap-2">
          <input
            aria-label={b.placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={b.placeholder}
            disabled={sending}
            className="h-10 flex-1 rounded-full border border-border bg-muted/30 px-4 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 disabled:opacity-60"
          />
          <button onClick={() => send()} disabled={!input.trim() || sending} aria-label={b.send} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 disabled:opacity-40">
            <ArrowRight weight="bold" className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">{b.note}</p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS = ['stages', 'updates', 'submissions', 'history'] as const;
type Tab = (typeof TABS)[number];

export default function CasePage() {
  const { engagement, allEngagements, switchEngagement, documents, loading, me } = useUser();
  const locale: Locale = me?.locale === 'fr' ? 'fr' : 'en';
  const t = TEXT[locale];
  const day = useDay(locale);

  const [view, setView] = useState<any>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<Tab>('stages');
  const [assistant, setAssistant] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const eid: string | undefined = engagement?.id;

  const load = useCallback(() => {
    if (!eid) return;
    setFailed(false);
    api.getCaseView(eid).then(setView).catch(() => setFailed(true));
  }, [eid]);

  useEffect(() => { setView(null); load(); }, [load]);

  if (loading || (eid && !view && !failed)) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="space-y-4"><Skeleton className="h-40 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!engagement) {
    return (
      <div className="space-y-4">
        <h1 data-tour="case-title" className="text-xl font-bold text-foreground">{t.title}</h1>
        <div className={`${card} p-10 text-center`}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50"><Buildings className="h-7 w-7 text-muted-foreground" /></div>
          <h2 className="font-bold text-foreground">{t.noCaseTitle}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{t.noCaseBody}</p>
          <Link href="/bookings" className={`${btnPrimary} mt-5`}><CalendarBlank className="h-4 w-4" /> {t.book}</Link>
        </div>
      </div>
    );
  }

  if (failed || !view) {
    return (
      <div className="space-y-4">
        <h1 data-tour="case-title" className="text-xl font-bold text-foreground">{t.title}</h1>
        <div className={`${card} p-10 text-center text-sm text-muted-foreground`}>{t.loadFailed}</div>
      </div>
    );
  }

  const closed = view.status === 'COMPLETED' || view.status === 'TERMINATED';
  const tasks: any[] = view.tasks ?? [];
  const submissions: any[] = view.submissions ?? [];
  const updates: any[] = view.updates ?? [];
  const stages: any[] = view.stages ?? [];
  const required: any[] = view.requiredDocs ?? [];
  const latestSubmission = submissions[0];
  const latestUpdate = updates[0];
  const team = [
    view.team.consultant && { ...view.team.consultant, role: t.consultant },
    view.team.officer && { ...view.team.officer, role: t.officer },
  ].filter(Boolean) as { name: string; role: string }[];

  function taskRow(task: any): { icon: any; title: string; detail: string; cta: string; href: string } {
    const k = t.tasks;
    switch (task.key) {
      case 'letter': return { icon: Signature, title: k.letter.title, detail: k.letter.detail, cta: k.letter.cta, href: `/sign/${view.id}` };
      case 'replace': return { icon: Warning, title: k.replace.title(docLabel(task.docType).toLowerCase()), detail: k.replace.detail(task.reason), cta: k.replace.cta, href: '/documents' };
      case 'form': return { icon: FileText, title: k.form.title(docLabel(task.docType)), detail: k.form.detail(task.note), cta: k.form.cta, href: '/documents' };
      case 'payment': return { icon: CreditCard, title: k.payment.title, detail: k.payment.detail(money(task.amount)), cta: k.payment.cta, href: '/payments' };
      default: return { icon: UploadSimple, title: k.upload.title(docLabel(task.docType).toLowerCase()), detail: k.upload.detail, cta: k.upload.cta, href: '/documents' };
    }
  }

  async function downloadLetter() {
    setDownloading(true);
    try { await api.downloadEngagementLetterPdf(view.id); } catch { toast.error(t.downloadFailed); } finally { setDownloading(false); }
  }

  type Entry = { id: string; at: Date; label: string; sub?: string };
  const history: Entry[] = [
    { id: 'opened', at: new Date(view.createdAt), label: t.hist.opened },
    ...(view.letter.signedAt ? [{ id: 'letter', at: new Date(view.letter.signedAt), label: t.hist.letter }] : []),
    ...stages.filter((s) => s.completedAt).map((s) => ({ id: `s${s.id}`, at: new Date(s.completedAt), label: t.hist.stage(s.label) })),
    ...(documents ?? []).filter((d: any) => d.origin !== 'OFFICER_SENT' && d.uploadedAt).map((d: any) => ({ id: `d${d.id}`, at: new Date(d.uploadedAt), label: t.hist.doc(docLabel(d.type)) })),
    ...submissions.map((s) => ({ id: `t${s.id}`, at: new Date(s.submittedAt ?? s.createdAt), label: t.hist.sub(s.portal) })),
    ...updates.map((u) => ({ id: `u${u.id}`, at: new Date(u.at), label: t.hist.update(u.authorName ?? t.yourTeam), sub: u.content })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  const subStatus = (s: string) => (
    <span className="inline-flex items-center gap-1.5 font-semibold text-foreground"><Dot className={SUB_DOT[s] ?? 'bg-primary/40'} /> {t.sub[s] ?? docLabel(s)}</span>
  );

  const tabCount: Partial<Record<Tab, number>> = { updates: updates.length, submissions: submissions.length };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div data-tour="case-title" className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground">{t.title}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {view.pathway && <span className="font-semibold text-foreground">{view.pathway.country}{view.pathway.regulatoryBody ? ` · ${view.pathway.regulatoryBody}` : ''}</span>}
            <button
              onClick={() => navigator.clipboard?.writeText(caseRef(view.id)).then(() => toast.success(t.copied)).catch(() => {})}
              aria-label={t.copyRef}
              className="inline-flex items-center gap-1.5 font-mono text-xs hover:text-foreground"
            >
              {caseRef(view.id)} <Copy className="h-3.5 w-3.5" />
            </button>
            <span className="inline-flex items-center gap-1.5 font-semibold text-foreground"><Dot className={STATUS_DOT[view.status] ?? 'bg-muted'} /> {t.status[view.status] ?? docLabel(view.status)}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {allEngagements.length > 1 && (
            <select
              aria-label={t.switchCase}
              value={view.id}
              onChange={(e) => { const next = allEngagements.find((x: any) => x.id === e.target.value); if (next) switchEngagement(next); }}
              className="h-9 rounded-xl border border-border bg-white px-3 text-xs font-semibold text-foreground outline-none focus:border-primary"
            >
              {allEngagements.map((x: any) => <option key={x.id} value={x.id}>{caseRef(x.id)} · {t.status[x.status] ?? x.status}</option>)}
            </select>
          )}
          <Link href="/messages" className={btnPrimary}><ChatText className="h-4 w-4" /> {t.messageTeam}</Link>
        </div>
      </div>

      {view.status === 'ON_HOLD' && (
        <div className={`${card} flex flex-wrap items-center justify-between gap-3 px-5 py-3.5`}>
          <p className="flex items-center gap-2.5 text-sm font-semibold text-foreground"><Dot className="bg-accent" /> {t.hold}</p>
          <Link href="/messages" className={btnOutline}>{t.message}</Link>
        </div>
      )}

      <Journey view={view} t={t} day={day} />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
        {/* Main column */}
        <div className="min-w-0 space-y-4">
          {/* What you need to do */}
          <section data-tour="case-todo" className={card}>
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
              <h2 className={heading}>{t.todo}</h2>
              {tasks.length > 0 && <span className="rounded-full bg-accent px-2 text-xs font-bold text-accent-foreground">{tasks.length}</span>}
            </div>
            {tasks.length === 0 ? (
              <p className="flex items-center gap-2 px-5 py-5 text-sm font-semibold text-foreground">
                <CheckCircle weight="fill" className="h-4 w-4 shrink-0 text-secondary" /> {view.status === 'COMPLETED' ? t.caseComplete : t.nothingTodo}
              </p>
            ) : (
              <ul className="divide-y divide-border/70">
                {tasks.map((task, i) => {
                  const row = taskRow(task);
                  return (
                    <li key={i} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-foreground"><row.icon className="h-4 w-4" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground">{row.title}</p>
                        <p className="text-sm text-muted-foreground">{row.detail}</p>
                      </div>
                      <Link href={row.href} className={i === 0 ? btnPrimary : btnOutline}>{row.cta}</Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* What we are doing */}
          <section data-tour="case-doing" className={card}>
            <div className="border-b border-border px-5 py-3.5"><h2 className={heading}>{t.doing}</h2></div>
            {!latestSubmission && !latestUpdate ? (
              <p className="px-5 py-5 text-sm text-muted-foreground">{closed ? t.caseComplete : t.doingNothingYet}</p>
            ) : (
              <div className="divide-y divide-border/70">
                {latestSubmission && (
                  <div className="px-5 py-4">
                    <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm">
                      <span className="font-bold text-foreground">{latestSubmission.portal}</span>
                      {subStatus(latestSubmission.status)}
                      {latestSubmission.referenceNumber && <span className="select-all font-mono text-xs text-muted-foreground">{t.ref} {latestSubmission.referenceNumber}</span>}
                    </p>
                    {latestSubmission.submittedAt && <p className="mt-1 text-xs text-muted-foreground">{t.submitted} {day(latestSubmission.submittedAt)}</p>}
                  </div>
                )}
                {latestUpdate && (
                  <div className="px-5 py-4">
                    <p className="text-xs text-muted-foreground"><span className="font-bold uppercase tracking-wide">{t.latestUpdate}</span> · {latestUpdate.authorName ?? t.yourTeam} · {day(latestUpdate.at)}</p>
                    <p className="mt-1.5 line-clamp-4 whitespace-pre-wrap text-sm text-foreground">{latestUpdate.content}</p>
                    {updates.length > 1 && <button onClick={() => setTab('updates')} className="mt-2 text-xs font-bold text-primary hover:underline">{t.seeAllUpdates} ({updates.length})</button>}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Details */}
          <section data-tour="case-tabs" className={`${card} overflow-hidden`}>
            <div className="flex gap-1 overflow-x-auto border-b border-border px-2">
              {TABS.map((key) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-3.5 py-3 text-sm font-semibold transition-colors ${tab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                  {t.tabs[key]}{tabCount[key] ? <span className="ml-1.5 text-xs text-muted-foreground">{tabCount[key]}</span> : null}
                </button>
              ))}
            </div>

            {tab === 'stages' && (
              <div className="p-5">
                {stages.length === 0 ? <p className="text-sm text-muted-foreground">{t.noStages}</p> : (
                  <ol className="divide-y divide-border/70">
                    {stages.map((s, i) => {
                      const isDone = !!s.completedAt;
                      const isCurrent = i === view.stage.done;
                      return (
                        <li key={s.id} className="py-3">
                          <div className="flex items-center gap-3">
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${isDone ? 'bg-secondary text-white' : isCurrent ? 'bg-primary' : 'border-2 border-border'}`}>{isDone && <Check className="h-3 w-3" />}</span>
                            <span className={`min-w-0 flex-1 text-sm ${isCurrent ? 'font-bold text-foreground' : isDone ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
                            <span className="shrink-0 text-xs text-muted-foreground">{isDone ? day(s.completedAt) : isCurrent && !closed ? t.inProgress : ''}</span>
                          </div>
                          {isCurrent && !closed && required.length > 0 && (
                            <div className="ml-8 mt-3 rounded-xl bg-muted/40 px-4 py-3">
                              <p className={`mb-2 ${heading}`}>{t.stageNeeds}</p>
                              <ul className="space-y-2">
                                {required.map((r) => (
                                  <li key={r.type} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                                    <Dot className={r.status ? DOC_DOT[r.status] : 'border border-muted-foreground/50'} />
                                    <span className="min-w-0 flex-1 text-foreground">{docLabel(r.type)}</span>
                                    <span className="text-xs text-muted-foreground">{t.doc[r.status ?? 'NONE']}</span>
                                    {(!r.status || r.status === 'REJECTED') && <Link href="/documents" className={btnOutline}>{r.status ? t.reupload : t.upload}</Link>}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            )}

            {tab === 'updates' && (
              <div className="p-5">
                {updates.length === 0 ? <p className="text-sm text-muted-foreground">{t.noUpdates}</p> : (
                  <ol className="space-y-5">
                    {updates.map((u) => (
                      <li key={u.id} className="flex gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{initials(u.authorName ?? 'MJN')}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground"><span className="font-bold text-foreground">{u.authorName ?? 'MJN Healthcare'}</span> · {day(u.at)}</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{u.content}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}

            {tab === 'submissions' && (
              <div>
                {submissions.length === 0 ? <p className="p-5 text-sm text-muted-foreground">{t.noSubmissions}</p> : (
                  <ul className="divide-y divide-border/70">
                    {submissions.map((s) => (
                      <li key={s.id} className="px-5 py-4">
                        <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm">
                          <span className="font-bold text-foreground">{s.portal}</span>
                          {subStatus(s.status)}
                        </p>
                        <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                          {s.submittedAt && <span>{t.submitted} {day(s.submittedAt)}</span>}
                          {s.referenceNumber && <span className="select-all font-mono">{t.ref} {s.referenceNumber}</span>}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {tab === 'history' && (
              <ol className="space-y-4 p-5">
                {history.map((e) => (
                  <li key={e.id} className="flex gap-3">
                    <Dot className="mt-1.5 bg-primary/40" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{e.label}</p>
                      {e.sub && <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{e.sub}</p>}
                      <p className="mt-0.5 text-xs text-muted-foreground">{day(e.at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        {/* Side panel */}
        <aside className="space-y-4">
          <section data-tour="case-team" className={`${card} p-5`}>
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
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href="/messages" className={btnPrimary}><ChatText className="h-3.5 w-3.5" /> {t.message}</Link>
              <Link href="/bookings" className={btnOutline}><CalendarBlank className="h-3.5 w-3.5" /> {t.bookCall}</Link>
            </div>
          </section>

          <section data-tour="case-glance" className={`${card} p-5`}>
            <h2 className={`mb-2 ${heading}`}>{t.glance}</h2>
            <dl className="divide-y divide-border/70 text-sm">
              <Link href="/documents" className="flex items-center justify-between gap-3 py-2.5 hover:text-primary">
                <dt className="text-muted-foreground">{t.documents}</dt>
                <dd className="flex items-center gap-1.5 font-semibold text-foreground">{view.documents.rejected > 0 && <Dot className="bg-rose-500" />}{t.docsReady(view.documents.verified, view.documents.total)}</dd>
              </Link>
              <Link href="/payments" className="flex items-center justify-between gap-3 py-2.5 hover:text-primary">
                <dt className="text-muted-foreground">{t.payments}</dt>
                <dd className="flex items-center gap-1.5 text-right font-semibold text-foreground">{view.payments.due > 0 && <Dot className="bg-accent" />}{view.payments.total > 0 ? t.paidOf(money(view.payments.paid), money(view.payments.total)) : t.noOrders}</dd>
              </Link>
              <div data-tour="case-letter" className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-muted-foreground">{t.letter}</dt>
                <dd className="flex flex-col items-end gap-1.5 text-right font-semibold text-foreground">
                  {view.letter.signedAt ? t.signed(day(view.letter.signedAt)) : view.letter.ready ? t.notSigned : t.preparing}
                  {view.letter.signedAt
                    ? <button onClick={downloadLetter} disabled={downloading} className={btnOutline}><DownloadSimple className="h-3.5 w-3.5" /> {t.download}</button>
                    : view.letter.ready && !closed ? <Link href={`/sign/${view.id}`} className={btnOutline}><Signature className="h-3.5 w-3.5" /> {t.tasks.letter.cta}</Link> : null}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-muted-foreground">{t.opened}</dt>
                <dd className="font-semibold text-foreground">{day(view.createdAt)}</dd>
              </div>
            </dl>
          </section>

          {me?.id && (
            <section className={`${card} p-5`}>
              <h2 className="flex items-center gap-2 text-sm font-bold text-foreground"><Headset className="h-4 w-4 text-primary" /> {t.askTitle}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t.askBody}</p>
              <button data-tour="case-bot" onClick={() => setAssistant(true)} className={`${btnOutline} mt-3 w-full`}>{t.askCta}</button>
            </section>
          )}
        </aside>
      </div>

      {assistant && me?.id && <CaseAssistant personId={me.id} engagementId={view.id} name={me.name} t={t} onClose={() => setAssistant(false)} />}
    </div>
  );
}
