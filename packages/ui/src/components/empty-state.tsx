import * as React from 'react';
import { cn } from '../lib/utils';

type EmptyStateProps = {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, subtitle, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
        <Icon className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <h4 className="font-semibold text-foreground">{title}</h4>
      {subtitle && <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
