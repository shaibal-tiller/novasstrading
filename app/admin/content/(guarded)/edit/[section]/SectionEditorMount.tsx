"use client";

import type { ReactNode } from "react";
import type { SectionEntry } from "@/lib/admin/section-registry";
import {
  SectionEditor,
  type Fields,
  type SectionDraft,
} from "@/components/admin/SectionEditor";
import { Editable } from "@/components/admin/Editable";
import { assembleContent, type RawItem } from "@/lib/content-assemble";
import { applyChangesetAction } from "./actions";

import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { CoreValues } from "@/components/CoreValues";
import { WhyUs } from "@/components/WhyUs";
import { ProductRange } from "@/components/ProductRange";
import { Portfolio } from "@/components/Portfolio";
import { Sourcing } from "@/components/Sourcing";
import { Process } from "@/components/Process";
import { Divisions } from "@/components/Divisions";
import { Compliance } from "@/components/Compliance";
import { Partners } from "@/components/Partners";
import { Profiles } from "@/components/Profiles";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

type Aux = {
  site: Fields;
  nav: { id: number; fields: Fields }[];
};

function getPath(obj: Fields, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Fields)[key];
  }
  return cur;
}

/**
 * The `site` entry has no visible marketing block — it's a plain settings
 * form. Each scalar field is still rendered as an `Editable` so the shared
 * click-to-edit modal (which resolves scalar dot-paths) works unchanged.
 */
function SettingsView({
  entry,
  draft,
}: {
  entry: SectionEntry;
  draft: SectionDraft;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-ink/10 bg-paper">
      {entry.scalarFields.map((field) => {
        const [sectionKey, ...rest] = field.path.split(".");
        const value = getPath(draft.sections[sectionKey] ?? {}, rest);
        const display = typeof value === "string" ? value : "";
        return (
          <div
            key={field.path}
            className="flex flex-col gap-1 border-b border-ink/10 px-4 py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-4"
          >
            <span className="field-label sm:w-56 sm:flex-shrink-0">
              {field.label}
            </span>
            <Editable id={field.path} kind="text" as="div" className="text-ink">
              {display || (
                <span className="italic text-ink-muted">Not set</span>
              )}
            </Editable>
          </div>
        );
      })}
    </div>
  );
}

function navItems(nav: Aux["nav"]) {
  return nav.map((row) => ({ id: row.id, ...row.fields }));
}

function renderSection(
  entry: SectionEntry,
  draft: SectionDraft,
  aux: Aux,
): ReactNode {
  if (entry.key === "site") {
    return <SettingsView entry={entry} draft={draft} />;
  }

  // Reassemble just this entry's slice of the lib/content.ts shape from the
  // live draft — keeping every list item's real numeric id so the components'
  // `Editable id={`${listKey}.${item.id}`}` instrumentation resolves.
  const c = assembleContent(
    draft.sections,
    draft.items as Record<string, RawItem[]>,
    { keepItemIds: true },
  ) as any;
  const site = aux.site as any;

  switch (entry.key) {
    case "nav":
      return <Header nav={c.nav ?? []} site={site} />;
    case "hero":
      return <Hero hero={c.hero} />;
    case "about":
      return <About about={c.about} />;
    case "coreValues":
      return <CoreValues coreValues={c.coreValues} />;
    case "whyUs":
      return <WhyUs whyUs={c.whyUs} />;
    case "products":
      return <ProductRange products={c.products} />;
    case "portfolio":
      return <Portfolio portfolio={c.portfolio} />;
    case "sourcing":
      return <Sourcing sourcing={c.sourcing} />;
    case "process":
      return <Process process={c.process} />;
    case "divisions":
      return <Divisions divisions={c.divisions} leadTime={c.leadTime} />;
    case "compliance":
      return <Compliance compliance={c.compliance} />;
    case "partners":
      return <Partners partners={c.partners} />;
    case "profiles":
      return <Profiles profiles={c.profiles} />;
    case "contact":
      return <Contact contact={c.contact} site={site} />;
    case "footerBlurb":
      return (
        <Footer
          footerBlurb={typeof c.footerBlurb === "string" ? c.footerBlurb : ""}
          nav={navItems(aux.nav) as any}
          site={site}
        />
      );
    default:
      return null;
  }
}

export function SectionEditorMount({
  entry,
  baseline,
  aux,
}: {
  entry: SectionEntry;
  baseline: SectionDraft;
  aux: Aux;
}) {
  return (
    <SectionEditor
      entry={entry}
      baseline={baseline}
      applyChangeset={applyChangesetAction}
      render={(draft) => renderSection(entry, draft, aux)}
    />
  );
}

