"use client";

import { useRef, useState, type ReactNode } from "react";
import type { FieldControl, ItemField, ListSpec, SectionEntry } from "@/lib/admin/section-registry";
import { EditModal, type EditModalKind } from "./EditModal";
import { EditModeContext, type EditModeContextValue } from "./EditModeProvider";
import { EditorCanvas } from "./EditorCanvas";
import { ReorderPanel, type ReorderItem } from "./ReorderPanel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Fields = Record<string, unknown>;

/** One row of a `content_items` list. `id` is the real DB id once saved, or a
 * unique string sentinel (e.g. "new-0") for an item added in this session
 * that has not been sent to `createItem` yet. */
export type DraftItem = { id: number | string; fields: Fields };

/**
 * The shape `computeChangeset` (and `SectionEditor`) operate on: one entry
 * per `content_sections` row this registry entry writes (keyed by section
 * key, exactly as `getSections()` returns), and one entry per
 * `content_items` list (keyed by `listKey`, exactly as `listItems()`
 * returns, each row's `fields` being that row's COMPLETE `fields_json`).
 */
export type SectionDraft = {
  sections: Record<string, Fields>;
  items: Record<string, DraftItem[]>;
};

export type Changeset = {
  sectionWrites: { key: string; fields: Fields }[];
  itemCreates: { section: string; fields: Fields; tempId: string }[];
  itemUpdates: { id: number; fields: Fields }[];
  itemDeletes: number[];
  reorders: { section: string; ids: (number | string)[] }[];
};

export type ChangeFailure = {
  kind: "sectionWrite" | "itemCreate" | "itemUpdate" | "itemDelete" | "reorder";
  /** sectionWrite: section key. itemCreate: tempId. itemUpdate/itemDelete: item id (as string). reorder: listKey. */
  key: string;
  message: string;
};

export type ApplyChangesetResult = {
  /** tempId -> real DB id, for every itemCreate that succeeded. */
  createdIds: Record<string, number>;
  updatedIds: number[];
  deletedIds: number[];
  /** listKeys whose reorder succeeded. */
  reorderedSections: string[];
  /** section keys whose write succeeded. */
  writtenSectionKeys: string[];
  failures: ChangeFailure[];
};

// ---------------------------------------------------------------------------
// deepEqual — structural equality for plain JSON-shaped values (strings,
// numbers, booleans, null, arrays, plain objects). Sufficient for comparing
// fields_json values; key order never matters.
// ---------------------------------------------------------------------------

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const aKeys = Object.keys(a as Fields);
    const bKeys = Object.keys(b as Fields);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((k) => k in (b as Fields) && deepEqual((a as Fields)[k], (b as Fields)[k]));
  }
  return false;
}

function emptyChangeset(): Changeset {
  return { sectionWrites: [], itemCreates: [], itemUpdates: [], itemDeletes: [], reorders: [] };
}

export function isChangesetEmpty(changeset: Changeset): boolean {
  return (
    changeset.sectionWrites.length === 0 &&
    changeset.itemCreates.length === 0 &&
    changeset.itemUpdates.length === 0 &&
    changeset.itemDeletes.length === 0 &&
    changeset.reorders.length === 0
  );
}

// ---------------------------------------------------------------------------
// computeChangeset — pure diff function. See the file header comment above
// `SectionDraft` for the shape it operates on.
//
// LOAD-BEARING MERGE RULE: `itemUpdates[].fields` and `sectionWrites[].fields`
// are always `{ ...baselineFields, ...draftFields }` — the baseline's
// complete current fields, overlaid with whatever the draft carries. This
// holds even if `draftFields` is a PARTIAL object (as Task 11's EditModal's
// onSave payload structurally is, for `item` kind — it only ever contains
// registry-declared keys). Never emit `draftFields` alone: doing so would
// silently drop any undeclared key (the canonical example being
// `portfolio.tabs[].photos`, 14-25 images per tab) the moment ANY declared
// field on that row is edited.
//
// NOTE this is a SHALLOW merge: it protects TOP-LEVEL undeclared keys (which
// is all that's currently at risk — `photos` is a top-level key of a tab's
// fields_json). A future PARTIAL NESTED object (e.g. a draft carrying
// `{ address: { street } }` for a section whose baseline `address` also has
// `city`/`postalCode`) would still lose its siblings. `SectionEditor`'s own
// scalar-edit path avoids this by deep-cloning the section and setting only
// the one nested path, so the draft it produces is never a partial nested
// object — but a different caller of `computeChangeset` must uphold the same.
// ---------------------------------------------------------------------------

