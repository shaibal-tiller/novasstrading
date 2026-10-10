import { describe, expect, it } from "vitest";
import { consentRequired } from "../consent-region";

describe("consentRequired", () => {
  it("asks visitors from the EU, EEA, UK and Switzerland", () => {
    for (const c of ["DE", "fr", "GB", "CH", "NO", "IE"]) expect(consentRequired(c)).toBe(true);
  });
  it("does not ask visitors from elsewhere", () => {
    for (const c of ["BD", "US", "IN", "CN", "AE"]) expect(consentRequired(c)).toBe(false);
  });
  it("asks when the country is unknown", () => {
    expect(consentRequired(null)).toBe(true);
    expect(consentRequired(undefined)).toBe(true);
    expect(consentRequired("  ")).toBe(true);
  });
});
