// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import sharp from "sharp";

const createMediaMock = vi.fn().mockResolvedValue(42);
vi.mock("@/lib/cpanel-api", () => ({ createMedia: createMediaMock }));

const uploadFileMock = vi.fn().mockResolvedValue("media/1700000000-photo.webp");
vi.mock("@/lib/cpanel-media-upload", () => ({ uploadFileToCpanel: uploadFileMock }));

vi.mock("next/headers", () => ({ cookies: () => ({ get: () => ({ value: "signed-cookie" }) }) }));
vi.mock("@/lib/session", () => ({ verifySessionCookie: () => "cpanel-token" }));

beforeEach(() => {
  createMediaMock.mockClear();
  uploadFileMock.mockClear();
});

describe("POST /admin/content/media/upload", () => {
  it("re-encodes the image to WebP, uploads it, and records metadata", async () => {
    const { POST } = await import("../route");
    const original = await sharp({ create: { width: 2000, height: 1500, channels: 3, background: "red" } })
      .jpeg()
      .toBuffer();

    const form = new FormData();
    form.set("file", new File([original], "big.jpg", { type: "image/jpeg" }));
    const request = new Request("http://localhost/admin/content/media/upload", { method: "POST", body: form });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({ id: 42, path: "media/1700000000-photo.webp" });
    expect(uploadFileMock).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.stringMatching(/\.webp$/),
      "cpanel-token"
    );
    expect(createMediaMock).toHaveBeenCalledWith(
      expect.objectContaining({ mime_type: "image/webp", original_filename: "big.jpg" }),
      "cpanel-token"
    );
  });

  it("uploads a PDF unprocessed (skips the image resize/webp pipeline)", async () => {
    uploadFileMock.mockResolvedValueOnce("media/1700000000-profile.pdf");

    const pdfBytes = Buffer.from("%PDF-1.4 fake pdf contents");
    const form = new FormData();
    form.set("file", new File([pdfBytes], "profile.pdf", { type: "application/pdf" }));
    const request = new Request("http://localhost/admin/content/media/upload", { method: "POST", body: form });

    const { POST } = await import("../route");
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({ id: 42, path: "media/1700000000-profile.pdf" });
    expect(uploadFileMock).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.stringMatching(/\.pdf$/),
      "cpanel-token"
    );
    expect(createMediaMock).toHaveBeenCalledWith(
      expect.objectContaining({ mime_type: "application/pdf", original_filename: "profile.pdf" }),
      "cpanel-token"
    );
  });
});

