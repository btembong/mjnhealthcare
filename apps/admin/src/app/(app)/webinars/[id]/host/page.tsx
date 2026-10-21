'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft, CircleNotch, Question, ListChecks, Users, Stop, Broadcast, Check, X, ChartBar, Sparkle, ArrowUp,
  PushPin, EyeSlash, Eye, Plus, Trash, CheckCircle,
} from '@mjn/ui';
import { api } from '../../../../../lib/api';

type Detail = {
  id: string; title: string; status: string; startAt: string; startedAt: string | null; durationMinutes: number; language: 'en' | 'fr';
  stats: { registered: number; attended: number };
  registrations: { id: string; name: string; question: string | null; profession: string | null; status: string }[];
};
type HostQuestion = { id: string; author: string; text: string; votes: number; status: 'OPEN' | 'ANSWERED' | 'HIDDEN'; pinned: boolean; createdAt: string };
type HostPoll = { id: string; question: string; options: string[]; status: 'DRAFT' | 'OPEN' | 'CLOSED'; showResults: boolean; counts: number[]; total: number };
type Live = { status: string; watching: number; questions: HostQuestion[]; polls: HostPoll[]; offer: { label: string | null; url: string | null; visible: boolean } };
type Tab = 'qa' | 'polls' | 'offer' | 'sheet' | 'people';

const RUN_SHEET = [
  'Check your microphone and camera in the video window.',
  'Recording starts by itself when you join. Mention it to attendees.',
  'Share your slides with the screen-share button in the video window.',
  'Press Go live at the start time. Attendees can enter 15 minutes before.',
  'Launch a quick poll early on: it gets people engaged.',
  'Pin a question while you answer it, then mark it answered.',
  'Show the offer near the end and invite people to book a consultation.',
  'Press End webinar when you finish. The replay goes online by itself.',
];

const OFFER_PRESETS: [string, string, string][] = [
  ['Book a consultation', 'Réserver une consultation', '/consult'],
  ['See our prices', 'Voir nos tarifs', '/pricing'],
  ['Start your application', 'Commencer votre dossier', '/get-started'],
];

const tabBtn = (on: boolean) => `flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-[11px] font-bold transition-colors ${on ? 'bg-white/12 text-white' : 'text-white/55 hover:text-white'}`;
const darkBtn = 'inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-white/20 disabled:opacity-40';
const darkField = 'w-full rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-white/35 focus:ring-secondary/60';

