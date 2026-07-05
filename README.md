# Nova SS Trading — Website

A single-page corporate site for **Nova SS Trading**, a Bangladesh garments buying
house and supplier of premium trims, accessories, and fabrics. Built with
**Next.js (App Router) + TypeScript + Tailwind CSS**.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
```

> Requires **Node.js 18.18+** (Node 20 LTS recommended).

## Project structure

```
app/
  layout.tsx        Fonts, SEO metadata, JSON-LD structured data
  page.tsx          Single-page composition (section order lives here)
  globals.css       Design tokens, base type, the "stitch" divider motif
  sitemap.ts        /sitemap.xml
  robots.ts         /robots.txt
  api/contact/route.ts   Inquiry form handler (wire up email/CRM here)
components/         One file per section + shared building blocks
lib/
  content.ts        ← ALL site copy lives here. Edit text in one place.
  utils.ts
public/
  media/            ← place generated images/videos here (see MEDIA_PROMPTS.md)
  company-profile/  ← place the two profile PDFs here
MEDIA_PROMPTS.md    Generation prompts for every placeholder asset
```

## Editing content

All copy is centralized in **`lib/content.ts`** — headings, body text, lists,
the lead-time table, the 8-stage process, contact details, etc. Change it there
and every section updates. No copy is hard-coded inside components.

## Design system

- **Palette:** Ink `#16191F`, Ivory `#F6F3ED`, Brass `#B08A4F`, Loom teal `#1E4D4A`,
  Stone `#DDD5C7` (defined in `tailwind.config.ts`).
- **Type:** Fraunces (display), Hanken Grotesk (body), IBM Plex Mono (labels/data),
  all self-hosted via `next/font` for zero layout shift.
- **Signature:** a dashed "stitch-line" divider (`.stitch`) echoing garment seams.
- **Motion:** scroll-reveal via `IntersectionObserver`; fully disabled under
  `prefers-reduced-motion`.

## Replacing placeholders

Open **`MEDIA_PROMPTS.md`** — it lists every placeholder (`IMG-01…`, `VID-01`,
`LOGO-01…`) with a ready-to-use generation prompt, target aspect ratio, and the
component it lives in. Generate, name by ID, drop into `/public/media/`, then
replace the `<MediaPlaceholder/>` with a `next/image` or `<video>`.

## SEO

- Per-document `<title>` template, meta description, keywords, canonical.
- Open Graph + Twitter card metadata.
- JSON-LD: `Organization`, `LocalBusiness`, `WebSite` (in `app/layout.tsx`).
- Auto `sitemap.xml` and `robots.txt`.
- Semantic landmarks, single `<h1>`, ordered headings, alt text, skip-link,
  visible focus states, `lang="en"`, theme-color.
- Update `site.url` in `lib/content.ts` to the production domain before deploy.

## Contact form

The form posts to `app/api/contact/route.ts`, which validates input and includes
a honeypot field. **Wire up real delivery** (Resend / SendGrid / Postmark, a CRM
webhook, or a DB insert) where the `TODO` comment is, keeping secrets in
environment variables.

## Deploy

Optimized for **Vercel** (zero-config). Any Node host works: run `npm run build`
then `npm run start`. Set the production domain in `lib/content.ts` and add an
`og-image.jpg`, favicons, and PWA icons to `/public`.
```
```
