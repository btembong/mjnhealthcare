'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, CalendarPlus, Clock, Headphones, WifiHigh, Info, SignOut, SidebarSimple, Play, Users,
  CircleNotch, ArrowsClockwise, X, ChatCircle, CalendarBlank, Monitor,
} from '@mjn/ui';
import { API, Avatar, Countdown, Cover, LangPill, doualaDate, doualaTime, type Lang, type PublicWebinar } from '../../../../components/webinar-kit';
import { ENGAGE, NewPollToast, OfferBanner, PollPanel, QuestionsPanel, SurveyCard, useLive } from './engage';

type Attend = {
  webinar: PublicWebinar; name: string; seatCancelled: boolean;
  state: 'early' | 'open' | 'ended' | 'cancelled' | 'seat_cancelled';
  opensAt?: string; live?: boolean; roomUrl?: string; token?: string; cancelReason?: string | null;
};

const COPY = {
  en: {
    loading: 'Getting your seat ready…', invalid: 'This link is not valid', invalidSub: 'Check the email you received when you registered, or register again.',
    waitingTitle: 'The webinar will start soon', hello: (n: string) => `Welcome, ${n}`, opensIn: 'The room opens in',
    before: 'Before you join', tips: [['Steady connection', 'Wi-Fi or good mobile data works best.'], ['Headphones help', 'Sound is clearer, and nobody else hears it.'], ['No camera or microphone needed', 'You watch and listen. Questions go in the chat.']],
    addCal: 'Add to calendar', cantAttend: 'I can’t attend', cancelAsk: 'Give up your seat?', cancelBody: 'Someone else can take it. You will still be emailed the replay.', keep: 'Keep my seat', release: 'Give up my seat',
    live: 'Live', soon: 'Starting soon', leave: 'Leave', panel: 'Details', about: 'About this session', speakers: 'Speakers',
    askHint: 'Use the chat inside the video window to ask a question. The host answers during the session.',
    consultTitle: 'Want advice on your own case?', consultCta: 'Book a consultation',
    leaveAsk: 'Leave the webinar?', leaveBody: 'You can come back any time while it is running, using the same link.', stay: 'Stay', leaveConfirm: 'Leave',
    left: 'You left the webinar', leftSub: 'Changed your mind? You can rejoin while it is still running.', rejoin: 'Rejoin',
    ended: 'This webinar has ended', endedSub: 'Thank you for registering. The replay is emailed to you as soon as it is ready.',
    watch: 'Watch the replay', cancelled: 'This webinar was cancelled', cancelledSub: 'We are sorry. See our other upcoming webinars.',
    seatGone: 'You gave up your seat', seatGoneSub: 'You can register again from the webinar page while seats remain.', registerAgain: 'Go to the webinar page',
    others: 'Other webinars', retry: 'Try again', offline: 'Connection lost. Retrying…',
  },
  fr: {
    loading: 'Préparation de votre place…', invalid: 'Ce lien n’est pas valide', invalidSub: 'Vérifiez l’e-mail reçu lors de votre inscription, ou inscrivez-vous à nouveau.',
    waitingTitle: 'Le webinaire va bientôt commencer', hello: (n: string) => `Bienvenue, ${n}`, opensIn: 'La salle ouvre dans',
    before: 'Avant de rejoindre', tips: [['Une connexion stable', 'Le Wi-Fi ou de bonnes données mobiles.'], ['Un casque aide', 'Le son est plus clair, et personne d’autre ne l’entend.'], ['Ni caméra ni micro', 'Vous regardez et écoutez. Les questions passent par le chat.']],
    addCal: 'Ajouter au calendrier', cantAttend: 'Je ne pourrai pas venir', cancelAsk: 'Libérer votre place ?', cancelBody: 'Quelqu’un d’autre pourra la prendre. Vous recevrez quand même le replay.', keep: 'Garder ma place', release: 'Libérer ma place',
    live: 'En direct', soon: 'Bientôt', leave: 'Quitter', panel: 'Détails', about: 'À propos de cette séance', speakers: 'Intervenants',
    askHint: 'Utilisez le chat dans la fenêtre vidéo pour poser une question. L’intervenant répond pendant la séance.',
    consultTitle: 'Un conseil sur votre propre dossier ?', consultCta: 'Réserver une consultation',
    leaveAsk: 'Quitter le webinaire ?', leaveBody: 'Vous pouvez revenir à tout moment pendant la séance, avec le même lien.', stay: 'Rester', leaveConfirm: 'Quitter',
    left: 'Vous avez quitté le webinaire', leftSub: 'Vous avez changé d’avis ? Vous pouvez revenir tant qu’il est en cours.', rejoin: 'Revenir',
    ended: 'Ce webinaire est terminé', endedSub: 'Merci de votre inscription. Le replay vous est envoyé par e-mail dès qu’il est prêt.',
    watch: 'Regarder le replay', cancelled: 'Ce webinaire a été annulé', cancelledSub: 'Nous en sommes désolés. Découvrez nos autres webinaires.',
    seatGone: 'Vous avez libéré votre place', seatGoneSub: 'Vous pouvez vous réinscrire depuis la page du webinaire s’il reste des places.', registerAgain: 'Page du webinaire',
    others: 'Autres webinaires', retry: 'Réessayer', offline: 'Connexion perdue. Nouvelle tentative…',
  },
};

