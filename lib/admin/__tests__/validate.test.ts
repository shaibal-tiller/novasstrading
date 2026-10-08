import { describe, expect, it } from "vitest";
import { hasTitle, urlError } from "../validate";

describe("urlError", () => {
  it("accepts blank, web, mailto and tel links", () => {
    for (const ok of ["", "  ", "https://novasstrading.com", "http://x.co/a?b=1", "mailto:a@b.com", "tel:+8801700000000"]) {
      expect(urlError(ok)).toBeNull();
    }
  });

  it("rejects junk", () => {
    for (const bad of ["not a url !!", "novasstrading", "javascript:alert(1)", "ftp://x.com/a", "https://", "#about"]) {
      expect(urlError(bad)).not.toBeNull();
    }
  });
});

describe("hasTitle", () => {
  it("is false for blank or missing titles", () => {
    expect(hasTitle({ title: "  " }, "title")).toBe(false);
    expect(hasTitle({}, "title")).toBe(false);
    expect(hasTitle({ title: "Quality" }, "title")).toBe(true);
  });
});
