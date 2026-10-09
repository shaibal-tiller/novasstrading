import { describe, it, expect } from "vitest";
import { MODULE_LINKS, chooserDecision, normalizeAdminEmail, safeNextPath } from "@/lib/admin-redirect";

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
  it("redirects straight there when only one destination is left (Assets-only)", () => {
    expect(chooserDecision(["assets"])).toEqual({ kind: "redirect", href: "/admin/inventory/assets" });
  });
  it("gives a website-only user two cards: Website and Analytics", () => {
    expect(chooserDecision(["website"])).toEqual({ kind: "choose", destinations: ["website", "analytics"] });
  });
  it("offers every destination in order Website, Analytics, Assets", () => {
    expect(chooserDecision(["assets", "website"])).toEqual({
      kind: "choose",
      destinations: ["website", "analytics", "assets"],
    });
  });
  it("links Analytics to /admin/analytics with its blurb", () => {
    expect(MODULE_LINKS.analytics).toMatchObject({
      href: "/admin/analytics",
      label: "Analytics",
      blurb: "Visitors, where they come from, and what they search on Google.",
    });
  });
  it("reports no access", () => {
    expect(chooserDecision([])).toEqual({ kind: "none" });
  });
});
