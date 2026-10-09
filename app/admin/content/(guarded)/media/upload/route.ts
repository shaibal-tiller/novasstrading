import { NextResponse } from "next/server";
import { createMedia } from "@/lib/cpanel-api";
import { uploadFileToCpanel } from "@/lib/cpanel-media-upload";
import { requireContentToken } from "@/lib/admin-auth";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request): Promise<Response> {
  let token: string;
  try {
    token = await requireContentToken();
  } catch {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing file" }, { status: 422 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file exceeds 5MB limit" }, { status: 422 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");

  // Images and PDFs are forwarded as-is: the cPanel API is the single place
  // that validates and optimizes (EXIF rotate, downsize, WebP — see
  // cpanel-api/src/ImageOptimizer.php) and PDFs are stored untouched. It
  // returns the real stored size/dimensions, which is what we record.
  const original = Buffer.from(await file.arrayBuffer());
  let stored;
  try {
    stored = await uploadFileToCpanel(original, `${Date.now()}-${safeName}`, token, file.type);
  } catch (err) {
    console.error("media upload failed:", err);
    return NextResponse.json({ error: "upload failed" }, { status: 502 });
  }

  const id = await createMedia(
    {
      path: stored.path,
      original_filename: file.name,
      bytes: stored.bytes,
      width: stored.width,
      height: stored.height,
      mime_type: stored.mime_type,
    },
    token
  );

  return NextResponse.json({ id, path: stored.path, blur: stored.blur_data_url }, { status: 201 });
}
