import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Partners } from "../Partners";
import { EditModeProvider } from "../admin/EditModeProvider";

const PARTNERS = {
  eyebrow: "Test Eyebrow",
  title: "Test Partners Title",
  intro: "intro",
  logos: [{ name: "Test Logo Co", src: "logos/test-1.png" }],
  memberships: [{ name: "Test Membership", src: "logos/test-2.png" }],
};

describe("Partners", () => {
  it("renders logos and memberships from the partners prop", () => {
    render(<Partners partners={PARTNERS} />);
    expect(screen.getAllByText("Test Membership").length).toBeGreaterThan(0);
  });

  it("does not add any data-editable-id attributes when rendered outside an EditModeProvider", () => {
    const { container } = render(<Partners partners={PARTNERS} />);
    expect(container.querySelectorAll("[data-editable-id]")).toHaveLength(0);
  });

  it("wraps scalar fields and logo/membership items with data-editable-id when rendered inside an EditModeProvider", () => {
    render(
      <EditModeProvider>
        <Partners
          partners={{
            ...PARTNERS,
            logos: [
              { name: "Test Logo Co", src: "logos/test-1.png", id: 11 },
            ] as unknown as typeof PARTNERS.logos,
            memberships: [
              { name: "Test Membership", src: "logos/test-2.png", id: 22 },
            ] as unknown as typeof PARTNERS.memberships,
          }}
        />
      </EditModeProvider>
    );
    expect(screen.getByText("Test Eyebrow")).toHaveAttribute("data-editable-id", "partners.eyebrow");
    expect(screen.getByText("Test Partners Title")).toHaveAttribute(
      "data-editable-id",
      "partners.title"
    );
    expect(screen.getByText("intro")).toHaveAttribute("data-editable-id", "partners.intro");

    // The logo is repeated many times across the marquee strips; every
    // rendered instance shares the same underlying item id.
    const logoImgs = screen.getAllByAltText("Test Logo Co logo");
    expect(logoImgs.length).toBeGreaterThan(0);
    logoImgs.forEach((img) => {
      const item = img.closest("[data-editable-id]");
      expect(item).toHaveAttribute("data-editable-id", "partners.logos.11");
      expect(item).toHaveAttribute("data-editable-kind", "item");
    });

    const membershipEls = screen.getAllByText("Test Membership");
    membershipEls.forEach((el) => {
      const item = el.closest("[data-editable-id]");
      expect(item).toHaveAttribute("data-editable-id", "partners.memberships.22");
      expect(item).toHaveAttribute("data-editable-kind", "item");
    });
  });
});
