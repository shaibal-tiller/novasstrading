# Deployment & Setup — novasstrading.com

The site runs on **Vercel**, with the custom domain pointed straight at it.
No Cloudflare, no failover layer — the simplest reliable setup.

```
Visitor → novasstrading.com  ──DNS──►  Vercel  (serves the site + /api/contact)
                    email (MX, DKIM) stays on Exonhost, untouched
```

Total time ≈ 20 minutes. Do the parts in order.

---

## What you have

| Piece | Role |
|---|---|
| **Namecheap** (or your registrar) | Where the domain was bought. Holds the *nameservers*. |
| **Exonhost** | Current DNS host **and** email host (cPanel). Keeps running email. |
| **Vercel** | New web host for the site. |
| **Brevo** | Sends the contact-form emails (already set up). |

The plan: **keep DNS and email on Exonhost**, and just repoint the two *web*
records (apex + `www`) to Vercel. Email keeps working because we don't touch
the MX / DKIM / SPF records.

---

## Step 0 — Find where your DNS actually lives

Before editing anything, confirm which system answers DNS for the domain, or
you'll edit records in a place that isn't live.

1. Go to your **registrar** (Namecheap → Domain List → **Manage** → *Nameservers*).
2. Look at the nameservers:
   - They contain **`exonhost`** (e.g. `ns1.exonhost.com`) → **DNS is at Exonhost.** Edit records in **Exonhost cPanel → Zone Editor** (Part 3 below). ✅ recommended
   - They contain **`cloudflare`** → you started a Cloudflare setup. Either finish it there (add the same records in Cloudflare's DNS tab), **or** switch the nameservers back to Exonhost's and use Part 3. Pick one place and stick to it.
   - They contain **`namecheap`** (BasicDNS) → DNS is at Namecheap; edit records in **Namecheap → Advanced DNS** using the same values as Part 3.

> This guide assumes **DNS at Exonhost** (the common case, since your email
> already lives there). The record *values* are identical wherever you add them.

---

## Part 1 — Vercel project

1. Sign in at [vercel.com](https://vercel.com) with GitHub.
2. **Add New → Project** → import `shaibal-tiller/novasstrading`.
   Framework auto-detects as **Next.js**; leave all build settings default.
3. Before the first deploy, open **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `BREVO_API_KEY` | your Brevo API key |
   | `CONTACT_EMAIL` | `info@novasstrading.com` |
   | `SITE_NAME` | `Nova SS Trading` |
   | `SITE_DOMAIN` | `novasstrading.com` |

   (Get the Brevo key from [app.brevo.com → SMTP & API → API Keys](https://app.brevo.com/settings/keys/api).)
4. **Deploy.** You'll get a working URL like `novasstrading.vercel.app` —
   verify the site loads there before touching DNS.

## Part 2 — Add the custom domain in Vercel

1. Project → **Settings → Domains**.
2. Add **`www.novasstrading.com`** → Vercel marks it the primary domain.
3. Add **`novasstrading.com`** → choose **Redirect to www** when prompted
   (so both addresses work and `www` is canonical, matching the site's SEO).
4. Vercel now shows the DNS records it needs. They will be:

   | For | Record type | Value |
   |---|---|---|
   | `www` | **CNAME** | `cname.vercel-dns.com` |
   | apex (`novasstrading.com`) | **A** | `76.76.21.21` |

   > Vercel may show a slightly different apex IP — **use whatever Vercel
   > displays on your screen**, not this number, if they differ.

## Part 3 — Update DNS at Exonhost

Exonhost **cPanel → Zone Editor →** manage `novasstrading.com`.

**Change these two web records** (they currently point to `103.159.37.70`):

| Name | Change to |
|---|---|
| `novasstrading.com` (A, apex) | A → **`76.76.21.21`** (the value Vercel showed) |
| `www` | CNAME → **`cname.vercel-dns.com`** (delete the old `www` A/CNAME first) |

**Leave every other record exactly as-is** — these keep email alive:

- `MX` (mail delivery)
- `brevo1._domainkey`, `brevo2._domainkey` (CNAME — Brevo DKIM)
- `TXT` SPF (`v=spf1 …`) and the `brevo-code` verification
- `mail`, `ftp`, `webmail`, `whm`, `webdisk`, `cpcalendars` (cPanel services)

> **Do not change the nameservers.** We're only editing records, so email and
> cPanel stay on Exonhost untouched. If you switched nameservers to Vercel,
> Vercel can't host your MX/DKIM and email would break.

DNS changes propagate in minutes to a couple of hours.

## Part 4 — SSL & verification

1. Back in **Vercel → Settings → Domains**, both domains flip to **Valid /
   Ready** once DNS resolves. Vercel issues the HTTPS certificate
   automatically — no action needed.
2. Open **https://www.novasstrading.com** — the site should load over HTTPS.
3. Open **https://novasstrading.com** — it should redirect to `www`.

## Part 5 — Post-launch checks

- [ ] **Contact form** — submit a real inquiry; confirm the admin email
      arrives at `info@novasstrading.com` **and** the auto-reply reaches the
      sender. (If nothing arrives: check `BREVO_API_KEY` in Vercel and that
      the Brevo sender domain is verified.)
- [ ] **Email still works** — send a test message to `info@novasstrading.com`
      from an outside account; confirm it's received in Exonhost webmail.
      (Proves the DNS edit didn't disturb email.)
- [ ] **Map, lightbox, mobile carousel** — click through once on a phone.
- [ ] **SEO** — visit `https://www.novasstrading.com/sitemap.xml` and
      `/robots.txt`; both should render.
- [ ] **Analytics** — follow [`ANALYTICS_SETUP_GUIDE.md`](./ANALYTICS_SETUP_GUIDE.md)
      to connect GA4 / Search Console, and submit the sitemap in Search Console.

---

## Updating the site later

Every push to the **`main`** branch on GitHub redeploys automatically —
usually live within a minute. No manual step, no re-upload. To change copy,
edit `lib/content.ts`, commit, and push.

## Rollback

Vercel → **Deployments** → pick a previous successful deploy →
**⋯ → Promote to Production**. Instant revert, no rebuild.

## Cost

| Piece | Plan | Cost |
|---|---|---|
| Vercel | Hobby | $0 |
| Exonhost | existing (DNS + email) | already paid |
| Brevo | free tier (300 emails/day) | $0 |
