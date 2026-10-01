import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock server-only for testing
vi.mock("server-only", () => ({}));

// jsdom doesn't implement matchMedia — components like Reveal use it to
// respect prefers-reduced-motion. Default to "no match" (motion allowed).
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// jsdom doesn't implement IntersectionObserver either — Reveal uses it to
// trigger its fade-in on scroll. A no-op stub is enough for render tests.
if (typeof window !== "undefined" && !("IntersectionObserver" in window)) {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds: ReadonlyArray<number> = [];
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
  }
  // @ts-expect-error — partial stub, sufficient for jsdom test rendering.
  window.IntersectionObserver = MockIntersectionObserver;
  // @ts-expect-error — same stub, for code that references the global directly.
  global.IntersectionObserver = MockIntersectionObserver;
}

// jsdom doesn't implement ResizeObserver — Portfolio uses it to measure the
// live grid's row height. A no-op stub is enough for render tests.
if (typeof window !== "undefined" && !("ResizeObserver" in window)) {
  class MockResizeObserver implements ResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  // @ts-expect-error — partial stub, sufficient for jsdom test rendering.
  window.ResizeObserver = MockResizeObserver;
  // @ts-expect-error — same stub, for code that references the global directly.
  global.ResizeObserver = MockResizeObserver;
}

