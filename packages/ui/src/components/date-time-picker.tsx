'use client';

import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarBlank, CaretLeft, CaretRight, Clock, X } from '../icons';
import { cn } from '../lib/utils';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad = (n: number) => String(n).padStart(2, '0');
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** "HH:mm" options at a fixed minute step. */
function timeOptions(stepMinutes: number): string[] {
  const out: string[] = [];
  for (let m = 0; m < 24 * 60; m += stepMinutes) out.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
  return out;
}

export function formatTime12(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h < 12 ? 'AM' : 'PM';
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(m)} ${suffix}`;
}

/** Short name of the browser's timezone, e.g. "WAT" or "GMT+1". */
export function localTimezoneLabel(): string {
  try {
    const part = new Intl.DateTimeFormat('en-GB', { timeZoneName: 'short' })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName');
    return part?.value ?? '';
  } catch {
    return '';
  }
}

// ── Month grid ────────────────────────────────────────────────────────────────

type CalendarGridProps = {
  selected: Date | null;
  onSelect: (day: Date) => void;
  minDate?: Date;
};

function CalendarGrid({ selected, onSelect, minDate }: CalendarGridProps) {
  const today = startOfDay(new Date());
  const [view, setView] = React.useState(() => {
    const base = selected ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const min = minDate ? startOfDay(minDate) : null;

  const year = view.getFullYear();
  const month = view.getMonth();
  const leading = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  const canGoBack = !min || new Date(year, month, 1) > new Date(min.getFullYear(), min.getMonth(), 1);

  return (
    <div className="w-[17.5rem]">
      <div className="mb-2 flex items-center justify-between px-1">
        <button
          type="button"
          aria-label="Previous month"
          disabled={!canGoBack}
          onClick={() => setView(new Date(year, month - 1, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <CaretLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-foreground">{MONTHS[month]} {year}</p>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setView(new Date(year, month + 1, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <CaretRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {WEEKDAYS.map((d) => (
          <div key={d} className="flex h-8 items-center justify-center text-xs font-medium text-muted-foreground">
            {d.slice(0, 2)}
          </div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`blank-${i}`} />;
          const disabled = !!min && day < min;
          const isSelected = !!selected && sameDay(day, selected);
          const isToday = sameDay(day, today);
          return (
            <button
              key={day.getDate()}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => onSelect(day)}
              className={cn(
                'mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm tabular-nums transition-colors',
                isSelected
                  ? 'bg-primary font-semibold text-white'
                  : 'text-foreground hover:bg-primary/10',
                !isSelected && isToday && 'font-semibold text-primary ring-1 ring-inset ring-primary/40',
                disabled && 'pointer-events-none text-muted-foreground/40',
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Time list ─────────────────────────────────────────────────────────────────

function TimeList({
  value, onChange, stepMinutes, isDisabled,
}: {
  value: string | null;
  onChange: (time: string) => void;
  stepMinutes: number;
  isDisabled?: (time: string) => boolean;
}) {
  const options = timeOptions(stepMinutes);
  // Open on the chosen time, or on the first one that can be picked.
  const anchor = value ?? options.find((t) => !isDisabled?.(t)) ?? null;
  const anchorRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    anchorRef.current?.scrollIntoView({ block: value ? 'center' : 'start' });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="h-full overflow-y-auto pr-1" role="listbox" aria-label="Time">
      {options.map((t) => {
        const selected = t === value;
        const disabled = isDisabled?.(t) ?? false;
        return (
          <button
            key={t}
            ref={t === anchor ? anchorRef : undefined}
            type="button"
            role="option"
            aria-selected={selected}
            disabled={disabled}
            onClick={() => onChange(t)}
            className={cn(
              'block w-full whitespace-nowrap rounded-lg px-3 py-1.5 text-left text-sm tabular-nums transition-colors',
              selected ? 'bg-primary font-semibold text-white' : 'text-foreground hover:bg-primary/10',
              disabled && 'pointer-events-none text-muted-foreground/40',
            )}
          >
            {formatTime12(t)}
          </button>
        );
      })}
    </div>
  );
}

const triggerClass =
  'flex h-10 w-full items-center gap-2 rounded-xl border border-border bg-white px-3 text-left text-sm shadow-sm transition-colors hover:border-primary/40 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20';

// ── DateTimePicker ────────────────────────────────────────────────────────────

type DateTimePickerProps = {
  value: Date | null;
  onChange: (value: Date | null) => void;
  /** Earliest selectable moment. Defaults to none. */
  minDate?: Date;
  /** Set false for a date-only picker (time is kept at 00:00). */
  withTime?: boolean;
  stepMinutes?: number;
  placeholder?: string;
  /** Adds "Tomorrow 9 AM"-style shortcuts. */
  quickPicks?: boolean;
  clearable?: boolean;
  className?: string;
};

export function DateTimePicker({
  value, onChange, minDate, withTime = true, stepMinutes = 15,
  placeholder = 'Pick a date', quickPicks = false, clearable = true, className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const time = value ? `${pad(value.getHours())}:${pad(value.getMinutes())}` : null;

  function withParts(day: Date, t: string): Date {
    const [h, m] = t.split(':').map(Number);
    return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m, 0, 0);
  }

  function selectDay(day: Date) {
    if (!withTime) { onChange(startOfDay(day)); setOpen(false); return; }
    let next = withParts(day, time ?? '09:00');
    // Keep the result selectable when the chosen day is the minimum day.
    if (minDate && next < minDate) {
      const firstValid = timeOptions(stepMinutes).find((t) => withParts(day, t) >= minDate);
      if (firstValid) next = withParts(day, firstValid);
    }
    onChange(next);
  }

  function selectTime(t: string) {
    onChange(withParts(value ?? minDate ?? new Date(), t));
  }

  const shortcuts = React.useMemo(() => {
    const now = new Date();
    const at = (daysAhead: number, h: number) =>
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAhead, h, 0, 0, 0);
    const daysToMonday = ((8 - now.getDay()) % 7) || 7;
    return [
      { label: 'In 1 hour', date: new Date(Math.ceil((now.getTime() + 3600_000) / 900_000) * 900_000) },
      { label: 'Tomorrow 9 AM', date: at(1, 9) },
      { label: 'Next Monday 9 AM', date: at(daysToMonday, 9) },
    ];
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const label = value
    ? value.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) +
      (withTime ? ` · ${formatTime12(time!)}` : '')
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn('relative', className)}>
        <PopoverTrigger asChild>
          <button type="button" className={cn(triggerClass, clearable && value && 'pr-9')}>
            <CalendarBlank className="h-4 w-4 shrink-0 text-primary" />
            <span className={cn('truncate', !label && 'text-muted-foreground')}>{label ?? placeholder}</span>
          </button>
        </PopoverTrigger>
        {clearable && value && (
          <button
            type="button"
            aria-label="Clear date"
            onClick={() => onChange(null)}
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <PopoverContent className="w-auto">
        {quickPicks && withTime && (
          <div className="mb-3 flex flex-wrap gap-1.5 border-b border-border pb-3">
            {shortcuts.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => { onChange(s.date); setOpen(false); }}
                className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <CalendarGrid selected={value} onSelect={selectDay} minDate={minDate} />
          {withTime && (
            <div className="flex w-28 flex-col border-l border-border pl-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Time
              </p>
              <div className="h-[17rem]">
                <TimeList
                  value={time}
                  onChange={selectTime}
                  stepMinutes={stepMinutes}
                  isDisabled={(t) => !!minDate && withParts(value ?? minDate, t) < minDate}
                />
              </div>
            </div>
          )}
        </div>

        {withTime && (
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">Your local time{localTimezoneLabel() ? ` (${localTimezoneLabel()})` : ''}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Done
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ── TimePicker ────────────────────────────────────────────────────────────────

type TimePickerProps = {
  /** "HH:mm" */
  value: string;
  onChange: (value: string) => void;
  stepMinutes?: number;
  className?: string;
};

export function TimePicker({ value, onChange, stepMinutes = 15, className }: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={cn(triggerClass, className)}>
          <Clock className="h-4 w-4 shrink-0 text-primary" />
          <span className="tabular-nums">{formatTime12(value)}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="h-64 w-36 p-2">
        <TimeList value={value} onChange={(t) => { onChange(t); setOpen(false); }} stepMinutes={stepMinutes} />
      </PopoverContent>
    </Popover>
  );
}

// ── MonthPicker ───────────────────────────────────────────────────────────────

type MonthPickerProps = {
  /** "YYYY-MM", or empty for no selection. */
  value: string;
  onChange: (value: string | undefined) => void;
  /** Latest month that can be picked, e.g. today for "when did this happen". */
  maxDate?: Date;
  locale?: string;
  placeholder?: string;
  invalid?: boolean;
  labelledBy?: string;
  className?: string;
};

export function MonthPicker({
  value, onChange, maxDate, locale = 'en-GB', placeholder = 'Pick a month', invalid, labelledBy, className,
}: MonthPickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = /^\d{4}-\d{2}$/.test(value) ? { year: Number(value.slice(0, 4)), month: Number(value.slice(5)) } : null;
  const today = new Date();
  const [viewYear, setViewYear] = React.useState(selected?.year ?? (maxDate ?? today).getFullYear());

  React.useEffect(() => {
    if (open) setViewYear(selected?.year ?? (maxDate ?? today).getFullYear());
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const monthName = (month: number, style: 'short' | 'long') =>
    new Date(2000, month - 1, 1).toLocaleDateString(locale, { month: style });
  const afterMax = (year: number, month: number) =>
    !!maxDate && (year > maxDate.getFullYear() || (year === maxDate.getFullYear() && month > maxDate.getMonth() + 1));
  const canGoForward = !maxDate || viewYear < maxDate.getFullYear();

  const label = selected ? `${monthName(selected.month, 'long')} ${selected.year}` : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-labelledby={labelledBy} aria-invalid={invalid}
          className={cn(triggerClass, 'h-12 text-base', invalid && 'border-rose-400', className)}>
          <CalendarBlank className="h-4 w-4 shrink-0 text-primary" />
          <span className={cn('truncate capitalize', !label && 'normal-case text-muted-foreground')}>{label ?? placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" aria-label="Previous year" onClick={() => setViewYear((y) => y - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <CaretLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-semibold tabular-nums text-foreground" aria-live="polite">{viewYear}</p>
          <button type="button" aria-label="Next year" disabled={!canGoForward} onClick={() => setViewYear((y) => y + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30">
            <CaretRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
            const isSelected = selected?.year === viewYear && selected.month === month;
            const isCurrent = today.getFullYear() === viewYear && today.getMonth() + 1 === month;
            const disabled = afterMax(viewYear, month);
            return (
              <button key={month} type="button" disabled={disabled} aria-pressed={isSelected}
                aria-label={`${monthName(month, 'long')} ${viewYear}`}
                onClick={() => { onChange(`${viewYear}-${pad(month)}`); setOpen(false); }}
                className={cn(
                  'h-10 rounded-xl text-sm capitalize transition-colors',
                  isSelected ? 'bg-primary font-semibold text-white' : 'text-foreground hover:bg-primary/10',
                  !isSelected && isCurrent && 'font-semibold text-primary ring-1 ring-inset ring-primary/40',
                  disabled && 'pointer-events-none text-muted-foreground/40',
                )}>
                {monthName(month, 'short')}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
