"use server";

import { redirect } from "next/navigation";
import { revalidatePublicContent } from "@/lib/revalidate-content";
import { createItem } from "@/lib/cpanel-api";
import { requireContentToken } from "@/lib/admin-auth";

export async function createItemAction(section: string, fields: Record<string, unknown>): Promise<void> {
  const token = await requireContentToken();

  await createItem(section, fields, token);
  revalidatePublicContent();
  redirect(`/admin/content/items/${section}`);
}

