'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

export type TourStep = {
  /** Matches an element's `data-tour` attribute. Omit for a centred card. */
  target?: string;
  title: string;
  body: string;
  /** Drop the step when the target is not on screen, instead of showing it centred. */
  skipIfMissing?: boolean;
};

export type TourDef = { title: string; steps: TourStep[] };

export type TourLabels = {
  next: string;
  back: string;
  done: string;
  skip: string;
  stepOf: (current: number, total: number) => string;
  help: string;
  helpTitle: string;
  startPageTour: string;
  walkthrough: string;
  noGuide: string;
};

// ── Target lookup ─────────────────────────────────────────────────────────────

function findVisible(target: string): HTMLElement | null {
  const els = document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`);
  for (const el of Array.from(els)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max));

// ── Tour overlay ──────────────────────────────────────────────────────────────

const PAD = 6;
const GAP = 14;
const EDGE = 12;

function Tour({ steps, labels, onClose }: { steps: TourStep[]; labels: TourLabels; onClose: () => void }) {
  const [index, setIndex] = React.useState(0);
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const [resolved, setResolved] = React.useState(false);
  const [cardH, setCardH] = React.useState(200);
  const [viewport, setViewport] = React.useState({ w: window.innerWidth, h: window.innerHeight });
  const dirRef = React.useRef(1);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const primaryRef = React.useRef<HTMLButtonElement>(null);
  const titleId = React.useId();

  // Kept in refs so a parent re-render does not restart the current step.
  const stepsRef = React.useRef(steps);
  const closeRef = React.useRef(onClose);
  stepsRef.current = steps;
  closeRef.current = onClose;

  const step = steps[index];
  const isLast = index === steps.length - 1;

  const go = React.useCallback((delta: number) => {
    dirRef.current = delta;
    const next = index + delta;
    if (next >= stepsRef.current.length) { closeRef.current(); return; }
    setIndex(Math.max(0, next));
  }, [index]);

  // Find, scroll to and measure the step's target.
  React.useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let el: HTMLElement | null = null;
    let tries = 0;
    // The first step may start while the page is still rendering its data.
    const maxTries = index === 0 ? 20 : 3;
    const steps = stepsRef.current;
    const onClose = closeRef.current;
    const current = steps[index];

    setResolved(false);
    setRect(null);

    const measure = () => {
      if (cancelled) return;
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      if (el) setRect(el.getBoundingClientRect());
    };

    const attempt = () => {
      if (cancelled) return;
      if (!current.target) { setResolved(true); return; }
      el = findVisible(current.target);
      if (el) {
        const tall = el.getBoundingClientRect().height > window.innerHeight * 0.7;
        el.scrollIntoView({ block: tall ? 'start' : 'center', inline: 'nearest' });
        requestAnimationFrame(() => { measure(); if (!cancelled) setResolved(true); });
        return;
      }
      tries += 1;
      if (tries < maxTries) { timer = setTimeout(attempt, 120); return; }
      if (current.skipIfMissing) {
        const next = index + dirRef.current;
        if (next >= steps.length) onClose();
        else if (next < 0) { dirRef.current = 1; setIndex(index + 1); }
        else setIndex(next);
        return;
      }
      setResolved(true);
    };

    attempt();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [index]);

  React.useLayoutEffect(() => {
    const h = cardRef.current?.offsetHeight;
    if (h && h !== cardH) setCardH(h);
  });

  React.useEffect(() => {
    if (resolved) primaryRef.current?.focus({ preventScroll: true });
  }, [resolved, index]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); }
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  // Card position
  const { w: vw, h: vh } = viewport;
  const mobile = vw < 640;
  const cardW = Math.min(360, vw - EDGE * 2);
  let cardStyle: React.CSSProperties;

  if (mobile) {
    const targetInLowerHalf = !!rect && rect.top + rect.height / 2 > vh / 2;
    cardStyle = targetInLowerHalf
      ? { left: EDGE, right: EDGE, top: EDGE }
      : { left: EDGE, right: EDGE, bottom: EDGE + 68 };
  } else if (!rect) {
    cardStyle = { width: cardW, left: (vw - cardW) / 2, top: Math.max(EDGE, (vh - cardH) / 2) };
  } else {
    const centredLeft = clamp(rect.left + rect.width / 2 - cardW / 2, EDGE, vw - cardW - EDGE);
    const besideTop = clamp(rect.top, EDGE, vh - cardH - EDGE);
    if (vh - rect.bottom >= cardH + GAP + EDGE) {
      cardStyle = { width: cardW, left: centredLeft, top: rect.bottom + GAP };
    } else if (rect.top >= cardH + GAP + EDGE) {
      cardStyle = { width: cardW, left: centredLeft, top: rect.top - cardH - GAP };
    } else if (vw - rect.right >= cardW + GAP + EDGE) {
      cardStyle = { width: cardW, left: rect.right + GAP, top: besideTop };
    } else if (rect.left >= cardW + GAP + EDGE) {
      cardStyle = { width: cardW, left: rect.left - cardW - GAP, top: besideTop };
    } else {
      cardStyle = { width: cardW, left: vw - cardW - 16, top: vh - cardH - 16 };
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      {/* Blocks clicks on the page while the tour is open */}
      <div className={cn('absolute inset-0', !rect && 'bg-slate-900/55')} />

      {rect && (
        <div
          className="pointer-events-none absolute rounded-2xl ring-2 ring-white/80 transition-all duration-200 motion-reduce:transition-none"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.55)',
          }}
        />
      )}

      {resolved && (
        <div
          ref={cardRef}
          className="absolute rounded-2xl border border-border bg-white p-5 shadow-2xl"
          style={cardStyle}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold text-muted-foreground">{labels.stepOf(index + 1, steps.length)}</p>
            <button
              onClick={onClose}
              aria-label={labels.skip}
              className="-mr-1 -mt-1 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <h2 id={titleId} className="mt-1 text-base font-bold leading-snug text-foreground">{step.title}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>

          <div className="mt-4 flex gap-1" aria-hidden="true">
            {steps.map((_, i) => (
              <span key={i} className={cn('h-1 flex-1 rounded-full', i <= index ? 'bg-primary' : 'bg-muted')} />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            {isLast ? <span /> : (
              <button onClick={onClose} className="text-xs font-semibold text-muted-foreground hover:text-foreground">
                {labels.skip}
              </button>
            )}
            <div className="flex items-center gap-2">
              {index > 0 && (
                <button
                  onClick={() => go(-1)}
                  className="rounded-xl border border-border px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted/50"
                >
                  {labels.back}
                </button>
              )}
              <button
                ref={primaryRef}
                onClick={() => go(1)}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
              >
                {isLast ? labels.done : labels.next}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}

// ── Help button + tour controller ─────────────────────────────────────────────

type TourHelpProps = {
  tours: Record<string, TourDef>;
  /** Shown once, on the first visit to any page. */
  welcomeKey?: string;
  /** Tour for the page currently on screen, if it has one. */
  pageKey?: string | null;
  /** Tours already seen on this account. `null` while the account is loading. */
  completed: string[] | null;
  onComplete: (key: string) => void;
  /** False while the page shell is still loading. */
  ready: boolean;
  /** Per-user browser key, so a tour is not replayed if saving to the account fails. */
  storageKey: string;
  labels: TourLabels;
  support?: { label: string; href: string };
};

function readLocal(storageKey: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((k) => typeof k === 'string') : [];
  } catch { return []; }
}

export function TourHelp({
  tours, welcomeKey, pageKey, completed, onComplete, ready, storageKey, labels, support,
}: TourHelpProps) {
  const pathname = usePathname();
  const [active, setActive] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [localDone, setLocalDone] = React.useState<string[]>([]);
  const autoStartedFor = React.useRef<string | null>(null);

  React.useEffect(() => { setLocalDone(readLocal(storageKey)); }, [storageKey]);
  React.useEffect(() => { setOpen(false); }, [pathname]);

  const isDone = (key: string) => (completed ?? []).includes(key) || localDone.includes(key);
  const loaded = ready && completed !== null;
  const autoKey =
    welcomeKey && tours[welcomeKey] && !isDone(welcomeKey) ? welcomeKey
    : pageKey && tours[pageKey] && !isDone(pageKey) ? pageKey
    : null;

  // Start at most one tour automatically per page visit.
  React.useEffect(() => {
    if (!loaded || active || !autoKey || autoStartedFor.current === pathname) return;
    const timer = setTimeout(() => {
      autoStartedFor.current = pathname;
      setActive(autoKey);
    }, 700);
    return () => clearTimeout(timer);
  }, [loaded, active, autoKey, pathname]);

  const finish = () => {
    const key = active;
    setActive(null);
    if (!key) return;
    if (!localDone.includes(key)) {
      const next = [...localDone, key];
      setLocalDone(next);
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* ignore */ }
    }
    onComplete(key);
  };

  const start = (key: string) => {
    setOpen(false);
    autoStartedFor.current = pathname;
    setActive(key);
  };

  const pageTour = pageKey ? tours[pageKey] : undefined;
  const activeTour = active ? tours[active] : undefined;

  return (
    <div className="relative">
      <button
        data-tour="help-button"
        onClick={() => setOpen((v) => !v)}
        aria-label={labels.help}
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground shadow-sm transition hover:bg-muted/50 hover:text-foreground"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M6.2 6.1a1.9 1.9 0 1 1 2.9 1.6c-.7.45-1.1.9-1.1 1.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="8" cy="11.9" r="0.9" fill="currentColor" />
          <circle cx="8" cy="8" r="6.6" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
            <div className="border-b border-border px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{labels.helpTitle}</p>
              {pageTour && <p className="mt-0.5 text-sm font-bold text-foreground">{pageTour.title}</p>}
            </div>

            {pageTour ? (
              <ol className="max-h-64 space-y-3 overflow-y-auto px-4 py-3">
                {pageTour.steps.map((s, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground">{s.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="px-4 py-4 text-xs text-muted-foreground">{labels.noGuide}</p>
            )}

            <div className="space-y-2 border-t border-border p-3">
              {pageTour && pageKey && (
                <button
                  onClick={() => start(pageKey)}
                  className="w-full rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-white transition-colors hover:bg-primary/90"
                >
                  {labels.startPageTour}
                </button>
              )}
              {welcomeKey && tours[welcomeKey] && (
                <button
                  onClick={() => start(welcomeKey)}
                  className="w-full rounded-xl border border-border px-3 py-2.5 text-xs font-bold text-foreground transition-colors hover:bg-muted/50"
                >
                  {labels.walkthrough}
                </button>
              )}
              {support && (
                <Link
                  href={support.href}
                  onClick={() => setOpen(false)}
                  className="block w-full rounded-xl px-3 py-2 text-center text-xs font-bold text-primary hover:underline"
                >
                  {support.label}
                </Link>
              )}
            </div>
          </div>
        </>
      )}

      {activeTour && <Tour key={active} steps={activeTour.steps} labels={labels} onClose={finish} />}
    </div>
  );
}
