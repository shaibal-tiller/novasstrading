# novasstrading

Nova SS Trading — Premier garments buying house and single-window partner for premium trims, accessories, and fabrics in Bangladesh.

## Setup

1. Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your real Brevo API key:
   ```
   BREVO_API_KEY=your-real-key-here
   ```

3. Upload all files to your PHP-enabled web server.

## Security Features

- **CSRF Protection** — Session-bound tokens via `get_csrf.php`
- **Rate Limiting** — 3 submissions/hour per IP, 2-hour block on abuse
- **Honeypot Field** — Invisible trap catches automated bots
- **IP Resolution** — Cloudflare & proxy-aware real IP detection
- **Bot Scoring** — 5-signal spam detection (UA, locale, CSRF, message length, URLs)
- **Geo Lookup** — Free IP geolocation via ip-api.com
- **Environment Variables** — API keys stored in `.env`, never in source code
