import { describe, it, expect, vi } from "vitest";
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

  it("wraps scalar fields and tab items with data-editable-id when rendered inside an EditModeProvider — including each portfolio photo tile", () => {
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
                photos: [{ id: 9, src: "products/test.jpg", alt: "Test photo" }],
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

    // Every portfolio photo is its own editable item.
    const photoButton = screen.getByRole("button", { name: /View Test photo full screen/i });
    const photoEl = photoButton.closest("[data-editable-id]");
    expect(photoEl).toHaveAttribute("data-editable-id", "portfolio.photos.9");
    expect(photoEl).toHaveAttribute("data-editable-kind", "item");
  });

  const tabWith = (photos: unknown[]) =>
    ({
      ...PORTFOLIO,
      tabs: [{ key: "t", label: "T", categories: [], photos, id: 1 }] as unknown as typeof PORTFOLIO.tabs,
    }) as typeof PORTFOLIO;

  it("keeps hidden photos off the public site", () => {
    render(
      <Portfolio
        portfolio={tabWith([
          { src: "products/a.jpg", alt: "Shown photo" },
          { src: "products/b.jpg", alt: "Secret photo", visibility: "hidden" },
        ])}
      />
    );
    expect(screen.getByRole("button", { name: /View Shown photo/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /View Secret photo/i })).toBeNull();
  });

  it("shows hidden photos dimmed, with a Hidden tag, in the editor", () => {
    render(
      <EditModeProvider>
        <Portfolio
          portfolio={tabWith([{ id: 1, src: "products/b.jpg", alt: "Secret photo", visibility: "hidden" }])}
        />
      </EditModeProvider>
    );
    const btn = screen.getByRole("button", { name: /View Secret photo/i });
    expect(btn.className).toMatch(/opacity-45/);
    expect(screen.getByText("Hidden")).toBeInTheDocument();
  });

  it("applies tile size, NEW badge and an explicit caption", () => {
    render(
      <Portfolio
        portfolio={tabWith([
          { src: "products/a.jpg", alt: "Cat — Old caption", caption: "October hero", size: "featured", badge: "new" },
        ])}
      />
    );
    const btn = screen.getByRole("button", { name: /View Cat/i });
    expect(btn.className).toMatch(/col-span-2/);
    expect(btn.className).toMatch(/row-span-2/);
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("October hero")).toBeInTheDocument();
    expect(screen.queryByText("Old caption")).toBeNull();
  });

  describe("loading ladder (blur -> thumb -> sharp tile)", () => {
    const photo = [{ src: "products/a.jpg", alt: "Cat — One" }];
    const setConnection = (c: unknown) =>
      Object.defineProperty(navigator, "connection", { value: c, configurable: true });
    const imgs = () => document.querySelectorAll("#portfolio button img");

    it("loads thumb + sharp tile on a normal connection", async () => {
      setConnection({ effectiveType: "4g", saveData: false });
      render(<Portfolio portfolio={tabWith(photo)} />);
      await screen.findByRole("button", { name: /View Cat/i });
      // after hydration the sharp layer is added over the thumb
      await vi.waitFor(() => expect(imgs().length).toBe(2));
    });

    it("keeps to the light thumb only on a slow or data-saving connection", async () => {
      setConnection({ effectiveType: "3g", saveData: false });
      const { unmount } = render(<Portfolio portfolio={tabWith(photo)} />);
      await screen.findByRole("button", { name: /View Cat/i });
      await new Promise((r) => setTimeout(r, 50));
      expect(imgs().length).toBe(1);
      unmount();

      setConnection({ effectiveType: "4g", saveData: true });
      render(<Portfolio portfolio={tabWith(photo)} />);
      await screen.findByRole("button", { name: /View Cat/i });
      await new Promise((r) => setTimeout(r, 50));
      expect(imgs().length).toBe(1);
    });
  });
});
