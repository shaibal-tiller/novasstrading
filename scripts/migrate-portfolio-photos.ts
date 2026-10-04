import "server-only";
import { listItems, createItem, updateItem } from "@/lib/cpanel-api";

/**
 * One-off: moves the photos that are nested inside each `portfolio.tabs` row into
 * their own `portfolio.photos` items, so every photo can be reordered, resized,
 * hidden, deleted and restored individually.
 *
 *   npm run migrate:photos -- --dry-run     # show what would happen
 *   MIGRATION_SESSION_TOKEN=... npm run migrate:photos
 *
 * Safe to re-run: it does nothing if `portfolio.photos` already has items. Photos
 * are created BEFORE the tab rows are stripped, so a failure part-way leaves the
 * nested copies in place (the site keeps rendering them) - fix the cause and re-run
 * after clearing the partial `portfolio.photos` items from the trash/DB.
 */
async function run() {
  const dryRun = process.argv.includes("--dry-run");

  const existing = await listItems("portfolio.photos");
  if (existing.length > 0) {
    console.log(`portfolio.photos already has ${existing.length} items - nothing to do.`);
    return;
  }

  const tabs = await listItems("portfolio.tabs");
  const plan = tabs.map((t) => {
    const { photos, ...rest } = t.fields as Record<string, unknown> & { photos?: Record<string, unknown>[] };
    return { id: t.id, key: String(rest.key), rest, photos: photos ?? [] };
  });
  const total = plan.reduce((n, t) => n + t.photos.length, 0);
  for (const t of plan) console.log(`  ${t.key}: ${t.photos.length} photos`);
  console.log(`Plan: create ${total} photo items, then strip photos from ${plan.length} tab rows.`);
  if (dryRun) return;

  const token = process.env.MIGRATION_SESSION_TOKEN;
  if (!token) throw new Error("Set MIGRATION_SESSION_TOKEN (from a real admin login) before running for real.");

  for (const t of plan) {
    for (const photo of t.photos) {
      await createItem("portfolio.photos", { tab: t.key, ...photo }, token);
    }
    console.log(`  created ${t.photos.length} for ${t.key}`);
  }
  for (const t of plan) {
    await updateItem(t.id, t.rest, token);
  }
  console.log("Done. Run `npm run verify:content` to confirm the site content is unchanged.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
