import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { Ga4Result, SearchConsoleResult } from "@/lib/analytics/types";

const { ga4Mock, gscMock } = vi.hoisted(() => ({ ga4Mock: vi.fn(), gscMock: vi.fn() }));
vi.mock("@/lib/analytics/ga4", () => ({ getGa4Dashboard: ga4Mock }));
vi.mock("@/lib/analytics/search-console", () => ({ getSearchConsoleDashboard: gscMock }));
vi.mock("@/lib/analytics/config", () => ({
  allMissingEnv: () => [],
  ANALYTICS_ENV_HELP: {},
  ANALYTICS_ENV_UNLOCKS: {},
}));
vi.mock("../access", () => ({
  requireAnalyticsAccess: async () => ({ email: "boss@novasstrading.com", role: "admin", modules: ["website"] }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import AnalyticsPage from "../page";

const PERIOD = {
  current: { start: "2026-09-27", end: "2026-10-03" },
  previous: { start: "2026-09-20", end: "2026-09-26" },
};

const GA4: Ga4Result = {
  status: "connected",
  period: PERIOD,
  hostname: "novasstrading.com",
  totals: {
    ok: true,
    data: {
      current: { activeUsers: 120, sessions: 150, screenPageViews: 450, averageSessionDuration: 83, engagementRate: 0.62 },
      previous: { activeUsers: 80, sessions: 150, screenPageViews: 500, averageSessionDuration: 60, engagementRate: 0.5 },
    },
  },
  daily: {
    ok: true,
    data: [
      { date: "2026-09-27", value: 3 },
      { date: "2026-09-28", value: 5 },
      { date: "2026-09-29", value: 0 },
      { date: "2026-09-30", value: 8 },
      { date: "2026-10-01", value: 6 },
      { date: "2026-10-02", value: 9 },
      { date: "2026-10-03", value: 12 },
    ],
  },
  pages: { ok: true, data: [{ label: "/", value: 300 }, { label: "/products", value: 50 }] },
  countries: { ok: true, data: [{ label: "Bangladesh", value: 70 }] },
  channels: { ok: true, data: [{ label: "Organic Search", value: 90 }] },
  devices: { ok: true, data: [{ label: "mobile", value: 80 }] },
  contactForms: { ok: false, error: "Google says: permission denied — add the service account as a Viewer in GA4 (Admin → Property access management)." },
  realtime: { ok: true, data: 4 },
};

const GSC: SearchConsoleResult = {
  status: "connected",
  period: { current: { start: "2026-09-25", end: "2026-10-01" }, previous: { start: "2026-09-18", end: "2026-09-24" } },
  totals: {
    ok: true,
    data: {
      current: { clicks: 30, impressions: 1000, ctr: 0.03, position: 6 },
      previous: { clicks: 20, impressions: 1000, ctr: 0.02, position: 8 },
    },
  },
  queries: { ok: true, data: [{ label: "garments buying house", clicks: 9, impressions: 50, ctr: 0.18, position: 1.4 }] },
  pages: { ok: true, data: [{ label: "https://novasstrading.com/products", clicks: 5, impressions: 40, ctr: 0.125, position: 2.2 }] },
};

beforeEach(() => {
  ga4Mock.mockReset().mockResolvedValue(GA4);
  gscMock.mockReset().mockResolvedValue(GSC);
});

function tile(label: string) {
  return screen.getByText(label, { selector: "span" }).parentElement!;
}

describe("Analytics dashboard (connected)", () => {
  it("passes the chosen range to both sources", async () => {
    render(await AnalyticsPage({ searchParams: { range: "7" } }));
    expect(ga4Mock).toHaveBeenCalledWith(7);
    expect(gscMock).toHaveBeenCalledWith(7);
    expect(screen.queryByRole("heading", { name: "Not connected yet" })).toBeNull();
  });

  it("shows KPI tiles with % change vs the previous period", async () => {
    render(await AnalyticsPage({ searchParams: { range: "7" } }));
    expect(tile("Visitors")).toHaveTextContent("120");
    expect(tile("Visitors")).toHaveTextContent("+50% vs previous 7 days");
    expect(tile("Visits")).toHaveTextContent("0% vs previous 7 days");
    expect(tile("Page views")).toHaveTextContent("−10%");
    expect(tile("Avg. visit length")).toHaveTextContent("1m 23s");
    expect(tile("Engagement rate")).toHaveTextContent("62.0%");
    // lower Google position is better: 8 → 6 is shown as an improvement
    const position = tile("Average position");
    expect(position).toHaveTextContent("6.0");
    expect(position.querySelector(".text-emerald-700")).not.toBeNull();
  });

  it("keeps rendering when one panel fails, showing Google's reason on that panel", async () => {
    render(await AnalyticsPage({ searchParams: {} }));
    expect(within(tile("Contact-form enquiries")).getByRole("alert")).toHaveTextContent(/permission denied/);
    expect(screen.getByText("Bangladesh")).toBeInTheDocument();
  });

  it("shows the realtime badge, the chart's table view and the tables", async () => {
    render(await AnalyticsPage({ searchParams: {} }));
    expect(screen.getByText("active now").parentElement).toHaveTextContent("4 active now");
    expect(screen.getByRole("group", { name: /Daily visitors chart/ })).toBeInTheDocument();
    expect(screen.getByText("Show as table")).toBeInTheDocument();
    expect(screen.getByText("Organic Search")).toBeInTheDocument();
    expect(screen.getByText("Mobile")).toBeInTheDocument();
    expect(screen.getByText("garments buying house")).toBeInTheDocument();
    expect(screen.getByText("/products", { selector: "td" })).toBeInTheDocument();
    expect(screen.getByText("Counting novasstrading.com only")).toBeInTheDocument();
    expect(screen.getByText(/runs about 3 days behind/)).toBeInTheDocument();
  });
});
