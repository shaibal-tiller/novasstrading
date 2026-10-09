import { describe, it, expect } from "vitest";
import { safeJsonForScript } from "../safe-json";

describe("safeJsonForScript", () => {
  it("cannot be closed early or start markup, yet parses back to the same value", () => {
    const value = { description: "x</script><img src=x onerror=alert(1)> & \"q\" "+String.fromCharCode(0x2028)+String.fromCharCode(0x2029) };
    const out = safeJsonForScript(value);
    expect(out).not.toMatch(/[<>&]/);
    expect(out.includes(String.fromCharCode(0x2028))).toBe(false);
    expect(out.includes(String.fromCharCode(0x2029))).toBe(false);
    expect(JSON.parse(out)).toEqual(value);
  });
});
