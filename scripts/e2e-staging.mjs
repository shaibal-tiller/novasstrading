/**
 * Fast end-to-end check of the content portal, without a browser.
 *
 * Talks to the same endpoints the portal uses: the Next app (pages, upload route)
 * with a signed session cookie, and the cPanel API (items, trash, media).
 * Every change it makes is reverted at the end, so the target ends up as it began.
 *
 *   E2E_PASSWORD='...' node --env-file=.env.local scripts/e2e-staging.mjs
 *
 * Env: CPANEL_API_URL, CPANEL_API_KEY, SESSION_COOKIE_SECRET (from .env.local),
 *      E2E_PASSWORD (admin password), APP_URL (default http://localhost:3001),
 *      VERCEL_BYPASS (optional: the project's "Protection Bypass for Automation"
 *      secret, needed when APP_URL is a Vercel deployment behind Vercel Authentication;
 *      SESSION_COOKIE_SECRET must then be the value set on THAT deployment)
 */
import { createHmac } from "node:crypto";
import sharp from "sharp";

const API = process.env.CPANEL_API_URL;
const KEY = process.env.CPANEL_API_KEY;
const SECRET = process.env.SESSION_COOKIE_SECRET;
const APP = process.env.APP_URL || "http://localhost:3001";
const PASSWORD = process.env.E2E_PASSWORD;
const EMAIL = "it-support@novasstrading.com";
const BYPASS = process.env.VERCEL_BYPASS ? { "x-vercel-protection-bypass": process.env.VERCEL_BYPASS } : {};
const LIST = "coreValues.values";

if (!API || !KEY || !SECRET || !PASSWORD) {
  console.error("Need CPANEL_API_URL, CPANEL_API_KEY, SESSION_COOKIE_SECRET and E2E_PASSWORD");
  process.exit(1);
}

