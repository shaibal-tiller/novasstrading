# Real auth + visual click-to-edit admin portal

Date: 2026-09-09
Branch: `admin-content-portal-impl` (continues on this branch — already isolated from `main`/production; no nested worktree needed)
Spec: this plan's own Context section below is the spec (no separate spec doc — see also the original `docs/superpowers/specs/2026-08-18-admin-content-portal-design.md`, which this work partially supersedes per the Context section).

## Context

The admin content portal already has a complete, tested PHP+MariaDB backend (`cpanel-api/`) — auth, sessions, section/item CRUD, soft-delete/trash, media upload, reorder — and a generic form-based admin UI (`app/admin/content/(guarded)/*`). Neither is merged to `main` or deployed; `novasstrading.com` still serves static content from `lib/content.ts`.

The user tried the generic form UI and wants something more direct instead:
1. **Real auth**, restricted to exactly one account, `it-support@novasstrading.com`: log in with the account's password, OR with a one-time code emailed on request — either method alone is sufficient. Session lasts up to 30 days.
2. **A visual click-to-edit editor**: pick a page section, see it rendered exactly as it looks on the live site (using the real components, real current content), move the cursor over it and the exact piece under the cursor (a text field, an image, a list item) highlights, click it to open a small editor for just that piece (text or media), the section re-renders instantly with the change (client-side preview, no network write yet), and nothing is written to the database until the admin explicitly confirms. Confirming applies exactly the update/add/delete/reorder implied by the diff between what was open and what's now different.

This plan supersedes §8 (Admin UI/UX) and §9 (Auth) of the original design spec; §§1–7 and 10–12 (data model, media/GC discipline, deploy environments, architecture) stand as originally designed and are unchanged by this work.

Two real gaps found while researching the existing code get fixed here as required groundwork, not scope creep:
- **Media URLs don't resolve.** `MediaController::uploadFile` returns a path like `media/ab12....webp`, meant to be served from the cPanel host. But `components/ContentMedia.tsx` (and `Partners.tsx`'s direct `next/image` calls) always resolve `src` against the Next app's own bundled `/public/assets/...`. An uploaded image currently renders as a broken `/assets/media/ab12....webp` URL.
- **"Add item" ignores the target section's shape.** `app/admin/content/(guarded)/items/[section]/new/page.tsx` always seeds `{ title: "", body: "" }` regardless of what the section's items actually look like.

**Explicit scope decision** (ruling, recorded here so no task re-litigates it): several components render images that have no backing content field at all — `About.tsx` (2 images), `Compliance.tsx` (1 QA photo), `Divisions.tsx` (2 index-keyed placeholder images), and `Contact.tsx`'s Google Maps iframe (lat/lng baked into the URL string). These stay static/non-editable in this pass. Promoting them to real fields is a separate follow-up.

**Explicit scope decision on cross-cutting `site` fields** (ruling): `site` (name, contact info, address, socials) is read by many components (Header, Footer, Contact) but has no single visible block of its own on the page. Rather than forcing it into the click-a-visible-thing paradigm, `site` gets its own plain settings-form registry entry ("Site Info", reusing the existing `SectionForm` field-rendering pattern). Everywhere else a component reads `site.*` (Header, Footer, Contact), those fields render as plain, non-interactive context — only the "Site Info" entry can edit them. Likewise `nav` (used by both Header and Footer) is its own registry entry, rendered via Header's layout for its preview; the same `nav.<id>` editable ids work identically wherever they're clicked from, since they address the same underlying `content_items` rows.

## Global Constraints (bind every task)

- `it-support@novasstrading.com` is the only account, enforced server-side in every auth endpoint (case-insensitive compare), not just client-side.
- Session lifetime is 30 days everywhere it's set or verified: PHP `Auth::issueToken` default expiry (`60*60*24*30`) and every Next.js cookie `maxAge` (`60*60*24*30`).
- PHP changes: `cd cpanel-api && vendor/bin/phpunit` must pass (full suite, not just new tests).
- TypeScript/React changes: `npm run test` (Vitest), `npx tsc --noEmit`, and `npm run lint` must all be clean.
- No new runtime dependencies. Follow the codebase's existing no-framework, no-extra-library conventions: PHP has zero runtime deps (`composer.json`'s `require` stays `{"php": ">=8.1"}`); the edit modal and any overlay UI use the same hand-rolled `role="dialog"` fixed-overlay pattern already used in `components/Portfolio.tsx`'s lightbox — do not add Radix/Headless UI/any dialog library.
- Reuse, don't reimplement: the dot-path field-address/set pattern (`setPath` — originally in `components/admin/SectionForm.tsx`, which was deleted as dead code once `EditModal` and `SectionEditor` carried their own copies), `@dnd-kit`'s `arrayMove` for reorder (the old `ItemList.tsx`/`computeReorderedIds` was deleted with the generic route tree in Task 13; `ReorderPanel` is the reorder UI now), the Brevo REST call in `app/api/contact/route.ts`, and every existing function in `lib/cpanel-api.ts` (`getSections`, `getSection`, `updateSection`, `listItems`, `createItem`, `updateItem`, `deleteItem`, `reorderItems`, `listMedia`, `createMedia`, `deleteMedia`, `listTrash`, `restoreItem`) — no task needs to add new PHP CRUD endpoints beyond the OTP ones in Tasks 1–2.
- Money quote for git commits: follow this repo's existing style (`git log` on this branch), one focused commit per task, referencing "Task N" the way the existing branch history already does.

---

### Task 1: PHP — OTP schema, `Auth`, `AdminRepository`

**Files:**
- Modify: `cpanel-api/schema.sql`, `cpanel-api/src/Auth.php`, `cpanel-api/src/Repositories/AdminRepository.php`
- Test: `cpanel-api/tests/AuthTest.php`, `cpanel-api/tests/Repositories/AdminRepositoryTest.php`

