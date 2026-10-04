import type { DateSpan } from "./range";

/** Display helpers for the Analytics page. Client-safe. */

const plain = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/** 1,284 · 12.9K · 4.2M */
export function formatCount(n: number): string {
  return Math.abs(n) >= 10_000 ? compact.format(n) : plain.format(Math.round(n));
}

/** 0.4567 → "45.7%" */
export function formatRatio(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

/** 83.4 s → "1m 23s" */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

/** Average Google position, 1 decimal ("—" when there were no impressions). */
export function formatPosition(position: number): string {
  return position > 0 ? position.toFixed(1) : "—";
}

/** 12.34 → "12%", -5 → "−5%", null → "new" */
export function formatChange(pct: number | null): string {
  if (pct === null) return "new";
  const rounded = Math.round(pct);
  if (rounded === 0) return "0%";
  return `${rounded > 0 ? "+" : "−"}${Math.abs(rounded)}%`;
}

const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const dayMonthYear = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const weekdayDayMonth = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

function utc(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** "4 Sep – 1 Oct 2026" */
export function formatSpan(span: DateSpan): string {
  return `${dayMonth.format(utc(span.start))} – ${dayMonthYear.format(utc(span.end))}`;
}

/** "1 Oct" */
export function formatShortDate(iso: string): string {
  return dayMonth.format(utc(iso));
}

/** "Thu 1 Oct" */
export function formatDayLabel(iso: string): string {
  return weekdayDayMonth.format(utc(iso));
}

/** Clean whole-number axis ticks from 0 up to just above `max` (steps of 1/2/5 × 10ⁿ). */
export function niceTicks(max: number, target = 4): number[] {
  if (!(max > 0)) return [0, 1];
  const raw = max / target;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = Math.max(1, [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? 10 * pow);
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);
  return ticks;
}

/** "https://novasstrading.com/products?x=1" → "/products?x=1" (keeps non-URLs as-is). */
export function shortPageLabel(page: string): string {
  try {
    const u = new URL(page);
    return `${u.pathname}${u.search}` || "/";
  } catch {
    return page;
  }
}
