// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getSection,
  updateSection,
  updateItem,
  deleteItem,
  reorderItems,
  createItem,
  listTrash,
  restoreItem,
} from "@/lib/cpanel-api";

beforeEach(() => {
  vi.stubEnv("CPANEL_API_URL", "https://content-api.example.com");
  vi.stubEnv("CPANEL_API_KEY", "test-key");
});

describe("cpanel-api client", () => {
  it("getSection sends the API key header and returns parsed JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tagline: "Hi" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getSection("hero");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://content-api.example.com/sections/hero",
      expect.objectContaining({
        headers: expect.objectContaining({ "X-Api-Key": "test-key" }),
      })
    );
    expect(result).toEqual({ tagline: "Hi" });
  });

  it("getSection returns null on a 404", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    expect(await getSection("missing")).toBeNull();
  });

  it("updateSection sends a PUT with the bearer token and fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal("fetch", fetchMock);

    await updateSection("hero", { tagline: "New" }, "session-token");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://content-api.example.com/sections/hero",
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          "X-Api-Key": "test-key",
          Authorization: "Bearer session-token",
        }),
        body: JSON.stringify({ tagline: "New" }),
      })
    );
  });

  it("updateSection throws on a non-ok response (e.g. an expired backend session)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: "not authenticated" }) })
    );
    await expect(updateSection("hero", { tagline: "New" }, "session-token")).rejects.toThrow(/update section/i);
  });

  it("updateItem throws on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(updateItem(7, { title: "X" }, "session-token")).rejects.toThrow(/update item 7/i);
  });

  it("deleteItem throws on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    await expect(deleteItem(9, "session-token")).rejects.toThrow(/delete item 9/i);
  });

  it("reorderItems throws on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    await expect(reorderItems("hero.stats", [1, 2], "session-token")).rejects.toThrow(/reorder items/i);
  });

  it("createItem throws on a non-ok response (before it ever reads the body)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: "nope" }) }));
    await expect(createItem("hero.stats", { v: "1", l: "L" }, "session-token")).rejects.toThrow(/create item/i);
  });

  it("createItem returns the new id on an ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 123 }) }));
    expect(await createItem("hero.stats", { v: "1", l: "L" }, "session-token")).toBe(123);
  });

  it("updateItem / deleteItem / reorderItems resolve on an ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));
    await expect(updateItem(1, { title: "X" }, "t")).resolves.toBeUndefined();
    await expect(deleteItem(1, "t")).resolves.toBeUndefined();
    await expect(reorderItems("hero.stats", [1], "t")).resolves.toBeUndefined();
  });

  it("listTrash sends the API key header and returns parsed JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 1, section: "coreValues", fields: { title: "A" }, deletedAt: "2026-08-01" }],
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await listTrash();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://content-api.example.com/items/trash",
      expect.objectContaining({
        headers: expect.objectContaining({ "X-Api-Key": "test-key" }),
      })
    );
    expect(result).toEqual([{ id: 1, section: "coreValues", fields: { title: "A" }, deletedAt: "2026-08-01" }]);
  });

  it("restoreItem sends a PUT with the bearer token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal("fetch", fetchMock);

    await restoreItem(42, "session-token");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://content-api.example.com/items/42/restore",
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          "X-Api-Key": "test-key",
          Authorization: "Bearer session-token",
        }),
      })
    );
  });
});

