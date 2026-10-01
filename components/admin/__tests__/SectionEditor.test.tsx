import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SectionEntry } from "@/lib/admin/section-registry";
import { SECTION_REGISTRY } from "@/lib/admin/section-registry";
import {
  computeChangeset,
  reconcileAfterApply,
  describeFailure,
  type SectionDraft,
  type ApplyChangesetResult,
} from "../SectionEditor";
import { SectionEditor } from "../SectionEditor";
import { Editable } from "../Editable";

// ---------------------------------------------------------------------------
// computeChangeset — the pure diff function. This is the primary acceptance
// bar for Task 12: it must merge (not replace) fields_json on every write.
// ---------------------------------------------------------------------------

const heroEntry: SectionEntry = {
  key: "hero",
  label: "Hero",
  primarySectionKeys: ["hero"],
  scalarFields: [{ path: "hero.eyebrow", label: "Eyebrow", control: "text" }],
  lists: [
    {
      listKey: "hero.stats",
      label: "Hero stats",
      titleField: "l",
      itemFields: [
        { key: "v", label: "Value", kind: "text" },
        { key: "l", label: "Label", kind: "text" },
      ],
    },
  ],
};

describe("computeChangeset", () => {
  it("returns an empty changeset when draft equals baseline exactly", () => {
    const baseline: SectionDraft = {
      sections: { hero: { eyebrow: "Premier", tagline: "T" } },
      items: {
        "hero.stats": [
          { id: 1, fields: { v: "5", l: "Ranges" } },
          { id: 2, fields: { v: "10", l: "Years" } },
        ],
      },
    };
    // Deep-cloned, not the same reference, to prove structural (not
    // referential) equality is what matters.
    const draft: SectionDraft = structuredClone(baseline);

    const changeset = computeChangeset(baseline, draft, heroEntry);

    expect(changeset).toEqual({
      sectionWrites: [],
      itemCreates: [],
      itemUpdates: [],
      itemDeletes: [],
      reorders: [],
    });
  });

  it("scalar field edited: one sectionWrites entry with the FULL merged fields", () => {
    const baseline: SectionDraft = {
      sections: { hero: { eyebrow: "Old", tagline: "Unrelated tagline" } },
      items: { "hero.stats": [] },
    };
    const draft: SectionDraft = {
      sections: { hero: { eyebrow: "New", tagline: "Unrelated tagline" } },
      items: { "hero.stats": [] },
    };

    const changeset = computeChangeset(baseline, draft, heroEntry);

    expect(changeset.sectionWrites).toEqual([
      { key: "hero", fields: { eyebrow: "New", tagline: "Unrelated tagline" } },
    ]);
    expect(changeset.itemCreates).toEqual([]);
    expect(changeset.itemUpdates).toEqual([]);
    expect(changeset.itemDeletes).toEqual([]);
    expect(changeset.reorders).toEqual([]);
  });

  it("scalar field edited, but the draft section object only carries the changed key: still merges the full fields from baseline", () => {
    // Simulates a caller that (incorrectly) passed only the changed key
    // rather than a full clone — computeChangeset must defend against this,
    // not merely pass it through.
    const baseline: SectionDraft = {
      sections: { hero: { eyebrow: "Old", tagline: "Unrelated tagline", body: "Body text" } },
      items: {},
    };
    const draft: SectionDraft = {
      sections: { hero: { eyebrow: "New" } },
      items: {},
    };

    const changeset = computeChangeset(baseline, draft, heroEntry);

    expect(changeset.sectionWrites).toEqual([
      { key: "hero", fields: { eyebrow: "New", tagline: "Unrelated tagline", body: "Body text" } },
    ]);
  });

  it("item field edited: one itemUpdates entry with the FULL merged fields", () => {
    const baseline: SectionDraft = {
      sections: { hero: { eyebrow: "E" } },
      items: {
        "hero.stats": [
          { id: 1, fields: { v: "5", l: "Ranges" } },
          { id: 2, fields: { v: "10", l: "Years" } },
        ],
      },
    };
    const draft: SectionDraft = structuredClone(baseline);
    draft.items["hero.stats"][0].fields.l = "Product ranges";

    const changeset = computeChangeset(baseline, draft, heroEntry);

    expect(changeset.itemUpdates).toEqual([{ id: 1, fields: { v: "5", l: "Product ranges" } }]);
    expect(changeset.sectionWrites).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // THE CRITICAL TEST — this is the primary acceptance bar for Task 12.
  //
  // Simulates the exact danger the brief calls out: Task 11's EditModal
  // reports back only the registry-declared fields of an item (never an
  // undeclared field like `portfolio.tabs[].photos`), so the draft item
  // handed to computeChangeset can legitimately be PARTIAL relative to the
  // row's full fields_json. If computeChangeset ever just forwarded that
  // partial object as `itemUpdates[].fields`, the first edit to any
  // registry-declared field on a portfolio tab would silently destroy its
  // entire (undeclared) `photos` array — 14-25 images per tab, ~66 total.
  // -------------------------------------------------------------------------
  it("CRITICAL: preserves an undeclared field (photos) not in any registry ItemField when a declared field changes, even when the draft's item fields are a PARTIAL object", () => {
    const portfolioEntry = SECTION_REGISTRY.find((e) => e.key === "portfolio")!;
    const undeclaredPhotos = [
      { src: "loungewear-1.jpg", alt: "Loungewear look 1" },
      { src: "loungewear-2.jpg", alt: "Loungewear look 2" },
    ];

    const baseline: SectionDraft = {
      sections: { portfolio: { eyebrow: "E", title: "T", intro: "I" } },
      items: {
        "portfolio.tabs": [
          {
            id: 42,
            fields: {
              key: "loungewear",
              label: "Loungewear",
              categories: ["Nightgowns", "Robes"],
              // `photos` is NOT declared in section-registry.tsx's `portfolio`
              // entry's itemFields — this is exactly the data at risk.
              photos: undeclaredPhotos,
            },
          },
        ],
      },
    };

    // The draft item's fields object here is PARTIAL — only the one changed,
    // registry-declared key — exactly what a naive pass-through of
    // EditModal's onSave payload would produce.
    const draft: SectionDraft = {
      sections: baseline.sections,
      items: {
        "portfolio.tabs": [
          {
            id: 42,
            fields: { label: "Loungewear & Sleepwear" },
          },
        ],
      },
    };

    const changeset = computeChangeset(baseline, draft, portfolioEntry);

    expect(changeset.itemUpdates).toHaveLength(1);
    const update = changeset.itemUpdates[0];
    expect(update.id).toBe(42);
    // The changed field is applied...
    expect(update.fields.label).toBe("Loungewear & Sleepwear");
    // ...but every other baseline field, DECLARED or not, survives untouched.
    expect(update.fields.key).toBe("loungewear");
    expect(update.fields.categories).toEqual(["Nightgowns", "Robes"]);
    expect(update.fields.photos).toEqual(undeclaredPhotos);
  });

  it("new item added: one itemCreates entry, no reorder (appended items don't require an explicit reorder call)", () => {
    const baseline: SectionDraft = {
      sections: { hero: {} },
      items: { "hero.stats": [{ id: 1, fields: { v: "5", l: "Ranges" } }] },
    };
    const draft: SectionDraft = {
      sections: { hero: {} },
      items: {
        "hero.stats": [
          { id: 1, fields: { v: "5", l: "Ranges" } },
          { id: "new-0", fields: { v: "20", l: "Countries" } },
        ],
      },
    };

    const changeset = computeChangeset(baseline, draft, heroEntry);

    expect(changeset.itemCreates).toEqual([
      { section: "hero.stats", fields: { v: "20", l: "Countries" }, tempId: "new-0" },
    ]);
    expect(changeset.itemUpdates).toEqual([]);
    expect(changeset.itemDeletes).toEqual([]);
    expect(changeset.reorders).toEqual([]);
  });

  it("item removed: one itemDeletes entry, no reorder (relative order of survivors is unchanged)", () => {
    const baseline: SectionDraft = {
      sections: { hero: {} },
      items: {
        "hero.stats": [
          { id: 1, fields: { v: "5", l: "Ranges" } },
          { id: 2, fields: { v: "10", l: "Years" } },
          { id: 3, fields: { v: "15", l: "Countries" } },
        ],
      },
    };
    const draft: SectionDraft = {
      sections: { hero: {} },
      items: {
        "hero.stats": [
          { id: 1, fields: { v: "5", l: "Ranges" } },
          { id: 3, fields: { v: "15", l: "Countries" } },
        ],
      },
    };

    const changeset = computeChangeset(baseline, draft, heroEntry);

    expect(changeset.itemDeletes).toEqual([2]);
    expect(changeset.itemCreates).toEqual([]);
    expect(changeset.itemUpdates).toEqual([]);
    expect(changeset.reorders).toEqual([]);
  });

  it("items reordered with no other changes: one reorders entry with the new id order", () => {
    const baseline: SectionDraft = {
      sections: { hero: {} },
      items: {
        "hero.stats": [
          { id: 1, fields: { v: "5", l: "Ranges" } },
          { id: 2, fields: { v: "10", l: "Years" } },
          { id: 3, fields: { v: "15", l: "Countries" } },
        ],
      },
    };
    const draft: SectionDraft = {
      sections: { hero: {} },
      items: {
        "hero.stats": [
          { id: 3, fields: { v: "15", l: "Countries" } },
          { id: 1, fields: { v: "5", l: "Ranges" } },
          { id: 2, fields: { v: "10", l: "Years" } },
        ],
      },
    };

    const changeset = computeChangeset(baseline, draft, heroEntry);

    expect(changeset.reorders).toEqual([{ section: "hero.stats", ids: [3, 1, 2] }]);
    expect(changeset.itemCreates).toEqual([]);
    expect(changeset.itemUpdates).toEqual([]);
    expect(changeset.itemDeletes).toEqual([]);
  });

  it("a combination of a scalar edit, item edit, item create, item delete, and reorder in one draft", () => {
    const baseline: SectionDraft = {
      sections: { hero: { eyebrow: "Old Eyebrow", tagline: "T" } },
      items: {
        "hero.stats": [
          { id: 1, fields: { v: "5", l: "Label A" } },
          { id: 2, fields: { v: "10", l: "Label B" } },
          { id: 3, fields: { v: "15", l: "Label C" } },
        ],
      },
    };
    const draft: SectionDraft = {
      sections: { hero: { eyebrow: "New Eyebrow", tagline: "T" } },
      items: {
        "hero.stats": [
          { id: 3, fields: { v: "15", l: "Label C" } },
          { id: 1, fields: { v: "5", l: "Label A - edited" } },
          { id: "new-1", fields: { v: "20", l: "Label D" } },
          // id 2 removed
        ],
      },
    };

    const changeset = computeChangeset(baseline, draft, heroEntry);

    expect(changeset.sectionWrites).toEqual([
      { key: "hero", fields: { eyebrow: "New Eyebrow", tagline: "T" } },
    ]);
    expect(changeset.itemCreates).toEqual([
      { section: "hero.stats", fields: { v: "20", l: "Label D" }, tempId: "new-1" },
    ]);
    expect(changeset.itemUpdates).toEqual([{ id: 1, fields: { v: "5", l: "Label A - edited" } }]);
    expect(changeset.itemDeletes).toEqual([2]);
    expect(changeset.reorders).toEqual([{ section: "hero.stats", ids: [3, 1, "new-1"] }]);
  });

  it("an entry with no primarySectionKeys (items-only, e.g. nav) never emits sectionWrites", () => {
    const navEntry: SectionEntry = {
      key: "nav",
      label: "Navigation",
      primarySectionKeys: [],
      scalarFields: [],
      lists: [
        {
          listKey: "nav",
          label: "Navigation links",
          titleField: "label",
          itemFields: [
            { key: "label", label: "Link text", kind: "text" },
            { key: "href", label: "Anchor", kind: "text" },
          ],
        },
      ],
    };
    const baseline: SectionDraft = {
      sections: {},
      items: { nav: [{ id: 1, fields: { label: "About", href: "#about" } }] },
    };
    const draft: SectionDraft = structuredClone(baseline);
    draft.items.nav[0].fields.label = "About Us";

    const changeset = computeChangeset(baseline, draft, navEntry);

    expect(changeset.sectionWrites).toEqual([]);
    expect(changeset.itemUpdates).toEqual([{ id: 1, fields: { label: "About Us", href: "#about" } }]);
  });
});

// ---------------------------------------------------------------------------
// reconcileAfterApply — folds a dispatch result back into baseline/draft so
// a retry after partial failure never resubmits already-applied writes, and
// pending-create temp ids become real ids everywhere they appear.
// ---------------------------------------------------------------------------

describe("reconcileAfterApply", () => {
  it("on full success, folds every write into baseline and patches temp ids in draft to real ids", () => {
    const baseline: SectionDraft = {
      sections: { hero: { eyebrow: "Old" } },
      items: { "hero.stats": [{ id: 1, fields: { v: "5", l: "Old label" } }] },
    };
    const draft: SectionDraft = {
      sections: { hero: { eyebrow: "New" } },
      items: {
        "hero.stats": [
          { id: 1, fields: { v: "5", l: "New label" } },
          { id: "new-0", fields: { v: "99", l: "Brand new" } },
        ],
      },
    };
    const changeset = computeChangeset(baseline, draft, heroEntry);
    const result: ApplyChangesetResult = {
      createdIds: { "new-0": 500 },
      updatedIds: [1],
      deletedIds: [],
      reorderedSections: [],
      writtenSectionKeys: ["hero"],
      failures: [],
    };

    const { baseline: newBaseline, draft: newDraft } = reconcileAfterApply(baseline, draft, changeset, result);

    expect(newBaseline.sections.hero).toEqual({ eyebrow: "New" });
    expect(newBaseline.items["hero.stats"]).toEqual([
      { id: 1, fields: { v: "5", l: "New label" } },
      { id: 500, fields: { v: "99", l: "Brand new" } },
    ]);
    // draft's pending item now carries the real id, not the temp sentinel.
    expect(newDraft.items["hero.stats"][1].id).toBe(500);

    // A second diff against the reconciled baseline/draft is empty — no
    // resubmission of already-applied writes.
    const secondChangeset = computeChangeset(newBaseline, newDraft, heroEntry);
    expect(secondChangeset).toEqual({
      sectionWrites: [],
      itemCreates: [],
      itemUpdates: [],
      itemDeletes: [],
      reorders: [],
    });
  });

  it("on partial failure, only the successful parts advance baseline; the failed change is still visible on the next diff", () => {
    const baseline: SectionDraft = {
      sections: { hero: { eyebrow: "Old" } },
      items: {
        "hero.stats": [
          { id: 1, fields: { v: "5", l: "Old label 1" } },
          { id: 2, fields: { v: "10", l: "Old label 2" } },
        ],
      },
    };
    const draft: SectionDraft = {
      sections: { hero: { eyebrow: "New" } },
      items: {
        "hero.stats": [
          { id: 1, fields: { v: "5", l: "New label 1" } },
          { id: 2, fields: { v: "10", l: "New label 2" } },
        ],
      },
    };
    const changeset = computeChangeset(baseline, draft, heroEntry);
    // Item 1's update succeeded; item 2's failed (e.g. network error).
    const result: ApplyChangesetResult = {
      createdIds: {},
      updatedIds: [1],
      deletedIds: [],
      reorderedSections: [],
      writtenSectionKeys: ["hero"],
      failures: [{ kind: "itemUpdate", key: "2", message: "network error" }],
    };

    const { baseline: newBaseline, draft: newDraft } = reconcileAfterApply(baseline, draft, changeset, result);

    // Successful parts applied to the new baseline.
    expect(newBaseline.sections.hero).toEqual({ eyebrow: "New" });
    expect(newBaseline.items["hero.stats"][0].fields.l).toBe("New label 1");
    // The failed item's baseline is untouched.
    expect(newBaseline.items["hero.stats"][1].fields.l).toBe("Old label 2");
    // draft is untouched (still holds the not-yet-applied edit).
    expect(newDraft.items["hero.stats"][1].fields.l).toBe("New label 2");

    // Retrying now only re-submits the failed item, not the already-applied one.
    const retryChangeset = computeChangeset(newBaseline, newDraft, heroEntry);
    expect(retryChangeset.sectionWrites).toEqual([]);
    expect(retryChangeset.itemUpdates).toEqual([{ id: 2, fields: { v: "10", l: "New label 2" } }]);
  });

  it("applies a successful reorder's resolved order (with temp ids substituted) to the new baseline", () => {
    const baseline: SectionDraft = {
      sections: { hero: {} },
      items: {
        "hero.stats": [
          { id: 1, fields: { l: "A" } },
          { id: 2, fields: { l: "B" } },
        ],
      },
    };
    const draft: SectionDraft = {
      sections: { hero: {} },
      items: {
        "hero.stats": [
          { id: "new-0", fields: { l: "C" } },
          { id: 2, fields: { l: "B" } },
          { id: 1, fields: { l: "A" } },
        ],
      },
    };
    const changeset = computeChangeset(baseline, draft, heroEntry);
    const result: ApplyChangesetResult = {
      createdIds: { "new-0": 300 },
      updatedIds: [],
      deletedIds: [],
      reorderedSections: ["hero.stats"],
      writtenSectionKeys: [],
      failures: [],
    };

    const { baseline: newBaseline } = reconcileAfterApply(baseline, draft, changeset, result);

    expect(newBaseline.items["hero.stats"].map((i) => i.id)).toEqual([300, 2, 1]);
  });

  it("removes successfully deleted items from the new baseline", () => {
    const baseline: SectionDraft = {
      sections: {},
      items: {
        "hero.stats": [
          { id: 1, fields: { l: "A" } },
          { id: 2, fields: { l: "B" } },
        ],
      },
    };
    const draft: SectionDraft = {
      sections: {},
      items: { "hero.stats": [{ id: 1, fields: { l: "A" } }] },
    };
    const changeset = computeChangeset(baseline, draft, heroEntry);
    const result: ApplyChangesetResult = {
      createdIds: {},
      updatedIds: [],
      deletedIds: [2],
      reorderedSections: [],
      writtenSectionKeys: [],
      failures: [],
    };

    const { baseline: newBaseline } = reconcileAfterApply(baseline, draft, changeset, result);

    expect(newBaseline.items["hero.stats"]).toEqual([{ id: 1, fields: { l: "A" } }]);
  });
});

// ---------------------------------------------------------------------------
// describeFailure — must attribute an item failure to the LIST it actually
// belongs to, not just the first list on the entry (a real bug caught while
// self-reviewing: an entry with multiple lists, e.g. `sourcing`, would have
// mislabeled every item failure as belonging to its first list).
// ---------------------------------------------------------------------------

describe("describeFailure", () => {
  const sourcingEntry = SECTION_REGISTRY.find((e) => e.key === "sourcing")!;

  it("attributes an itemUpdate failure to the list the item actually belongs to, not the entry's first list", () => {
    const baseline: SectionDraft = {
      sections: {},
      items: {
        "sourcing.pillars": [{ id: 1, fields: { title: "Pillar" } }],
        "sourcing.services": [{ id: 2, fields: { title: "Service" } }],
        "sourcing.checklist": [{ id: 3, fields: { text: "Check" } }],
      },
    };
    const changeset = computeChangeset(baseline, baseline, sourcingEntry);

    const message = describeFailure(sourcingEntry, baseline, changeset, {
      kind: "itemUpdate",
      key: "2",
      message: "network error",
    });

    expect(message).toContain("Services");
    expect(message).not.toContain("Service pillars");
  });

  it("attributes an itemDelete failure to the correct list too", () => {
    const baseline: SectionDraft = {
      sections: {},
      items: {
        "sourcing.pillars": [{ id: 1, fields: { title: "Pillar" } }],
        "sourcing.services": [{ id: 2, fields: { title: "Service" } }],
        "sourcing.checklist": [{ id: 3, fields: { text: "Check" } }],
      },
    };
    const changeset = computeChangeset(baseline, baseline, sourcingEntry);

    const message = describeFailure(sourcingEntry, baseline, changeset, {
      kind: "itemDelete",
      key: "3",
      message: "network error",
    });

    expect(message).toContain("checklist");
  });
});

// ---------------------------------------------------------------------------
// <SectionEditor> — light component-level tests for the wiring: clicking an
// editable field opens EditModal keyed by id, Discard resets to baseline, and
// Confirm dispatches through the provided `applyChangeset` function.
// ---------------------------------------------------------------------------

describe("SectionEditor", () => {
  function baselineFor(): SectionDraft {
    return {
      sections: { hero: { eyebrow: "Premier" } },
      items: { "hero.stats": [{ id: 1, fields: { v: "5", l: "Ranges" } }] },
    };
  }

  it("clicking an Editable field opens EditModal, and saving updates the rendered draft", async () => {
    const applyChangeset = vi.fn();
    render(
      <SectionEditor
        entry={heroEntry}
        baseline={baselineFor()}
        applyChangeset={applyChangeset}
        render={(draft) => (
          <Editable id="hero.eyebrow" kind="text">
            {draft.sections.hero?.eyebrow as string}
          </Editable>
        )}
      />
    );

    // Clicking the rendered Editable field sets openId via the
    // EditModeContext SectionEditor provides.
    await userEvent.click(screen.getByText("Premier"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "New Eyebrow");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(screen.getByText("New Eyebrow")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Discard is disabled with no pending changes", () => {
    const applyChangeset = vi.fn();
    render(
      <SectionEditor
        entry={heroEntry}
        baseline={baselineFor()}
        applyChangeset={applyChangeset}
        render={(draft) => <p>{draft.sections.hero?.eyebrow as string}</p>}
      />
    );

    expect(screen.getByRole("button", { name: /discard/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /confirm/i })).toBeDisabled();
    expect(applyChangeset).not.toHaveBeenCalled();
  });

  it("edit -> Discard reverts the draft to baseline, re-disables the bar, and makes no network call", async () => {
    const applyChangeset = vi.fn();
    render(
      <SectionEditor
        entry={heroEntry}
        baseline={baselineFor()}
        applyChangeset={applyChangeset}
        render={(draft) => (
          <Editable id="hero.eyebrow" kind="text">
            {draft.sections.hero?.eyebrow as string}
          </Editable>
        )}
      />
    );

    // Make an edit.
    await userEvent.click(screen.getByText("Premier"));
    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "Changed");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(screen.getByText("Changed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm/i })).toBeEnabled();

    // Discard it.
    await userEvent.click(screen.getByRole("button", { name: /discard/i }));

    // Draft is back to baseline, and the bar reflects "no changes" again
    // (which is exactly `computeChangeset(baseline, draft)` being empty).
    expect(screen.getByText("Premier")).toBeInTheDocument();
    expect(screen.queryByText("Changed")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /discard/i })).toBeDisabled();
    expect(applyChangeset).not.toHaveBeenCalled();
  });

  it("shows a generic failure message (and keeps pending edits) when applyChangeset itself rejects", async () => {
    const applyChangeset = vi.fn().mockRejectedValue(new Error("Not authenticated"));
    render(
      <SectionEditor
        entry={heroEntry}
        baseline={baselineFor()}
        applyChangeset={applyChangeset}
        render={(draft) => (
          <Editable id="hero.eyebrow" kind="text">
            {draft.sections.hero?.eyebrow as string}
          </Editable>
        )}
      />
    );

    await userEvent.click(screen.getByText("Premier"));
    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "New Eyebrow");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));

    expect(await screen.findByText(/could not save changes/i)).toBeInTheDocument();
    // The edit is not lost, and the buttons are usable again for a retry.
    expect(screen.getByText("New Eyebrow")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm/i })).toBeEnabled();
  });

  it("Confirm calls applyChangeset with the computed changeset and reports failures without losing pending edits", async () => {
    const applyChangeset = vi.fn().mockResolvedValue({
      createdIds: {},
      updatedIds: [],
      deletedIds: [],
      reorderedSections: [],
      writtenSectionKeys: [],
      failures: [{ kind: "sectionWrite", key: "hero", message: "network error" }],
    } satisfies ApplyChangesetResult);

    render(
      <SectionEditor
        entry={heroEntry}
        baseline={baselineFor()}
        applyChangeset={applyChangeset}
        render={(draft) => (
          <Editable id="hero.eyebrow" kind="text">
            {draft.sections.hero?.eyebrow as string}
          </Editable>
        )}
      />
    );

    await userEvent.click(screen.getByText("Premier"));
    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "New Eyebrow");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));

    expect(applyChangeset).toHaveBeenCalledTimes(1);
    const dispatched = applyChangeset.mock.calls[0][0];
    expect(dispatched.sectionWrites).toEqual([{ key: "hero", fields: { eyebrow: "New Eyebrow" } }]);

    expect(await screen.findByText(/could not save/i)).toBeInTheDocument();
    // Pending edit is still visible in the draft after a failed confirm.
    expect(screen.getByText("New Eyebrow")).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Pending (`new-*`) items must be re-openable and deletable before Confirm.
  // -------------------------------------------------------------------------

  const noopApply = () =>
    Promise.resolve<ApplyChangesetResult>({
      createdIds: {},
      updatedIds: [],
      deletedIds: [],
      reorderedSections: [],
      writtenSectionKeys: [],
      failures: [],
    });

  /** Renders the hero.stats list as clickable item Editables + the Add trigger. */
  const renderStatsList = (draft: SectionDraft) => (
    <ul>
      {(draft.items["hero.stats"] ?? []).map((item) => (
        <li key={String(item.id)}>
          <Editable id={`hero.stats.${item.id}`} kind="item" as="span">
            {(item.fields.l as string) || "(untitled)"} — {item.fields.v as string}
          </Editable>
        </li>
      ))}
    </ul>
  );

  it("a just-added (unconfirmed) item can be reopened and edited again before Confirm", async () => {
    render(
      <SectionEditor
        entry={heroEntry}
        baseline={{ sections: { hero: {} }, items: { "hero.stats": [] } }}
        applyChangeset={vi.fn(noopApply)}
        render={renderStatsList}
      />
    );

    // Add a new item.
    await userEvent.click(screen.getByRole("button", { name: /add hero stats/i }));
    await userEvent.type(screen.getByLabelText(/value/i), "20");
    await userEvent.type(screen.getByLabelText(/label/i), "Countries");
    await userEvent.click(screen.getByRole("button", { name: /^add$/i }));

    // It's in the preview now.
    expect(screen.getByText(/Countries — 20/)).toBeInTheDocument();

    // Reopen it by clicking it — this previously did nothing (Number("new-0") is NaN).
    await userEvent.click(screen.getByText(/Countries — 20/));
    const label = await screen.findByLabelText(/label/i);
    expect(label).toHaveValue("Countries");
    await userEvent.clear(label);
    await userEvent.type(label, "Nations");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    // The edit stuck on the same pending item (still one row).
    expect(screen.getByText(/Nations — 20/)).toBeInTheDocument();
    expect(screen.queryByText(/Countries — 20/)).not.toBeInTheDocument();
  });

  it("a just-added (unconfirmed) item can be deleted before Confirm, leaving no change to dispatch", async () => {
    render(
      <SectionEditor
        entry={heroEntry}
        baseline={{ sections: { hero: {} }, items: { "hero.stats": [] } }}
        applyChangeset={vi.fn(noopApply)}
        render={renderStatsList}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /add hero stats/i }));
    await userEvent.type(screen.getByLabelText(/value/i), "20");
    await userEvent.type(screen.getByLabelText(/label/i), "Countries");
    await userEvent.click(screen.getByRole("button", { name: /^add$/i }));

    expect(screen.getByRole("button", { name: /confirm/i })).toBeEnabled();

    // Reopen and delete it.
    await userEvent.click(screen.getByText(/Countries — 20/));
    await userEvent.click(screen.getByRole("button", { name: /delete this item/i }));

    // Gone, and there is nothing left to save — draft == baseline again, so
    // computeChangeset is empty (no lingering itemCreate).
    expect(screen.queryByText(/Countries — 20/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm/i })).toBeDisabled();
  });

  // -------------------------------------------------------------------------
  // Drag-to-reorder UI.
  // -------------------------------------------------------------------------

  function twoStatsBaseline(): SectionDraft {
    return {
      sections: { hero: {} },
      items: {
        "hero.stats": [
          { id: 1, fields: { v: "5", l: "Ranges" } },
          { id: 2, fields: { v: "10", l: "Years" } },
        ],
      },
    };
  }

  it("hides the Reorder control for a single-item list", () => {
    render(
      <SectionEditor
        entry={heroEntry}
        baseline={{ sections: { hero: {} }, items: { "hero.stats": [{ id: 1, fields: { v: "5", l: "Ranges" } }] } }}
        applyChangeset={vi.fn(noopApply)}
        render={renderStatsList}
      />
    );
    expect(screen.queryByRole("button", { name: /reorder hero stats/i })).not.toBeInTheDocument();
  });

  it("shows the Reorder control for a list with 2+ items", () => {
    render(
      <SectionEditor
        entry={heroEntry}
        baseline={twoStatsBaseline()}
        applyChangeset={vi.fn(noopApply)}
        render={renderStatsList}
      />
    );
    expect(screen.getByRole("button", { name: /reorder hero stats/i })).toBeInTheDocument();
  });

  it("opening the reorder panel, reordering there, and Apply updates the draft; Confirm dispatches the reorder", async () => {
    const applyChangeset = vi.fn(noopApply);
    render(
      <SectionEditor
        entry={heroEntry}
        baseline={twoStatsBaseline()}
        applyChangeset={applyChangeset}
        render={renderStatsList}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /reorder hero stats/i }));

    const panel = screen.getByRole("dialog", { name: /reorder hero stats/i });
    // Panel lists items by their titleField ("l") label.
    expect(within(panel).getByText("Ranges")).toBeInTheDocument();
    expect(within(panel).getByText("Years")).toBeInTheDocument();

    // Move "Years" above "Ranges", then apply.
    await userEvent.click(within(panel).getByRole("button", { name: /move years up/i }));
    await userEvent.click(within(panel).getByRole("button", { name: /apply order/i }));

    // Panel closed; the preview reflects the new order.
    expect(screen.queryByRole("dialog", { name: /reorder hero stats/i })).not.toBeInTheDocument();
    const previewOrder = screen.getAllByText(/Ranges — 5|Years — 10/).map((el) => el.textContent);
    expect(previewOrder[0]).toContain("Years");
    expect(previewOrder[1]).toContain("Ranges");

    // Confirm dispatches exactly one reorder with the new id sequence.
    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));
    expect(applyChangeset).toHaveBeenCalledTimes(1);
    const dispatched = applyChangeset.mock.calls[0][0];
    expect(dispatched.reorders).toEqual([{ section: "hero.stats", ids: [2, 1] }]);
    expect(dispatched.itemUpdates).toEqual([]);
    expect(dispatched.sectionWrites).toEqual([]);
  });
});
