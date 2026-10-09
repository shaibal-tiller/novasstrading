# Admin Content Management Portal — Design Spec

Date: 2026-08-18
Branch: `admin-content-manager`
Status: Draft — pending user review

## 1. Goal

Give the site owner (one admin user) a portal to change, reorder, add, and
delete every text and photo piece of content currently hardcoded across the
Nova SS Trading marketing site — with fast access, a friendly UI, strong
control over content, file-size discipline on uploads, garbage collection of
unused media, and previews before/while editing.

## 2. Current state (confirmed from the codebase)

- The site is a fully static Next.js 14 App Router site. There is no
  database and no auth in this repo today.
- **All copy lives in one file**, `lib/content.ts` — a mix of singleton
  objects (`site`, `hero`, `about`, `contact`, `footerBlurb`, …) and arrays
  (`products.items[]`, `coreValues.values[]`, `portfolio.tabs[].photos[]`,
  `divisions.items[]`, `sourcing.services[]`, `process.steps[]`,
  `compliance.checks[]`/`certifications[]`, `partners.logos[]`/
  `memberships[]`, `leadTime.rows[]`, `profiles.documents[]`, etc.).
- **All images** are static files under `public/assets/...`, referenced by
  relative path from `lib/content.ts` entries.
- `/admin/login`, `/admin/inventory*` are rewritten (Next.js Multi-Zones,
  `next.config.mjs`) to a *separate* Vercel project — the inventory app —
  when `INVENTORY_URL` is set. That mount is only on the
  `admin-inventory-mount` branch, not yet merged to `main`; it does not
  exist in production today (confirmed: `/admin/login` currently 404s on
  `novasstrading.com`). We have no access to that app's repo or credentials.

## 3. Decisions made with the user

| Question | Decision |
|---|---|
| Data persistence | Use the existing **Exonhost cPanel** account — MariaDB (10.6.27) + cPanel file storage — not a Vercel-native DB/Blob. |
| Live-update mechanism | Admin edits go live immediately (no build/redeploy per content edit). |
| Feature deploy workflow | This portal itself ships via a normal branch → Vercel preview → verify → merge to `main` flow, same as any other change. |
| Admin users | One person. No roles/permissions system needed. |
| Portal location | New section inside **this** repo (e.g. `/admin/content`), not a separate mounted app. |
| Auth | **Independent** login for the content portal — do not depend on the inventory app's session (it isn't live, and we have no visibility into its auth). Revisit unifying later if useful. |

## 4. cPanel account facts to design around

- Account: `novasst1`, primary domain `novasstrading.com`, shared IP `103.159.37.70`.
- **A MariaDB database already exists**: `novasst1_nova_assets` (empty, 0 tables). We'll build the schema into this database rather than provisioning a new one.
- PHP **8.4.24** available (via phpMyAdmin's reported PHP version) — modern PHP, can use typed properties, `password_hash()`/`sodium`, etc.
- 1 FTP account, 1 subdomain currently in use (unrelated — not investigated, not needed for this design).
- **Disk: 6.49 GB / 9.77 GB used (66%) → ~3.3 GB free.** This is a real constraint: image storage must stay disciplined. See §7.
- Unlimited additional databases/subdomains allowed if we need them later.

## 5. Architecture

Vercel can't reliably reach cPanel's MySQL port directly (Vercel's egress
IPs are dynamic; cPanel's Remote MySQL allow-list can't pin them without
opening it dangerously wide), and Vercel serverless functions can't write
straight onto cPanel's filesystem. So we put a **small authenticated REST
API in PHP on the cPanel account itself**, in front of the MariaDB database
and a media directory served over HTTPS from the domain. The Next.js app
(portal UI *and*, for reads, the public site) talks to that API over HTTPS.

```
Visitor browser                 Admin (you), logged into /admin/content
      │                                        │
      ▼                                        ▼
        Next.js app (Vercel, this repo, existing project)
   ├─ Public site — reads content through Next.js cache,
   │  revalidated on save (no per-visitor cross-host call)
   └─ /admin/content/* — portal UI + its own login,
      calls the cPanel API for every read/write
                     │  HTTPS + signed API key (server-side only,
                     │  never exposed to the browser)
                     ▼
        PHP REST API on Exonhost cPanel (novasstrading.com)
   ├─ MariaDB `novasst1_nova_assets` — structured content
   └─ /media directory — uploaded images, served directly over HTTPS
```

Key point on performance: the **public-facing site never calls the cPanel
API on a visitor's request**. All Next.js Server Components fetch content
through `fetch()` with Next's data cache; every admin write triggers
`revalidatePath`/`revalidateTag` for the affected page section, so changes
appear within seconds without adding cross-host latency to every page load.

The admin portal's own API routes (`/admin/content/api/*`, running on
Vercel) are the only thing that talks to the PHP API directly — the
browser never calls the cPanel host itself except to load already-uploaded
image URLs.

