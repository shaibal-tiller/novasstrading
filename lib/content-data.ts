import { getContentBundle } from "@/lib/cpanel-api";
import * as bundledContent from "@/lib/content";
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

/** The content that ships inside the deploy — what the site showed before the portal existed. */
function bundled(): FullContent {
  return bundledContent as unknown as FullContent;
}

/**
 * The public site's content: one cached call to the content API, reassembled
 * into the lib/content.ts shape.
 *
 * Safe by construction: if the API is unreachable, or the database has not
 * been seeded yet, the site falls back to the content bundled with the deploy
 * instead of failing the build or rendering blank sections. A section the
 * database has no rows for also falls back individually.
 */
export async function getContent(): Promise<FullContent> {
  let bundle: Awaited<ReturnType<typeof getContentBundle>>;
  try {
    bundle = await getContentBundle();
  } catch (err) {
    console.error("getContent: content API unavailable, serving bundled content:", err);
    return bundled();
  }

  const { sections, items } = bundle;
  if (Object.keys(sections).length === 0 && Object.keys(items).length === 0) {
    console.warn("getContent: content database is empty, serving bundled content");
    return bundled();
  }

  const itemsByListKey: Record<string, RawItem[]> = {};
  for (const listKey of LIST_SECTIONS) {
    itemsByListKey[listKey] = items[listKey] ?? [];
  }

  // assembleContent is only provably correct at runtime (verified by this
  // file's tests) — TypeScript can't narrow a dynamically-built record to
  // FullContent's exact shape, hence the assertion.
  const assembled = assembleContent(sections, itemsByListKey) as Record<string, unknown>;

  // Per-section fallback: an export the database knows nothing about keeps
  // its bundled value rather than disappearing.
  const fallback = bundled() as unknown as Record<string, unknown>;
  const merged: Record<string, unknown> = {};
  for (const key of Object.keys(fallback)) {
    const inDb =
      key in sections || LIST_SECTIONS.some((lk) => lk.split(".")[0] === key && (items[lk]?.length ?? 0) > 0);
    merged[key] = inDb && assembled[key] !== undefined ? assembled[key] : fallback[key];
  }
  return merged as unknown as FullContent;
}
