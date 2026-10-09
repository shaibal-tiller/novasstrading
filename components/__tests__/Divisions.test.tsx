import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Divisions } from "../Divisions";
import { EditModeProvider } from "../admin/EditModeProvider";

const DIVISIONS = {
  eyebrow: "Our Divisions",
  title: "Test title",
  intro: "divisions intro",
  items: [
    {
      index: "Division 01",
      title: "Test Division",
      body: "Test division body.",
      productsLabel: "Products include",
      products: "Test products",
      bullets: ["Test bullet"],
    },
  ],
};

const LEAD_TIME = {
  eyebrow: "Lead-Time",
  title: "Test lead-time title",
  intro: "lead-time intro",
  rows: [["Test Row Product", "1 Day", "2 Days"]],
};

describe("Divisions", () => {
  it("renders items from the divisions prop and forwards leadTime to LeadTimeTable", () => {
    render(<Divisions divisions={DIVISIONS} leadTime={LEAD_TIME} />);
    expect(screen.getByText("Test Division")).toBeInTheDocument();
    expect(screen.getByText("Test Row Product")).toBeInTheDocument();
  });

  it("does not add any data-editable-id attributes when rendered outside an EditModeProvider", () => {
    const { container } = render(<Divisions divisions={DIVISIONS} leadTime={LEAD_TIME} />);
    expect(container.querySelectorAll("[data-editable-id]")).toHaveLength(0);
  });

  it("wraps scalar fields and division items with data-editable-id when rendered inside an EditModeProvider", () => {
    render(
      <EditModeProvider>
        <Divisions
          divisions={{
            ...DIVISIONS,
            items: [
              { ...DIVISIONS.items[0], id: 4 },
            ] as unknown as typeof DIVISIONS.items,
          }}
          leadTime={LEAD_TIME}
        />
      </EditModeProvider>
    );
    expect(screen.getByText("Our Divisions")).toHaveAttribute("data-editable-id", "divisions.eyebrow");
    expect(screen.getByText("Test title")).toHaveAttribute("data-editable-id", "divisions.title");
    expect(screen.getByText("divisions intro")).toHaveAttribute("data-editable-id", "divisions.intro");

    // The whole division card (index/title/body/products/bullets) is one
    // kind="item" region — bullets are not independently clickable.
    const titleEl = screen.getByText("Test Division").closest("[data-editable-id]");
    expect(titleEl).toHaveAttribute("data-editable-id", "divisions.items.4");
    expect(titleEl).toHaveAttribute("data-editable-kind", "item");

    const bulletEl = screen.getByText("Test bullet").closest("[data-editable-id]");
    expect(bulletEl).toHaveAttribute("data-editable-id", "divisions.items.4");
    expect(bulletEl).toHaveAttribute("data-editable-kind", "item");
  });
});
