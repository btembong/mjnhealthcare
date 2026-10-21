'use client';

import { useEffect, useState } from 'react';
import { Play, Stethoscope, GraduationCap, Globe, Briefcase, Student, MonitorPlay } from '@mjn/ui';

export const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000') + '/api/v1';

export type Lang = 'en' | 'fr';
export type PublicWebinar = {
  slug: string; title: string; description: string; language: Lang; topic: string | null;
  startAt: string; durationMinutes: number; status: 'PUBLISHED' | 'LIVE' | 'ENDED' | 'CANCELLED';
  seatsLeft: number; hosts: string[]; hasReplay: boolean; cancelled?: boolean;
};

// ── Wording ──────────────────────────────────────────────────────────────────

export const TEXT = {
  en: {
    free: 'Free webinar', live: 'Live now', startsIn: 'Starts in', days: 'd', hours: 'h', minutes: 'min', seconds: 's',
    seatsLeft: (n: number) => (n === 1 ? '1 seat left' : `${n} seats left`), full: 'Full', minutes_long: (n: number) => `${n} min`,
    yourTime: 'your time', douala: 'Douala time', with: 'with', register: 'Save my seat', registerFree: 'Register free',
    watch: 'Watch the replay', english: 'English', french: 'Français',
  },
  fr: {
    free: 'Webinaire gratuit', live: 'En direct', startsIn: 'Commence dans', days: 'j', hours: 'h', minutes: 'min', seconds: 's',
    seatsLeft: (n: number) => (n === 1 ? '1 place restante' : `${n} places restantes`), full: 'Complet', minutes_long: (n: number) => `${n} min`,
    yourTime: 'votre heure', douala: 'heure de Douala', with: 'avec', register: 'Réserver ma place', registerFree: 'S’inscrire gratuitement',
    watch: 'Regarder le replay', english: 'English', french: 'Français',
  },
};

// ── Time ─────────────────────────────────────────────────────────────────────

const LOCALE: Record<Lang, string> = { en: 'en-GB', fr: 'fr-FR' };

export function doualaDate(iso: string, lang: Lang) {
  return new Date(iso).toLocaleDateString(LOCALE[lang], { timeZone: 'Africa/Douala', weekday: 'long', day: 'numeric', month: 'long' });
}
export function doualaTime(iso: string, lang: Lang) {
  return new Date(iso).toLocaleTimeString(LOCALE[lang], { timeZone: 'Africa/Douala', hour: '2-digit', minute: '2-digit', hour12: false });
}
/** The viewer's own clock, when it differs from Douala's. */
export function localTime(iso: string, lang: Lang): string | null {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const here = new Date(iso).toLocaleTimeString(LOCALE[lang], { hour: '2-digit', minute: '2-digit', hour12: false });
    return here === doualaTime(iso, lang) ? null : `${here} (${zone.split('/').pop()?.replace(/_/g, ' ')})`;
  } catch {
    return null;
  }
}
export function monthDay(iso: string, lang: Lang) {
  const d = new Date(iso);
  return {
    month: d.toLocaleDateString(LOCALE[lang], { timeZone: 'Africa/Douala', month: 'short' }).replace('.', ''),
    day: d.toLocaleDateString(LOCALE[lang], { timeZone: 'Africa/Douala', day: 'numeric' }),
    weekday: d.toLocaleDateString(LOCALE[lang], { timeZone: 'Africa/Douala', weekday: 'short' }).replace('.', ''),
  };
}

/**
 * Ticks every second; returns null once the moment has passed, and 'pending' until the page is in
 * the browser (the server's clock and the visitor's would otherwise disagree on the seconds).
 */
export function useCountdown(target: string | Date | null) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!target) return null;
  if (now === null) return 'pending' as const;
  const left = new Date(target).getTime() - now;
  if (left <= 0) return null;
  return { d: Math.floor(left / 86400000), h: Math.floor(left / 3600000) % 24, m: Math.floor(left / 60000) % 60, s: Math.floor(left / 1000) % 60, total: left };
}

// ── Pieces ───────────────────────────────────────────────────────────────────

export function Countdown({ target, lang, size = 'md', onDone }: { target: string | Date; lang: Lang; size?: 'md' | 'lg'; onDone?: () => void }) {
  const c = useCountdown(target);
  const t = TEXT[lang];
  useEffect(() => { if (!c && onDone) onDone(); }, [c, onDone]);
  if (!c) return null;
  const big = size === 'lg';
  if (c === 'pending') {
    const days = new Date(target).getTime() - Date.parse(new Date().toISOString()) > 86400000 ? 4 : 3;
    return (
      <div className="flex items-stretch gap-2" aria-hidden="true">
        {Array.from({ length: days }).map((_, i) => <div key={i} className={`shimmer rounded-xl ${big ? 'h-[4.75rem] w-[4.5rem]' : 'h-[3.6rem] w-[3.25rem]'}`} />)}
      </div>
    );
  }
  const cells: [number, string][] = [[c.d, t.days], [c.h, t.hours], [c.m, t.minutes], [c.s, t.seconds]];
  const shown = c.d > 0 ? cells : cells.slice(1);
  return (
    <div className="flex items-stretch gap-2" role="timer" aria-live="off">
      {shown.map(([value, unit]) => (
        <div key={unit} className={`flex flex-col items-center justify-center rounded-xl border border-border bg-white shadow-sm ${big ? 'min-w-[4.5rem] px-3 py-3' : 'min-w-[3.25rem] px-2 py-2'}`}>
          <span key={value} className={`tick font-extrabold tabular-nums text-foreground ${big ? 'text-3xl' : 'text-lg'}`}>{String(value).padStart(2, '0')}</span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{unit}</span>
        </div>
      ))}
    </div>
  );
}

