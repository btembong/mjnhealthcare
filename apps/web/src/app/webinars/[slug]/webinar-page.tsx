'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, CalendarBlank, CalendarPlus, Clock, Globe, CircleNotch, Monitor, BellRinging,
  EnvelopeSimple, Play, ShieldCheck, Users, DownloadSimple,
} from '@mjn/ui';
import {
  API, Countdown, LangPill, LivePill, Speakers, TEXT,
  doualaDate, doualaTime, localTime, topicIcon, type Lang, type PublicWebinar,
} from '../../../components/webinar-kit';

// ── Wording for this page, in the webinar's own language ──────────────────────

const COPY = {
  en: {
    back: 'All webinars', about: 'About this webinar', speakers: 'Speakers', how: 'How it works',
    steps: [
      ['Register in a minute', 'Free. We email you a personal link to join.'],
      ['Get reminded', 'The day before and one hour before, by email and WhatsApp.'],
      ['Join from your browser', 'No app to install. Watch, listen and ask questions.'],
    ],
    formTitle: 'Register for this webinar', formSub: 'Free · takes a minute',
    name: 'Full name', email: 'Email', whatsapp: 'WhatsApp number', whatsappHint: 'For the reminder an hour before. Optional.',
    profession: 'Profession', destination: 'Where you want to work', question: 'A question for the speaker', questionHint: 'Optional. The speaker sees it before the session.',
    choose: 'Choose…', consent: 'Also send me news about future webinars and services. You can unsubscribe at any time.',
    privacy: 'We use your details to run this webinar and send your reminders and the replay.',
    submit: 'Register', submitting: 'Saving your seat…',
    done: 'You’re registered', doneSub: (e: string) => `We’ve sent your confirmation to ${e}. Your personal join link is in that email too.`,
    doneAgain: 'You were already registered', doneAgainSub: (e: string) => `We’ve sent your join link to ${e} again.`,
    addCal: 'Add to calendar', google: 'Google', outlook: 'Outlook / Apple', openJoin: 'Open my join page', joinNow: 'Join now',
    liveBanner: 'This webinar is live now. Register and join straight away.',
    full: 'This webinar is full', fullSub: 'All seats are taken. Watch the replay afterwards, or see other webinars.',
    ended: 'This webinar has ended', endedSub: 'The replay will be posted here shortly. Registered attendees are emailed when it is ready.',
    cancelled: 'This webinar was cancelled', cancelledSub: 'We are sorry. Have a look at our other upcoming webinars.',
    replay: 'Replay', replayLoading: 'Loading the replay…', replayFailed: 'The replay could not be loaded. Please refresh the page.',
    others: 'See other webinars', consult: 'Questions about your own case?', consultSub: 'Talk to an advisor one to one.', consultCta: 'Book a consultation',
    length: 'Length', language: 'Language', when: 'Date', time: 'Time',
    professions: ['Nurse', 'Midwife', 'Physician', 'Pharmacist', 'Allied health professional', 'Student', 'Other'],
    destinations: ['UAE', 'United Kingdom', 'United States', 'Ireland', 'Canada', 'Other', 'Not sure yet'],
    err: { name: 'Enter your full name.', email: 'Enter a valid email address.', generic: 'Something went wrong. Please try again.' },
  },
  fr: {
    back: 'Tous les webinaires', about: 'À propos de ce webinaire', speakers: 'Intervenants', how: 'Comment ça marche',
    steps: [
      ['Inscrivez-vous en une minute', 'Gratuit. Nous vous envoyons un lien personnel pour rejoindre.'],
      ['Recevez des rappels', 'La veille et une heure avant, par e-mail et WhatsApp.'],
      ['Rejoignez depuis votre navigateur', 'Aucune application à installer. Regardez, écoutez et posez vos questions.'],
    ],
    formTitle: 'Inscription au webinaire', formSub: 'Gratuit · une minute',
    name: 'Nom complet', email: 'E-mail', whatsapp: 'Numéro WhatsApp', whatsappHint: 'Pour le rappel une heure avant. Facultatif.',
    profession: 'Profession', destination: 'Où souhaitez-vous travailler ?', question: 'Une question pour l’intervenant', questionHint: 'Facultatif. L’intervenant la voit avant la séance.',
    choose: 'Choisir…', consent: 'Envoyez-moi aussi des nouvelles des prochains webinaires et services. Désinscription possible à tout moment.',
    privacy: 'Nous utilisons vos informations pour organiser ce webinaire et vous envoyer les rappels et le replay.',
    submit: 'S’inscrire', submitting: 'Réservation de votre place…',
    done: 'Vous êtes inscrit(e)', doneSub: (e: string) => `Votre confirmation a été envoyée à ${e}. Votre lien personnel pour rejoindre s’y trouve aussi.`,
    doneAgain: 'Vous étiez déjà inscrit(e)', doneAgainSub: (e: string) => `Nous avons renvoyé votre lien à ${e}.`,
    addCal: 'Ajouter au calendrier', google: 'Google', outlook: 'Outlook / Apple', openJoin: 'Ouvrir ma page de connexion', joinNow: 'Rejoindre',
    liveBanner: 'Ce webinaire est en direct. Inscrivez-vous et rejoignez-le tout de suite.',
    full: 'Ce webinaire est complet', fullSub: 'Toutes les places sont prises. Regardez le replay ensuite, ou découvrez nos autres webinaires.',
    ended: 'Ce webinaire est terminé', endedSub: 'Le replay sera bientôt disponible ici. Les inscrits reçoivent un e-mail dès qu’il est prêt.',
    cancelled: 'Ce webinaire a été annulé', cancelledSub: 'Nous en sommes désolés. Découvrez nos autres webinaires.',
    replay: 'Replay', replayLoading: 'Chargement du replay…', replayFailed: 'Le replay n’a pas pu être chargé. Actualisez la page.',
    others: 'Voir les autres webinaires', consult: 'Une question sur votre dossier ?', consultSub: 'Parlez à un conseiller en tête-à-tête.', consultCta: 'Réserver une consultation',
    length: 'Durée', language: 'Langue', when: 'Date', time: 'Heure',
    professions: ['Infirmier(ère)', 'Sage-femme', 'Médecin', 'Pharmacien(ne)', 'Professionnel(le) paramédical(e)', 'Étudiant(e)', 'Autre'],
    destinations: ['Émirats arabes unis', 'Royaume-Uni', 'États-Unis', 'Irlande', 'Canada', 'Autre', 'Pas encore décidé'],
    err: { name: 'Indiquez votre nom complet.', email: 'Indiquez une adresse e-mail valide.', generic: 'Une erreur est survenue. Veuillez réessayer.' },
  },
};

