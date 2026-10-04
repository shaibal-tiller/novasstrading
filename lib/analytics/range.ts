/**
 * Date-range maths for the Analytics module. Client-safe (the range switcher
 * imports RANGE_OPTIONS), so no server-only imports here.
 *
 * Dates are plain "YYYY-MM-DD" strings, inclusive at both ends — the format
 * both the GA4 Data API and the Search Console API accept.
 */

export const RANGE_OPTIONS = [7, 28, 90] as const;
export type RangeDays = (typeof RANGE_OPTIONS)[number];
export const DEFAULT_RANGE: RangeDays = 28;

/** GA4 reports in the property's time zone; the setup guide sets it to Bangladesh time. */
export const GA4_TIME_ZONE = "Asia/Dhaka";
/** Search Console reports its days in US Pacific time. */
export const SEARCH_CONSOLE_TIME_ZONE = "America/Los_Angeles";

/** `?range=` → 7 | 28 | 90, anything else → the default (28). */
export function parseRange(raw: string | string[] | undefined | null): RangeDays {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  return (RANGE_OPTIONS as readonly number[]).includes(n) ? (n as RangeDays) : DEFAULT_RANGE;
}

export type DateSpan = { start: string; end: string };
export type Period = { current: DateSpan; previous: DateSpan };

/** Today's calendar date ("YYYY-MM-DD") as seen in `timeZone`. */
export function isoDateInZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function addDays(iso: string, delta: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/**
 * The `days`-long window that ends `lagDays` before `today` (lagDays = 1 →
 * ends yesterday, so a half-finished today never drags the comparison down),
 * plus the equal-length window immediately before it.
 */
export function comparePeriods(today: string, days: number, lagDays: number): Period {
  const end = addDays(today, -lagDays);
  const start = addDays(end, -(days - 1));
  const previousEnd = addDays(start, -1);
  const previousStart = addDays(previousEnd, -(days - 1));
  return { current: { start, end }, previous: { start: previousStart, end: previousEnd } };
}

/** Every date in the span, oldest first. */
export function eachDay(span: DateSpan): string[] {
  const out: string[] = [];
  for (let d = span.start; d <= span.end && out.length < 400; d = addDays(d, 1)) out.push(d);
  return out;
}

/**
 * % change from `previous` to `current`. 0 → 0 is "no change" (0); anything
 * from 0 has no meaningful percentage, so it is null (shown as "new").
 */
export function percentChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / Math.abs(previous)) * 100;
}
