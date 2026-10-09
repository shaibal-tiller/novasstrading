import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MediaPicker } from "../MediaPicker";

const listMediaMock = vi.fn();
vi.mock("@/lib/admin/media-client", () => ({
  listMedia: (...args: unknown[]) => listMediaMock(...args),
}));

function makeFile(sizeBytes: number, name = "photo.jpg", type = "image/jpeg"): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

const imageRow = {
  id: 1,
  path: "media/a.webp",
  original_filename: "a.webp",
  bytes: 10,
  width: 10,
  height: 10,
  mime_type: "image/webp",
  used_by_count: 0,
  created_at: "",
};
const pdfRow = {
  id: 2,
  path: "media/b.pdf",
  original_filename: "b.pdf",
  bytes: 20,
  width: 0,
  height: 0,
  mime_type: "application/pdf",
  used_by_count: 0,
  created_at: "",
};

beforeEach(() => {
  listMediaMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MediaPicker", () => {
  it("is a fixed-overlay dialog", async () => {
    listMediaMock.mockResolvedValue([]);
    render(<MediaPicker onSelect={vi.fn()} accept="image" />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog.className).toContain("fixed");
    expect(dialog.className).toContain("inset-0");
    expect(dialog.className).toContain("bg-ink/95");
  });

  it("lists existing media filtered to images and calls onSelect with the chosen path", async () => {
    listMediaMock.mockResolvedValue([imageRow, pdfRow]);
    const onSelect = vi.fn();
    render(<MediaPicker onSelect={onSelect} accept="image" />);

    const item = await screen.findByRole("button", { name: /a\.webp/i });
    expect(screen.queryByRole("button", { name: /b\.pdf/i })).not.toBeInTheDocument();

    await userEvent.click(item);
    expect(onSelect).toHaveBeenCalledWith("media/a.webp");
  });

  it("filters existing media to PDFs when accept is document", async () => {
    listMediaMock.mockResolvedValue([imageRow, pdfRow]);
    const onSelect = vi.fn();
    render(<MediaPicker onSelect={onSelect} accept="document" />);

    const item = await screen.findByRole("button", { name: /b\.pdf/i });
    expect(screen.queryByRole("button", { name: /a\.webp/i })).not.toBeInTheDocument();

    await userEvent.click(item);
    expect(onSelect).toHaveBeenCalledWith("media/b.pdf");
  });

  it("rejects an oversized upload without calling onSelect (mirrors UploadForm's 5MB cap)", async () => {
    listMediaMock.mockResolvedValue([]);
    const onSelect = vi.fn();
    render(<MediaPicker onSelect={onSelect} accept="image" />);

    await userEvent.click(screen.getByRole("tab", { name: /upload new/i }));
    const input = screen.getByLabelText(/upload new image/i);
    await userEvent.upload(input, makeFile(6 * 1024 * 1024));

    expect(await screen.findByText(/exceeds 5MB/i)).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("uploads a valid image and calls onSelect with the returned path, then closes", async () => {
    listMediaMock.mockResolvedValue([]);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 5, path: "media/new.webp" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const onSelect = vi.fn();
    render(<MediaPicker onSelect={onSelect} accept="image" />);

    await userEvent.click(screen.getByRole("tab", { name: /upload new/i }));
    const input = screen.getByLabelText(/upload new image/i);
    await userEvent.upload(input, makeFile(1024, "small.jpg"));

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith("media/new.webp"));
    expect(fetchMock).toHaveBeenCalledWith(
      "/admin/content/media/upload",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("restricts the upload file input's accept attribute per the accept prop", async () => {
    listMediaMock.mockResolvedValue([]);
    render(<MediaPicker onSelect={vi.fn()} accept="document" />);

    await userEvent.click(screen.getByRole("tab", { name: /upload new/i }));
    const input = screen.getByLabelText(/upload new document/i);
    expect(input).toHaveAttribute("accept", "application/pdf");
  });

  it("calls onClose when the close button is clicked", async () => {
    listMediaMock.mockResolvedValue([]);
    const onClose = vi.fn();
    render(<MediaPicker onSelect={vi.fn()} accept="image" onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});

