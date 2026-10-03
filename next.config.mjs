/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
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
    // /admin/inventory/*; the /admin/login rule below just gives that app's
    // login page a shorter, friendlier entry URL via a rewrite (not a
    // redirect), so the browser address bar still shows /admin/login.
    const inventoryUrl = process.env.INVENTORY_URL;
    if (!inventoryUrl) return [];
    return [
      { source: "/admin/login", destination: `${inventoryUrl}/admin/inventory/login` },
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

