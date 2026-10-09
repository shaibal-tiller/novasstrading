"use server";

import { revalidatePath } from "next/cache";
import { revalidatePublicContent } from "@/lib/revalidate-content";
import { emptyTrash, purgeItem, restoreItem } from "@/lib/cpanel-api";
import { requireContentToken } from "@/lib/admin-auth";

export async function restoreItemAction(id: number): Promise<void> {
  const token = await requireContentToken();
  await restoreItem(id, token);
  revalidatePublicContent();
}

/** Permanently deletes one trashed item (and its photo, if nothing else uses it). Cannot be undone. */
export async function purgeItemAction(id: number): Promise<void> {
  await purgeItem(id, await requireContentToken());
  revalidatePath("/admin/content/trash");
  revalidatePath("/admin/content/media");
}

/** Permanently deletes everything in the trash. Cannot be undone. */
export async function emptyTrashAction(): Promise<void> {
  await emptyTrash(await requireContentToken());
  revalidatePath("/admin/content/trash");
  revalidatePath("/admin/content/media");
}
