"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { revalidatePublicContent } from "@/lib/revalidate-content";
import { emptyTrash, purgeItem, restoreItem } from "@/lib/cpanel-api";
import { verifySessionCookie } from "@/lib/session";

export async function restoreItemAction(id: number): Promise<void> {
  const cookie = cookies().get("nova_admin_session")?.value;
  const token = cookie ? verifySessionCookie(cookie) : null;
  if (!token) throw new Error("Not authenticated");
  await restoreItem(id, token);
  revalidatePublicContent();
}

function token(): string {
  const cookie = cookies().get("nova_admin_session")?.value;
  const t = cookie ? verifySessionCookie(cookie) : null;
  if (!t) throw new Error("Not authenticated");
  return t;
}

/** Permanently deletes one trashed item (and its photo, if nothing else uses it). Cannot be undone. */
export async function purgeItemAction(id: number): Promise<void> {
  await purgeItem(id, token());
  revalidatePath("/admin/content/trash");
  revalidatePath("/admin/content/media");
}

/** Permanently deletes everything in the trash. Cannot be undone. */
export async function emptyTrashAction(): Promise<void> {
  await emptyTrash(token());
  revalidatePath("/admin/content/trash");
  revalidatePath("/admin/content/media");
}
