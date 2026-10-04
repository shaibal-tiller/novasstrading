import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Footer } from "../Footer";
import { EditModeProvider } from "../admin/EditModeProvider";

const NAV = [{ label: "Test Nav Link", href: "#test" }];

const SITE = {
  name: "Test Co",
  phone: "+000 000-0000",
  phoneHref: "+0000000000",
  whatsapp: "0000000000",
  whatsappUrl: "https://wa.me/0000000000",
  email: "test@example.com",
  address: { full: "Test Address, Test City" },
  social: { linkedin: "https://linkedin.com/company/test" },
};

describe("Footer", () => {
  it("renders the footerBlurb prop, a nav link, and site contact info", () => {
    render(<Footer footerBlurb="Test footer blurb text." nav={NAV} site={SITE} />);
    expect(screen.getByText("Test footer blurb text.")).toBeInTheDocument();
    expect(screen.getByText("Test Nav Link")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("does not add any data-editable-id attributes when rendered outside an EditModeProvider", () => {
    const { container } = render(
      <Footer footerBlurb="Test footer blurb text." nav={NAV} site={SITE} />
    );
    expect(container.querySelectorAll("[data-editable-id]")).toHaveLength(0);
  });

  it("wraps footerBlurb and nav — but not site-sourced content — with data-editable-id when rendered inside an EditModeProvider", () => {
    render(
      <EditModeProvider>
        <Footer
          footerBlurb="Test footer blurb text."
          nav={[{ label: "Test Nav Link", href: "#test", id: 7 } as unknown as { label: string; href: string }]}
          site={SITE}
        />
      </EditModeProvider>
    );
    expect(screen.getByText("Test footer blurb text.")).toHaveAttribute(
      "data-editable-id",
      "footerBlurb.text"
    );

    const navEl = screen.getByText("Test Nav Link");
    expect(navEl).toHaveAttribute("data-editable-id", "nav.7");
    expect(navEl).toHaveAttribute("data-editable-kind", "item");

    // site-sourced content (phone, email, address, social) is never Editable.
    expect(screen.getByText("test@example.com").closest("[data-editable-id]")).toBeNull();
    expect(screen.getByText("+000 000-0000").closest("[data-editable-id]")).toBeNull();
    expect(screen.getByText("Test Address, Test City").closest("[data-editable-id]")).toBeNull();
    expect(
      screen.getByLabelText("Test Co on LinkedIn").closest("[data-editable-id]")
    ).toBeNull();
  });
});

describe("Footer cookie settings link", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    delete window.openCookieSettings;
  });

  it("is absent when analytics is not configured", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "");
    render(<Footer footerBlurb="Blurb" nav={NAV} site={SITE} />);
    expect(screen.queryByRole("button", { name: "Cookie settings" })).toBeNull();
  });

  it("reopens the consent banner when analytics is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST123");
    const open = vi.fn();
    window.openCookieSettings = open;
    render(<Footer footerBlurb="Blurb" nav={NAV} site={SITE} />);
    await userEvent.click(screen.getByRole("button", { name: "Cookie settings" }));
    expect(open).toHaveBeenCalledTimes(1);
  });
});
