# Media Generation Prompts — Nova SS Trading

Every placeholder in the site carries a unique ID (e.g. `IMG-01`, `VID-01`, `LOGO-01`).
Generate the asset, name the file with its ID, and drop it into `/public/media/`,
then swap the `<MediaPlaceholder … />` for a `next/image` (or `<video>`) pointing at it.

**House style for all images:** warm, natural light; shallow depth of field; a restrained
palette of charcoal, raw-canvas ivory, and brass/gold accents to match the site; premium
editorial / catalog feel; no on-image text; high resolution.

**Recommended replacement pattern (images):**

```tsx
import Image from "next/image";

<Image
  src="/media/IMG-01.jpg"
  alt="Macro of premium brass trims — zippers and buttons"
  width={1200}
  height={1500}
  className="h-full w-full rounded-sm object-cover"
/>
```

---

## Hero collage (`components/Hero.tsx`)

| ID | Aspect | Prompt |
|----|--------|--------|
| **IMG-01** | 4:5 (portrait) | Extreme macro photograph of premium garment trims — polished brass metal zippers, shell and metal buttons, and woven labels arranged on a dark slate surface. Soft directional light catches the metal edges. Luxury textile-accessory product photography, charcoal + brass palette, shallow depth of field. |
| **IMG-02** | 1:1 (square) | Neatly stacked rolls of premium fabric in a clean warehouse — denim, twill, jersey knit and cotton in muted natural tones. Side light, organized rows, soft shadows. Industrial yet refined sourcing-house atmosphere. |
| **IMG-03** | 1:1 (square) | Wide interior shot of a modern, well-lit garment factory sewing floor with rows of industrial machines and workers in operation (faces not prominent). Clean, compliant, organized. Documentary realism, balanced exposure. |
| **IMG-04** | 4:5 (portrait) | A textile designer's hands inspecting woven labels and fabric swatches on a light studio table, color cards and a measuring tape nearby. Top-down, natural light, editorial fashion-sourcing mood, ivory + brass tones. |

## About (`components/About.tsx`)

| ID | Aspect | Prompt |
|----|--------|--------|
| **IMG-05** | 16:11 (landscape) | A small professional team gathered around a studio table reviewing fabric rolls, trim samples, buttons and tech-pack sheets. Collaborative, bright, modern buying-house office. Warm natural light, candid but polished. |

## Divisions (`components/Divisions.tsx`)

| ID | Aspect | Prompt |
|----|--------|--------|
| **IMG-06** | 5:4 (landscape) | Styled flat-lay of trims & accessories on raw-canvas linen — assorted buttons (plastic, metal, wood, shell), metal zippers, woven & printed labels, leather patches, sewing-thread cones, elastic bands. Organized grid composition, top-down, soft daylight, brass accents. |
| **IMG-07** | 5:4 (landscape) | A fan of premium fabric rolls showing distinct textures — denim, twill, poplin, fleece, jersey knit, satin and linen — arranged to display weave and drape. Natural light raking across the surfaces, muted sophisticated palette. |

## Apparel Sourcing portfolio (`components/Sourcing.tsx`)

| ID | Aspect | Prompt |
|----|--------|--------|
| **IMG-08** | 3:4 (portrait) | Menswear flat-lay / on-form: folded polos, dress shirts, chinos and a knit tee in neutral tones on an ivory backdrop. Clean catalog product photography. |
| **IMG-09** | 3:4 (portrait) | Womenswear on a minimalist clothing rail — fashion tops, a dress, cardigan and blouse in soft seasonal colors. Bright editorial lookbook style. |
| **IMG-10** | 3:4 (portrait) | Kidswear set neatly arranged — knit romper, small hoodie, tiny jeans and organic cotton basics. Soft, warm, wholesome flat-lay on light wood. |
| **IMG-11** | 3:4 (portrait) | Knitwear & denim grouping — a structured denim jacket, heavy jeans, a fleece hoodie and a chunky knit, stacked and styled. Rich texture, moody natural light. |

## Quality & Compliance (`components/Compliance.tsx`)

| ID | Aspect | Prompt |
|----|--------|--------|
| **IMG-12** | 4:3 (landscape) | A QA officer in a clean inspection area examining a finished garment under bright inspection lights, measuring tape and inspection checklist visible. Professional, trustworthy, well-lit documentary style. |
| **IMG-13** | 3:2 (logo) | **Use the official OEKO-TEX® Standard 100 certification logo.** Do not AI-generate — download the approved badge from the certifying body and place it here. |
| **IMG-14** | 3:2 (logo) | **Use the official FSC® (Forest Stewardship Council) logo.** Official badge only — obtain from FSC; do not generate. |
| **IMG-15** | 3:2 (logo) | **Use the official BSCI / WRAP audit logos.** Official badges only; obtain from the respective bodies. |

> ⚠️ **Certification logos (IMG-13–15):** only display these if Nova SS Trading (or its
> partner factories) genuinely hold the certifications, and use the official artwork per
> each body's brand guidelines. Misusing certification marks has legal consequences.

## Process film (`components/Process.tsx`)

| ID | Aspect | Prompt |
|----|--------|--------|
| **VID-01** | 16:9 (video) | 30–60s company film cutting through the buying-house workflow: requirement briefing → fabric & trim sourcing → sampling → factory production monitoring → AQL inspection → carton packing → port shipment. Cinematic, warm grade, brass/charcoal mood, ambient factory sound. Provide an MP4 (H.264) plus a poster frame `VID-01-poster.jpg`. |

## Partner logos (`components/Partners.tsx`)

| ID | Notes |
|----|-------|
| **LOGO-01 … LOGO-10** | Replace each marquee slot with a **real partner / client / retailer logo** (with permission to display). Supply transparent PNG or SVG, ideally monochrome or single-color so they sit cleanly on the ivory cards. If you have fewer than 10 partners, reduce `partners.count` in `lib/content.ts`. |

## Brand & social assets (`/public`)

| File | Spec | Prompt / note |
|------|------|---------------|
| `og-image.jpg` | 1200×630 | Social share card: the Nova SS wordmark on a charcoal field with a brass stitch-line motif and the tagline "Garments Buying House & Textile Solutions". Keep text large and centered. |
| `favicon.ico` / `apple-touch-icon.png` | 32×32 / 180×180 | A monogram mark — "N" with a brass dot, or a stitched-seam glyph — on charcoal. |
| `icon-192.png` / `icon-512.png` | PWA icons | Same monogram, padded, on charcoal. |

---

### Quick checklist
- [ ] IMG-01 → IMG-12 generated and placed in `/public/media/`
- [ ] IMG-13 → IMG-15 official certification badges (only if certified)
- [ ] VID-01 film + poster frame
- [ ] LOGO-01 → LOGO-10 real partner logos (with permission)
- [ ] og-image, favicons, PWA icons
- [ ] Two company-profile PDFs in `/public/company-profile/`
