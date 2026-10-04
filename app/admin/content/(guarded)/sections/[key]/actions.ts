"use server";

import { revalidatePublicContent } from "@/lib/revalidate-content";
import { updateSection } from "@/lib/cpanel-api";
import { requireContentToken } from "@/lib/admin-auth";

export async function saveSectionAction(sectionKey: string, fields: Record<string, unknown>): Promise<void> {
  const token = await requireContentToken();

  await updateSection(sectionKey, fields, token);
  revalidatePublicContent(); // public homepage re-reads this section on next request
}

