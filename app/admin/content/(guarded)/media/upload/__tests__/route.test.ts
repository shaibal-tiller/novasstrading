// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const createMediaMock = vi.fn().mockResolvedValue(42);
vi.mock("@/lib/cpanel-api", () => ({ createMedia: createMediaMock }));

const uploadFileMock = vi.fn();
vi.mock("@/lib/cpanel-media-upload", () => ({ uploadFileToCpanel: uploadFileMock }));

vi.mock("next/headers", () => ({ cookies: () => ({ get: () => ({ value: "signed-cookie" }) }) }));
vi.mock("@/lib/session", () => ({ verifySessionCookie: () => "cpanel-token" }));

function uploadRequest(bytes: Buffer, name: string, type: string): Request {
  const form = new FormData();
  form.set("file", new File([bytes], name, { type }));
  return new Request("http://localhost/admin/content/media/upload", { method: "POST", body: form });
}

beforeEach(() => {
  createMediaMock.mockClear();
  uploadFileMock.mockReset();
});

describe("POST /admin/content/media/upload", () => {
  it("forwards the original image untouched and records what cPanel reports it stored", async () => {
    uploadFileMock.mockResolvedValue({
      path: "media/abc123.webp",
      bytes: 48210,
      width: 1600,
      height: 1200,
      mime_type: "image/webp",
    });
    const original = Buffer.from("pretend these are 3MB of jpeg bytes");

    const { POST } = await import("../route");
    const response = await POST(uploadRequest(original, "big photo.jpg", "image/jpeg"));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: 42, path: "media/abc123.webp" });
    // The portal no longer re-encodes — cPanel is the only optimizer.
    expect(uploadFileMock).toHaveBeenCalledWith(
      original,
      expect.stringMatching(/^\d+-big-photo\.jpg$/),
      "cpanel-token",
      "image/jpeg"
    );
    expect(createMediaMock).toHaveBeenCalledWith(
      {
        path: "media/abc123.webp",
        original_filename: "big photo.jpg",
        bytes: 48210,
        width: 1600,
        height: 1200,
        mime_type: "image/webp",
      },
      "cpanel-token"
    );
  });

  it("uploads a PDF through the same path and records it as application/pdf", async () => {
    uploadFileMock.mockResolvedValue({
      path: "media/def456.pdf",
      bytes: 26,
      width: 0,
      height: 0,
      mime_type: "application/pdf",
    });

    const { POST } = await import("../route");
    const response = await POST(uploadRequest(Buffer.from("%PDF-1.4 fake pdf contents"), "profile.pdf", "application/pdf"));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: 42, path: "media/def456.pdf" });
    expect(createMediaMock).toHaveBeenCalledWith(
      expect.objectContaining({ mime_type: "application/pdf", original_filename: "profile.pdf" }),
      "cpanel-token"
    );
  });

  it("returns 502 and records nothing when cPanel rejects the upload", async () => {
    uploadFileMock.mockRejectedValue(new Error("cPanel upload failed: 422"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { POST } = await import("../route");
    const response = await POST(uploadRequest(Buffer.from("not an image"), "x.jpg", "image/jpeg"));

    expect(response.status).toBe(502);
    expect(createMediaMock).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
