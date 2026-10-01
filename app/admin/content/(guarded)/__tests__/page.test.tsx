import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ContentPickerPage from "../page";
import { SECTION_REGISTRY } from "@/lib/admin/section-registry";

describe("content section picker", () => {
  it("lists every SECTION_REGISTRY entry with a link to its visual edit route", () => {
    render(<ContentPickerPage />);

    for (const entry of SECTION_REGISTRY) {
      const link = screen.getByRole("link", { name: entry.label });
      expect(link).toHaveAttribute(
        "href",
        `/admin/content/edit/${entry.key}`,
      );
    }
  });

  it("has exactly one row per registry entry", () => {
    render(<ContentPickerPage />);
    expect(screen.getAllByRole("listitem")).toHaveLength(SECTION_REGISTRY.length);
  });

  it("keeps nav links to the media library and trash", () => {
    render(<ContentPickerPage />);
    expect(screen.getByRole("link", { name: /media library/i })).toHaveAttribute(
      "href",
      "/admin/content/media",
    );
    expect(screen.getByRole("link", { name: /trash/i })).toHaveAttribute(
      "href",
      "/admin/content/trash",
    );
  });
});
