import { formatTime12 } from '@mjn/ui';

export type Contact = { name: string; email: string; phone?: string };
export type SavedList = { id: string; name: string; contactCount: number };
export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export const DEFAULT_TIMEZONE = 'Africa/Douala';

export const TIMEZONES = [
  { value: 'Africa/Douala', label: 'Cameroon (WAT)' },
  { value: 'Africa/Lagos', label: 'Nigeria (WAT)' },
  { value: 'Africa/Accra', label: 'Ghana (GMT)' },
  { value: 'Africa/Nairobi', label: 'Kenya (EAT)' },
  { value: 'Africa/Johannesburg', label: 'South Africa (SAST)' },
  { value: 'Asia/Dubai', label: 'UAE (GST)' },
  { value: 'Europe/London', label: 'United Kingdom' },
  { value: 'Europe/Dublin', label: 'Ireland' },
  { value: 'America/New_York', label: 'US Eastern' },
  { value: 'America/Chicago', label: 'US Central' },
  { value: 'America/Denver', label: 'US Mountain' },
  { value: 'America/Los_Angeles', label: 'US Pacific' },
];

export const SEGMENTS = [
  { value: 'leads', label: 'Leads', desc: 'Everyone in the leads list' },
  { value: 'active', label: 'Active Clients', desc: 'People with an active engagement' },
  { value: 'on_hold', label: 'On Hold', desc: 'Engagements currently paused' },
  { value: 'completed', label: 'Completed', desc: 'Finished engagements' },
  { value: 'all_candidates', label: 'All Candidates', desc: 'Every person in the system' },
];

// Monday-first for display; values match the API (0 = Sunday … 6 = Saturday).
export const WEEKDAY_CHIPS = [
  { value: 1, short: 'Mon' }, { value: 2, short: 'Tue' }, { value: 3, short: 'Wed' },
  { value: 4, short: 'Thu' }, { value: 5, short: 'Fri' }, { value: 6, short: 'Sat' },
  { value: 0, short: 'Sun' },
];

export const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  SCHEDULED: 'bg-blue-100 text-blue-700',
  SENDING: 'bg-amber-100 text-amber-700',
  PAUSED: 'bg-slate-200 text-slate-700',
  SENT: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
};

export function formatLabel(s: string) {
  return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatDateTime(ts: string | Date) {
  return new Date(ts).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

/** A date-time shown in a specific timezone, e.g. the campaign's own. */
export function formatInTimezone(ts: string | Date, timezone: string) {
  try {
    return new Date(ts).toLocaleString('en-GB', {
      timeZone: timezone, weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    });
  } catch {
    return formatDateTime(ts);
  }
}

export function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function ordinal(n: number) {
  const rem10 = n % 10, rem100 = n % 100;
  if (rem10 === 1 && rem100 !== 11) return `${n}st`;
  if (rem10 === 2 && rem100 !== 12) return `${n}nd`;
  if (rem10 === 3 && rem100 !== 13) return `${n}rd`;
  return `${n}th`;
}

/** Plain-language recurrence, e.g. "Every Mon, Wed, Fri at 9:00 AM". */
export function describeRecurrence(r: {
  frequency: Frequency; daysOfWeek?: number[]; dayOfMonth?: number | null; timeOfDay?: string | null;
}) {
  const at = r.timeOfDay ? ` at ${formatTime12(r.timeOfDay)}` : '';
  if (r.frequency === 'DAILY') return `Every day${at}`;
  if (r.frequency === 'WEEKLY') {
    const days = WEEKDAY_CHIPS.filter((d) => (r.daysOfWeek ?? []).includes(d.value)).map((d) => d.short);
    if (days.length === 7) return `Every day${at}`;
    return days.length ? `Every ${days.join(', ')}${at}` : 'Weekly — no days picked';
  }
  return `Monthly on the ${ordinal(r.dayOfMonth ?? 1)}${at}`;
}

export function isRecurring(c: any) {
  return !!c?.frequency;
}

export function audienceLabel(af: any): string {
  if (af?.type === 'segment') return SEGMENTS.find((s) => s.value === af.segment)?.label ?? af.segment ?? 'Segment';
  if (af?.type === 'contact_list' || af?.type === 'custom_list') return af.listName ?? 'Imported list';
  return 'No audience';
}
