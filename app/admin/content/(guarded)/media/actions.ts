"use server";

import { revalidatePath } from "next/cache";
import { deleteMedia, runCleanup, type CleanupReport } from "@/lib/cpanel-api";
import { requireContentToken } from "@/lib/admin-auth";

export async function deleteMediaAction(id: number): Promise<void> {
  const token = await requireContentToken();

  await deleteMedia(id, token);
  revalidatePath("/admin/content/media");
}

/**
 * Housekeeping: permanently removes trash older than 30 days and uploaded files nothing
 * uses (older than 3 days, so a photo you just uploaded but have not confirmed yet is safe).
 * `dryRun` only reports what would go.
 */
export async function runCleanupAction(dryRun: boolean): Promise<CleanupReport> {
  const token = await requireContentToken();
  const report = await runCleanup(dryRun, token);
  if (!dryRun) {
    revalidatePath("/admin/content/media");
    revalidatePath("/admin/content/trash");
  }
  return report;
}