**Interfaces:**
- `schema.sql`'s `admins` table gains four nullable/defaulted columns: `otp_code_hash VARCHAR(255) NULL`, `otp_expires_at DATETIME NULL`, `otp_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0`, `otp_last_sent_at DATETIME NULL`.
- `Auth::issueToken(int $adminId, ?int $expiresAt = null)`: change the default from `time() + 60*60*24*7` to `time() + 60*60*24*30`.
- `Auth::generateOtp(): string` — returns a 6-digit numeric string via `str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT)`.
- `Auth::hashOtp(string $code): string` / `Auth::verifyOtp(string $code, string $hash): bool` — same `password_hash`/`password_verify` pattern already used for the account password.
- `AdminRepository` gains: `setOtp(string $email, string $codeHash, \DateTimeImmutable $expiresAt): void` (also sets `otp_last_sent_at = NOW()`, resets `otp_attempts = 0`), `clearOtp(string $email): void` (nulls all four OTP columns), `incrementOtpAttempts(string $email): void`. `findByEmail` already exists and returns the OTP columns since it's `SELECT *`.

**Steps:**
1. Migrate `schema.sql` with the four new columns (this is the source-of-truth schema file re-run against local/staging/prod DBs later — it is not itself a runtime migration mechanism).
2. Implement the `Auth` additions with tests: `issueToken()` default expiry is ~30 days out; `generateOtp()` always returns exactly 6 digits (including leading zeros — run it enough times in a test loop, or mock `random_int`, to catch a `str_pad` regression); `verifyOtp` round-trips with `hashOtp`.
3. Implement the `AdminRepository` additions with tests against the local test DB (`nova_assets_test`) — `setOtp` then `findByEmail` shows the hash/expiry/reset attempts; `incrementOtpAttempts` increments from any starting value; `clearOtp` nulls all four columns.
4. Run `vendor/bin/phpunit` (full suite) — must pass.
5. Commit: `feat(cpanel-api): OTP schema, Auth OTP helpers, 30-day sessions`.

---

### Task 2: PHP — OTP endpoints on `AuthController` + `Router`, single-email enforcement

**Files:**
- Modify: `cpanel-api/src/Controllers/AuthController.php`, `cpanel-api/src/Router.php`
- Test: `cpanel-api/tests/Controllers/AuthControllerTest.php`, `cpanel-api/tests/RouterTest.php`