export function computeChangeset(baseline: SectionDraft, draft: SectionDraft, entry: SectionEntry): Changeset {
  const changeset = emptyChangeset();

  for (const sectionKey of entry.primarySectionKeys) {
    const baselineFields = baseline.sections[sectionKey] ?? {};
    const draftFields = draft.sections[sectionKey] ?? {};
    const merged = { ...baselineFields, ...draftFields };
    if (!deepEqual(baselineFields, merged)) {
      changeset.sectionWrites.push({ key: sectionKey, fields: merged });
    }
  }

  for (const list of entry.lists) {
    const listKey = list.listKey;
    const baselineItems = baseline.items[listKey] ?? [];
    const draftItems = draft.items[listKey] ?? [];

    const baselineById = new Map<number, Fields>();
    for (const item of baselineItems) {
      if (typeof item.id === "number") baselineById.set(item.id, item.fields);
    }

    const draftNumericIds = new Set<number>();
    for (const item of draftItems) {
      if (typeof item.id === "number") draftNumericIds.add(item.id);
    }

    for (const item of draftItems) {
      if (typeof item.id !== "number") {
        changeset.itemCreates.push({ section: listKey, fields: item.fields, tempId: String(item.id) });
        continue;
      }
      const baselineFields = baselineById.get(item.id);
      if (baselineFields === undefined) continue; // defensive: shouldn't happen in normal use
      const merged = { ...baselineFields, ...item.fields };
      if (!deepEqual(baselineFields, merged)) {
        changeset.itemUpdates.push({ id: item.id, fields: merged });
      }
    }

    for (const item of baselineItems) {
      if (typeof item.id === "number" && !draftNumericIds.has(item.id)) {
        changeset.itemDeletes.push(item.id);
      }
    }

    const draftExistingOrder = draftItems
      .filter((i): i is DraftItem & { id: number } => typeof i.id === "number" && baselineById.has(i.id))
      .map((i) => i.id);
    const baselineOrderFiltered = baselineItems
      .filter((i): i is DraftItem & { id: number } => typeof i.id === "number" && draftNumericIds.has(i.id))
      .map((i) => i.id);

    const orderChanged =
      draftExistingOrder.length !== baselineOrderFiltered.length ||
      draftExistingOrder.some((id, i) => id !== baselineOrderFiltered[i]);

    if (orderChanged) {
      changeset.reorders.push({ section: listKey, ids: draftItems.map((i) => i.id) });
    }
  }

  return changeset;
}

// ---------------------------------------------------------------------------
// reconcileAfterApply — folds a dispatch result back into {baseline, draft}:
// successful writes advance the baseline (so a retry never resubmits them),
// and any tempId that got a real DB id from a successful create is patched
// into `draft` too (so the SAME item isn't created a second time on retry).
// Failed changes are left exactly as they were — still visible as a diff
// between the new baseline and the (untouched) draft.
// ---------------------------------------------------------------------------

function cloneDraft(data: SectionDraft): SectionDraft {
  return {
    sections: { ...data.sections },
    items: Object.fromEntries(Object.entries(data.items).map(([k, rows]) => [k, rows.map((r) => ({ ...r }))])),
  };
}

export function reconcileAfterApply(
  baseline: SectionDraft,
  draft: SectionDraft,
  changeset: Changeset,
  result: ApplyChangesetResult
): { baseline: SectionDraft; draft: SectionDraft } {
  const newBaseline = cloneDraft(baseline);

  for (const key of result.writtenSectionKeys) {
    const write = changeset.sectionWrites.find((w) => w.key === key);
    if (write) newBaseline.sections[key] = write.fields;
  }

  for (const create of changeset.itemCreates) {
    const realId = result.createdIds[create.tempId];
    if (realId === undefined) continue;
    newBaseline.items[create.section] = [
      ...(newBaseline.items[create.section] ?? []),
      { id: realId, fields: create.fields },
    ];
  }

  for (const id of result.updatedIds) {
    const update = changeset.itemUpdates.find((u) => u.id === id);
    if (!update) continue;
    for (const listKey of Object.keys(newBaseline.items)) {
      newBaseline.items[listKey] = newBaseline.items[listKey].map((item) =>
        item.id === id ? { ...item, fields: update.fields } : item
      );
    }
  }

  for (const id of result.deletedIds) {
    for (const listKey of Object.keys(newBaseline.items)) {
      newBaseline.items[listKey] = newBaseline.items[listKey].filter((item) => item.id !== id);
    }
  }

  for (const section of result.reorderedSections) {
    const reorder = changeset.reorders.find((r) => r.section === section);
    if (!reorder) continue;
    const resolvedIds = reorder.ids.map((id) => (typeof id === "number" ? id : result.createdIds[id]));
    const bySection = newBaseline.items[section] ?? [];
    const byId = new Map(bySection.map((item) => [item.id, item]));
    newBaseline.items[section] = resolvedIds
      .filter((id): id is number => id !== undefined && byId.has(id))
      .map((id) => byId.get(id)!);
  }

  const newDraft: SectionDraft = {
    sections: draft.sections,
    items: Object.fromEntries(
      Object.entries(draft.items).map(([listKey, rows]) => [
        listKey,
        rows.map((item) =>
          typeof item.id === "string" && result.createdIds[item.id] !== undefined
            ? { ...item, id: result.createdIds[item.id] }
            : item
        ),
      ])
    ),
  };

  return { baseline: newBaseline, draft: newDraft };
}

