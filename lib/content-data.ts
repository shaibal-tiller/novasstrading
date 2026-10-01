import { getSections, listItems } from "@/lib/cpanel-api";
import { SECTION_REGISTRY } from "@/lib/admin/section-registry";
import { assembleContent, type RawItem } from "@/lib/content-assemble";
import type {
  site as SiteContent,
  nav as NavContent,
  hero as HeroContent,
  about as AboutContent,
  coreValues as CoreValuesContent,
  whyUs as WhyUsContent,
  products as ProductsContent,
  portfolio as PortfolioContent,
  divisions as DivisionsContent,
  leadTime as LeadTimeContent,
  sourcing as SourcingContent,
  process as ProcessContent,
  compliance as ComplianceContent,
  profiles as ProfilesContent,
  partners as PartnersContent,
  contact as ContactContent,
  footerBlurb as FooterBlurbContent,
} from "@/lib/content";

// Matches the shape of every export from lib/content.ts — getContent()
// reassembles this from the API at runtime (see below), so every consumer
// keeps the exact prop types it had when reading the static file directly.
export type FullContent = {
  site: typeof SiteContent;
  nav: typeof NavContent;
  hero: typeof HeroContent;
  about: typeof AboutContent;
  coreValues: typeof CoreValuesContent;
  whyUs: typeof WhyUsContent;
  products: typeof ProductsContent;
  portfolio: typeof PortfolioContent;
  divisions: typeof DivisionsContent;
  leadTime: typeof LeadTimeContent;
  sourcing: typeof SourcingContent;
  process: typeof ProcessContent;
  compliance: typeof ComplianceContent;
  profiles: typeof ProfilesContent;
  partners: typeof PartnersContent;
  contact: typeof ContactContent;
  footerBlurb: typeof FooterBlurbContent;
};

// The set of content_items list keys, sourced from SECTION_REGISTRY (every
// entry's lists[].listKey, flattened). Identical set to the old
// CONTENT_SCHEMA-derived list — just a single source of truth now.
const LIST_SECTIONS = SECTION_REGISTRY.flatMap((entry) =>
  entry.lists.map((list) => list.listKey),
);

export async function getContent(): Promise<FullContent> {
  const sections = await getSections();

  const itemsByListKey: Record<string, RawItem[]> = {};
  for (const listKey of LIST_SECTIONS) {
    itemsByListKey[listKey] = await listItems(listKey);
  }

  // assembleContent is only provably correct at runtime (verified by this
  // file's tests) — TypeScript can't narrow a dynamically-built record to
  // FullContent's exact shape, hence the assertion.
  return assembleContent(sections, itemsByListKey) as unknown as FullContent;
}

