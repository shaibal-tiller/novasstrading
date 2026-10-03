# Production-like staging on a subdomain

Goal: run the whole portal on real infrastructure (Vercel + Exonhost cPanel) at
`staging.novasstrading.com`, exactly the way production will run, without touching the live
site, the live Vercel project, `main`, the live database, or email.

## Why a separate Vercel project (not a branch preview of the live one)

The three things that make production behave differently from `npm run dev` are the ones we
cannot test locally: Vercel's static/ISR cache and `revalidateTag`, Vercel's image optimizer,
and **calls from Vercel's servers to cPanel** (Exonhost's firewall may treat them differently
from a laptop - we already hit one automatic IP ban today).

A new Vercel project whose *production branch* is `admin-content-portal-rebuild` gives all of
that, and keeps every setting (env vars, domain, protection) away from the live project:

| | Live project (untouched) | New `novasstrading-staging` project |
|---|---|---|
| Production branch | `main` | `admin-content-portal-rebuild` |
| Domain | `www.novasstrading.com` | `staging.novasstrading.com` |
| Content API | none yet | `content-api-staging.novasstrading.com` |
| Env vars | unchanged | its own (below) |

## Steps

### 1. Vercel project (dashboard, ~5 min)
1. Vercel -> **Add New -> Project** -> import `shaibal-tiller/novasstrading`.
2. Name `novasstrading-staging`. Framework: Next.js (auto).
3. **Before the first deploy**, Environment Variables (all scopes):

| Variable | Value |
|---|---|
| `CPANEL_API_URL` | `https://content-api-staging.novasstrading.com` |
| `CPANEL_API_KEY` | staging API key (from `~/content-api-staging/.env.php` on the server) |
| `NEXT_PUBLIC_MEDIA_BASE_URL` | `https://content-api-staging.novasstrading.com` |
| `SESSION_COOKIE_SECRET` | new random string (`openssl rand -hex 32`) - NOT the local one |
| `ROBOTS_NOINDEX` | `1` (keeps Google away from the copy) |
| *(leave unset)* `INVENTORY_URL`, `BREVO_API_KEY` | staging does not need the inventory app or real contact emails |

4. Deploy. Then Settings -> **Git** -> **Production Branch** = `admin-content-portal-rebuild`
   (so every push to that branch redeploys staging; `main` is not involved).
5. Settings -> **Domains** -> add `staging.novasstrading.com`.

### 2. DNS (cPanel -> Zone Editor, ~2 min)
Add ONE record: `staging` CNAME -> the target Vercel shows on the Domains page
(`cname.vercel-dns.com` or a project-specific value). No existing record is changed.
Email (MX/SPF/DKIM) and the main site's records are not touched.

### 3. Make the staging API accept the new origin
Nothing to change: the API authenticates with the API key, not by origin.
Optional hardening before production: restrict `content-api-*` with the key only (already so).

## Tests (run after step 2 is live)

1. **Public site from the database, cached.** `curl -sI https://staging.novasstrading.com`
   -> 200, `x-vercel-cache: HIT` on the second request.
2. **The big one - edit propagates through the real cache.** Edit a title in the portal on
   staging, Confirm, then reload the *public* page: it must change within seconds (this proves
   `revalidateTag` works on Vercel, which `npm run dev` cannot prove).
3. **Vercel -> cPanel reachability.** The edit in step 2 only works if Vercel's servers can
   reach the API. If the page shows the bundled content and never updates, check the staging
   project's function logs for `content API unavailable` (firewall/ban) and ask Exonhost to
   allow Vercel.
4. **Run the automated suite against it:**
   `APP_URL=https://staging.novasstrading.com E2E_PASSWORD=... node --env-file=.env.staging scripts/e2e-staging.mjs`
   (`.env.staging` = same `CPANEL_*` as staging, but `SESSION_COOKIE_SECRET` = the staging
   project's value). 29 checks, restores everything it changes.
5. **Photos:** upload in the portal, confirm AVIF/WebP via `/_next/image`, lazy loading and
   blur on the live page, immutable cache on `/media/...`.
6. **Search engines:** `curl -s https://staging.novasstrading.com/robots.txt` -> `Disallow: /`,
   and `curl -sI ... | grep -i x-robots-tag` -> `noindex, nofollow`.
7. **Webmail and the live site:** open `www.novasstrading.com` and webmail - unchanged.

## Rollback (nothing here touches production)
Delete the Vercel project, remove the `staging` CNAME. Nothing else was changed.

## What is NOT part of this (the real production cutover, later)
- New production DB + user + subdomain `content-api.novasstrading.com`, **new** API key and
  session secret, strong admin password (staging values are throwaway).
- Seed it with `npm run migrate:content`, check with `npm run verify:content`.
- Set the same variables on the live Vercel project (Production scope), then merge to `main`
  - only after you have asked three times.
