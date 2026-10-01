// ---------------------------------------------------------------------------
// SECTION_REGISTRY — the declarative content-field schema behind the visual
// click-to-edit admin editor.
//
// Every field listed here was cross-checked against BOTH the component that
// renders it (components/*.tsx) and lib/content.ts's corresponding export,
// which still matches the DB-backed shape exactly.
//
// Conventions (read before adding to this file):
//
// * `scalarFields[].path` is FULLY QUALIFIED with its owning content_sections
//   key — "hero.eyebrow", not "eyebrow". Three reasons: the Divisions entry
//   writes two sections (`divisions` + `leadTime`) which both have
//   eyebrow/title/intro, so unqualified paths would collide inside a single
//   entry; it makes `path` identical to the `data-editable-id` the components
//   are instrumented with; and it matches `lists[].listKey`, which is already
//   fully qualified because it maps 1:1 to `content_items.section_key`.
//   To address the underlying fields_json, drop the first segment.
//
// * `listKey` matches `content_items.section_key` verbatim (the values
//   scripts/migrate-content.ts seeded and lib/content-data.ts reads back).
//
// * Lists whose rows are plain strings in lib/content.ts (about.body,
//   about.highlights, compliance.protocolBody, sourcing.checklist,
//   contact.subjects) were wrapped as `{ text }` during migration — hence
//   their single `text` item field. Same for the `footerBlurb` section, whose
//   whole value is stored as `{ text }`.
//
// * `control: "url"` is reserved for fields that always hold an absolute URI.
//   In-page anchors ("#products") use "text" so a `type="url"` input cannot
//   reject them.
//
// * NOT in this schema, deliberately:
//   - The 5 hardcoded images with no backing content field: About's two
//     `products/categories/kidswear-1.jpg` renders, Compliance's
//     `garment-quality-inspection.jpg` QA photo, and Divisions' two
//     index-keyed `placeholders` — plus Contact's Google Maps iframe (lat/lng
//     baked into the URL). Ruled static/non-editable for this pass.
//   - `leadTime.columns` — dead data; LeadTimeTable.tsx hardcodes its own
//     `COLUMNS` constant and migrate-content.ts skips the field.
//   - `portfolio.tabs[].photos` — a nested array of `{ src, alt }` objects
//     inside an item's fields_json. ItemFieldKind has no nested-list kind, so
//     it cannot be expressed here; see the note on that entry below.
//
// * !! THIS SCHEMA IS NOT THE WHOLE ROW. A field's absence from `itemFields`
//   or `scalarFields` means "not editable here" — it NEVER means "safe to
//   drop". Any save path MUST read the row's existing fields_json, overlay
//   only the registry-declared fields that actually changed, and write the
//   MERGED object back. Serializing just the declared fields (or stripping
//   every array-valued key before saving) would silently destroy undeclared
//   data — most severely `portfolio.tabs[].photos`, where renaming one tab label
//   would wipe 14–25 photo objects (~66 images across the gallery, the
//   site's largest image collection). Same rule protects any field a future
//   migration adds before this registry catches up.
//
// * NESTED STRING ARRAYS (`divisions.items[].bullets`,
//   `portfolio.tabs[].categories`, `portfolio.extra.items`) live inside their
//   parent's JSON rather than as their own `content_items` rows, so they are
//   not lists. They are declared here as "textarea" — the edit modal MUST
//   split/join them on newlines, because writing a bare string back where an
//   array was would break the public page (e.g. `d.bullets.map(...)` in
//   Divisions.tsx).
//
//   THE ONE-PER-LINE CONTRACT, PINNED: joining uses `array.join("\n")`;
//   splitting uses `text.split("\n")` with any line that is empty or
//   all-whitespace dropped (typically a trailing blank line left by the
//   textarea) — every other line is kept verbatim, including internal
//   whitespace, so join-then-split round-trips a normal array exactly.
//
//   `portfolio.extra.items` is a *scalar* field, so its `currentValue`
//   reaching the edit modal is always the real (possibly-empty) array
//   already loaded from the section — `Array.isArray(currentValue)` is a
//   fully reliable signal there (a scalar field is never "new").
//
//   `divisions.items[].bullets` and `portfolio.tabs[].categories` are *item*
//   fields, where that signal breaks down for a brand-new item being added
//   (no current value exists yet to inspect). Those two entries carry
//   `list: true` below specifically so the edit modal has a static signal
//   that survives the add-new-item case too, instead of only being able to
//   infer array-ness from an existing item's data.
// ---------------------------------------------------------------------------

