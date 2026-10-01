import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { About } from "../About";
import { EditModeProvider } from "../admin/EditModeProvider";

const ABOUT = {
  eyebrow: "Test Eyebrow",
  title: "Test Title",
  body: ["First paragraph."],
  highlights: ["Highlight one"],
  mission: { title: "Our Mission", body: "Mission body." },
  vision: { title: "Our Vision", body: "Vision body." },
};

describe("About", () => {
  it("renders copy from the about prop", () => {
    render(<About about={ABOUT} />);
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Highlight one")).toBeInTheDocument();
  });

  it("does not add any data-editable-id attributes when rendered outside an EditModeProvider", () => {
    const { container } = render(<About about={ABOUT} />);
    expect(container.querySelectorAll("[data-editable-id]")).toHaveLength(0);
  });

  it("wraps scalar fields and list items with data-editable-id when rendered inside an EditModeProvider", () => {
    render(
      <EditModeProvider>
        <About about={ABOUT} />
      </EditModeProvider>
    );
    expect(screen.getByText("Test Eyebrow")).toHaveAttribute("data-editable-id", "about.eyebrow");
    expect(screen.getByText("Test Title")).toHaveAttribute("data-editable-id", "about.title");
    expect(screen.getAllByText("Our Mission")[0]).toHaveAttribute(
      "data-editable-id",
      "about.mission.title"
    );
    expect(screen.getAllByText("Mission body.")[0]).toHaveAttribute(
      "data-editable-id",
      "about.mission.body"
    );
    expect(screen.getAllByText("Our Vision")[0]).toHaveAttribute(
      "data-editable-id",
      "about.vision.title"
    );
    expect(screen.getByText("Vision body.")).toHaveAttribute("data-editable-id", "about.vision.body");

    // about.body/about.highlights items are plain strings at runtime (no DB
    // id carried through today — see Task 8 brief), so the item id is always
    // "<listKey>.undefined" here; assert the listKey prefix and kind instead.
    const highlightEl = screen.getByText("Highlight one").closest("[data-editable-id]");
    expect(highlightEl).toHaveAttribute("data-editable-kind", "item");
    expect(highlightEl?.getAttribute("data-editable-id")).toMatch(/^about\.highlights\./);

    const bodyEl = screen.getAllByText("First paragraph.")[0].closest("[data-editable-id]");
    expect(bodyEl).toHaveAttribute("data-editable-kind", "item");
    expect(bodyEl?.getAttribute("data-editable-id")).toMatch(/^about\.body\./);
  });
});

