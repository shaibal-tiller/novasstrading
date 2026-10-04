import "server-only";
import { createSign } from "node:crypto";
import { GoogleApiError, GoogleConfigError } from "./errors";

/**
 * Google service-account sign-in with plain fetch + node:crypto (no Google
 * SDKs): build an RS256 JWT, sign it with the account's private key, and
 * swap it for a 1-hour access token. Tokens are cached in memory per scope.
 */

export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const JWT_BEARER_GRANT = "urn:ietf:params:oauth:grant-type:jwt-bearer";

export const SCOPES = {
  analytics: "https://www.googleapis.com/auth/analytics.readonly",
  searchConsole: "https://www.googleapis.com/auth/webmasters.readonly",
} as const;

const JWT_LIFETIME_SEC = 3600;
/** Refresh a cached token this long before Google says it expires. */
const EXPIRY_MARGIN_MS = 60_000;
const REQUEST_TIMEOUT_MS = 15_000;

export type ServiceAccount = { client_email: string; private_key: string };

/**
 * GOOGLE_SERVICE_ACCOUNT_JSON → service account. Accepts the key file's JSON
 * as-is or base64-encoded. Empty → null (not connected). Malformed → throws
 * a GoogleConfigError whose message never echoes the value.
 */
export function parseServiceAccount(raw: string | undefined | null): ServiceAccount | null {
  const text = raw?.trim();
  if (!text) return null;

  const jsonText = text.startsWith("{") ? text : Buffer.from(text, "base64").toString("utf8").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new GoogleConfigError(
      "GOOGLE_SERVICE_ACCOUNT_JSON could not be read — paste the whole JSON key file (or its base64).",
    );
  }
  const obj = (parsed ?? {}) as Record<string, unknown>;
  if (typeof obj.client_email !== "string" || !obj.client_email || typeof obj.private_key !== "string" || !obj.private_key) {
    throw new GoogleConfigError(
      "GOOGLE_SERVICE_ACCOUNT_JSON is missing client_email or private_key — use the JSON key of a service account.",
    );
  }
  // Keys pasted into some dashboards arrive with literal "\n" instead of newlines.
  return { client_email: obj.client_email, private_key: obj.private_key.replace(/\\n/g, "\n") };
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

export type JwtClaims = { iss: string; scope: string; aud: string; iat: number; exp: number };

export function jwtClaims(sa: ServiceAccount, scope: string, nowSec: number): JwtClaims {
  return { iss: sa.client_email, scope, aud: GOOGLE_TOKEN_URL, iat: nowSec, exp: nowSec + JWT_LIFETIME_SEC };
}

/** header.claims.signature, RS256-signed with the service account's private key. */
export function signJwt(sa: ServiceAccount, scope: string, nowSec = Math.floor(Date.now() / 1000)): string {
  const header = { alg: "RS256", typ: "JWT" };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(jwtClaims(sa, scope, nowSec)))}`;
  let signature: Buffer;
  try {
    signature = createSign("RSA-SHA256").update(signingInput).sign(sa.private_key);
  } catch {
    throw new GoogleConfigError(
      "The private_key in GOOGLE_SERVICE_ACCOUNT_JSON could not be used — paste the key file exactly as downloaded.",
    );
  }
  return `${signingInput}.${base64url(signature)}`;
}

type CachedToken = { token: string; expiresAt: number };
const tokens = new Map<string, CachedToken>();
const pending = new Map<string, Promise<string>>();

/** Test hook. */
export function __resetGoogleTokenCache(): void {
  tokens.clear();
  pending.clear();
}

function tokenKey(sa: ServiceAccount, scope: string): string {
  return `${sa.client_email} ${scope}`;
}

async function exchangeJwt(sa: ServiceAccount, scope: string): Promise<CachedToken> {
  const assertion = signJwt(sa, scope);
  let res: Response;
  try {
    res = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: JWT_BEARER_GRANT, assertion }).toString(),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new GoogleApiError("Could not reach Google to sign in.", 0, "NETWORK");
  }
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || typeof body.access_token !== "string") {
    const reason = typeof body.error === "string" ? body.error : undefined;
    const detail = typeof body.error_description === "string" ? body.error_description : reason ?? `HTTP ${res.status}`;
    throw new GoogleApiError(`Sign-in failed: ${detail}`, res.status, reason);
  }
  const expiresIn = typeof body.expires_in === "number" && body.expires_in > 0 ? body.expires_in : JWT_LIFETIME_SEC;
  return { token: body.access_token, expiresAt: Date.now() + expiresIn * 1000 };
}

/**
 * An access token for `scope`, from memory until ~60 s before it expires.
 * Concurrent callers share one in-flight exchange.
 */
export async function getAccessToken(scope: string, sa: ServiceAccount): Promise<string> {
  const key = tokenKey(sa, scope);
  const hit = tokens.get(key);
  if (hit && hit.expiresAt - EXPIRY_MARGIN_MS > Date.now()) return hit.token;

  const inflight = pending.get(key);
  if (inflight) return inflight;

  const request = exchangeJwt(sa, scope)
    .then((fresh) => {
      tokens.set(key, fresh);
      return fresh.token;
    })
    .finally(() => pending.delete(key));
  pending.set(key, request);
  return request;
}

type GoogleErrorBody = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: { reason?: string }[];
    errors?: { reason?: string }[];
  };
};

/** POST a JSON body to a Google API as the service account; throws GoogleApiError on failure. */
export async function googlePostJson<T>(url: string, scope: string, sa: ServiceAccount, body: unknown): Promise<T> {
  const token = await getAccessToken(scope, sa);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new GoogleApiError("Could not reach Google.", 0, "NETWORK");
  }
  const json = (await res.json().catch(() => null)) as (T & GoogleErrorBody) | null;
  if (!res.ok) {
    if (res.status === 401) tokens.delete(tokenKey(sa, scope));
    const err = json?.error ?? {};
    const reason =
      err.details?.find((d) => d?.reason)?.reason ?? err.errors?.find((e) => e?.reason)?.reason ?? err.status;
    throw new GoogleApiError(err.message || `HTTP ${res.status}`, res.status, reason);
  }
  return (json ?? {}) as T;
}
