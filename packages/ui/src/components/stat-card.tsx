'use client';

import * as React from 'react';
import { cn } from '../lib/utils';

type StatCardProps = {
  label: string;
  value: string | number;
  delta?: string;
  deltaPositive?: boolean;
  deltaNeutral?: boolean;
  icon?: React.ElementType;
  accent?: 'primary' | 'teal' | 'amber' | 'rose' | 'violet' | 'emerald';
  urgent?: boolean;          // Red-border high-priority state
  warning?: boolean;         // Amber-border warning state
  progress?: number;         // 0–100 for circular progress ring
  progressTotal?: number;    // denominator label e.g. "3 / 7"
  className?: string;
};

const accentStyles: Record<string, { icon: string; ring: string; blob: string }> = {
  primary: { icon: 'bg-primary/10 text-primary', ring: '#0F4C81', blob: 'bg-primary/5 group-hover:bg-primary/10' },
  teal:    { icon: 'bg-teal-50 text-teal-600',   ring: '#00A896', blob: 'bg-teal-400/10 group-hover:bg-teal-400/20' },
  amber:   { icon: 'bg-amber-50 text-amber-600', ring: '#F59E0B', blob: 'bg-amber-400/10 group-hover:bg-amber-400/20' },
  rose:    { icon: 'bg-rose-50 text-rose-600',   ring: '#F43F5E', blob: 'bg-rose-400/10 group-hover:bg-rose-400/20' },
  violet:  { icon: 'bg-violet-50 text-violet-600', ring: '#7C3AED', blob: 'bg-violet-400/10 group-hover:bg-violet-400/20' },
  emerald: { icon: 'bg-emerald-50 text-emerald-600', ring: '#10B981', blob: 'bg-emerald-400/10 group-hover:bg-emerald-400/20' },
};

function CircleProgress({ pct, color, size = 44 }: { pct: number; color: string; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={3} className="text-muted/40" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={3}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    </svg>
  );
}

export function StatCard({
  label,
  value,
  delta,
  deltaPositive,
  deltaNeutral,
  icon: Icon,
  accent = 'primary',
  urgent,
  warning,
  progress,
  className,
}: StatCardProps) {
  const styles = accentStyles[accent] ?? accentStyles.primary;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
        urgent  ? 'border-l-4 border-l-rose-500 border-t-rose-200 border-r-rose-200 border-b-rose-200' :
        warning ? 'border-l-4 border-l-amber-500 border-t-amber-200 border-r-amber-200 border-b-amber-200' :
                  'border-border',
        className,
      )}
    >
      {/* Gradient blob */}
      <div className={cn('pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full blur-2xl transition-all', styles.blob)} />

      <div className="relative p-5">
        <div className="flex items-start justify-between">
          {/* Icon */}
          {Icon && (
            <div className={cn('flex items-center justify-center rounded-xl p-2.5', styles.icon)}>
              <Icon className="h-5 w-5" />
              {(urgent || warning) && (
                <span className={cn(
                  'absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-white animate-pulse',
                  urgent ? 'bg-rose-500' : 'bg-amber-500',
                )} />
              )}
            </div>
          )}

          {/* Progress ring */}
          {progress !== undefined && (
            <div className="relative flex items-center justify-center">
              <CircleProgress pct={progress} color={styles.ring} />
              <span className="absolute text-[10px] font-bold text-foreground">{Math.round(progress)}%</span>
            </div>
          )}
        </div>

        {/* Value */}
        <p className="mt-4 text-3xl font-extrabold tracking-tight text-foreground leading-none">
          {value}
        </p>

        {/* Label */}
        <p className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>

        {/* Delta */}
        {delta && (
          <div className={cn(
            'mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
            deltaNeutral ? 'bg-muted text-muted-foreground' :
            deltaPositive ? 'bg-emerald-50 text-emerald-700' :
                           'bg-rose-50 text-rose-600',
          )}>
            {!deltaNeutral && (
              <span>{deltaPositive ? '↑' : '↓'}</span>
            )}
            {delta}
          </div>
        )}
      </div>
    </div>
  );
}
