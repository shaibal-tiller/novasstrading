import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ServicePillars } from "../ServicePillars";
import { EditModeProvider } from "../admin/EditModeProvider";

const PILLARS = [
  { title: "Test Pillar One", icon: "clock", body: "Test pillar one body." },
  { title: "Test Pillar Two", icon: "thumb", body: "Test pillar two body." },
];

describe("ServicePillars", () => {
  it("renders each pillar's title and body from the pillars prop", () => {
    render(<ServicePillars pillars={PILLARS} />);
    expect(screen.getAllByText("Test Pillar One").length).toBeGreaterThan(0);
    expect(screen.getByText("Test pillar two body.")).toBeInTheDocument();
  });

  it("does not add any data-editable-id attributes when rendered outside an EditModeProvider", () => {
    const { container } = render(<ServicePillars pillars={PILLARS} />);
    expect(container.querySelectorAll("[data-editable-id]")).toHaveLength(0);
  });

  it("wraps pillar items with data-editable-id when rendered inside an EditModeProvider", () => {
    render(
      <EditModeProvider>
        <ServicePillars
          pillars={
            [
              { title: "Test Pillar One", icon: "clock", body: "Test pillar one body.", id: 1 },
              { title: "Test Pillar Two", icon: "thumb", body: "Test pillar two body.", id: 2 },
            ] as unknown as typeof PILLARS
          }
        />
      </EditModeProvider>
    );

    const bodyEl = screen.getByText("Test pillar two body.").closest("[data-editable-id]");
    expect(bodyEl).toHaveAttribute("data-editable-id", "sourcing.pillars.2");
    expect(bodyEl).toHaveAttribute("data-editable-kind", "item");
  });
});

