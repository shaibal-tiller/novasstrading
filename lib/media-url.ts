/**
 * Resolves a stored media/document path to a browsable URL.
 *
 * Paths returned by the cPanel media-upload endpoint (`MediaController::uploadFile`)
 * always start with the literal prefix `"media/"` (e.g. `"media/ab12cd.webp"`,
 * `"media/9f0a1b.pdf"`) and are served from the separate cPanel content-api host,
 * not from this Next app's own bundled `/public` root — so they must be resolved
 * against `NEXT_PUBLIC_MEDIA_BASE_URL`.
 *
 * Everything else — bundled `/assets/...`-style local paths, and already-absolute
 * paths from pre-existing seeded content such as `/company-profile/foo.pdf` —
 * is returned unchanged. This must NOT prepend the media base URL to a path that
 * isn't `media/`-prefixed, since that would corrupt already-correct absolute URLs.
 *
 * Framework-free (no "use client"/"server-only" import) so it can be called from
 * both server components (e.g. `Profiles.tsx`) and client components (e.g.
 * `ContentMedia.tsx`, `MediaPicker.tsx`).
 */
export function resolveMediaUrl(path: string): string {
  const MEDIA_PREFIX = "media/";
  if (!path.startsWith(MEDIA_PREFIX)) return path;

  if (!process.env.NEXT_PUBLIC_MEDIA_BASE_URL) {
    console.warn(
      `resolveMediaUrl: NEXT_PUBLIC_MEDIA_BASE_URL is not set; uploaded media path '${path}' cannot be resolved`
    );
  }

  return `${process.env.NEXT_PUBLIC_MEDIA_BASE_URL}/${path}`;
}

