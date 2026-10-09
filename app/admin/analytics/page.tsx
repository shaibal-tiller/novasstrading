import { allMissingEnv, ANALYTICS_ENV_HELP, ANALYTICS_ENV_UNLOCKS } from "@/lib/analytics/config";
import { formatCount, formatDuration, formatPosition, formatRatio, formatSpan, shortPageLabel } from "@/lib/analytics/format";
import { getGa4Dashboard } from "@/lib/analytics/ga4";
import { comparePeriods, GA4_TIME_ZONE, isoDateInZone, parseRange, type RangeDays } from "@/lib/analytics/range";
import { getSearchConsoleDashboard } from "@/lib/analytics/search-console";
import type { Ga4Result, SearchConsoleResult } from "@/lib/analytics/types";
import { requireAnalyticsAccess } from "./access";
import { DailyUsersChart } from "./DailyUsersChart";
import {
  GscTable,
  KpiTile,
  KpiTileError,
  NotConnectedPanel,
  PanelCard,
  PanelError,
  RankedTable,
  RealtimeBadge,
  SectionHeading,
} from "./parts";
import { RangeFrame } from "./RangeFrame";

export const dynamic = "force-dynamic";

function capitalise(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export default async function AnalyticsPage({ searchParams }: { searchParams: { range?: string | string[] } }) {
  await requireAnalyticsAccess();
  const range = parseRange(searchParams.range);
  const [ga4, gsc] = await Promise.all([getGa4Dashboard(range), getSearchConsoleDashboard(range)]);
  const missing = allMissingEnv();
  const period =
    ga4.status === "connected" ? ga4.period : comparePeriods(isoDateInZone(new Date(), GA4_TIME_ZONE), range, 1);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="display-md text-ink">Analytics</h1>
          <p className="text-sm text-ink-muted">
            Last {range} complete days ({formatSpan(period.current)}), compared with the {range} days before.
          </p>
        </div>
        {ga4.status === "connected" && <RealtimeBadge panel={ga4.realtime} />}
      </header>

      <RangeFrame range={range}>
        {missing.length > 0 && (
          <NotConnectedPanel missing={missing} help={ANALYTICS_ENV_HELP} unlocks={ANALYTICS_ENV_UNLOCKS} />
        )}
        <VisitorsSection result={ga4} range={range} />
        <SearchSection result={gsc} range={range} />
      </RangeFrame>
    </div>
  );
}

function VisitorsSection({ result, range }: { result: Ga4Result; range: RangeDays }) {
  if (result.status === "not_connected") return null;
  const heading = (note?: string) => <SectionHeading id="visitors-heading" title="Visitors" note={note} />;
  if (result.status === "error") {
    return (
      <section aria-labelledby="visitors-heading" className="flex flex-col gap-4">
        {heading()}
        <PanelError message={result.message} />
      </section>
    );
  }

  const vs = `vs previous ${range} days`;
  const { totals, contactForms } = result;
  return (
    <section aria-labelledby="visitors-heading" className="flex flex-col gap-4">
      {heading(result.hostname ? `Counting ${result.hostname} only` : undefined)}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {totals.ok ? (
          <>
            <KpiTile label="Visitors" value={formatCount(totals.data.current.activeUsers)} current={totals.data.current.activeUsers} previous={totals.data.previous.activeUsers} comparedTo={vs} />
            <KpiTile label="Visits" value={formatCount(totals.data.current.sessions)} current={totals.data.current.sessions} previous={totals.data.previous.sessions} comparedTo={vs} />
            <KpiTile label="Page views" value={formatCount(totals.data.current.screenPageViews)} current={totals.data.current.screenPageViews} previous={totals.data.previous.screenPageViews} comparedTo={vs} />
            <KpiTile label="Avg. visit length" value={formatDuration(totals.data.current.averageSessionDuration)} current={totals.data.current.averageSessionDuration} previous={totals.data.previous.averageSessionDuration} comparedTo={vs} />
            <KpiTile label="Engagement rate" value={formatRatio(totals.data.current.engagementRate)} current={totals.data.current.engagementRate} previous={totals.data.previous.engagementRate} comparedTo={vs} />
          </>
        ) : (
          <PanelError message={totals.error} className="col-span-2 sm:col-span-3 lg:col-span-5" />
        )}
        {contactForms.ok ? (
          <KpiTile label="Contact-form enquiries" value={formatCount(contactForms.data.current)} current={contactForms.data.current} previous={contactForms.data.previous} comparedTo={vs} />
        ) : (
          <KpiTileError label="Contact-form enquiries" message={contactForms.error} />
        )}
      </div>

      <PanelCard title="Daily visitors">
        {result.daily.ok ? <DailyUsersChart points={result.daily.data} /> : <PanelError message={result.daily.error} />}
      </PanelCard>

      <div className="grid gap-4 md:grid-cols-2">
        <PanelCard title="Top pages">
          <RankedTable panel={result.pages} labelHeader="Page" valueHeader="Views" />
        </PanelCard>
        <PanelCard title="Where visitors come from">
          <RankedTable panel={result.channels} labelHeader="Channel" valueHeader="Visits" />
        </PanelCard>
        <PanelCard title="Countries">
          <RankedTable panel={result.countries} labelHeader="Country" valueHeader="Visitors" />
        </PanelCard>
        <PanelCard title="Devices">
          <RankedTable panel={result.devices} labelHeader="Device" valueHeader="Visitors" formatLabel={capitalise} />
        </PanelCard>
      </div>
    </section>
  );
}

function SearchSection({ result, range }: { result: SearchConsoleResult; range: RangeDays }) {
  if (result.status === "not_connected") return null;
  if (result.status === "error") {
    return (
      <section aria-labelledby="search-heading" className="flex flex-col gap-4">
        <SectionHeading id="search-heading" title="Google Search" />
        <PanelError message={result.message} />
      </section>
    );
  }

  const vs = `vs previous ${range} days`;
  const { totals } = result;
  return (
    <section aria-labelledby="search-heading" className="flex flex-col gap-4">
      <SectionHeading
        id="search-heading"
        title="Google Search"
        note={`Google's search data runs about 3 days behind: ${formatSpan(result.period.current)}`}
      />

      {totals.ok ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiTile label="Clicks from Google" value={formatCount(totals.data.current.clicks)} current={totals.data.current.clicks} previous={totals.data.previous.clicks} comparedTo={vs} />
          <KpiTile label="Times shown in Google" value={formatCount(totals.data.current.impressions)} current={totals.data.current.impressions} previous={totals.data.previous.impressions} comparedTo={vs} />
          <KpiTile label="Click-through rate" value={formatRatio(totals.data.current.ctr)} current={totals.data.current.ctr} previous={totals.data.previous.ctr} comparedTo={vs} />
          <KpiTile label="Average position" value={formatPosition(totals.data.current.position)} current={totals.data.current.position} previous={totals.data.previous.position} comparedTo={vs} lowerIsBetter />
        </div>
      ) : (
        <PanelError message={totals.error} />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <PanelCard title="Top searches">
          <GscTable panel={result.queries} labelHeader="Search" />
        </PanelCard>
        <PanelCard title="Top pages in Google">
          <GscTable panel={result.pages} labelHeader="Page" formatLabel={shortPageLabel} />
        </PanelCard>
      </div>
    </section>
  );
}
