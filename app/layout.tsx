import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { PageParticles } from "@/components/PageParticles";
import { site } from "@/lib/content";
import { getContent } from "@/lib/content-data";
import { safeJsonForScript } from "@/lib/safe-json";
import "./globals.css";

// Cookie banner + GA4, only on a build with a measurement ID. The value is
// inlined at build time (next.config.mjs `env`), so without one this require
// is dead code and none of the banner's JS is bundled. (A static import —
// or next/dynamic — would always ship code.)
const ConsentBanner: typeof import("@/components/ConsentBanner").ConsentBanner | null = process.env
  .NEXT_PUBLIC_GA_MEASUREMENT_ID
  ? require("@/components/ConsentBanner").ConsentBanner
  : null;

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hanken",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

// Always the production site URL (never a *.vercel.app preview hostname), so
// link previews and structured data point at the real domain.
const ogImageUrl = `${site.url}/og-image.jpg`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#16191F",
};

const baseMetadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name }],
  generator: "Next.js",
  keywords: [
    "Garments Buying House",
    "Bangladesh",
    "Apparel Sourcing",
    "Knitwear",
    "Woven",
    "Sweaters",
    "Lingerie",
    "RMG Supply Chain",
    "Nova SS Trading",
    "Womenswear",
    "Menswear",
    "Kidswear",
    "Trims",
    "Fabrics",
  ],
  category: "business",
  alternates: {
    canonical: site.url,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: site.url,
    siteName: site.name,
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: `${site.name} — ${site.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
    images: [{ url: ogImageUrl, alt: `${site.name} — ${site.tagline}` }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

/**
 * The Google snippet comes from the content store (Site Info -> "Meta description" in the admin
 * portal), so it can be edited without a deploy. Falls back to the text bundled with the code when
 * the API is unreachable, the field is empty, or the value is unusable.
 */
async function liveDescription(): Promise<string> {
  try {
    const d = (await getContent()).site.description?.trim();
    if (d && d.length >= 40 && d.length <= 320) return d;
  } catch {
    // getContent already falls back to bundled content; this is only a last guard.
  }
  return site.description;
}

export async function generateMetadata(): Promise<Metadata> {
  const description = await liveDescription();
  return {
    ...baseMetadata,
    description,
    openGraph: { ...baseMetadata.openGraph, description },
    twitter: { ...baseMetadata.twitter, description },
  };
}

const buildJsonLd = (description: string) => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${site.url}/#organization`,
      name: site.name,
      legalName: site.legalName,
      url: site.url,
      description,
      email: site.email,
      telephone: site.phone,
      logo: {
        "@type": "ImageObject",
        url: `${site.url}/logo.png`,
        width: 500,
        height: 500,
      },
      image: ogImageUrl,
      sameAs: [site.social.linkedin],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone: site.phone,
        email: site.email,
        areaServed: "Worldwide",
        availableLanguage: "English",
      },
      address: {
        "@type": "PostalAddress",
        streetAddress: site.address.street,
        addressLocality: site.address.city,
        postalCode: site.address.postalCode,
        addressCountry: "BD",
      },
    },
    {
      "@type": "LocalBusiness",
      "@id": `${site.url}/#localbusiness`,
      name: site.name,
      image: ogImageUrl,
      url: site.url,
      telephone: site.phone,
      priceRange: "$$",
      address: {
        "@type": "PostalAddress",
        streetAddress: site.address.street,
        addressLocality: site.address.city,
        postalCode: site.address.postalCode,
        addressCountry: "BD",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: site.name,
      description,
      publisher: { "@id": `${site.url}/#organization` },
      inLanguage: "en",
    },
  ],
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const jsonLd = buildJsonLd(await liveDescription());
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${hanken.variable} ${plexMono.variable}`}
    >
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory"
        >
          Skip to content
        </a>
        <PageParticles />
        {children}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: safeJsonForScript(jsonLd) }}
        />
        {/* Analytics + cookie banner: only when a GA4 measurement ID is configured. */}
        {ConsentBanner && gaMeasurementId ? <ConsentBanner measurementId={gaMeasurementId} /> : null}
      </body>
    </html>
  );
}
