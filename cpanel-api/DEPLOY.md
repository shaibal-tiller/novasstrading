# Deploying cpanel-api to Exonhost

One-time setup:

1. In cPanel → Domains → **Create a subdomain**, e.g. `content-api.novasstrading.com`,
   with document root `/home/novasst1/content-api/public`.
2. In cPanel → **MySQL Databases**, confirm `novasst1_nova_assets` exists (it already
   does). Note the DB username/password (create one via **MySQL Databases** if none
   exists yet, and grant it ALL PRIVILEGES on `novasst1_nova_assets`).
3. Upload this entire `cpanel-api/` directory to `/home/novasst1/content-api/`
   (excluding `tests/`, `.env.testing.example`, and anything in `.gitignore`) via
   cPanel File Manager or FTP.
4. Run `composer install --no-dev` — either via cPanel's Terminal (if SSH/Terminal
   access is enabled on the account) or by uploading a pre-built `vendor/` directory
   built locally with `composer install --no-dev` before upload, since production
   never needs PHPUnit.
5. Create `/home/novasst1/content-api/.env.php` (**outside** `public/`, so it is
   never web-accessible) with real values:
   ```php
   <?php
   putenv('DB_DSN=mysql:host=localhost;dbname=novasst1_nova_assets;charset=utf8mb4');
   putenv('DB_USER=<the db user created in step 2>');
   putenv('DB_PASS=<its password>');
   putenv('API_KEY=<a long random string, also set as CPANEL_API_KEY in Vercel>');
   putenv('SESSION_SECRET=<a different long random string>');
   putenv('BREVO_API_KEY=<the Brevo transactional-email API key used to send OTP login codes>');
   ```
   `BREVO_API_KEY` is required for the "email me a code" login path
   (`AuthController::requestOtp`) — without it, PHP logs
   `BREVO_API_KEY not set — OTP email not sent` and silently skips sending the
   email, while the login UI still advances to the code-entry screen (PHP
   intentionally never reveals send failures to the client, to avoid leaking
   whether an email is valid). The hardcoded sender address
   (`noreply@novasstrading.com`, see `AuthController::OTP_FROM_EMAIL`) must be
   a Brevo-verified sender or Brevo will reject the send.
6. Import the schema: phpMyAdmin → `novasst1_nova_assets` → SQL tab → paste the
   contents of `schema.sql` → Go.
7. Create the one admin account: via cPanel Terminal, `php scripts/create-admin.php
   it-support@novasstrading.com <a strong password>` — or run the same script
   locally against production by temporarily pointing `DB_DSN`/`DB_USER`/`DB_PASS`
   at the production database over `ssh -L` port forwarding, if Terminal access
   isn't available. `it-support@novasstrading.com` is the only email the system
   will ever accept — `AuthController::login()` rejects any other email
   (`ADMIN_EMAIL`) before ever touching the database, so creating an admin row
   under any other address is a no-op the login endpoint will never reach.
8. Verify: `curl https://content-api.novasstrading.com/health` → `{"ok":true}`.
9. In the Vercel project (this Next.js app) → Settings → Environment Variables, add
   `CPANEL_API_URL=https://content-api.novasstrading.com`,
   `CPANEL_API_KEY=<the same value as API_KEY above>`, and
   `NEXT_PUBLIC_MEDIA_BASE_URL=https://content-api.novasstrading.com` (same value
   as `CPANEL_API_URL` — public because it's read by a Client Component. Without
   it, every uploaded image/document resolves to `undefined/media/....webp` in
   production).

This step requires cPanel dashboard access — hand-off to the account owner rather
than something an agent can complete unattended.


## Image optimization needs a PHP image extension

Uploads are optimized on this server (see `src/ImageOptimizer.php`). In cPanel -> **Select PHP Version -> Extensions**
enable `gd` (with WebP support) or `imagick`, plus `exif` for phone-photo rotation under GD. Without them uploads
still work but are stored unoptimized.
