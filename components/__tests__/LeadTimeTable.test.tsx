import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeadTimeTable } from "../LeadTimeTable";
import { EditModeProvider } from "../admin/EditModeProvider";

const LEAD_TIME = {
  eyebrow: "Lead-Time Framework",
  title: "Product & lead-time framework",
  intro: "intro",
  rows: [["Test Product XYZ", "9-9 Days", "1-1 Days"]],
};

describe("LeadTimeTable", () => {
  it("renders rows from the leadTime prop and its own hardcoded column headers", () => {
    render(<LeadTimeTable leadTime={LEAD_TIME} />);
    expect(screen.getByText("Test Product XYZ")).toBeInTheDocument();
    expect(screen.getByText("Products / Accessories")).toBeInTheDocument(); // hardcoded header
  });

  it("does not add any data-editable-id attributes when rendered outside an EditModeProvider", () => {
    const { container } = render(<LeadTimeTable leadTime={LEAD_TIME} />);
    expect(container.querySelectorAll("[data-editable-id]")).toHaveLength(0);
  });

  it("wraps scalar fields and each row-cell with data-editable-id when rendered inside an EditModeProvider, leaving columns hardcoded", () => {
    const row = Object.assign(["Test Product XYZ", "9-9 Days", "1-1 Days"], { id: 6 });
    render(
      <EditModeProvider>
        <LeadTimeTable
          leadTime={{
            ...LEAD_TIME,
            rows: [row] as unknown as typeof LEAD_TIME.rows,
          }}
        />
      </EditModeProvider>
    );
    expect(screen.getByText("Lead-Time Framework")).toHaveAttribute(
      "data-editable-id",
      "leadTime.eyebrow"
    );
    expect(screen.getByText("Product & lead-time framework")).toHaveAttribute(
      "data-editable-id",
      "leadTime.title"
    );
    expect(screen.getByText("intro")).toHaveAttribute("data-editable-id", "leadTime.intro");

    // Each of the row's 3 cells gets its own Editable — nested inside the
    // <th>/<td> itself (never a <div>, which is invalid as a direct <tr>
    // child) — but all three share the same row id, so clicking any cell
    // opens the same row's edit modal.
    const productEl = screen.getByText("Test Product XYZ").closest("[data-editable-id]");
    expect(productEl).toHaveAttribute("data-editable-id", "leadTime.rows.6");
    expect(productEl).toHaveAttribute("data-editable-kind", "item");

    const sampleEl = screen.getByText("9-9 Days").closest("[data-editable-id]");
    expect(sampleEl).toHaveAttribute("data-editable-id", "leadTime.rows.6");
    expect(sampleEl).toHaveAttribute("data-editable-kind", "item");

    const productionEl = screen.getByText("1-1 Days").closest("[data-editable-id]");
    expect(productionEl).toHaveAttribute("data-editable-id", "leadTime.rows.6");
    expect(productionEl).toHaveAttribute("data-editable-kind", "item");

    // The hardcoded column headers are never editable.
    expect(screen.getByText("Products / Accessories").closest("[data-editable-id]")).toBeNull();
  });
});

