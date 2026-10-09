import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero } from "../Hero";
import { EditModeProvider } from "../admin/EditModeProvider";

const HERO = {
  eyebrow: "Test Eyebrow",
  companyName: "Test Co",
  tagline: "Test tagline",
  body: "Test body",
  primaryCta: { label: "Go", href: "#go" },
  secondaryCta: { label: "Learn", href: "#learn" },
  stats: [{ v: "1", l: "Stat" }],
};

describe("Hero", () => {
  it("renders copy from the hero prop", () => {
    render(<Hero hero={HERO} />);
    expect(screen.getByText("Test Eyebrow")).toBeInTheDocument();
    expect(screen.getByText("Test tagline")).toBeInTheDocument();
  });

  it("does not add any data-editable-id attributes when rendered outside an EditModeProvider", () => {
    const { container } = render(<Hero hero={HERO} />);
    expect(container.querySelectorAll("[data-editable-id]")).toHaveLength(0);
  });

  it("wraps scalar fields and stat items with data-editable-id when rendered inside an EditModeProvider", () => {
    render(
      <EditModeProvider>
        <Hero
          hero={{
            ...HERO,
            stats: [{ v: "1", l: "Stat", id: 42 } as unknown as { v: string; l: string }],
          }}
        />
      </EditModeProvider>
    );
    expect(screen.getByText("Test Eyebrow")).toHaveAttribute("data-editable-id", "hero.eyebrow");
    expect(screen.getByText("Test Co")).toHaveAttribute("data-editable-id", "hero.companyName");
    expect(screen.getByText("Test tagline")).toHaveAttribute("data-editable-id", "hero.tagline");
    expect(screen.getByText("Test body")).toHaveAttribute("data-editable-id", "hero.body");
    expect(screen.getByText("Go")).toHaveAttribute("data-editable-id", "hero.primaryCta.label");
    expect(screen.getByText("Learn")).toHaveAttribute("data-editable-id", "hero.secondaryCta.label");

    const statEl = screen.getByText("1").closest("[data-editable-id]");
    expect(statEl).toHaveAttribute("data-editable-id", "hero.stats.42");
    expect(statEl).toHaveAttribute("data-editable-kind", "item");
  });
});

