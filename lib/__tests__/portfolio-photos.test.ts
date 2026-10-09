import { describe, it, expect } from "vitest";
import { assembleContent } from "@/lib/content-assemble";
import { photoCaption, photoUrl, photoSize, isPhotoHidden } from "@/lib/portfolio-photo";

const sections = { portfolio: { eyebrow: "E", title: "T", intro: "I", extra: { label: "x", items: [] } } };
const tabs = [
  { id: 1, fields: { key: "woman", label: "Women", categories: [] } },
  { id: 2, fields: { key: "man", label: "Men", categories: [] } },
];
const photos = [
  { id: 10, fields: { tab: "man", src: "a.jpg", alt: "M1" } },
  { id: 11, fields: { tab: "woman", src: "b.jpg", alt: "W1", visibility: "hidden" } },
  { id: 12, fields: { tab: "woman", src: "c.jpg", alt: "W2", size: "wide" } },
];

describe("portfolio photo assembly", () => {
  it("groups photo items under their tab, in order, dropping hidden ones and the internal tab pointer", () => {
    const out = assembleContent(sections, { "portfolio.tabs": tabs, "portfolio.photos": photos }) as any;
    const [woman, man] = out.portfolio.tabs;
    expect(woman.photos).toEqual([{ src: "c.jpg", alt: "W2", size: "wide" }]);
    expect(man.photos).toEqual([{ src: "a.jpg", alt: "M1" }]);
    expect(out.portfolio.photos).toBeUndefined();
  });

  it("keeps hidden photos and real ids for the editor", () => {
    const out = assembleContent(sections, { "portfolio.tabs": tabs, "portfolio.photos": photos }, { keepItemIds: true }) as any;
    expect(out.portfolio.tabs[0].photos.map((p: any) => [p.id, p.visibility ?? null])).toEqual([
      [11, "hidden"],
      [12, null],
    ]);
  });

  it("leaves nested photos alone when no photo items exist (un-migrated database)", () => {
    const nested = [{ id: 1, fields: { key: "woman", label: "W", categories: [], photos: [{ src: "n.jpg", alt: "N" }] } }];
    const out = assembleContent(sections, { "portfolio.tabs": nested, "portfolio.photos": [] }) as any;
    expect(out.portfolio.tabs[0].photos).toEqual([{ src: "n.jpg", alt: "N" }]);
  });
});

describe("portfolio photo helpers", () => {
  it("uses the explicit caption, else the text after the dash, else the description", () => {
    expect(photoCaption({ alt: "Cat — Nice top", caption: "Hero" })).toBe("Hero");
    expect(photoCaption({ alt: "Cat — Nice top" })).toBe("Nice top");
    expect(photoCaption({ alt: "Plain" })).toBe("Plain");
  });
  it("routes uploaded media to the media host and bundled photos to /assets", () => {
    expect(photoUrl("products/x.jpg")).toBe("/assets/products/x.jpg");
    expect(photoUrl("/already/abs.jpg")).toBe("/already/abs.jpg");
    expect(photoUrl("media/abc.webp")).toMatch(/media\/abc\.webp$/);
  });
  it("defaults unknown sizes to normal and reads visibility", () => {
    expect(photoSize({ size: "huge" as any })).toBe("normal");
    expect(photoSize({})).toBe("normal");
    expect(isPhotoHidden({ visibility: "hidden" })).toBe(true);
    expect(isPhotoHidden({})).toBe(false);
  });
});

import { photoBlur } from "@/lib/portfolio-photo";
describe("blur-up placeholders", () => {
  it("prefers the bundled map, then a stored blur - but only for the file it was made from", () => {
    expect(photoBlur({ src: "a.jpg" }, { "a.jpg": "data:bundled" })).toBe("data:bundled");
    expect(photoBlur({ src: "media/x.webp", blur: "data:own", blurSrc: "media/x.webp" })).toBe("data:own");
    // photo was replaced: the stored blur belongs to the OLD file and must not be shown
    expect(photoBlur({ src: "media/new.webp", blur: "data:own", blurSrc: "media/old.webp" })).toBeUndefined();
    expect(photoBlur({ src: "media/x.webp" })).toBeUndefined();
  });
});