## 6. Data model

Structured to mirror `lib/content.ts`'s actual shape, not a generic JSON
blob — so the UI can render real fields and array editors instead of a raw
JSON textarea.

- **`content_sections`** — one row per singleton block (`site`, `hero`,
  `about`, `contact`, `footerBlurb`, `compliance` intro/protocol text,
  etc.), columns matching each block's known fields, plus `updated_at`.
- **`content_items`** — one row per array entry across every list-shaped
  section (`coreValues.values[]`, `whyUs.reasons[]`, `products.items[]`,
  `divisions.items[]`, `sourcing.services[]`/`pillars[]`/`checklist[]`,
  `process.steps[]`, `compliance.checks[]`/`certifications[]`,
  `portfolio.tabs[].photos[]`/`categories[]`, `partners.logos[]`/
  `memberships[]`, `leadTime.rows[]`, `profiles.documents[]`). Columns:
  `section_key`, `sort_order` (int — drives drag-to-reorder), `fields`
  (the item's own columns, e.g. title/body/image), `deleted_at` (soft
  delete, nullable).
- **`media`** — every uploaded file: `path`, `original_filename`,
  `bytes`, `width`, `height`, `mime_type`, `used_by_count` (maintained
  whenever a `content_items`/`content_sections` row starts or stops
  referencing it), `created_at`.
- **`admins`** — single row for now: `email`, `password_hash`, session
  fields as needed (see §9).

**Migration**: a one-time Node script parses the current `lib/content.ts`
AST (or is simply hand-translated given its modest size) and seeds these
tables via the PHP API's admin-only import endpoint, so production content
starts identical to what's live today. `lib/content.ts` itself is then
retired as the source of truth (kept in git history, not deleted from the
repo — the Next.js code paths that read from it get pointed at the new
data-fetching layer instead).

## 7. Media / file-size / garbage control

Given ~3.3 GB free on the cPanel account, upload discipline matters more
here than it would on Blob storage:

- **Upload-time limits**: hard cap per image (proposed 3–5 MB original
  upload; confirm during implementation), rejected client-side before
  upload starts and re-checked server-side (never trust the client alone).
- **Automatic re-encoding**: every upload is resized to the actual
  dimensions the site uses for that slot and re-encoded to WebP (with a
  quality target that keeps typical product photos well under 300 KB) —
  done server-side (Vercel function running `sharp` before handing the
  processed file to the PHP API, since PHP's GD/Imagick on shared cPanel
  hosting is a less predictable dependency to lean on for this).
- **Preview before commit**: the portal shows the re-encoded result — new
  file size, dimensions — before the admin confirms the upload, so there
  are no surprises.
- **Garbage collection, not silent deletion**: replacing or deleting a
  content item's image decrements that file's `used_by_count`. Anything at
  zero shows up in a **Cleanup** view inside the Media Library for a
  one-click purge — never auto-deleted in the background, so nothing
  vanishes without the admin seeing it first.
- **Soft delete + trash**: deleting a content item (not just an image)
  marks it `deleted_at` rather than removing the row; a Trash view allows
  restore for 30 days, after which a scheduled cleanup job hard-deletes it
  (and decrements any media it referenced).
- **Disk usage visibility**: the Media Library header shows total storage
  used vs. the account's ~3.3 GB headroom, so the admin sees the budget,
  not just individual file sizes.

