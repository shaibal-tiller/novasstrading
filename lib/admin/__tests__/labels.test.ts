import { describe, expect, it } from "vitest";
import { describeTrashed } from "../labels";
import { plural } from "../plural";

describe("plural", () => {
  it("only adds the s when it is not exactly one", () => {
    expect(plural(1, "item")).toBe("1 item");
    expect(plural(0, "file")).toBe("0 files");
    expect(plural(3, "file")).toBe("3 files");
  });
});

describe("describeTrashed", () => {
  it("uses the list's friendly label and the item's title", () => {
    expect(describeTrashed("whyUs.reasons", { title: "Quality" })).toEqual({ kind: "Reasons", name: "Quality" });
  });

  it("falls back for a photo with no caption or description", () => {
    expect(describeTrashed("portfolio.photos", { src: "a.jpg", caption: "" })).toEqual({
      kind: "Portfolio photos",
      name: "Photo (no caption)",
    });
  });

  it("falls back for anything else without a name", () => {
    expect(describeTrashed("mystery.list", {})).toEqual({ kind: "Item", name: "Untitled item" });
  });
});
