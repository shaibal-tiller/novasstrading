# Production cutover plan: staging → www.novasstrading.com

Written 2026-10-09. **A plan only: nothing in here has been done to production.** Staging
(`staging.novasstrading.com`) is the finished rehearsal; this moves exactly what it does to the real site.

## Ground rules (from the owner, unchanged)

1. **The live site must not go down**, at any point, even for a minute.
2. **Webmail, mail and `public_html` are never touched.**
3. **Nothing is merged to `main` until the owner has asked three times.** `main` deploys to production.
4. **Nothing is deleted until production has been stable for a week**, and each deletion is confirmed one by one.

## Why the live site cannot be interrupted

| Safeguard | How it works |
|---|---|
| Build everything *beside* the live site | The new database, API subdomain, Assets project and Google settings are created first. The live site does not know about them yet. Adding settings to the live Vercel project changes nothing until it is rebuilt. |
| The site survives a broken backend | `lib/content-data.ts`: if the content API is unreachable or the database is empty, the page is built from the content bundled in the code (what the site shows today). A wrong setting cannot blank the page. |
| Vercel never swaps to a half-built site | A new version is built completely before it is used. |
| **Staged switch** | Before merging, "auto-assign production domains" is switched **off** on the live project. The merge then builds the new version **without** putting it on www. We test the built copy, and only then press **Promote** (one click). |
| **One-click undo** | The current live deployment (built 15 Sep) stays available. "Instant Rollback" in Vercel puts it back in seconds, with no rebuild. |
| Mail is out of the blast radius | Only one new subdomain and one new database/user are added on cPanel. No mail, DNS-for-mail or `public_html` change. (Search Console already added one harmless TXT record.) |

## Decisions needed from the owner (recommended answers first)

| # | Question | Recommendation | Why |
|---|---|---|---|
| D1 | Database for production | **A new, empty database** (e.g. `novasst1_portal`) with its own strong password | Mirrors staging exactly (proven). Leaves the old assets database `novasst1_nova_assets` completely untouched. |
| D2 | Assets (inventory) app | **A new Vercel project** from the `unified-admin` code, with new encryption keys saved in the Passwords app first | The old `novass-inventory.vercel.app` keeps working until you retire it; no interruption for anyone using it. The 9 trial employees are simply re-entered. |
| D3 | API address | `content-api.novasstrading.com` | Same pattern as staging. |
| D4 | Carry staging data over? | **No.** Production is filled from the content in the code (`migrate:content`, `migrate:photos`) | Staging differs from the code only by two test leftovers ("hello" subject, one trashed card). Nothing real to carry. Confirm nothing on staging is wanted. |
| D5 | Privacy policy | Owner (and ideally a lawyer) reads `/privacy` before go-live | It is a draft. |
| D6 | Location lookup in the contact form (ip-api.com, unencrypted) | Remove it or replace it later | Not blocking. |

## Phases

### A. Prepare (no impact on anything live)
- [x] Contact-form email fix (`fix/contact-email-escaping`) merged into the branch: it was never on live.
- [ ] Final staging run of the automated checks; freeze the branch; tag it `v-prod-1`.
- [ ] A **fresh full backup** of the live account state (database dumps + `nova_secure_files`), downloaded and test-opened. (The earlier cPanel backup was incomplete.)
- [ ] Save these in the Passwords app first: new DB password, API key, session secret, the two encryption keys.

### B. Backend on cPanel (new things only)
1. MySQL Databases: new database + user (all privileges on that one database only).
2. Subdomains: `content-api.novasstrading.com` with document root `~/content-api/public` (AutoSSL).
3. Terminal: copy the API from the `novass-src` clone, `composer install --no-dev`, create `.env.php` (DB login, API key, session secret).
4. MultiPHP Manager: set that domain to **ea-php81**; check `/diag` shows `gd` and `webp_encoder` true.
5. Import `schema.sql`; `curl …/health` returns ok.
6. Cron: weekly cleanup (**dry-run first**) and the weekly backup with `production.conf` (database + `public/media`, same Drive/GitHub as staging; the `NovaSS-Backups/production` folder).

### C. Fill production with content (from the Mac)
- `npm run migrate:content` and `migrate:photos` against the new API; `verify:content` must print only `OK`.
- Admin accounts `it-support@` and `admin@` created in the new Assets database with both modules (seed script).

