import * as T from '../notification/email-templates';

const WEB = () => process.env.WEB_URL ?? 'http://localhost:3001';

export type WebinarInfo = { title: string; slug: string; startAt: Date; durationMinutes: number; language: 'en' | 'fr'; hosts: string[] };
export type Seat = { name: string; joinToken: string };

export const joinUrl = (token: string) => `${WEB()}/webinars/join/${token}`;
export const pageUrl = (slug: string) => `${WEB()}/webinars/${slug}`;

const firstName = (name: string) => (name ?? '').trim().split(/\s+/)[0] || name;
const fr = (w: WebinarInfo) => w.language === 'fr';

function details(w: WebinarInfo) {
  const f = fr(w);
  const hosts = w.hosts.length ? T.esc(w.hosts.join(', ')) : 'MJN Healthcare';
  return T.infoTable([
    T.row(f ? 'Quand' : 'When', `<strong>${T.doualaWhen(w.startAt, f)}</strong> (${f ? 'heure de Douala' : 'Douala time'})`),
    T.row(f ? 'Durée' : 'Length', `${w.durationMinutes} min`),
    T.row(f ? 'Intervenant' : 'Speaker', hosts, true),
  ]);
}

function shell(w: WebinarInfo, body: string) {
  return fr(w)
    ? T.shell(body, 'Vous recevez cet e-mail car vous vous êtes inscrit(e) à un webinaire gratuit de MJN Healthcare.')
    : T.shell(body, 'You are receiving this email because you registered for a free MJN Healthcare webinar.');
}

function hello(w: WebinarInfo, s: Seat) {
  const name = T.esc(firstName(s.name));
  return fr(w) ? T.greetingFr(name) : T.greeting(name);
}

/** A link that adds the webinar to Google Calendar. */
export function googleCalendarUrl(w: WebinarInfo, s: Seat) {
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const end = new Date(w.startAt.getTime() + w.durationMinutes * 60000);
  const q = new URLSearchParams({ action: 'TEMPLATE', text: w.title, dates: `${stamp(w.startAt)}/${stamp(end)}`, details: `${fr(w) ? 'Rejoindre' : 'Join'}: ${joinUrl(s.joinToken)}` });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

/** A calendar file (.ics) with the person's own join link. */
export function calendarFile(w: WebinarInfo, s: Seat, uid: string) {
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const end = new Date(w.startAt.getTime() + w.durationMinutes * 60000);
  const text = (v: string) => v.replace(/\\/g, '\\\\').replace(/[,;]/g, (c) => `\\${c}`).replace(/\r?\n/g, '\\n');
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MJN Healthcare//Webinars//EN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}@mjnhealthcare.com`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(w.startAt)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${text(w.title)}`,
    `DESCRIPTION:${text(`${fr(w) ? 'Rejoindre' : 'Join'}: ${joinUrl(s.joinToken)}`)}`,
    `URL:${joinUrl(s.joinToken)}`,
    'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', 'DESCRIPTION:Webinar', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR', '',
  ].join('\r\n');
}

export function confirmationEmail(w: WebinarInfo, s: Seat) {
  const f = fr(w);
  return {
    subject: f ? `Inscription confirmée : ${w.title}` : `You're registered: ${w.title}`,
    html: shell(w,
      hello(w, s) +
      T.label(f ? 'Webinaire gratuit' : 'Free webinar') +
      T.h1(f ? 'Votre place est réservée' : 'Your seat is saved') +
      T.p(f ? `Merci de votre inscription à <strong>${T.esc(w.title)}</strong>.` : `Thank you for registering for <strong>${T.esc(w.title)}</strong>.`) +
      details(w) +
      T.btn(f ? 'Mon lien pour rejoindre' : 'My link to join', joinUrl(s.joinToken)) +
      T.p(f
        ? `Ce lien est personnel : gardez cet e-mail. Il s’ouvre 15 minutes avant le début. <a href="${googleCalendarUrl(w, s)}" style="color:#0F4C81;">Ajouter à Google Agenda</a> · le fichier calendrier est joint.`
        : `This link is just for you, so keep this email. It opens 15 minutes before the start. <a href="${googleCalendarUrl(w, s)}" style="color:#0F4C81;">Add to Google Calendar</a> · a calendar file is attached.`) +
      T.pSmall(f ? 'Nous vous enverrons un rappel la veille et une heure avant.' : 'We will remind you the day before and one hour before.'),
    ),
  };
}

