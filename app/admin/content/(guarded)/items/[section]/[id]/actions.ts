"use server";

import { redirect } from "next/navigation";
import { revalidatePublicContent } from "@/lib/revalidate-content";
import { updateItem } from "@/lib/cpanel-api";
import { requireContentToken } from "@/lib/admin-auth";

export async function saveItemAction(section: string, id: number, fields: Record<string, unknown>): Promise<void> {
  const token = await requireContentToken();

  await updateItem(id, fields, token);
  revalidatePublicContent();
  redirect(`/admin/content/items/${section}`);
}

