"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { updateSection } from "@/lib/cpanel-api";
import { verifySessionCookie } from "@/lib/session";

export async function saveSectionAction(sectionKey: string, fields: Record<string, unknown>): Promise<void> {
  const cookie = cookies().get("nova_admin_session")?.value;
  const token = cookie ? verifySessionCookie(cookie) : null;
  if (!token) throw new Error("Not authenticated");

  await updateSection(sectionKey, fields, token);
  revalidatePath("/"); // public homepage re-reads this section on next request
}