export default function HostRoom() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pass, setPass] = useState<{ roomUrl: string; token: string } | null>(null);
  const [d, setD] = useState<Detail | null>(null);
  const [live, setLive] = useState<Live | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('qa');
  const [done, setDone] = useState<number[]>([]);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    try { setD(await api.getWebinar(id)); } catch { /* the pass request reports problems */ }
  }, [id]);
  const loadLive = useCallback(async () => {
    if (document.visibilityState !== 'visible') return;
    try { setLive(await api.webinarLive(id)); } catch { /* next look */ }
  }, [id]);
  useEffect(() => {
    api.webinarHostPass(id).then(setPass).catch((e) => setError(e.message ?? 'The room could not be opened.'));
    load(); loadLive();
  }, [id, load, loadLive]);
  useEffect(() => {
    const a = setInterval(load, 20000);
    const b = setInterval(loadLive, 3000);
    return () => { clearInterval(a); clearInterval(b); };
  }, [load, loadLive]);

  const isLive = d?.status === 'LIVE';
  const elapsed = useElapsed(isLive ? d?.startedAt ?? null : null);
  const advance = useMemo(() => (d?.registrations ?? []).filter((r) => r.status === 'REGISTERED' && r.question), [d]);
  const openQs = live?.questions.filter((q) => q.status === 'OPEN').length ?? 0;
  const runningPoll = live?.polls.find((p) => p.status === 'OPEN');

  async function act(work: () => Promise<Live>, ok?: string) {
    try { setLive(await work()); if (ok) toast.success(ok); } catch (e: any) { toast.error(e.message ?? 'That did not work.'); }
  }
  async function goLive() {
    setBusy(true);
    try { await api.startWebinar(id); toast.success('You are live.'); await load(); } catch (e: any) { toast.error(e.message ?? 'Could not go live.'); } finally { setBusy(false); }
  }
  async function end() {
    setBusy(true);
    try { const res = await api.endWebinar(id); toast.success(res.message ?? 'Webinar ended.'); router.push(`/webinars/${id}`); } catch (e: any) { toast.error(e.message ?? 'Could not end it.'); setBusy(false); }
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B1220] p-6 text-center text-white">
        <div className="rise max-w-sm">
          <p className="text-lg font-bold">The room is not open</p>
          <p className="mt-2 text-sm text-white/60">{error}</p>
          <button onClick={() => router.push(`/webinars/${id}`)} className="mt-6 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#0B1220]">Back to the webinar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0B1220] text-white">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 px-3 sm:px-4">
        <button onClick={() => router.push(`/webinars/${id}`)} aria-label="Leave the room" className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"><ArrowLeft className="h-5 w-5" /></button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{d?.title ?? 'Webinar'}</p>
          <p className="text-[11px] text-white/45">Host view · {live?.watching ?? 0} watching · {d?.stats.registered ?? 0} registered</p>
        </div>
        {live?.offer.visible && <span className="hidden items-center gap-1.5 rounded-md bg-secondary/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-secondary md:flex"><Sparkle className="h-3.5 w-3.5" /> Offer showing</span>}
        {runningPoll && <span className="hidden items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider md:flex"><ChartBar className="h-3.5 w-3.5" /> Poll · {runningPoll.total}</span>}
        {isLive ? (
          <span className="flex items-center gap-2 rounded-md bg-[#E5484D] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider">
            <span className="live-dot text-white" /> Live {elapsed && <span className="font-mono font-semibold normal-case tracking-normal">{elapsed}</span>}
          </span>
        ) : (
          <span className="rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white/80">Backstage · not live</span>
        )}
        {d && !isLive && d.status === 'PUBLISHED' && (
          <button onClick={goLive} disabled={busy} className="flex h-9 items-center gap-2 rounded-lg bg-[#E5484D] px-4 text-sm font-bold shadow-lg shadow-[#E5484D]/30 transition-all hover:-translate-y-px hover:bg-[#d13d42] disabled:opacity-60">
            {busy ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Broadcast className="h-4 w-4" />} Go live
          </button>
        )}
        {isLive && <button onClick={() => setConfirmEnd(true)} className="flex h-9 items-center gap-2 rounded-lg bg-white/10 px-4 text-sm font-bold transition-colors hover:bg-white/20"><Stop className="h-4 w-4" /> End webinar</button>}
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Stage */}
        <main className="relative min-w-0 flex-1 p-2 sm:p-3">
          <div className="relative h-full overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
            {(!pass || !ready) && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/60"><CircleNotch className="h-8 w-8 animate-spin" /><p className="text-sm">Opening the room</p></div>}
            {pass && (
              <iframe
                title="Webinar room"
                src={`${pass.roomUrl}?t=${encodeURIComponent(pass.token)}`}
                onLoad={() => setReady(true)}
                allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                className={`h-full w-full border-0 transition-opacity duration-500 ${ready ? 'opacity-100' : 'opacity-0'}`}
              />
            )}
          </div>
        </main>

        {/* Host panel */}
        <aside className="hidden w-[22rem] shrink-0 flex-col border-l border-white/10 bg-[#0F1729] lg:flex">
          <div className="flex gap-1 border-b border-white/10 p-2">
            {([['qa', 'Q&A', Question, openQs], ['polls', 'Polls', ChartBar, runningPoll ? '●' : null], ['offer', 'Offer', Sparkle, live?.offer.visible ? '●' : null], ['sheet', 'Run sheet', ListChecks, null], ['people', 'People', Users, null]] as const).map(([key, label, Icon, n]) => (
              <button key={key} onClick={() => setTab(key)} className={tabBtn(tab === key)}>
                <span className="relative"><Icon className="h-4 w-4" />{n ? <span className={`absolute -right-2.5 -top-1.5 rounded-full px-1 text-[9px] leading-[14px] ${n === '●' ? 'text-secondary' : 'bg-secondary text-white'}`}>{n}</span> : null}</span>
                {label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {!live ? <div className="flex justify-center p-10 text-white/40"><CircleNotch className="h-6 w-6 animate-spin" /></div>
              : tab === 'qa' ? <QaTab live={live} id={id} act={act} advance={advance} />
              : tab === 'polls' ? <PollsTab live={live} id={id} act={act} />
              : tab === 'offer' ? <OfferTab live={live} id={id} act={act} lang={d?.language ?? 'en'} />
              : tab === 'sheet' ? (
                <ol className="space-y-2 p-4">
                  {RUN_SHEET.map((step, i) => {
                    const on = done.includes(i);
                    return (
                      <li key={step}>
                        <button onClick={() => setDone((x) => (on ? x.filter((n) => n !== i) : [...x, i]))} className={`flex w-full gap-3 rounded-xl p-3 text-left text-sm transition-colors ${on ? 'bg-secondary/15 text-white/60' : 'bg-white/[0.04] text-white/90 hover:bg-white/[0.07]'}`}>
                          <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-colors ${on ? 'border-secondary bg-secondary text-white' : 'border-white/30'}`}>{on ? <Check className="h-3 w-3" /> : i + 1}</span>
                          <span className={on ? 'line-through' : ''}>{step}</span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <div className="space-y-3 p-4">
                  {[['Watching now', live.watching], ['Joined so far', d?.stats.attended ?? 0], ['Registered', d?.stats.registered ?? 0]].map(([label, value]) => (
                    <div key={label as string} className="rounded-xl bg-white/[0.05] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-white/45">{label}</p>
                      <p key={String(value)} className="pop mt-1 text-3xl font-bold tabular-nums">{value}</p>
                    </div>
                  ))}
                  <p className="text-xs leading-relaxed text-white/45">"Watching now" counts people seen in the last two minutes.</p>
                </div>
              )}
          </div>
        </aside>
      </div>

      {confirmEnd && (
        <div className="fade fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setConfirmEnd(false)}>
          <div role="dialog" aria-modal="true" className="pop w-full max-w-sm rounded-2xl border border-white/10 bg-[#141D30] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3"><h2 className="text-lg font-bold">End the webinar?</h2><button onClick={() => setConfirmEnd(false)} aria-label="Close" className="text-white/50 hover:text-white"><X className="h-5 w-5" /></button></div>
            <p className="mt-2 text-sm text-white/65">Attendees see that it has ended and are asked for feedback. The replay goes online and everyone registered is emailed once Daily has the recording.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setConfirmEnd(false)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-white/80 hover:bg-white/10">Keep going</button>
              <button onClick={end} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[#E5484D] px-4 py-2.5 text-sm font-bold hover:bg-[#d13d42] disabled:opacity-60">{busy && <CircleNotch className="h-4 w-4 animate-spin" />} End webinar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Q&A ───────────────────────────────────────────────────────────────────────

function QaTab({ live, id, act, advance }: { live: Live; id: string; act: (w: () => Promise<Live>, ok?: string) => Promise<void>; advance: Detail['registrations'] }) {
  const [view, setView] = useState<'open' | 'answered' | 'hidden'>('open');
  const groups = {
    open: live.questions.filter((q) => q.status === 'OPEN'),
    answered: live.questions.filter((q) => q.status === 'ANSWERED'),
    hidden: live.questions.filter((q) => q.status === 'HIDDEN'),
  };
  const run = (q: HostQuestion, action: Parameters<typeof api.moderateWebinarQuestion>[2]) => act(() => api.moderateWebinarQuestion(id, q.id, action));
  return (
    <div className="p-3">
      <div className="mb-3 inline-flex w-full rounded-lg bg-white/[0.05] p-0.5">
        {(['open', 'answered', 'hidden'] as const).map((k) => (
          <button key={k} onClick={() => setView(k)} className={`flex-1 rounded-md py-1.5 text-xs font-bold capitalize transition-colors ${view === k ? 'bg-white/15 text-white' : 'text-white/50'}`}>{k} {groups[k].length}</button>
        ))}
      </div>
      {groups[view].length === 0 && <p className="py-8 text-center text-sm text-white/45">{view === 'open' ? 'No questions waiting. They appear here as attendees ask.' : view === 'answered' ? 'Nothing answered yet.' : 'Nothing hidden.'}</p>}
      <ul className="space-y-2">
        {groups[view].map((q) => (
          <li key={q.id} className={`fade rounded-xl p-3 ${q.pinned ? 'bg-secondary/15 ring-1 ring-secondary/40' : 'bg-white/[0.05]'}`}>
            <div className="flex gap-3">
              <span className="flex h-10 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-white/[0.07] text-xs font-bold"><ArrowUp className="h-3.5 w-3.5 text-white/60" /><span key={q.votes} className="pop">{q.votes}</span></span>
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm leading-relaxed text-white/90">{q.text}</p>
                <p className="mt-1 text-[11px] text-white/40">{q.author}{q.pinned && <span className="ml-1.5 text-secondary">· answering now</span>}</p>
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {q.status === 'OPEN' && <button onClick={() => run(q, q.pinned ? 'unpin' : 'pin')} className={darkBtn}><PushPin className="h-3.5 w-3.5" /> {q.pinned ? 'Unpin' : 'Pin'}</button>}
              {q.status === 'OPEN' && <button onClick={() => run(q, 'answer')} className={darkBtn}><CheckCircle className="h-3.5 w-3.5" /> Answered</button>}
              {q.status === 'ANSWERED' && <button onClick={() => run(q, 'reopen')} className={darkBtn}>Reopen</button>}
              {q.status !== 'HIDDEN' ? <button onClick={() => run(q, 'hide')} className={darkBtn}><EyeSlash className="h-3.5 w-3.5" /> Hide</button>
                : <button onClick={() => run(q, 'show')} className={darkBtn}><Eye className="h-3.5 w-3.5" /> Show again</button>}
            </div>
          </li>
        ))}
      </ul>
      {advance.length > 0 && view === 'open' && (
        <details className="mt-5 rounded-xl bg-white/[0.03] p-3">
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-widest text-white/50">Sent at registration · {advance.length}</summary>
          <ul className="mt-3 space-y-2">
            {advance.map((r) => (
              <li key={r.id} className="rounded-lg bg-white/[0.04] p-2.5">
                <p className="text-sm text-white/85">{r.question}</p>
                <p className="mt-1 text-[11px] text-white/40">{r.name.split(' ')[0]}{r.profession ? ` · ${r.profession}` : ''}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

// ── Polls ─────────────────────────────────────────────────────────────────────

function PollsTab({ live, id, act }: { live: Live; id: string; act: (w: () => Promise<Live>, ok?: string) => Promise<void> }) {
  const [writing, setWriting] = useState(live.polls.length === 0);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [saving, setSaving] = useState(false);
  const ready = question.trim().length >= 3 && options.filter((o) => o.trim()).length >= 2;

  async function save(launch: boolean) {
    setSaving(true);
    try {
      let next = await api.createWebinarPoll(id, { question: question.trim(), options: options.map((o) => o.trim()).filter(Boolean) });
      if (launch) {
        const draft = [...next.polls].reverse().find((p: HostPoll) => p.status === 'DRAFT');
        if (draft) next = await api.webinarPollAction(id, draft.id, 'open');
      }
      await act(async () => next, launch ? 'Poll launched.' : 'Poll saved.');
      setQuestion(''); setOptions(['', '']); setWriting(false);
    } catch (e: any) {
      toast.error(e.message ?? 'The poll could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 p-3">
      {writing ? (
        <div className="fade rounded-xl bg-white/[0.05] p-3">
          <p className="text-xs font-bold uppercase tracking-widest text-white/50">New poll</p>
          <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Question, e.g. Where do you want to work?" className={`${darkField} mt-2`} />
          <div className="mt-2 space-y-1.5">
            {options.map((o, i) => (
              <div key={i} className="flex gap-1.5">
                <input value={o} onChange={(e) => setOptions((x) => x.map((v, j) => (j === i ? e.target.value : v)))} placeholder={`Answer ${i + 1}`} className={darkField} />
                {options.length > 2 && <button onClick={() => setOptions((x) => x.filter((_, j) => j !== i))} aria-label="Remove answer" className="px-2 text-white/40 hover:text-white"><X className="h-4 w-4" /></button>}
              </div>
            ))}
          </div>
          {options.length < 6 && <button onClick={() => setOptions((x) => [...x, ''])} className="mt-2 flex items-center gap-1 text-xs font-bold text-secondary"><Plus className="h-3.5 w-3.5" /> Add answer</button>}
          <div className="mt-3 flex justify-end gap-1.5">
            {live.polls.length > 0 && <button onClick={() => setWriting(false)} className={darkBtn}>Cancel</button>}
            <button onClick={() => save(false)} disabled={!ready || saving} className={darkBtn}>Save for later</button>
            <button onClick={() => save(true)} disabled={!ready || saving} className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold text-white transition-all hover:brightness-110 disabled:opacity-40">{saving && <CircleNotch className="h-3.5 w-3.5 animate-spin" />} Launch now</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setWriting(true)} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 py-2.5 text-sm font-bold text-white/70 transition-colors hover:border-white/30 hover:text-white"><Plus className="h-4 w-4" /> New poll</button>
      )}

      {[...live.polls].reverse().map((p) => (
        <div key={p.id} className={`fade rounded-xl p-3 ${p.status === 'OPEN' ? 'bg-secondary/12 ring-1 ring-secondary/40' : 'bg-white/[0.05]'}`}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold leading-snug">{p.question}</p>
            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${p.status === 'OPEN' ? 'bg-secondary text-white' : 'bg-white/10 text-white/60'}`}>{p.status === 'OPEN' ? 'Live' : p.status === 'DRAFT' ? 'Draft' : 'Closed'}</span>
          </div>
          <ul className="mt-2.5 space-y-1.5">
            {p.options.map((o, i) => {
              const pct = p.total ? Math.round((p.counts[i] / p.total) * 100) : 0;
              return (
                <li key={i} className="relative overflow-hidden rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-xs">
                  <span className="absolute inset-y-0 left-0 bg-secondary/30 transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }} />
                  <span className="relative flex justify-between gap-2"><span className="text-white/85">{o}</span><span className="tabular-nums text-white/60">{p.counts[i]} · {pct}%</span></span>
                </li>
              );
            })}
          </ul>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="mr-auto text-[11px] text-white/45">{p.total} {p.total === 1 ? 'answer' : 'answers'}</span>
            {p.status === 'DRAFT' && <button onClick={() => act(() => api.webinarPollAction(id, p.id, 'delete'))} aria-label="Delete draft" className={darkBtn}><Trash className="h-3.5 w-3.5" /></button>}
            {p.status === 'DRAFT' && <button onClick={() => act(() => api.webinarPollAction(id, p.id, 'open'), 'Poll launched.')} className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold text-white">Launch</button>}
            {p.status === 'OPEN' && <button onClick={() => act(() => api.webinarPollAction(id, p.id, 'close'), 'Poll closed.')} className={darkBtn}>Close poll</button>}
            {p.status !== 'DRAFT' && <button onClick={() => act(() => api.webinarPollAction(id, p.id, p.showResults ? 'unshare' : 'share'))} className={darkBtn}>{p.showResults ? <><EyeSlash className="h-3.5 w-3.5" /> Hide results</> : <><Eye className="h-3.5 w-3.5" /> Share results</>}</button>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Offer ─────────────────────────────────────────────────────────────────────

function OfferTab({ live, id, act, lang }: { live: Live; id: string; act: (w: () => Promise<Live>, ok?: string) => Promise<void>; lang: 'en' | 'fr' }) {
  const [label, setLabel] = useState(live.offer.label ?? (lang === 'fr' ? OFFER_PRESETS[0][1] : OFFER_PRESETS[0][0]));
  const [url, setUrl] = useState(live.offer.url ?? '/consult');
  const changed = label !== (live.offer.label ?? '') || url !== (live.offer.url ?? '');
  return (
    <div className="space-y-4 p-4">
      <div className={`rounded-2xl p-4 transition-colors ${live.offer.visible ? 'bg-secondary/15 ring-1 ring-secondary/40' : 'bg-white/[0.05]'}`}>
        <p className="text-xs font-bold uppercase tracking-widest text-white/50">Attendees see</p>
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-white p-2.5 text-[#0B1220]">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-white"><Sparkle className="h-4 w-4" /></span>
          <span className="min-w-0 flex-1 truncate text-sm font-bold">{label || 'Button text'}</span>
        </div>
        <button
          onClick={() => act(() => api.setWebinarOffer(id, { label, url, visible: !live.offer.visible }), live.offer.visible ? 'Offer hidden.' : 'Offer showing to attendees.')}
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${live.offer.visible ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-secondary text-white hover:brightness-110'}`}
        >
          {live.offer.visible ? <><EyeSlash className="h-4 w-4" /> Hide the offer</> : <><Eye className="h-4 w-4" /> Show to attendees</>}
        </button>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-white/50">Quick choices</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {OFFER_PRESETS.map(([en, fr, link]) => (
            <button key={link} onClick={() => { setLabel(lang === 'fr' ? fr : en); setUrl(link); }} className={darkBtn}>{lang === 'fr' ? fr : en}</button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <label className="block text-xs font-bold text-white/60" htmlFor="offer-label">Button text</label>
        <input id="offer-label" value={label} onChange={(e) => setLabel(e.target.value.slice(0, 60))} className={darkField} />
        <label className="block text-xs font-bold text-white/60" htmlFor="offer-url">Opens</label>
        <input id="offer-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/consult" className={darkField} />
        <p className="text-[11px] text-white/40">A page on the MJN website (like /consult) or the client portal.</p>
        {changed && <button onClick={() => act(() => api.setWebinarOffer(id, { label, url }), 'Offer updated.')} className={darkBtn}>Save changes</button>}
      </div>
    </div>
  );
}

function useElapsed(since: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!since) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [since]);
  if (!since) return null;
  const secs = Math.max(0, Math.floor((now - new Date(since).getTime()) / 1000));
  const h = Math.floor(secs / 3600), m = Math.floor(secs / 60) % 60, s = secs % 60;
  return `${h ? `${h}:` : ''}${String(m).padStart(h ? 2 : 1, '0')}:${String(s).padStart(2, '0')}`;
}
