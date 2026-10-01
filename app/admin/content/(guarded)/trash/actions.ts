"use server";

import { cookies } from "next/headers";
import { revalidatePublicContent } from "@/lib/revalidate-content";
import { restoreItem } from "@/lib/cpanel-api";
import { verifySessionCookie } from "@/lib/session";

export async function restoreItemAction(id: number): Promise<void> {
  const cookie = cookies().get("nova_admin_session")?.value;
  const token = cookie ? verifySessionCookie(cookie) : null;
  if (!token) throw new Error("Not authenticated");
  await restoreItem(id, token);
  revalidatePublicContent();
}

