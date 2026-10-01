import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/cpanel-api", () => ({
  getSections: vi.fn().mockResolvedValue({
    hero: { eyebrow: "Premier" },
    coreValues: { eyebrow: "Compass", title: "Values" },
    about: { title: "About us" },
    footerBlurb: { text: "A leading garments buying house." },
    leadTime: { eyebrow: "Lead-Time" },
  }),
  listItems: vi.fn().mockImplementation(async (section: string) => {
    if (section === "coreValues.values") {
      return [{ id: 1, fields: { title: "Integrity" } }, { id: 2, fields: { title: "Quality" } }];
    }
    if (section === "nav") {
      return [{ id: 1, fields: { label: "About", href: "#about" } }];
    }
    if (section === "hero.stats") {
      return [{ id: 1, fields: { v: "5", l: "Core product ranges" } }];
    }
    if (section === "about.body") {
      return [{ id: 1, fields: { text: "We work with all kinds of garments." } }];
    }
    if (section === "about.highlights") {
      return [{ id: 1, fields: { text: "Ethical sourcing" } }, { id: 2, fields: { text: "On-time delivery" } }];
    }
    if (section === "leadTime.rows") {
      return [{ id: 1, fields: { product: "Buttons", sampleLeadTime: "2-4 Days", productionLeadTime: "3-7 Days" } }];
    }
    return [];
  }),
}));

import { getContent } from "@/lib/content-data";

describe("getContent", () => {
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
});

