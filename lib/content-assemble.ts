// ---------------------------------------------------------------------------
// content-assemble — the pure reassembly step that turns raw DB rows
// (content_sections + content_items) back into the lib/content.ts-shaped
// object every marketing component reads.
//
// Two consumers:
//  * lib/content-data.ts's getContent() — the whole site, for app/page.tsx.
//    Public render: list items are unwrapped to their plain field shape,
//    numeric DB ids dropped (the public page never needs them).
//  * the visual editor's live preview (app/admin/content/(guarded)/edit/...)
//    — one section at a time, with `keepItemIds: true` so every list item
//    still carries its real numeric `id` (the Editable instrumentation in
//    the components renders `id={`${listKey}.${item.id}`}`).
//
// It has NO server-only imports, so it is safe to run in the client editor.
// ---------------------------------------------------------------------------

export type Fields = Record<string, unknown>;
export type RawItem = { id: number; fields: Fields };

// Lists whose entries were wrapped as { text: string } during migration
// because the original lib/content.ts field is a plain string[] — unwrapped
// back to string[] here.
export const TEXT_WRAPPED_LISTS = new Set([
  "about.body",
  "about.highlights",
  "compliance.protocolBody",
  "sourcing.checklist",
  "contact.subjects",
]);

// Section singletons whose value was wrapped as { text: string } because the
// original export is a bare top-level string — unwrapped back to a plain
// string here.
export const TEXT_WRAPPED_SECTIONS = ["footerBlurb"];

/**
 * A boxed string that also carries a numeric `id`. Components that render a
 * text-wrapped list (About paragraphs, Compliance protocol body, Sourcing
 * checklist, …) use the value both as a string (`{p}`, `p.slice(...)`) and
 * read `p.id` for the Editable's id — a bare primitive can't do both, so in
 * editor mode we hand them `Object.assign(new String(text), { id })`.
 */
function boxedString(text: string, id: number): string {
  return Object.assign(new String(text), { id }) as unknown as string;
}

type AssembleOptions = {
  /** Keep each list item's real numeric DB `id` on the assembled value. */
  keepItemIds?: boolean;
};

/**
 * Reassembles the lib/content.ts-shaped object from raw section rows and raw
 * content_items rows (keyed by their `section_key` / `listKey`). Pure.
 */
export function assembleContent(
  sections: Record<string, Fields>,
  itemsByListKey: Record<string, RawItem[]>,
  options: AssembleOptions = {},
): Record<string, unknown> {
  const keepIds = options.keepItemIds === true;
  const result: Record<string, unknown> = structuredClone(sections);

  for (const key of TEXT_WRAPPED_SECTIONS) {
    const wrapped = result[key] as { text?: string } | undefined;
    if (wrapped && typeof wrapped === "object") result[key] = wrapped.text;
  }

  for (const [listKey, items] of Object.entries(itemsByListKey)) {
    if (listKey === "leadTime.rows") {
      const rows = items.map((i) => {
        const f = i.fields as {
          product: string;
          sampleLeadTime: string;
          productionLeadTime: string;
        };
        const tuple = [f.product, f.sampleLeadTime, f.productionLeadTime];
        return keepIds ? Object.assign(tuple, { id: i.id }) : tuple;
      });
      (result.leadTime as Fields) ??= {};
      (result.leadTime as Fields).rows = rows;
      continue;
    }

    let values: unknown[];
    if (TEXT_WRAPPED_LISTS.has(listKey)) {
      values = items.map((i) => {
        const text = (i.fields as { text: string }).text;
        return keepIds ? boxedString(text, i.id) : text;
      });
    } else {
      values = items.map((i) => (keepIds ? { id: i.id, ...i.fields } : i.fields));
    }

    if (!listKey.includes(".")) {
      // Bare top-level list export (nav today): no parent object to nest under.
      result[listKey] = values;
      continue;
    }

    const [exportName, arrayFieldName] = listKey.split(".");
    result[exportName] ??= {};
    (result[exportName] as Fields)[arrayFieldName] = values;
  }

  return result;
}

