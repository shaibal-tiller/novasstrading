# Deployment — novasstrading.com

Final architecture: **Cloudflare (free)** in front, **Vercel** as the primary
origin, **Exonhost** as an automatic standby, failover handled by a
**Cloudflare Worker** on every request.

```
User → Cloudflare (DNS + Worker)
           ├── Vercel healthy?  → serve Vercel          (normal)
           └── 5xx / timeout?   → serve Exonhost        (automatic)
```

Everything below is one-time setup (~30 minutes). Do the parts in order.

---

## Part 1 — Vercel (primary)

1. [vercel.com](https://vercel.com) → **Add New → Project** → import the
   GitHub repo `shaibal-tiller/novasstrading`. Framework auto-detects
   (Next.js); no build settings to change.
2. **Settings → Environment Variables** — add (values from `.env.example`):

   | Name | Value |
   |---|---|
   | `BREVO_API_KEY` | your Brevo API key |
   | `CONTACT_EMAIL` | `info@novasstrading.com` |
   | `SITE_NAME` | `Nova SS Trading` |
   | `SITE_DOMAIN` | `novasstrading.com` |

3. Deploy. Note your production URL, e.g. `novasstrading.vercel.app` —
   the Worker points at this. (You do **not** need to add the custom
   domain in Vercel; Cloudflare owns the domain and the Worker fetches
   the `.vercel.app` URL directly.)
4. Every push to `main` auto-deploys. ✅

## Part 2 — Exonhost (standby)

1. On your machine: `./deploy/build-standby.sh` → produces
   `deploy/standby.zip` (a fully static copy of the site + PHP contact
   endpoint).
2. Exonhost cPanel → **File Manager → public_html** → upload
   `standby.zip` → Extract → delete the zip. (`.htaccess` and
   `api-contact.php` must end up directly inside `public_html`.)
3. Edit `api-contact.php` line 14: paste the same Brevo API key.
4. Note your Exonhost server IP (cPanel right sidebar → *Shared IP
   Address*).

**Keep it fresh:** whenever the site content changes, re-run
`./deploy/build-standby.sh` and re-upload. The standby is a snapshot,
not a live mirror.

## Part 3 — Cloudflare (DNS + Worker)

### 3a. Move the domain to Cloudflare DNS
1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Add a site** →
   `novasstrading.com` → **Free plan**.
2. Cloudflare shows two nameservers. At your **registrar**, replace the
   existing nameservers with those two. (Propagates in minutes–hours.)

### 3b. DNS records
Delete whatever Cloudflare imported for `@` and `www`, then add:

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `@` | `192.0.2.1` | 🟠 Proxied |
| A | `www` | `192.0.2.1` | 🟠 Proxied |
| A | `standby` | *Exonhost server IP* | ⚪ **DNS only** |

Notes:
- `192.0.2.1` is a documentation-reserved dummy — the Worker intercepts
  these hostnames before any origin is contacted, so the IP is never
  used. It just needs a proxied record to exist.
- `standby` **must stay grey-cloud (DNS only)**: the Worker fetches it as
  the fallback origin; proxying it would loop back into the Worker.

### 3c. SSL + Exonhost certificate
- Cloudflare → **SSL/TLS** → mode **Full (strict)**.
- On Exonhost, issue a free AutoSSL/Let's Encrypt cert for
  `standby.novasstrading.com` (cPanel → SSL/TLS Status → Run AutoSSL)
  so the Worker can fetch it over HTTPS.

### 3d. The failover Worker
1. Cloudflare → **Workers & Pages → Create → Worker** → name it
   `novass-failover` → Deploy the hello-world, then **Edit code**.
2. Replace everything with the contents of `deploy/cloudflare-worker.js`.
3. In the code, confirm the two constants:
   - `PRIMARY` = your real Vercel URL (from Part 1 step 3)
   - `BACKUP` = `https://standby.novasstrading.com`
4. **Deploy**, then wire it to the domain: Worker → **Settings →
   Domains & Routes → Add route**:
   - Route `novasstrading.com/*` — zone `novasstrading.com`
   - Route `www.novasstrading.com/*` — zone `novasstrading.com`

### 3e. Extras (optional, free)
- **Caching → Always Online**: On (serves an archived copy in a
  worst-case double failure).
- **Speed → Optimization**: leave Rocket Loader **off** (the site's own
  loading strategy is already tuned; Rocket Loader can break hydration).

---

## How failover behaves

| Scenario | What happens |
|---|---|
| Normal | Worker fetches Vercel, serves it |
| Vercel blip (single request) | That request gets the standby; next ones re-try Vercel |
| Vercel down | First failed request flips a 60s "down" memory — everything (page + all assets) serves from Exonhost instantly, re-probing Vercel each minute |
| Vercel recovers | Next probe succeeds; traffic returns automatically |
| Exonhost also down | Cloudflare *Always Online* serves an archived copy of the homepage |
| Cloudflare down | Nothing to do — global, rare (~minutes/year), affects half the internet |

The standby serves the identical site (same design, all interactions) —
the contact form posts to `api-contact.php`, which delivers via the same
Brevo account, marked "(standby)" in the subject line so you know which
path it came through.

## Testing the failover (do this once after setup)

1. **Normal path:** open `https://novasstrading.com` — response headers
   should NOT contain `x-served-by: standby`.
2. **Standby directly:** open `https://standby.novasstrading.com` — the
   full site should render; submit a test inquiry and confirm the email
   arrives with "(standby)" in the subject.
3. **Forced failover:** in the Worker, temporarily change `PRIMARY` to
   `https://does-not-exist.novasstrading.com`, Deploy, reload the site —
   it should render from Exonhost (check `x-served-by: standby` in
   DevTools → Network). Restore `PRIMARY` and Deploy again.

## Costs

| Piece | Plan | Cost |
|---|---|---|
| Vercel | Hobby | $0 |
| Cloudflare DNS + Worker | Free (100k req/day) | $0 |
| Exonhost | existing hosting | already paid |
| **Total added** | | **$0/month** |
