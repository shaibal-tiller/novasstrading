import { NextResponse } from "next/server";
import { headers } from "next/headers";

export const runtime = "nodejs";

// ─────────────────────────────────────────────────────────────
//  CONFIG
// ─────────────────────────────────────────────────────────────
const BREVO_API_KEY   = process.env.BREVO_API_KEY ?? "";
const CONTACT_EMAIL   = process.env.CONTACT_EMAIL ?? "info@novasstrading.com";
const SITE_NAME       = process.env.SITE_NAME     ?? "Nova SS Trading";
const SITE_DOMAIN     = process.env.SITE_DOMAIN   ?? "novasstrading.com";

const RATE_MAX        = 10;    // max submissions per window
const RATE_WINDOW_MS  = 60 * 60 * 1000;   // 1 hour
const BLOCK_MS        = 2 * 60 * 60 * 1000; // 2 hour block after exceeded

const ALLOWED_ORIGINS = [
  `https://${SITE_DOMAIN}`,
  `https://www.${SITE_DOMAIN}`,
  `http://localhost:3000`,
  `http://localhost:3001`,
];

// ─────────────────────────────────────────────────────────────
//  IN-MEMORY RATE LIMITER
// ─────────────────────────────────────────────────────────────
interface RateRecord {
  timestamps: number[];
  blockedUntil: number;
}
const rateLimitMap = new Map<string, RateRecord>();

function checkRateLimit(ip: string): string | null {
  const now = Date.now();
  const rec: RateRecord = rateLimitMap.get(ip) ?? { timestamps: [], blockedUntil: 0 };

  if (rec.blockedUntil > now) {
    const minsLeft = Math.ceil((rec.blockedUntil - now) / 60000);
    return `Too many submissions from your connection. Please try again in ${minsLeft} minutes or email us directly at ${CONTACT_EMAIL}`;
  }

  // Prune timestamps outside the rolling window
  rec.timestamps = rec.timestamps.filter((t) => now - t < RATE_WINDOW_MS);

  if (rec.timestamps.length >= RATE_MAX) {
    rec.blockedUntil = now + BLOCK_MS;
    rateLimitMap.set(ip, rec);
    return `Too many submissions. You are temporarily blocked for 2 hours. You can also email us directly at ${CONTACT_EMAIL}`;
  }

  rec.timestamps.push(now);
  rateLimitMap.set(ip, rec);
  return null; // allowed
}

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
function getClientIp(hdrs: Headers): string {
  const candidates = [
    hdrs.get("cf-connecting-ip"),
    hdrs.get("x-real-ip"),
    hdrs.get("x-forwarded-for")?.split(",")[0].trim(),
  ];
  return candidates.find((v) => v && v.length > 0) ?? "unknown";
}

function clean(val: unknown): string {
  if (typeof val !== "string") return "";
  return val.trim().replace(/<[^>]*>/g, "").slice(0, 2000);
}

