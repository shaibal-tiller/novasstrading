import { getContent } from "@/lib/content-data";
import { buildImageSitemap } from "@/lib/image-sitemap";

export const revalidate = 3600;

export async function GET() {
  const { site, portfolio } = await getContent();
  return new Response(buildImageSitemap(site.url, portfolio.tabs), {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
