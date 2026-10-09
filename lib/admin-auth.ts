import "server-only";
import { getAdminSession, hasModule } from "@/lib/admin-session";
import { mintContentApiToken } from "@/lib/content-api-token";

/**
 * For server actions / route handlers of the website editor: checks the shared
 * admin session has the "website" module, then mints a short-lived PHP content
 * API token. Throws "Not authenticated" otherwise.
 */
export async function requireContentToken(): Promise<string> {
  const session = await getAdminSession();
  if (!session || !hasModule(session, "website")) {
    throw new Error("Not authenticated");
  }
  return mintContentApiToken();
}
