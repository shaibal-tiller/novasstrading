"use server";

import { cookies } from "next/headers";
import { revalidatePublicContent } from "@/lib/revalidate-content";
import { deleteItem, reorderItems } from "@/lib/cpanel-api";
import { verifySessionCookie } from "@/lib/session";

function requireToken(): string {
  const cookie = cookies().get("nova_admin_session")?.value;
  const token = cookie ? verifySessionCookie(cookie) : null;
  if (!token) throw new Error("Not authenticated");
  return token;
}

export async function deleteItemAction(id: number): Promise<void> {
  await deleteItem(id, requireToken());
  revalidatePublicContent();
}

export async function reorderItemsAction(section: string, ids: number[]): Promise<void> {
  await reorderItems(section, ids, requireToken());
  revalidatePublicContent();
}

