import "server-only";
import * as content from "@/lib/content";
import { updateSection, createItem, createMedia } from "@/lib/cpanel-api";

type Plan = {
  sectionWrites: { key: string; fields: Record<string, unknown> }[];
  itemWrites: { section: string; fields: Record<string, unknown> }[];
};

const LEAD_TIME_ROW_KEYS = ["product", "sampleLeadTime", "productionLeadTime"] as const;

/**
 * Splits every top-level export of lib/content.ts into:
 * - one section write per export, containing only its scalar/object fields
 * - one item write per array field found on that export, keyed "<exportName>.<arrayFieldName>"
 * Bare top-level arrays/strings (nav, footerBlurb) and array-of-primitive fields
 * (about.highlights, leadTime.rows, ...) are wrapped so every item row stays an object —
 * see this task's ruling note for why.
 */
export function buildMigrationPlan(source: Record<string, unknown>): Plan {
  const plan: Plan = { sectionWrites: [], itemWrites: [] };

  for (const [exportName, value] of Object.entries(source)) {
    if (typeof value === "string") {
      plan.sectionWrites.push({ key: exportName, fields: { text: value } });
      continue;
    }
    if (Array.isArray(value)) {
      for (const entry of value) {
        plan.itemWrites.push({ section: exportName, fields: entry as Record<string, unknown> });
      }
      continue;
    }
    if (typeof value !== "object" || value === null) continue;

    const scalarFields: Record<string, unknown> = {};

    for (const [fieldName, fieldValue] of Object.entries(value as Record<string, unknown>)) {
      if (exportName === "leadTime" && fieldName === "columns") continue; // fixed headers, not content

      if (exportName === "leadTime" && fieldName === "rows" && Array.isArray(fieldValue)) {
        for (const row of fieldValue as string[][]) {
          plan.itemWrites.push({
            section: `${exportName}.${fieldName}`,
            fields: Object.fromEntries(LEAD_TIME_ROW_KEYS.map((key, i) => [key, row[i]])),
          });
        }
        continue;
      }

      // Portfolio tabs: each photo becomes its own `portfolio.photos` item (so it can
      // be reordered / hidden / trashed individually) pointing at its tab; the tab
      // row keeps only its label and categories. Tabs first, then photos in order.
      if (exportName === "portfolio" && fieldName === "tabs" && Array.isArray(fieldValue)) {
        const photoWrites: { section: string; fields: Record<string, unknown> }[] = [];
        for (const tab of fieldValue as Record<string, unknown>[]) {
          const { photos, ...tabFields } = tab;
          plan.itemWrites.push({ section: "portfolio.tabs", fields: tabFields });
          for (const photo of (photos as Record<string, unknown>[] | undefined) ?? []) {
            photoWrites.push({ section: "portfolio.photos", fields: { tab: tab.key, ...photo } });
          }
        }
        plan.itemWrites.push(...photoWrites);
        continue;
      }

      if (Array.isArray(fieldValue)) {
        for (const entry of fieldValue) {
          const fields = typeof entry === "string" ? { text: entry } : (entry as Record<string, unknown>);
          plan.itemWrites.push({ section: `${exportName}.${fieldName}`, fields });
        }
      } else {
        scalarFields[fieldName] = fieldValue;
      }
    }

    if (Object.keys(scalarFields).length > 0) {
      plan.sectionWrites.push({ key: exportName, fields: scalarFields });
    }
  }

  return plan;
}

async function run() {
  const dryRun = process.argv.includes("--dry-run");
  const plan = buildMigrationPlan(content as unknown as Record<string, unknown>);

  console.log(`Plan: ${plan.sectionWrites.length} section writes, ${plan.itemWrites.length} item writes.`);

  if (dryRun) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  const sessionToken = process.env.MIGRATION_SESSION_TOKEN;
  if (!sessionToken) throw new Error("Set MIGRATION_SESSION_TOKEN (from a real admin login) before running for real.");

  for (const write of plan.sectionWrites) {
    await updateSection(write.key, write.fields, sessionToken);
  }
  for (const write of plan.itemWrites) {
    await createItem(write.section, write.fields, sessionToken);
  }

  console.log("Migration complete. Image upload/re-encoding for public/assets/* is handled separately — see Task 17's upload path; run each existing image through the same admin upload flow after this script, or extend this script with a sharp-based batch pass before use.");
}

if (require.main === module) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

