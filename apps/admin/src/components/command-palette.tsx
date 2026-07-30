'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  ChartLineUp, UsersThree, UsersFour, FileText, Robot, BookOpen,
  Briefcase, User, Tag, CalendarBlank, CurrencyDollar, MagnifyingGlass,
} from '@phosphor-icons/react';

const ITEMS = [
  { label: 'Dashboard', icon: ChartLineUp, href: '/', keywords: 'home overview metrics' },
  { label: 'Caseload', icon: UsersThree, href: '/caseload', keywords: 'engagements cases pipeline' },
  { label: 'Clients', icon: UsersFour, href: '/clients', keywords: 'persons candidates people' },
  { label: 'Documents', icon: FileText, href: '/documents', keywords: 'verify passport license credentials' },
  { label: 'AI Drafts', icon: Robot, href: '/drafts', keywords: 'review approve ai generated' },
  { label: 'Courses', icon: BookOpen, href: '/courses', keywords: 'academy training education' },
  { label: 'Leads', icon: UsersFour, href: '/leads', keywords: 'prospects inbound sales' },
  { label: 'Consultants', icon: Briefcase, href: '/consultants', keywords: 'partners payouts applications' },
  { label: 'Staff', icon: User, href: '/staff', keywords: 'team employees admins' },
  { label: 'Catalog', icon: Tag, href: '/catalog', keywords: 'services pricing items' },
  { label: 'Bookings', icon: CalendarBlank, href: '/bookings', keywords: 'appointments sessions calendar' },
  { label: 'Payments', icon: CurrencyDollar, href: '/payments', keywords: 'orders invoices revenue' },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 pt-[15vh] px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Command palette" className="flex flex-col">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <MagnifyingGlass className="h-4 w-4 text-muted-foreground shrink-0" />
            <Command.Input
              placeholder="Search pages, actions..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            <kbd className="hidden sm:flex h-5 items-center rounded border border-border bg-muted px-1.5 text-xs font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-72 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group
              heading={
                <span className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Navigation
                </span>
              }
            >
              {ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Command.Item
                    key={item.href}
                    value={`${item.label} ${item.keywords}`}
                    onSelect={() => navigate(item.href)}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground transition-colors data-[selected=true]:bg-muted/60 outline-none"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                      <Icon className="h-4 w-4 text-foreground/50" />
                    </div>
                    <span className="flex-1">{item.label}</span>
                    <kbd className="hidden sm:flex h-5 items-center rounded border border-border bg-muted px-1.5 text-xs text-muted-foreground">
                      ↵
                    </kbd>
                  </Command.Item>
                );
              })}
            </Command.Group>
          </Command.List>

          <div className="border-t border-border px-4 py-2.5 flex items-center gap-4 text-xs text-muted-foreground">
            <span><kbd className="font-medium text-foreground">↑↓</kbd> navigate</span>
            <span><kbd className="font-medium text-foreground">↵</kbd> open</span>
            <span><kbd className="font-medium text-foreground">Esc</kbd> close</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
