import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditModeContext } from "../EditModeProvider";
import { PortfolioPhotoManager } from "../PortfolioPhotoManager";
import type { SectionDraft } from "../SectionEditor";

function setup() {
  let draft: SectionDraft = {
    sections: {},
    items: {
      "portfolio.tabs": [
        { id: 1, fields: { key: "woman", label: "Women" } },
        { id: 2, fields: { key: "man", label: "Men" } },
      ],
      "portfolio.photos": [
        { id: 10, fields: { tab: "woman", src: "a.jpg", alt: "Women — Dress" } },
        { id: 11, fields: { tab: "woman", src: "b.jpg", alt: "Women — Top", visibility: "hidden" } },
        { id: 12, fields: { tab: "man", src: "c.jpg", alt: "Men — Shirt" } },
      ],
    },
  };
  const setDraft = vi.fn((fn: (p: SectionDraft) => SectionDraft) => {
    draft = fn(draft);
  });
  const setOpenId = vi.fn();
  const value = { hoveredId: null, setHoveredId: vi.fn(), openId: null, setOpenId, draft, setDraft } as never;
  const utils = render(
    <EditModeContext.Provider value={value}>
      <PortfolioPhotoManager />
    </EditModeContext.Provider>,
  );
  return { ...utils, setDraft, setOpenId, getDraft: () => draft };
}

describe("PortfolioPhotoManager", () => {
  it("lists the photos of the active category with counts, and says how many are hidden", () => {
    setup();
    expect(screen.getByRole("tab", { name: /Women \(2\)/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /Men \(1\)/ })).toBeInTheDocument();
    expect(screen.getByText(/2 photos · 1 hidden from the public site/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit Women — Dress" })).toBeInTheDocument();
  });

  it("switches category", async () => {
    setup();
    await userEvent.click(screen.getByRole("tab", { name: /Men/ }));
    expect(screen.getByRole("button", { name: "Edit Men — Shirt" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit Women — Dress" })).toBeNull();
  });

  it("hides a photo, shows a hidden one, and deletes one - all in the draft", async () => {
    const { getDraft } = setup();
    await userEvent.click(screen.getByRole("button", { name: "Hide Women — Dress" }));
    expect(getDraft().items["portfolio.photos"].find((i) => i.id === 10)!.fields.visibility).toBe("hidden");

    await userEvent.click(screen.getByRole("button", { name: "Show Women — Top" }));
    expect(getDraft().items["portfolio.photos"].find((i) => i.id === 11)!.fields.visibility).toBe("shown");

    await userEvent.click(screen.getByRole("button", { name: "Delete Women — Dress" }));
    expect(getDraft().items["portfolio.photos"].map((i) => i.id)).toEqual([11, 12]);
  });

  it("cycles the tile size and opens the edit dialog for a photo", async () => {
    const { getDraft, setOpenId } = setup();
    await userEvent.click(screen.getByRole("button", { name: "Change tile size of Women — Dress" }));
    expect(getDraft().items["portfolio.photos"].find((i) => i.id === 10)!.fields.size).toBe("wide");
    await userEvent.click(screen.getByRole("button", { name: "Edit Women — Dress" }));
    expect(setOpenId).toHaveBeenCalledWith("portfolio.photos.10");
  });

  it("moves a photo to the top without disturbing other categories", async () => {
    const { getDraft } = setup();
    await userEvent.click(screen.getByRole("button", { name: "Move Women — Top to the top" }));
    expect(getDraft().items["portfolio.photos"].map((i) => i.id)).toEqual([11, 10, 12]);
  });
});
