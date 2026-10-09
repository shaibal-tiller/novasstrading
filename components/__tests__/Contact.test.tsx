import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Contact } from "../Contact";
import { EditModeProvider } from "../admin/EditModeProvider";

const CONTACT = {
  eyebrow: "Test Eyebrow",
  title: "Test Contact Title",
  intro: "intro",
  cards: [{ label: "Test Call Us", value: "+000...", href: "tel:+000" }],
  subjects: ["Test Inquiry"],
};

const SITE = {
  email: "test@example.com",
  address: { mapUrl: "https://maps.example.com/test-office" },
};

describe("Contact", () => {
  it("renders cards from the contact prop and the office map link from the site prop", () => {
    render(<Contact contact={CONTACT} site={SITE} />);
    expect(screen.getByText("Test Call Us")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open office location/i })).toHaveAttribute(
      "href",
      "https://maps.example.com/test-office",
    );
  });

  it("does not add any data-editable-id attributes when rendered outside an EditModeProvider", () => {
    const { container } = render(<Contact contact={CONTACT} site={SITE} />);
    expect(container.querySelectorAll("[data-editable-id]")).toHaveLength(0);
  });

  it("wraps scalar fields and cards — but not site-sourced content — with data-editable-id when rendered inside an EditModeProvider", () => {
    render(
      <EditModeProvider>
        <Contact
          contact={{
            ...CONTACT,
            cards: [
              { label: "Test Call Us", value: "+000...", href: "tel:+000", id: 13 },
            ] as unknown as typeof CONTACT.cards,
          }}
          site={SITE}
        />
      </EditModeProvider>
    );
    expect(screen.getByText("Test Eyebrow")).toHaveAttribute("data-editable-id", "contact.eyebrow");
    expect(screen.getByText("Test Contact Title")).toHaveAttribute(
      "data-editable-id",
      "contact.title"
    );
    expect(screen.getByText("intro")).toHaveAttribute("data-editable-id", "contact.intro");

    const cardEl = screen.getByText("Test Call Us").closest("[data-editable-id]");
    expect(cardEl).toHaveAttribute("data-editable-id", "contact.cards.13");
    expect(cardEl).toHaveAttribute("data-editable-kind", "item");

    // site-sourced content (the Open Map link, driven by site.address.mapUrl)
    // is never Editable.
    const mapLink = screen.getByRole("link", { name: /open office location/i });
    expect(mapLink.closest("[data-editable-id]")).toBeNull();
  });
});

describe("Contact form analytics event", () => {
  afterEach(() => {
    delete window.gtag;
    vi.unstubAllGlobals();
  });

  function stubSuccessfulSubmit() {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) }),
    );
  }

  it("fires gtag('event', 'contact_form_submit') after a successful submission when gtag is on the page", async () => {
    stubSuccessfulSubmit();
    const gtag = vi.fn();
    window.gtag = gtag;
    render(<Contact contact={CONTACT} site={SITE} />);

    await userEvent.click(screen.getByRole("button", { name: "Submit inquiry" }));
    expect(await screen.findByText("Inquiry received")).toBeInTheDocument();
    expect(gtag).toHaveBeenCalledWith("event", "contact_form_submit");
  });

  it("submits normally without gtag (analytics not configured or declined)", async () => {
    stubSuccessfulSubmit();
    render(<Contact contact={CONTACT} site={SITE} />);
    await userEvent.click(screen.getByRole("button", { name: "Submit inquiry" }));
    expect(await screen.findByText("Inquiry received")).toBeInTheDocument();
  });

  it("does not fire the event when the submission fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ ok: false, error: "Bad input" }) }),
    );
    const gtag = vi.fn();
    window.gtag = gtag;
    render(<Contact contact={CONTACT} site={SITE} />);
    await userEvent.click(screen.getByRole("button", { name: "Submit inquiry" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Bad input");
    expect(gtag).not.toHaveBeenCalled();
  });
});
