"use server";

import { cookies } from "next/headers";
import { revalidatePublicContent } from "@/lib/revalidate-content";
import { createItem, deleteItem, reorderItems, updateItem, updateSection } from "@/lib/cpanel-api";
import { verifySessionCookie } from "@/lib/session";
import type { ApplyChangesetResult, Changeset } from "@/components/admin/SectionEditor";

function requireToken(): string {
  const cookie = cookies().get("nova_admin_session")?.value;
  const token = cookie ? verifySessionCookie(cookie) : null;
  if (!token) throw new Error("Not authenticated");
  return token;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unknown error";
}

/**
 * Dispatches a `computeChangeset` result via the existing `lib/cpanel-api.ts`
 * functions, in the order creates -> updates -> deletes -> reorders (section
 * writes have no ordering dependency on items, so they run first):
 *
 * - creates before reorders: a reorder that references a just-added item
 *   needs that item's real DB id, which only exists after `createItem`
 *   returns.
 * - deletes before reorders: reordering a list that still lists a
 *   soon-to-be-deleted id would corrupt sibling position indices.
 *
 * Each change is dispatched independently (own try/catch) so one failure
 * doesn't block the rest — the caller (`SectionEditor`) uses the returned
 * per-change results to advance its baseline for every success and keep only
 * the failures outstanding for a retry.
 */
export async function applyChangesetAction(changeset: Changeset): Promise<ApplyChangesetResult> {
  const token = requireToken();

  const result: ApplyChangesetResult = {
    createdIds: {},
    updatedIds: [],
    deletedIds: [],
    reorderedSections: [],
    writtenSectionKeys: [],
    failures: [],
  };

  for (const write of changeset.sectionWrites) {
    try {
      await updateSection(write.key, write.fields, token);
      result.writtenSectionKeys.push(write.key);
    } catch (err) {
      result.failures.push({ kind: "sectionWrite", key: write.key, message: errorMessage(err) });
    }
  }

  for (const create of changeset.itemCreates) {
    try {
      const id = await createItem(create.section, create.fields, token);
      if (typeof id !== "number" || Number.isNaN(id)) {
        throw new Error("cpanel-api did not return a valid id");
      }
      result.createdIds[create.tempId] = id;
    } catch (err) {
      result.failures.push({ kind: "itemCreate", key: create.tempId, message: errorMessage(err) });
    }
  }

  for (const update of changeset.itemUpdates) {
    try {
      await updateItem(update.id, update.fields, token);
      result.updatedIds.push(update.id);
    } catch (err) {
      result.failures.push({ kind: "itemUpdate", key: String(update.id), message: errorMessage(err) });
    }
  }

  for (const id of changeset.itemDeletes) {
    try {
      await deleteItem(id, token);
      result.deletedIds.push(id);
    } catch (err) {
      result.failures.push({ kind: "itemDelete", key: String(id), message: errorMessage(err) });
    }
  }

  for (const reorder of changeset.reorders) {
    const resolvedIds: number[] = [];
    let unresolved = false;
    for (const id of reorder.ids) {
      if (typeof id === "number") {
        resolvedIds.push(id);
        continue;
      }
      const realId = result.createdIds[id];
      if (realId === undefined) {
        unresolved = true;
        break;
      }
      resolvedIds.push(realId);
    }

    if (unresolved) {
      result.failures.push({
        kind: "reorder",
        key: reorder.section,
        message: "a new item in this list could not be saved, so the order could not be updated",
      });
      continue;
    }

    try {
      await reorderItems(reorder.section, resolvedIds, token);
      result.reorderedSections.push(reorder.section);
    } catch (err) {
      result.failures.push({ kind: "reorder", key: reorder.section, message: errorMessage(err) });
    }
  }

  // Revalidate whenever at least one write actually succeeded, not only on
  // total success — a partial-success confirm should still make the public
  // homepage reflect whatever DID get written, rather than leaving
  // successfully-persisted content stale indefinitely. Skip only when
  // literally nothing succeeded (zero writes to reflect).
  const successCount =
    result.writtenSectionKeys.length +
    Object.keys(result.createdIds).length +
    result.updatedIds.length +
    result.deletedIds.length +
    result.reorderedSections.length;
  if (successCount > 0) {
    revalidatePublicContent();
  }

  return result;
}

