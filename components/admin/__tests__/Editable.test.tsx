import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Editable } from "../Editable";
import { EditModeContext, type EditModeContextValue } from "../EditModeProvider";

function makeCtx(overrides: Partial<EditModeContextValue> = {}): EditModeContextValue {
  return {
    hoveredId: null,
    setHoveredId: vi.fn(),
    openId: null,
    setOpenId: vi.fn(),
    draft: null,
    setDraft: vi.fn(),
    ...overrides,
  };
}

describe("Editable outside any EditModeProvider", () => {
  it("renders children with zero extra DOM — no wrapping element, no data attributes", () => {
    const { container } = render(<Editable id="hero.tagline" kind="text">Hello world</Editable>);

    // The bare text child, not wrapped in a <span> or any element.
    expect(container.firstChild?.nodeType).toBe(Node.TEXT_NODE);
    expect(container.firstChild?.textContent).toBe("Hello world");
    expect(container.querySelector("span")).toBeNull();
    expect(container.querySelector("[data-editable-id]")).toBeNull();
  });

  it("is a complete no-op even when children is an element", () => {
    const { container } = render(
      <Editable id="hero.tagline" kind="text">
        <strong>Bold</strong>
      </Editable>
    );

    // firstChild should be the <strong> itself, no wrapper around it.
    expect((container.firstChild as HTMLElement).tagName).toBe("STRONG");
    expect(container.querySelectorAll("*")).toHaveLength(1);
  });

  it("clicking does nothing special (no context to call)", () => {
    const outerClick = vi.fn();
    render(
      <div onClick={outerClick}>
        <Editable id="hero.tagline" kind="text">Hello</Editable>
      </div>
    );
    fireEvent.click(screen.getByText("Hello"));
    expect(outerClick).toHaveBeenCalled();
  });
});

describe("Editable inside an EditModeProvider", () => {
  it("renders the Tag with data-editable-id and data-editable-kind attributes", () => {
    const ctx = makeCtx();
    render(
      <EditModeContext.Provider value={ctx}>
        <Editable id="hero.tagline" kind="text">Hello</Editable>
      </EditModeContext.Provider>
    );
    const el = screen.getByText("Hello");
    expect(el.tagName).toBe("SPAN");
    expect(el).toHaveAttribute("data-editable-id", "hero.tagline");
    expect(el).toHaveAttribute("data-editable-kind", "text");
  });

  it("respects a custom `as` tag", () => {
    const ctx = makeCtx();
    render(
      <EditModeContext.Provider value={ctx}>
        <Editable id="hero.tagline" kind="text" as="h1">Hello</Editable>
      </EditModeContext.Provider>
    );
    expect(screen.getByText("Hello").tagName).toBe("H1");
  });

  it("clicking calls setOpenId(id) and does not bubble to a parent click handler", () => {
    const ctx = makeCtx();
    const outerClick = vi.fn();
    render(
      <EditModeContext.Provider value={ctx}>
        <div onClick={outerClick}>
          <Editable id="hero.tagline" kind="text">Hello</Editable>
        </div>
      </EditModeContext.Provider>
    );

    fireEvent.click(screen.getByText("Hello"));

    expect(ctx.setOpenId).toHaveBeenCalledWith("hero.tagline");
    expect(outerClick).not.toHaveBeenCalled();
  });

  it("applies the brass outline highlight class only when hoveredId matches this id", () => {
    const ctx = makeCtx({ hoveredId: "hero.tagline" });
    render(
      <EditModeContext.Provider value={ctx}>
        <Editable id="hero.tagline" kind="text">Hello</Editable>
        <Editable id="hero.other" kind="text">Other</Editable>
      </EditModeContext.Provider>
    );
    expect(screen.getByText("Hello")).toHaveClass("outline-brass");
    expect(screen.getByText("Other")).not.toHaveClass("outline-brass");
  });

  it("merges a passed className with the highlight class", () => {
    const ctx = makeCtx({ hoveredId: "hero.tagline" });
    render(
      <EditModeContext.Provider value={ctx}>
        <Editable id="hero.tagline" kind="text" className="text-lg">Hello</Editable>
      </EditModeContext.Provider>
    );
    const el = screen.getByText("Hello");
    expect(el).toHaveClass("text-lg");
    expect(el).toHaveClass("outline-brass");
  });
});

