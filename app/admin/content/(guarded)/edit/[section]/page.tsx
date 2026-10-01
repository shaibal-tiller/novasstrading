import Link from "next/link";
import { notFound } from "next/navigation";
import { getSections, listItems } from "@/lib/cpanel-api";
import { SECTION_REGISTRY } from "@/lib/admin/section-registry";
import type { Fields, SectionDraft } from "@/components/admin/SectionEditor";
import { SectionEditorMount } from "./SectionEditorMount";

// The baseline must always reflect the live DB — never a cached fetch.
export const dynamic = "force-dynamic";

export default async function EditSectionPage({
  params,
}: {
  params: { section: string };
}) {
  const entry = SECTION_REGISTRY.find((e) => e.key === params.section);
  if (!entry) notFound();

  const sections = await getSections();

  // Baseline lists: real DB ids come straight from listItems() — the admin
  // editor's baseline is deliberately NOT routed through getContent(), which
  // strips ids. Each row's `fields` is that row's COMPLETE fields_json.
  const items: Record<string, { id: number; fields: Fields }[]> = {};
  for (const list of entry.lists) {
    items[list.listKey] = await listItems(list.listKey);
  }

  const baseline: SectionDraft = {
    sections: Object.fromEntries(
      entry.primarySectionKeys.map((key) => [key, sections[key] ?? {}]),
    ),
    items,
  };

  // Read-only context a few components need beyond their own editable fields:
  // Header/Contact/Footer render `site`; Footer also renders the nav list.
  const nav = entry.key === "footerBlurb" ? await listItems("nav") : [];

  return (
    <main className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="display-md text-ink">{entry.label}</h1>
        <Link href="/admin/content" className="field-label hover:text-brass-dark">
          &larr; All sections
        </Link>
      </div>

      <SectionEditorMount
        entry={entry}
        baseline={baseline}
        aux={{ site: sections.site ?? {}, nav }}
      />
    </main>
  );
}

