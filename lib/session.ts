import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

function secret(): string {
  const s = process.env.SESSION_COOKIE_SECRET;
  if (!s) throw new Error("SESSION_COOKIE_SECRET is not set");
  return s;
}

export function signSessionCookie(token: string): string {
  const payload = Buffer.from(token, "utf8").toString("base64url");
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySessionCookie(cookieValue: string): string | null {
  const parts = cookieValue.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    return Buffer.from(payload, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