let failures = 0;
const ok = (label, pass, detail = "") => {
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${label}${detail ? `   (${detail})` : ""}`);
  if (!pass) failures++;
};

async function api(method, path, { body, token } = {}) {
  const headers = { "X-Api-Key": KEY };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(API + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  let json = null;
  try {
    json = await res.json();
  } catch {}
  return { status: res.status, json };
}

const sign = (token) => {
  const payload = Buffer.from(token, "utf8").toString("base64url");
  return `${payload}.${createHmac("sha256", SECRET).update(payload).digest("base64url")}`;
};

console.log(`E2E against API ${API}\n           and app ${APP}\n`);

// ---- login -----------------------------------------------------------------
const login = await api("POST", "/auth/login", { body: { email: EMAIL, password: PASSWORD } });
const token = login.json?.token;
ok("admin login", login.status === 200 && !!token, String(login.status));
if (!token) process.exit(1);
const cookie = `nova_admin_session=${sign(token)}`;

// ---- pages -----------------------------------------------------------------
console.log("\nPages (Next app, signed cookie)");
const sections = "site nav hero about coreValues whyUs products portfolio sourcing process divisions compliance partners profiles contact footerBlurb".split(" ");
const pages = ["/admin/content", "/admin/content/media", "/admin/content/trash", ...sections.map((k) => `/admin/content/edit/${k}`)];
let pageFails = [];
for (const p of pages) {
  const r = await fetch(APP + p, { headers: { cookie, ...BYPASS } });
  const t = await r.text();
  if (r.status !== 200 || /Application error|Internal Server Error/i.test(t)) pageFails.push(`${p} -> ${r.status}`);
}
ok(`all ${pages.length} admin pages load (dashboard, media, trash, 16 editors)`, pageFails.length === 0, pageFails.join("; "));
const anon = await fetch(APP + "/admin/content", { redirect: "manual", headers: BYPASS });
ok("admin pages redirect to login without a session", anon.status >= 300 && anon.status < 400, String(anon.status));

// ---- items: update / reorder / delete+restore ------------------------------
console.log(`\nItems (${LIST})`);
const list = async () => (await api("GET", `/items?section=${LIST}`)).json;
const original = await list();
ok("list has several items to work with", Array.isArray(original) && original.length >= 3, `${original?.length} items`);
const ids = original.map((i) => i.id);
const first = original[0];

const noAuth = await api("PUT", `/items/${first.id}`, { body: { fields: first.fields } });
ok("update without a session is rejected", noAuth.status === 401, String(noAuth.status));

const edited = { ...first.fields, title: `${first.fields.title} (e2e)` };
await api("PUT", `/items/${first.id}`, { body: { fields: edited }, token });
let now = await list();
ok("update changes the item", now[0].fields.title.endsWith("(e2e)"));
ok("update keeps the item's other fields", Object.keys(now[0].fields).sort().join() === Object.keys(first.fields).sort().join());
await api("PUT", `/items/${first.id}`, { body: { fields: first.fields }, token });
now = await list();
ok("revert restores the original item", JSON.stringify(now[0].fields) === JSON.stringify(first.fields));

await api("PUT", "/items/reorder", { body: { section: LIST, ids: [...ids].reverse() }, token });
now = await list();
ok("reorder reverses the list", now.map((i) => i.id).join() === [...ids].reverse().join());
await api("PUT", "/items/reorder", { body: { section: LIST, ids }, token });
now = await list();
ok("reorder back restores the original order", now.map((i) => i.id).join() === ids.join());

const victim = original[1];
await api("DELETE", `/items/${victim.id}`, { token });
now = await list();
ok("delete removes the item from the live list", !now.some((i) => i.id === victim.id));
const trashUnauth = await api("GET", "/items/trash");
ok("trash list requires a session", trashUnauth.status === 401, String(trashUnauth.status));
const trash = (await api("GET", "/items/trash", { token })).json;
ok("deleted item appears in the trash", Array.isArray(trash) && trash.some((t) => t.id === victim.id && t.section === LIST));
const pub = (await api("GET", "/content")).status;
ok("public bulk endpoint needs only the API key", pub === 200, String(pub));
await api("PUT", `/items/${victim.id}/restore`, { token });
now = await list();
ok("restore puts it back in its original position", now.map((i) => i.id).join() === ids.join());
const trashAfter = (await api("GET", "/items/trash", { token })).json;
ok("trash is empty again after restore", Array.isArray(trashAfter) && !trashAfter.some((t) => t.id === victim.id));

// ---- media -----------------------------------------------------------------
console.log("\nMedia (upload route -> PHP optimizer -> library)");
const src = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: { r: 30, g: 120, b: 200 } } })
  .jpeg({ quality: 95 })
  .toBuffer();
const form = new FormData();
form.set("file", new File([src], "e2e-photo.jpg", { type: "image/jpeg" }));
const up = await fetch(APP + "/admin/content/media/upload", { method: "POST", headers: { cookie, ...BYPASS }, body: form });
const upJson = await up.json().catch(() => ({}));
ok("upload through the portal route", up.status === 201 && !!upJson.path, `${up.status} ${upJson.path ?? JSON.stringify(upJson)}`);

const noCookie = await fetch(APP + "/admin/content/media/upload", { method: "POST", headers: BYPASS, body: form });
ok("upload without a session is rejected", noCookie.status === 401, String(noCookie.status));

if (upJson.path) {
  const lib = (await api("GET", "/media-library")).json;
  const row = lib?.find((m) => m.id === upJson.id);
  ok("media row recorded with the REAL stored size", !!row && row.mime_type === "image/webp" && Math.max(row.width, row.height) <= 1000, row ? `${row.width}x${row.height} ${row.mime_type} ${row.bytes}B (source ${src.length}B)` : "no row");

  const file = await fetch(`${API}/${upJson.path}`);
  ok("file is served publicly as WebP", file.status === 200 && (file.headers.get("content-type") || "").includes("image/webp"), `${file.status} ${file.headers.get("content-type")}`);
  ok("file has long-lived immutable cache headers", /immutable/i.test(file.headers.get("cache-control") || ""), file.headers.get("cache-control") || "no cache-control");

  const img = await fetch(`${APP}/_next/image?url=${encodeURIComponent(`${API}/${upJson.path}`)}&w=640&q=75`, { headers: { accept: "image/avif,image/webp", ...BYPASS } });
  ok("next/image can optimize the uploaded file (AVIF/WebP, resized)", img.status === 200, `${img.status} ${img.headers.get("content-type")}`);

  // In-use guard: point a content item at the file, then try to delete the media.
  await api("PUT", `/items/${first.id}`, { body: { fields: { ...first.fields, _e2e_ref: upJson.path } }, token });
  const blocked = await api("DELETE", `/media/${upJson.id}`, { token });
  ok("deleting media that content still uses is refused (409)", blocked.status === 409, String(blocked.status));
  await api("PUT", `/items/${first.id}`, { body: { fields: first.fields }, token });

  const del = await api("DELETE", `/media/${upJson.id}`, { token });
  ok("deleting unused media succeeds", del.status === 200, String(del.status));
  // The web server keeps a static file handle cached for a few seconds, so give
  // the 404 up to ~15s to appear before calling it a failure.
  let goneStatus = 0;
  for (let i = 0; i < 15; i++) {
    goneStatus = (await fetch(`${API}/${upJson.path}?probe=${i}`)).status;
    if (goneStatus === 404) break;
    await new Promise((r) => setTimeout(r, 1000));
  }
  ok("the file itself is removed from the server", goneStatus === 404, `status ${goneStatus}`);
  const lib2 = (await api("GET", "/media-library")).json;
  ok("media row is gone from the library", !lib2?.some((m) => m.id === upJson.id));
}

// ---- storage & garbage -----------------------------------------------------
console.log("\nStorage (usage, permanent delete, cleanup preview)");
const usageNoAuth = await api("GET", "/storage");
ok("storage usage requires a session", usageNoAuth.status === 401, String(usageNoAuth.status));
const usage = await api("GET", "/storage", { token });
ok("storage usage is reported", usage.status === 200 && typeof usage.json?.bytes === "number", JSON.stringify(usage.json));
const cleanNoAuth = await api("POST", "/storage/cleanup", { body: { dryRun: true } });
ok("cleanup requires a session", cleanNoAuth.status === 401, String(cleanNoAuth.status));
const purgeNoAuth = await api("DELETE", "/items/1/purge");
ok("permanent delete requires a session", purgeNoAuth.status === 401, String(purgeNoAuth.status));

// Full life of a photo: upload -> add as a photo item -> trash it -> "delete forever" -> file is gone.
const png = await sharp({ create: { width: 800, height: 600, channels: 3, background: { r: 200, g: 60, b: 60 } } }).jpeg().toBuffer();
const gform = new FormData();
gform.set("file", new File([png], "e2e-garbage.jpg", { type: "image/jpeg" }));
const gup = await fetch(APP + "/admin/content/media/upload", { method: "POST", headers: { cookie, ...BYPASS }, body: gform });
const gj = await gup.json().catch(() => ({}));
ok("upload for the garbage test", gup.status === 201 && !!gj.path, `${gup.status}`);
ok("upload returns a blur-up placeholder", typeof gj.blur === "string" && gj.blur.startsWith("data:image/") && gj.blur.length < 2000, gj.blur ? `${gj.blur.length} chars` : "none (GD missing?)");
if (gj.path) {
  const created = await api("POST", "/items", { body: { section: "portfolio.photos", fields: { tab: "woman", src: gj.path, alt: "e2e garbage", size: "normal" } }, token });
  const itemId = created.json?.id;
  ok("photo item created", created.status === 201 && !!itemId, String(created.status));
  const stillThere = async () => (await fetch(`${API}/${gj.path}?p=${Math.random()}`)).status;
  await api("DELETE", `/items/${itemId}`, { token });
  ok("trashed photo keeps its file (it can still be restored)", (await stillThere()) === 200);
  const blocked2 = await api("DELETE", `/media/${gj.id}`, { token });
  ok("...and the media delete is refused while the trashed item references it", blocked2.status === 409, String(blocked2.status));
  const dry = await api("POST", "/storage/cleanup", { body: { dryRun: true, minAgeHours: 0 }, token });
  ok("cleanup preview does NOT list a file a trashed item still uses", dry.status === 200 && !dry.json.deleted.some((d) => d.path === gj.path), `${dry.json?.deleted?.length} candidates`);
  const purged = await api("DELETE", `/items/${itemId}/purge`, { token });
  ok("delete forever succeeds and reports the freed file", purged.status === 200 && purged.json.files?.some((f) => f.path === gj.path), JSON.stringify(purged.json?.files));
  let gone2 = 0;
  for (let i = 0; i < 15; i++) {
    gone2 = (await fetch(`${API}/${gj.path}?q=${i}`)).status;
    if (gone2 === 404) break;
    await new Promise((r) => setTimeout(r, 1000));
  }
  ok("the photo file is really deleted from the server", gone2 === 404, `status ${gone2}`);
  const libAfter = (await api("GET", "/media-library")).json;
  ok("and its library entry is gone", !libAfter?.some((m) => m.id === gj.id));
  const notInTrash = (await api("GET", "/items/trash", { token })).json;
  ok("and it is no longer in the trash", !notInTrash?.some((t) => t.id === itemId));
}
const lib3 = (await api("GET", "/media-library")).json;
ok("media library flags usage per file (in_use)", Array.isArray(lib3) && lib3.every((m) => typeof m.in_use === "boolean"));

// ---- final: everything back as it was --------------------------------------
console.log("\nFinal state");
const finalList = await list();
ok(`${LIST} is exactly as it started`, JSON.stringify(finalList) === JSON.stringify(original));

console.log(failures === 0 ? "\nALL E2E CHECKS PASSED" : `\n${failures} E2E CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
