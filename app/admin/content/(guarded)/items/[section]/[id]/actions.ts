"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePublicContent } from "@/lib/revalidate-content";
import { updateItem } from "@/lib/cpanel-api";
import { verifySessionCookie } from "@/lib/session";

export async function saveItemAction(section: string, id: number, fields: Record<string, unknown>): Promise<void> {
  const cookie = cookies().get("nova_admin_session")?.value;
  const token = cookie ? verifySessionCookie(cookie) : null;
  if (!token) throw new Error("Not authenticated");

  await updateItem(id, fields, token);
  revalidatePublicContent();
  redirect(`/admin/content/items/${section}`);
}

