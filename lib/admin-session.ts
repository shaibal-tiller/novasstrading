import "server-only";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";

/**
 * The shared admin session. The Assets ("inventory") app is the identity
 * store: it issues the httpOnly `nova_session` cookie at
 * /admin/inventory/api/auth/verify-code and answers "who is this?" at
 * /admin/inventory/api/auth/me. This app never decodes the cookie itself —
 * it only forwards it to that endpoint.
 */
export const ADMIN_SESSION_COOKIE = "nova_session";

export type AdminModule = "website" | "assets";
export type AdminRole = "admin" | "viewer";
export type AdminSession = { email: string; role: AdminRole; modules: AdminModule[] };

const KNOWN_MODULES: readonly AdminModule[] = ["website", "assets"];

const POSITIVE_TTL_MS = 30_000;
const NEGATIVE_TTL_MS = 5_000;
const MAX_CACHE_ENTRIES = 500;
const ME_TIMEOUT_MS = 5_000;

type CacheEntry = { session: AdminSession | null; expiresAt: number };
const cache = new Map<string, CacheEntry>();

/** Test hook: forget every cached lookup. */
export function __resetAdminSessionCache(): void {
  cache.clear();
}

function cacheKey(cookieValue: string): string {
  return createHash("sha256").update(cookieValue).digest("hex");
}

function remember(key: string, session: AdminSession | null, now: number): void {
  if (cache.size >= MAX_CACHE_ENTRIES && !cache.has(key)) {
    cache.forEach((entry, k) => {
      if (entry.expiresAt <= now) cache.delete(k);
    });
    // Still full: drop the oldest insertions (Map iterates in insertion order).
    while (cache.size >= MAX_CACHE_ENTRIES) {
      const oldest = cache.keys().next().value;
      if (oldest === undefined) break;
      cache.delete(oldest);
    }
  }
  cache.delete(key); // re-insert so it counts as the newest
  cache.set(key, { session, expiresAt: now + (session ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS) });
}

function parseSession(body: unknown): AdminSession | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (b.ok !== true || typeof b.email !== "string" || !b.email) return null;
  const role: AdminRole = b.role === "admin" ? "admin" : "viewer";
  const modules = Array.isArray(b.modules)
    ? KNOWN_MODULES.filter((m) => (b.modules as unknown[]).includes(m))
    : [];
  return { email: b.email, role, modules };
}

async function fetchSession(cookieValue: string): Promise<AdminSession | null> {
  const base = process.env.INVENTORY_URL;
  if (!base) return null;
  try {
    const res = await fetch(`${base.replace(/\/+$/, "")}/admin/inventory/api/auth/me`, {
      headers: { cookie: `${ADMIN_SESSION_COOKIE}=${cookieValue}` },
      cache: "no-store",
      signal: AbortSignal.timeout(ME_TIMEOUT_MS),
    });
    if (res.status !== 200) return null;
    return parseSession(await res.json());
  } catch {
    return null;
  }
}

/**
 * Who is signed in, or null. Results are cached per cookie value for 30 s
 * (negatives for 5 s) so a page render plus its server actions do not each
 * make a round trip to the Assets app.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieValue = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!cookieValue) return null;

  const key = cacheKey(cookieValue);
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) return hit.session;

  const session = await fetchSession(cookieValue);
  remember(key, session, Date.now());
  return session;
}

export function hasModule(session: AdminSession | null | undefined, module: AdminModule): boolean {
  return !!session && session.modules.includes(module);
}
