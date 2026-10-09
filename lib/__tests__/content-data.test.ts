import { describe, it, expect, vi, beforeEach } from "vitest";

const bundle = {
  sections: {
    hero: { eyebrow: "Premier" },
    coreValues: { eyebrow: "Compass", title: "Values" },
    about: { title: "About us" },
    footerBlurb: { text: "A leading garments buying house." },
    leadTime: { eyebrow: "Lead-Time" },
  },
  items: {
    "coreValues.values": [{ id: 1, fields: { title: "Integrity" } }, { id: 2, fields: { title: "Quality" } }],
    nav: [{ id: 1, fields: { label: "About", href: "#about" } }],
    "hero.stats": [{ id: 1, fields: { v: "5", l: "Core product ranges" } }],
    "about.body": [{ id: 1, fields: { text: "We work with all kinds of garments." } }],
    "about.highlights": [{ id: 1, fields: { text: "Ethical sourcing" } }, { id: 2, fields: { text: "On-time delivery" } }],
    "leadTime.rows": [{ id: 1, fields: { product: "Buttons", sampleLeadTime: "2-4 Days", productionLeadTime: "3-7 Days" } }],
  },
};

const getContentBundle = vi.fn();
vi.mock("@/lib/cpanel-api", () => ({ getContentBundle: () => getContentBundle() }));

import { getContent } from "@/lib/content-data";

describe("getContent", () => {
  beforeEach(() => {
    getContentBundle.mockReset();
    getContentBundle.mockResolvedValue(bundle);
  });

  it("merges section scalars with their object-item list fields into the original lib/content.ts shape", async () => {
    const content = await getContent();
    expect(content.hero).toEqual({ eyebrow: "Premier", stats: [{ v: "5", l: "Core product ranges" }] });
    expect(content.coreValues).toEqual({
      eyebrow: "Compass",
      title: "Values",
      values: [{ title: "Integrity" }, { title: "Quality" }],
    });
  });

  it("assigns a bare top-level list export (nav) directly, with no parent object", async () => {
    const content = await getContent();
    expect(content.nav).toEqual([{ label: "About", href: "#about" }]);
  });

  it("unwraps { text } items in a text-wrapped list back to a plain string array", async () => {
    const content = await getContent();
    expect(content.about).toEqual({
      title: "About us",
      body: ["We work with all kinds of garments."],
      highlights: ["Ethical sourcing", "On-time delivery"],
    });
  });

  it("unwraps a { text } section (footerBlurb) back to a plain string", async () => {
    const content = await getContent();
    expect(content.footerBlurb).toBe("A leading garments buying house.");
  });

  it("unwraps leadTime.rows items back into 3-string tuples", async () => {
    const content = await getContent();
    expect(content.leadTime).toEqual({
      eyebrow: "Lead-Time",
      rows: [["Buttons", "2-4 Days", "3-7 Days"]],
    });
  });

  it("serves the bundled content when the content API is unreachable", async () => {
    getContentBundle.mockImplementation(async () => {
      throw new Error("boom");
    });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const content = await getContent();
    expect(content.hero.eyebrow).not.toBe("Premier");
    expect(content.nav.length).toBeGreaterThan(1);
    spy.mockRestore();
  });

  it("serves the bundled content when the database is empty", async () => {
    getContentBundle.mockResolvedValue({ sections: {}, items: {} });
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const content = await getContent();
    expect(content.about.title).not.toBe("About us");
    spy.mockRestore();
  });

  it("keeps the bundled value for a section the database has no rows for", async () => {
    const content = await getContent();
    expect(content.hero.eyebrow).toBe("Premier");
    expect(content.partners).toBeDefined();
    expect(content.partners).not.toEqual({});
  });
});
