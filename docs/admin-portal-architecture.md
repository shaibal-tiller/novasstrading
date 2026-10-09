# Admin content portal — storage, caching and images

Status: rebuilt on branch `admin-content-portal-rebuild`. Not merged, not deployed.

## Sign-in (one shared door)

There is one admin sign-in for the whole host, at **`/admin/login`** — no passwords, an emailed 6-digit code.

- **Identity lives in the Assets app** (`/admin/inventory/*`, a separate Next app behind the rewrites in
  `next.config.mjs`). The login page calls its `POST /admin/inventory/api/auth/request-code` and
  `verify-code`; on success that app sets the httpOnly `nova_session` cookie for the whole host.
  Typing a bare name (no `@`) means `name@novasstrading.com`. Codes last 10 minutes; resend after 60 s.
- **`/admin`** is the chooser: it lists the modules the account has (`website` → `/admin/content`,
  `assets` → `/admin/inventory/assets`), jumps straight in if there is only one, and says "no access" if none.
- **The website editor** (`app/admin/content/(guarded)`) checks the session on every request with
  `getAdminSession()` (`lib/admin-session.ts`): it forwards the cookie to
  `${INVENTORY_URL}/admin/inventory/api/auth/me` and caches the answer for 30 s (5 s for "no").
  No session → `/admin/login`; signed in without the `website` module → `/admin`.
- **Talking to the PHP content API**: server actions call `requireContentToken()` (`lib/admin-auth.ts`), which
  re-checks the session and then mints a 5-minute bearer token in the PHP `Auth::issueToken` format
  (`lib/content-api-token.ts`, signed with `CPANEL_SESSION_SECRET` = the PHP server's `SESSION_SECRET`).
  The browser never sees that token. The PHP API itself is unchanged.
- **Sign out** posts to `/admin/inventory/api/auth/logout` and returns to `/admin/login`.
- The old editor-only login (`/admin/content/login`, `nova_admin_session` cookie, `SESSION_COOKIE_SECRET`)
  is gone; that URL redirects to `/admin/login`.

Env needed: `INVENTORY_URL` (without it nobody can sign in; the public site still works) and
`CPANEL_SESSION_SECRET`.

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

- **On upload (on the cPanel server, `cpanel-api/src/ImageOptimizer.php`)**: the portal forwards the original
  file and PHP does the work — bakes in EXIF rotation, downsizes to max 1000px on the long edge (shrunk in the browser first, so 4K/8K originals never travel), re-encodes to
  WebP quality 80, strips metadata. Uses Imagick if it can write WebP, otherwise GD (`imagewebp`).
  If the host has neither, the original is stored unchanged under its real extension (an upload never fails
  because of a missing library). A WebP that already fits is left alone, so nothing is compressed twice.
  PDFs are stored untouched. Images over 40 megapixels are rejected to protect shared-host memory.
- **What the DB records** is what PHP actually stored (real bytes/width/height/mime), returned by the upload endpoint.
- **On display**: `next/image` serves AVIF/WebP at the right size via Vercel's image optimizer, cached
  31 days at the edge. Below-the-fold images lazy-load; only the hero/header use `priority`.
- **From cPanel**: `public/media/.htaccess` sends `Cache-Control: public, max-age=31536000, immutable`
  (filenames are unique per upload) and blocks script execution in that folder.

Check once on Exonhost: cPanel -> Select PHP Version -> Extensions, and make sure `gd` (or `imagick`) is ticked.
Also `exif` if you want phone-photo rotation under GD.

## If you outgrow cPanel disk

Move `public/media/` to object storage (Cloudflare R2 or Vercel Blob) and put its URL in
`NEXT_PUBLIC_MEDIA_BASE_URL`. Nothing else changes: the DB stores relative paths.
