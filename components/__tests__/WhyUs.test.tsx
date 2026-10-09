import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WhyUs } from "../WhyUs";
import { EditModeProvider } from "../admin/EditModeProvider";

const WHY_US = {
  eyebrow: "Why Choose Us",
  title: "Reliable sourcing",
  intro: "intro",
  reasons: [{ title: "Trusted Network", body: "Strong partnerships." }],
};

describe("WhyUs", () => {
  it("renders reasons from the whyUs prop", () => {
    render(<WhyUs whyUs={WHY_US} />);
    expect(screen.getByText("Trusted Network")).toBeInTheDocument();
  });

  it("does not add any data-editable-id attributes when rendered outside an EditModeProvider", () => {
    const { container } = render(<WhyUs whyUs={WHY_US} />);
    expect(container.querySelectorAll("[data-editable-id]")).toHaveLength(0);
  });

  it("wraps scalar fields and reason items with data-editable-id when rendered inside an EditModeProvider", () => {
    render(
      <EditModeProvider>
        <WhyUs
          whyUs={{
            ...WHY_US,
            reasons: [
              { title: "Trusted Network", body: "Strong partnerships.", id: 3 },
            ] as unknown as typeof WHY_US.reasons,
          }}
        />
      </EditModeProvider>
    );
    expect(screen.getByText("Why Choose Us")).toHaveAttribute("data-editable-id", "whyUs.eyebrow");
    expect(screen.getByText("Reliable sourcing")).toHaveAttribute("data-editable-id", "whyUs.title");
    expect(screen.getByText("intro")).toHaveAttribute("data-editable-id", "whyUs.intro");

    const reasonEl = screen.getByText("Trusted Network").closest("[data-editable-id]");
    expect(reasonEl).toHaveAttribute("data-editable-id", "whyUs.reasons.3");
    expect(reasonEl).toHaveAttribute("data-editable-kind", "item");
  });
});

