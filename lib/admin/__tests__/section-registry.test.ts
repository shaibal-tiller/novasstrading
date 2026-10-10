import { describe, expect, it } from "vitest";
import {
  SECTION_REGISTRY,
  type ItemField,
  type ScalarField,
} from "@/lib/admin/section-registry";

// Frozen snapshot of exactly which content_sections / content_items section
// keys the migration seeded into the DB (scripts/migrate-content.ts, sourced
// from lib/content.ts). The registry is cross-checked against this below.
// Previously derived from lib/admin/content-schema.ts, which SECTION_REGISTRY
// superseded and replaced.
const MIGRATED_SECTION_KEYS = [
  "site",
  "hero",
  "about",
  "coreValues",
  "whyUs",
  "products",
  "portfolio",
  "sourcing",
  "process",
  "divisions",
  "leadTime",
  "compliance",
  "partners",
  "profiles",
  "contact",
  "footerBlurb",
];
const MIGRATED_LIST_KEYS = [
  "nav",
  "hero.stats",
  "about.body",
  "about.highlights",
  "coreValues.values",
  "whyUs.reasons",
  "products.items",
  "portfolio.tabs",
  "portfolio.photos",
  "sourcing.pillars",
  "sourcing.services",
  "sourcing.checklist",
  "process.steps",
  "divisions.items",
  "leadTime.rows",
  "compliance.protocolBody",
  "compliance.checks",
  "compliance.certifications",
  "partners.logos",
  "partners.memberships",
  "profiles.documents",
  "contact.cards",
  "contact.subjects",
];

const SCHEMA_LIST_KEYS = new Set(MIGRATED_LIST_KEYS);
const SCHEMA_SECTION_KEYS = new Set(MIGRATED_SECTION_KEYS);

const allLists = SECTION_REGISTRY.flatMap((entry) => entry.lists);
const allItemFields: ItemField[] = allLists.flatMap((list) => list.itemFields);
const allScalarFields: ScalarField[] = SECTION_REGISTRY.flatMap(
  (entry) => entry.scalarFields,
);

