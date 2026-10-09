"use client";

import { useState, useTransition } from "react";
import type { CleanupReport, StorageUsage } from "@/lib/cpanel-api";
import { plural } from "@/lib/admin/plural";
import { runCleanupAction } from "./actions";

const mb = (bytes: number) => `${(bytes / 1048576).toFixed(bytes < 10485760 ? 2 : 1)} MB`;

/** Disk used by uploads, what is dead weight, and a safe preview-then-clean housekeeping button. */
export function StoragePanel({ usage }: { usage: StorageUsage }) {
  const [report, setReport] = useState<CleanupReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function run(dryRun: boolean) {
    setError(null);
    start(async () => {
      try {
        setReport(await runCleanupAction(dryRun));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Cleanup failed");
      }
    });
  }

  return (
    <section className="rounded-2xl border border-ink/10 p-5">
      <h2 className="field-label mb-2">Storage</h2>
      <p className="text-sm text-ink">
        {usage.files === 0 ? (
          "No files have been uploaded yet."
        ) : (
          <>
            Uploads use <strong>{mb(usage.bytes)}</strong> in {plural(usage.files, "file")}.{" "}
            {usage.unused_files > 0 ? (
              <>
                <strong>{usage.unused_files}</strong> of them ({mb(usage.unused_bytes)}){" "}
                {usage.unused_files === 1 ? "is" : "are"} not used by any content.
              </>
            ) : (
              "Every file is in use."
            )}
          </>
        )}{" "}
        {usage.trashed_items > 0 && (
          <>
            {plural(usage.trashed_items, "item")} {usage.trashed_items === 1 ? "is" : "are"} waiting in the trash.
          </>
        )}
      </p>
      <p className="mt-1 text-xs text-ink-muted">
        Automatic cleanup removes trash older than 30 days and unused files older than 3 days. Files that live content,
        or restorable trash, still use are never removed.
      </p>
      <div className="mt-3 flex gap-2">
        <button type="button" className="btn btn-outline" disabled={pending} onClick={() => run(true)}>
          {pending ? "Working…" : "Preview cleanup"}
        </button>
        {report?.dry_run && (report.deleted.length > 0 || report.purged_items > 0) && (
          <button type="button" className="btn btn-primary" disabled={pending} onClick={() => run(false)}>
            Clean up now
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      {report && (
        <div className="mt-3 text-sm text-ink">
          <p>
            {report.dry_run ? "Would free" : "Freed"} <strong>{mb(report.bytes_freed)}</strong>
            {report.purged_items > 0 && ` and remove ${plural(report.purged_items, "expired trash item")}`}.
            {report.deleted.length === 0 && report.purged_items === 0 && " Nothing to clean."}
          </p>
          {report.deleted.length > 0 && (
            <ul className="mt-1 max-h-40 overflow-auto text-xs text-ink-muted">
              {report.deleted.map((d) => (
                <li key={d.path}>
                  {d.path} · {mb(d.bytes)} · {d.why}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
