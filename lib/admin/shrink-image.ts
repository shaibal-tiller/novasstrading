import { MAX_PHOTO_EDGE } from "@/lib/media-limits";

/** Photos at or under this size AND within the edge limit are uploaded exactly as they are. */
const LEAVE_ALONE_BYTES = 300 * 1024;

/**
 * Shrinks a photo in the browser BEFORE upload: longest side capped at MAX_PHOTO_EDGE,
 * EXIF rotation applied, re-encoded as WebP (JPEG where the browser cannot encode WebP).
 * An 8K phone photo of 8 MB becomes ~60 KB, so the upload is instant and also fits under
 * Vercel's ~4.5 MB request limit. The server enforces the same limit regardless, so this is
 * an optimisation, never a trust boundary. Non-images, and anything that fails to decode,
 * are returned unchanged for the server to accept or reject.
 */
export async function shrinkImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const longest = Math.max(bitmap.width, bitmap.height);
    if (longest <= MAX_PHOTO_EDGE && file.size <= LEAVE_ALONE_BYTES) {
      bitmap.close?.();
      return file;
    }
    const scale = Math.min(1, MAX_PHOTO_EDGE / longest);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();

    const toBlob = (type: string, quality: number) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
    let blob = await toBlob("image/webp", 0.85);
    if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg", 0.9);
    if (!blob || (blob.size >= file.size && scale === 1)) return file;

    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + "." + ext, { type: blob.type });
  } catch {
    return file;
  }
}