export type FieldControl = "text" | "textarea" | "url" | "enum";
export type ItemFieldKind = FieldControl | "media" | "document";

export type ScalarField = {
  path: string;
  label: string;
  control: FieldControl;
  options?: string[];
};

export type ItemField = {
  key: string;
  label: string;
  kind: ItemFieldKind;
  options?: string[];
  /**
   * True only for the "textarea" item fields that are actually plain string
   * arrays (one value per line) rather than a single multi-line string — see
   * the NESTED STRING ARRAYS note above. Absent (or false) for every other
   * field, including ordinary multi-line text fields like `body`/`products`.
   */
  list?: boolean;
};

export type ListSpec = {
  /** Matches content_items.section_key exactly, e.g. "hero.stats". */
  listKey: string;
  label: string;
  itemFields: ItemField[];
  /** Which itemFields[].key labels the item in add/reorder UI. */
  titleField: string;
};

export type SectionEntry = {
  /** Unique registry id; matches content_sections.section_key for single-source entries. */
  key: string;
  label: string;
  /** content_sections keys this entry can WRITE (empty for the items-only `nav` entry). */
  primarySectionKeys: string[];
  /** Section-qualified dot-paths into primarySectionKeys' fields_json. */
  scalarFields: ScalarField[];
  lists: ListSpec[];
};

/** Literal keys of `pillarIcons` in components/ServicePillars.tsx. */
const PILLAR_ICONS = ["clock", "thumb", "check", "gear"];

/** Literal keys of `icons` in components/Process.tsx. */
const PROCESS_ICONS = [
  "sourcing",
  "quality",
  "design",
  "compliance",
  "packing",
  "shipment",
];

