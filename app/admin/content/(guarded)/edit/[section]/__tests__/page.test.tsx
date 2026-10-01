import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/lib/cpanel-api", () => ({
  getSections: vi.fn().mockResolvedValue({
    hero: { eyebrow: "Premier" },
    site: { name: "Nova SS Trading" },
    divisions: { title: "Divisions" },
    leadTime: { title: "Lead time" },
    footerBlurb: { text: "A leading buying house." },
  }),
  listItems: vi.fn().mockImplementation(async (key: string) => {
    if (key === "hero.stats") return [{ id: 7, fields: { v: "5", l: "Ranges" } }];
    if (key === "divisions.items") return [{ id: 11, fields: { title: "Trims" } }];
    if (key === "leadTime.rows") return [{ id: 22, fields: { product: "Buttons" } }];
    if (key === "nav") return [{ id: 3, fields: { label: "About", href: "#about" } }];
    return [];
  }),
}));

// Stub the client mount so the route test stays focused on data assembly.
vi.mock("../SectionEditorMount", () => ({
  SectionEditorMount: ({
    entry,
    baseline,
    aux,
  }: {
    entry: { key: string };
    baseline: unknown;
    aux: unknown;
  }) => (
    <div data-testid="mount" data-entry={entry.key}>
      <pre data-testid="baseline">{JSON.stringify(baseline)}</pre>
      <pre data-testid="aux">{JSON.stringify(aux)}</pre>
    </div>
  ),
}));

import EditSectionPage from "../page";

function readJson(testId: string) {
  return JSON.parse(screen.getByTestId(testId).textContent as string);
}

describe("edit/[section] route", () => {
  it("renders the registry entry named by the param, with real DB ids on the baseline list items", async () => {
    render(await EditSectionPage({ params: { section: "hero" } }));

    expect(screen.getByTestId("mount")).toHaveAttribute("data-entry", "hero");
    const baseline = readJson("baseline");
    expect(baseline.sections.hero).toEqual({ eyebrow: "Premier" });
    expect(baseline.items["hero.stats"]).toEqual([
      { id: 7, fields: { v: "5", l: "Ranges" } },
    ]);
  });

  it("assembles both sections and both lists for a multi-section entry (Divisions)", async () => {
    render(await EditSectionPage({ params: { section: "divisions" } }));

    const baseline = readJson("baseline");
    expect(Object.keys(baseline.sections)).toEqual(["divisions", "leadTime"]);
    expect(baseline.items["divisions.items"][0].id).toBe(11);
    expect(baseline.items["leadTime.rows"][0].id).toBe(22);
  });

  it("passes site (always) and the nav list (Footer only) as read-only aux", async () => {
    render(await EditSectionPage({ params: { section: "footerBlurb" } }));

    const aux = readJson("aux");
    expect(aux.site).toEqual({ name: "Nova SS Trading" });
    expect(aux.nav).toEqual([{ id: 3, fields: { label: "About", href: "#about" } }]);
  });

  it("does not fetch the nav list for entries that don't render the footer", async () => {
    render(await EditSectionPage({ params: { section: "hero" } }));
    expect(readJson("aux").nav).toEqual([]);
  });

  it("calls notFound() for an unknown section param", async () => {
    await expect(
      EditSectionPage({ params: { section: "does-not-exist" } }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
