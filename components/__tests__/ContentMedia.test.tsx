import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContentMedia } from "../ContentMedia";

describe("ContentMedia", () => {
  const originalEnv = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL = originalEnv;
  });

  describe("uploaded media resolution", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_MEDIA_BASE_URL = "https://content-api.example.com";
    });

    it("resolves media/ prefixed src against NEXT_PUBLIC_MEDIA_BASE_URL", () => {
      const { container } = render(
        <ContentMedia
          src="media/abc123.webp"
          alt="Uploaded media"
          kind="image"
        />
      );
      const img = container.querySelector("img");
      // Next.js Image component transforms URLs through _next/image, so check the url parameter
      expect(img?.src).toMatch(/url=https%3A%2F%2Fcontent-api\.example\.com%2Fmedia%2Fabc123\.webp/);
    });
  });

  describe("local asset resolution", () => {
    it("resolves non-media/ src against /assets/ (regression check)", () => {
      const { container } = render(
        <ContentMedia
          src="products/categories/kidswear-1.jpg"
          alt="Local asset"
          kind="image"
        />
      );
      const img = container.querySelector("img");
      // Check that it still uses the /assets/ path
      expect(img?.src).toMatch(/url=%2Fassets%2Fproducts%2Fcategories%2Fkidswear-1\.jpg/);
    });

    it("defaults .png extension for bare filenames", () => {
      const { container } = render(
        <ContentMedia
          src="logo"
          alt="Logo"
          kind="logo"
        />
      );
      const img = container.querySelector("img");
      expect(img?.src).toMatch(/url=%2Fassets%2Flogo\.png/);
    });
  });
});

