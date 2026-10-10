import { isPhotoHidden, photoCaption, photoUrl, type PortfolioPhoto } from "@/lib/portfolio-photo";

const MAX_IMAGES = 1000; // Google's limit per page entry.

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Absolute address of a photo: bundled pictures live under the site, uploads on the media host. */
export function absolutePhotoUrl(src: string, siteUrl: string): string {
  const url = photoUrl(src);
  return /^https?:\/\//.test(url) ? url : `${siteUrl.replace(/\/$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
}

/**
 * Google image sitemap for the home page: every visible portfolio photo, from every tab, so photos
 * that only appear after a visitor switches tab (or that were added in the editor) are still found.
 */
export function buildImageSitemap(siteUrl: string, tabs: { photos?: PortfolioPhoto[] }[]): string {
  const seen = new Set<string>();
  const images: string[] = [];
  for (const tab of tabs) {
    for (const photo of tab.photos ?? []) {
      if (isPhotoHidden(photo) || !photo.src) continue;
      const loc = absolutePhotoUrl(photo.src, siteUrl);
      if (seen.has(loc) || images.length >= MAX_IMAGES) continue;
      seen.add(loc);
      const caption = photoCaption(photo).trim();
      const alt = (photo.alt ?? "").trim();
      images.push(
        `    <image:image>\n      <image:loc>${esc(loc)}</image:loc>` +
          (caption ? `\n      <image:title>${esc(caption)}</image:title>` : "") +
          (alt ? `\n      <image:caption>${esc(alt)}</image:caption>` : "") +
          `\n    </image:image>`,
      );
    }
  }
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
    `  <url>\n    <loc>${esc(siteUrl)}</loc>\n${images.join("\n")}\n  </url>\n</urlset>\n`
  );
}
