import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SectionForm } from "../SectionForm";

describe("SectionForm", () => {
  it("renders one field per top-level scalar key, pre-filled with its value", () => {
    render(<SectionForm sectionKey="hero" fields={{ eyebrow: "Premier", tagline: "Great fashion" }} onSave={vi.fn()} />);
    expect(screen.getByLabelText("eyebrow")).toHaveValue("Premier");
    expect(screen.getByLabelText("tagline")).toHaveValue("Great fashion");
  });

  it("renders nested object fields as grouped sub-inputs", () => {
    render(
      <SectionForm
        sectionKey="hero"
        fields={{ primaryCta: { label: "Explore", href: "#products" } }}
        onSave={vi.fn()}
      />
    );
    expect(screen.getByLabelText("primaryCta.label")).toHaveValue("Explore");
    expect(screen.getByLabelText("primaryCta.href")).toHaveValue("#products");
  });

  it("calls onSave with the edited flat field map on submit", async () => {
    const onSave = vi.fn();
    render(<SectionForm sectionKey="hero" fields={{ eyebrow: "Premier" }} onSave={onSave} />);
    await userEvent.clear(screen.getByLabelText("eyebrow"));
    await userEvent.type(screen.getByLabelText("eyebrow"), "New eyebrow");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(onSave).toHaveBeenCalledWith({ eyebrow: "New eyebrow" });
  });

  it("renders array-valued fields as a read-only summary and excludes them from onSave", async () => {
    const onSave = vi.fn();
    render(
      <SectionForm
        sectionKey="portfolio.tabs"
        fields={{ label: "Women", photos: [{ src: "a.jpg" }, { src: "b.jpg" }] }}
        onSave={onSave}
      />
    );
    expect(screen.queryByLabelText("photos")).not.toBeInTheDocument();
    expect(screen.getByText(/photos.*2 items.*edit via its own list/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(onSave).toHaveBeenCalledWith({ label: "Women" });
  });
});

