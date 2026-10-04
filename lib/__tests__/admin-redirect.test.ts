import { describe, it, expect } from "vitest";
import { chooserDecision, normalizeAdminEmail, safeNextPath } from "@/lib/admin-redirect";

describe("safeNextPath", () => {
  it.each([
    ["/admin", "/admin"],
    ["/admin/content", "/admin/content"],
    ["/admin/content/edit/hero?x=1", "/admin/content/edit/hero?x=1"],
    ["/admin/inventory/assets", "/admin/inventory/assets"],
    ["/admin?tab=1", "/admin?tab=1"],
  ])("keeps %s", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });

  it.each([
    [undefined],
    [null],
    [""],
    ["/"],
    ["https://evil.example.com/admin"],
    ["//evil.example.com/admin"],
    ["/administrator"],
    ["/adminx/../../evil"],
    ["/admin\\..\\evil"],
    ["admin/content"],
    ["/products"],
  ])("falls back to /admin for %s", (input) => {
    expect(safeNextPath(input as string | null | undefined)).toBe("/admin");
  });
});

describe("normalizeAdminEmail", () => {
  it("appends the company domain when there is no @", () => {
    expect(normalizeAdminEmail("  shaibal ")).toBe("shaibal@novasstrading.com");
  });
  it("leaves a full address alone", () => {
    expect(normalizeAdminEmail("a@example.com")).toBe("a@example.com");
  });
  it("returns empty for blank input", () => {
    expect(normalizeAdminEmail("   ")).toBe("");
  });
});

describe("chooserDecision", () => {
  it("redirects straight to the only module", () => {
    expect(chooserDecision(["website"])).toEqual({ kind: "redirect", href: "/admin/content" });
    expect(chooserDecision(["assets"])).toEqual({ kind: "redirect", href: "/admin/inventory/assets" });
  });
  it("offers a choice with Website first", () => {
    expect(chooserDecision(["assets", "website"])).toEqual({ kind: "choose", modules: ["website", "assets"] });
  });
  it("reports no access", () => {
    expect(chooserDecision([])).toEqual({ kind: "none" });
  });
});
