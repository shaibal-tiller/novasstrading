// Browsers (and some crawlers) ask for /favicon.ico by default. We ship PNG icons, so point them there.
export function GET(): Response {
  return new Response(null, {
    status: 308,
    headers: { Location: "/favicon.png", "Cache-Control": "public, max-age=86400" },
  });
}
