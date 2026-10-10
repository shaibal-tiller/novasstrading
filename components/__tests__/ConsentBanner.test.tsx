import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { pathnameMock } = vi.hoisted(() => ({ pathnameMock: vi.fn(() => "/") }));
vi.mock("next/navigation", () => ({ usePathname: pathnameMock }));
// Stand-in for next/script so the test can see whether gtag.js would be requested.
vi.mock("next/script", () => ({
  default: (props: { id?: string; src?: string; strategy?: string }) => (
    // eslint-disable-next-line @next/next/no-sync-scripts -- test double for next/script, never shipped
    <script data-testid="next-script" id={props.id} src={props.src} data-strategy={props.strategy} />
  ),
}));

import { ConsentBanner } from "../ConsentBanner";
import { CookieSettingsLink } from "../CookieSettingsLink";

const ID = "G-TEST123";

function gtagScript() {
  return document.querySelector('script[src*="googletagmanager.com/gtag/js"]');
}

/** dataLayer holds `arguments` objects; turn them into arrays to compare. */
function queued(): unknown[][] {
  return (window.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>));
}

/** What /api/region answers for the visitor; `null` makes the request fail. */
function region(answer: boolean | null) {
  const fetchMock = vi.fn(async () => {
    if (answer === null) throw new Error("offline");
    return { ok: true, json: async () => ({ consentRequired: answer }) } as Response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  region(true);
  window.localStorage.clear();
  delete window.dataLayer;
  delete window.gtag;
  delete window.openCookieSettings;
  pathnameMock.mockReturnValue("/");
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("ConsentBanner", () => {
  it("renders nothing and queues nothing without a measurement ID", () => {
    const { container } = render(<ConsentBanner />);
    expect(container).toBeEmptyDOMElement();
    expect(gtagScript()).toBeNull();
    expect(window.dataLayer).toBeUndefined();
    expect(window.gtag).toBeUndefined();
  });

  it("shows the bar to an undecided visitor, with Consent Mode defaults denied and no Google request", async () => {
    render(<ConsentBanner measurementId={ID} />);

    expect(await screen.findByRole("region", { name: "Cookie consent" })).toHaveTextContent(
      "We use analytics cookies to understand how visitors use this site.",
    );
    expect(screen.getByRole("button", { name: "Accept" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Decline" })).toBeInTheDocument();
    expect(queued()).toEqual([
      [
        "consent",
        "default",
        { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied" },
      ],
    ]);
    expect(gtagScript()).toBeNull();
  });

  it("Accept stores \"granted\", grants analytics storage and loads gtag.js", async () => {
    render(<ConsentBanner measurementId={ID} />);
    await userEvent.click(await screen.findByRole("button", { name: "Accept" }));

    expect(window.localStorage.getItem("nova_consent")).toBe("granted");
    expect(gtagScript()).toHaveAttribute("src", `https://www.googletagmanager.com/gtag/js?id=${ID}`);
    expect(gtagScript()).toHaveAttribute("data-strategy", "afterInteractive");
    const commands = queued();
    expect(commands[0].slice(0, 2)).toEqual(["consent", "default"]);
    expect(commands).toContainEqual(["consent", "update", { analytics_storage: "granted" }]);
    expect(commands).toContainEqual(["config", ID]);
    expect(screen.queryByRole("region", { name: "Cookie consent" })).toBeNull();
  });

  it("Decline stores \"denied\" and never loads gtag.js", async () => {
    render(<ConsentBanner measurementId={ID} />);
    await userEvent.click(await screen.findByRole("button", { name: "Decline" }));

    expect(window.localStorage.getItem("nova_consent")).toBe("denied");
    expect(gtagScript()).toBeNull();
    expect(queued().some((c) => c[0] === "config")).toBe(false);
    expect(screen.queryByRole("region", { name: "Cookie consent" })).toBeNull();
  });

  it("counts a visitor from a country with no opt-in rule, without a bar, and saves nothing", async () => {
    region(false);
    render(<ConsentBanner measurementId={ID} />);
    await vi.waitFor(() => expect(gtagScript()).not.toBeNull());
    expect(screen.queryByRole("region", { name: "Cookie consent" })).toBeNull();
    expect(queued()).toContainEqual(["config", ID]);
    expect(window.localStorage.getItem("nova_consent")).toBeNull();
  });

  it("asks when the country cannot be determined", async () => {
    region(null);
    render(<ConsentBanner measurementId={ID} />);
    expect(await screen.findByRole("region", { name: "Cookie consent" })).toBeInTheDocument();
    expect(gtagScript()).toBeNull();
  });

  it("a saved Decline wins even where no opt-in is required", () => {
    const fetchMock = region(false);
    window.localStorage.setItem("nova_consent", "denied");
    render(<ConsentBanner measurementId={ID} />);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(gtagScript()).toBeNull();
  });

  it("remembers an earlier Accept: no bar, gtag.js loads straight away", () => {
    window.localStorage.setItem("nova_consent", "granted");
    render(<ConsentBanner measurementId={ID} />);
    expect(screen.queryByRole("region", { name: "Cookie consent" })).toBeNull();
    expect(gtagScript()).not.toBeNull();
  });

  it("remembers an earlier Decline, and Cookie settings reopens the bar", async () => {
    window.localStorage.setItem("nova_consent", "denied");
    render(
      <>
        <ConsentBanner measurementId={ID} />
        <CookieSettingsLink />
      </>,
    );
    expect(screen.queryByRole("region", { name: "Cookie consent" })).toBeNull();
    expect(gtagScript()).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Cookie settings" }));
    expect(screen.getByRole("region", { name: "Cookie consent" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Decline" })).toHaveFocus();

    act(() => window.openCookieSettings?.());
    await userEvent.click(screen.getByRole("button", { name: "Accept" }));
    expect(window.localStorage.getItem("nova_consent")).toBe("granted");
    expect(gtagScript()).not.toBeNull();
  });

  it("still works when localStorage is unavailable", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    render(<ConsentBanner measurementId={ID} />);
    await userEvent.click(await screen.findByRole("button", { name: "Accept" }));
    expect(gtagScript()).not.toBeNull();
  });

  it("stays off the admin area", () => {
    pathnameMock.mockReturnValue("/admin/analytics");
    const { container } = render(<ConsentBanner measurementId={ID} />);
    expect(container).toBeEmptyDOMElement();
    expect(window.dataLayer).toBeUndefined();
  });
});
