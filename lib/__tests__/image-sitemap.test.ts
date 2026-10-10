import { describe, expect, it } from "vitest";
import { buildImageSitemap } from "../image-sitemap";

describe("buildImageSitemap", () => {
  const tabs = [
    { photos: [{ src: "products/women/a.jpg", alt: "Women — Navy blazer & skirt", caption: "Navy blazer" }] },
    { photos: [
      { src: "products/women/a.jpg", alt: "duplicate" },
      { src: "products/men/b.jpg", alt: "Men — Polo", visibility: "hidden" as const },
      { src: "products/kids/c.jpg", alt: "Kids — Hoodie" },
    ] },
  ];
  const xml = buildImageSitemap("https://www.novasstrading.com", tabs);

  it("lists each visible photo once with an absolute address", () => {
    expect(xml).toContain("<image:loc>https://www.novasstrading.com/assets/products/women/a.jpg</image:loc>");
    expect(xml).toContain("<image:loc>https://www.novasstrading.com/assets/products/kids/c.jpg</image:loc>");
    expect(xml.match(/women\/a\.jpg/g)).toHaveLength(1);
  });
  it("leaves out hidden photos and escapes text", () => {
    expect(xml).not.toContain("men/b.jpg");
    expect(xml).toContain("Navy blazer &amp; skirt");
  });
});
