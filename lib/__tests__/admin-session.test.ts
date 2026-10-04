// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const getCookieMock = vi.fn();
vi.mock("next/headers", () => ({ cookies: () => ({ get: getCookieMock }) }));

import { __resetAdminSessionCache, getAdminSession, hasModule } from "@/lib/admin-session";

function jsonResponse(status: number, body: unknown) {
  return { status, ok: status >= 200 && status < 300, json: async () => body };
}

const fetchMock = vi.fn();

beforeEach(() => {
  __resetAdminSessionCache();
  vi.stubEnv("INVENTORY_URL", "https://inventory.example.com");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  getCookieMock.mockReset().mockImplementation((name: string) =>
    name === "nova_session" ? { value: "cookie-abc" } : undefined
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("getAdminSession", () => {
  it("returns null without calling the Assets app when there is no cookie", async () => {
    getCookieMock.mockReturnValue(undefined);
    expect(await getAdminSession()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns the session from /auth/me on 200, forwarding the cookie uncached", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { ok: true, email: "a@novasstrading.com", role: "admin", modules: ["website", "assets"] })
    );

    expect(await getAdminSession()).toEqual({
      email: "a@novasstrading.com",
      role: "admin",
      modules: ["website", "assets"],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://inventory.example.com/admin/inventory/api/auth/me",
      expect.objectContaining({ headers: { cookie: "nova_session=cookie-abc" }, cache: "no-store" })
    );
  });

  it("drops unknown modules", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { ok: true, email: "v@novasstrading.com", role: "viewer", modules: ["website", "payroll"] })
    );
    expect((await getAdminSession())?.modules).toEqual(["website"]);
  });

  it("returns null on 401", async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { ok: false, error: "Not signed in" }));
    expect(await getAdminSession()).toBeNull();
  });

  it("returns null on a network error", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    expect(await getAdminSession()).toBeNull();
  });

  it("returns null when INVENTORY_URL is not set", async () => {
    vi.stubEnv("INVENTORY_URL", "");
    expect(await getAdminSession()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("caches a positive answer for 30 s per cookie value", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-04T10:00:00Z"));
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true, email: "a@x.com", role: "admin", modules: ["website"] }));

    await getAdminSession();
    await getAdminSession();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // A different cookie is a different cache entry.
    getCookieMock.mockReturnValue({ value: "cookie-other" });
    await getAdminSession();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    getCookieMock.mockReturnValue({ value: "cookie-abc" });
    vi.setSystemTime(new Date("2026-10-04T10:00:29Z"));
    await getAdminSession();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    vi.setSystemTime(new Date("2026-10-04T10:00:31Z"));
    await getAdminSession();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("caches a negative answer for only 5 s", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-04T10:00:00Z"));
    fetchMock.mockResolvedValue(jsonResponse(401, { ok: false }));

    expect(await getAdminSession()).toBeNull();
    vi.setSystemTime(new Date("2026-10-04T10:00:04Z"));
    expect(await getAdminSession()).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true, email: "a@x.com", role: "admin", modules: ["website"] }));
    vi.setSystemTime(new Date("2026-10-04T10:00:06Z"));
    expect(await getAdminSession()).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("hasModule", () => {
  it("checks module membership and tolerates null", () => {
    const s = { email: "a@x.com", role: "admin" as const, modules: ["assets" as const] };
    expect(hasModule(s, "assets")).toBe(true);
    expect(hasModule(s, "website")).toBe(false);
    expect(hasModule(null, "website")).toBe(false);
  });
});
