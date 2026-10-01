import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Profiles } from "../Profiles";
import { EditModeProvider } from "../admin/EditModeProvider";

const PROFILES = {
  eyebrow: "Test Eyebrow",
  title: "Test Profiles Title",
  intro: "intro",
  documents: [
    { title: "Test Document", body: "Test document body.", href: "/test.pdf" },
  ],
};

describe("Profiles", () => {
  it("renders documents from the profiles prop", () => {
    render(<Profiles profiles={PROFILES} />);
    expect(screen.getByText("Test Document")).toBeInTheDocument();
  });

  it("does not add any data-editable-id attributes when rendered outside an EditModeProvider", () => {
    const { container } = render(<Profiles profiles={PROFILES} />);
    expect(container.querySelectorAll("[data-editable-id]")).toHaveLength(0);
  });

  it("wraps scalar fields and document items (including href) with data-editable-id when rendered inside an EditModeProvider", () => {
    render(
      <EditModeProvider>
        <Profiles
          profiles={{
            ...PROFILES,
            documents: [
              { title: "Test Document", body: "Test document body.", href: "/test.pdf", id: 5 },
            ] as unknown as typeof PROFILES.documents,
          }}
        />
      </EditModeProvider>
    );
    expect(screen.getByText("Test Eyebrow")).toHaveAttribute("data-editable-id", "profiles.eyebrow");
    expect(screen.getByText("Test Profiles Title")).toHaveAttribute(
      "data-editable-id",
      "profiles.title"
    );
    expect(screen.getByText("intro")).toHaveAttribute("data-editable-id", "profiles.intro");

    // Whole document card — including the View PDF / Download links whose
    // href is the registry's kind="document" field — is one item region.
    const titleEl = screen.getByText("Test Document").closest("[data-editable-id]");
    expect(titleEl).toHaveAttribute("data-editable-id", "profiles.documents.5");
    expect(titleEl).toHaveAttribute("data-editable-kind", "item");

    const viewLink = screen.getByRole("link", { name: "View PDF" });
    expect(viewLink.closest("[data-editable-id]")).toHaveAttribute(
      "data-editable-id",
      "profiles.documents.5"
    );
  });
});

