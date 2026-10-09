import { describe, it, expect } from "vitest";
import { safeJsonForScript } from "../safe-json";

describe("safeJsonForScript", () => {
  it("cannot be closed early or start markup, yet parses back to the same value", () => {
    const value = { description: 'x</script><img src=x onerror=alert(1)> & "q"    ' };
    const out = safeJsonForScript(value);
    expect(out).not.toMatch(/[<>&  ]/);
    expect(JSON.parse(out)).toEqual(value);
  });
});
