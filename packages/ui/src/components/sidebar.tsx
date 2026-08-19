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
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function Sidebar({ logo, sections, footer, accent = 'primary', onClose, collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const activeColor = accent === 'teal' ? 'bg-teal-50 text-teal-700' : 'bg-primary/10 text-primary';
  const activeDot = accent === 'teal' ? 'bg-teal-500' : 'bg-primary';

  return (
    <aside className={cn(
      'flex h-screen flex-col border-r border-border bg-white transition-all duration-200',
      collapsed ? 'w-16' : 'w-64',
    )}>
      {/* Logo area */}
      <div className={cn('flex h-16 items-center border-b border-border', collapsed ? 'justify-center px-2' : 'gap-3 px-5')}>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            {logo ?? (
              <div className="flex items-center gap-2">
                <img src="/mjnlogo.png" alt="MJN Healthcare" className="h-8 w-auto object-contain" />
                <span className="font-semibold text-foreground truncate">MJN Health</span>
              </div>
            )}
          </div>
        )}
        {collapsed && (
          <img src="/mjnlogo.png" alt="MJN Healthcare" className="h-7 w-auto object-contain" />
        )}
        {onToggleCollapse && !onClose && (
          <button
            onClick={onToggleCollapse}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 transition-colors shrink-0',
              collapsed && 'absolute right-0 translate-x-full translate-y-0 top-4 z-10 bg-white border border-border shadow-sm rounded-l-none rounded-r-lg',
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              {collapsed
                ? <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                : <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              }
            </svg>
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 transition-colors shrink-0"
            aria-label="Close menu"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Nav sections */}
      <nav className={cn('flex-1 overflow-y-auto py-4', collapsed ? 'px-2' : 'px-3')}>
        {sections.map((section, si) => (
          <div key={si} className={si > 0 ? 'mt-6' : ''}>
            {section.title && !collapsed && (
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {section.title}
              </p>
            )}
            {section.title && collapsed && (
              <div className="mb-2 border-t border-border" />
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
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'group flex items-center rounded-xl text-sm font-medium transition-all',
                        collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                        active
                          ? activeColor
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                      )}
                    >
                      <Icon
                        {...({ weight: active ? 'duotone' : 'regular' } as any)}
                        size={22}
                        className={cn(
                          'shrink-0 transition-colors',
                          active ? '' : 'group-hover:text-foreground',
                        )}
                      />
                      {!collapsed && <span className="flex-1">{item.label}</span>}
                      {!collapsed && item.badge && (
                        <span
                          className={cn(
                            'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
                            active ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                      {collapsed && item.badge && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                          {Number(item.badge) > 9 ? '9+' : item.badge}
                        </span>
                      )}
                      {!collapsed && active && (
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
      {footer && !collapsed && (
        <div className="border-t border-border p-4">{footer}</div>
      )}
    </aside>
  );
}
