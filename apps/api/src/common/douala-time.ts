/**
 * The office works in Douala time (WAT), which is UTC+1 all year — no daylight saving.
 * Times staff type in are Douala clock times; the database stores real UTC instants.
 */
const OFFSET_MS = 60 * 60 * 1000;

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** "2026-10-12" + "09:00" on a Douala clock → the UTC instant (08:00Z). */
export function doualaToUtc(date: string, time = '00:00'): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - OFFSET_MS);
}

/** The Douala calendar date ("2026-10-12") an instant falls on. */
export function doualaDate(at: Date): string {
  return new Date(at.getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

/** Adds whole days to a calendar date string. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** 0 = Sunday … 6 = Saturday, for a calendar date string. */
export function weekdayOf(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
