import { describe, it, expect } from "vitest";
import { shrinkImage } from "@/lib/admin/shrink-image";
import { MAX_PHOTO_EDGE } from "@/lib/media-limits";

describe("shrinkImage", () => {
  it("returns non-images untouched (the server decides what to do with them)", async () => {
    const pdf = new File(["%PDF-1.4"], "a.pdf", { type: "application/pdf" });
    expect(await shrinkImage(pdf)).toBe(pdf);
  });

  it("leaves animated-capable GIFs alone", async () => {
    const gif = new File([new Uint8Array(10)], "a.gif", { type: "image/gif" });
    expect(await shrinkImage(gif)).toBe(gif);
  });

  it("falls back to the original file if the browser cannot decode it", async () => {
    // jsdom has no createImageBitmap, which is exactly the "cannot decode" path.
    const img = new File([new Uint8Array(2_000_000)], "big.jpg", { type: "image/jpeg" });
    expect(await shrinkImage(img)).toBe(img);
  });

  it("uses a 1000px long-edge limit", () => {
    expect(MAX_PHOTO_EDGE).toBe(1000);
  });
});