// ---------------------------------------------------------------------------
// describeFailure — maps a machine-readable failure back to a human label
// using the registry entry, for display in the confirm/discard bar.
// ---------------------------------------------------------------------------

export function describeFailure(
  entry: SectionEntry,
  baseline: SectionDraft,
  changeset: Changeset,
  failure: ChangeFailure
): string {
  switch (failure.kind) {
    case "sectionWrite":
      return `${entry.label}: could not save (${failure.message})`;
    case "itemCreate": {
      const create = changeset.itemCreates.find((c) => c.tempId === failure.key);
      const list = entry.lists.find((l) => l.listKey === create?.section);
      const title = create ? String(create.fields[list?.titleField ?? ""] ?? "new item") : "new item";
      return `${list?.label ?? "Item"} "${title}": could not add (${failure.message})`;
    }
    case "itemUpdate":
    case "itemDelete": {
      const id = Number(failure.key);
      // Find which list this id actually belongs to by looking it up in
      // baseline — every item id is globally unique, so at most one list
      // matches.
      const list = entry.lists.find((l) => (baseline.items[l.listKey] ?? []).some((i) => i.id === id));
      const action = failure.kind === "itemUpdate" ? "save" : "delete";
      return `${list?.label ?? "Item"}: could not ${action} (${failure.message})`;
    }
    case "reorder": {
      const list = entry.lists.find((l) => l.listKey === failure.key);
      return `${list?.label ?? failure.key}: could not save the new order (${failure.message})`;
    }
    default:
      return failure.message;
  }
}

// ---------------------------------------------------------------------------
// Path helpers for scalar (dot-path) fields.
// ---------------------------------------------------------------------------

function getPath(obj: Fields, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Fields)[key];
  }
  return cur;
}

function setPath(obj: Fields, path: string[], value: unknown): Fields {
  if (path.length === 0) return obj;
  const clone = structuredClone(obj);
  let cursor: Fields = clone;
  for (const key of path.slice(0, -1)) {
    if (typeof cursor[key] !== "object" || cursor[key] === null) cursor[key] = {};
    cursor = cursor[key] as Fields;
  }
  cursor[path[path.length - 1]] = value;
  return clone;
}

// ---------------------------------------------------------------------------
// resolveOpenId — maps an Editable id to what EditModal needs to render it.
// Three id shapes:
//   * a scalar field's fully qualified dot-path (`hero.eyebrow`)
//   * `${listKey}.new` — the "add a new item" trigger
//   * `${listKey}.${itemId}` — an item row, where `itemId` is either a real
//     numeric DB id (persisted item) OR a `new-*` string sentinel (an item
//     added this session, not yet sent to `createItem`). BOTH must resolve so
//     a pending item can be re-edited and deleted before Confirm.
// ---------------------------------------------------------------------------

type ResolvedField =
  | {
      type: "scalar";
      sectionKey: string;
      path: string[];
      control: FieldControl;
      label: string;
      options?: string[];
      currentValue: unknown;
    }
  | {
      type: "item";
      listKey: string;
      /** null = the "add new" trigger; number = persisted row; string = pending (`new-*`) row. */
      itemId: number | string | null;
      itemFields: ItemField[];
      label: string;
      currentValue: Fields | null;
    };

