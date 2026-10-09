// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const { getAdminSessionMock, mintMock } = vi.hoisted(() => ({
  getAdminSessionMock: vi.fn(),
  mintMock: vi.fn(() => "1.123.abc"),
}));
vi.mock("@/lib/admin-session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/admin-session")>()),
  getAdminSession: getAdminSessionMock,
}));
vi.mock("next/headers", () => ({ cookies: () => ({ get: () => undefined }) }));

vi.mock("@/lib/content-api-token", () => ({ mintContentApiToken: mintMock }));

import { requireContentToken } from "@/lib/admin-auth";

beforeEach(() => {
  getAdminSessionMock.mockReset();
  mintMock.mockClear();
});

describe("requireContentToken", () => {
  it("throws Not authenticated without a session", async () => {
    getAdminSessionMock.mockResolvedValue(null);
    await expect(requireContentToken()).rejects.toThrow("Not authenticated");
    expect(mintMock).not.toHaveBeenCalled();
  });

  it("throws Not authenticated when the session lacks the website module", async () => {
    getAdminSessionMock.mockResolvedValue({ email: "a@x.com", role: "admin", modules: ["assets"] });
    await expect(requireContentToken()).rejects.toThrow("Not authenticated");
    expect(mintMock).not.toHaveBeenCalled();
  });

  it("mints a content API token for a session with the website module", async () => {
    getAdminSessionMock.mockResolvedValue({ email: "a@x.com", role: "viewer", modules: ["website"] });
    await expect(requireContentToken()).resolves.toBe("1.123.abc");
    expect(mintMock).toHaveBeenCalledTimes(1);
  });
});
