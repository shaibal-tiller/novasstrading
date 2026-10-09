import type { AdminIconName } from "@/components/admin/AdminIcon";

/**
 * What each editor section is, in plain words, for the card view of /admin/content.
 * Keys match SECTION_REGISTRY. A section missing here still shows up (generic card), so adding a
 * section to the registry never hides it from the editors.
 */
export type SectionInfo = { icon: AdminIconName; description: string };

export const SECTION_INFO: Record<string, SectionInfo> = {
  site: { icon: "sliders", description: "Company name, tagline, phone numbers, email, address and social links." },
  nav: { icon: "menu", description: "The menu links across the top of the website." },
  footerBlurb: { icon: "footer", description: "The short company text at the bottom of every page." },
  hero: { icon: "sparkle", description: "The big banner at the very top: headline, intro text, buttons and key numbers." },
  about: { icon: "info", description: "Your story, mission, vision and the highlights next to them." },
  coreValues: { icon: "heart", description: "The values you stand for, shown as cards." },
  whyUs: { icon: "help", description: "The reasons buyers choose to work with Nova SS." },
  products: { icon: "shirt", description: "The product ranges you make, with their descriptions." },
  portfolio: { icon: "image", description: "Collection photos by category: order, size, framing, hide and captions." },
  sourcing: { icon: "briefcase", description: "The services you offer and the “we also ensure” checklist." },
  process: { icon: "steps", description: "The step-by-step way an order moves from idea to shipment." },
  divisions: { icon: "layers", description: "Your business divisions and the lead-time table." },
  compliance: { icon: "shield", description: "Quality checks, certifications and memberships." },
  partners: { icon: "users", description: "Client logos and the organisations you belong to." },
  profiles: { icon: "file", description: "Company profile documents visitors can download." },
  contact: { icon: "mail", description: "Contact cards and the subject choices in the enquiry form." },
};

export const FALLBACK_SECTION_INFO: SectionInfo = { icon: "sliders", description: "Edit this part of the website." };

/** Settings that apply across the whole site; everything else is a block on the page. */
export const SITE_WIDE_KEYS: readonly string[] = ["site", "nav", "footerBlurb"];
