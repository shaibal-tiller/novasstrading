import { NextResponse } from "next/server";
import { listMedia } from "@/lib/cpanel-api";
import { requireContentToken } from "@/lib/admin-auth";

/**
 * JSON media listing for the visual editor's MediaPicker (a "use client"
 * component that cannot import the server-only `lib/cpanel-api.ts` directly).
 * The existing `media/page.tsx` renders this same data as HTML for the
 * classic media library page; this route exposes it as JSON for client-side
 * fetches instead.
 */
export async function GET(): Promise<Response> {
  try {
    await requireContentToken();
  } catch {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const media = await listMedia();
  return NextResponse.json(media);
}

