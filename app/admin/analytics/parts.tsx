import { formatChange, formatCount } from "@/lib/analytics/format";
import { percentChange } from "@/lib/analytics/range";
import type { AnalyticsEnvName, GscRow, Panel, RankedRow } from "@/lib/analytics/types";

/** Presentational pieces of the Analytics page (server-rendered). */

export function SectionHeading({ id, title, note }: { id: string; title: string; note?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 id={id} className="display-md text-ink">
        {title}
      </h2>
      {note && <p className="text-xs text-ink-muted">{note}</p>}
    </div>
  );
}

export function PanelCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-3 rounded-2xl border border-ink/10 bg-paper p-4 sm:p-5 ${className}`}>
      <h3 className="field-label">{title}</h3>
      {children}
    </div>
  );
}

export function PanelError({ message, className = "" }: { message: string; className?: string }) {
  return (
    <p role="alert" className={`rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 ${className}`}>
      {message}
    </p>
  );
}

/**
 * A headline number with its change vs the previous period. Green means
 * better: for Google position, lower is better, so `lowerIsBetter` flips it.
 */
export function KpiTile({
  label,
  value,
  current,
  previous,
  comparedTo,
  lowerIsBetter = false,
}: {
  label: string;
  value: string;
  current: number;
  previous: number;
  comparedTo: string;
  lowerIsBetter?: boolean;
}) {
  const pct = percentChange(current, previous);
  const rounded = pct === null ? null : Math.round(pct);
  const better = rounded === null || rounded === 0 ? null : lowerIsBetter ? rounded < 0 : rounded > 0;
  const tone = better === null ? "text-ink-muted" : better ? "text-emerald-700" : "text-red-700";
  const arrow = rounded === null || rounded === 0 ? null : rounded > 0 ? "▲" : "▼";

  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-2xl border border-ink/10 bg-paper p-4">
      <span className="text-xs text-ink-muted">{label}</span>
      <span className="font-sans text-2xl font-semibold text-ink sm:text-[1.7rem]">{value}</span>
      <span className={`text-xs ${tone}`}>
        {arrow && <span aria-hidden="true">{arrow} </span>}
        {arrow && <span className="sr-only">{rounded! > 0 ? "up " : "down "}</span>}
        {formatChange(pct)} <span className="text-ink-muted">{comparedTo}</span>
      </span>
    </div>
  );
}

/** A KPI tile whose own data failed to load. */
export function KpiTileError({ label, message }: { label: string; message: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-2xl border border-ink/10 bg-paper p-4">
      <span className="text-xs text-ink-muted">{label}</span>
      <span className="font-sans text-2xl font-semibold text-ink-muted">—</span>
      <span role="alert" className="text-xs text-red-700">
        {message}
      </span>
    </div>
  );
}

function EmptyRows() {
  return <p className="text-sm text-ink-muted">No data for this period yet.</p>;
}

/** Label + value rows with a thin share-of-top bar under each label. */
export function RankedTable({
  panel,
  labelHeader,
  valueHeader,
  formatLabel = (s) => s,
}: {
  panel: Panel<RankedRow[]>;
  labelHeader: string;
  valueHeader: string;
  formatLabel?: (label: string) => string;
}) {
  if (!panel.ok) return <PanelError message={panel.error} />;
  if (panel.data.length === 0) return <EmptyRows />;
  const max = Math.max(1, ...panel.data.map((r) => r.value));
  return (
    <table className="w-full table-fixed text-left text-sm">
      <thead>
        <tr className="text-xs text-ink-muted">
          <th className="pb-2 font-medium">{labelHeader}</th>
          <th className="w-20 pb-2 text-right font-medium">{valueHeader}</th>
        </tr>
      </thead>
      <tbody>
        {panel.data.map((row) => (
          <tr key={row.label}>
            <td className="py-1.5 pr-3">
              <span className="block truncate text-ink" title={row.label}>
                {formatLabel(row.label)}
              </span>
              <span className="mt-1 block h-[3px] rounded-full bg-loom/70" style={{ width: `${(row.value / max) * 100}%` }} aria-hidden="true" />
            </td>
            <td className="py-1.5 text-right align-top tabular-nums text-ink">{formatCount(row.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Search Console rows: label, clicks, impressions, average position. */
export function GscTable({
  panel,
  labelHeader,
  formatLabel = (s) => s,
}: {
  panel: Panel<GscRow[]>;
  labelHeader: string;
  formatLabel?: (label: string) => string;
}) {
  if (!panel.ok) return <PanelError message={panel.error} />;
  if (panel.data.length === 0) return <EmptyRows />;
  return (
    <table className="w-full table-fixed text-left text-sm">
      <thead>
        <tr className="text-xs text-ink-muted">
          <th className="pb-2 font-medium">{labelHeader}</th>
          <th className="w-14 pb-2 text-right font-medium">Clicks</th>
          <th className="hidden w-24 pb-2 text-right font-medium sm:table-cell">Shown</th>
          <th className="w-16 pb-2 text-right font-medium">Position</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-ink/5">
        {panel.data.map((row) => (
          <tr key={row.label}>
            <td className="truncate py-1.5 pr-3 text-ink" title={row.label}>
              {formatLabel(row.label)}
            </td>
            <td className="py-1.5 text-right tabular-nums text-ink">{formatCount(row.clicks)}</td>
            <td className="hidden py-1.5 text-right tabular-nums text-ink sm:table-cell">{formatCount(row.impressions)}</td>
            <td className="py-1.5 text-right tabular-nums text-ink">{row.position > 0 ? row.position.toFixed(1) : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function RealtimeBadge({ panel }: { panel: Panel<number> }) {
  if (!panel.ok) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-paper px-3 py-1.5 text-sm text-ink-muted" title={panel.error}>
        <span className="h-2 w-2 rounded-full bg-ink/30" aria-hidden="true" />
        Active now: unavailable
      </span>
    );
  }
  const live = panel.data > 0;
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-paper px-3 py-1.5 text-sm text-ink"
      title="Visitors on the site in the last 30 minutes (all hostnames)"
    >
      <span className="relative flex h-2 w-2" aria-hidden="true">
        {live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60" />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${live ? "bg-emerald-600" : "bg-ink/30"}`} />
      </span>
      <span>
        <span className="font-semibold">{formatCount(panel.data)}</span> active now
      </span>
    </span>
  );
}

export function NotConnectedPanel({
  missing,
  help,
  unlocks,
}: {
  missing: AnalyticsEnvName[];
  help: Record<AnalyticsEnvName, string>;
  unlocks: Record<AnalyticsEnvName, string>;
}) {
  return (
    <section aria-labelledby="not-connected-heading" className="flex flex-col gap-3 rounded-2xl border border-brass/40 bg-brass/5 p-4 sm:p-5">
      <h2 id="not-connected-heading" className="display-md text-ink">
        Not connected yet
      </h2>
      <p className="text-sm text-ink-muted">
        Add these values in Vercel (Project → Settings → Environment Variables), then redeploy. The step-by-step guide
        is <code className="text-ink">docs/analytics-setup.md</code>.
      </p>
      <ul className="flex flex-col gap-3">
        {missing.map((name) => (
          <li key={name} className="flex flex-col gap-0.5">
            <code className="break-all font-mono text-sm font-medium text-ink">{name}</code>
            <span className="text-sm text-ink-muted">
              {help[name]} <span className="text-xs">(switches on: {unlocks[name]})</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
