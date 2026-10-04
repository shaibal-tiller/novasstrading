# One admin door: website editor + assets module

Status: **building on STAGING only** (`staging.novasstrading.com`). Nothing runs against the live site, the live
Vercel project, live mail, or the current assets app. Production phases below stay on paper until you say otherwise.
Written 2026-10-04 after reading both codebases, the live deployments and the cPanel backup.

## 1. What exists today (verified, not assumed)

| | Website editor (the content portal) | Assets module ("Nova SS Asset Manager") |
|---|---|---|
| Code | this repo, branch `admin-content-portal-rebuild` | `github.com/novasstrading/inventory` (**public**), app in `web/`, legacy PHP in `server-upload/` |
| Stack | Next 14.2 + PHP/MySQL API on cPanel | Next 16, Tailwind 4, Drizzle ORM |
| Runs at | `staging.novasstrading.com/admin/content` (staging only) | `novass-inventory.vercel.app` **standalone** (its own Vercel project, deployed by CLI, not linked to Git) |
| Login | one admin, password or emailed code, PHP session | emailed 6-digit code, **multi-user** with roles `admin`/`viewer`, DB-backed sessions, rate limits, revocable users, "Access" page |
| User store | PHP table `admins` (portal DB) | MySQL table `users` in DB `novasst1_nova_assets` |
| Data | MySQL (content) + files on cPanel disk | MySQL `novasst1_nova_assets` (reached **from Vercel over the internet**), encrypted files via FTPS in `~/nova_secure_files` |
| Cookie | `nova_admin_session` | `nova_session` (httpOnly, 30 days) |

Facts that shape the plan:

1. **The "mount it at /admin/inventory" design was never switched on.** The live site returns 404 for `/admin/*`; the live Vercel project has no `INVENTORY_URL`. Users reach the assets app directly on its `vercel.app` address, which redirects to `/login` at its root (so it was built with an empty base path).
2. **The new assets app has almost no real data.** In the 2026-10-02 database backup: assets 0, photos 0, documents 0, history 0; 2 users (`it-support@`, `admin@`), 9 employees, 21 starter categories, 1 location. The legacy PHP system (`assets.novasstrading.com`, folder `public_html/inventory/systems`) holds the only "real" records: `inventory.json` is **2 KB**, `employees.json` 413 bytes, 2 employee photos, 1 sticker. This is a small, early-stage dataset - migrating (or re-entering) it is low risk.
3. **Both apps already email codes through Brevo**, with different sender addresses (`noreply@` vs `no-reply@`).
4. The website's canonical host is `www.novasstrading.com` (the bare domain redirects to it), so the admin door will live at `https://www.novasstrading.com/admin`.

## 2. Findings to act on (independent of this project)

| # | Finding | Severity | Suggested action |
|---|---|---|---|
| F1 | `assets.novasstrading.com` serves a **public directory listing** (shows `api.php`, `auth.php`, `config.php`, `users.php`, `data/`, `__MACOSX/`). Code runs without leaking source and `data/` is blocked (403), so no data is leaked - but the structure is exposed. | Medium | `Options -Indexes` in that folder's `.htaccess`, delete `__MACOSX/`; retire the whole legacy site after migration. |
| F2 | MySQL **port 3306 is open to the internet** (needed because Vercel connects remotely), the server has **SSL disabled** (`have_ssl=DISABLED`, so the connection is unencrypted) and DB users are granted from any host (`@'%'`). A strong password is the only guard. | **High** for production | Ask Exonhost to enable TLS, or route DB access through an HTTPS API on cPanel and close 3306. Fine for throwaway staging data. |
| F3 | The inventory repo is **public**. History scanned: no leaked keys or passwords. It still exposes internal architecture and the legacy PHP code. | Low | Make it private. |
| F4 | The two encryption keys (`FIELD_ENCRYPTION_KEY`, `FILE_ENCRYPTION_KEY`) exist only as hidden Vercel variables. If they are not in a password manager, deleting or recreating that Vercel project makes all encrypted employee details and stored files **unrecoverable**. | High if not backed up | Confirm they are saved. Do not recreate the project without them. |
| F5 | The 8 GB cPanel backup you downloaded is **incomplete** (525 MB, archive truncated) and the server copy was deleted. The database dump inside is complete. | Info | Take a fresh, smaller backup (database dumps + the two folders that matter) before any change. |

## 3. Target design

```
 www.novasstrading.com
 |-- /                  public marketing site (unchanged)
 |-- /admin             the ONE door: sign in, then choose a module
 |-- /admin/content/*   Website editor      (this repo, main Vercel project)
 |-- /admin/inventory/* Assets module       (inventory repo, own Vercel project, mounted by rewrite)
```

**One identity, two modules, one door.**

- **Identity = the assets app's `users` table.** It already has everything a real admin system needs (multi-user, roles, revocation, code expiry, attempt limits, rate limits, an Access page). We add a per-user list of modules they may open (`website`, `assets`). The PHP `admins` table is retired.
- **Sign-in** = type your registered email, receive a 6-digit code (10 min, 5 attempts, 60 s resend), enter it. One session cookie (`nova_session`, 30 days, httpOnly, Secure) is valid for both modules because they sit on the same host.
- **After sign-in**: `/admin` shows the modules you may use - **Website** pre-selected as the default, **Assets** beside it; if you only have one, you go straight in. Each module has a "Switch module" link and "Sign out" (signs out of both).
- **The main app never touches the database.** It asks the assets app "is this session valid, and which modules?" (the assets app already has `/api/auth/me`), caching the answer for ~60 s. Database credentials stay in one place.
- **The PHP content API keeps working unchanged.** After checking the session, the main app mints the short-lived signed token the API already understands.
- **Close the second door**: the assets app is rebuilt with base path `/admin/inventory` and refuses requests that did not arrive through the main domain, so `novass-inventory.vercel.app` stops being a parallel entrance.

