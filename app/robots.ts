import type { MetadataRoute } from "next";
import { site } from "@/lib/content";

export default function robots(): MetadataRoute.Robots {
  // Staging copies set ROBOTS_NOINDEX=1 so they are never indexed as a duplicate
  // of the real site. Unset (production) = unchanged behavior.
  if (process.env.ROBOTS_NOINDEX === "1") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/"],
    },
    sitemap: [`${site.url}/sitemap.xml`, `${site.url}/image-sitemap.xml`],
    host: site.url,
  };
}