### D. Assets app for production
- New Vercel project from the inventory repo (`unified-admin` merged to its `main`), env: database, **new** field/file keys, Brevo key, `MAIL_FROM`, `NEXT_PUBLIC_APP_URL=https://www.novasstrading.com/admin/inventory`, base path `/admin/inventory`, login URL `/admin/login`, and the **FTP settings for its file storage** (not exercised on staging: test an asset photo upload during the rehearsal).
- Run the database migrations; sign in directly at the new project's own address to check it.

### E. Live Vercel project settings (take effect only on the next deploy)
Add, Production scope: `CPANEL_API_URL`, `CPANEL_API_KEY`, `CPANEL_SESSION_SECRET`, `INVENTORY_URL`, `NEXT_PUBLIC_MEDIA_BASE_URL`, `GOOGLE_SERVICE_ACCOUNT_JSON` (hidden), `GA4_PROPERTY_ID`, `GSC_SITE_URL`, `GA4_HOSTNAME=www.novasstrading.com`, `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-HSV21GFZG3`. **Not** `ROBOTS_NOINDEX`. Check that the existing `BREVO_API_KEY` is a working key (an earlier key was disabled) and test the contact form.

### F. The switch (only after the owner has asked three times)
1. Turn **off** "auto-assign production domains" on the live project (setting only).
2. Merge the branch into `main` (the two older project copies, `-v2` and `-v3`, also build; they serve nothing important).
3. Open the **built-but-not-live** deployment and run the smoke tests: home page, portfolio, contact form, `/privacy`, 404 form, `/admin` sign-in with an emailed code, Website editor, Analytics, Assets.
4. **Promote** it to www. Within a minute re-run the same checks on www.
5. Turn auto-assign back **on**.

### G. After the switch
- First hour: watch the site and the sign-in. Real-time view in Google Analytics shows your own visit after you press Accept.
- Submit the sitemap in Search Console; check `robots.txt` and `/sitemap.xml`.
- Next Sunday: confirm the first production backup arrived in Drive and GitHub.
- Re-enable nothing else; leave the legacy assets site alone.

## Rollback

| Problem | Undo | Time |
|---|---|---|
| Anything wrong after promote | Vercel → Deployments → previous deployment → **Instant Rollback** | seconds |
| Wrong env value | Fix the value, redeploy (the page already falls back to bundled content meanwhile) | minutes |
| API / database problem | Nothing to undo for visitors: the page falls back to bundled content; fix the API at leisure | none |
| Assets problem | The old `novass-inventory.vercel.app` project is still there | none |

## G2. Deleting the waste (only when production has been stable for ~7 days; one confirmation per group)

| Group | Items | Notes |
|---|---|---|
| Staging site | Vercel projects `novasstrading-staging` and `novass-inventory-staging`; the `staging.novasstrading.com` domain and its DNS CNAME | Take a last backup first. |
| Staging server | cPanel: subdomain `content-api-staging.novasstrading.com` and its folder `~/content-api-staging`; database `novasst1_portal_stg` and user `novasst1_portal`; the old weekly cron lines; `~/.nova-backup/staging.conf`; Drive/GitHub `staging/` folders | Keep the final staging backup for 30 days, then delete it. |
| Local files | `.env.staging`, `.env.inventory-staging`, `.claude/worktrees/`, scratch folders in `/tmp` | **Keep** `~/novass-backup-age-key.txt` and `~/novass-secrets/`. |
| Old Git branches | `admin-inventory-mount`, `cloned-approach`, `mirror-clone`, `mobile-responsive-pass`, `products-content-update`, `v2`, `worktree-hero-company-headline`, plus the feature branches once merged | Each is 0–2 commits from `main`; check once more before deleting. |
| Old Vercel projects | `novasstrading-v2`, `novasstrading-v3` (they rebuild on every push) | The owner decides; they look unused. |
| Legacy assets | `assets.novasstrading.com` (folder `public_html/inventory/systems`), the old `novass-inventory` project and database `novasst1_nova_assets` | **Owner's choice, later.** Has an exposed directory listing (fix with `Options -Indexes` if it stays). |
| **Never deleted** | Webmail, `mail/`, `public_html`, production anything, the backups, the age key | |

## Known risks to carry into production
- **MySQL has no encryption in transit and port 3306 is open to any address** (Exonhost; Vercel has no fixed IPs). Ask Exonhost to enable TLS; a strong password is the only guard until then.
- **Assets file uploads** (FTP storage) were not exercised on staging.
- **Brevo sender**: `no-reply@` is not an approved sender; emails currently go out, but the branded template and an approved sender are still to do.
- **Live contact-form delivery** is unverified until it is tested once.
- The backup tool's built-in Google connection is being retired in 2026: replace it with our own client.
