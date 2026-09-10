import * as React from 'react';
import { cn } from '../lib/utils';

type EmptyStateProps = {
  /** Pass any Solar icon from @mjn/ui — rendered at Bold-Duotone automatically */
  icon: React.ComponentType<{ className?: string; weight?: string }>;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  /** Icon accent colour — controls the glow, ring, and icon tint */
  accent?: 'primary' | 'teal' | 'amber' | 'rose' | 'violet' | 'emerald';
};

const accentMap: Record<string, { ring: string; glow: string; icon: string }> = {
  primary: {
    ring: 'ring-primary/20',
    glow: 'bg-primary/8',
    icon: 'text-primary',
  },
  teal: {
    ring: 'ring-teal-500/20',
    glow: 'bg-teal-400/8',
    icon: 'text-teal-500',
  },
  amber: {
    ring: 'ring-amber-500/20',
    glow: 'bg-amber-400/8',
    icon: 'text-amber-500',
  },
  rose: {
    ring: 'ring-rose-500/20',
    glow: 'bg-rose-400/8',
    icon: 'text-rose-500',
  },
  violet: {
    ring: 'ring-violet-500/20',
    glow: 'bg-violet-400/8',
    icon: 'text-violet-500',
  },
  emerald: {
    ring: 'ring-emerald-500/20',
    glow: 'bg-emerald-400/8',
    icon: 'text-emerald-500',
  },
};

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
  className,
  accent = 'primary',
}: EmptyStateProps) {
  const a = accentMap[accent] ?? accentMap.primary;

  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {/* Icon container — gradient ring + duotone icon */}
      <div className="relative mb-5">
        {/* Outer glow ring */}
        <div className={cn('absolute inset-0 rounded-3xl blur-xl', a.glow)} />
        <div
          className={cn(
            'relative flex h-20 w-20 items-center justify-center rounded-3xl bg-white ring-2 shadow-sm',
            a.ring,
          )}
        >
          {/* Solar Bold-Duotone at 40×40 */}
          <Icon weight="duotone" className={cn('h-10 w-10', a.icon)} />
        </div>
      </div>

      <h4 className="text-base font-semibold text-foreground">{title}</h4>
      {subtitle && (
        <p className="mt-1.5 max-w-xs text-sm text-muted-foreground leading-relaxed">
          {subtitle}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
