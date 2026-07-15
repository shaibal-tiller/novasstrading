# Nova SS Trading — Website

Corporate website for **Nova SS Trading**, a garments buying house in Dhaka,
Bangladesh — sourcing knitwear, woven, sweaters, accessories & home textile
from trusted manufacturers for retailers and wholesalers worldwide.

Single-page site built with **Next.js 14 (App Router) · TypeScript · Tailwind CSS**.

- **Production:** https://www.novasstrading.com
- **Deployment guide:** [`SETUP.md`](./SETUP.md)
- **Analytics setup:** [`ANALYTICS_SETUP_GUIDE.md`](./ANALYTICS_SETUP_GUIDE.md)

---

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in BREVO_API_KEY
npm run dev                  # http://localhost:3000
```

```bash
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
```

Requires **Node.js 18.18+** (Node 20 LTS recommended).

## Project structure

```
app/
  layout.tsx            Fonts, SEO metadata, Open Graph, JSON-LD structured data
  page.tsx              Single-page composition — section order lives here
  globals.css           Design tokens, type scale, stitch divider, grain layer CSS
  sitemap.ts            /sitemap.xml
  robots.ts             /robots.txt
  api/contact/route.ts  Inquiry endpoint — validation, rate limit, spam scoring,
                        Brevo delivery (admin notification + customer auto-reply)
components/             One component per section + shared building blocks
  Hero.tsx              Positioning + crossfading collage of product photos
  About.tsx             Story, Mission/Vision (tabs on mobile, read-more intro)
  CoreValues.tsx        Interactive compass — needle points at hovered value
  WhyUs.tsx             Six reasons grid
  ProductRange.tsx      Five ranges — grid on desktop, peek-carousel on mobile
  Portfolio.tsx         Women/Men/Kids tabs, two-row folded photo grid,
                        full-screen lightbox with keyboard nav
  Sourcing.tsx          Service pillars orbit, S01–S08 services, assurance list
  Process.tsx           Working process + lazy in-view company film
  Divisions.tsx         Trims & Accessories · Premium Fabrics + lead-time table
  Compliance.tsx        QA protocol + memberships (BGMEA, DCCI, BGBA)
  Partners.tsx          Client logo marquee (two counter-scrolling strips on mobile)
  Contact.tsx           Inquiry form + full-width interactive map
  PageParticles.tsx     Page-wide fabric-grain atmosphere, scroll-reactive parallax
  ContentMedia.tsx      Image/video wrapper: blur-up placeholders, lazy loading
  LazyVideo.tsx         preload=none + poster, plays only while in view
lib/
  content.ts            ← ALL site copy lives here (single source of truth)
  blurData.ts           Auto-generated 10px blur placeholders per image
public/
  assets/               Product photos, category imagery, logos, video
  company-profile/      Downloadable company profile PDF
```

## Editing content

Every heading, paragraph, list, product category, service, contact detail and
label lives in **`lib/content.ts`** — components only render it. Change copy
there; nothing is hard-coded in components.

Adding a photo:
1. Drop an optimized JPEG into `public/assets/…` (≤1500px, quality ~82).
2. Reference it from `lib/content.ts` (or the relevant component).
3. Regenerate blur placeholders (10px base64 thumbnails) so the new image gets
   a blur-up loading state — the map lives in `lib/blurData.ts`.

## Design system

- **Palette:** Ink `#16191F` · Ivory `#F6F3ED` · Cream `#EFE7DD` · Brass
  `#B08A4F` · Loom teal `#1E4D4A` (see `tailwind.config.ts`).
- **Type:** Fraunces (display) · Hanken Grotesk (body) · IBM Plex Mono
  (labels/data) — self-hosted via `next/font`, zero layout shift.
- **Signature motifs:** dashed stitch dividers, floating rounded section
  cards, and a page-wide drifting "fabric grain" atmosphere that reacts to
  scroll (three parallax depths) and paints only in empty space — never over
  text or imagery.
- **Motion:** scroll reveals, hero crossfade, marquees, compass needle —
  everything honours `prefers-reduced-motion`.

## Responsive behaviour

Desktop and tablet use the full layouts. Below 640px every section has a
dedicated phone treatment (grids fold to 2-up, product range becomes a
peek-carousel, categories become a marquee, services compact to 2×2/2×4,
long intros truncate behind "Read more"). Verified with no horizontal
scroll at 320–390px widths.

## Contact form

`app/api/contact/route.ts` handles the inquiry flow end-to-end:

- validation + honeypot + per-IP rate limiting (10/hour) + spam scoring
- geo-enriched **admin notification** and a branded **customer auto-reply**,
  both delivered through the **Brevo API**

Environment variables (see `.env.example`):

| Variable | Purpose |
|---|---|
| `BREVO_API_KEY` | Brevo transactional email key |
| `CONTACT_EMAIL` | Where admin notifications go |
| `SITE_NAME` / `SITE_DOMAIN` | Branding used in the emails |

## SEO

- Title template, description, keywords, canonical URL
- Open Graph + Twitter card with preview image
- JSON-LD graph: `Organization` (with LinkedIn `sameAs`), `LocalBusiness`
  (Dhaka address), `WebSite`
- Generated `sitemap.xml` + `robots.txt`
- Server-rendered HTML, semantic landmarks, single `h1`, alt text everywhere,
  skip-link, visible focus states

## Performance

- AVIF/WebP via the Next image optimizer, accurate `sizes` per slot
- Blur-up placeholders on all imagery; above-the-fold images prioritized
- Video: `preload="none"` + poster frame, plays only in view, pauses off-screen
- Week-long `Cache-Control` on `/assets`, 31-day optimized-image cache
- Grain animation is pure CSS (GPU transform/opacity), zero JS on idle pages

## Deployment

Hosted on **Vercel** with the custom domain pointed directly at it.
Full walkthrough — project import, environment variables, custom domain,
DNS records at Exonhost, and verification: **[`SETUP.md`](./SETUP.md)**.

Every push to `main` deploys automatically.
