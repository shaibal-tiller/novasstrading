import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

const { getAdminSessionMock, RedirectError } = vi.hoisted(() => {
  class RedirectError extends Error {
    constructor(public href: string) {
      super(`NEXT_REDIRECT ${href}`);
    }
  }
  return { getAdminSessionMock: vi.fn(), RedirectError };
});
vi.mock("@/lib/admin-session", () => ({
  getAdminSession: getAdminSessionMock,
  hasModule: (s: { modules: string[] } | null, m: string) => !!s && s.modules.includes(m),
}));
vi.mock("next/navigation", () => ({
  redirect: (href: string) => {
    throw new RedirectError(href);
  },
  useRouter: () => ({ push: vi.fn() }),
}));

import AnalyticsPage from "../page";
import AnalyticsLayout from "../layout";

async function redirectOf(run: () => Promise<unknown>): Promise<string | null> {
  try {
    await run();
    return null;
  } catch (err) {
    if (err instanceof RedirectError) return err.href;
    throw err;
  }
}

const fetchMock = vi.fn();

beforeEach(() => {
  getAdminSessionMock.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  for (const name of ["GOOGLE_SERVICE_ACCOUNT_JSON", "GA4_PROPERTY_ID", "GSC_SITE_URL", "GA4_HOSTNAME"]) vi.stubEnv(name, "");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("/admin/analytics access", () => {
  it("sends signed-out visitors to the sign-in door, coming back here afterwards", async () => {
    getAdminSessionMock.mockResolvedValue(null);
    expect(await redirectOf(() => AnalyticsPage({ searchParams: {} }))).toBe("/admin/login?next=%2Fadmin%2Fanalytics");
    expect(await redirectOf(() => AnalyticsLayout({ children: null }))).toBe("/admin/login?next=%2Fadmin%2Fanalytics");
  });

  it("sends users without the website module back to /admin", async () => {
    getAdminSessionMock.mockResolvedValue({ email: "a@x.com", role: "viewer", modules: ["assets"] });
    expect(await redirectOf(() => AnalyticsPage({ searchParams: {} }))).toBe("/admin");
    expect(await redirectOf(() => AnalyticsLayout({ children: null }))).toBe("/admin");
  });

  it("shows the shared header (Dashboard tab + Sign out) to website users", async () => {
    getAdminSessionMock.mockResolvedValue({ email: "boss@novasstrading.com", role: "admin", modules: ["website"] });
    render(await AnalyticsLayout({ children: <p>inside</p> }));
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/admin");
    expect(screen.getByRole("link", { name: "Analytics" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(screen.getByText("inside")).toBeInTheDocument();
  });
});

describe("/admin/analytics without Google configured", () => {
  it("lists exactly the missing env values, calls nobody, and still offers the range switcher", async () => {
    getAdminSessionMock.mockResolvedValue({ email: "boss@novasstrading.com", role: "admin", modules: ["website"] });
    render(await AnalyticsPage({ searchParams: { range: "7" } }));

    expect(screen.getByRole("heading", { name: "Not connected yet" })).toBeInTheDocument();
    for (const name of ["GOOGLE_SERVICE_ACCOUNT_JSON", "GA4_PROPERTY_ID", "GSC_SITE_URL"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    expect(screen.getByText(/Last 7 complete days/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "7 days" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "90 days" })).toHaveAttribute("href", "/admin/analytics?range=90");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("lists only what is still missing", async () => {
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_JSON", "not json");
    vi.stubEnv("GA4_PROPERTY_ID", "123");
    getAdminSessionMock.mockResolvedValue({ email: "boss@novasstrading.com", role: "admin", modules: ["website"] });
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(await AnalyticsPage({ searchParams: {} }));

    expect(screen.getByText("GSC_SITE_URL")).toBeInTheDocument();
    expect(screen.queryByText("GA4_PROPERTY_ID")).toBeNull();
    // the GA4 values are present but the key is malformed → one clear error, not a crash
    expect(screen.getByRole("alert")).toHaveTextContent(/GOOGLE_SERVICE_ACCOUNT_JSON could not be read/);
  });
});
