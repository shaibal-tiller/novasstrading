/**
 * Nova SS Trading — automatic origin failover
 * ─────────────────────────────────────────────
 * Runs on every request to novasstrading.com (and www).
 *
 *   1. Try Vercel (primary).           → healthy: serve it
 *   2. 5xx / timeout / network error?  → serve Exonhost standby
 *
 * Extra over the basic sketch: a short "Vercel is down" memory.
 * Without it, EVERY asset on the standby page (images, JS, CSS)
 * would separately wait out the 5s timeout before falling back —
 * making the standby unusably slow exactly when it's needed.
 * With it, after one failure the next 60s of requests go straight
 * to the standby, then Vercel is probed again automatically.
 */

// ── Config ──────────────────────────────────────────────────────
const PRIMARY = "https://novasstrading.vercel.app"; // Vercel deployment URL
const BACKUP = "https://standby.novasstrading.com"; // Exonhost (DNS-only / grey-cloud subdomain!)
const TIMEOUT_MS = 5000; // how long to give Vercel before failing over
const DOWN_TTL_MS = 60_000; // how long to remember that Vercel is down

// Per-isolate memory (resets naturally; that's fine — it's a hint, not a lock)
let primaryDownUntil = 0;

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // POST bodies can only be read once — keep a clone for the fallback.
    const forFallback = request.method === "GET" || request.method === "HEAD"
      ? request
      : request.clone();

    // While Vercel is marked down, skip the doomed attempt entirely.
    if (Date.now() >= primaryDownUntil) {
      try {
        const res = await proxy(request, url, PRIMARY, TIMEOUT_MS);
        if (res.status < 500) return res; // healthy (4xx are real answers)
        // 5xx → remember and fall through to standby
        primaryDownUntil = Date.now() + DOWN_TTL_MS;
      } catch {
        // timeout / network error → remember and fall through
        primaryDownUntil = Date.now() + DOWN_TTL_MS;
      }
    }

    // Standby. No timeout race here — it's the last resort.
    const res = await proxy(forFallback, url, BACKUP, 15_000);
    // Tag the response so you can tell which origin served it (debugging).
    const tagged = new Response(res.body, res);
    tagged.headers.set("x-served-by", "standby");
    return tagged;
  },
};

function proxy(request, url, origin, timeoutMs) {
  const target = new URL(url.pathname + url.search, origin);
  return fetch(new Request(target, request), {
    signal: AbortSignal.timeout(timeoutMs),
    redirect: "manual", // pass redirects through untouched
  });
}