export function LivePill({ lang }: { lang: Lang }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
      <span className="live-dot text-white" /> {TEXT[lang].live}
    </span>
  );
}

export function LangPill({ lang }: { lang: Lang }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-0.5 text-xs font-bold text-foreground">
      {lang === 'fr' ? 'FR' : 'EN'}<span className="font-medium text-muted-foreground">· {lang === 'fr' ? 'Français' : 'English'}</span>
    </span>
  );
}

export function DateTile({ iso, lang, tone = 'light' }: { iso: string; lang: Lang; tone?: 'light' | 'solid' }) {
  const { month, day, weekday } = monthDay(iso, lang);
  const solid = tone === 'solid';
  return (
    <div className={`flex w-16 shrink-0 flex-col items-center overflow-hidden rounded-2xl border text-center ${solid ? 'border-primary bg-primary text-white' : 'border-border bg-white'}`}>
      <span className={`w-full py-1 text-[11px] font-bold uppercase tracking-wider ${solid ? 'bg-white/15' : 'bg-primary/8 text-primary'}`}>{month}</span>
      <span className="pt-1 text-2xl font-extrabold leading-none">{day}</span>
      <span className={`pb-1.5 text-[11px] font-semibold capitalize ${solid ? 'text-white/75' : 'text-muted-foreground'}`}>{weekday}</span>
    </div>
  );
}

const initials = (name: string) => name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();

export function Speakers({ names, lang, compact = false }: { names: string[]; lang: Lang; compact?: boolean }) {
  if (names.length === 0) return null;
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        {names.slice(0, 3).map((n, i) => (
          <span key={n} className={`flex items-center justify-center rounded-full border-2 border-white font-bold text-white shadow-sm ${compact ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs'} ${i % 2 ? 'bg-secondary' : 'bg-primary'}`}>
            {initials(n)}
          </span>
        ))}
      </div>
      <p className={`min-w-0 truncate text-muted-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
        {TEXT[lang].with} <span className="font-semibold text-foreground">{names.join(', ')}</span>
      </p>
    </div>
  );
}

export function SeatsBar({ left, lang }: { left: number; lang: Lang }) {
  const t = TEXT[lang];
  return (
    <p className={`text-xs font-semibold ${left === 0 ? 'text-muted-foreground' : left <= 10 ? 'text-primary' : 'text-muted-foreground'}`}>
      {left === 0 ? t.full : t.seatsLeft(left)}
    </p>
  );
}

const TOPIC_ICON: [RegExp, React.ComponentType<{ className?: string; weight?: any }>][] = [
  [/nclex|exam|cbt|haad|dha|study/i, GraduationCap],
  [/uae|dataflow|licen|nmc|nmbi/i, Stethoscope],
  [/student|intern|university/i, Student],
  [/ireland|uk|us|canada|abroad|destination/i, Globe],
  [/career|job|salary|staff/i, Briefcase],
];
export function topicIcon(topic: string | null, title: string) {
  const text = `${topic ?? ''} ${title}`;
  return TOPIC_ICON.find(([re]) => re.test(text))?.[1] ?? MonitorPlay;
}

/** A designed poster for a replay: brand gradient, dotted texture, topic icon, play button. */
export function ReplayPoster({ w, minutes }: { w: PublicWebinar; minutes: string }) {
  const Icon = topicIcon(w.topic, w.title);
  return (
    <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-[#1565C0] to-secondary">
      <div className="dot-grid absolute inset-0 opacity-40 mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)' }} />
      <Icon className="drift absolute -right-4 -top-4 h-28 w-28 text-white/10" />
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-xl transition-transform duration-300 group-hover:scale-110">
        <Play className="h-6 w-6 translate-x-0.5 text-primary" weight="fill" />
      </span>
      <span className="absolute bottom-3 right-3 rounded-full bg-black/45 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">{minutes}</span>
      <span className="absolute bottom-3 left-3"><LangPill lang={w.language} /></span>
    </div>
  );
}

export function Shimmer({ className }: { className: string }) {
  return <div className={`shimmer rounded-2xl ${className}`} aria-hidden="true" />;
}
