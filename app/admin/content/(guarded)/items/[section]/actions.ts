"use server";

import { revalidatePublicContent } from "@/lib/revalidate-content";
import { deleteItem, reorderItems } from "@/lib/cpanel-api";
import { requireContentToken } from "@/lib/admin-auth";

export async function deleteItemAction(id: number): Promise<void> {
  await deleteItem(id, await requireContentToken());
  revalidatePublicContent();
}

export async function reorderItemsAction(section: string, ids: number[]): Promise<void> {
  await reorderItems(section, ids, await requireContentToken());
  revalidatePublicContent();
}

