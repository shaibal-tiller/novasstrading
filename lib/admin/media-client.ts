// Client-safe media access for the visual editor's MediaPicker.
//
// `lib/cpanel-api.ts` is marked `import "server-only"` and cannot be
// imported from "use client" components (Next.js aliases that package to a
// throwing implementation in the client bundle). MediaPicker still needs to
// browse the media library from the browser, so this thin wrapper fetches
// the same data through a JSON API route instead of calling `listMedia()`
// directly.
import type { MediaRow } from "@/lib/cpanel-api";

export type { MediaRow };

/** Fetches the full media library as JSON via GET /admin/content/media/list. */
export async function listMedia(): Promise<MediaRow[]> {
  const res = await fetch("/admin/content/media/list");
  if (!res.ok) {
    throw new Error("Could not load the media library.");
  }
  return res.json();
}

