// Generates public/og-image.jpg (1200x630), the image shown when the site is
// shared on WhatsApp / LinkedIn / Facebook / X and listed in the JSON-LD.
//
//   node scripts/make-og-image.mjs
//
// Uses `sharp` (already installed with Next.js). Colours match the site:
// ivory #F6F3ED, brass #B08A4F, ink #16191F.
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const W = 1200;
const H = 630;
const IVORY = "#F6F3ED";
const BRASS = "#B08A4F";
const INK = "#16191F";
const SERIF = "Georgia, 'Times New Roman', Times, 'DejaVu Serif', serif";

// Logo: trim the transparent margin, then fit into a square on the left.
const LOGO = 470;
const logo = await sharp(path.join(root, "public/logo.png"))
  .trim({ threshold: 10 })
  .resize(LOGO, LOGO, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

const textX = 600;
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <!-- thin brass frame -->
  <rect x="24" y="24" width="${W - 48}" height="${H - 48}" fill="none" stroke="${BRASS}" stroke-width="2" opacity="0.55"/>
  <!-- divider between logo and text -->
  <line x1="548" y1="150" x2="548" y2="480" stroke="${BRASS}" stroke-width="2" opacity="0.7"/>
  <text x="${textX}" y="290" font-family="${SERIF}" font-size="60" font-weight="700" textLength="540" lengthAdjust="spacingAndGlyphs" fill="${INK}">Nova SS Trading</text>
  <line x1="${textX}" y1="328" x2="${textX + 120}" y2="328" stroke="${BRASS}" stroke-width="4"/>
  <text x="${textX}" y="392" font-family="${SERIF}" font-size="29" textLength="540" lengthAdjust="spacingAndGlyphs" fill="${INK}">Garments Buying House <tspan fill="${BRASS}">—</tspan> Bangladesh</text>
  <text x="${textX}" y="520" font-family="${SERIF}" font-size="24" fill="${INK}" opacity="0.7">www.novasstrading.com</text>
</svg>`;

const out = path.join(root, "public/og-image.jpg");
await sharp({ create: { width: W, height: H, channels: 3, background: IVORY } })
  .composite([
    { input: logo, left: 40, top: Math.round((H - LOGO) / 2) },
    { input: Buffer.from(svg), left: 0, top: 0 },
  ])
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(out);

const meta = await sharp(out).metadata();
console.log(`wrote ${out} (${meta.width}x${meta.height})`);