function toDhakaTime(): string {
  return new Date().toLocaleString("en-GB", {
    timeZone: "Asia/Dhaka",
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

async function geoLookup(ip: string): Promise<Record<string, string>> {
  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,regionName,city,isp,org,timezone`,
      { signal: AbortSignal.timeout(3000) }
    );
    const json = (await res.json()) as Record<string, string>;
    if (json.status === "success") return json;
  } catch { /* geo lookup is best-effort */ }
  return {};
}

async function sendBrevoEmail(payload: object): Promise<boolean> {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept":        "application/json",
      "api-key":       BREVO_API_KEY,
      "content-type":  "application/json",
    },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as Record<string, unknown>;
  return Boolean(json.messageId);
}

// ─────────────────────────────────────────────────────────────
//  EMAIL TEMPLATES
// ─────────────────────────────────────────────────────────────

/** Admin notification email — rich HTML, collapsible metadata */
function buildAdminEmail(fields: {
  name: string; company: string; email: string; phone: string;
  country: string; subject: string; message: string;
  meta: Record<string, string>; spamLabel: string; csrfNote: string;
}): string {
  const { name, company, email, phone, country, subject, message, meta, spamLabel, csrfNote } = fields;

  const metaRows = Object.entries(meta)
    .map(([k, v]) => `
      <tr>
        <td style="padding:6px 14px;color:#94a3b8;font-size:12px;white-space:nowrap;border-top:1px solid #1e293b;">${k}</td>
        <td style="padding:6px 14px;color:#cbd5e1;font-size:12px;border-top:1px solid #1e293b;">${v}</td>
      </tr>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>New Inquiry — ${SITE_NAME}</title></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px;">
<tr><td align="center">
<table width="620" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;max-width:100%;">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#0b192c 0%,#1a3a5c 100%);padding:28px 36px;">
    <table width="100%"><tr>
      <td>
        <p style="margin:0;color:#64748b;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Nova SS Trading</p>
        <h1 style="margin:6px 0 0;color:#f1f5f9;font-size:20px;font-weight:700;">📨 New Inquiry Received</h1>
      </td>
      <td align="right">
        <span style="background:#b08a4f;color:#0f172a;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;white-space:nowrap;">${spamLabel}</span>
      </td>
    </tr></table>
    <p style="margin:10px 0 0;color:#64748b;font-size:12px;">via Website Contact Form &nbsp;•&nbsp; ${toDhakaTime()}</p>
  </td></tr>

  <!-- Contact Details -->
  <tr><td style="padding:28px 36px 0;">
    <p style="margin:0 0 14px;color:#64748b;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Contact Details</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #334155;">
      <tr style="background:#0f172a;">
        <td style="padding:12px 16px;color:#64748b;font-size:12px;width:110px;">Name</td>
        <td style="padding:12px 16px;color:#f1f5f9;font-size:15px;font-weight:700;">${name}</td>
      </tr>
      <tr><td style="padding:11px 16px;color:#64748b;font-size:12px;border-top:1px solid #1e293b;">Company</td>
        <td style="padding:11px 16px;color:#cbd5e1;font-size:13px;border-top:1px solid #1e293b;">${company || "—"}</td></tr>
      <tr style="background:#0f172a;"><td style="padding:11px 16px;color:#64748b;font-size:12px;border-top:1px solid #1e293b;">Email</td>
        <td style="padding:11px 16px;font-size:13px;border-top:1px solid #1e293b;"><a href="mailto:${email}" style="color:#60a5fa;text-decoration:none;">${email}</a></td></tr>
      <tr><td style="padding:11px 16px;color:#64748b;font-size:12px;border-top:1px solid #1e293b;">Phone</td>
        <td style="padding:11px 16px;color:#cbd5e1;font-size:13px;border-top:1px solid #1e293b;">${phone || "—"}</td></tr>
      <tr style="background:#0f172a;"><td style="padding:11px 16px;color:#64748b;font-size:12px;border-top:1px solid #1e293b;">Country</td>
        <td style="padding:11px 16px;color:#cbd5e1;font-size:13px;border-top:1px solid #1e293b;">${country || "—"}</td></tr>
      <tr><td style="padding:11px 16px;color:#64748b;font-size:12px;border-top:1px solid #1e293b;">Subject</td>
        <td style="padding:11px 16px;color:#f1f5f9;font-size:13px;font-weight:600;border-top:1px solid #1e293b;">${subject}</td></tr>
    </table>
  </td></tr>

  <!-- Message -->
  <tr><td style="padding:24px 36px 0;">
    <p style="margin:0 0 10px;color:#64748b;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Message</p>
    <div style="background:#0f172a;border-left:3px solid #b08a4f;border-radius:0 10px 10px 0;padding:20px 22px;color:#cbd5e1;font-size:14px;line-height:1.75;white-space:pre-wrap;">${message}</div>
  </td></tr>

  <!-- Quick Reply CTA -->
  <tr><td style="padding:24px 36px 0;" align="center">
    <a href="mailto:${email}?subject=Re: ${subject}" style="display:inline-block;background:#b08a4f;color:#0f172a;text-decoration:none;padding:13px 36px;border-radius:999px;font-size:14px;font-weight:700;letter-spacing:0.3px;">↩ Reply to ${name}</a>
  </td></tr>

  <!-- Metadata (collapsible) -->
  <tr><td style="padding:24px 36px 0;">
    <details style="border:1px solid #334155;border-radius:10px;overflow:hidden;">
      <summary style="padding:12px 16px;background:#0f172a;color:#64748b;font-size:12px;cursor:pointer;font-weight:600;list-style:none;">🔍 Submission Metadata</summary>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e293b;">${metaRows}</table>
    </details>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:24px 36px;text-align:center;border-top:1px solid #334155;margin-top:8px;">
    <p style="margin:0;color:#475569;font-size:11px;">${csrfNote} &nbsp;•&nbsp; Delivered via Brevo API &nbsp;•&nbsp; ${SITE_NAME}</p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

/** Customer auto-reply — supports system dark/light mode via media query */
function buildAutoReply(name: string, subject: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>We received your inquiry — ${SITE_NAME}</title>
<style>
  body { margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; }
  .wrapper { background:#f1f5f9;padding:32px 16px; }
  .card { background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;margin:0 auto;box-shadow:0 4px 24px rgba(0,0,0,0.06); }
  .header { background:linear-gradient(135deg,#0b192c 0%,#1a3a5c 100%);padding:36px 40px;text-align:center; }
  .body-cell { padding:36px 40px 0; }
  .subject-card { background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:20px 22px;margin:0; }
  .timeline-card { background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px 22px;text-align:center; }
  .contact-block { border:1px solid #e2e8f0;border-radius:10px;overflow:hidden; }
  .contact-row { padding:14px 18px;font-size:14px; }
  .footer-cell { padding:28px 40px;border-top:1px solid #f1f5f9; }

  @media (prefers-color-scheme: dark) {
    body, .wrapper { background:#0f172a !important; }
    .card { background:#1e293b !important;box-shadow:0 4px 24px rgba(0,0,0,0.4) !important; }
    .subject-card { background:#0c2237 !important;border-color:#1e4976 !important; }
    .subject-card .label { color:#60a5fa !important; }
    .subject-card .value { color:#e2e8f0 !important; }
    .timeline-card { background:#052e16 !important;border-color:#166534 !important; }
    .timeline-card .tl-label { color:#4ade80 !important; }
    .timeline-card .tl-value { color:#86efac !important; }
    .body-cell h2, .body-cell p.lede { color:#e2e8f0 !important; }
    .contact-block { border-color:#334155 !important; }
    .contact-row { background:#0f172a !important;border-top-color:#1e293b !important; }
    .contact-row .c-label { color:#64748b !important; }
    .contact-row .c-value a { color:#60a5fa !important; }
    .footer-cell { border-top-color:#334155 !important; }
    .footer-cell p { color:#475569 !important; }
    .footer-cell a { color:#60a5fa !important; }
  }
</style>
</head>
<body>
<div class="wrapper">
<div class="card">

  <!-- Header -->
  <div class="header">
    <p style="margin:0;color:#b08a4f;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:600;">Nova SS Trading</p>
    <h1 style="margin:10px 0 4px;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.3px;">Inquiry Received</h1>
    <p style="margin:0;color:#94a3b8;font-size:13px;">We'll be in touch soon</p>
  </div>

  <!-- Greeting -->
  <div class="body-cell">
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;font-weight:700;">Hi ${name},</h2>
    <p class="lede" style="margin:0;color:#475569;font-size:15px;line-height:1.75;">
      Thank you for reaching out to <strong>${SITE_NAME}</strong>. We've received your inquiry and our sourcing team is already reviewing your details.
    </p>
  </div>

  <!-- Subject card -->
  <div class="body-cell" style="padding-top:24px;">
    <div class="subject-card">
      <p class="label" style="margin:0 0 5px;color:#0369a1;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Your Inquiry</p>
      <p class="value" style="margin:0;color:#0c4a6e;font-size:16px;font-weight:700;">${subject || "General Inquiry"}</p>
    </div>
  </div>

  <!-- Timeline -->
  <div class="body-cell" style="padding-top:16px;">
    <div class="timeline-card">
      <p class="tl-label" style="margin:0;color:#15803d;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">⏱ Expected Response Time</p>
      <p class="tl-value" style="margin:8px 0 0;color:#166534;font-size:26px;font-weight:800;letter-spacing:-0.5px;">1–2 Business Days</p>
    </div>
  </div>

  <!-- Direct contact options -->
  <div class="body-cell" style="padding-top:24px;">
    <p style="margin:0 0 14px;color:#475569;font-size:14px;">Need immediate assistance? Reach us directly:</p>
    <div class="contact-block">
      <div class="contact-row" style="border-bottom:1px solid #e2e8f0;">
        <span class="c-label" style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:4px;">📱 Phone / WhatsApp</span>
        <span class="c-value"><a href="https://wa.me/8801351153898" style="color:#2563eb;font-size:15px;font-weight:700;text-decoration:none;">+880 1351-153898</a></span>
      </div>
      <div class="contact-row">
        <span class="c-label" style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:4px;">✉️ Email</span>
        <span class="c-value"><a href="mailto:${CONTACT_EMAIL}" style="color:#2563eb;font-size:15px;font-weight:700;text-decoration:none;">${CONTACT_EMAIL}</a></span>
      </div>
    </div>
  </div>

  <!-- Sign off -->
  <div class="body-cell" style="padding-top:28px;padding-bottom:4px;">
    <p style="margin:0;color:#475569;font-size:14px;line-height:1.7;">
      Warm regards,<br>
      <strong style="color:#0f172a;">${SITE_NAME} Team</strong>
    </p>
  </div>

  <!-- Footer -->
  <div class="footer-cell">
    <p style="margin:0 0 4px;color:#94a3b8;font-size:12px;text-align:center;">
      Baridhara DOHS, Road #5, House No #357, Dhaka, Bangladesh
    </p>
    <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
      <a href="https://www.${SITE_DOMAIN}" style="color:#94a3b8;text-decoration:underline;">www.${SITE_DOMAIN}</a>
    </p>
  </div>

</div>
</div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
//  MAIN HANDLER
// ─────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const hdrs = headers();

  // ── 1. Origin guard ────────────────────────────────────────
  const origin = hdrs.get("origin") ?? "";
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  // ── 2. Parse body ──────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // ── 3. Honeypot ────────────────────────────────────────────
  if (body.company_website) {
    // Silently pretend success — bots think it worked
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // ── 4. Rate limit ──────────────────────────────────────────
  const ip = getClientIp(hdrs);
  const rateDeny = checkRateLimit(ip);
  if (rateDeny) {
    return NextResponse.json({ error: rateDeny }, { status: 429 });
  }

  // ── 5. Extract & clean fields ──────────────────────────────
  const name        = clean(body.name);
  const email       = clean(body.email);
  const companyName = clean(body.companyName);
  const phone       = clean(body.phone);
  const country     = clean(body.country);
  const subject     = clean(body.subject) || "General Inquiry";
  const message     = clean(body.message);
  const userAgent   = clean(body.userAgent) || hdrs.get("user-agent") || "";
  const referrer    = clean(body.referrer);

  // ── 6. Validate ────────────────────────────────────────────
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!name || !email || !message) {
    return NextResponse.json({ error: "Name, email, and message are required." }, { status: 422 });
  }
  if (!emailRe.test(email)) {
    return NextResponse.json({ error: "Please provide a valid email address." }, { status: 422 });
  }
  if (message.length < 8) {
    return NextResponse.json({ error: "Message must be at least 8 characters." }, { status: 422 });
  }

  // ── 7. Metadata ────────────────────────────────────────────
  const geo = await geoLookup(ip);

  const meta: Record<string, string> = {
    "IP Address":    ip,
    "User Agent":    userAgent || "—",
    "Referrer":      referrer  || "Direct / No referrer",
    "Browser Locale": hdrs.get("accept-language") ?? "—",
    "Submitted At":  toDhakaTime(),
  };

  if (geo.status === "success") {
    meta["Geo: Country"]  = geo.country     ?? "—";
    meta["Geo: Region"]   = geo.regionName  ?? "—";
    meta["Geo: City"]     = geo.city        ?? "—";
    meta["Geo: ISP"]      = geo.isp         ?? "—";
    meta["Geo: Org"]      = geo.org         ?? "—";
    meta["Geo: Timezone"] = geo.timezone    ?? "—";
  } else {
    meta["Geo Lookup"] = "Could not resolve (private IP or lookup failed)";
  }

  // ── 8. Spam score ──────────────────────────────────────────
  let score = 0;
  if (!userAgent)                             score++;
  if (!hdrs.get("accept-language"))           score++;
  if (message.length < 20)                    score++;
  if (/https?:\/\//i.test(message))          score++;

  const spamLabel =
    score === 0 ? "✅ Human"
    : score === 1 ? "⚠️ Low suspicion"
    : score === 2 ? "🔶 Medium suspicion"
    : `🚨 High suspicion (score: ${score})`;

  meta["Spam Score"] = spamLabel;

  const csrfNote = "Honeypot: cleared";

  // ── 9. Send admin notification ─────────────────────────────
  if (!BREVO_API_KEY) {
    console.error("[contact] BREVO_API_KEY not set — email not sent");
    return NextResponse.json({ error: "Email service not configured." }, { status: 503 });
  }

  const adminHtml = buildAdminEmail({
    name, company: companyName, email, phone, country, subject, message, meta, spamLabel, csrfNote,
  });

  const sent = await sendBrevoEmail({
    sender:      { name: SITE_NAME, email: `noreply@${SITE_DOMAIN}` },
    to:          [{ email: CONTACT_EMAIL, name: SITE_NAME }],
    subject:     `📨 [${SITE_NAME}] New Inquiry: ${subject}`,
    htmlContent: adminHtml,
    replyTo:     { email, name },
  });

  if (!sent) {
    console.error("[contact] Brevo delivery failed for admin email");
    return NextResponse.json(
      { error: `Delivery issue. Please email us directly at ${CONTACT_EMAIL}` },
      { status: 500 },
    );
  }

  // ── 10. Send customer auto-reply (best-effort) ─────────────
  const autoReplyHtml = buildAutoReply(name, subject);
  await sendBrevoEmail({
    sender:      { name: SITE_NAME, email: `info@${SITE_DOMAIN}` },
    to:          [{ email, name }],
    subject:     `Re: Your Inquiry with ${SITE_NAME} — ${subject}`,
    htmlContent: autoReplyHtml,
  }).catch(() => { /* auto-reply failure must not block the success response */ });

  // ── 11. Done ───────────────────────────────────────────────
  return NextResponse.json(
    { ok: true, message: `Thank you ${name}! Your inquiry has been received. We'll be in touch within 1–2 business days.` },
    { status: 200 },
  );
}