describe("SECTION_REGISTRY", () => {
  it("has the 16 entries the visual editor's section picker expects", () => {
    expect(SECTION_REGISTRY).toHaveLength(16);
    expect(SECTION_REGISTRY.map((e) => e.key)).toEqual([
      "site",
      "nav",
      "hero",
      "about",
      "coreValues",
      "whyUs",
      "products",
      "portfolio",
      "sourcing",
      "process",
      "divisions",
      "compliance",
      "partners",
      "profiles",
      "contact",
      "footerBlurb",
    ]);
  });

  it("gives every entry a non-empty, unique key and a label", () => {
    const keys = SECTION_REGISTRY.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const entry of SECTION_REGISTRY) {
      expect(entry.key.length).toBeGreaterThan(0);
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });

  describe.each(SECTION_REGISTRY.map((entry) => [entry.key, entry] as const))(
    "entry %s",
    (_key, entry) => {
      it("has non-empty, non-duplicated scalar field paths", () => {
        const paths = entry.scalarFields.map((f) => f.path);
        for (const field of entry.scalarFields) {
          expect(field.path.trim()).not.toBe("");
          expect(field.label.trim()).not.toBe("");
        }
        expect(new Set(paths).size).toBe(paths.length);
      });

      it("qualifies every scalar path with one of its primary section keys", () => {
        for (const field of entry.scalarFields) {
          const [sectionKey] = field.path.split(".");
          expect(entry.primarySectionKeys).toContain(sectionKey);
        }
      });

      it("names only real content_sections keys as primary", () => {
        for (const sectionKey of entry.primarySectionKeys) {
          expect(SCHEMA_SECTION_KEYS.has(sectionKey)).toBe(true);
        }
      });

      it("has non-empty, non-duplicated item field keys in every list", () => {
        for (const list of entry.lists) {
          expect(list.listKey.trim()).not.toBe("");
          expect(list.label.trim()).not.toBe("");
          expect(list.itemFields.length).toBeGreaterThan(0);

          const keys = list.itemFields.map((f) => f.key);
          for (const field of list.itemFields) {
            expect(field.key.trim()).not.toBe("");
            expect(field.label.trim()).not.toBe("");
          }
          expect(new Set(keys).size).toBe(keys.length);
        }
      });

      it("points every titleField at one of that list's own item fields", () => {
        for (const list of entry.lists) {
          expect(list.itemFields.map((f) => f.key)).toContain(list.titleField);
        }
      });
    },
  );

  it("gives every enum field a non-empty list of unique options", () => {
    const enumFields = [
      ...allScalarFields.filter((f) => f.control === "enum"),
      ...allItemFields.filter((f) => f.kind === "enum"),
    ];
    expect(enumFields.length).toBeGreaterThan(0);

    for (const field of enumFields) {
      // Choices that come from another list (a photo's category tab) are filled in by the editor.
      if ("optionsFrom" in field && field.optionsFrom) {
        expect(allLists.some((l) => l.listKey === field.optionsFrom!.listKey)).toBe(true);
        continue;
      }
      expect(field.options).toBeDefined();
      expect(field.options!.length).toBeGreaterThan(0);
      expect(new Set(field.options!).size).toBe(field.options!.length);
      for (const option of field.options!) {
        expect(option.trim()).not.toBe("");
      }
    }
  });

  it("matches the icon-map keys the components actually render", () => {
    // Literal keys of `pillarIcons` in components/ServicePillars.tsx — an icon
    // value outside this set renders nothing at all.
    const pillars = SECTION_REGISTRY.find((e) => e.key === "sourcing")!
      .lists.find((l) => l.listKey === "sourcing.pillars")!
      .itemFields.find((f) => f.key === "icon")!;
    expect(pillars.kind).toBe("enum");
    expect(pillars.options).toEqual(["clock", "thumb", "check", "gear"]);

    // Literal keys of `icons` in components/Process.tsx.
    const steps = SECTION_REGISTRY.find((e) => e.key === "process")!
      .lists.find((l) => l.listKey === "process.steps")!
      .itemFields.find((f) => f.key === "icon")!;
    expect(steps.kind).toBe("enum");
    expect(steps.options).toEqual([
      "sourcing",
      "quality",
      "design",
      "compliance",
      "packing",
      "shipment",
    ]);
  });

  it("keeps every listKey globally unique", () => {
    const listKeys = allLists.map((l) => l.listKey);
    expect(new Set(listKeys).size).toBe(listKeys.length);
  });

  it("uses only listKeys that exist as content_items section keys", () => {
    for (const list of allLists) {
      expect(SCHEMA_LIST_KEYS.has(list.listKey)).toBe(true);
    }
  });

  it("covers every list and section key the migrated content has", () => {
    const listKeys = new Set(allLists.map((l) => l.listKey));
    expect([...SCHEMA_LIST_KEYS].filter((k) => !listKeys.has(k))).toEqual([]);

    const sectionKeys = new Set(
      SECTION_REGISTRY.flatMap((e) => e.primarySectionKeys),
    );
    expect([...SCHEMA_SECTION_KEYS].filter((k) => !sectionKeys.has(k))).toEqual([]);
  });

  it("spot-checks the listKeys most likely to be typo'd", () => {
    const listKeys = allLists.map((l) => l.listKey);
    expect(listKeys).toContain("hero.stats");
    expect(listKeys).toContain("products.items");
    expect(listKeys).toContain("compliance.certifications");
    expect(listKeys).toContain("leadTime.rows");
    expect(listKeys).toContain("nav");
  });

  it("writes both divisions and leadTime from the single Divisions entry", () => {
    const divisions = SECTION_REGISTRY.find((e) => e.key === "divisions")!;
    expect(divisions.primarySectionKeys).toEqual(["divisions", "leadTime"]);
    expect(divisions.lists.map((l) => l.listKey)).toEqual([
      "divisions.items",
      "leadTime.rows",
    ]);
    // leadTime.columns is dead data — LeadTimeTable hardcodes its headers.
    expect(divisions.scalarFields.map((f) => f.path)).not.toContain(
      "leadTime.columns",
    );
  });

  it("uploads the company profile as a document, not as media", () => {
    const documents = SECTION_REGISTRY.find((e) => e.key === "profiles")!
      .lists.find((l) => l.listKey === "profiles.documents")!;
    const href = documents.itemFields.find((f) => f.key === "href")!;
    expect(href.kind).toBe("document");

    // It is the only document field in the registry.
    expect(allItemFields.filter((f) => f.kind === "document")).toHaveLength(1);
  });

  it("leaves portfolio tab photos undeclared (they must be merged, not stripped, on save)", () => {
    const tabs = SECTION_REGISTRY.find((e) => e.key === "portfolio")!
      .lists.find((l) => l.listKey === "portfolio.tabs")!;
    // `photos` is a nested array of { src, alt } objects that this schema
    // cannot express. Declaring it without also teaching the save path to
    // merge undeclared fields would risk destroying the whole gallery — see
    // the MUST BE PRESERVED ON SAVE note on the portfolio entry.
    expect(tabs.itemFields.map((f) => f.key)).not.toContain("photos");
  });

  it("flags exactly the one-per-line string-array item fields with list:true", () => {
    // Documented in the file header: divisions.items[].bullets and
    // portfolio.tabs[].categories are plain string arrays living inside their
    // parent's JSON, not their own content_items rows. `list:true` is the
    // edit modal's static signal to split/join on newlines even for a
    // brand-new item, where there's no existing value to inspect.
    const flagged = allItemFields
      .filter((f) => f.list === true)
      .map((f) => f.key);
    // "detail" = a photo's lightbox spec lines (one per line), added with portfolio.photos.
    expect(flagged.sort()).toEqual(["bullets", "categories", "detail"]);

    const bullets = SECTION_REGISTRY.find((e) => e.key === "divisions")!
      .lists.find((l) => l.listKey === "divisions.items")!
      .itemFields.find((f) => f.key === "bullets")!;
    expect(bullets.kind).toBe("textarea");
    expect(bullets.list).toBe(true);

    const categories = SECTION_REGISTRY.find((e) => e.key === "portfolio")!
      .lists.find((l) => l.listKey === "portfolio.tabs")!
      .itemFields.find((f) => f.key === "categories")!;
    expect(categories.kind).toBe("textarea");
    expect(categories.list).toBe(true);

    // Ordinary multi-line text fields (e.g. divisions.items[].products) stay
    // unflagged — they're a single string, not a one-per-line array.
    const products = SECTION_REGISTRY.find((e) => e.key === "divisions")!
      .lists.find((l) => l.listKey === "divisions.items")!
      .itemFields.find((f) => f.key === "products")!;
    expect(products.kind).toBe("textarea");
    expect(products.list).toBeUndefined();
  });

  it("declares the media fields the image picker needs", () => {
    const mediaFields = allLists.flatMap((list) =>
      list.itemFields
        .filter((f) => f.kind === "media")
        .map((f) => `${list.listKey}.${f.key}`),
    );
    expect(mediaFields).toEqual([
      "products.items.image",
      "portfolio.photos.src",
      "compliance.certifications.src",
      "partners.logos.src",
      "partners.memberships.src",
    ]);
  });
});

