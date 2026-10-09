# SEO checklist

Everything here is invisible to visitors: metadata, structured data, files that
search engines and link previewers fetch, and build config. The page itself
looks exactly as before.

## What is set

- **Title**: `Nova SS Trading | Garments Buying House — Bangladesh`.
- **Meta description** (153 characters, so Google does not cut it off). It lives
  in `site.description` in `lib/content.ts` and feeds the description, Open Graph,
  Twitter and structured-data tags together. It is not shown anywhere on the page.
- **Link previews**: Open Graph and Twitter/X `summary_large_image` tags with
  `public/og-image.jpg` (1200x630). All URLs use `https://www.novasstrading.com`
  (from `site.url`), never a `*.vercel.app` hostname. Re-create the picture with
  `node scripts/make-og-image.mjs`.
- **Structured data (JSON-LD)** in `app/layout.tsx`: Organization (logo, image,
  LinkedIn, contact point, postal address), LocalBusiness and WebSite. Only facts
  already in `lib/content.ts`.
- **Canonical URLs**: `/` and `/privacy` each point at themselves.
- **robots.txt** (`app/robots.ts`): allows everything, blocks `/admin/` and
  `/api/`, lists the sitemap and host. Staging (`ROBOTS_NOINDEX=1`) blocks all.
- **sitemap.xml** (`app/sitemap.ts`): `/` and `/privacy`.
- **Icons**: PNG favicons, `apple-touch-icon.png` and `site.webmanifest` are linked
  from the metadata; `/favicon.ico` redirects to `/favicon.png`.
- **vercel.json**: functions (contact form, page regeneration, calls to the Dhaka
  content API) run in Mumbai (`bom1`) instead of the US.

## How to verify

1. **View source** of the live home page and look for: `<meta name="description">`
   (about 153 characters), `og:image` = `https://www.novasstrading.com/og-image.jpg`,
   `twitter:card` = `summary_large_image`, `<link rel="canonical">`, and a
   `<script type="application/ld+json">`.
2. Open `/og-image.jpg`, `/robots.txt` and `/sitemap.xml` in a browser; all three
   must load (no 404).
3. **Google Search Console** > URL Inspection > enter the home page > "Test live
   URL", then "Request indexing". Also submit `https://www.novasstrading.com/sitemap.xml`
   under Sitemaps.
4. **Rich Results Test**: https://search.google.com/test/rich-results
   (Schema validator: https://validator.schema.org).
5. **Facebook / WhatsApp preview**: https://developers.facebook.com/tools/debug/
   — paste the URL and press "Scrape Again" to clear the cached preview.
6. **LinkedIn preview**: https://www.linkedin.com/post-inspector/
7. **Open Graph preview** (any tool, e.g. https://www.opengraph.xyz) to see the
   card as it will appear.

## Deliberately NOT done (would change the visible page)

- **Heading**: the only `<h1>` is the brand name. A keyword heading such as
  "Garments Buying House in Bangladesh" would help search, but changes the hero.
- **Low-contrast gold text**: some gold-on-ivory text is below the recommended
  contrast ratio (hurts accessibility and Lighthouse scores). Fixing it means
  changing colours.
- **44 MB company-profile PDF**: far too heavy for mobile visitors. Compress it
  (target under 5 MB) or offer a lighter version; this changes what the link serves.
- **Image alt text**: alt text is built automatically from file names. Writing real
  descriptions per image (in the admin content portal) would improve image search
  and accessibility.
- **Meta description in the admin portal**: the admin lists a "Meta description"
  field, but the page head reads `site.description` from `lib/content.ts`, so edits
  there do not reach the head yet.