export function reminderEmail(w: WebinarInfo, s: Seat, when: '24h' | '1h') {
  const f = fr(w);
  const soon = when === '24h' ? (f ? 'demain' : 'tomorrow') : (f ? 'dans une heure' : 'in one hour');
  return {
    subject: f ? `Rappel : ${w.title} commence ${soon}` : `Reminder: ${w.title} starts ${soon}`,
    html: shell(w,
      hello(w, s) +
      T.label(f ? 'Rappel' : 'Reminder') +
      T.h1(f ? `Votre webinaire commence ${soon}` : `Your webinar starts ${soon}`) +
      T.p(`<strong>${T.esc(w.title)}</strong>`) +
      details(w) +
      T.btn(f ? 'Rejoindre le webinaire' : 'Join the webinar', joinUrl(s.joinToken)) +
      T.pSmall(f
        ? 'Le lien s’ouvre 15 minutes avant. Une connexion stable suffit : vous n’avez pas besoin de caméra ni de micro.'
        : 'The link opens 15 minutes before. A steady connection is all you need: no camera or microphone required.'),
    ),
  };
}

export function reminderWhatsApp(w: WebinarInfo, s: Seat) {
  return fr(w)
    ? `MJN Healthcare : votre webinaire « ${w.title} » commence dans une heure. Rejoindre : ${joinUrl(s.joinToken)}`
    : `MJN Healthcare: your webinar "${w.title}" starts in one hour. Join: ${joinUrl(s.joinToken)}`;
}

export function movedEmail(w: WebinarInfo, s: Seat, previous: Date) {
  const f = fr(w);
  return {
    subject: f ? `Nouvelle date : ${w.title}` : `New time: ${w.title}`,
    html: shell(w,
      hello(w, s) +
      T.label(f ? 'Changement d’horaire' : 'Time changed') +
      T.h1(f ? 'Votre webinaire a une nouvelle date' : 'Your webinar has a new time') +
      T.p(f
        ? `<strong>${T.esc(w.title)}</strong> avait lieu le ${T.doualaWhen(previous, true)}. Votre place est conservée.`
        : `<strong>${T.esc(w.title)}</strong> was set for ${T.doualaWhen(previous)}. Your seat is kept.`) +
      details(w) +
      T.btn(f ? 'Mon lien pour rejoindre' : 'My link to join', joinUrl(s.joinToken)),
    ),
  };
}

export function cancelledEmail(w: WebinarInfo, s: Seat, reason: string) {
  const f = fr(w);
  return {
    subject: f ? `Annulé : ${w.title}` : `Cancelled: ${w.title}`,
    html: shell(w,
      hello(w, s) +
      T.label(f ? 'Annulation' : 'Cancelled') +
      T.h1(f ? 'Ce webinaire est annulé' : 'This webinar is cancelled') +
      T.p(f
        ? `Nous sommes désolés : <strong>${T.esc(w.title)}</strong>, prévu le ${T.doualaWhen(w.startAt, true)}, n’aura pas lieu.`
        : `We are sorry: <strong>${T.esc(w.title)}</strong>, planned for ${T.doualaWhen(w.startAt)}, will not take place.`) +
      (reason ? T.quote(T.esc(reason)) : '') +
      T.btn(f ? 'Voir les autres webinaires' : 'See other webinars', `${WEB()}/resources/webinars`),
    ),
  };
}

export function replayEmail(w: WebinarInfo, s: Seat, attended: boolean) {
  const f = fr(w);
  const consult = `${WEB()}/consult`;
  return {
    subject: attended
      ? (f ? `Merci d’avoir participé : ${w.title}` : `Thank you for joining: ${w.title}`)
      : (f ? `Le replay est disponible : ${w.title}` : `The replay is ready: ${w.title}`),
    html: shell(w,
      hello(w, s) +
      T.label(f ? 'Replay' : 'Replay') +
      T.h1(attended
        ? (f ? 'Merci d’avoir participé' : 'Thank you for joining')
        : (f ? 'Nous ne vous avons pas vu — voici le replay' : 'Sorry we missed you — here is the replay')) +
      T.p(attended
        ? (f ? `Vous pouvez revoir <strong>${T.esc(w.title)}</strong> quand vous le souhaitez.` : `You can watch <strong>${T.esc(w.title)}</strong> again whenever you like.`)
        : (f ? `Vous n’avez pas pu assister à <strong>${T.esc(w.title)}</strong> ? Le replay complet est en ligne.` : `Couldn’t make it to <strong>${T.esc(w.title)}</strong>? The full recording is online.`)) +
      T.btn(f ? 'Regarder le replay' : 'Watch the replay', pageUrl(w.slug)) +
      T.divider() +
      T.p(f
        ? 'Vous avez une question sur votre propre dossier ? Réservez une consultation avec un de nos conseillers.'
        : 'Have a question about your own situation? Book a consultation with one of our advisors.') +
      T.btn(f ? 'Réserver une consultation' : 'Book a consultation', consult),
    ),
  };
}