export function WebinarRoom({ token }: { token: string }) {
  const [data, setData] = useState<Attend | null>(null);
  const [error, setError] = useState<'invalid' | 'network' | null>(null);
  const [left, setLeft] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/webinars/attend/${token}`, { cache: 'no-store' });
      if (res.status === 404) { setError('invalid'); return; }
      if (!res.ok) throw new Error();
      setData(await res.json());
      setError(null);
    } catch {
      setError('network');
    }
  }, [token]);
  useEffect(() => { load(); }, [load]);

  // While waiting, look again now and then: the host may start early or the time may change.
  useEffect(() => {
    if (data?.state !== 'early' && error !== 'network') return;
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [data?.state, error, load]);

  const lang: Lang = data?.webinar.language ?? 'en';
  const c = COPY[lang];

  if (error === 'invalid') return <Screen><Message title={COPY.en.invalid} body={COPY.en.invalidSub} action={<Link href="/resources/webinars" className={btnLight}>{COPY.en.others}</Link>} /></Screen>;
  if (!data) {
    return (
      <Screen>
        <div className="fade flex flex-col items-center gap-4 text-white/70">
          <CircleNotch className="h-8 w-8 animate-spin" />
          <p className="text-sm">{error === 'network' ? COPY.en.offline : COPY.en.loading}</p>
          {error === 'network' && <button onClick={load} className={btnLight}>{COPY.en.retry}</button>}
        </div>
      </Screen>
    );
  }

  const w = data.webinar;
  if (data.state === 'cancelled') return <Screen><Message title={c.cancelled} body={data.cancelReason ? `${c.cancelledSub}\n\n“${data.cancelReason}”` : c.cancelledSub} action={<Link href="/resources/webinars" className={btnLight}>{c.others}</Link>} /></Screen>;
  if (data.state === 'seat_cancelled') return <Screen><Message title={c.seatGone} body={c.seatGoneSub} action={<Link href={`/webinars/${w.slug}`} className={btnLight}>{c.registerAgain}</Link>} /></Screen>;
  if (data.state === 'ended') {
    return (
      <Screen>
        <Message
          title={c.ended}
          body={c.endedSub}
          action={<div className="space-y-6">
            <div className="flex flex-wrap justify-center gap-3">
              {w.hasReplay && <Link href={`/webinars/${w.slug}`} className={btnPrimary}><Play className="h-4 w-4" weight="fill" /> {c.watch}</Link>}
              <Link href="/consult" className={btnLight}>{c.consultCta}</Link>
            </div>
            {new Date(w.startAt).getTime() <= Date.now() && <SurveyCard token={token} lang={w.language} />}
          </div>}
        />
      </Screen>
    );
  }
  if (data.state === 'early') return <WaitingRoom data={data} token={token} c={c} onOpen={load} onCancelled={load} />;
  if (left) {
    return (
      <Screen>
        <Message title={c.left} body={c.leftSub} action={<div className="space-y-6">
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => { setLeft(false); load(); }} className={btnPrimary}><ArrowsClockwise className="h-4 w-4" /> {c.rejoin}</button>
            <Link href="/consult" className={btnLight}>{c.consultCta}</Link>
          </div>
          <SurveyCard token={token} lang={w.language} />
        </div>} />
      </Screen>
    );
  }
  return <LiveRoom data={data} token={token} c={c} onLeave={() => setLeft(true)} />;
}

// ── The waiting room ───────────────────────────────────────────────────────────

function WaitingRoom({ data, token, c, onOpen, onCancelled }: { data: Attend; token: string; c: (typeof COPY)['en']; onOpen: () => void; onCancelled: () => void }) {
  const w = data.webinar;
  const lang = w.language;
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  async function release() {
    setBusy(true);
    try { await fetch(`${API}/webinars/attend/${token}/cancel`, { method: 'POST' }); onCancelled(); } finally { setBusy(false); }
  }
  return (
    <Screen>
      <div className="relative z-10 mx-auto w-full max-w-3xl px-5 py-12">
        <div className="rise flex items-center justify-between gap-3">
          <Brand />
          <LangPill lang={lang} />
        </div>
        <div className="rise mx-auto mt-10 max-w-md overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10" style={{ animationDelay: '40ms' }}>
          <Cover w={w} priority />
        </div>
        <div className="rise mt-8 text-center" style={{ animationDelay: '80ms' }}>
          <p className="text-sm font-semibold text-secondary">{c.hello(data.name)}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{c.waitingTitle}</h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-white/70">{w.title}</p>
          <p className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-white/60">
            <span className="flex items-center gap-1.5 capitalize"><CalendarBlank className="h-4 w-4" />{doualaDate(w.startAt, lang)}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{doualaTime(w.startAt, lang)} {lang === 'fr' ? 'heure de Douala' : 'Douala time'}</span>
          </p>
        </div>
        {data.opensAt && (
          <div className="rise mt-10 flex flex-col items-center gap-3" style={{ animationDelay: '160ms' }}>
            <p className="text-xs font-bold uppercase tracking-widest text-white/50">{c.opensIn}</p>
            <div className="[&_div.rounded-xl]:border-white/10 [&_div.rounded-xl]:bg-white/[0.06] [&_div.rounded-xl]:shadow-none [&_span.text-foreground]:text-white [&_span.text-muted-foreground]:text-white/50">
              <Countdown target={data.opensAt} lang={lang} size="lg" onDone={onOpen} />
            </div>
          </div>
        )}
        <div className="rise mt-12 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm" style={{ animationDelay: '240ms' }}>
          <p className="text-xs font-bold uppercase tracking-widest text-white/50">{c.before}</p>
          <ul className="mt-4 grid gap-4 sm:grid-cols-3">
            {c.tips.map(([title, body], i) => {
              const Icon = [WifiHigh, Headphones, Monitor][i];
              return (
                <li key={title} className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white"><Icon className="h-5 w-5" /></span>
                  <span><span className="block text-sm font-bold text-white">{title}</span><span className="block text-xs leading-relaxed text-white/60">{body}</span></span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="rise mt-8 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: '300ms' }}>
          <a href={`${API}/webinars/attend/${token}/calendar.ics`} className={btnLight}><CalendarPlus className="h-4 w-4" /> {c.addCal}</a>
          <button onClick={() => setAsking(true)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white/60 transition-colors hover:text-white">{c.cantAttend}</button>
        </div>
      </div>
      {asking && (
        <Dialog title={c.cancelAsk} body={c.cancelBody} onClose={() => setAsking(false)}>
          <button onClick={() => setAsking(false)} className={btnGhostDark}>{c.keep}</button>
          <button onClick={release} disabled={busy} className={btnPrimary}>{busy && <CircleNotch className="h-4 w-4 animate-spin" />} {c.release}</button>
        </Dialog>
      )}
    </Screen>
  );
}

// ── The live room ──────────────────────────────────────────────────────────────

type Tab = 'qa' | 'polls' | 'about';

function LiveRoom({ data, token, c, onLeave }: { data: Attend; token: string; c: (typeof COPY)['en']; onLeave: () => void }) {
  const w = data.webinar;
  const lang = w.language;
  const e = ENGAGE[lang];
  const { state, act } = useLive(token);
  const [panel, setPanel] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [tab, setTab] = useState<Tab>('qa');
  const [asking, setAsking] = useState(false);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState(false);
  const [unseenPoll, setUnseenPoll] = useState(false);
  const seenPoll = useRef<string | null>(null);
  const elapsed = useElapsed(data.live || state?.status === 'LIVE' ? w.startAt : null);
  const live = data.live || state?.status === 'LIVE';

  // Attendance: one beat a minute while the room is on screen.
  useEffect(() => {
    const beat = () => { if (document.visibilityState === 'visible') fetch(`${API}/webinars/attend/${token}/heartbeat`, { method: 'POST', keepalive: true }).catch(() => {}); };
    beat();
    const t = setInterval(beat, 60000);
    return () => clearInterval(t);
  }, [token]);

  // Narrow screens start with the video only.
  useEffect(() => { if (window.innerWidth < 1024) setPanel(false); }, []);

  // A newly launched poll is announced unless the viewer is already looking at polls.
  const pollId = state?.poll?.status === 'OPEN' ? state.poll.id : null;
  const lookingAtPolls = tab === 'polls' && (panel || sheet);
  useEffect(() => {
    if (!pollId || pollId === seenPoll.current) return;
    seenPoll.current = pollId;
    if (!lookingAtPolls) { setToast(true); setUnseenPoll(true); }
  }, [pollId, lookingAtPolls]);
  useEffect(() => { if (lookingAtPolls) setUnseenPoll(false); }, [lookingAtPolls]);

  function openTab(next: Tab) {
    setTab(next);
    setToast(false);
    if (window.innerWidth < 640) setSheet(true); else setPanel(true);
  }

  const openQuestions = state?.questions.filter((q) => !q.answered).length ?? 0;
  const tabs: [Tab, string, number | null, boolean][] = [
    ['qa', e.qa, openQuestions || null, false],
    ['polls', e.polls, null, unseenPoll],
    ['about', e.about, null, false],
  ];

  const panelBody = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex gap-1 border-b border-white/10 p-2" role="tablist">
        {tabs.map(([key, label, count, dot]) => (
          <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold transition-colors ${tab === key ? 'bg-white/12 text-white' : 'text-white/55 hover:text-white'}`}>
            {label}
            {count ? <span className="rounded-full bg-white/15 px-1.5 text-[10px] tabular-nums">{count}</span> : null}
            {dot && <span className="live-dot text-secondary" />}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {!state ? (
          <div className="flex justify-center p-10 text-white/40"><CircleNotch className="h-6 w-6 animate-spin" /></div>
        ) : tab === 'qa' ? <QuestionsPanel state={state} act={act} c={e} />
          : tab === 'polls' ? <PollPanel state={state} act={act} c={e} />
          : <AboutPanel w={w} c={c} />}
      </div>
    </div>
  );

  const src = `${data.roomUrl}?t=${encodeURIComponent(data.token ?? '')}`;
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#0B1220] text-white">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 px-3 sm:px-5">
        <Brand compact />
        <span className="hidden h-6 w-px bg-white/10 sm:block" />
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white/90">{w.title}</p>
        {live ? (
          <span className="flex shrink-0 items-center gap-2 rounded-md bg-[#E5484D] px-2 py-1 text-[11px] font-bold uppercase tracking-wider">
            <span className="live-dot text-white" /> {c.live}{elapsed && <span className="hidden font-mono font-semibold normal-case tracking-normal text-white/90 sm:inline">{elapsed}</span>}
          </span>
        ) : (
          <span className="shrink-0 rounded-md bg-white/10 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-white/80">{c.soon}</span>
        )}
        <button onClick={() => setPanel((p) => !p)} aria-pressed={panel} aria-label={c.panel} className={`hidden h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors sm:flex ${panel ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10'}`}>
          <SidebarSimple className="h-4 w-4" /> {e.qa}{unseenPoll && !panel && <span className="live-dot text-secondary" />}
        </button>
        <button onClick={() => setAsking(true)} className="flex h-9 shrink-0 items-center gap-2 rounded-lg bg-white/10 px-3 text-sm font-bold text-white transition-colors hover:bg-[#E5484D]">
          <SignOut className="h-4 w-4" /> <span className="hidden sm:inline">{c.leave}</span>
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Stage */}
        <main className="relative min-w-0 flex-1 p-2 sm:p-4">
          <div className="relative h-full overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10">
            {!ready && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/60">
                <CircleNotch className="h-8 w-8 animate-spin" />
                <p className="text-sm">{c.loading.replace('…', '')}</p>
              </div>
            )}
            <iframe
              title={w.title}
              src={src}
              onLoad={() => setReady(true)}
              allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
              className={`h-full w-full border-0 transition-opacity duration-500 ${ready ? 'opacity-100' : 'opacity-0'}`}
            />
            <NewPollToast show={toast} onOpen={() => openTab('polls')} onClose={() => setToast(false)} c={e} />
            <OfferBanner offer={state?.offer ?? null} onClick={() => { act('offer-click').catch(() => {}); }} />
          </div>
        </main>

        {/* Side panel (tablets and up) */}
        <aside className={`hidden shrink-0 overflow-hidden border-l border-white/10 bg-[#0F1729] transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:block ${panel ? 'w-80 xl:w-96' : 'w-0 border-l-0'}`}>
          <div className="h-full w-80 xl:w-96">{panelBody}</div>
        </aside>
      </div>

      {/* Phones: a bar under the video opens the panel as a sheet */}
      <nav className="flex shrink-0 gap-2 border-t border-white/10 p-2 sm:hidden">
        {tabs.map(([key, label, count, dot]) => (
          <button key={key} onClick={() => openTab(key)} className="relative flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/[0.06] py-2.5 text-xs font-bold text-white/85">
            {label}{count ? <span className="rounded-full bg-white/15 px-1.5 text-[10px]">{count}</span> : null}
            {dot && <span className="live-dot absolute right-3 top-2 text-secondary" />}
          </button>
        ))}
      </nav>
      {sheet && (
        <div className="fade fixed inset-0 z-[65] flex items-end bg-black/50 sm:hidden" onClick={() => setSheet(false)}>
          <div className="rise flex h-[78vh] w-full flex-col overflow-hidden rounded-t-3xl bg-[#0F1729] shadow-2xl" onClick={(ev) => ev.stopPropagation()}>
            <div className="flex justify-center pt-2.5"><span className="h-1 w-10 rounded-full bg-white/20" /></div>
            <button onClick={() => setSheet(false)} aria-label="Close" className="absolute right-4 top-3 text-white/50"><X className="h-5 w-5" /></button>
            <div className="min-h-0 flex-1">{panelBody}</div>
          </div>
        </div>
      )}

      {asking && (
        <Dialog title={c.leaveAsk} body={c.leaveBody} onClose={() => setAsking(false)}>
          <button onClick={() => setAsking(false)} className={btnGhostDark}>{c.stay}</button>
          <button onClick={() => { setAsking(false); onLeave(); }} className="inline-flex items-center gap-2 rounded-xl bg-[#E5484D] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#d13d42]"><SignOut className="h-4 w-4" /> {c.leaveConfirm}</button>
        </Dialog>
      )}
    </div>
  );
}

