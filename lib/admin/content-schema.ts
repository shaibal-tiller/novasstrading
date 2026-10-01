export type SectionSchema = {
  key: string;
  label: string;
  kind: "section" | "list";
  onPageAnchor: string;
};

export const CONTENT_SCHEMA: SectionSchema[] = [
  { key: "site", label: "Site Info (name, contact, address)", kind: "section", onPageAnchor: "#home" },
  { key: "nav", label: "Navigation", kind: "list", onPageAnchor: "#home" },
  { key: "hero", label: "Hero", kind: "section", onPageAnchor: "#home" },
  { key: "hero.stats", label: "Hero (stats)", kind: "list", onPageAnchor: "#home" },
  { key: "about", label: "About", kind: "section", onPageAnchor: "#about" },
  { key: "about.body", label: "About (body paragraphs)", kind: "list", onPageAnchor: "#about" },
  { key: "about.highlights", label: "About (highlights)", kind: "list", onPageAnchor: "#about" },
  { key: "coreValues", label: "Core Values (intro)", kind: "section", onPageAnchor: "#values" },
  { key: "coreValues.values", label: "Core Values (list)", kind: "list", onPageAnchor: "#values" },
  { key: "whyUs", label: "Why Us (intro)", kind: "section", onPageAnchor: "#values" },
  { key: "whyUs.reasons", label: "Why Us (list)", kind: "list", onPageAnchor: "#values" },
  { key: "products", label: "Product Range (intro)", kind: "section", onPageAnchor: "#products" },
  { key: "products.items", label: "Product Range (list)", kind: "list", onPageAnchor: "#products" },
  { key: "portfolio", label: "Portfolio (intro)", kind: "section", onPageAnchor: "#portfolio" },
  { key: "portfolio.tabs", label: "Portfolio (tabs)", kind: "list", onPageAnchor: "#portfolio" },
  { key: "sourcing", label: "Services (intro)", kind: "section", onPageAnchor: "#sourcing" },
  { key: "sourcing.pillars", label: "Services (pillars)", kind: "list", onPageAnchor: "#sourcing" },
  { key: "sourcing.services", label: "Services (list)", kind: "list", onPageAnchor: "#sourcing" },
  { key: "sourcing.checklist", label: "Services (checklist)", kind: "list", onPageAnchor: "#sourcing" },
  { key: "process", label: "Working Process (intro)", kind: "section", onPageAnchor: "#process" },
  { key: "process.steps", label: "Working Process (steps)", kind: "list", onPageAnchor: "#process" },
  { key: "divisions", label: "Divisions (intro)", kind: "section", onPageAnchor: "#divisions" },
  { key: "divisions.items", label: "Divisions (list)", kind: "list", onPageAnchor: "#divisions" },
  { key: "leadTime", label: "Lead-Time Framework", kind: "section", onPageAnchor: "#divisions" },
  { key: "leadTime.rows", label: "Lead-Time Framework (rows)", kind: "list", onPageAnchor: "#divisions" },
  { key: "compliance", label: "Compliance (intro)", kind: "section", onPageAnchor: "#compliance" },
  { key: "compliance.protocolBody", label: "Compliance (protocol paragraphs)", kind: "list", onPageAnchor: "#compliance" },
  { key: "compliance.checks", label: "Compliance (checks)", kind: "list", onPageAnchor: "#compliance" },
  { key: "compliance.certifications", label: "Compliance (certifications)", kind: "list", onPageAnchor: "#compliance" },
  { key: "partners", label: "Partners (intro)", kind: "section", onPageAnchor: "#contact" },
  { key: "partners.logos", label: "Partner Logos", kind: "list", onPageAnchor: "#contact" },
  { key: "partners.memberships", label: "Memberships", kind: "list", onPageAnchor: "#contact" },
  { key: "profiles", label: "Company Profile (intro)", kind: "section", onPageAnchor: "#contact" },
  { key: "profiles.documents", label: "Company Profile Documents", kind: "list", onPageAnchor: "#contact" },
  { key: "contact", label: "Contact", kind: "section", onPageAnchor: "#contact" },
  { key: "contact.cards", label: "Contact (cards)", kind: "list", onPageAnchor: "#contact" },
  { key: "contact.subjects", label: "Contact (subjects)", kind: "list", onPageAnchor: "#contact" },
  { key: "footerBlurb", label: "Footer blurb", kind: "section", onPageAnchor: "#contact" },
];

