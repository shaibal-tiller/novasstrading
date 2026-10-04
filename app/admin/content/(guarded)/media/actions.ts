"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { deleteMedia, runCleanup, type CleanupReport } from "@/lib/cpanel-api";
import { verifySessionCookie } from "@/lib/session";

export async function deleteMediaAction(id: number): Promise<void> {
  const cookie = cookies().get("nova_admin_session")?.value;
  const token = cookie ? verifySessionCookie(cookie) : null;
  if (!token) throw new Error("Not authenticated");

  await deleteMedia(id, token);
  revalidatePath("/admin/content/media");
}

/**
 * Housekeeping: permanently removes trash older than 30 days and uploaded files nothing
 * uses (older than 3 days, so a photo you just uploaded but have not confirmed yet is safe).
 * `dryRun` only reports what would go.
 */
export async function runCleanupAction(dryRun: boolean): Promise<CleanupReport> {
  const cookie = cookies().get("nova_admin_session")?.value;
  const token = cookie ? verifySessionCookie(cookie) : null;
  if (!token) throw new Error("Not authenticated");
  const report = await runCleanup(dryRun, token);
  if (!dryRun) {
    revalidatePath("/admin/content/media");
    revalidatePath("/admin/content/trash");
  }
  return report;
}
