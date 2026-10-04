import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/cpanel-api");
vi.mock("@/lib/admin-auth", () => ({ requireContentToken: vi.fn() }));
vi.mock("next/cache");

import { applyChangesetAction } from "../actions";
import { createItem, deleteItem, reorderItems, updateItem, updateSection } from "@/lib/cpanel-api";
import { revalidatePath } from "next/cache";
import { requireContentToken } from "@/lib/admin-auth";
import type { Changeset } from "@/components/admin/SectionEditor";

const updateSectionMock = updateSection as ReturnType<typeof vi.fn>;
const createItemMock = createItem as ReturnType<typeof vi.fn>;
const updateItemMock = updateItem as ReturnType<typeof vi.fn>;
const deleteItemMock = deleteItem as ReturnType<typeof vi.fn>;
const reorderItemsMock = reorderItems as ReturnType<typeof vi.fn>;
const revalidatePathMock = revalidatePath as ReturnType<typeof vi.fn>;

function emptyChangeset(): Changeset {
  return { sectionWrites: [], itemCreates: [], itemUpdates: [], itemDeletes: [], reorders: [] };
}

beforeEach(() => {
  updateSectionMock.mockReset().mockResolvedValue(undefined);
  createItemMock.mockReset();
  updateItemMock.mockReset().mockResolvedValue(undefined);
  deleteItemMock.mockReset().mockResolvedValue(undefined);
  reorderItemsMock.mockReset().mockResolvedValue(undefined);
  revalidatePathMock.mockReset();
  (requireContentToken as ReturnType<typeof vi.fn>).mockReset().mockResolvedValue("session-token");
});

describe("applyChangesetAction", () => {
  it("throws when there is no valid admin session", async () => {
    (requireContentToken as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Not authenticated"));
    await expect(applyChangesetAction(emptyChangeset())).rejects.toThrow("Not authenticated");
  });

  it("dispatches in order: section writes, then creates, then updates, then deletes, then reorders", async () => {
    const calls: string[] = [];
    updateSectionMock.mockImplementation(async () => {
      calls.push("write");
    });
    createItemMock.mockImplementation(async () => {
      calls.push("create");
      return 501;
    });
    updateItemMock.mockImplementation(async () => {
      calls.push("update");
    });
    deleteItemMock.mockImplementation(async () => {
      calls.push("delete");
    });
    reorderItemsMock.mockImplementation(async () => {
      calls.push("reorder");
    });

    const changeset: Changeset = {
      sectionWrites: [{ key: "hero", fields: { eyebrow: "New" } }],
      itemCreates: [{ section: "hero.stats", fields: { v: "1", l: "New" }, tempId: "new-0" }],
      itemUpdates: [{ id: 1, fields: { v: "5", l: "Edited" } }],
      itemDeletes: [2],
      reorders: [{ section: "hero.stats", ids: [3, 1, "new-0"] }],
    };

    await applyChangesetAction(changeset);

    expect(calls).toEqual(["write", "create", "update", "delete", "reorder"]);
  });

  it("passes the FULL merged fields through to updateSection and updateItem unchanged", async () => {
    const changeset: Changeset = {
      sectionWrites: [{ key: "hero", fields: { eyebrow: "New", tagline: "Unrelated" } }],
      itemCreates: [],
      itemUpdates: [{ id: 7, fields: { key: "k", label: "L", categories: ["a"], photos: [{ src: "x.jpg" }] } }],
      itemDeletes: [],
      reorders: [],
    };

    await applyChangesetAction(changeset);

    expect(updateSectionMock).toHaveBeenCalledWith("hero", { eyebrow: "New", tagline: "Unrelated" }, "session-token");
    expect(updateItemMock).toHaveBeenCalledWith(
      7,
      { key: "k", label: "L", categories: ["a"], photos: [{ src: "x.jpg" }] },
      "session-token"
    );
  });

  it("substitutes a resolved real id (from a successful create) into a reorder call", async () => {
    createItemMock.mockResolvedValue(777);

    const changeset: Changeset = {
      sectionWrites: [],
      itemCreates: [{ section: "hero.stats", fields: { v: "1", l: "New" }, tempId: "new-0" }],
      itemUpdates: [],
      itemDeletes: [],
      reorders: [{ section: "hero.stats", ids: [3, "new-0", 1] }],
    };

    const result = await applyChangesetAction(changeset);

    expect(reorderItemsMock).toHaveBeenCalledWith("hero.stats", [3, 777, 1], "session-token");
    expect(result.createdIds).toEqual({ "new-0": 777 });
    expect(result.reorderedSections).toEqual(["hero.stats"]);
  });

  it("on full success: calls revalidatePath and returns empty failures", async () => {
    const changeset: Changeset = {
      sectionWrites: [{ key: "hero", fields: { eyebrow: "New" } }],
      itemCreates: [],
      itemUpdates: [],
      itemDeletes: [],
      reorders: [],
    };

    const result = await applyChangesetAction(changeset);

    expect(result.failures).toEqual([]);
    expect(result.writtenSectionKeys).toEqual(["hero"]);
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
  });

  it("on partial failure: reports the failed change, still applies the successful ones, and still revalidates for the ones that succeeded", async () => {
    updateItemMock.mockImplementation(async (id: number) => {
      if (id === 2) throw new Error("network error");
    });

    const changeset: Changeset = {
      sectionWrites: [],
      itemCreates: [],
      itemUpdates: [
        { id: 1, fields: { l: "ok" } },
        { id: 2, fields: { l: "fails" } },
      ],
      itemDeletes: [],
      reorders: [],
    };

    const result = await applyChangesetAction(changeset);

    expect(result.updatedIds).toEqual([1]);
    expect(result.failures).toEqual([{ kind: "itemUpdate", key: "2", message: "network error" }]);
    // At least one write succeeded (id 1), so the public homepage should
    // still be revalidated to reflect it rather than staying stale.
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
  });

  it("does not attempt a reorder (and reports a failure) when one of its ids is a temp id whose create failed", async () => {
    createItemMock.mockRejectedValue(new Error("create failed"));

    const changeset: Changeset = {
      sectionWrites: [],
      itemCreates: [{ section: "hero.stats", fields: { v: "1", l: "New" }, tempId: "new-0" }],
      itemUpdates: [],
      itemDeletes: [],
      reorders: [{ section: "hero.stats", ids: [1, "new-0"] }],
    };

    const result = await applyChangesetAction(changeset);

    expect(reorderItemsMock).not.toHaveBeenCalled();
    expect(result.failures).toEqual(
      expect.arrayContaining([
        { kind: "itemCreate", key: "new-0", message: "create failed" },
        expect.objectContaining({ kind: "reorder", key: "hero.stats" }),
      ])
    );
  });
});

