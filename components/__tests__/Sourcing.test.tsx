import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sourcing } from "../Sourcing";
import { EditModeProvider } from "../admin/EditModeProvider";

const SOURCING = {
  eyebrow: "Our Services",
  title: "Test title",
  intro: "intro",
  pillars: [{ title: "Test Pillar", icon: "clock", body: "Test pillar body." }],
  services: [{ title: "Test Service", body: "Test service body." }],
  checklistLabel: "We also ensure",
  checklist: ["Test Checklist Item"],
};

describe("Sourcing", () => {
  it("renders pillars/services/checklist from the sourcing prop", () => {
    render(<Sourcing sourcing={SOURCING} />);
    expect(screen.getAllByText("Test Pillar").length).toBeGreaterThan(0);
    expect(screen.getByText("Test Service")).toBeInTheDocument();
  });

  it("does not add any data-editable-id attributes when rendered outside an EditModeProvider", () => {
    const { container } = render(<Sourcing sourcing={SOURCING} />);
    expect(container.querySelectorAll("[data-editable-id]")).toHaveLength(0);
  });

  it("wraps scalar fields and pillar/service/checklist items with data-editable-id when rendered inside an EditModeProvider", () => {
    render(
      <EditModeProvider>
        <Sourcing
          sourcing={{
            ...SOURCING,
            pillars: [
              { title: "Test Pillar", icon: "clock", body: "Test pillar body.", id: 2 },
            ] as unknown as typeof SOURCING.pillars,
            services: [
              { title: "Test Service", body: "Test service body.", id: 8 },
            ] as unknown as typeof SOURCING.services,
            checklist: ["Test Checklist Item"] as unknown as typeof SOURCING.checklist,
          }}
        />
      </EditModeProvider>
    );
    expect(screen.getByText("Our Services")).toHaveAttribute(
      "data-editable-id",
      "sourcing.eyebrow"
    );
    expect(screen.getByText("Test title")).toHaveAttribute("data-editable-id", "sourcing.title");
    expect(screen.getByText("intro")).toHaveAttribute("data-editable-id", "sourcing.intro");

    const checklistLabelEls = screen.getAllByText("We also ensure");
    checklistLabelEls.forEach((el) => {
      expect(el).toHaveAttribute("data-editable-id", "sourcing.checklistLabel");
    });

    // "Test Pillar" is also echoed decoratively in the orbit infographic
    // (ServicePillars' OrbitBubble), which is not a separate editable region
    // for the item — only the pillar card itself is wrapped.
    const pillarBodyEl = screen.getByText("Test pillar body.").closest("[data-editable-id]");
    expect(pillarBodyEl).toHaveAttribute("data-editable-id", "sourcing.pillars.2");
    expect(pillarBodyEl).toHaveAttribute("data-editable-kind", "item");

    const serviceEl = screen.getByText("Test Service").closest("[data-editable-id]");
    expect(serviceEl).toHaveAttribute("data-editable-id", "sourcing.services.8");
    expect(serviceEl).toHaveAttribute("data-editable-kind", "item");

    const checklistEls = screen.getAllByText("Test Checklist Item");
    checklistEls.forEach((el) => {
      const item = el.closest("[data-editable-id]");
      expect(item).toHaveAttribute("data-editable-kind", "item");
      expect(item?.getAttribute("data-editable-id")).toMatch(/^sourcing\.checklist\./);
    });
  });
});

