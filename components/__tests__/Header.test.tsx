import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "../Header";
import { EditModeProvider } from "../admin/EditModeProvider";

const SITE = {
  name: "Nova SS Trading",
  legalName: "Nova SS Trading",
  tagline: "Garments Buying House",
  url: "https://www.novasstrading.com",
  description: "desc",
  email: "info@novasstrading.com",
  phone: "+880 1351-153898",
  phoneHref: "+8801351153898",
  whatsapp: "8801351153898",
  whatsappUrl: "https://wa.me/8801351153898",
  address: {
    street: "Road #5",
    city: "Dhaka",
    postalCode: "1206",
    country: "Bangladesh",
    full: "Dhaka, Bangladesh",
    mapUrl: "https://maps.example.com",
  },
  social: { linkedin: "https://linkedin.com/company/nova-ss-trading" },
};

describe("Header", () => {
  it("renders nav links from the nav prop and the site name from the site prop", () => {
    render(<Header nav={[{ label: "About", href: "#about" }]} site={SITE} />);
    expect(screen.getAllByText("About").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Nova SS Trading home")).toBeInTheDocument();
  });

  it("does not add any data-editable-id attributes when rendered outside an EditModeProvider", () => {
    const { container } = render(
      <Header nav={[{ label: "About", href: "#about" }]} site={SITE} />
    );
    expect(container.querySelectorAll("[data-editable-id]")).toHaveLength(0);
  });

  it("wraps nav items — but not site-sourced content — with data-editable-id when rendered inside an EditModeProvider", () => {
    render(
      <EditModeProvider>
        <Header
          nav={[{ label: "About", href: "#about", id: 7 } as unknown as { label: string; href: string }]}
          site={SITE}
        />
      </EditModeProvider>
    );
    const navEls = screen.getAllByText("About");
    expect(navEls.length).toBeGreaterThan(0);
    navEls.forEach((el) => {
      expect(el).toHaveAttribute("data-editable-id", "nav.7");
      expect(el).toHaveAttribute("data-editable-kind", "item");
    });

    // site-sourced content (e.g. the logo's aria-label) is never Editable.
    const homeLink = screen.getByLabelText("Nova SS Trading home");
    expect(homeLink.closest("[data-editable-id]")).toBeNull();
  });
});