**Interfaces:**
- `AuthController::login()`: add a guard — if `strtolower(trim($email)) !== 'it-support@novasstrading.com'`, return 401 `{"error":"invalid credentials"}` before ever touching `AdminRepository` (defense in depth; only one row will ever exist, but don't rely on that alone).
- `AuthController::requestOtp(Request $req): Response` — `POST /auth/otp/request`. Require API key (401 if missing/wrong). If the email isn't `it-support@novasstrading.com` (case-insensitive), return `200 {"ok":true}` anyway (no-op — never reveal whether an email is valid). Otherwise: if `otp_last_sent_at` is less than 60 seconds ago, return `429 {"error":"too many requests"}`. Else generate a code via `Auth::generateOtp()`, hash it, `AdminRepository::setOtp($email, $hash, now+10min)`, **send the code by email directly from PHP** (see "Corrected design" below), and return `200 {"ok":true}` — **never** put the code in the HTTP response.
  - **Corrected design (superseded the original draft of this task, which returned the code in the JSON response — caught by automated security review as a real Critical finding, not a false positive; see the ledger's ruling under Task 2 for the full reasoning).** The original reasoning was that this endpoint is only ever called server-to-server, so returning the code was "safe." That's wrong: it collapses two independent factors (holding the shared API key; controlling the admin's real email inbox) into one — anyone who obtains just the API key (a leak, SSRF, a compromised Vercel deployment — none of which require the account password or email access) could call `requestOtp` then immediately `verifyOtp` with the code from that same response, minting a full session without ever touching the real credential. Instead: `AuthController` sends the email itself via Brevo's transactional HTTP API (`https://api.brevo.com/v3/smtp/email`, same shape the Next.js `app/api/contact/route.ts` already posts to — PHP's `curl` extension or `file_get_contents` with a stream context does this fine; both are PHP core, not a new composer dependency). Add `BREVO_API_KEY` (and a from-name/from-address, e.g. reuse `SITE_NAME`/`SITE_DOMAIN`-equivalent constants) to `cpanel-api/.env.php` / `.env.testing.example` — a separate copy of the same Brevo account credential the Next.js side already uses, not shared process-to-process. To keep this testable without hitting the network or needing to reverse a bcrypt hash, give `AuthController` an injectable mailer collaborator in its constructor, defaulting to the real Brevo-calling implementation — same test-injection idiom already used in `MediaController`'s constructor (`?string $mediaDir = null`), e.g. `?callable $sendMail = null` that tests can replace with a closure recording `(string $email, string $code)` calls. Tests that need to assert on the code's value read it from the injected test mailer's captured call, never from an HTTP response.
- `AuthController::verifyOtp(Request $req): Response` — `POST /auth/otp/verify`. Require API key. Look up the admin by email; if none, or `otp_code_hash` is null, or `otp_expires_at` has passed, or `otp_attempts >= 5`: 401 `{"error":"invalid or expired code"}`. Else if `Auth::verifyOtp($providedCode, $hash)` fails: `AdminRepository::incrementOtpAttempts($email)`, 401 same message. Else: `AdminRepository::clearOtp($email)`, return `200 {"token": Auth::issueToken($adminId)}` — same shape as `login()`'s success response.
- `Router.php`: add `POST /auth/otp/request` → `AuthController::requestOtp`, `POST /auth/otp/verify` → `AuthController::verifyOtp`, alongside the existing `POST /auth/login` block.

**Steps:**
1. TDD: write `AuthControllerTest` cases first — wrong email on `login` → 401; `requestOtp` for the right email → 200 with a 6-digit `code`; `requestOtp` for any other email → 200 with no `code` key and no DB row change; two `requestOtp` calls inside 60s → second is 429; `verifyOtp` with the right code → 200 with a `token`, and a second `verifyOtp` with the *same* code afterward fails (OTP is single-use — `clearOtp` already ran); `verifyOtp` with a wrong code 5 times → 6th attempt is 401 even with the *right* code (lockout); `verifyOtp` after the 10-minute window → 401.
2. Implement to green.
3. `RouterTest`: confirm the two new routes dispatch to the right controller methods and 404 for wrong methods on those paths (same pattern as the existing sections-route 404 test).
4. Run `vendor/bin/phpunit` (full suite).
5. Commit: `feat(cpanel-api): OTP request/verify endpoints, single-admin-email enforcement`.

---

### Task 3: Next.js — Brevo mail helper, OTP client calls, login UI (password or emailed code), 30-day cookies

**Files:**
- Create: `lib/mail.ts`
- Modify: `app/api/contact/route.ts` (use the extracted helper instead of its own copy), `lib/cpanel-api.ts`, `app/admin/content/login/page.tsx`, `app/admin/content/login/actions.ts`
- Test: `lib/__tests__/mail.test.ts` (or colocate with existing test conventions), `app/admin/content/__tests__/*` (extend existing login tests)

**Interfaces:**
- `lib/mail.ts` exports `sendBrevoEmail(payload: object): Promise<boolean>` — lift verbatim from `app/api/contact/route.ts`'s current private function (same Brevo REST call, `BREVO_API_KEY` env var, same `messageId` success check). `app/api/contact/route.ts` imports and uses this instead of its own copy — no behavior change to the contact form.
- `lib/cpanel-api.ts` adds:
  - `requestOtp(email: string): Promise<void>` — thin `POST /auth/otp/request` via the existing `call()` helper and return. **Per Task 2's corrected design, PHP now sends the OTP email itself directly via Brevo** — this function has nothing to branch on (the PHP side always returns `{"ok":true}` regardless of outcome, to avoid revealing anything) and does not touch `lib/mail.ts` at all.
  - `verifyOtp(email: string, code: string): Promise<string>` — `POST /auth/otp/verify`; on non-2xx throw (same pattern as `login()`); on success return `data.token`.
- `login/actions.ts`: extract the cookie-setting logic (`httpOnly, secure, sameSite:"strict", path:"/admin/content", maxAge`) out of `loginAction` into a shared `establishSession(token: string)` helper in the same file (or a small `lib/admin-session.ts` if that reads cleaner); change `maxAge` to `60*60*24*30`. Add `requestOtpAction(_prevState, formData)` (reads `email` — always the hardcoded admin email — calls `requestOtp`, returns a state flag meaning "show the code-entry step") and `verifyOtpAction(_prevState, formData)` (reads `email`+`code`, calls `verifyOtp`, calls `establishSession`, redirects to `/admin/content`, or returns `{error: "..."}` on failure).
- `login/page.tsx`: two-mode UI — a toggle/tab between "Password" (existing form, unchanged behavior besides the new cookie lifetime) and "Email me a code" (email pre-filled and read-only as `it-support@novasstrading.com`, a "Send code" button → `requestOtpAction`; on success, reveal a 6-digit code input + "Verify" button → `verifyOtpAction`). Keep this a Client Component using the same `useState`+`useTransition` pattern the existing login page already uses (React 18 compatible, per this branch's existing `f59d85b` fix — do not reintroduce `useActionState`).

**Steps:**
1. Extract `lib/mail.ts`, repoint `app/api/contact/route.ts` at it, confirm `npm run test` still passes for the contact route's existing tests (no behavior change).
2. Add `requestOtp`/`verifyOtp` to `lib/cpanel-api.ts`.
3. Rework the login page/actions per the interfaces above. Write/extend tests: `requestOtpAction`/`verifyOtpAction` call the right `lib/cpanel-api.ts` functions and transition state correctly (mock `lib/cpanel-api.ts`, same mocking style the existing login action test already uses); the password path's cookie `maxAge` is `60*60*24*30`.
4. `npx tsc --noEmit`, `npm run lint`, `npm run test` all clean.
5. Commit: `feat: password-or-OTP login for the single admin account, 30-day sessions`.

---

### Task 4: Fix media URL resolution (uploaded images must actually render)

**Files:**
- Modify: `components/ContentMedia.tsx`, `components/Partners.tsx`, `app/admin/content/(guarded)/media/page.tsx`, `next.config.mjs`, `.env.example`
- Test: `components/__tests__/ContentMedia.test.tsx` (new or extended)

**Preflight note:** a third broken-URL site was found scanning for this bug beyond what the approved plan named: `app/admin/content/(guarded)/media/page.tsx` renders every media thumbnail via `<Image src={`/${m.path}`} .../>` — same bug, `/media/....webp` resolves against the Next app's own public root, not the cPanel host. Fix it in this task too (route it through `ContentMedia`, consistent with the `Partners.tsx` fix below) so the Media Library page itself isn't still showing broken thumbnails after this task.

**Interfaces:**
- New env var `NEXT_PUBLIC_MEDIA_BASE_URL` (e.g. `https://content-api.novasstrading.com`) — public because `ContentMedia` is a Client Component. Document it in `.env.example` next to the existing `CPANEL_API_URL`/`CPANEL_API_KEY` block.
- `ContentMedia.tsx`: today, `fileName` is always resolved as `/assets/${fileName}`. Change the resolution: if `src` starts with `media/` (the exact literal prefix `MediaController::uploadFile` returns — confirm by reading `cpanel-api/src/Controllers/MediaController.php`), the final URL is `` `${process.env.NEXT_PUBLIC_MEDIA_BASE_URL}/${src}` `` and the `.png`-default/blur-placeholder logic (`blurData[fileName]`) is skipped for this branch (uploaded media has no precomputed blur entry). Otherwise, keep every existing local-asset code path byte-for-byte unchanged.
- `Partners.tsx`'s two direct `<Image src={`/assets/${logo.src}`}>` call sites: replace with `<ContentMedia src={logo.src} kind="logo" .../>` (matching the `aspect`/sizing that visually reproduces the current rendering — check the existing className/sizing on those `<Image>` calls and carry it over) so all media resolution goes through one place.
- `next.config.mjs`: add the media host to `images.remotePatterns` — read `NEXT_PUBLIC_MEDIA_BASE_URL` at config-eval time (it's available at build time) and add `{ protocol: "https", hostname: new URL(url).hostname }` when the env var is set (guard for local dev where it may be unset, matching the existing `INVENTORY_URL`-unset no-op pattern in this same file).

**Steps:**
1. TDD: `ContentMedia.test.tsx` — a `src` of `"media/abc123.webp"` with `NEXT_PUBLIC_MEDIA_BASE_URL=https://content-api.example.com` renders an `<img>` (or the `next/image` element) whose resolved src includes `https://content-api.example.com/media/abc123.webp`; a `src` of `"products/categories/kidswear-1.jpg"` still resolves to `/assets/products/categories/kidswear-1.jpg` unchanged (regression check).
2. Implement `ContentMedia.tsx`'s branch, `Partners.tsx`'s swap, `media/page.tsx`'s thumbnail swap (same `ContentMedia` route-through), `next.config.mjs`'s `remotePatterns` addition, `.env.example`'s new line.
3. `npm run test`, `npx tsc --noEmit`, `npm run lint`.
4. Commit: `fix: resolve uploaded media (cPanel host) separately from bundled /assets images`.

---

### Task 5: PHP — allow PDF uploads through the media endpoint (for Company Profile documents)

**Files:**
- Modify: `cpanel-api/src/Controllers/MediaController.php`
- Test: `cpanel-api/tests/Controllers/MediaControllerTest.php`

**Interfaces:**
- `MediaController::uploadFile`: currently always calls `getimagesizefromstring()` and rejects on failure, then always re-encodes... actually (checking the real controller) it stores raw bytes as `.webp` unconditionally after the `getimagesizefromstring` validity check — re-read the current method body before changing it. Add a branch: if the uploaded bytes start with the PDF magic bytes (`%PDF-`, i.e. `substr($bytes, 0, 5) === '%PDF-'`), skip the `getimagesizefromstring` image check entirely, use extension `.pdf` instead of `.webp` for the generated filename, and skip whatever image-specific re-encoding step exists (store the PDF bytes as-is). Keep the existing 5MB cap check (`self::MAX_BYTES`) applying to both branches. Non-PDF, non-valid-image bytes still 422 exactly as today.
- Response shape unchanged: `{"path": "media/<random>.pdf"}` for PDFs, `{"path": "media/<random>.webp"}` for images (unchanged).

**Steps:**
1. TDD: extend `MediaControllerTest` — uploading valid PDF bytes (a minimal real PDF fixture, or bytes starting with `%PDF-1.4\n...`) returns 201 with a `.pdf` path and the file exists on disk with those exact bytes; uploading bytes that are neither a valid image nor start with `%PDF-` still 422; a PDF over 5MB still 422 (cap check happens before/regardless of the magic-byte branch).
2. Implement.
3. `vendor/bin/phpunit`.
4. Commit: `feat(cpanel-api): accept PDF uploads for document fields`.

---

### Task 6: Section registry — the declarative content-field schema driving the whole visual editor

**Files:**
- Create: `lib/admin/section-registry.tsx`
- Do NOT delete `lib/admin/content-schema.ts` in this task — `app/admin/content/(guarded)/page.tsx` (the current dashboard) still imports `CONTENT_SCHEMA` from it, and that page isn't swapped over to `SECTION_REGISTRY` until Task 13. Deleting it here would break the build for the five tasks in between. Task 13 deletes it once the dashboard no longer needs it.
- Test: `lib/admin/__tests__/section-registry.test.ts`

**Interfaces:**
```ts
export type FieldControl = "text" | "textarea" | "url" | "enum";
export type ItemFieldKind = FieldControl | "media" | "document";

export type ScalarField = { path: string; label: string; control: FieldControl; options?: string[] };
export type ItemField = { key: string; label: string; kind: ItemFieldKind; options?: string[] };
export type ListSpec = {
  listKey: string;          // matches content_items.section_key exactly, e.g. "hero.stats", "products.items", "compliance.certifications"
  label: string;
  itemFields: ItemField[];
  titleField: string;       // which itemFields[].key to show as the item's label in add/reorder UI
};
export type SectionEntry = {
  key: string;               // unique registry id; matches content_sections.section_key for single-source entries
  label: string;
  primarySectionKeys: string[]; // content_sections keys this entry can WRITE (usually one; ["divisions","leadTime"] for the Divisions entry)
  scalarFields: ScalarField[];  // dot-paths into primarySectionKeys' fields_json, e.g. "primaryCta.label"
  lists: ListSpec[];
};

export const SECTION_REGISTRY: SectionEntry[] = [ /* 16 entries: Site Info, Navigation, Hero, About, Core Values,
  Why Us, Product Range, Portfolio, Services (Sourcing+ServicePillars), Working Process, Divisions (+Lead-Time),
  Compliance, Partners, Company Profile, Contact, Footer */ ];
```
Enum fields and their exact closed option lists (from reading `components/ServicePillars.tsx` and `components/Process.tsx`'s icon maps directly — confirm the literal keys against the source, these are reported from an earlier survey and must be verified, not assumed): `sourcing.pillars[].icon` → one of the keys in `ServicePillars.tsx`'s `pillarIcons` record (reported as `"clock"|"thumb"|"check"|"gear"`); `process.steps[].icon` → one of the keys in `Process.tsx`'s `icons` record (reported as `"sourcing"|"quality"|"design"|"compliance"|"packing"|"shipment"`).

**Steps:**
1. Read every component this touches (`Header.tsx`, `Hero.tsx`, `About.tsx`, `CoreValues.tsx`, `WhyUs.tsx`, `ProductRange.tsx`, `Portfolio.tsx`, `Sourcing.tsx`, `ServicePillars.tsx`, `Process.tsx`, `Divisions.tsx`, `LeadTimeTable.tsx`, `Compliance.tsx`, `Partners.tsx`, `Profiles.tsx`, `Contact.tsx`, `Footer.tsx`) to confirm every field name/shape — do not guess field names from memory. Cross-check against `lib/content.ts`'s corresponding exports (still present, `import type`-only now, exactly matches the DB-backed shapes per Task 22 of the original plan).
2. Author `SECTION_REGISTRY` with all 16 entries. Per the Context section's rulings: `site` and `nav` each get their own entry (not folded into Header/Footer/Contact); the 5 hardcoded-non-editable images (About ×2, Compliance ×1, Divisions ×2 placeholders) and Contact's map iframe are simply absent from any entry's fields — they are not part of any editable schema.
3. `Profiles.documents[]`'s `href` field is `kind: "document"` (not `"media"`) — this is the one list in the whole registry using the new PDF-upload path from Task 5.
4. Test: for every entry, `scalarFields` paths and `lists[].itemFields` keys are non-empty strings with no duplicates within an entry; every `enum` field has a non-empty `options` array; `listKey`s are globally unique across the whole registry (they map 1:1 to `content_items.section_key` values already used by the migrated data — spot-check a handful, e.g. `"products.items"`, `"compliance.certifications"`, against `lib/admin/content-schema.ts`'s existing list, which stays in place until Task 13, to make sure no `listKey` typo silently orphans a section).
5. `npx tsc --noEmit`, `npm run test`, `npm run lint`.
6. Commit: `feat: SECTION_REGISTRY — declarative field schema for the visual editor, replaces flat content-schema`.

---

### Task 7: `EditModeProvider`, `Editable`, hover/highlight (`EditorCanvas`)

**Files:**
- Create: `components/admin/EditModeProvider.tsx`, `components/admin/Editable.tsx`, `components/admin/EditorCanvas.tsx`
- Test: `components/admin/__tests__/Editable.test.tsx`, `components/admin/__tests__/EditorCanvas.test.tsx`

**Interfaces:**
- `EditModeProvider`: React context exposing `{ hoveredId: string | null; setHoveredId: (id: string | null) => void; openId: string | null; setOpenId: (id: string | null) => void; draft: unknown; setDraft: (updater) => void }`. A `useEditMode()` hook returns the context value or `null` if called outside a provider (do NOT throw — `Editable`'s whole no-op-on-the-public-site trick depends on `useEditMode()` returning `null` gracefully outside the provider).
- `Editable` — exact shape from the approved plan:
  ```tsx
  export function Editable({ id, kind, as: Tag = "span", className, children }: {
    id: string; kind: "text" | "media" | "document" | "item"; as?: keyof JSX.IntrinsicElements; className?: string; children: React.ReactNode;
  }) {
    const ctx = useEditMode();
    if (!ctx) return <>{children}</>;
    const hovered = ctx.hoveredId === id;
    return (
      <Tag data-editable-id={id} data-editable-kind={kind}
           className={[className, hovered ? "outline outline-2 outline-brass outline-offset-2 cursor-pointer" : undefined].filter(Boolean).join(" ")}
           onClick={(e) => { e.stopPropagation(); ctx.setOpenId(id); }}>
        {children}
      </Tag>
    );
  }
  ```
  (Adjust the highlight class to whatever this codebase's Tailwind config actually supports for an outline in the brass accent color — check `tailwind.config.ts` for the exact token name, e.g. `brass`/`brass-dark`, used elsewhere in this file's sibling components.)
- `EditorCanvas`: a thin wrapper `<div onMouseMove={...}>{children}</div>` that, on mousemove, does `(e.target as HTMLElement).closest("[data-editable-id]")`, reads its `data-editable-id`, and calls `ctx.setHoveredId(id ?? null)` (debounced or not — a plain listener is fine at this scale, no virtualization needed for a single page section). Also renders a small floating label near the cursor showing the hovered id's human label (accept a `labelLookup: (id: string) => string | undefined` prop so it doesn't need to know about `SECTION_REGISTRY` itself).

**Steps:**
1. TDD `Editable`: outside any provider, renders `children` with no wrapping element and no `data-*` attributes (assert via `container.firstChild` equals a text node / the bare child, not a wrapping `<span>`). Inside a provider, renders the `Tag` with `data-editable-id`/`data-editable-kind`; clicking it calls `setOpenId(id)` and does not bubble (test with a wrapping click handler that must NOT fire).
2. TDD `EditorCanvas`: mousemove over a child element bearing `data-editable-id="x"` calls `setHoveredId("x")`; moving off any such element calls `setHoveredId(null)`.
3. Implement `EditModeProvider` (plain `useState`, no external state library).
4. `npm run test`, `npx tsc --noEmit`, `npm run lint`.
5. Commit: `feat: EditModeProvider/Editable/EditorCanvas — hover-highlight click-to-edit infrastructure`.

---

### Task 8: Instrument components, batch 1 — Header, Hero, About, CoreValues, WhyUs

**Files:** Modify `components/Header.tsx`, `components/Hero.tsx`, `components/About.tsx`, `components/CoreValues.tsx`, `components/WhyUs.tsx`
**Test:** extend each component's existing test file (e.g. `components/__tests__/Hero.test.tsx`) with one assertion that its known scalar fields are now wrapped in an element carrying the expected `data-editable-id` **only when rendered inside an `EditModeProvider`** (render once bare — assert unchanged output — and once inside a test provider — assert the `data-editable-id` attributes appear at the ids `SECTION_REGISTRY` declares for that section).

**Interfaces/Decisions:**
- Same mechanical pattern for every field, matching Task 6's registry ids exactly. **`Editable` must be NESTED INSIDE the original tag, never used to REPLACE it.** Outside `EditModeProvider` (i.e. on the real public site, which never mounts one), `Editable` renders only `<>{children}</>` — no `Tag`, no `className`. Replacing `<p className="eyebrow">{hero.eyebrow}</p>` with `<Editable id="hero.eyebrow" kind="text" as="p" className="eyebrow">{hero.eyebrow}</Editable>` directly would silently delete the `<p>` and its class from the public site — a real regression. Instead keep the original element and nest `Editable` around just the interpolated value: `<p className="eyebrow"><Editable id="hero.eyebrow" kind="text">{hero.eyebrow}</Editable></p>` — byte-identical outside a provider, one extra inline element inside it. List items work the same way: nest `Editable` inside the item's existing wrapper (use `as="div" className="contents"` when the card's own layout depends on the wrapper being a direct flex/grid child, so the extra nesting level doesn't disturb it) rather than replacing that wrapper — clicking anywhere on the nested region opens the item's full edit form, per Task 11's `item` modal kind.
- **Item identity (ruled during Task 8, applies to every remaining instrumentation task):** `lib/content-data.ts`'s `getContent()` reassembly does NOT carry the DB item `id` through to components (confirmed by reading it) and is NOT to be modified — it also serves the public site's live data path and its types are pinned to `lib/content.ts`. Instead, each component that needs an item id for `Editable` locally widens its own list-item type at the point of use, e.g. `type StatWithId = (typeof hero.stats)[number] & { id: number }`, and casts (`as unknown as StatWithId[]` if the source list is a readonly/`as const` tuple, plain `as StatWithId[]` otherwise). At runtime on the public site this `id` is `undefined` — harmless, since `Editable` never reads its `id` prop outside a provider. Task 13's admin-editor data-fetching (built directly from `listItems()`, which does carry `id`) is responsible for supplying real ids into this same structurally-compatible shape. Lists whose items are bare strings at runtime (`about.body`, `about.highlights`, `compliance.protocolBody`, `sourcing.checklist`, `contact.subjects` — all `TEXT_WRAPPED_LISTS` in `content-data.ts`) have no way to carry even a placeholder id on a JS primitive; the same local-widening cast still type-checks and is a safe no-op read, and this is an accepted, already-scoped gap for Task 13 to close.
- Header: only `nav` items are `Editable` (`kind="item"`, id `nav.<id>`); anything sourced from `site` renders exactly as today, no `Editable` wrapper (per the Context section's ruling).

**Steps:**
1. First resolve the item-id-through-`content-data.ts` question above — this blocks every remaining instrumentation task, so settle it here, first, even though it touches a shared file. If a fix is needed, it's a small, isolated change to `lib/content-data.ts`'s reassembly loop (add `id` alongside each item's spread fields) — do not restructure that file otherwise.
2. Instrument the 5 components per the pattern above, reading each file fresh before editing (do not assume field names not already confirmed in Task 6).
3. Tests as described; run the full `npm run test` (not just these files) to catch any accidental regression from the `content-data.ts` change if made.
4. `npx tsc --noEmit`, `npm run lint`.
5. Commit: `feat: click-to-edit wrapping — Header/Hero/About/CoreValues/WhyUs`.

---

### Task 9: Instrument components, batch 2 — ProductRange, Portfolio, Sourcing, ServicePillars, Process

**Files:** Modify `components/ProductRange.tsx`, `components/Portfolio.tsx`, `components/Sourcing.tsx`, `components/ServicePillars.tsx`, `components/Process.tsx`
**Test:** same pattern as Task 8, one representative assertion per component.

**Interfaces/Decisions:**
- Same mechanical pattern as Task 8 (now that the item-id plumbing from Task 8 exists, reuse it — do not re-derive).
- `products.items[].image` and `.alt` are one `kind="item"` wrapper around the whole card (editing the image is done via the item's edit modal's media field, not a separate standalone `Editable` on just the image — keeps one click target per list item, matching the "click the thing to edit that thing" mental model rather than needing pixel-precise sub-region clicks).
- `sourcing.pillars[].icon` is the enum field — still wrapped at the item level (`kind="item"`); the enum control lives inside that item's edit form (Task 11), not as its own separate clickable region.
- Read `Portfolio.tsx`'s actual current shape in full before touching it — this survey only partially covered it (`tabs[].photos[]` as `{src,alt}`, plus a `tab.label`/`portfolio.extra.{label,items}` seen directly). Confirm the complete `tabs[]` shape (label, possibly a `categories` field) against the live file and match Task 6's registry exactly; if Task 6's registry under-specified Portfolio, fix the registry entry in this task's commit too (call this out in the commit message) rather than silently diverging.

**Steps:**
1-5. Same shape as Task 8's steps, scoped to these 5 files.
Commit: `feat: click-to-edit wrapping — ProductRange/Portfolio/Sourcing/ServicePillars/Process`.

---

### Task 10: Instrument components, batch 3 — Divisions, LeadTimeTable, Compliance, Partners, Profiles, Contact, Footer

**Files:** Modify `components/Divisions.tsx`, `components/LeadTimeTable.tsx`, `components/Compliance.tsx`, `components/Partners.tsx`, `components/Profiles.tsx`, `components/Contact.tsx`, `components/Footer.tsx`
**Test:** same pattern as Task 8/9.

**Interfaces/Decisions:**
- `Divisions`+`LeadTimeTable` are one registry entry (`primarySectionKeys: ["divisions","leadTime"]`) but two components — both get instrumented in this task since they're rendered together. `divisions.items[].bullets` (array-of-strings nested inside an array item) is NOT independently clickable — it's part of that item's `kind="item"` edit form (a repeatable-strings sub-field in the modal, same as `about.body`/`about.highlights` elsewhere use a list-of-scalars pattern already established for those in Task 6's registry).
- `leadTime.rows[]` (array of 3-string tuples) — one `Editable id={`leadTime.rows.${id}`} kind="item"` per row; `leadTime`'s own `columns` field stays exactly as-is (hardcoded in the component, per the existing, deliberate `leadTime.columns`-is-dead-data decision already recorded in the original plan — do not wire it up, do not make it editable).
- `Profiles.documents[].href` uses `kind="document"` on its `Editable` wrapper (not `"media"`) so Task 11's modal opens the PDF-upload variant.
- `Contact` and `Footer`: only fields sourced from `contact`/`footerBlurb`/`nav` are `Editable`; anything sourced from `site` (including nested `site.address.mapUrl`, `site.address.full`, `site.social.linkedin`, `site.email`, etc.) renders exactly as today, no wrapper — same ruling as Header in Task 8.

**Steps:** same shape as Task 8/9.
Commit: `feat: click-to-edit wrapping — Divisions/LeadTimeTable/Compliance/Partners/Profiles/Contact/Footer`.

---

### Task 11: `MediaPicker` + the edit modal (all field kinds)

**Files:**
- Create: `components/admin/MediaPicker.tsx`, `components/admin/EditModal.tsx`
- Test: `components/admin/__tests__/MediaPicker.test.tsx`, `components/admin/__tests__/EditModal.test.tsx`

**Interfaces:**
- `MediaPicker({ onSelect, accept }: { onSelect: (path: string) => void; accept: "image" | "document" })` — fixed-overlay `role="dialog"` (same visual pattern as `Portfolio.tsx`'s lightbox: `fixed inset-0 z-[...] bg-ink/95`), two tabs: "Upload new" (a file input, client-side size/type check matching `UploadForm.tsx`'s existing 5MB cap, `accept="image/*"` or `accept="application/pdf"` depending on the `accept` prop, posts to the existing `media/upload` route) and "Choose existing" (a grid over `listMedia()`, filtered by `mime_type` matching the requested `accept`). Selecting either path calls `onSelect(path)` with the resulting `media/....webp`/`.pdf` path and closes.
- `EditModal({ id, kind, currentValue, itemFields?, onSave, onDelete?, onClose })` — one component, branching on `kind`:
  - `text | textarea | url`: single labeled input/textarea, "Save" calls `onSave(newValue)`.
  - `enum`: a `<select>` populated from the registry's `options` for this field (passed in via a prop, not looked up internally — keeps this component decoupled from `SECTION_REGISTRY`).
  - `media` / `document`: shows `currentValue`'s preview (an `<img>` for media, a filename/link for document) plus "Replace" → opens `MediaPicker`; on selection, `onSave(newPath)`.
  - `item`: renders `itemFields` (from the registry's `ListSpec.itemFields`) as a small form — one input per field, using each field's own `kind` (recursing into the same input/enum/media controls above for each), plus a "Delete this item" button (only when editing an existing item, not when adding) calling `onDelete()`, and "Save"/"Add" calling `onSave(fieldsObject)`.
- Modal never calls `lib/cpanel-api.ts` directly — it only reports the new value up via `onSave`/`onDelete`; Task 12's confirm/discard lifecycle owns all network calls. This keeps the modal reusable/testable in isolation and matches the "nothing writes until Confirm" requirement structurally, not by convention.

**Steps:**
1. TDD `MediaPicker`: "Choose existing" lists items from a mocked `listMedia()` filtered by mime type; selecting one calls `onSelect` with its `path` and the picker closes; "Upload new" respects the accept-type/size caps (mirror `UploadForm.tsx`'s existing test cases).
2. TDD `EditModal`: one test per `kind` branch — right control renders, `onSave`/`onDelete` fire with the right shape, `item` kind's "Delete" only appears when an existing item (pass a flag or infer from `currentValue` being present).
3. Implement both.
4. `npm run test`, `npx tsc --noEmit`, `npm run lint`.
5. Commit: `feat: MediaPicker + EditModal — the click-to-edit field editor`.

---

### Task 12: Confirm/discard lifecycle — diff draft against baseline, dispatch the minimal writes

**Files:**
- Create: `components/admin/SectionEditor.tsx` (client component: owns `EditModeProvider`'s draft state, renders `EditorCanvas` + the section's real component + `EditModal` when `openId` is set + the confirm/discard bar), `app/admin/content/(guarded)/edit/[section]/actions.ts`
- Test: `components/admin/__tests__/SectionEditor.test.tsx` (the diff/dispatch logic is the part worth unit-testing in isolation — extract it as a pure function, e.g. `computeChangeset(baseline, draft, registryEntry)`, and test THAT directly rather than only through full-component rendering)

**Interfaces:**
- `computeChangeset(baseline, draft, entry: SectionEntry)` — pure function, returns `{ sectionWrites: {key, fields}[]; itemCreates: {section, fields}[]; itemUpdates: {id, fields}[]; itemDeletes: number[]; reorders: {section, ids: number[]}[] }` by comparing `baseline` vs `draft` per `entry.primarySectionKeys` (scalar fields) and `entry.lists` (item adds/edits/deletes/order changes, using each item's DB `id` from Task 8's fix, or a sentinel like `id: "new"` for not-yet-created items pending a create).
- **`itemUpdates[].fields` and `sectionWrites[].fields` MUST be the FULL merged object (baseline's complete existing fields, overlaid with only the changed keys), never just the changed subset.** Verified directly against the PHP backend (`cpanel-api/src/Repositories/ContentItemRepository::update()` and `ContentSectionRepository::upsert()`): both do a bare `UPDATE ... SET fields_json = ?` / `ON DUPLICATE KEY UPDATE fields_json = VALUES(fields_json)` — a full REPLACE of the column, not a merge, at the database layer. Task 11's `EditModal` correctly reports back only the field(s) that changed (a deliberate partial-update contract, so it can't accidentally leak an undeclared field like `portfolio.tabs[].photos` into its own payload) — but that partial payload must be merged with the item's/section's full current `fields` (already available from `baseline`, since `listItems()`/`getSections()` both return complete `fields_json` per row) BEFORE being sent to `updateItem`/`updateSection`. Skipping this merge step would silently destroy every undeclared field (starting with the ~66-photo portfolio gallery) the first time ANY field on that item is edited. This is the load-bearing fix for the risk Task 6's review flagged and Task 11's design anticipated — it is not optional, and it is exactly where that risk actually gets closed.
- `SectionEditor`'s confirm handler: `computeChangeset(...)`, then dispatches `updateSection`/`createItem`/`updateItem`/`deleteItem`/`reorderItems` (via new thin server actions in `edit/[section]/actions.ts` that read the session cookie exactly like the existing `actions.ts` files do — this is the one place duplicating that "read `nova_admin_session`, verify, get token" boilerplate is appropriate, since the old per-route `actions.ts` files this replaces are being deleted in Task 13) for each part of the changeset, in this order: creates → updates → deletes → reorders (deletes-before-reorder would corrupt sibling indices; creates-before-reorder ensures new items have real ids to reorder). On full success: `revalidatePath("/")`, set the new baseline = draft, close. On partial failure: show which specific change(s) failed (by field/item label, from the registry, not a raw error), keep those specific failed changes in the still-open draft, apply the ones that succeeded to the new baseline so a second "Confirm changes" click doesn't re-submit already-applied writes.
- Discard: reset `draft` to `baseline`, no network calls, `setOpenId(null)`.

**Steps:**
1. TDD `computeChangeset` thoroughly first (pure function, cheap to test exhaustively): no changes → empty changeset; scalar field edited → one `sectionWrites` entry with only the changed field(s); item field edited → one `itemUpdates` entry; new item added → one `itemCreates` entry; item removed → one `itemDeletes` entry; items reordered with no other changes → one `reorders` entry with the new id order; a combination of all four in one draft.
2. Implement `SectionEditor` wiring the pure function to the actions; implement the server actions.
3. `npm run test`, `npx tsc --noEmit`, `npm run lint`.
4. Commit: `feat: confirm/discard lifecycle — diff-and-publish for the visual editor`.

---

### Task 13: Section picker page, `edit/[section]` route, delete superseded routes, schema-driven add-item defaults

**Files:**
- Create: `app/admin/content/(guarded)/edit/[section]/page.tsx`
- Modify: `app/admin/content/(guarded)/page.tsx` (dashboard → picker, 16 rows from `SECTION_REGISTRY`)
- Delete: `app/admin/content/(guarded)/sections/**`, `app/admin/content/(guarded)/items/**` (superseded — confirm `trash/` and `media/` are untouched, they stay), `lib/admin/content-schema.ts` (superseded by `SECTION_REGISTRY`, kept alive until now per Task 6's note — confirm nothing still imports it, `grep -rn content-schema`, before deleting). **Task 6 found a second consumer beyond the dashboard page: `lib/content-data.ts` also imports `CONTENT_SCHEMA` for its `LIST_SECTIONS` constant — repoint that at `SECTION_REGISTRY`'s `listKey`s too before deleting `content-schema.ts`, or the build breaks.**
- Test: extend `app/admin/content/(guarded)/__tests__/page.test.tsx`; add a route-level test for `edit/[section]/page.tsx` (renders the right registry entry's component, 404/`notFound()` for an unknown `section` param)

**Interfaces:**
- `edit/[section]/page.tsx`: server component, looks up `SECTION_REGISTRY.find(e => e.key === params.section)` (`notFound()` if missing), fetches `getSections()` (bulk, `cache: "no-store"`) and, for each of the entry's `lists`, `listItems(listKey)`, assembles the baseline object shape the entry's real page component expects (same shape `app/page.tsx` already assembles per-component — reuse `lib/content-data.ts`'s existing per-section assembly logic rather than re-deriving it; if it's not already factored into reusable per-section pieces, factor the minimum needed here without restructuring the whole file), and renders `<EditModeProvider baseline={...}><SectionEditor entry={entry} render={(draft) => <ActualComponent .../>} /></EditModeProvider>`.
- Dashboard (`(guarded)/page.tsx`): one row per `SECTION_REGISTRY` entry (label + link to `edit/[key]`), replacing the current 36-row `CONTENT_SCHEMA`-driven list. Keep the existing links to `trash` and `media` (as nav items, not schema rows).
- `items/[section]/new/page.tsx`'s hardcoded `{title, body}` seed problem (Part B fix 2 from the approved plan) is moot once this route tree is deleted — "add item" now happens through `SectionEditor`'s `item`-kind modal in "add" mode (Task 11/12), which is already schema-driven from `ListSpec.itemFields`. Confirm this in the task and do not leave a dangling fix for a route that no longer exists.

**Steps:**
1. Implement the picker page and `edit/[section]/page.tsx`.
2. Delete the superseded route trees; `grep -rn` for any remaining import of deleted files (e.g. from `content-schema.ts`, already deleted in Task 6) and clean up.
3. Tests as described.
4. `npx tsc --noEmit` (this is the single best check that nothing still imports a deleted file/type), `npm run lint`, `npm run test`.
5. `npm run build` — expected to fail at the static-export step for `/` with `CPANEL_API_KEY is not set` locally unless the local `.env.local` from this session is present (same expected-failure note the original plan's Task 22 recorded) — if `.env.local` IS present (it is, from earlier this session), the build should fully succeed; treat a build failure with `.env.local` present as a real regression, not an expected one.
6. Commit: `feat: section picker + visual edit route, remove superseded generic CRUD pages`.

---

## Verification (controller does this after Task 13, not a dispatched task)

Reuse this session's already-running local stack (MariaDB `nova_assets_dev`, PHP on `127.0.0.1:8080`, Next dev server) — re-apply the `schema.sql` diff (Task 1's new `admins` columns) with `ALTER TABLE` or a fresh `mysql ... < schema.sql` against a scratch DB, re-run `create-admin.php` for the local test admin, then in a browser (Playwright):
1. Log out if logged in; log in with password; log out; log in via "email me a code" (confirm a real email arrives via Brevo, or check the PHP response in dev tools if Brevo isn't configured locally) — both land on the section picker.
2. Open every one of the 16 sections at least once; for at least Hero, Products, Compliance, and Profiles: edit a text field, replace/pick a media field, add a new list item, delete a list item, reorder two items — confirm the live preview updates instantly on each change with no network tab activity until "Confirm".
3. Click "Confirm changes" — verify the homepage (`/`) reflects every change; click "Discard" on a different section's in-progress edit — verify nothing was written (re-open the section, baseline unchanged).
4. Specifically verify the two Part B-equivalent fixes: an uploaded image actually renders (not a broken image icon) both in the editor preview and on the public homepage; a newly-added item in a list with a non-`{title,body}` shape (e.g. a new certification) saves with the right fields, not a stray `title`/`body`.

Only after this passes locally does staging/production deployment guidance apply — that's an operational walkthrough (cPanel dashboard + Vercel dashboard clicks), not a coding task, and happens directly with the user once this branch is ready.

