import "server-only";
import { headers } from "next/headers";
import { safeNextPath } from "@/lib/admin-redirect";

/**
 * The admin page being requested right now (set by middleware.ts), as a safe post-sign-in
 * destination. Falls back to `fallback` when the header is missing or not an admin sub-page.
 */
export function requestedAdminPath(fallback: string): string {
  let raw: string | null = null;
  try {
    raw = headers().get("x-admin-path");
  } catch {
    // Not inside a request (e.g. under test): use the fallback.
  }
  return raw && raw.startsWith("/admin/") ? safeNextPath(raw) : fallback;
}
