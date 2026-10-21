'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, ChatCircle, ChartBar, CheckCircle, CircleNotch, PaperPlaneRight, PushPin, Star, ArrowRight, X, Sparkle } from '@mjn/ui';
import { API, type Lang } from '../../../../components/webinar-kit';

// ── Data ──────────────────────────────────────────────────────────────────────

export type LiveQuestion = { id: string; author: string; text: string; votes: number; answered: boolean; pinned: boolean; mine: boolean; voted: boolean; createdAt: string };
export type LivePoll = { id: string; question: string; options: string[]; status: 'OPEN' | 'CLOSED'; myVote: number | null; counts?: number[]; total?: number };
export type LiveState = { status: string; canTakePart: boolean; questions: LiveQuestion[]; poll: LivePoll | null; offer: { label: string; url: string } | null };

export const ENGAGE = {
  en: {
    qa: 'Q&A', polls: 'Polls', about: 'About', ask: 'Ask the speaker a question…', send: 'Send', noQuestions: 'No questions yet. Be the first to ask.',
    you: 'You', answered: 'Answered', pinned: 'Answering now', upvote: 'Vote for this question', closedQa: 'Questions are open while the webinar is running.',
    noPoll: 'No poll right now. When the host launches one, it appears here.', thanks: 'Thanks, your answer is in.', resultsSoon: 'The host may share the results.',
    votes: (n: number) => (n === 1 ? '1 answer' : `${n} answers`), closed: 'Poll closed', newPoll: 'New poll', answerNow: 'Answer now',
    surveyTitle: 'How was the webinar?', surveySub: 'Two quick questions. It helps us make the next one better.',
    contactQ: 'Would you like an advisor to contact you about your own situation?', yes: 'Yes, please', no: 'Not now',
    comment: 'Anything else? (optional)', submit: 'Send', sending: 'Sending…', surveyDone: 'Thank you for your feedback',
    surveyDoneContact: 'An advisor will be in touch soon.', surveyDoneSub: 'We read every answer.', ratingLabels: ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'],
    error: 'That did not go through. Please try again.',
  },
  fr: {
    qa: 'Questions', polls: 'Sondages', about: 'À propos', ask: 'Posez une question à l’intervenant…', send: 'Envoyer', noQuestions: 'Aucune question pour l’instant. Soyez le premier.',
    you: 'Vous', answered: 'Répondu', pinned: 'En cours de réponse', upvote: 'Voter pour cette question', closedQa: 'Les questions sont ouvertes pendant le webinaire.',
    noPoll: 'Aucun sondage pour le moment. Quand l’intervenant en lance un, il apparaît ici.', thanks: 'Merci, votre réponse est enregistrée.', resultsSoon: 'L’intervenant partagera peut-être les résultats.',
    votes: (n: number) => (n === 1 ? '1 réponse' : `${n} réponses`), closed: 'Sondage terminé', newPoll: 'Nouveau sondage', answerNow: 'Répondre',
    surveyTitle: 'Comment s’est passé le webinaire ?', surveySub: 'Deux questions rapides pour nous aider à faire encore mieux.',
    contactQ: 'Souhaitez-vous qu’un conseiller vous contacte au sujet de votre situation ?', yes: 'Oui, volontiers', no: 'Pas maintenant',
    comment: 'Autre chose ? (facultatif)', submit: 'Envoyer', sending: 'Envoi…', surveyDone: 'Merci pour votre avis',
    surveyDoneContact: 'Un conseiller vous contactera bientôt.', surveyDoneSub: 'Nous lisons chaque réponse.', ratingLabels: ['Faible', 'Moyen', 'Bien', 'Très bien', 'Excellent'],
    error: 'Cela n’a pas fonctionné. Veuillez réessayer.',
  },
};
type Copy = (typeof ENGAGE)['en'];

