import { describe, it, expect } from "vitest";
import { isSlowConnection } from "@/lib/use-connection";

describe("isSlowConnection", () => {
  it("is slow for data-saver and 3G-or-worse, fast otherwise", () => {
    expect(isSlowConnection({ saveData: true, effectiveType: "4g" })).toBe(true);
    expect(isSlowConnection({ effectiveType: "3g" })).toBe(true);
    expect(isSlowConnection({ effectiveType: "2g" })).toBe(true);
    expect(isSlowConnection({ effectiveType: "slow-2g" })).toBe(true);
    expect(isSlowConnection({ effectiveType: "4g" })).toBe(false);
    expect(isSlowConnection({})).toBe(false);
    expect(isSlowConnection(undefined)).toBe(false);
  });
});
