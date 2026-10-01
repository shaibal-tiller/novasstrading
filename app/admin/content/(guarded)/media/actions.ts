"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { deleteMedia } from "@/lib/cpanel-api";
import { verifySessionCookie } from "@/lib/session";

export async function deleteMediaAction(id: number): Promise<void> {
  const cookie = cookies().get("nova_admin_session")?.value;
  const token = cookie ? verifySessionCookie(cookie) : null;
  if (!token) throw new Error("Not authenticated");

  await deleteMedia(id, token);
  revalidatePath("/admin/content/media");
}

