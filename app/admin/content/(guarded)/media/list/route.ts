import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { listMedia } from "@/lib/cpanel-api";
import { verifySessionCookie } from "@/lib/session";

/**
 * JSON media listing for the visual editor's MediaPicker (a "use client"
 * component that cannot import the server-only `lib/cpanel-api.ts` directly).
 * The existing `media/page.tsx` renders this same data as HTML for the
 * classic media library page; this route exposes it as JSON for client-side
 * fetches instead.
 */
export async function GET(): Promise<Response> {
  const cookie = cookies().get("nova_admin_session")?.value;
  const token = cookie ? verifySessionCookie(cookie) : null;
  if (!token) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const media = await listMedia();
  return NextResponse.json(media);
}

