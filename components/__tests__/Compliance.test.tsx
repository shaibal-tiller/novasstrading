import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Compliance } from "../Compliance";
import { EditModeProvider } from "../admin/EditModeProvider";

const COMPLIANCE = {
  eyebrow: "Test Eyebrow",
  title: "Test Compliance Title",
  intro: "intro",
  protocolTitle: "Test Protocol",
  protocolBody: ["Test protocol paragraph."],
  checks: [{ title: "Test Check", body: "Test check body." }],
  certifications: [{ name: "Test Cert", detail: "Test detail", src: "logos/test.png" }],
  footnote: "Test footnote.",
};

describe("Compliance", () => {
  it("renders checks and certifications from the compliance prop", () => {
    render(<Compliance compliance={COMPLIANCE} />);
    expect(screen.getByText("Test Check")).toBeInTheDocument();
    expect(screen.getByText("Test Cert")).toBeInTheDocument();
  });

  it("does not add any data-editable-id attributes when rendered outside an EditModeProvider", () => {
    const { container } = render(<Compliance compliance={COMPLIANCE} />);
    expect(container.querySelectorAll("[data-editable-id]")).toHaveLength(0);
  });

  it("wraps scalar fields and protocolBody/checks/certifications items with data-editable-id when rendered inside an EditModeProvider", () => {
    render(
      <EditModeProvider>
        <Compliance
          compliance={{
            ...COMPLIANCE,
            protocolBody: ["Test protocol paragraph."] as unknown as typeof COMPLIANCE.protocolBody,
            checks: [
              { title: "Test Check", body: "Test check body.", id: 3 },
            ] as unknown as typeof COMPLIANCE.checks,
            certifications: [
              { name: "Test Cert", detail: "Test detail", src: "logos/test.png", id: 9 },
            ] as unknown as typeof COMPLIANCE.certifications,
          }}
        />
      </EditModeProvider>
    );
    expect(screen.getByText("Test Eyebrow")).toHaveAttribute("data-editable-id", "compliance.eyebrow");
    expect(screen.getByText("Test Compliance Title")).toHaveAttribute(
      "data-editable-id",
      "compliance.title"
    );
    expect(screen.getByText("intro")).toHaveAttribute("data-editable-id", "compliance.intro");
    expect(screen.getByText("Test Protocol")).toHaveAttribute(
      "data-editable-id",
      "compliance.protocolTitle"
    );
    expect(screen.getByText("Test footnote.")).toHaveAttribute(
      "data-editable-id",
      "compliance.footnote"
    );

    // protocolBody is a bare string list at runtime (no DB id carried through
    // today — see Task 8 brief), so assert the listKey prefix and kind.
    const protocolEl = screen
      .getByText("Test protocol paragraph.")
      .closest("[data-editable-id]");
    expect(protocolEl).toHaveAttribute("data-editable-kind", "item");
    expect(protocolEl?.getAttribute("data-editable-id")).toMatch(/^compliance\.protocolBody\./);

    const checkEl = screen.getByText("Test Check").closest("[data-editable-id]");
    expect(checkEl).toHaveAttribute("data-editable-id", "compliance.checks.3");
    expect(checkEl).toHaveAttribute("data-editable-kind", "item");

    const certEl = screen.getByText("Test Cert").closest("[data-editable-id]");
    expect(certEl).toHaveAttribute("data-editable-id", "compliance.certifications.9");
    expect(certEl).toHaveAttribute("data-editable-kind", "item");
  });
});
