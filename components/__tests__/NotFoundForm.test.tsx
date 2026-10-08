import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({ usePathname: () => "/old-page" }));

import { NotFoundForm } from "../NotFoundForm";

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("NotFoundForm", () => {
  it("asks for the missing fields before sending anything", async () => {
    const user = userEvent.setup();
    render(<NotFoundForm email="info@x.com" />);
    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/name, email and a short message/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the report to the contact API with the missing page's address, then thanks the visitor", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    const user = userEvent.setup();
    render(<NotFoundForm email="info@x.com" />);
    await user.type(screen.getByLabelText("Your name"), "Ann");
    await user.type(screen.getByLabelText("Your email"), "ann@buyer.com");
    await user.type(screen.getByLabelText("Message"), "The catalogue link is broken");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/contact");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ name: "Ann", email: "ann@buyer.com", subject: "Broken link / page not found" });
    expect(body.message).toMatch(/^Page not found: \/old-page\n\nThe catalogue link is broken$/);
    expect(await screen.findByRole("status")).toHaveTextContent(/got it/i);
  });

  it("shows the server's message when sending fails", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: "Too many submissions." }) });
    const user = userEvent.setup();
    render(<NotFoundForm email="info@x.com" />);
    await user.type(screen.getByLabelText("Your name"), "Ann");
    await user.type(screen.getByLabelText("Your email"), "ann@buyer.com");
    await user.type(screen.getByLabelText("Message"), "Please help me");
    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Too many submissions.");
  });
});
