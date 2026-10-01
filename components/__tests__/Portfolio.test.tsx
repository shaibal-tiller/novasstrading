import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Portfolio } from "../Portfolio";
import { EditModeProvider } from "../admin/EditModeProvider";

const PORTFOLIO = {
  eyebrow: "Sourcing Portfolio",
  title: "Test title",
  intro: "intro",
  tabs: [
    {
      key: "test-tab",
      label: "Test Tab Label",
      categories: ["Test Category"],
      photos: [{ src: "products/test.jpg", alt: "Test photo" }],
    },
  ],
  extra: { label: "Also covering", items: ["Test Extra"] },
};

describe("Portfolio", () => {
  it("renders the active tab's label from the portfolio prop", () => {
    render(<Portfolio portfolio={PORTFOLIO} />);
    expect(screen.getByText("Test Tab Label")).toBeInTheDocument();
  });

  it("does not add any data-editable-id attributes when rendered outside an EditModeProvider", () => {
    const { container } = render(<Portfolio portfolio={PORTFOLIO} />);
    expect(container.querySelectorAll("[data-editable-id]")).toHaveLength(0);
  });

  it("wraps scalar fields and tab items with data-editable-id when rendered inside an EditModeProvider — but never portfolio.tabs[].photos", () => {
    render(
      <EditModeProvider>
        <Portfolio
          portfolio={{
            ...PORTFOLIO,
            tabs: [
              {
                key: "test-tab",
                label: "Test Tab Label",
                categories: ["Test Category"],
                photos: [{ src: "products/test.jpg", alt: "Test photo" }],
                id: 6,
              },
            ] as unknown as typeof PORTFOLIO.tabs,
          }}
        />
      </EditModeProvider>
    );
    expect(screen.getByText("Sourcing Portfolio")).toHaveAttribute(
      "data-editable-id",
      "portfolio.eyebrow"
    );
    expect(screen.getByText("Test title")).toHaveAttribute("data-editable-id", "portfolio.title");
    expect(screen.getByText("intro")).toHaveAttribute("data-editable-id", "portfolio.intro");
    expect(screen.getByText("Also covering")).toHaveAttribute(
      "data-editable-id",
      "portfolio.extra.label"
    );

    const extraItemEl = screen.getByText("Test Extra").closest("[data-editable-id]");
    expect(extraItemEl).toHaveAttribute("data-editable-id", "portfolio.extra.items");
    expect(extraItemEl).toHaveAttribute("data-editable-kind", "text");

    const tabEl = screen.getByText("Test Tab Label").closest("[data-editable-id]");
    expect(tabEl).toHaveAttribute("data-editable-id", "portfolio.tabs.6");
    expect(tabEl).toHaveAttribute("data-editable-kind", "item");

    // portfolio.tabs[].photos is a deliberate registry gap — never Editable.
    const photoButton = screen.getByRole("button", { name: /View Test photo full screen/i });
    expect(photoButton.closest("[data-editable-id]")).toBeNull();
  });
});

