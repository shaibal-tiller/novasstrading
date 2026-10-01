# Admin content portal — storage, caching and images

Status: rebuilt on branch `admin-content-portal-rebuild`. Not merged, not deployed.

## Where data lives

| Data | Where | Why |
|---|---|---|
| Text, lists, order | MySQL on Exonhost (`content_sections`, `content_items`, JSON columns) | small, structured, edited often |
| Photo/PDF **files** | Disk on the cPanel host: `public/media/` of the content API | big binary data never goes in the DB or in git |
| Photo/PDF **metadata** | MySQL `media` table: path, size, width, height, mime | lets the media library list files without touching disk |
| A content field that is a photo | Just the string `media/<name>.webp` | resolved to a full URL by `resolveMediaUrl()` |
| Fallback copy of all content | `lib/content.ts`, shipped with each deploy | the site renders even if the API/DB is down or empty |

Photos in the existing portfolio (`/public/assets/...`) stay where they are, in git. Only photos uploaded
through the portal go to the cPanel `media/` folder.

## Caching layers (outermost first)

1. **Vercel CDN** — the homepage is static (ISR). Visitors never hit cPanel.
2. **Next data cache** — one fetch to `GET /content`, tagged `site-content`, revalidated hourly as a safety net.
3. **Explicit invalidation** — every admin save calls `revalidatePublicContent()`, which drops the tag and
   re-renders `/`. Edits show up on the next request, not an hour later.
4. **Admin screens bypass all of this** (`cache: "no-store"`), so the editor always sees live data.

The old read path made one request per content list (~20, sequential) on every cache miss. It is now one
request / two SQL queries.

## Images

- **On upload**: auto-rotated from EXIF, resized to max 1600px, re-encoded to WebP quality 80 (`sharp`).
- **On display**: `next/image` serves AVIF/WebP at the right size via Vercel's image optimizer, cached
  31 days at the edge. Below-the-fold images lazy-load; only the hero/header use `priority`.
- **From cPanel**: `public/media/.htaccess` sends `Cache-Control: public, max-age=31536000, immutable`
  (filenames are unique per upload) and blocks script execution in that folder.
- PDFs are served straight from cPanel with the same headers.

## If you outgrow cPanel disk

Move `public/media/` to object storage (Cloudflare R2 or Vercel Blob) and put its URL in
`NEXT_PUBLIC_MEDIA_BASE_URL`. Nothing else changes: the DB stores relative paths.
