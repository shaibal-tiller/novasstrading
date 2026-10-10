import { describe, expect, it } from "vitest";
import { tabKeyFrom, weakPhotoDescription } from "../tab-keys";

describe("tabKeyFrom", () => {
  it("makes a short lowercase id from the name", () => {
    expect(tabKeyFrom("Home & Textile", [])).toBe("home-textile");
    expect(tabKeyFrom("  Sweaters!  ", [])).toBe("sweaters");
  });
  it("never repeats an id that is already used", () => {
    expect(tabKeyFrom("Kids", ["kids"])).toBe("kids-2");
    expect(tabKeyFrom("Kids", ["kids", "kids-2"])).toBe("kids-3");
  });
  it("still returns an id for names with no letters or digits", () => {
    expect(tabKeyFrom("বাংলা", [])).toBe("tab");
    expect(tabKeyFrom("???", ["tab"])).toBe("tab-2");
  });
});

describe("weakPhotoDescription", () => {
  it("flags camera and file names", () => {
    for (const a of ["Women — IMG_4021", "Men — DSC00123", "Kids — photo 12", "Women — Image 1234", "x"]) {
      expect(weakPhotoDescription(a), a).toBe(true);
    }
  });
  it("accepts real descriptions", () => {
    for (const a of ["Women — Navy blazer over white blouse", "Knitted cable-knit sweater in oatmeal"]) {
      expect(weakPhotoDescription(a), a).toBe(false);
    }
  });
});
