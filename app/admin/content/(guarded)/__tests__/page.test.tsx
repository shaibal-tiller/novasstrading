import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ContentPickerPage from "../page";
import { SECTION_REGISTRY } from "@/lib/admin/section-registry";
import { SECTION_INFO } from "@/lib/admin/section-info";

const TOOL_CARDS = 3; // Portfolio photos, Media library, Trash

describe("content section picker", () => {
  it("shows a card for every SECTION_REGISTRY entry, linking to its visual edit route", () => {
    render(<ContentPickerPage />);

    for (const entry of SECTION_REGISTRY) {
      const heading = screen.getByRole("heading", { level: 3, name: entry.label });
      expect(heading.closest("a")).toHaveAttribute("href", `/admin/content/edit/${entry.key}`);
    }
  });

  it("has exactly one card per registry entry, plus the three tool cards", () => {
    render(<ContentPickerPage />);
    expect(screen.getAllByRole("listitem")).toHaveLength(SECTION_REGISTRY.length + TOOL_CARDS);
  });

  it("describes every registry section in plain words", () => {
    for (const entry of SECTION_REGISTRY) {
      expect(SECTION_INFO[entry.key]?.description, `no description for "${entry.key}"`).toBeTruthy();
    }
  });

  it("numbers the page sections in page order and leaves the site-wide settings unnumbered", () => {
    render(<ContentPickerPage />);
    expect(screen.getByRole("heading", { level: 3, name: "Hero" }).closest("a")).toHaveTextContent("01");
    expect(screen.getByRole("heading", { level: 3, name: "Site Info" }).closest("a")).not.toHaveTextContent(/\b\d{2}\b/);
  });

  it("puts the portfolio photo manager first, then the media library and trash", () => {
    render(<ContentPickerPage />);
    expect(screen.getByRole("link", { name: /portfolio photos/i })).toHaveAttribute("href", "/admin/content/edit/portfolio");
    expect(screen.getByRole("link", { name: /media library/i })).toHaveAttribute("href", "/admin/content/media");
    expect(screen.getByRole("link", { name: /^trash/i })).toHaveAttribute("href", "/admin/content/trash");
  });
});
