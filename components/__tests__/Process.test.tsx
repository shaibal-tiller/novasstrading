import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Process } from "../Process";
import { EditModeProvider } from "../admin/EditModeProvider";

const PROCESS = {
  eyebrow: "How We Work",
  title: "Test title",
  intro: "intro",
  steps: [{ n: "01", icon: "sourcing", title: "Test Step", body: "Test step body." }],
};

describe("Process", () => {
  it("renders steps from the process prop", () => {
    render(<Process process={PROCESS} />);
    expect(screen.getAllByText("Test Step").length).toBeGreaterThan(0);
  });

  it("does not add any data-editable-id attributes when rendered outside an EditModeProvider", () => {
    const { container } = render(<Process process={PROCESS} />);
    expect(container.querySelectorAll("[data-editable-id]")).toHaveLength(0);
  });

  it("wraps scalar fields and step items with data-editable-id when rendered inside an EditModeProvider", () => {
    render(
      <EditModeProvider>
        <Process
          process={{
            ...PROCESS,
            steps: [
              { n: "01", icon: "sourcing", title: "Test Step", body: "Test step body.", id: 3 },
            ] as unknown as typeof PROCESS.steps,
          }}
        />
      </EditModeProvider>
    );
    expect(screen.getByText("How We Work")).toHaveAttribute("data-editable-id", "process.eyebrow");
    expect(screen.getByText("Test title")).toHaveAttribute("data-editable-id", "process.title");
    expect(screen.getByText("intro")).toHaveAttribute("data-editable-id", "process.intro");

    const stepEl = screen.getByText("Test Step").closest("[data-editable-id]");
    expect(stepEl).toHaveAttribute("data-editable-id", "process.steps.3");
    expect(stepEl).toHaveAttribute("data-editable-kind", "item");

    // the desktop flow-connector strip re-echoes step.n decoratively — it is
    // not a second editable region for the same item.
    const connectorBadges = screen.getAllByText("01");
    connectorBadges.forEach((el) => {
      const editableAncestor = el.closest("[data-editable-id]");
      if (editableAncestor?.getAttribute("data-editable-id") !== "process.steps.3") {
        expect(editableAncestor).toBeNull();
      }
    });
  });
});

