import "server-only";

/** What the cPanel API reports about the file it actually stored. */
export type StoredMedia = {
  path: string;
  bytes: number;
  width: number;
  height: number;
  mime_type: string;
  /** Tiny blurred preview (data URL) the site paints while the real photo loads; null for PDFs / no GD. */
  blur_data_url: string | null;
};

/**
 * Sends the file to cPanel, which validates and optimizes it (rotate, downsize,
 * WebP) and returns the real stored size/dimensions. The portal records those
 * values rather than guessing from the upload.
 */
export async function uploadFileToCpanel(
  bytes: Buffer,
  filename: string,
  sessionToken: string,
  declaredMime = "application/octet-stream"
): Promise<StoredMedia> {
  const url = process.env.CPANEL_API_URL;
  const key = process.env.CPANEL_API_KEY;
  if (!url || !key) throw new Error("CPANEL_API_URL/CPANEL_API_KEY not set");

  const form = new FormData();
  form.set("file", new Blob([bytes]), filename);

  // The PHP /media/upload-file endpoint requires BOTH the API key and a
  // valid admin session — X-Api-Key alone gets a 401.
  const res = await fetch(`${url}/media/upload-file`, {
    method: "POST",
    headers: { "X-Api-Key": key, Authorization: `Bearer ${sessionToken}` },
    body: form,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`cPanel upload failed: ${res.status}`);
  const data = await res.json();

  // An older deployed API returns only { path }; fall back to what we sent.
  return {
    path: data.path as string,
    bytes: typeof data.bytes === "number" ? data.bytes : bytes.byteLength,
    width: typeof data.width === "number" ? data.width : 0,
    height: typeof data.height === "number" ? data.height : 0,
    mime_type: typeof data.mime_type === "string" ? data.mime_type : declaredMime,
    blur_data_url: typeof data.blur_data_url === "string" ? data.blur_data_url : null,
  };
}