const field = 'w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground outline-none transition-shadow placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/10';
const labelCls = 'mb-1.5 block text-sm font-semibold text-foreground';

export function WebinarPage({ initial }: { initial: PublicWebinar }) {
  const [w, setW] = useState(initial);
  const lang: Lang = w.language;
  const c = COPY[lang];
  const t = TEXT[lang];
  const Icon = topicIcon(w.topic, w.title);
  const [local, setLocal] = useState<string | null>(null);
  useEffect(() => setLocal(localTime(w.startAt, lang)), [w.startAt, lang]);

  // Seats and status change while the page is open; look again every minute.
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`${API}/webinars/public/${w.slug}`);
        if (res.ok) setW(await res.json());
      } catch { /* keep what we have */ }
    }, 60000);
    return () => clearInterval(timer);
  }, [w.slug]);

  const ended = w.status === 'ENDED';
  const live = w.status === 'LIVE';
  const paragraphs = useMemo(() => w.description.split(/\n{2,}|\r\n\r\n/).map((p) => p.trim()).filter(Boolean), [w.description]);

  return (
    <main className="bg-background">
      {/* ── Header ── */}
      <section className="relative overflow-hidden border-b border-border bg-white pb-10 pt-28">
        <div className="dot-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_65%)]" />
        <Icon className="drift pointer-events-none absolute -right-10 top-16 hidden h-72 w-72 text-primary/[0.05] lg:block" />
        <div className="relative mx-auto max-w-6xl px-6">
          <Link href="/resources/webinars" className="rise inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> {c.back}
          </Link>
          <div className="rise mt-5 flex flex-wrap items-center gap-2" style={{ animationDelay: '50ms' }}>
            {live ? <LivePill lang={lang} /> : <span className="rounded-full bg-primary/8 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">{t.free}</span>}
            <LangPill lang={lang} />
            {w.topic && <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">{w.topic}</span>}
          </div>
          <h1 className="rise mt-4 max-w-4xl text-3xl font-extrabold leading-[1.12] tracking-tight text-foreground sm:text-[2.6rem]" style={{ animationDelay: '100ms' }}>{w.title}</h1>
          <dl className="rise mt-7 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4" style={{ animationDelay: '150ms' }}>
            {[
              [CalendarBlank, c.when, <span key="d" className="capitalize">{doualaDate(w.startAt, lang)}</span>],
              [Clock, c.time, <span key="t">{doualaTime(w.startAt, lang)} <span className="font-normal text-muted-foreground">{t.douala}</span>{local && <span className="block text-xs font-normal text-muted-foreground">{local} {t.yourTime}</span>}</span>],
              [Monitor, c.length, t.minutes_long(w.durationMinutes)],
              [Globe, c.language, lang === 'fr' ? 'Français' : 'English'],
            ].map(([I, label, value]: any) => (
              <div key={label} className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-primary shadow-sm"><I className="h-5 w-5" /></span>
                <div className="min-w-0"><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt><dd className="mt-0.5 text-sm font-bold text-foreground">{value}</dd></div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Body ── */}
      <section className="px-6 py-12">
        <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[1fr_400px]">
          <div className="min-w-0 space-y-10">
            {ended && w.hasReplay && <Replay slug={w.slug} c={c} />}

            <div className="rise">
              <h2 className="text-xl font-bold text-foreground">{c.about}</h2>
              <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-foreground/80">
                {paragraphs.map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
              </div>
            </div>

            {w.hosts.length > 0 && (
              <div className="rise">
                <h2 className="text-xl font-bold text-foreground">{c.speakers}</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {w.hosts.map((name, i) => (
                    <li key={name} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm">
                      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-md ${i % 2 ? 'bg-secondary' : 'bg-primary'}`}>
                        {name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                      <span><span className="block font-bold text-foreground">{name}</span><span className="block text-sm text-muted-foreground">MJN Healthcare</span></span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!ended && (
              <div className="rise">
                <h2 className="text-xl font-bold text-foreground">{c.how}</h2>
                <ol className="mt-4 grid gap-3 sm:grid-cols-3">
                  {c.steps.map(([title, body], i) => (
                    <li key={title} className="relative rounded-2xl border border-border bg-white p-5 shadow-sm">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{i + 1}</span>
                      <p className="mt-3 font-bold text-foreground">{title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* ── The registration card ── */}
          <aside className="lg:sticky lg:top-24">
            <SideCard w={w} c={c} />
          </aside>
        </div>
      </section>
    </main>
  );
}

function SideCard({ w, c }: { w: PublicWebinar; c: (typeof COPY)['en'] }) {
  const lang = w.language;
  if (w.cancelled || w.status === 'CANCELLED') return <Notice title={c.cancelled} body={c.cancelledSub} c={c} />;
  if (w.status === 'ENDED') {
    return (
      <div className="space-y-4">
        {!w.hasReplay && <Notice title={c.ended} body={c.endedSub} c={c} />}
        <ConsultCard c={c} />
      </div>
    );
  }
  if (w.seatsLeft === 0) return <Notice title={c.full} body={c.fullSub} c={c} />;
  return (
    <div className="rise overflow-hidden rounded-3xl border border-border bg-white shadow-xl" style={{ animationDelay: '120ms' }}>
      <div className="h-1 bg-gradient-to-r from-primary via-[#1565C0] to-secondary" />
      {w.status === 'LIVE' ? (
        <p className="flex items-center gap-2 bg-primary/[0.06] px-6 py-3 text-sm font-semibold text-primary"><span className="live-dot text-primary" /> {c.liveBanner}</p>
      ) : (
        <div className="border-b border-border bg-muted/40 px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{TEXT[lang].startsIn}</p>
          <div className="mt-2"><Countdown target={w.startAt} lang={lang} /></div>
        </div>
      )}
      <RegisterForm w={w} c={c} />
    </div>
  );
}

function RegisterForm({ w, c }: { w: PublicWebinar; c: (typeof COPY)['en'] }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', profession: '', destination: '', question: '', marketingConsent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState('');
  const [done, setDone] = useState<null | { already: boolean; token?: string; email: string }>(null);
  const set = (k: keyof typeof form, v: any) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })); };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = c.err.name;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) next.email = c.err.email;
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true); setFailed('');
    try {
      const source = new URLSearchParams(window.location.search).get('utm_source') ?? undefined;
      const res = await fetch(`${API}/webinars/public/${w.slug}/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, source }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message ?? c.err.generic);
      setDone({ already: !!body.already, token: body.token, email: form.email.trim() });
    } catch (err: any) {
      setFailed(err.message ?? c.err.generic);
    } finally {
      setBusy(false);
    }
  }

  if (done) return <Registered w={w} c={c} done={done} />;

  return (
    <form onSubmit={submit} noValidate className="space-y-4 p-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">{c.formTitle}</h2>
        <p className="text-sm text-muted-foreground">{c.formSub}</p>
      </div>
      <Field id="wr-name" label={c.name} error={errors.name}>
        <input id="wr-name" autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} className={field} aria-invalid={!!errors.name} />
      </Field>
      <Field id="wr-email" label={c.email} error={errors.email}>
        <input id="wr-email" type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={field} aria-invalid={!!errors.email} />
      </Field>
      <Field id="wr-phone" label={c.whatsapp} hint={c.whatsappHint}>
        <input id="wr-phone" type="tel" autoComplete="tel" placeholder="+237 6…" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={field} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <Field id="wr-prof" label={c.profession}>
          <select id="wr-prof" value={form.profession} onChange={(e) => set('profession', e.target.value)} className={field}>
            <option value="">{c.choose}</option>
            {c.professions.map((p) => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field id="wr-dest" label={c.destination}>
          <select id="wr-dest" value={form.destination} onChange={(e) => set('destination', e.target.value)} className={field}>
            <option value="">{c.choose}</option>
            {c.destinations.map((p) => <option key={p}>{p}</option>)}
          </select>
        </Field>
      </div>
      <Field id="wr-q" label={c.question} hint={c.questionHint}>
        <textarea id="wr-q" rows={2} value={form.question} onChange={(e) => set('question', e.target.value)} className={`${field} resize-none`} />
      </Field>
      <label className="flex cursor-pointer items-start gap-3 text-sm text-muted-foreground">
        <input type="checkbox" checked={form.marketingConsent} onChange={(e) => set('marketingConsent', e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-primary" />
        <span>{c.consent}</span>
      </label>
      {failed && <p role="alert" className="rounded-xl bg-muted px-4 py-3 text-sm font-semibold text-foreground">{failed}</p>}
      <button type="submit" disabled={busy} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg disabled:translate-y-0 disabled:opacity-70">
        {busy ? <><CircleNotch className="h-4 w-4 animate-spin" /> {c.submitting}</> : <>{c.submit} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}
      </button>
      <p className="flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> {c.privacy}</p>
    </form>
  );
}

function Registered({ w, c, done }: { w: PublicWebinar; c: (typeof COPY)['en']; done: { already: boolean; token?: string; email: string } }) {
  const joinPath = done.token ? `/webinars/join/${done.token}` : null;
  const google = useMemo(() => {
    const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const start = new Date(w.startAt);
    const end = new Date(start.getTime() + w.durationMinutes * 60000);
    const details = joinPath ? `${window.location.origin}${joinPath}` : '';
    return `https://calendar.google.com/calendar/render?${new URLSearchParams({ action: 'TEMPLATE', text: w.title, dates: `${stamp(start)}/${stamp(end)}`, details }).toString()}`;
  }, [w, joinPath]);

  return (
    <div className="p-6 text-center">
      <svg viewBox="0 0 52 52" className="pop check-draw mx-auto h-16 w-16" aria-hidden="true">
        <circle cx="26" cy="26" r="25" fill="#00A896" opacity="0.12" />
        <circle cx="26" cy="26" r="19" fill="#00A896" />
        <path d="M17 27l6 6 12-13" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <h2 className="rise mt-4 text-xl font-extrabold text-foreground" style={{ animationDelay: '200ms' }}>{done.already ? c.doneAgain : c.done}</h2>
      <p className="rise mt-2 text-sm leading-relaxed text-muted-foreground" style={{ animationDelay: '260ms' }}>
        <EnvelopeSimple className="mr-1 inline h-4 w-4 align-[-3px] text-primary" />
        {done.already ? c.doneAgainSub(done.email) : c.doneSub(done.email)}
      </p>
      {joinPath && (
        <div className="rise mt-6 space-y-3 text-left" style={{ animationDelay: '320ms' }}>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{c.addCal}</p>
          <div className="grid grid-cols-2 gap-2">
            <a href={google} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/[0.03]">
              <CalendarPlus className="h-4 w-4 text-primary" /> {c.google}
            </a>
            <a href={`${API}/webinars/attend/${done.token}/calendar.ics`} className="flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/[0.03]">
              <DownloadSimple className="h-4 w-4 text-primary" /> {c.outlook}
            </a>
          </div>
          <Link href={joinPath} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-primary/90">
            {w.status === 'LIVE' ? c.joinNow : c.openJoin} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      )}
      <p className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground"><BellRinging className="h-4 w-4" /> {COPY[w.language].steps[1][1]}</p>
    </div>
  );
}

function Replay({ slug, c }: { slug: string; c: (typeof COPY)['en'] }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    fetch(`${API}/webinars/public/${slug}/replay`).then((r) => (r.ok ? r.json() : Promise.reject())).then((b) => setUrl(b.url)).catch(() => setFailed(true));
  }, [slug]);
  return (
    <div className="rise">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-foreground"><Play className="h-5 w-5 text-primary" weight="fill" /> {c.replay}</h2>
      <div className="relative aspect-video overflow-hidden rounded-3xl bg-[#0B1220] shadow-xl ring-1 ring-black/5">
        {url ? (
          <video src={url} controls playsInline preload="metadata" className="h-full w-full" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-white/70">
            {failed ? <p className="text-sm">{c.replayFailed}</p> : <><CircleNotch className="h-7 w-7 animate-spin" /><p className="text-sm">{c.replayLoading}</p></>}
          </div>
        )}
      </div>
    </div>
  );
}

function Notice({ title, body, c }: { title: string; body: string; c: (typeof COPY)['en'] }) {
  return (
    <div className="rise rounded-3xl border border-border bg-white p-6 shadow-md">
      <p className="text-lg font-bold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      <Link href="/resources/webinars" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">{c.others} <ArrowRight className="h-4 w-4" /></Link>
    </div>
  );
}

function ConsultCard({ c }: { c: (typeof COPY)['en'] }) {
  return (
    <div className="rise relative overflow-hidden rounded-3xl border border-primary/15 bg-primary/[0.04] p-6">
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative">
        <Users className="h-7 w-7 text-primary" />
        <p className="mt-3 text-lg font-bold text-foreground">{c.consult}</p>
        <p className="mt-1 text-sm text-muted-foreground">{c.consultSub}</p>
        <Link href="/consult" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-primary/90">{c.consultCta} <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </div>
  );
}

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>{label}</label>
      {children}
      {error ? <p role="alert" className="mt-1.5 text-xs font-semibold text-foreground">{error}</p> : hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
