'use client';

import * as React from 'react';
import { Play, Pause, Star, MapPin } from '@phosphor-icons/react';

type Testimonial = {
  name: string;
  role: string;
  route: string;
  destination: string;
  quote: string;
  rating: number;
  initials: string;
  color: string;   // hex — drives gradient on left panel AND subtle tint on right
  photo?: string;
  videoSrc?: string;
  posterSrc?: string;
};

const testimonials: Testimonial[] = [
  {
    name: 'Constance Che A.',
    role: 'Registered Nurse (DHA)',
    route: 'Cameroon → Dubai, UAE',
    destination: 'DHA Nurse · Dubai',
    quote:
      'My journey was smooth and stress-free, all thanks to MJN. Everything happened exactly as they said. I travelled to Dubai, took the exam in the second week, and passed first attempt.',
    rating: 5,
    initials: 'CC',
    color: '#0F4C81',
    photo: '/constanceche.webp',
  },
  {
    name: 'Effery Asiedu',
    role: 'Registered Nurse (DOH · USRN)',
    route: 'Ghana → UAE & United States',
    destination: 'DOH Nurse · UAE + NCLEX Passed',
    quote:
      'MJN played a pivotal role in my UAE licence, then continued to mentor me through every step of NCLEX. Thanks to their immense support, I successfully passed the NCLEX exam.',
    rating: 5,
    initials: 'EA',
    color: '#059669',
    photo: '/jeffreyasiedu.webp',
  },
  {
    name: 'Atangch Pascaline S.',
    role: 'Registered Nurse',
    route: 'Cameroon → United States',
    destination: 'NCLEX Eligibility · Approved',
    quote:
      'My eligibility letter was returned twice and rejected before MJN submitted it. It was approved in no time. MJN has been the bridge from the point of giving up to success.',
    rating: 5,
    initials: 'AP',
    color: '#7c3aed',
    photo: '/atangchpascaline.webp',
  },
  {
    name: 'Vonvog Langmia N.',
    role: 'Registered Nurse (DOH)',
    route: 'Cameroon → UAE',
    destination: 'DOH Nurse · UAE',
    quote:
      'Despite the delays, DataFlow setbacks, and my own slow responses, MJN remained steadfast and committed throughout. May God bless your team with the spirit of dedication.',
    rating: 5,
    initials: 'VL',
    color: '#00A896',
    photo: '/vonvonglangmia.webp',
  },
  {
    name: 'Tita M. Louis',
    role: 'Staff Nurse (DHA)',
    route: 'Cameroon → Dubai, UAE',
    destination: 'DHA Staff Nurse · Dubai',
    quote:
      'The benefits of MJN cannot be overemphasised. I was followed up through DataFlow, supported from Cameroon, received on arrival, and helped to build a powerful CV for job search.',
    rating: 5,
    initials: 'TL',
    color: '#d97706',
    photo: '/titam.webp',
  },
  {
    name: 'Sarah Danso',
    role: 'Staff Nurse (DHA)',
    route: 'Ghana → Dubai, UAE',
    destination: 'DHA Staff Nurse · Dubai',
    quote:
      'MJN Healthcare has been the best link to me — contributing to my successful documentation and the assurance of arriving at my desired destination.',
    rating: 5,
    initials: 'SD',
    color: '#0F4C81',
    photo: '/sarahdanso.webp',
  },
  {
    name: 'Richard',
    role: 'Staff Nurse (DHA)',
    route: 'Ghana → Dubai, UAE',
    destination: 'DHA Staff Nurse · Dubai',
    quote:
      'I thank MJN so much for their immense contribution towards my DataFlow and licence application. Despite the difficulty, they stood by me till I had my licence in less than two months.',
    rating: 5,
    initials: 'R',
    color: '#059669',
    photo: '/richard.webp',
  },
];

// Duplicate for seamless infinite loop
const items = [...testimonials, ...testimonials];

