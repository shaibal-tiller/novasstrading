import { describe, it, expect } from "vitest";
import { comparePeriods, eachDay, isoDateInZone, parseRange, percentChange } from "@/lib/analytics/range";
import { formatChange, formatDuration, niceTicks, shortPageLabel } from "@/lib/analytics/format";

describe("parseRange", () => {
  it.each([
    ["7", 7],
    ["28", 28],
    ["90", 90],
    [["90", "7"], 90],
  ])("accepts %s", (raw, expected) => {
    expect(parseRange(raw as string | string[])).toBe(expected);
  });

  it.each([[undefined], [""], ["30"], ["abc"], ["-7"]])("falls back to 28 for %s", (raw) => {
    expect(parseRange(raw as string | undefined)).toBe(28);
  });
});

describe("comparePeriods", () => {
  it("covers the last N complete days and the N days before (GA4: lag 1)", () => {
    expect(comparePeriods("2026-10-04", 28, 1)).toEqual({
      current: { start: "2026-09-06", end: "2026-10-03" },
      previous: { start: "2026-08-09", end: "2026-09-05" },
    });
    expect(comparePeriods("2026-10-04", 7, 1)).toEqual({
      current: { start: "2026-09-27", end: "2026-10-03" },
      previous: { start: "2026-09-20", end: "2026-09-26" },
    });
  });

  it("ends 3 days ago for Search Console and handles month/year boundaries", () => {
    expect(comparePeriods("2027-01-02", 7, 3)).toEqual({
      current: { start: "2026-12-24", end: "2026-12-30" },
      previous: { start: "2026-12-17", end: "2026-12-23" },
    });
  });

  it("produces equal-length periods", () => {
    const p = comparePeriods("2026-03-15", 90, 1);
    expect(eachDay(p.current)).toHaveLength(90);
    expect(eachDay(p.previous)).toHaveLength(90);
  });
});

describe("isoDateInZone", () => {
  it("uses the calendar date in the given time zone", () => {
    const instant = new Date("2026-10-04T20:00:00Z");
    expect(isoDateInZone(instant, "Asia/Dhaka")).toBe("2026-10-05"); // UTC+6
    expect(isoDateInZone(instant, "America/Los_Angeles")).toBe("2026-10-04");
  });
});

describe("percentChange", () => {
  it("is relative to the previous period", () => {
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(75, 100)).toBe(-25);
    expect(percentChange(100, 100)).toBe(0);
  });

  it("is 0 for 0 → 0 and null (\"new\") for anything from 0", () => {
    expect(percentChange(0, 0)).toBe(0);
    expect(percentChange(12, 0)).toBeNull();
  });
});

describe("format helpers", () => {
  it("formats changes, durations, ticks and page URLs", () => {
    expect(formatChange(12.4)).toBe("+12%");
    expect(formatChange(-5.6)).toBe("−6%");
    expect(formatChange(0.2)).toBe("0%");
    expect(formatChange(null)).toBe("new");
    expect(formatDuration(83.4)).toBe("1m 23s");
    expect(formatDuration(42)).toBe("42s");
    expect(niceTicks(37)).toEqual([0, 10, 20, 30, 40]);
    expect(niceTicks(3)).toEqual([0, 1, 2, 3]);
    expect(niceTicks(0)).toEqual([0, 1]);
    expect(shortPageLabel("https://novasstrading.com/products?x=1")).toBe("/products?x=1");
    expect(shortPageLabel("/about")).toBe("/about");
  });
});
