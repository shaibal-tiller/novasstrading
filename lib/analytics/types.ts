import type { Period } from "./range";

/** One panel's data, or the plain-English reason it could not be loaded. */
export type Panel<T> = { ok: true; data: T } | { ok: false; error: string };

export type Comparison<T> = { current: T; previous: T };

/** The env values the Analytics module reads (GA4_HOSTNAME is optional, so it is not here). */
export type AnalyticsEnvName = "GOOGLE_SERVICE_ACCOUNT_JSON" | "GA4_PROPERTY_ID" | "GSC_SITE_URL";

/**
 * A data source is "not connected" while its env values are missing (not an
 * error), "error" when they are present but unusable (bad key, sign-in
 * refused), otherwise connected with per-panel results.
 */
export type SourceResult<T> =
  | { status: "not_connected"; missing: AnalyticsEnvName[] }
  | { status: "error"; message: string }
  | ({ status: "connected"; period: Period } & T);

export type DailyPoint = { date: string; value: number };
export type RankedRow = { label: string; value: number };

export type Ga4Totals = {
  activeUsers: number;
  sessions: number;
  screenPageViews: number;
  /** seconds */
  averageSessionDuration: number;
  /** 0–1 */
  engagementRate: number;
};

export type Ga4Panels = {
  hostname: string | null;
  totals: Panel<Comparison<Ga4Totals>>;
  daily: Panel<DailyPoint[]>;
  pages: Panel<RankedRow[]>;
  countries: Panel<RankedRow[]>;
  channels: Panel<RankedRow[]>;
  devices: Panel<RankedRow[]>;
  contactForms: Panel<Comparison<number>>;
  realtime: Panel<number>;
};

export type GscTotals = {
  clicks: number;
  impressions: number;
  /** 0–1 */
  ctr: number;
  /** average position, 1 = top of Google */
  position: number;
};

export type GscRow = GscTotals & { label: string };

export type SearchConsolePanels = {
  totals: Panel<Comparison<GscTotals>>;
  queries: Panel<GscRow[]>;
  pages: Panel<GscRow[]>;
};

export type Ga4Result = SourceResult<Ga4Panels>;
export type SearchConsoleResult = SourceResult<SearchConsolePanels>;