function resolveOpenId(entry: SectionEntry, draft: SectionDraft, openId: string): ResolvedField | null {
  const scalar = entry.scalarFields.find((f) => f.path === openId);
  if (scalar) {
    const [sectionKey, ...rest] = scalar.path.split(".");
    const sectionFields = draft.sections[sectionKey] ?? {};
    return {
      type: "scalar",
      sectionKey,
      path: rest,
      control: scalar.control,
      label: scalar.label,
      options: scalar.options,
      currentValue: getPath(sectionFields, rest),
    };
  }

  for (const list of entry.lists) {
    const prefix = `${list.listKey}.`;
    if (!openId.startsWith(prefix)) continue;
    const remainder = openId.slice(prefix.length);
    if (remainder === "new") {
      return { type: "item", listKey: list.listKey, itemId: null, itemFields: list.itemFields, label: list.label, currentValue: null };
    }

    const rows = draft.items[list.listKey] ?? [];
    const numericId = Number(remainder);
    // A `new-*` sentinel is NaN under Number(); look it up as a string id.
    const itemId: number | string = Number.isNaN(numericId) ? remainder : numericId;
    const item = rows.find((i) => i.id === itemId);
    if (!item) return null; // stale id (e.g. the row was already removed)
    return {
      type: "item",
      listKey: list.listKey,
      itemId,
      itemFields: list.itemFields,
      label: list.label,
      currentValue: item.fields,
    };
  }

  return null;
}

/** The human label for one list row, from the list's `titleField`. */
function itemLabel(list: ListSpec, fields: Fields): string {
  const raw = fields[list.titleField];
  const text = raw == null ? "" : String(raw).trim();
  return text || "(untitled)";
}

// ---------------------------------------------------------------------------
// <SectionEditor>
// ---------------------------------------------------------------------------

