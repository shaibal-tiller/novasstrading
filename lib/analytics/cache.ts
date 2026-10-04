import "server-only";

/**
 * A small in-memory TTL cache for Google reports, so reloading the Analytics
 * page (or several admins looking at once) stays well inside API quotas.
 * Only successes are cached; concurrent loads of the same key share one call.
 */

export const REPORT_TTL_MS = 10 * 60_000;
export const REALTIME_TTL_MS = 60_000;
const MAX_ENTRIES = 300;

type Entry = { value: unknown; expiresAt: number };
const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

/** Test hook. */
export function __resetAnalyticsCache(): void {
  store.clear();
  inflight.clear();
}

function makeRoom(now: number): void {
  if (store.size < MAX_ENTRIES) return;
  store.forEach((entry, key) => {
    if (entry.expiresAt <= now) store.delete(key);
  });
  while (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}

export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value as T;

  const running = inflight.get(key);
  if (running) return running as Promise<T>;

  const request = load()
    .then((value) => {
      const now = Date.now();
      makeRoom(now);
      store.set(key, { value, expiresAt: now + ttlMs });
      return value;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, request);
  return request;
}