/** Looks for changes every few seconds while the tab is visible. Actions return the fresh state at once. */
export function useLive(token: string) {
  const [state, setState] = useState<LiveState | null>(null);
  const load = useCallback(async () => {
    if (document.visibilityState !== 'visible') return;
    try {
      const res = await fetch(`${API}/webinars/attend/${token}/live`, { cache: 'no-store' });
      if (res.ok) setState(await res.json());
    } catch { /* the next look will catch up */ }
  }, [token]);
  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    document.addEventListener('visibilitychange', load);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', load); };
  }, [load]);
  const act = useCallback(async (path: string, body?: unknown) => {
    const res = await fetch(`${API}/webinars/attend/${token}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message ?? 'Request failed');
    if (data && 'questions' in data) setState(data);
    return data;
  }, [token]);
  return { state, act };
}

// ── Q&A ───────────────────────────────────────────────────────────────────────

export function QuestionsPanel({ state, act, c }: { state: LiveState; act: (p: string, b?: unknown) => Promise<any>; c: Copy }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const open = state.questions.filter((q) => !q.answered);
  const done = state.questions.filter((q) => q.answered);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length < 3) return;
    setBusy(true); setError('');
    try { await act('questions', { text }); setText(''); } catch (err: any) { setError(err.message ?? c.error); } finally { setBusy(false); }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
        {state.questions.length === 0 && (
          <div className="fade mt-10 text-center">
            <ChatCircle className="mx-auto h-9 w-9 text-white/20" />
            <p className="mt-3 text-sm text-white/50">{c.noQuestions}</p>
          </div>
        )}
        {open.map((q) => <QuestionRow key={q.id} q={q} act={act} c={c} />)}
        {done.length > 0 && <p className="pt-3 text-[11px] font-bold uppercase tracking-widest text-white/35">{c.answered}</p>}
        {done.map((q) => <QuestionRow key={q.id} q={q} act={act} c={c} />)}
      </div>
      <form onSubmit={send} className="border-t border-white/10 p-3">
        {state.canTakePart ? (
          <>
            <div className="flex items-end gap-2 rounded-xl bg-white/[0.06] p-1.5 ring-1 ring-white/10 transition-shadow focus-within:ring-secondary/60">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 300))}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); } }}
                rows={1}
                placeholder={c.ask}
                aria-label={c.ask}
                className="max-h-28 min-h-[2.25rem] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-white outline-none placeholder:text-white/35"
              />
              <button type="submit" disabled={busy || text.trim().length < 3} aria-label={c.send} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-white transition-all hover:brightness-110 disabled:opacity-30">
                {busy ? <CircleNotch className="h-4 w-4 animate-spin" /> : <PaperPlaneRight className="h-4 w-4" />}
              </button>
            </div>
            {error && <p role="alert" className="mt-1.5 px-1 text-xs text-white/70">{error}</p>}
          </>
        ) : <p className="px-1 text-xs text-white/45">{c.closedQa}</p>}
      </form>
    </div>
  );
}

function QuestionRow({ q, act, c }: { q: LiveQuestion; act: (p: string) => Promise<any>; c: Copy }) {
  const [busy, setBusy] = useState(false);
  async function vote() {
    if (q.mine || busy) return;
    setBusy(true);
    try { await act(`questions/${q.id}/vote`); } catch { /* ignore */ } finally { setBusy(false); }
  }
  return (
    <div className={`fade flex gap-3 rounded-xl p-3 transition-colors ${q.pinned ? 'bg-secondary/15 ring-1 ring-secondary/40' : 'bg-white/[0.05]'} ${q.answered ? 'opacity-55' : ''}`}>
      <button
        onClick={vote}
        disabled={q.mine}
        aria-pressed={q.voted}
        aria-label={c.upvote}
        className={`flex h-12 w-10 shrink-0 flex-col items-center justify-center rounded-lg text-xs font-bold transition-all ${q.voted ? 'bg-secondary text-white' : 'bg-white/[0.06] text-white/70 hover:bg-white/10'} ${q.mine ? 'cursor-default opacity-60' : 'active:scale-95'}`}
      >
        <ArrowUp className="h-4 w-4" /><span key={q.votes} className="pop tabular-nums">{q.votes}</span>
      </button>
      <div className="min-w-0 flex-1">
        {q.pinned && <p className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-secondary"><PushPin className="h-3 w-3" /> {c.pinned}</p>}
        <p className="break-words text-sm leading-relaxed text-white/90">{q.text}</p>
        <p className="mt-1 text-[11px] text-white/40">{q.mine ? c.you : q.author}{q.answered && <span className="ml-1.5 inline-flex items-center gap-1 text-secondary"><CheckCircle className="h-3 w-3" weight="fill" /> {c.answered}</span>}</p>
      </div>
    </div>
  );
}

// ── Polls ─────────────────────────────────────────────────────────────────────

export function PollPanel({ state, act, c }: { state: LiveState; act: (p: string, b?: unknown) => Promise<any>; c: Copy }) {
  const poll = state.poll;
  const [busy, setBusy] = useState<number | null>(null);
  if (!poll) {
    return (
      <div className="fade mt-14 px-6 text-center">
        <ChartBar className="mx-auto h-9 w-9 text-white/20" />
        <p className="mt-3 text-sm text-white/50">{c.noPoll}</p>
      </div>
    );
  }
  const results = poll.counts && poll.total !== undefined;
  async function choose(i: number) {
    if (poll!.status !== 'OPEN') return;
    setBusy(i);
    try { await act(`polls/${poll!.id}`, { option: i }); } catch { /* ignore */ } finally { setBusy(null); }
  }
  return (
    <div className="space-y-4 p-4">
      <div className="fade rounded-2xl bg-white/[0.05] p-4 ring-1 ring-white/10">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-secondary">
          {poll.status === 'OPEN' ? <><span className="live-dot text-secondary" /> {c.polls}</> : c.closed}
        </p>
        <p className="mt-2 font-bold leading-snug text-white">{poll.question}</p>
        <ul className="mt-4 space-y-2">
          {poll.options.map((label, i) => {
            const mine = poll.myVote === i;
            const pct = results && poll.total ? Math.round(((poll.counts![i] ?? 0) / poll.total) * 100) : 0;
            return (
              <li key={i}>
                <button
                  onClick={() => choose(i)}
                  disabled={poll.status !== 'OPEN' || busy !== null}
                  className={`relative w-full overflow-hidden rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition-all ${mine ? 'text-white ring-2 ring-secondary' : 'text-white/85 ring-1 ring-white/12 hover:ring-white/30'} ${poll.status === 'OPEN' ? 'active:scale-[0.99]' : 'cursor-default'}`}
                >
                  {results && <span className="absolute inset-y-0 left-0 bg-secondary/25 transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }} />}
                  <span className="relative flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">{busy === i ? <CircleNotch className="h-4 w-4 animate-spin" /> : mine && <CheckCircle className="h-4 w-4 text-secondary" weight="fill" />}{label}</span>
                    {results && <span className="tabular-nums text-white/70">{pct}%</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-white/45">
          {results ? c.votes(poll.total!) : poll.myVote !== null ? `${c.thanks} ${c.resultsSoon}` : ''}
        </p>
      </div>
    </div>
  );
}

/** A small card that slides in when the host launches a poll and the viewer is looking elsewhere. */
export function NewPollToast({ show, onOpen, onClose, c }: { show: boolean; onOpen: () => void; onClose: () => void; c: Copy }) {
  if (!show) return null;
  return (
    <div className="rise absolute right-4 top-4 z-20 flex w-72 items-center gap-3 rounded-2xl bg-white p-3.5 text-[#0B1220] shadow-2xl">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary"><ChartBar className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{c.newPoll}</p>
        <button onClick={onOpen} className="text-xs font-bold text-primary hover:underline">{c.answerNow} →</button>
      </div>
      <button onClick={onClose} aria-label="Close" className="text-[#0B1220]/40 hover:text-[#0B1220]"><X className="h-4 w-4" /></button>
    </div>
  );
}

// ── Offer ─────────────────────────────────────────────────────────────────────

export function OfferBanner({ offer, onClick }: { offer: { label: string; url: string } | null; onClick: () => void }) {
  const [shown, setShown] = useState(offer);
  // Keep the last offer while it slides away.
  useEffect(() => { if (offer) setShown(offer); }, [offer]);
  if (!shown) return null;
  return (
    <div className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center p-4 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${offer ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
      <a
        href={shown.url}
        target="_blank"
        rel="noopener"
        onClick={onClick}
        className="pointer-events-auto group flex items-center gap-3 rounded-2xl bg-white py-2.5 pl-3 pr-4 text-[#0B1220] shadow-2xl ring-1 ring-black/5 transition-transform hover:-translate-y-0.5"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white"><Sparkle className="h-5 w-5" /></span>
        <span className="text-sm font-bold">{shown.label}</span>
        <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
      </a>
    </div>
  );
}

// ── Survey ────────────────────────────────────────────────────────────────────

export function SurveyCard({ token, lang }: { token: string; lang: Lang }) {
  const c = ENGAGE[lang];
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [contact, setContact] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    fetch(`${API}/webinars/attend/${token}/survey`).then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (d?.answer) { setRating(d.answer.rating ?? 0); setContact(d.answer.wantsContact ?? null); setComment(d.answer.comment ?? ''); }
    }).catch(() => {});
  }, [token]);

  async function submit() {
    setBusy(true); setError('');
    try {
      const res = await fetch(`${API}/webinars/attend/${token}/survey`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rating, wantsContact: contact === true, comment }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? c.error);
      setDone(true);
    } catch (e: any) {
      setError(e.message ?? c.error);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="pop rounded-3xl border border-white/10 bg-white/[0.05] p-6 text-center backdrop-blur-sm">
        <CheckCircle className="mx-auto h-10 w-10 text-secondary" weight="fill" />
        <p className="mt-3 text-lg font-bold text-white">{c.surveyDone}</p>
        <p className="mt-1 text-sm text-white/60">{contact ? c.surveyDoneContact : c.surveyDoneSub}</p>
      </div>
    );
  }
  const shown = hover || rating;
  return (
    <div className="rise rounded-3xl border border-white/10 bg-white/[0.05] p-6 text-left backdrop-blur-sm">
      <p className="text-lg font-bold text-white">{c.surveyTitle}</p>
      <p className="mt-1 text-sm text-white/55">{c.surveySub}</p>
      <div className="mt-5 flex items-center gap-1" role="radiogroup" aria-label={c.surveyTitle} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} role="radio" aria-checked={rating === n} aria-label={`${n} — ${c.ratingLabels[n - 1]}`} onMouseEnter={() => setHover(n)} onClick={() => setRating(n)} className="p-1 transition-transform hover:scale-110 active:scale-95">
            <Star className={`h-8 w-8 transition-colors ${n <= shown ? 'text-accent' : 'text-white/20'}`} weight="fill" />
          </button>
        ))}
        <span className="ml-2 text-sm font-semibold text-white/70">{shown ? c.ratingLabels[shown - 1] : ''}</span>
      </div>
      <p className="mt-5 text-sm font-semibold text-white/85">{c.contactQ}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {[[true, c.yes], [false, c.no]].map(([v, label]) => (
          <button key={String(v)} onClick={() => setContact(v as boolean)} className={`rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${contact === v ? 'bg-secondary text-white' : 'bg-white/[0.06] text-white/75 hover:bg-white/10'}`}>{label as string}</button>
        ))}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value.slice(0, 1000))} rows={2} placeholder={c.comment} aria-label={c.comment} className="mt-4 w-full resize-none rounded-xl bg-white/[0.06] px-3 py-2.5 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-white/35 focus:ring-secondary/60" />
      {error && <p role="alert" className="mt-2 text-xs text-white/70">{error}</p>}
      <button onClick={submit} disabled={!rating || contact === null || busy} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-[#0B1220] transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-40">
        {busy && <CircleNotch className="h-4 w-4 animate-spin" />} {busy ? c.sending : c.submit}
      </button>
    </div>
  );
}
