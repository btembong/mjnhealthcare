export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface Recurrence {
  frequency: Frequency;
  daysOfWeek: number[]; // 0 = Sunday … 6 = Saturday
  dayOfMonth?: number | null;
  timeOfDay: string; // "HH:mm"
  timezone: string;
}

const MAX_LOOKAHEAD_DAYS = 400;

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function parseTime(timeOfDay: string): { hour: number; minute: number } {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeOfDay);
  if (!m) throw new Error(`Invalid time of day: ${timeOfDay}`);
  return { hour: Number(m[1]), minute: Number(m[2]) };
}

/** Wall-clock calendar fields of `date` as seen in `timezone`. */
function zonedParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hourCycle: 'h23',
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return {
    year: get('year'), month: get('month'), day: get('day'),
    hour: get('hour'), minute: get('minute'), second: get('second'),
  };
}

/** UTC instant for a wall-clock time in `timezone`. */
export function zonedTimeToUtc(
  year: number, month: number, day: number, hour: number, minute: number, timezone: string,
): Date {
  const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offsetAt = (instant: number) => {
    const p = zonedParts(new Date(instant), timezone);
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - instant;
  };
  // Two passes so the offset is taken at the resulting instant (DST boundaries).
  let utc = wallAsUtc - offsetAt(wallAsUtc);
  utc = wallAsUtc - offsetAt(utc);
  return new Date(utc);
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** First occurrence strictly after `after`, or null if the rule can never fire. */
export function nextOccurrence(rule: Recurrence, after: Date): Date | null {
  const { hour, minute } = parseTime(rule.timeOfDay);
  if (rule.frequency === 'WEEKLY' && rule.daysOfWeek.length === 0) return null;

  const start = zonedParts(after, rule.timezone);
  // Calendar-day cursor in UTC so day arithmetic is timezone-agnostic.
  const cursor = new Date(Date.UTC(start.year, start.month - 1, start.day));

  for (let i = 0; i <= MAX_LOOKAHEAD_DAYS; i++) {
    const y = cursor.getUTCFullYear();
    const mo = cursor.getUTCMonth() + 1;
    const d = cursor.getUTCDate();

    let matches = true;
    if (rule.frequency === 'WEEKLY') {
      matches = rule.daysOfWeek.includes(cursor.getUTCDay());
    } else if (rule.frequency === 'MONTHLY') {
      const target = Math.min(rule.dayOfMonth ?? 1, daysInMonth(y, mo));
      matches = d === target;
    }

    if (matches) {
      const candidate = zonedTimeToUtc(y, mo, d, hour, minute, rule.timezone);
      if (candidate.getTime() > after.getTime()) return candidate;
    }
    cursor.setUTCDate(d + 1);
  }
  return null;
}

/** Standard 5-field cron expression equivalent to the rule (evaluated in rule.timezone). */
export function toCronExpression(rule: Recurrence): string {
  const { hour, minute } = parseTime(rule.timeOfDay);
  if (rule.frequency === 'WEEKLY') {
    const days = [...new Set(rule.daysOfWeek)].sort((a, b) => a - b).join(',');
    return `${minute} ${hour} * * ${days}`;
  }
  if (rule.frequency === 'MONTHLY') {
    return `${minute} ${hour} ${rule.dayOfMonth ?? 1} * *`;
  }
  return `${minute} ${hour} * * *`;
}
