// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createVerify, generateKeyPairSync } from "node:crypto";
import {
  __resetGoogleTokenCache,
  getAccessToken,
  googlePostJson,
  GOOGLE_TOKEN_URL,
  parseServiceAccount,
  SCOPES,
  signJwt,
} from "@/lib/analytics/google-auth";
import { GoogleApiError, GoogleConfigError } from "@/lib/analytics/errors";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});
const SA = { client_email: "reader@nova-test.iam.gserviceaccount.com", private_key: privateKey };

function decodePart(part: string) {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
}

function jsonResponse(status: number, body: unknown) {
  return { status, ok: status >= 200 && status < 300, json: async () => body };
}

const fetchMock = vi.fn();

beforeEach(() => {
  __resetGoogleTokenCache();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("parseServiceAccount", () => {
  const json = JSON.stringify({ type: "service_account", ...SA });

  it("returns null when unset or blank", () => {
    expect(parseServiceAccount(undefined)).toBeNull();
    expect(parseServiceAccount("   ")).toBeNull();
  });

  it("accepts the raw JSON key file", () => {
    expect(parseServiceAccount(json)).toEqual(SA);
  });

  it("accepts the key file base64-encoded", () => {
    expect(parseServiceAccount(Buffer.from(json).toString("base64"))).toEqual(SA);
  });

  it("turns literal \\n sequences in the private key back into newlines", () => {
    const escaped = JSON.stringify({ ...SA, private_key: privateKey.replace(/\n/g, "\\n") });
    expect(parseServiceAccount(escaped)?.private_key).toBe(privateKey);
  });

  it("throws a config error that does not echo the value when it is not JSON", () => {
    const secretish = "not-json-SECRET-VALUE";
    expect(() => parseServiceAccount(secretish)).toThrow(GoogleConfigError);
    try {
      parseServiceAccount(secretish);
    } catch (err) {
      expect((err as Error).message).not.toContain("SECRET");
    }
  });

  it("throws when client_email or private_key is missing", () => {
    expect(() => parseServiceAccount(JSON.stringify({ client_email: "x@y" }))).toThrow(/client_email or private_key/);
  });
});

describe("signJwt", () => {
  it("builds an RS256 JWT with the right claims and a signature the public key verifies", () => {
    const jwt = signJwt(SA, SCOPES.analytics, 1_800_000_000);
    const [header, claims, signature] = jwt.split(".");

    expect(decodePart(header)).toEqual({ alg: "RS256", typ: "JWT" });
    expect(decodePart(claims)).toEqual({
      iss: SA.client_email,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: 1_800_000_000,
      exp: 1_800_003_600,
    });

    const ok = createVerify("RSA-SHA256")
      .update(`${header}.${claims}`)
      .verify(publicKey, Buffer.from(signature, "base64url"));
    expect(ok).toBe(true);
  });

  it("uses URL-safe base64 without padding", () => {
    expect(signJwt(SA, SCOPES.searchConsole)).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  });

  it("reports an unusable private key as a config error", () => {
    expect(() => signJwt({ ...SA, private_key: "-----BEGIN PRIVATE KEY-----\nnope\n-----END PRIVATE KEY-----" }, SCOPES.analytics)).toThrow(
      GoogleConfigError,
    );
  });
});

describe("getAccessToken", () => {
  it("exchanges a signed JWT at Google's token endpoint", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { access_token: "tok-1", expires_in: 3599, token_type: "Bearer" }));

    expect(await getAccessToken(SCOPES.analytics, SA)).toBe("tok-1");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(GOOGLE_TOKEN_URL);
    expect(init.method).toBe("POST");
    expect(init.headers["content-type"]).toBe("application/x-www-form-urlencoded");
    const form = new URLSearchParams(init.body);
    expect(form.get("grant_type")).toBe("urn:ietf:params:oauth:grant-type:jwt-bearer");
    expect(decodePart(form.get("assertion")!.split(".")[1]).scope).toBe(SCOPES.analytics);
  });

  it("caches the token per scope until ~60 s before it expires", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-04T10:00:00Z"));
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { access_token: "analytics-1", expires_in: 3600 }))
      .mockResolvedValueOnce(jsonResponse(200, { access_token: "gsc-1", expires_in: 3600 }))
      .mockResolvedValueOnce(jsonResponse(200, { access_token: "analytics-2", expires_in: 3600 }));

    expect(await getAccessToken(SCOPES.analytics, SA)).toBe("analytics-1");
    expect(await getAccessToken(SCOPES.searchConsole, SA)).toBe("gsc-1"); // different scope, own token
    vi.setSystemTime(new Date("2026-10-04T10:58:00Z")); // 58 min later: still > 60 s left
    expect(await getAccessToken(SCOPES.analytics, SA)).toBe("analytics-1");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    vi.setSystemTime(new Date("2026-10-04T10:59:30Z")); // inside the 60 s margin → refresh
    expect(await getAccessToken(SCOPES.analytics, SA)).toBe("analytics-2");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("shares one exchange between concurrent callers", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { access_token: "tok", expires_in: 3600 }));
    const tokens = await Promise.all([1, 2, 3].map(() => getAccessToken(SCOPES.analytics, SA)));
    expect(tokens).toEqual(["tok", "tok", "tok"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws GoogleApiError with Google's reason when the key is rejected, and does not cache it", async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { error: "invalid_grant", error_description: "Invalid JWT Signature." }));
    const err = await getAccessToken(SCOPES.analytics, SA).catch((e) => e);
    expect(err).toBeInstanceOf(GoogleApiError);
    expect(err).toMatchObject({ status: 400, reason: "invalid_grant" });

    fetchMock.mockResolvedValue(jsonResponse(200, { access_token: "tok", expires_in: 3600 }));
    expect(await getAccessToken(SCOPES.analytics, SA)).toBe("tok");
  });

  it("reports a network failure as reason NETWORK", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    await expect(getAccessToken(SCOPES.analytics, SA)).rejects.toMatchObject({ status: 0, reason: "NETWORK" });
  });
});

describe("googlePostJson", () => {
  it("sends the bearer token and JSON body, and returns the parsed response", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { access_token: "tok", expires_in: 3600 }))
      .mockResolvedValueOnce(jsonResponse(200, { rows: [] }));

    const out = await googlePostJson("https://api.example.com/x", SCOPES.analytics, SA, { a: 1 });
    expect(out).toEqual({ rows: [] });
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe("https://api.example.com/x");
    expect(init.headers.authorization).toBe("Bearer tok");
    expect(JSON.parse(init.body)).toEqual({ a: 1 });
  });

  it("surfaces Google's error status and reason", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { access_token: "tok", expires_in: 3600 })).mockResolvedValueOnce(
      jsonResponse(403, {
        error: {
          code: 403,
          message: "Google Analytics Data API has not been used in project 1 before or it is disabled.",
          status: "PERMISSION_DENIED",
          details: [{ "@type": "type.googleapis.com/google.rpc.ErrorInfo", reason: "SERVICE_DISABLED" }],
        },
      }),
    );
    await expect(googlePostJson("https://api.example.com/x", SCOPES.analytics, SA, {})).rejects.toMatchObject({
      status: 403,
      reason: "SERVICE_DISABLED",
    });
  });
});