export function SectionEditor({
  entry,
  baseline: initialBaseline,
  applyChangeset,
  render,
}: {
  entry: SectionEntry;
  baseline: SectionDraft;
  /** Dispatches a computed changeset (via the server actions in
   * `edit/[section]/actions.ts`) and resolves with per-change results. */
  applyChangeset: (changeset: Changeset) => Promise<ApplyChangesetResult>;
  /** Renders the section's real component using the current draft data. */
  render: (data: SectionDraft) => ReactNode;
}) {
  const [baseline, setBaseline] = useState(initialBaseline);
  const [draft, setDraft] = useState(initialBaseline);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reorderListKey, setReorderListKey] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [failures, setFailures] = useState<string[]>([]);
  const nextTempId = useRef(0);

  const changeset = computeChangeset(baseline, draft, entry);
  const dirty = !isChangesetEmpty(changeset);

  const ctxValue: EditModeContextValue = { hoveredId, setHoveredId, openId, setOpenId, draft, setDraft: setDraft as EditModeContextValue["setDraft"] };

  function labelLookup(id: string): string | undefined {
    return resolveOpenId(entry, draft, id)?.label;
  }

  function handleSaveScalar(sectionKey: string, path: string[], value: unknown) {
    setDraft((prev) => ({
      ...prev,
      sections: { ...prev.sections, [sectionKey]: setPath(prev.sections[sectionKey] ?? {}, path, value) },
    }));
    setOpenId(null);
  }

  function handleSaveItem(listKey: string, itemId: number | string | null, values: Fields) {
    setDraft((prev) => {
      const items = prev.items[listKey] ?? [];
      if (itemId === null) {
        const tempId = `new-${nextTempId.current++}`;
        return { ...prev, items: { ...prev.items, [listKey]: [...items, { id: tempId, fields: values }] } };
      }
      // itemId may be a real numeric id (persisted row) OR a `new-*` sentinel
      // (a pending row being re-edited) — either way, merge into that row.
      return {
        ...prev,
        items: {
          ...prev.items,
          [listKey]: items.map((item) => (item.id === itemId ? { ...item, fields: { ...item.fields, ...values } } : item)),
        },
      };
    });
    setOpenId(null);
  }

  function handleDeleteItem(listKey: string, itemId: number | string) {
    // Works for both a persisted row (its `itemDelete` is emitted by
    // computeChangeset once it's gone from the draft) and a pending `new-*`
    // row (it simply vanishes — no server call, computeChangeset stops
    // emitting an itemCreate for it).
    setDraft((prev) => ({
      ...prev,
      items: { ...prev.items, [listKey]: (prev.items[listKey] ?? []).filter((i) => i.id !== itemId) },
    }));
    setOpenId(null);
  }

  function handleApplyReorder(listKey: string, orderedIds: (number | string)[]) {
    setDraft((prev) => {
      const rows = prev.items[listKey] ?? [];
      const byId = new Map(rows.map((r) => [r.id, r] as const));
      const reordered = orderedIds.map((id) => byId.get(id)).filter((r): r is DraftItem => r !== undefined);
      // Keep any row the panel somehow didn't list (defensive) appended in
      // its existing relative order, so nothing is ever dropped.
      const seen = new Set(orderedIds);
      const leftover = rows.filter((r) => !seen.has(r.id));
      return { ...prev, items: { ...prev.items, [listKey]: [...reordered, ...leftover] } };
    });
    setReorderListKey(null);
  }

  function handleDiscard() {
    setDraft(baseline);
    setOpenId(null);
    setReorderListKey(null);
    setFailures([]);
  }

  async function handleConfirm() {
    if (!dirty || pending) return;
    setPending(true);
    try {
      const result = await applyChangeset(changeset);
      const { baseline: newBaseline, draft: newDraft } = reconcileAfterApply(baseline, draft, changeset, result);
      setBaseline(newBaseline);
      setDraft(newDraft);
      if (result.failures.length > 0) {
        setFailures(result.failures.map((f) => describeFailure(entry, baseline, changeset, f)));
      } else {
        setFailures([]);
        setOpenId(null);
      }
    } catch {
      // The whole dispatch call rejected (not a per-change failure) — most
      // likely the admin's own session cookie expired, so `requireToken()`
      // threw server-side. Nothing was applied; leave baseline and draft
      // untouched so the pending edits stay and a retry is possible.
      setFailures(["Could not save changes — please check you're still signed in and try again."]);
    } finally {
      setPending(false);
    }
  }

  const resolved = openId ? resolveOpenId(entry, draft, openId) : null;

  const reorderList = reorderListKey ? entry.lists.find((l) => l.listKey === reorderListKey) : undefined;
  const reorderPanel: ReactNode =
    reorderListKey && reorderList ? (
      <ReorderPanel
        key={reorderListKey}
        title={`Reorder ${reorderList.label}`}
        items={(draft.items[reorderListKey] ?? []).map<ReorderItem>((row) => ({
          id: row.id,
          label: itemLabel(reorderList, row.fields),
        }))}
        onApply={(ids) => handleApplyReorder(reorderListKey, ids)}
        onClose={() => setReorderListKey(null)}
      />
    ) : null;

  let modal: ReactNode = null;
  if (openId && resolved) {
    if (resolved.type === "scalar") {
      modal = (
        <EditModal
          key={openId}
          id={openId}
          kind={resolved.control as EditModalKind}
          currentValue={resolved.currentValue}
          options={resolved.options}
          onSave={(value) => handleSaveScalar(resolved.sectionKey, resolved.path, value)}
          onClose={() => setOpenId(null)}
        />
      );
    } else {
      modal = (
        <EditModal
          key={openId}
          id={openId}
          kind="item"
          currentValue={resolved.currentValue}
          itemFields={resolved.itemFields}
          onSave={(value) => handleSaveItem(resolved.listKey, resolved.itemId, value as Fields)}
          onDelete={
            resolved.itemId !== null
              ? () => handleDeleteItem(resolved.listKey, resolved.itemId as number | string)
              : undefined
          }
          onClose={() => setOpenId(null)}
        />
      );
    }
  }

  return (
    <EditModeContext.Provider value={ctxValue}>
      <EditorCanvas labelLookup={labelLookup}>{render(draft)}</EditorCanvas>

      {entry.lists.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {entry.lists.map((list) => {
            const count = (draft.items[list.listKey] ?? []).length;
            return (
              <div key={list.listKey} className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setReorderListKey(null);
                    setOpenId(`${list.listKey}.new`);
                  }}
                >
                  + Add {list.label}
                </button>
                {count >= 2 && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setOpenId(null);
                      setReorderListKey(list.listKey);
                    }}
                  >
                    Reorder {list.label}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal}

      {reorderPanel}

      {/* z-50: the previewed section's own content is stacked above a bare sticky
          element (grid is z-2), which made Confirm/Discard unclickable whenever a
          highlighted block sat underneath the bar. */}
      <div className="sticky bottom-0 z-50 mt-6 flex flex-col gap-2 border-t border-ink/10 bg-paper p-4">
        {failures.length > 0 && (
          <ul className="text-sm text-red-700" role="alert">
            {failures.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        )}
        <div className="flex gap-3">
          <button type="button" className="btn btn-outline" onClick={handleDiscard} disabled={!dirty || pending}>
            Discard changes
          </button>
          <button type="button" className="btn btn-primary" onClick={handleConfirm} disabled={!dirty || pending}>
            {pending ? "Saving…" : "Confirm changes"}
          </button>
        </div>
      </div>
    </EditModeContext.Provider>
  );
}

