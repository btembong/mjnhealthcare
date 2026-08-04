'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../lib/utils';

export type SidebarItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
};

export type SidebarSection = {
  title?: string;
  items: SidebarItem[];
};

type SidebarProps = {
  logo?: React.ReactNode;
  sections: SidebarSection[];
  footer?: React.ReactNode;
  accent?: 'primary' | 'teal';
  onClose?: () => void;
};

export function Sidebar({ logo, sections, footer, accent = 'primary', onClose }: SidebarProps) {
  const pathname = usePathname();
  const activeColor = accent === 'teal' ? 'bg-teal-50 text-teal-700' : 'bg-primary/10 text-primary';
  const activeDot = accent === 'teal' ? 'bg-teal-500' : 'bg-primary';

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-white">
      {/* Logo area */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <div className="flex-1">
          {logo ?? (
            <div className="flex items-center gap-2">
              <img src="/mjnlogo.png" alt="MJN Healthcare" className="h-8 w-auto object-contain" />
              <span className="font-semibold text-foreground">MJN Health</span>
            </div>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 transition-colors"
            aria-label="Close menu"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section, si) => (
          <div key={si} className={si > 0 ? 'mt-6' : ''}>
            {section.title && (
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                        active
                          ? activeColor
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                      )}
                    >
                      <Icon
                        {...({ weight: active ? 'duotone' : 'regular' } as any)}
                        size={18}
                        className={cn(
                          'shrink-0 transition-colors',
                          active ? '' : 'group-hover:text-foreground',
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
                            active ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                      {active && (
                        <span className={cn('ml-auto h-1.5 w-1.5 rounded-full', activeDot)} />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      {footer && (
        <div className="border-t border-border p-4">{footer}</div>
      )}
    </aside>
  );
}
