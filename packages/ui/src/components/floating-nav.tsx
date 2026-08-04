'use client';

import * as React from 'react';
import Link from 'next/link';
import { CaretDown, X, List, ArrowRight } from '@phosphor-icons/react';
import { cn } from '../lib/utils';

export type NavSubItem = {
  label: string;
  href: string;
  desc?: string;
  icon?: React.ReactNode;
};

export type NavItem = {
  label: string;
  href?: string;
  external?: boolean;
  megaMenu?: NavSubItem[];
};

type FloatingNavProps = {
  logo?: React.ReactNode;
  items: NavItem[];
  cta?: React.ReactNode;
  className?: string;
  lang?: 'en' | 'fr';
  onLangChange?: (lang: 'en' | 'fr') => void;
};

export function FloatingNav({ logo, items, cta, className }: FloatingNavProps) {
  const [scrolled, setScrolled]       = React.useState(false);
  const [activeMenu, setActiveMenu]   = React.useState<string | null>(null);
  const [mobileOpen, setMobileOpen]   = React.useState(false);
  const [mobileExp, setMobileExp]     = React.useState<string | null>(null);
  const closeTimer                    = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef                        = React.useRef<HTMLDivElement>(null);

  // scroll → add stronger shadow, keep same width/shape
  React.useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Escape
  React.useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setActiveMenu(null); setMobileOpen(false); }
    };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, []);

  // click-outside for mobile
  React.useEffect(() => {
    if (!mobileOpen) return;
    const fn = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setMobileOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [mobileOpen]);

  const openMenu    = (label: string) => { if (closeTimer.current) clearTimeout(closeTimer.current); setActiveMenu(label); };
  const schedClose  = () => { closeTimer.current = setTimeout(() => setActiveMenu(null), 150); };

  return (
    <div ref={navRef} className={cn('fixed top-0 left-0 right-0 z-50', className)}>

      {/* ── Full-width header bar ── */}
      <div
        className={cn(
          'w-full transition-all duration-300 border-b',
          scrolled
            ? 'bg-white shadow-md border-border/80'
            : 'bg-white border-border/50 shadow-sm',
        )}
      >
          {/* ── Main row ─────────────────────────────────────────────────── */}
          <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-6">

            {/* Logo */}
            <div className="shrink-0">
              {logo ?? (
                <Link href="/" className="group flex items-center gap-3">
                  <img src="/mjnlogo.png" alt="MJN Healthcare" className="h-10 w-auto object-contain" />
                  <div className="flex flex-col leading-none">
                    <span className="text-[16px] font-extrabold tracking-tight text-foreground transition-colors group-hover:text-primary">
                      MJN Healthcare
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                      Academy &amp; Professional Services
                    </span>
                  </div>
                </Link>
              )}
            </div>

            {/* Desktop nav items */}
            <ul className="hidden items-center gap-0 lg:flex">
              {items.map((item) => {
                const isOpen = activeMenu === item.label;
                return (
                  <li
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => item.megaMenu && openMenu(item.label)}
                    onMouseLeave={() => item.megaMenu && schedClose()}
                  >
                    {item.href && !item.megaMenu ? (
                      <Link
                        href={item.href}
                        target={item.external ? '_blank' : undefined}
                        className="group relative flex items-center px-3.5 py-2 text-[13px] font-medium text-foreground/65 transition-colors hover:text-foreground"
                      >
                        {item.label}
                        {/* underline slide-in */}
                        <span className="absolute bottom-0 left-3.5 right-3.5 h-px scale-x-0 rounded-full bg-primary transition-transform duration-200 group-hover:scale-x-100" />
                      </Link>
                    ) : (
                      <button
                        aria-haspopup="true"
                        aria-expanded={isOpen}
                        className={cn(
                          'group relative flex items-center gap-0.5 px-3.5 py-2 text-[13px] font-medium transition-colors',
                          isOpen ? 'text-primary' : 'text-foreground/65 hover:text-foreground',
                        )}
                      >
                        {item.label}
                        <CaretDown
                          className={cn(
                            'h-3 w-3 shrink-0 transition-transform duration-200',
                            isOpen ? 'rotate-180 text-primary' : 'text-foreground/35',
                          )}
                        />
                        <span
                          className={cn(
                            'absolute bottom-0 left-3.5 right-3.5 h-px rounded-full bg-primary transition-transform duration-200',
                            isOpen ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
                          )}
                        />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* CTA area */}
            <div className="hidden items-center lg:flex">
              {cta}
            </div>

            {/* Mobile hamburger */}
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-white/60 text-foreground transition-colors hover:bg-muted lg:hidden"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </button>
          </div>

          {/* ── Mega menu — drops below the bar, inside the same rounded card ── */}
          {items.map((item) => {
            if (!item.megaMenu) return null;
            const isOpen = activeMenu === item.label;
            return (
              <div
                key={item.label}
                onMouseEnter={() => openMenu(item.label)}
                onMouseLeave={() => schedClose()}
                className={cn(
                  'overflow-hidden transition-all duration-200',
                  isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none',
                )}
              >
                <div className="border-t border-border/60 px-5 py-5">
                  <div
                    className={cn(
                      'grid gap-x-4 gap-y-0.5',
                      item.megaMenu.length <= 4  ? 'grid-cols-2' :
                      item.megaMenu.length <= 8  ? 'grid-cols-3' : 'grid-cols-4',
                    )}
                  >
                    {item.megaMenu.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setActiveMenu(null)}
                        className="group/s flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/70"
                      >
                        {sub.icon && (
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/8 text-primary transition-colors group-hover/s:bg-primary group-hover/s:text-white">
                            {sub.icon}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-semibold text-foreground transition-colors group-hover/s:text-primary leading-snug">
                            {sub.label}
                          </p>
                          {sub.desc && (
                            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground line-clamp-1">
                              {sub.desc}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* bottom CTA strip for large menus */}
                  {item.megaMenu.length > 6 && (
                    <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                      <p className="text-xs text-muted-foreground">
                        Not sure where to start?
                      </p>
                      <Link
                        href="/get-started"
                        onClick={() => setActiveMenu(null)}
                        className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-primary/90"
                      >
                        Book Free Consultation <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      {/* ── Mobile slide panel ──────────────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 top-[68px] bg-black/20 backdrop-blur-sm transition-opacity duration-200 lg:hidden',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setMobileOpen(false)}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed right-3 top-[72px] bottom-4 w-full max-w-[340px] overflow-y-auto rounded-xl bg-white shadow-2xl ring-1 ring-black/8 transition-all duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0 pointer-events-none',
        )}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3">
            <img src="/mjnlogo.png" alt="MJN Healthcare" className="h-9 w-auto object-contain" />
            <div className="flex flex-col leading-none">
              <span className="text-[15px] font-extrabold text-foreground">MJN Healthcare</span>
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Academy &amp; Professional Services</span>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Nav list */}
        <nav className="space-y-0.5 p-3">
          {items.map((item) => (
            <div key={item.label}>
              {item.megaMenu ? (
                <>
                  <button
                    onClick={() => setMobileExp(mobileExp === item.label ? null : item.label)}
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-[13.5px] font-medium text-foreground/75 transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {item.label}
                    <CaretDown
                      className={cn(
                        'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
                        mobileExp === item.label && 'rotate-180 text-primary',
                      )}
                    />
                  </button>
                  {mobileExp === item.label && (
                    <div className="mx-2 mb-1 mt-0.5 rounded-xl border border-border/50 bg-muted/30 p-2 space-y-0.5">
                      {item.megaMenu.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] font-medium text-foreground/75 transition-colors hover:bg-white hover:text-primary"
                        >
                          {sub.icon && (
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-primary shadow-sm ring-1 ring-border/40">
                              {sub.icon}
                            </span>
                          )}
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href ?? '#'}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center rounded-xl px-4 py-3 text-[13.5px] font-medium text-foreground/75 transition-colors hover:bg-muted hover:text-foreground"
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Mobile CTA */}
        <div className="border-t border-border p-4">
          {cta}
        </div>
      </div>
    </div>
  );
}
