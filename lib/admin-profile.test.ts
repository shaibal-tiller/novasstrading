import { describe, expect, it } from "vitest";
import { displayNameFor, initialsFor } from "./admin-profile";

describe("admin profile helpers", () => {
  it("builds a readable name from the mailbox", () => {
    expect(displayNameFor("it-support@novasstrading.com")).toBe("It Support");
    expect(displayNameFor("admin@novasstrading.com")).toBe("Admin");
    expect(displayNameFor("rakib.hasan@novasstrading.com")).toBe("Rakib Hasan");
  });

  it("builds one or two initials", () => {
    expect(initialsFor("it-support@novasstrading.com")).toBe("IS");
    expect(initialsFor("admin@novasstrading.com")).toBe("A");
    expect(initialsFor("a.b.c@x.com")).toBe("AB");
  });

  it("never returns an empty avatar", () => {
    expect(initialsFor("@x.com")).toBe("?");
    expect(displayNameFor("@x.com")).toBe("@x.com");
  });
});
