#!/usr/bin/env bash
# Builds the static standby bundle for Exonhost.
#
#   ./deploy/build-standby.sh
#
# Output: deploy/standby/ (folder) and deploy/standby.zip (upload this).
# Re-run whenever site content changes so the standby stays in sync.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT=3499
OUT=deploy/standby

echo "▸ Building with STANDBY=1 (unoptimized image URLs)…"
rm -rf .next "$OUT" deploy/standby.zip
STANDBY=1 npm run build >/dev/null

echo "▸ Snapshotting rendered pages…"
npx next start -p $PORT >/dev/null 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT
until curl -sf -o /dev/null "http://localhost:$PORT"; do sleep 0.5; done

mkdir -p "$OUT"
curl -sf "http://localhost:$PORT/"            > "$OUT/index.html"
curl -sf "http://localhost:$PORT/robots.txt"  > "$OUT/robots.txt"
curl -sf "http://localhost:$PORT/sitemap.xml" > "$OUT/sitemap.xml"
kill $SERVER_PID 2>/dev/null || true

echo "▸ Copying build assets and public files…"
mkdir -p "$OUT/_next"
cp -R .next/static "$OUT/_next/static"
cp -R public/. "$OUT/"
cp deploy/standby-src/.htaccess deploy/standby-src/api-contact.php "$OUT/"

echo "▸ Zipping…"
(cd "$OUT" && zip -qr ../standby.zip . -x '.DS_Store')

# Restore the normal (optimized) build so `npm run dev/start` isn't left
# on the standby flavour.
rm -rf .next

echo "✔ deploy/standby.zip ready ($(du -h deploy/standby.zip | cut -f1 | tr -d ' '))"
echo "  Upload its CONTENTS to Exonhost public_html, then set the Brevo"
echo "  key at the top of api-contact.php."
