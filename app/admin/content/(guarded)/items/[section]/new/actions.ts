"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createItem } from "@/lib/cpanel-api";
import { verifySessionCookie } from "@/lib/session";

export async function createItemAction(section: string, fields: Record<string, unknown>): Promise<void> {
  const cookie = cookies().get("nova_admin_session")?.value;
  const token = cookie ? verifySessionCookie(cookie) : null;
  if (!token) throw new Error("Not authenticated");

  await createItem(section, fields, token);
  revalidatePath("/");
  redirect(`/admin/content/items/${section}`);
}

