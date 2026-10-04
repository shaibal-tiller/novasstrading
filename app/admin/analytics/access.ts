import { redirect } from "next/navigation";
import { getAdminSession, hasModule, type AdminSession } from "@/lib/admin-session";

/**
 * Analytics is open to anyone with the "website" module. Called by both the
 * layout and the page (the session lookup is cached for 30 s), so a range
 * change — which re-renders only the page — is still checked.
 */
export async function requireAnalyticsAccess(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login?next=" + encodeURIComponent("/admin/analytics"));
  if (!hasModule(session, "website")) redirect("/admin");
  return session;
}
