# One admin door: website editor + assets module

Status: **plan only** - nothing in this document has been changed on any server.
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
| F2 | MySQL **port 3306 is open to the internet** (needed because Vercel connects remotely). Password + TLS are the only guard. | Medium | Strong random DB password, TLS verification on (`DATABASE_SSL=strict`), DB user limited to that one database. Longer term: put DB access behind the cPanel PHP API so 3306 can be closed. |
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

## 5. Phases (each ends with something you can check, and a way back)

| Phase | What | Touches production? | Rollback |
|---|---|---|---|
| 0 | **Safety first**: fresh small backup (DB dumps + legacy data folder + `nova_secure_files` listing), confirm encryption keys are saved, make the inventory repo private, close the directory listing (F1) | Only F1 (a `.htaccess` line) | delete the line |
| 1 | **Staging copy of the assets module**: new staging database + FTP folder + Vercel project from the Git repo, own keys; mounted under `staging.novasstrading.com/admin/inventory` | No | delete the staging pieces |
| 2 | **Build the door** in both repos on branches; unit tests; run on staging | No | nothing deployed to prod |
| 3 | **Full rehearsal on staging**: scripted checks (code login, wrong code, rate limit, module gating, switch module, sign out of both, viewer cannot see Website, revoked user loses access, content editing still works, assets create/transfer/photo/sticker still work) + you clicking through | No | - |
| 4 | **Data**: import the legacy records (about 2 KB) into the new database - on staging first, then production; you spot-check | Production DB (additive) | restore the Phase 0 dump |
| 5 | **Cutover** (after you approve): production env variables, rebuild the assets app with the base path, merge to `main` (only after you ask three times), switch the entry to `/admin` | **Yes** | revert the env change / redeploy previous build; legacy stays up until Phase 6 |
| 6 | **Retire legacy**: shut down `assets.novasstrading.com`, remove old direct URL, weekly cleanup cron on production | Yes | restore from Phase 0 backup |

Nothing in phases 1-3 can affect the live site, mail, or the current assets app.

## 6. Decisions needed from you

1. Sign-in method: email code only, or password **and** code.
2. Who gets in: only `it-support@` and `admin@` (what exists), or also viewers for Assets - and should viewers ever see the Website editor (proposed: no).
3. Is anyone entering real inventory data in the new app today?
4. Are the two encryption keys saved in a password manager?
5. Okay to make the inventory repo private and close the public directory listing?

## 7. Not in scope (deliberately)

Redesigning either module, changing how photos/documents are stored, moving to another host, closing MySQL port 3306 (flagged, longer term).
