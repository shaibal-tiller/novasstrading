import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import sharp from "sharp";
import { createMedia } from "@/lib/cpanel-api";
import { uploadFileToCpanel } from "@/lib/cpanel-media-upload";
import { verifySessionCookie } from "@/lib/session";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_DIMENSION = 1600;

export async function POST(request: Request): Promise<Response> {
  const cookie = cookies().get("nova_admin_session")?.value;
  const token = cookie ? verifySessionCookie(cookie) : null;
  if (!token) {
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

  // PDFs (Company Profile documents) pass through unprocessed — sharp only
  // understands image formats, so running a PDF through the same
  // resize/webp pipeline below would fail. Everything else is treated as an
  // image and re-encoded to WebP, same as before.
  if (file.type === "application/pdf") {
    const bytes = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}-${safeName}${safeName.toLowerCase().endsWith(".pdf") ? "" : ".pdf"}`;
    const path = await uploadFileToCpanel(bytes, filename, token);

    const id = await createMedia(
      {
        path,
        original_filename: file.name,
        bytes: bytes.byteLength,
        width: 0,
        height: 0,
        mime_type: "application/pdf",
      },
      token
    );

    return NextResponse.json({ id, path }, { status: 201 });
  }

  const original = Buffer.from(await file.arrayBuffer());
  const resized = sharp(original).resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true });
  const webp = await resized.webp({ quality: 80 }).toBuffer();
  const meta = await sharp(webp).metadata();

  const filename = `${Date.now()}-${safeName}.webp`;
  const path = await uploadFileToCpanel(webp, filename, token);

  const id = await createMedia(
    {
      path,
      original_filename: file.name,
      bytes: webp.byteLength,
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      mime_type: "image/webp",
    },
    token
  );

  return NextResponse.json({ id, path }, { status: 201 });
}

