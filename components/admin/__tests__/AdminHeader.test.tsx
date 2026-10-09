import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminHeader } from "../AdminHeader";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: { alt?: string; src: string }) => <img alt={props.alt} src={props.src} />,
}));

const boss = { email: "it-support@novasstrading.com", role: "admin" as const, modules: ["website", "assets"] as ("website" | "assets")[] };

describe("AdminHeader", () => {
  it("shows only the brand when nobody is signed in", () => {
    render(<AdminHeader session={null} />);
    expect(screen.getByRole("link", { name: /admin home/i })).toHaveAttribute("href", "/admin/login");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("offers a tab for each area the person may open and marks the current one", () => {
    render(<AdminHeader session={boss} active="analytics" />);
    const tabs = screen.getAllByRole("link").filter((l) => l.closest("nav"));
    expect(tabs.map((t) => t.getAttribute("href"))).toEqual([
      "/admin",
      "/admin/content",
      "/admin/analytics",
      "/admin/inventory/assets",
    ]);
    expect(screen.getByRole("link", { name: "Analytics" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Website" })).not.toHaveAttribute("aria-current");
  });

  it("hides the tabs a person has no access to", () => {
    render(<AdminHeader session={{ ...boss, modules: ["assets"] }} active="home" />);
    expect(screen.queryByRole("link", { name: "Website" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Analytics" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Assets" })).toBeInTheDocument();
  });

  it("has a Sign out button next to a profile button that opens the person's details", async () => {
    const user = userEvent.setup();
    render(<AdminHeader session={boss} active="home" />);
    expect(screen.getAllByRole("button", { name: "Sign out" })).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: /profile: it support/i }));
    expect(screen.getByText("it-support@novasstrading.com")).toBeInTheDocument();
    expect(screen.getByText("Administrator")).toBeInTheDocument();
    expect(screen.getByText("Website, Analytics, Assets")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Sign out" })).toHaveLength(2);

    await user.keyboard("{Escape}");
    expect(screen.queryByText("Administrator")).not.toBeInTheDocument();
  });
});
