// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const listMediaMock = vi.fn();
vi.mock("@/lib/cpanel-api", () => ({ listMedia: listMediaMock }));

const requireTokenMock = vi.fn();
vi.mock("@/lib/admin-auth", () => ({ requireContentToken: requireTokenMock }));

beforeEach(() => {
  listMediaMock.mockReset();
  requireTokenMock.mockReset();
});

describe("GET /admin/content/media/list", () => {
  it("returns the media library as JSON when authenticated", async () => {
    requireTokenMock.mockResolvedValue("cpanel-token");
    listMediaMock.mockResolvedValue([
      { id: 1, path: "media/a.webp", original_filename: "a.webp", bytes: 1, width: 1, height: 1, mime_type: "image/webp", used_by_count: 0, created_at: "" },
    ]);

    const { GET } = await import("../route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([
      { id: 1, path: "media/a.webp", original_filename: "a.webp", bytes: 1, width: 1, height: 1, mime_type: "image/webp", used_by_count: 0, created_at: "" },
    ]);
  });

  it("returns 401 without a valid admin session", async () => {
    requireTokenMock.mockRejectedValue(new Error("Not authenticated"));

    const { GET } = await import("../route");
    const response = await GET();

    expect(response.status).toBe(401);
    expect(listMediaMock).not.toHaveBeenCalled();
  });
});
