import "server-only";
import * as bundled from "@/lib/content";
import { getContentBundle } from "@/lib/cpanel-api";
import { assembleContent } from "@/lib/content-assemble";
import { SECTION_REGISTRY } from "@/lib/admin/section-registry";

/**
 * Proves the database holds exactly what ships in lib/content.ts: reads the
 * content API, reassembles it the way the public site does (WITHOUT the
 * bundled-content fallback that would hide gaps), and deep-compares every
 * export against lib/content.ts.
 *
 *   npm run verify:content
 */
// Fields in lib/content.ts that are deliberately NOT stored in the database.
// leadTime.columns is dead data: LeadTimeTable.tsx hardcodes its own headers
// (see lib/admin/section-registry.tsx) and scripts/migrate-content.ts skips it.
const NOT_MIGRATED: Record<string, string[]> = { leadTime: ["columns"] };

function withoutUnmigrated(key: string, value: unknown): unknown {
  const skip = NOT_MIGRATED[key];
  if (!skip || !value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([f]) => !skip.includes(f)));
}

function canonical(value: unknown): string {
  return JSON.stringify(value, (_k, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  );
}

async function run() {
  const { sections, items } = await getContentBundle();
  const listKeys = SECTION_REGISTRY.flatMap((e) => e.lists.map((l) => l.listKey));
  const itemsByListKey = Object.fromEntries(listKeys.map((k) => [k, items[k] ?? []]));
  const fromDb = assembleContent(sections, itemsByListKey);

  const expected = bundled as unknown as Record<string, unknown>;
  let mismatches = 0;
  for (const key of Object.keys(expected)) {
    const same = canonical(fromDb[key]) === canonical(withoutUnmigrated(key, expected[key]));
    console.log(`${same ? "  OK    " : "  DIFF  "}${key}`);
    if (!same) mismatches++;
  }
  const extra = Object.keys(fromDb).filter((k) => !(k in expected));
  if (extra.length) console.log(`  (db has extra keys not in lib/content.ts: ${extra.join(", ")})`);

  console.log(mismatches === 0 ? "\nDatabase matches lib/content.ts exactly." : `\n${mismatches} export(s) differ.`);
  process.exit(mismatches === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
