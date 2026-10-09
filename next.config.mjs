/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  env: {
    // Always inlined (as "" when unset) so app/layout.tsx's cookie-banner
    // import is dead code on a build without analytics: no banner JS ships.
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "",
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Cache optimized images for 31 days — sources are versioned by filename.
    minimumCacheTTL: 2678400,
    // Whitelist remote hosts for next/image to load from external URLs.
    remotePatterns: (() => {
      const patterns = [];
      const mediaBaseUrl = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;
      if (mediaBaseUrl) {
        try {
          const url = new URL(mediaBaseUrl);
          patterns.push({
            protocol: url.protocol.replace(":", ""),
            hostname: url.hostname,
          });
        } catch (e) {
          console.warn(`Invalid NEXT_PUBLIC_MEDIA_BASE_URL: ${mediaBaseUrl}`);
        }
      }
      return patterns;
    })(),
  },
  async rewrites() {
    // Mounts the separately-deployed inventory app (its own Vercel project,
    // never reached directly by users) under /admin — Next.js Multi-Zones.
    // The inventory app is built with NEXT_PUBLIC_BASE_PATH=/admin/inventory,
    // so every one of its own pages/assets/API calls already resolves under
    // /admin/inventory/*. The shared sign-in door (/admin/login) and the
    // module chooser (/admin) are pages of THIS app; they call the inventory
    // app's /admin/inventory/api/auth/* endpoints through these rewrites.
    const inventoryUrl = process.env.INVENTORY_URL;
    if (!inventoryUrl) return [];
    return [
      { source: "/admin/inventory", destination: `${inventoryUrl}/admin/inventory` },
      { source: "/admin/inventory/:path*", destination: `${inventoryUrl}/admin/inventory/:path*` },
    ];
  },
  async headers() {
    // Staging only (ROBOTS_NOINDEX=1): also say it in a header, which covers every
    // page including the admin portal, not just robots.txt.
    const noindex =
      process.env.ROBOTS_NOINDEX === "1"
        ? [{ source: "/(.*)", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }]
        : [];
    return [
      ...noindex,
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // Static media rarely changes; serve from browser/CDN cache for a week.
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

