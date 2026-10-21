'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarBlank, Clock, CheckCircle, MonitorPlay, ChatCircle, Translate, Play } from '@mjn/ui';
import {
  Countdown, Cover, LangPill, LivePill, SeatsBar, Speakers, TEXT, photosOf,
  doualaDate, doualaTime, localTime, type Lang, type PublicWebinar,
} from '../../../components/webinar-kit';

type Filter = 'all' | Lang;
const FILTERS: [Filter, string][] = [['all', 'All'], ['en', 'English'], ['fr', 'Français']];

export function WebinarsBrowser({ upcoming, replays }: { upcoming: PublicWebinar[]; replays: PublicWebinar[] }) {
  const [filter, setFilter] = useState<Filter>('all');

  // Remember the choice in the address, so a shared link opens on the same language.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('lang');
    if (q === 'en' || q === 'fr') setFilter(q);
  }, []);
  function choose(next: Filter) {
    setFilter(next);
    const url = new URL(window.location.href);
    if (next === 'all') url.searchParams.delete('lang'); else url.searchParams.set('lang', next);
    window.history.replaceState(null, '', url);
  }

  const shown = useMemo(() => upcoming.filter((w) => filter === 'all' || w.language === filter), [upcoming, filter]);
  const replayList = useMemo(() => replays.filter((w) => filter === 'all' || w.language === filter), [replays, filter]);
  const [next, ...rest] = shown;

  return (
    <main className="bg-background">
      {/* ── Header ── */}
      <section className="relative overflow-hidden border-b border-border bg-white pb-14 pt-32">
        <div className="dot-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[46rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6">
          <p className="rise inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary shadow-sm">
            <MonitorPlay className="h-3.5 w-3.5" /> Free webinars
          </p>
          <h1 className="rise mt-5 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl" style={{ animationDelay: '60ms' }}>
            Learn from people who have <span className="gradient-text">walked the path</span>
          </h1>
          <p className="rise mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground" style={{ animationDelay: '120ms' }}>
            Live sessions on licensing, exams and working abroad, hosted by MJN consultants. Ask your questions live, then watch the replay any time.
          </p>
          <div className="rise mt-8 flex flex-wrap items-center gap-4" style={{ animationDelay: '180ms' }}>
            <LanguageSwitch value={filter} onChange={choose} />
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Translate className="h-4 w-4" /> Each webinar runs in English or in French</span>
          </div>
        </div>
      </section>

      {/* ── Next up ── */}
      <section className="px-6 pt-14">
        <div className="mx-auto max-w-6xl">
          {next ? <Featured w={next} /> : <NothingScheduled filter={filter} />}
        </div>
      </section>

      {/* ── More upcoming ── */}
      {rest.length > 0 && (
        <section className="px-6 pt-12">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-5 text-xl font-bold text-foreground">Also coming up</h2>
            <ul className="grid gap-4 md:grid-cols-2">
              {rest.map((w, i) => (
                <li key={w.slug} className="rise" style={{ animationDelay: `${i * 70}ms` }}>
                  <UpcomingCard w={w} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Replays ── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">Watch the replays</h2>
              <p className="mt-1 text-sm text-muted-foreground">Every live session is recorded. Free for everyone, no sign-up.</p>
            </div>
          </div>
          {replayList.length === 0 ? (
            <div className="bg-white px-6 py-12 text-center shadow-sm">
              <Play className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-semibold text-foreground">Replays appear here after each webinar</p>
              <p className="mt-1 text-sm text-muted-foreground">Register for an upcoming session and you will be emailed the recording too.</p>
            </div>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {replayList.map((w, i) => (
                <li key={w.slug} className="rise" style={{ animationDelay: `${i * 60}ms` }}>
                  <Link href={`/webinars/${w.slug}`} className="lift group block h-full overflow-hidden bg-white shadow-sm">
                    <div className="relative overflow-hidden">
                      <Cover w={w} className="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]" />
                      <span className="absolute inset-0 flex items-center justify-center bg-[#0A2540]/0 opacity-0 transition-all duration-300 group-hover:bg-[#0A2540]/45 group-hover:opacity-100">
                        <span className="flex h-14 w-14 scale-90 items-center justify-center rounded-full bg-white shadow-xl transition-transform duration-300 group-hover:scale-100"><Play className="h-6 w-6 translate-x-0.5 text-primary" weight="fill" /></span>
                      </span>
                      <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">{TEXT[w.language].minutes_long(w.durationMinutes)}</span>
                    </div>
                    <div className="p-4">
                      <p className="line-clamp-2 font-bold leading-snug text-foreground transition-colors group-hover:text-primary">{w.title}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{doualaDate(w.startAt, w.language)}{w.hosts.length ? ` · ${w.hosts.join(', ')}` : ''}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── Why attend + consultation ── */}
      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1.2fr_1fr]">
          <div className="bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-foreground">What you get</h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                [ChatCircle, 'Ask live', 'Put your own question to the speaker during the session.'],
                [CalendarBlank, 'Reminders', 'A reminder the day before and an hour before, by email and WhatsApp.'],
                [Play, 'The replay', 'Missed it, or want to watch again? The recording is emailed to you.'],
                [CheckCircle, 'Free, no catch', 'No payment and no account. Just your name and email.'],
              ].map(([Icon, title, body]: any) => (
                <li key={title} className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary"><Icon className="h-5 w-5" /></span>
                  <span><span className="block text-sm font-bold text-foreground">{title}</span><span className="block text-sm text-muted-foreground">{body}</span></span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative overflow-hidden bg-primary/[0.05] p-8">
            <div className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
            <div className="relative">
              <h2 className="text-2xl font-bold text-foreground">Questions about your own case?</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Webinars cover the general picture. For your qualifications and destination, talk to an advisor one to one.</p>
              <Link href="/consult" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg">
                Book a consultation <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/** A segmented control whose highlight slides to the chosen option. */
function LanguageSwitch({ value, onChange }: { value: Filter; onChange: (f: Filter) => void }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [box, setBox] = useState<{ left: number; width: number } | null>(null);
  useEffect(() => {
    const el = refs.current[value];
    if (el) setBox({ left: el.offsetLeft, width: el.offsetWidth });
  }, [value]);
  return (
    <div role="radiogroup" aria-label="Language" className="relative inline-flex rounded-xl border border-border bg-muted/60 p-1">
      {box && <span className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ left: box.left, width: box.width }} />}
      {FILTERS.map(([key, label]) => (
        <button
          key={key}
          ref={(el) => { refs.current[key] = el; }}
          role="radio"
          aria-checked={value === key}
          onClick={() => onChange(key)}
          className={`relative z-10 rounded-lg px-4 py-1.5 text-sm font-bold transition-colors ${value === key ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function When({ w, compact = false }: { w: PublicWebinar; compact?: boolean }) {
  const t = TEXT[w.language];
  const [local, setLocal] = useState<string | null>(null);
  useEffect(() => setLocal(localTime(w.startAt, w.language)), [w.startAt, w.language]);
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 ${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
      <span className="flex items-center gap-1.5 capitalize"><CalendarBlank className="h-4 w-4 text-primary" />{doualaDate(w.startAt, w.language)}</span>
      <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /><span className="font-semibold text-foreground">{doualaTime(w.startAt, w.language)}</span> {t.douala}{local ? ` · ${local} ${t.yourTime}` : ''}</span>
    </div>
  );
}

function Featured({ w }: { w: PublicWebinar }) {
  const t = TEXT[w.language];
  const live = w.status === 'LIVE';
  return (
    <article className="rise relative overflow-hidden bg-white shadow-lg">
      <Link href={`/webinars/${w.slug}`} className="group block overflow-hidden lg:hidden">
        <Cover w={w} priority className="transition-transform duration-500 group-hover:scale-[1.02]" />
      </Link>
      <div className="grid gap-8 p-7 sm:p-9 lg:grid-cols-[minmax(0,26rem)_1fr_auto] lg:items-center">
        <Link href={`/webinars/${w.slug}`} className="group hidden overflow-hidden shadow-md lg:block">
          <Cover w={w} priority className="transition-transform duration-500 group-hover:scale-[1.03]" />
        </Link>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Next up</span>
            <LangPill lang={w.language} />
            {w.topic && <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">{w.topic}</span>}
          </div>
          <h2 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-[1.75rem]">{w.title}</h2>
          <p className="mt-3 line-clamp-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{w.description}</p>
          <div className="mt-5 space-y-4">
            <When w={w} />
            <Speakers names={w.hosts} photos={photosOf(w)} lang={w.language} />
          </div>
        </div>
        <div className="flex flex-col justify-between gap-6 bg-muted/50 p-5 lg:w-72">
          <div>
            {live ? <LivePill lang={w.language} /> : <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.startsIn}</p>}
            {live ? <LiveNote w={w} /> : <div className="mt-3"><Countdown target={w.startAt} lang={w.language} /></div>}
            <div className="mt-4"><SeatsBar left={w.seatsLeft} lang={w.language} /></div>
          </div>
          <Link
            href={`/webinars/${w.slug}`}
            className={`group inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold shadow-md transition-all ${w.seatsLeft === 0 ? 'bg-white text-muted-foreground' : 'bg-primary text-white hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg'}`}
          >
            {w.seatsLeft === 0 ? t.full : t.registerFree}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </article>
  );
}

/** While a webinar is live: how long it has been running, and that it is not too late to join. */
function LiveNote({ w }: { w: PublicWebinar }) {
  const [mins, setMins] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setMins(Math.max(0, Math.floor((Date.now() - new Date(w.startAt).getTime()) / 60000)));
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, [w.startAt]);
  const fr = w.language === 'fr';
  return (
    <div className="mt-4">
      <p className="text-2xl font-extrabold tabular-nums text-foreground">{mins === null ? '—' : fr ? `depuis ${mins} min` : `${mins} min in`}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{fr ? 'Il n’est pas trop tard : inscrivez-vous et rejoignez la séance en une minute.' : 'It’s not too late: register and join the session in a minute.'}</p>
    </div>
  );
}

function UpcomingCard({ w }: { w: PublicWebinar }) {
  const t = TEXT[w.language];
  return (
    <Link href={`/webinars/${w.slug}`} className="lift group flex h-full flex-col overflow-hidden bg-white shadow-sm">
      <div className="relative overflow-hidden">
        <Cover w={w} className="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-5">
        <div className="flex items-center gap-2"><LangPill lang={w.language} />{w.status === 'LIVE' && <LivePill lang={w.language} />}</div>
        <h3 className="mt-2 line-clamp-2 font-bold leading-snug text-foreground transition-colors group-hover:text-primary">{w.title}</h3>
        <div className="mt-2"><When w={w} compact /></div>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <Speakers names={w.hosts} photos={photosOf(w)} lang={w.language} compact />
          <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-primary">{w.seatsLeft === 0 ? t.full : t.register} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
        </div>
      </div>
    </Link>
  );
}

function NothingScheduled({ filter }: { filter: Filter }) {
  return (
    <div className="rise relative overflow-hidden bg-white px-8 py-14 text-center shadow-sm">
      <CalendarBlank className="mx-auto h-10 w-10 text-primary/60" />
      <h2 className="mt-4 text-xl font-bold text-foreground">
        {filter === 'fr' ? 'Aucun webinaire en français prévu pour le moment' : filter === 'en' ? 'No English webinar scheduled right now' : 'No webinar scheduled right now'}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">New dates are announced here. In the meantime, watch a replay below or talk to an advisor.</p>
      <Link href="/consult" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">Book a consultation <ArrowRight className="h-4 w-4" /></Link>
    </div>
  );
}