Why not merge the assets app into the website's codebase? It runs Next 16 + Tailwind 4; the live site runs Next 14 + Tailwind 3. Merging means upgrading the live public site first - real risk for no gain. Multi-Zones (what Next.js recommends for exactly this) keeps both independent.

Break-glass: if the email service is down nobody can sign in. A documented recovery path (re-seed an admin from the cPanel Terminal) exists; no permanent second login door is kept.

## 4. Work, by place

**Main repo (this repo)** - `/admin` shell: sign-in page (calls the assets app's code endpoints), module chooser, `/admin/content` guard using the shared session, token minting for the PHP API, rewrites for `/admin/inventory`, module switcher and sign-out in the editor, remove the old password login page.

**Inventory repo** - additive DB migration (`modules` per user); `/api/auth/me` returns modules; module check on its pages and API; Access page gets module toggles; redirect its own `/login` to `/admin`; refuse requests not coming through the main domain; unify the email sender; build with base path.

**cPanel** - staging database and FTP folder for rehearsal; later, backups and legacy shutdown.

**Vercel / DNS** - a staging copy of the assets project; env variables; no DNS changes needed.

## 5. Phases (updated 2026-10-04: staging only; legacy is optional)

You decided: nothing touches `novasstrading.com` for now, and the old `assets.novasstrading.com` system is **not required**
(it may be replaced or its subdomain deleted later). So there is **no legacy data migration** and no work on the old site.

| Phase | What | Touches production? |
|---|---|---|
| 1 | **Staging copy of the assets module**: its own Vercel project (`novass-inventory-staging`), the existing staging database (new tables only), new throwaway keys; mounted at `staging.novasstrading.com/admin/inventory` | **No** |
| 2 | **Build the door** on branches in both repos; unit tests | **No** |
| 3 | **Rehearse on staging**: scripted checks (code login, wrong code, rate limit, module gating, switch module, sign out of both, content editing still works, assets create/transfer still work) + you clicking through | **No** |
| 4 | *(later, only on your word)* **Production cutover**: new keys saved first, production env, merge to `main` (after you ask three times) | Yes |
| 5 | *(later, optional)* Retire the legacy `assets.novasstrading.com` site and subdomain | Yes |

Open security item before any production use: the assets app's database connection is **not encrypted** (MariaDB has SSL
disabled) and the DB user is allowed from any host. Options: ask Exonhost to enable TLS for MySQL; or route database access
through an HTTPS API on cPanel (like the website editor already does) and close port 3306; or use a managed database.

## 6. Decisions (recorded 2026-10-04)

| # | Question | Answer | Effect on the plan |
|---|---|---|---|
| 1 | Sign-in method | **Email code only** | No password anywhere in the new door; the old password login is removed. |
| 2 | Who gets in | **`it-support@` and `admin@`, both modules** | No new accounts now; the Access page can add people later. |
| 3 | Real data in the new assets app? | **No - still testing** | Phase 4 is a small, low-risk import; no live data to protect during cutover. |
| 4 | Encryption keys saved? | **Not sure / no** | See below. |

### Handling the encryption keys (decision 4)

The current keys exist only as hidden Vercel variables and cannot be read back. Because the new app holds **only trial data** (9 trial employees; assets, photos and documents are empty), the safe fix is **not to depend on those keys at all**:

1. Generate two **new** keys (`openssl rand -base64 32`, twice) and **save them in a password manager before anything else**.
2. Use them for the staging copy (Phase 1) so the process is rehearsed.
3. At cutover, set the same new keys on the production assets project. The 9 trial employees' encrypted contact fields become unreadable - they are re-entered (or replaced by the legacy import in Phase 4). Nothing of value is lost, and from then on the keys are safely backed up.

If the 9 employees turn out to be real people whose details matter, tell me before Phase 5 and we will handle that differently.

## 7. Not in scope (deliberately)

Redesigning either module, changing how photos/documents are stored, moving to another host, closing MySQL port 3306 (flagged, longer term).

## 8. Added scope (decided 2026-10-04)

| Item | Decision | Notes |
|---|---|---|
| Analytics module | **Google Analytics 4 + Search Console**, shown as a third module in `/admin` | Read-only via a Google service account (Viewer on the GA4 property, user on the Search Console property); key held only as a hidden Vercel variable. Tracking tag loads on the **production** site only; staging uses a separate test property. |
| Cookie consent | **Small Accept / Decline banner**; GA4 loads only after Accept | Needed for EU/UK visitors. |
| Weekly backups | **Google Drive + a private GitHub repo** | Weekly cron on cPanel: dump both databases locally (no network exposure), archive uploaded files + encrypted asset files, encrypt the archive with `age` (private key kept offline by you), upload to Drive (rclone, your Google account); the small encrypted DB dumps also go to a private GitHub repo. Nothing is left on the hosting disk afterwards. Retention: 12 weekly + 6 monthly. A restore drill into staging proves the backups work. |
| Legacy `assets.novasstrading.com` | **Untouched until after the real production deploy is tested; deleted only if you then choose to** | Not used by the new system. |
