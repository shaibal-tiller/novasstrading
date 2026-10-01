import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductRange } from "../ProductRange";
import { EditModeProvider } from "../admin/EditModeProvider";

const PRODUCTS = {
  eyebrow: "Range",
  title: "Test ranges",
  intro: "intro",
  items: [{ title: "Test Range Item", body: "body", image: "x.jpg", alt: "alt" }],
};

describe("ProductRange", () => {
  it("renders items from the products prop", () => {
    render(<ProductRange products={PRODUCTS} />);
    expect(screen.getAllByText("Test Range Item").length).toBeGreaterThan(0);
  });

  it("does not add any data-editable-id attributes when rendered outside an EditModeProvider", () => {
    const { container } = render(<ProductRange products={PRODUCTS} />);
    expect(container.querySelectorAll("[data-editable-id]")).toHaveLength(0);
  });

  it("wraps scalar fields and product items with data-editable-id when rendered inside an EditModeProvider", () => {
    render(
      <EditModeProvider>
        <ProductRange
          products={{
            ...PRODUCTS,
            items: [
              { title: "Test Range Item", body: "body", image: "x.jpg", alt: "alt", id: 4 },
            ] as unknown as typeof PRODUCTS.items,
          }}
        />
      </EditModeProvider>
    );
    expect(screen.getByText("Range")).toHaveAttribute("data-editable-id", "products.eyebrow");
    expect(screen.getByText("Test ranges")).toHaveAttribute("data-editable-id", "products.title");
    expect(screen.getByText("intro")).toHaveAttribute("data-editable-id", "products.intro");

    const itemEls = screen.getAllByText("Test Range Item");
    itemEls.forEach((el) => {
      const item = el.closest("[data-editable-id]");
      expect(item).toHaveAttribute("data-editable-id", "products.items.4");
      expect(item).toHaveAttribute("data-editable-kind", "item");
    });
  });
});

