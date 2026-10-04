import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const { getAdminSessionMock, RedirectError } = vi.hoisted(() => {
  class RedirectError extends Error {
    constructor(public href: string) {
      super(`NEXT_REDIRECT ${href}`);
    }
  }
  return { getAdminSessionMock: vi.fn(), RedirectError };
});
vi.mock("@/lib/admin-session", () => ({ getAdminSession: getAdminSessionMock }));

vi.mock("next/navigation", () => ({
  redirect: (href: string) => {
    throw new RedirectError(href);
  },
}));

import AdminHomePage from "../page";

async function redirectOf(): Promise<string | null> {
  try {
    await AdminHomePage();
    return null;
  } catch (err) {
    if (err instanceof RedirectError) return err.href;
    throw err;
  }
}

beforeEach(() => getAdminSessionMock.mockReset());

describe("/admin chooser", () => {
  it("sends signed-out visitors to the login door", async () => {
    getAdminSessionMock.mockResolvedValue(null);
    expect(await redirectOf()).toBe("/admin/login");
  });

  it("goes straight to the only module", async () => {
    getAdminSessionMock.mockResolvedValue({ email: "a@x.com", role: "admin", modules: ["website"] });
    expect(await redirectOf()).toBe("/admin/content");
    getAdminSessionMock.mockResolvedValue({ email: "a@x.com", role: "viewer", modules: ["assets"] });
    expect(await redirectOf()).toBe("/admin/inventory/assets");
  });

  it("shows both modules, Website first, with the signed-in email", async () => {
    getAdminSessionMock.mockResolvedValue({ email: "boss@novasstrading.com", role: "admin", modules: ["assets", "website"] });
    render(await AdminHomePage());

    expect(screen.getByText("boss@novasstrading.com")).toBeInTheDocument();
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual(["/admin/content", "/admin/inventory/assets"]);
    expect(links[0]).toHaveTextContent("Website");
    expect(links[0]).toHaveFocus();
  });

  it("shows a no-access message and a sign-out button when the account has no modules", async () => {
    getAdminSessionMock.mockResolvedValue({ email: "new@novasstrading.com", role: "viewer", modules: [] });
    render(await AdminHomePage());

    expect(screen.getByText(/does not have access/i)).toBeInTheDocument();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });
});