## 8. Admin UI/UX

The content is plain text and photos — no rich formatting anywhere in
`lib/content.ts` — so a generic WYSIWYG editor would be more control surface
than the content needs. Instead:

- **Section forms** for singleton blocks: labeled inputs/textareas
  matching each known field (e.g. Hero's eyebrow/companyName/tagline/body/
  CTAs/stats), inline validation against the constraints the current
  design relies on (e.g. `sourcing.services[].body` staying a tight
  one-liner so the grid doesn't break).
- **Repeatable list editor** for every array section: drag-handle
  reordering (writes `sort_order`), inline add/edit/delete per row, a
  confirm step before delete (feeding the soft-delete/trash flow above).
- **Media Library**: grid of every uploaded image, thumbnail, file size,
  dimensions, a "used on: <page section>" badge or an "unused" flag, and
  the Cleanup view from §7. Drag-drop upload with the re-encoded preview
  before confirming.
- **"View on site" link** next to every section/item — jumps to that
  block on the live page, so editing never happens blind.
- **Fast access**: a single dashboard listing every editable section
  (grouped to match the page's own visual order — Hero, About, Values,
  Products, Portfolio, Divisions, Process, Compliance, Partners, Contact,
  Footer) so the admin can jump straight to what they came to change,
  rather than hunting through nested menus.

## 9. Auth

Single admin, so no roles/permissions system — just a real login:

- `admins` table (§6) holds one row: email + `password_hash` (PHP
  `password_hash()`/`password_verify()`, bcrypt/argon2).
- Login flow: portal's `/admin/content/login` posts credentials to a
  Vercel API route, which calls the PHP API's `/auth/login` endpoint; on
  success the PHP API returns a signed, short-lived token; the Vercel
  route sets it as an **httpOnly, secure, SameSite=Strict** session cookie
  scoped to the portal's own path. All subsequent `/admin/content/*` pages
  and API routes verify that cookie server-side before rendering or
  calling the cPanel API.
- The cPanel API itself is never reachable with the admin's real
  credentials from the browser — only the Vercel server talks to it, using
  a separate long-lived shared-secret API key (env var, never exposed
  client-side) *in addition to* verifying the admin's session, so a leaked
  API key alone can't be used interactively without also compromising the
  Vercel deployment.
- Explicitly **not** shared with the inventory app's session (see §3) —
  independent login, revisit later if useful.

## 10. Deploy & environments

- This feature ships on the `admin-content-manager` branch, gets a Vercel
  preview deployment for end-to-end testing, then merges to `main` for
  production — same flow the user already uses.
- There is a **single production database** (`novasst1_nova_assets`) — no
  separate staging database is proposed, since there's one admin and one
  live site. This means the preview deployment's admin portal will read
  and write real production content during testing. Flag before
  implementation if a sandbox copy of the DB is wanted instead for safer
  testing of destructive actions (delete, bulk reorder).

## 11. Non-functional / risks

- **Cross-host latency**: every admin action (not visitor page loads)
  makes a Vercel → Exonhost HTTPS round-trip. Acceptable for an editing
  UI; not used on the hot path for visitors (§5).
- **Availability coupling**: if the Exonhost account has downtime, content
  *edits* fail, but the public site keeps serving its last-cached content
  — it does not go down with cPanel, since it never calls the API live.
- **PHP API is new code to maintain** in a second language (PHP) — kept
  intentionally small (auth, CRUD for the three tables, media upload)
  rather than a general framework, to limit that surface.
- **Disk budget** (§7) is the tightest real constraint — needs monitoring
  as the media library grows.
- **Auth unification** with the inventory app is deferred (§3/§9) — a
  known follow-up, not a blocker.

## 12. Out of scope for this phase

- Multi-user roles/permissions (single admin only, per §3).
- Draft/staged content with a separate "Publish" step (edits are live
  immediately, per §3) — can be added later as a `status` column on
  `content_items`/`content_sections` if ever needed.
- Reusing the inventory app's session (§9).
- Rich text formatting (content is plain paragraphs/lists today).

