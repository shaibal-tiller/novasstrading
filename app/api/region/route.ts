import { NextResponse } from "next/server";
import { consentRequired } from "@/lib/consent-region";

// Per visitor, so it must never be cached or prerendered.
export const dynamic = "force-dynamic";

/** Tells the cookie banner whether this visitor's country requires an analytics opt-in. */
export function GET(request: Request) {
  const required = consentRequired(request.headers.get("x-vercel-ip-country"));
  return NextResponse.json({ consentRequired: required }, { headers: { "Cache-Control": "private, no-store" } });
}