function AboutPanel({ w, c }: { w: PublicWebinar; c: (typeof COPY)['en'] }) {
  const lang = w.language;
  return (
    <div className="flex min-h-full flex-col p-5">
      <h2 className="font-bold leading-snug text-white">{w.title}</h2>
      <p className="mt-2 flex items-center gap-1.5 text-xs capitalize text-white/50"><Clock className="h-3.5 w-3.5" />{doualaDate(w.startAt, lang)} · {doualaTime(w.startAt, lang)}</p>
      {w.hosts.length > 0 && (
        <>
          <p className="mt-6 text-xs font-bold uppercase tracking-widest text-white/40">{c.speakers}</p>
          <ul className="mt-3 space-y-2.5">
            {w.hosts.map((name, i) => (
              <li key={name} className="flex items-center gap-3">
                <Avatar name={name} photo={w.speakers?.[i]?.photo ?? null} index={i} className="h-9 w-9 text-xs" />
                <span className="text-sm font-semibold text-white/90">{name}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-white/60">{w.description}</p>
      <div className="mt-auto pt-6">
        <div className="rounded-2xl bg-gradient-to-br from-primary to-[#1565C0] p-4 shadow-lg">
          <Users className="h-6 w-6 text-white/80" />
          <p className="mt-2 text-sm font-bold">{c.consultTitle}</p>
          <Link href="/consult" target="_blank" className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-primary transition-transform hover:-translate-y-0.5">{c.consultCta} <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
      </div>
    </div>
  );
}

/** "12:04" since the start, updated every second. */
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

// ── Shared pieces ──────────────────────────────────────────────────────────────

const btnPrimary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 hover:bg-[#1565C0] disabled:opacity-60';
const btnLight = 'inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#0B1220] transition-all hover:-translate-y-0.5 hover:bg-white/90';
const btnGhostDark = 'inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold text-white/80 transition-colors hover:bg-white/10';

/** The dark full-screen backdrop shared by the waiting, ended and message screens. */
export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-[#0B1220]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="drift absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-primary/40 blur-[120px]" />
        <div className="drift absolute -bottom-48 -right-32 h-[28rem] w-[28rem] rounded-full bg-secondary/25 blur-[120px]" style={{ animationDelay: '-4s' }} />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
      </div>
      {children}
    </div>
  );
}

function Message({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="rise relative z-10 mx-5 w-full max-w-md text-center">
      <div className="mx-auto mb-6 w-fit"><Brand /></div>
      <h1 className="text-2xl font-extrabold tracking-tight text-white">{title}</h1>
      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/65">{body}</p>
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}

function Dialog({ title, body, onClose, children }: { title: string; body: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fade fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="pop w-full max-w-sm rounded-2xl border border-white/10 bg-[#141D30] p-6 text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-white/50 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-white/65">{body}</p>
        <div className="mt-6 flex justify-end gap-2">{children}</div>
      </div>
    </div>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex shrink-0 items-center gap-2">
      <span className={`flex items-center justify-center rounded-lg bg-white shadow-sm ${compact ? 'h-8 w-8 p-1' : 'h-10 w-10 p-1.5'}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mjnlogo.png" alt="MJN Healthcare" className="h-full w-full object-contain" />
      </span>
      {!compact && <span className="text-sm font-bold text-white">MJN <span className="text-secondary">Healthcare</span></span>}
    </span>
  );
}