function VideoCard({ t }: { t: Testimonial }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const hasVideo = Boolean(t.videoSrc);

  const toggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v || !hasVideo) return;
    if (playing) { v.pause(); setPlaying(false); }
    else { v.play(); setPlaying(true); }
  };

  // Hex → very light rgba tint for the right panel
  const hex = t.color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const tint = `rgba(${r},${g},${b},0.06)`;

  return (
    <article
      className="group flex w-[520px] flex-shrink-0 cursor-default overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-border md:w-[580px]"
    >
      {/* ── Left: video / poster ─────────────────────────────────────────── */}
      <div
        role="button"
        tabIndex={hasVideo ? 0 : -1}
        aria-label={hasVideo ? `Play ${t.name}'s story` : undefined}
        onClick={toggle}
        onKeyDown={(e) => e.key === 'Enter' && toggle(e)}
        className="relative w-[190px] flex-shrink-0 overflow-hidden md:w-[210px]"
        style={{ minHeight: 300 }}
      >
        {hasVideo ? (
          <video
            ref={videoRef}
            src={t.videoSrc}
            poster={t.posterSrc}
            loop
            playsInline
            preload="none"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : t.photo ? (
          <img
            src={t.photo}
            alt={t.name}
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
        ) : (
          /* Gradient placeholder — replace inner div with <video> when recordings are ready */
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(160deg, ${t.color}ee 0%, ${t.color}99 60%, ${t.color}44 100%)`,
            }}
          >
            <span
              className="absolute inset-0 flex items-center justify-center text-8xl font-black select-none"
              style={{ color: 'rgba(255,255,255,0.12)' }}
            >
              {t.initials}
            </span>
          </div>
        )}

        {/* Bottom-to-top gradient for label legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Play/pause button — only shown when video exists */}
        {hasVideo && (
          <span className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
            {playing
              ? <Pause className="h-3.5 w-3.5 fill-current text-gray-800" />
              : <Play className="ml-0.5 h-3.5 w-3.5 fill-current text-gray-800" />
            }
          </span>
        )}

        {/* Destination label */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/90 drop-shadow">
            {t.destination}
          </p>
        </div>
      </div>

      {/* ── Right: quote + profile ────────────────────────────────────────── */}
      <div
        className="flex flex-1 flex-col justify-between p-4 md:p-5"
        style={{ background: `linear-gradient(135deg, ${tint} 0%, rgba(255,255,255,0) 100%)` }}
      >
        {/* Stars */}
        <div className="mb-3 flex gap-0.5">
          {Array.from({ length: t.rating }).map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          ))}
        </div>

        {/* Quote */}
        <p className="flex-1 text-[13px] leading-relaxed text-slate-600">
          "{t.quote}"
        </p>

        {/* Profile */}
        <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${t.color}cc, ${t.color}88)` }}
          >
            {t.initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{t.name}</p>
            <p className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3 w-3" />
              {t.role} · {t.route}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export function TestimonialCarousel() {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const posRef = React.useRef(0);
  const pausedRef = React.useRef(false);
  const rafRef = React.useRef<number>(0);

  React.useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const SPEED = 0.6; // px per frame (~36px/s at 60fps)

    const tick = () => {
      if (!pausedRef.current) {
        posRef.current += SPEED;
        // When we've scrolled exactly one copy's worth, snap silently back to 0
        const half = el.scrollWidth / 2;
        if (posRef.current >= half) posRef.current -= half;
        el.scrollLeft = posRef.current;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    const pause = () => { pausedRef.current = true; };
    const resume = () => { pausedRef.current = false; };

    el.addEventListener('mouseenter', pause);
    el.addEventListener('mouseleave', resume);
    el.addEventListener('touchstart', pause, { passive: true });
    el.addEventListener('touchend', resume);

    return () => {
      cancelAnimationFrame(rafRef.current);
      el.removeEventListener('mouseenter', pause);
      el.removeEventListener('mouseleave', resume);
      el.removeEventListener('touchstart', pause);
      el.removeEventListener('touchend', resume);
    };
  }, []);

  return (
    <div
      ref={trackRef}
      className="flex gap-5 overflow-x-hidden px-6 py-3 md:gap-6 md:px-8"
      style={{ scrollbarWidth: 'none' }}
      aria-label="Testimonial carousel"
    >
      {items.map((t, i) => (
        <VideoCard key={`${t.name}-${i}`} t={t} />
      ))}
    </div>
  );
}
