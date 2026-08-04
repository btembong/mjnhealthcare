'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../lib/utils';
import { Sidebar, SidebarSection } from './sidebar';

// ── Inline SVG icons (keeps @mjn/ui dependency-free) ─────────────────────────

function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
    </svg>
  );
}

// ── Bottom tab item (portal only) ─────────────────────────────────────────────

function BottomTabItem({ item, onMenuOpen }: {
  item: { label: string; href: string; icon: React.ElementType; badge?: string | number };
  onMenuOpen?: never;
}) {
  const pathname = usePathname();
  const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        'relative flex flex-col items-center gap-0.5 flex-1 py-2 transition-colors',
        active ? 'text-primary' : 'text-muted-foreground',
      )}
    >
      {active && (
        <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-primary" />
      )}
      <div className="relative">
        <Icon size={22} {...({ weight: active ? 'duotone' : 'regular' } as any)} />
        {item.badge && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white leading-none">
            {Number(item.badge) > 9 ? '9+' : item.badge}
          </span>
        )}
      </div>
      <span className={cn('text-[10px] leading-none truncate max-w-[52px]', active ? 'font-semibold' : 'font-medium')}>
        {item.label}
      </span>
    </Link>
  );
}

function BottomMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center gap-0.5 flex-1 py-2 text-muted-foreground transition-colors"
    >
      <IconMenu />
      <span className="text-[10px] font-medium leading-none mt-0.5">More</span>
    </button>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type ConsultantCard = {
  name: string;
  role?: string;
  onMessage?: () => void;
};

type AppShellProps = {
  logo?: React.ReactNode;
  sections: SidebarSection[];
  sidebarFooter?: React.ReactNode;
  sidebarConsultant?: ConsultantCard;
  profileCompletion?: number;
  accent?: 'primary' | 'teal';
  topbar?: React.ReactNode;
  rightPanel?: React.ReactNode;
  mobileBottomNav?: boolean;   // show bottom tab bar on mobile (portal only)
  children: React.ReactNode;
  className?: string;
};

// ── AppShell ──────────────────────────────────────────────────────────────────

export function AppShell({
  logo,
  sections,
  sidebarFooter,
  sidebarConsultant,
  profileCompletion,
  accent,
  topbar,
  rightPanel,
  mobileBottomNav = false,
  children,
  className,
}: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Close drawer on route change
  const pathname = usePathname();
  React.useEffect(() => { setDrawerOpen(false); }, [pathname]);

  const sidebarFooterFull = (
    <div className="space-y-3">
      {sidebarConsultant && (
        <div className="rounded-xl border border-border bg-muted/40 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your Consultant</p>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
              {sidebarConsultant.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{sidebarConsultant.name}</p>
              <p className="text-xs text-muted-foreground">{sidebarConsultant.role ?? 'Case Consultant'}</p>
            </div>
            {sidebarConsultant.onMessage && (
              <button
                onClick={sidebarConsultant.onMessage}
                className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
              >
                Message
              </button>
            )}
          </div>
        </div>
      )}
      {profileCompletion !== undefined && (
        <div className="px-1">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Profile completion</p>
            <p className="text-xs font-semibold text-foreground">{profileCompletion}%</p>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${profileCompletion}%` }} />
          </div>
        </div>
      )}
      {sidebarFooter}
    </div>
  );

  // Bottom nav items — first 4 from section[0], rest via "More" drawer
  const bottomNavItems = sections[0]?.items?.slice(0, 4) ?? [];

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">

      {/* ── Desktop sidebar ────────────────────────────────────────────── */}
      <div className="hidden md:flex">
        <Sidebar
          logo={logo}
          sections={sections}
          accent={accent}
          footer={sidebarFooterFull}
        />
      </div>

      {/* ── Mobile drawer overlay ──────────────────────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer panel — slides from left */}
          <div className="absolute left-0 top-0 h-full w-72 shadow-2xl animate-in slide-in-from-left duration-200">
            <Sidebar
              logo={logo}
              sections={sections}
              accent={accent}
              onClose={() => setDrawerOpen(false)}
              footer={sidebarFooterFull}
            />
          </div>
        </div>
      )}

      {/* ── Main area ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Topbar */}
        {topbar && (
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-white px-3 sm:px-6 shadow-sm">
            {/* Hamburger — mobile only */}
            <button
              className="md:hidden shrink-0 flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted/60 transition-colors"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation menu"
            >
              <IconMenu />
            </button>

            {/* Logo — mobile only (sidebar is hidden) */}
            <div className="md:hidden shrink-0 flex items-center gap-1.5 mr-1">
              <img src="/mjnlogo.png" alt="MJN Healthcare" className="h-7 w-auto object-contain" />
            </div>

            {/* Consumer topbar content */}
            <div className="flex flex-1 items-center justify-between min-w-0">
              {topbar}
            </div>
          </header>
        )}

        {/* Content row */}
        <div className="flex flex-1 overflow-hidden">
          <main className={cn(
            'flex-1 overflow-y-auto',
            rightPanel ? 'p-4 sm:p-5 lg:p-6' : 'p-4 sm:p-6 lg:p-8',
            mobileBottomNav && 'pb-20 md:pb-6 lg:pb-8',
            className,
          )}>
            {children}
          </main>

          {/* Right rail — xl+ only */}
          {rightPanel && (
            <aside className="hidden xl:flex w-[288px] shrink-0 flex-col border-l border-border bg-white overflow-y-auto">
              {rightPanel}
            </aside>
          )}
        </div>
      </div>

      {/* ── Mobile bottom tab bar ─────────────────────────────────────── */}
      {mobileBottomNav && bottomNavItems.length > 0 && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex h-16 items-stretch border-t border-border bg-white shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
          {bottomNavItems.map((item) => (
            <BottomTabItem key={item.href} item={item} />
          ))}
          <BottomMenuButton onClick={() => setDrawerOpen(true)} />
        </nav>
      )}
    </div>
  );
}
