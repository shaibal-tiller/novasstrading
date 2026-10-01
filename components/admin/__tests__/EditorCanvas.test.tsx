import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EditorCanvas } from "../EditorCanvas";
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

describe("EditorCanvas", () => {
  it("calls setHoveredId with the id when the cursor moves over an editable element", () => {
    const ctx = makeCtx();
    render(
      <EditModeContext.Provider value={ctx}>
        <EditorCanvas labelLookup={() => undefined}>
          <div data-editable-id="hero.tagline">Hi</div>
          <div data-testid="blank">not editable</div>
        </EditorCanvas>
      </EditModeContext.Provider>
    );

    fireEvent.mouseMove(screen.getByText("Hi"));
    expect(ctx.setHoveredId).toHaveBeenCalledWith("hero.tagline");
  });

  it("calls setHoveredId with the ancestor's id when the cursor is over a nested child", () => {
    const ctx = makeCtx();
    render(
      <EditModeContext.Provider value={ctx}>
        <EditorCanvas labelLookup={() => undefined}>
          <div data-editable-id="hero.tagline">
            <em data-testid="nested">Hi</em>
          </div>
        </EditorCanvas>
      </EditModeContext.Provider>
    );

    fireEvent.mouseMove(screen.getByTestId("nested"));
    expect(ctx.setHoveredId).toHaveBeenCalledWith("hero.tagline");
  });

  it("clears hoveredId back to null when the cursor moves off any editable element", () => {
    const ctx = makeCtx({ hoveredId: "hero.tagline" });
    render(
      <EditModeContext.Provider value={ctx}>
        <EditorCanvas labelLookup={() => undefined}>
          <div data-editable-id="hero.tagline">Hi</div>
          <div data-testid="blank">not editable</div>
        </EditorCanvas>
      </EditModeContext.Provider>
    );

    fireEvent.mouseMove(screen.getByTestId("blank"));
    expect(ctx.setHoveredId).toHaveBeenCalledWith(null);
  });

  it("renders a floating label with the hovered id's human-readable name", () => {
    const ctx = makeCtx({ hoveredId: "hero.tagline" });
    render(
      <EditModeContext.Provider value={ctx}>
        <EditorCanvas labelLookup={(id) => (id === "hero.tagline" ? "Hero Tagline" : undefined)}>
          <div data-editable-id="hero.tagline">Hi</div>
        </EditorCanvas>
      </EditModeContext.Provider>
    );

    expect(screen.getByText("Hero Tagline")).toBeInTheDocument();
  });

  it("renders no floating label when nothing is hovered", () => {
    const ctx = makeCtx({ hoveredId: null });
    render(
      <EditModeContext.Provider value={ctx}>
        <EditorCanvas labelLookup={() => "Should not show"}>
          <div>content</div>
        </EditorCanvas>
      </EditModeContext.Provider>
    );

    expect(screen.queryByText("Should not show")).not.toBeInTheDocument();
  });

  it("does not throw and renders children when used outside an EditModeProvider", () => {
    render(
      <EditorCanvas labelLookup={() => "n/a"}>
        <div data-editable-id="hero.tagline">Hi</div>
      </EditorCanvas>
    );
    expect(() => fireEvent.mouseMove(screen.getByText("Hi"))).not.toThrow();
    expect(screen.getByText("Hi")).toBeInTheDocument();
  });
});

