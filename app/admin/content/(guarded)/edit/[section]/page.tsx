import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSections, listItems } from "@/lib/cpanel-api";
import { SECTION_REGISTRY } from "@/lib/admin/section-registry";
import { GuardedLink } from "@/components/admin/GuardedLink";
import type { Fields, SectionDraft } from "@/components/admin/SectionEditor";
import { SectionEditorMount } from "./SectionEditorMount";

// The baseline must always reflect the live DB — never a cached fetch.
export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { section: string } }): Metadata {
  const entry = SECTION_REGISTRY.find((e) => e.key === params.section);
  return { title: entry ? `Edit ${entry.label}` : "Edit" };
}

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
    <main className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4">
        <h1 className="display-md text-ink">{entry.label}</h1>
        <GuardedLink href="/admin/content" className="field-label inline-flex min-h-10 items-center hover:text-brass-dark">
          &larr; All sections
        </GuardedLink>
      </div>

      <SectionEditorMount
        entry={entry}
        baseline={baseline}
        aux={{ site: sections.site ?? {}, nav }}
      />
    </main>
  );
}

