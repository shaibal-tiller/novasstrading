// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";
import { createHmac } from "node:crypto";
import { mintContentApiToken } from "@/lib/content-api-token";

afterEach(() => vi.unstubAllEnvs());

describe("mintContentApiToken", () => {
  it("matches the PHP Auth::issueToken format: adminId.expiresAt.hexHmac", () => {
    vi.stubEnv("CPANEL_SESSION_SECRET", "test-php-session-secret");
    const now = Date.UTC(2026, 9, 4, 10, 0, 0, 750); // ms are floored away
    const expiresAt = Math.floor(now / 1000) + 300;
    const expected = `1.${expiresAt}.${createHmac("sha256", "test-php-session-secret")
      .update(`1.${expiresAt}`)
      .digest("hex")}`;

    const token = mintContentApiToken(now);

    expect(token).toBe(expected);
    expect(token).toMatch(/^1\.\d{10}\.[0-9a-f]{64}$/);
    expect(token.split(".")[1]).toBe("1791108300");
  });

  it("throws a clear error when CPANEL_SESSION_SECRET is unset", () => {
    vi.stubEnv("CPANEL_SESSION_SECRET", "");
    expect(() => mintContentApiToken()).toThrow(/CPANEL_SESSION_SECRET is not set/);
  });
});
