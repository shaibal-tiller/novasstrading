import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CoreValues } from "../CoreValues";
import { EditModeProvider } from "../admin/EditModeProvider";

const CORE_VALUES = {
  eyebrow: "Compass",
  title: "Core business values",
  intro: "intro",
  values: [
    { title: "Integrity", body: "Honesty in every dealing." },
    { title: "Quality", body: "Superior products." },
  ],
};

describe("CoreValues", () => {
  it("renders values from the coreValues prop", () => {
    render(<CoreValues coreValues={CORE_VALUES} />);
    expect(screen.getAllByText("Integrity").length).toBeGreaterThan(0);
  });

  it("does not add any data-editable-id attributes when rendered outside an EditModeProvider", () => {
    const { container } = render(<CoreValues coreValues={CORE_VALUES} />);
    expect(container.querySelectorAll("[data-editable-id]")).toHaveLength(0);
  });

  it("wraps scalar fields and value items with data-editable-id when rendered inside an EditModeProvider", () => {
    render(
      <EditModeProvider>
        <CoreValues
          coreValues={{
            ...CORE_VALUES,
            values: [
              { title: "Integrity", body: "Honesty in every dealing.", id: 5 },
              { title: "Quality", body: "Superior products.", id: 9 },
            ] as unknown as typeof CORE_VALUES.values,
          }}
        />
      </EditModeProvider>
    );
    expect(screen.getByText("Compass")).toHaveAttribute("data-editable-id", "coreValues.eyebrow");
    expect(screen.getByText("Core business values")).toHaveAttribute(
      "data-editable-id",
      "coreValues.title"
    );
    expect(screen.getByText("intro")).toHaveAttribute("data-editable-id", "coreValues.intro");

    const integrityEls = screen.getAllByText("Integrity");
    integrityEls.forEach((el) => {
      const item = el.closest("[data-editable-id]");
      expect(item).toHaveAttribute("data-editable-id", "coreValues.values.5");
      expect(item).toHaveAttribute("data-editable-kind", "item");
    });
  });
});

