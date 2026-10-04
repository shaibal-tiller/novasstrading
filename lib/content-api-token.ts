import "server-only";
import { createHmac } from "node:crypto";

/** The PHP content API's single admin row. */
export const CONTENT_API_ADMIN_ID = 1;
/** Short-lived on purpose: one is minted per request after the shared session is checked. */
export const CONTENT_API_TOKEN_LIFETIME_SECONDS = 300;

/**
 * Mints a bearer token the PHP content API accepts, in exactly the format of
 * cpanel-api/src/Auth.php issueToken():
 *   "<adminId>.<expiresAtUnixSeconds>.<hex HMAC-SHA256("<adminId>.<expiresAt>", SESSION_SECRET)>"
 * CPANEL_SESSION_SECRET must equal the PHP server's SESSION_SECRET.
 */
export function mintContentApiToken(now: number = Date.now()): string {
  const secret = process.env.CPANEL_SESSION_SECRET;
  if (!secret) {
    throw new Error("CPANEL_SESSION_SECRET is not set (it must match the content API's SESSION_SECRET)");
  }
  const expiresAt = Math.floor(now / 1000) + CONTENT_API_TOKEN_LIFETIME_SECONDS;
  const payload = `${CONTENT_API_ADMIN_ID}.${expiresAt}`;
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${signature}`;
}