export const SECTION_REGISTRY: SectionEntry[] = [
  // -------------------------------------------------------------------------
  // 1. Site Info — no visible block of its own; edited as a plain settings
  // form. Header/Footer/Contact read these fields as read-only context.
  // -------------------------------------------------------------------------
  {
    key: "site",
    label: "Site Info",
    primarySectionKeys: ["site"],
    scalarFields: [
      { path: "site.name", label: "Company name", control: "text" },
      { path: "site.legalName", label: "Legal name", control: "text" },
      { path: "site.tagline", label: "Tagline", control: "text" },
      { path: "site.url", label: "Site URL", control: "url" },
      { path: "site.description", label: "Meta description", control: "textarea" },
      { path: "site.email", label: "E-mail address", control: "text" },
      { path: "site.phone", label: "Phone (display)", control: "text" },
      { path: "site.phoneHref", label: "Phone (tel: digits)", control: "text" },
      { path: "site.whatsapp", label: "WhatsApp number (digits only)", control: "text" },
      { path: "site.whatsappUrl", label: "WhatsApp link", control: "url" },
      { path: "site.address.street", label: "Street", control: "text" },
      { path: "site.address.city", label: "City", control: "text" },
      { path: "site.address.postalCode", label: "Postal code", control: "text" },
      { path: "site.address.country", label: "Country", control: "text" },
      { path: "site.address.full", label: "Full address (one line)", control: "text" },
      { path: "site.address.mapUrl", label: "Google Maps link", control: "url" },
      { path: "site.social.linkedin", label: "LinkedIn URL", control: "url" },
    ],
    lists: [],
  },

  // -------------------------------------------------------------------------
  // 2. Navigation — a bare top-level array in lib/content.ts, so it has no
  // content_sections row of its own: items only. Shared by Header + Footer.
  // -------------------------------------------------------------------------
  {
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
          { key: "href", label: "Anchor (e.g. #about)", kind: "text" },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 3. Hero — components/Hero.tsx
  // -------------------------------------------------------------------------
  {
    key: "hero",
    label: "Hero",
    primarySectionKeys: ["hero"],
    scalarFields: [
      { path: "hero.eyebrow", label: "Eyebrow", control: "text" },
      { path: "hero.companyName", label: "Company name", control: "text" },
      { path: "hero.tagline", label: "Tagline", control: "text" },
      { path: "hero.body", label: "Body", control: "textarea" },
      { path: "hero.primaryCta.label", label: "Primary button text", control: "text" },
      { path: "hero.primaryCta.href", label: "Primary button anchor", control: "text" },
      { path: "hero.secondaryCta.label", label: "Secondary button text", control: "text" },
      { path: "hero.secondaryCta.href", label: "Secondary button anchor", control: "text" },
    ],
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
  },

  // -------------------------------------------------------------------------
  // 4. About — components/About.tsx. Its two images are hardcoded (see header).
  // -------------------------------------------------------------------------
  {
    key: "about",
    label: "About",
    primarySectionKeys: ["about"],
    scalarFields: [
      { path: "about.eyebrow", label: "Eyebrow", control: "text" },
      { path: "about.title", label: "Title", control: "text" },
      { path: "about.mission.title", label: "Mission title", control: "text" },
      { path: "about.mission.body", label: "Mission body", control: "textarea" },
      { path: "about.vision.title", label: "Vision title", control: "text" },
      { path: "about.vision.body", label: "Vision body", control: "textarea" },
    ],
    lists: [
      {
        listKey: "about.body",
        label: "About paragraphs",
        titleField: "text",
        itemFields: [{ key: "text", label: "Paragraph", kind: "textarea" }],
      },
      {
        listKey: "about.highlights",
        label: "About highlights",
        titleField: "text",
        itemFields: [{ key: "text", label: "Highlight", kind: "text" }],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 5. Core Values — components/CoreValues.tsx
  // -------------------------------------------------------------------------
  {
    key: "coreValues",
    label: "Core Values",
    primarySectionKeys: ["coreValues"],
    scalarFields: [
      { path: "coreValues.eyebrow", label: "Eyebrow", control: "text" },
      { path: "coreValues.title", label: "Title", control: "text" },
      { path: "coreValues.intro", label: "Intro", control: "textarea" },
    ],
    lists: [
      {
        listKey: "coreValues.values",
        label: "Core values",
        titleField: "title",
        itemFields: [
          { key: "title", label: "Value", kind: "text" },
          { key: "body", label: "Description", kind: "textarea" },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 6. Why Us — components/WhyUs.tsx. Its icons come from a positional,
  // hardcoded `icons` array in the component — not a content field.
  // -------------------------------------------------------------------------
  {
    key: "whyUs",
    label: "Why Us",
    primarySectionKeys: ["whyUs"],
    scalarFields: [
      { path: "whyUs.eyebrow", label: "Eyebrow", control: "text" },
      { path: "whyUs.title", label: "Title", control: "text" },
      { path: "whyUs.intro", label: "Intro", control: "textarea" },
    ],
    lists: [
      {
        listKey: "whyUs.reasons",
        label: "Reasons",
        titleField: "title",
        itemFields: [
          { key: "title", label: "Reason", kind: "text" },
          { key: "body", label: "Description", kind: "textarea" },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 7. Product Range — components/ProductRange.tsx
  // -------------------------------------------------------------------------
  {
    key: "products",
    label: "Product Range",
    primarySectionKeys: ["products"],
    scalarFields: [
      { path: "products.eyebrow", label: "Eyebrow", control: "text" },
      { path: "products.title", label: "Title", control: "text" },
      { path: "products.intro", label: "Intro", control: "textarea" },
    ],
    lists: [
      {
        listKey: "products.items",
        label: "Product ranges",
        titleField: "title",
        itemFields: [
          { key: "title", label: "Range", kind: "text" },
          { key: "body", label: "Description", kind: "textarea" },
          { key: "image", label: "Photo", kind: "media" },
          { key: "alt", label: "Photo alt text", kind: "text" },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 8. Portfolio — components/Portfolio.tsx.
  // KNOWN GAP: each tab also carries `photos: { src, alt }[]` (14–25 images
  // per tab) nested inside the item's fields_json. ItemFieldKind has no
  // nested-list kind, so those photos are not editable through this schema
  // yet — Task 9 is explicitly licensed to extend this entry.
  //
  // !! MUST BE PRESERVED ON SAVE. `photos` is undeclared, not disposable.
  // Writing a portfolio tab back from `itemFields` alone — or through any
  // save path that drops array-valued keys — deletes that tab's entire photo
  // gallery on the first label edit. Saving a tab means: read the row's existing fields_json,
  // overlay only the changed declared fields, write the merged object back.
  // `categories` below is an array too and carries the same requirement.
  // -------------------------------------------------------------------------
  {
    key: "portfolio",
    label: "Portfolio",
    primarySectionKeys: ["portfolio"],
    scalarFields: [
      { path: "portfolio.eyebrow", label: "Eyebrow", control: "text" },
      { path: "portfolio.title", label: "Title", control: "text" },
      { path: "portfolio.intro", label: "Intro", control: "textarea" },
      { path: "portfolio.extra.label", label: "“Also covering” label", control: "text" },
      {
        path: "portfolio.extra.items",
        label: "“Also covering” entries (one per line)",
        control: "textarea",
      },
    ],
    lists: [
      {
        listKey: "portfolio.tabs",
        label: "Portfolio tabs",
        titleField: "label",
        itemFields: [
          { key: "key", label: "Tab id (internal)", kind: "text" },
          { key: "label", label: "Tab label", kind: "text" },
          { key: "categories", label: "Categories (one per line)", kind: "textarea", list: true },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 9. Services — components/Sourcing.tsx + components/ServicePillars.tsx
  // (one content section, two components).
  // -------------------------------------------------------------------------
  {
    key: "sourcing",
    label: "Services",
    primarySectionKeys: ["sourcing"],
    scalarFields: [
      { path: "sourcing.eyebrow", label: "Eyebrow", control: "text" },
      { path: "sourcing.title", label: "Title", control: "text" },
      { path: "sourcing.intro", label: "Intro", control: "textarea" },
      { path: "sourcing.checklistLabel", label: "Checklist heading", control: "text" },
    ],
    lists: [
      {
        listKey: "sourcing.pillars",
        label: "Service pillars",
        titleField: "title",
        itemFields: [
          { key: "title", label: "Pillar", kind: "text" },
          { key: "icon", label: "Icon", kind: "enum", options: PILLAR_ICONS },
          { key: "body", label: "Description", kind: "textarea" },
        ],
      },
      {
        listKey: "sourcing.services",
        label: "Services",
        titleField: "title",
        itemFields: [
          { key: "title", label: "Service", kind: "text" },
          { key: "body", label: "Description", kind: "textarea" },
        ],
      },
      {
        listKey: "sourcing.checklist",
        label: "“We also ensure” checklist",
        titleField: "text",
        itemFields: [{ key: "text", label: "Checklist entry", kind: "text" }],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 10. Working Process — components/Process.tsx
  // -------------------------------------------------------------------------
  {
    key: "process",
    label: "Working Process",
    primarySectionKeys: ["process"],
    scalarFields: [
      { path: "process.eyebrow", label: "Eyebrow", control: "text" },
      { path: "process.title", label: "Title", control: "text" },
      { path: "process.intro", label: "Intro", control: "textarea" },
    ],
    lists: [
      {
        listKey: "process.steps",
        label: "Process steps",
        titleField: "title",
        itemFields: [
          { key: "n", label: "Step number", kind: "text" },
          { key: "icon", label: "Icon", kind: "enum", options: PROCESS_ICONS },
          { key: "title", label: "Step", kind: "text" },
          { key: "body", label: "Description", kind: "textarea" },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 11. Divisions — components/Divisions.tsx, which also renders
  // components/LeadTimeTable.tsx, so this entry writes two sections.
  // Its two division images are hardcoded placeholders (see header).
  // -------------------------------------------------------------------------
  {
    key: "divisions",
    label: "Divisions",
    primarySectionKeys: ["divisions", "leadTime"],
    scalarFields: [
      { path: "divisions.eyebrow", label: "Eyebrow", control: "text" },
      { path: "divisions.title", label: "Title", control: "text" },
      { path: "divisions.intro", label: "Intro", control: "textarea" },
      { path: "leadTime.eyebrow", label: "Lead-time eyebrow", control: "text" },
      { path: "leadTime.title", label: "Lead-time title", control: "text" },
      { path: "leadTime.intro", label: "Lead-time intro", control: "textarea" },
    ],
    lists: [
      {
        listKey: "divisions.items",
        label: "Divisions",
        titleField: "title",
        itemFields: [
          { key: "index", label: "Division number", kind: "text" },
          { key: "title", label: "Division", kind: "text" },
          { key: "body", label: "Description", kind: "textarea" },
          { key: "productsLabel", label: "Products heading", kind: "text" },
          { key: "products", label: "Products", kind: "textarea" },
          { key: "bullets", label: "Bullet points (one per line)", kind: "textarea", list: true },
        ],
      },
      {
        listKey: "leadTime.rows",
        label: "Lead-time rows",
        titleField: "product",
        itemFields: [
          { key: "product", label: "Product / accessory", kind: "text" },
          { key: "sampleLeadTime", label: "Sample lead-time", kind: "text" },
          { key: "productionLeadTime", label: "Production lead-time", kind: "text" },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 12. Compliance — components/Compliance.tsx. Its QA photo is hardcoded
  // (see header).
  // -------------------------------------------------------------------------
  {
    key: "compliance",
    label: "Compliance",
    primarySectionKeys: ["compliance"],
    scalarFields: [
      { path: "compliance.eyebrow", label: "Eyebrow", control: "text" },
      { path: "compliance.title", label: "Title", control: "text" },
      { path: "compliance.intro", label: "Intro", control: "textarea" },
      { path: "compliance.protocolTitle", label: "Protocol title", control: "text" },
      { path: "compliance.footnote", label: "Footnote", control: "textarea" },
    ],
    lists: [
      {
        listKey: "compliance.protocolBody",
        label: "Protocol paragraphs",
        titleField: "text",
        itemFields: [{ key: "text", label: "Paragraph", kind: "textarea" }],
      },
      {
        listKey: "compliance.checks",
        label: "Quality checks",
        titleField: "title",
        itemFields: [
          { key: "title", label: "Check", kind: "text" },
          { key: "body", label: "Description", kind: "textarea" },
        ],
      },
      {
        listKey: "compliance.certifications",
        label: "Certifications & memberships",
        titleField: "name",
        itemFields: [
          { key: "name", label: "Name", kind: "text" },
          { key: "detail", label: "Full name / detail", kind: "text" },
          { key: "src", label: "Badge image", kind: "media" },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 13. Partners — components/Partners.tsx
  // -------------------------------------------------------------------------
  {
    key: "partners",
    label: "Partners",
    primarySectionKeys: ["partners"],
    scalarFields: [
      { path: "partners.eyebrow", label: "Eyebrow", control: "text" },
      { path: "partners.title", label: "Title", control: "text" },
      { path: "partners.intro", label: "Intro", control: "textarea" },
    ],
    lists: [
      {
        listKey: "partners.logos",
        label: "Client logos",
        titleField: "name",
        itemFields: [
          { key: "name", label: "Client name", kind: "text" },
          { key: "src", label: "Logo", kind: "media" },
        ],
      },
      {
        listKey: "partners.memberships",
        label: "Memberships",
        titleField: "name",
        itemFields: [
          { key: "name", label: "Membership name", kind: "text" },
          { key: "src", label: "Logo", kind: "media" },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 14. Company Profile — components/Profiles.tsx. `href` is the only
  // "document" field in the whole registry (PDF upload path).
  // -------------------------------------------------------------------------
  {
    key: "profiles",
    label: "Company Profile",
    primarySectionKeys: ["profiles"],
    scalarFields: [
      { path: "profiles.eyebrow", label: "Eyebrow", control: "text" },
      { path: "profiles.title", label: "Title", control: "text" },
      { path: "profiles.intro", label: "Intro", control: "textarea" },
    ],
    lists: [
      {
        listKey: "profiles.documents",
        label: "Documents",
        titleField: "title",
        itemFields: [
          { key: "title", label: "Document title", kind: "text" },
          { key: "body", label: "Description", kind: "textarea" },
          { key: "href", label: "PDF file", kind: "document" },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 15. Contact — components/Contact.tsx. The map iframe is hardcoded and the
  // inquiry form's own labels live in the component, not in content.
  // -------------------------------------------------------------------------
  {
    key: "contact",
    label: "Contact",
    primarySectionKeys: ["contact"],
    scalarFields: [
      { path: "contact.eyebrow", label: "Eyebrow", control: "text" },
      { path: "contact.title", label: "Title", control: "text" },
      { path: "contact.intro", label: "Intro", control: "textarea" },
    ],
    lists: [
      {
        listKey: "contact.cards",
        label: "Contact cards",
        titleField: "label",
        itemFields: [
          { key: "label", label: "Card label", kind: "text" },
          { key: "value", label: "Displayed value", kind: "text" },
          { key: "href", label: "Link", kind: "url" },
        ],
      },
      {
        listKey: "contact.subjects",
        label: "Inquiry subjects",
        titleField: "text",
        itemFields: [{ key: "text", label: "Subject", kind: "text" }],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 16. Footer — components/Footer.tsx. Only `footerBlurb` belongs here; the
  // footer's links come from the Navigation entry and its contact details
  // from Site Info.
  // -------------------------------------------------------------------------
  {
    key: "footerBlurb",
    label: "Footer",
    primarySectionKeys: ["footerBlurb"],
    scalarFields: [
      { path: "footerBlurb.text", label: "Footer blurb", control: "textarea" },
    ],
    lists: [],
  },
];

