<?php
/**
 * Nova SS Trading — standby contact endpoint (Exonhost).
 *
 * Drop-in replacement for the Next.js /api/contact route. The React form
 * on the static standby posts JSON here (via the .htaccess rewrite of
 * /api/contact) and expects the same contract back:
 *   success → {"ok":true}            failure → {"error":"…"}
 *
 * Delivery order: Brevo API (same service as production) → PHP mail().
 */

// ── Config — set your key before uploading ─────────────────────
const BREVO_API_KEY = 'PASTE-YOUR-BREVO-API-KEY-HERE';
const CONTACT_EMAIL = 'info@novasstrading.com';
const SITE_NAME     = 'Nova SS Trading';
const SITE_DOMAIN   = 'novasstrading.com';

// ── Plumbing ────────────────────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  exit(json_encode(['error' => 'Method not allowed.']));
}

// Same-site origin guard (mirrors the Next.js route)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && !preg_match('~^https?://(www\.)?' . preg_quote(SITE_DOMAIN, '~') . '$~', $origin)) {
  http_response_code(403);
  exit(json_encode(['error' => 'Forbidden.']));
}

$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) { $body = $_POST; }          // graceful non-JSON fallback
if (!is_array($body) || !$body) {
  http_response_code(400);
  exit(json_encode(['error' => 'Invalid request body.']));
}

// Honeypot — pretend success so bots move on
if (!empty($body['company_website'])) {
  exit(json_encode(['ok' => true]));
}

// ── Simple file-based rate limit: 10/hour per IP ───────────────
$ip   = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rlf  = sys_get_temp_dir() . '/nova-rl-' . md5($ip);
$hits = is_file($rlf) ? array_filter(
  json_decode(file_get_contents($rlf), true) ?: [],
  function ($t) { return $t > time() - 3600; }
) : [];
if (count($hits) >= 10) {
  http_response_code(429);
  exit(json_encode(['error' => "Too many submissions. Please email us directly at " . CONTACT_EMAIL]));
}
$hits[] = time();
@file_put_contents($rlf, json_encode(array_values($hits)));

// ── Extract, clean, validate ────────────────────────────────────
function clean_field($v): string {
  return is_string($v) ? mb_substr(trim(strip_tags($v)), 0, 2000) : '';
}
$name    = clean_field($body['name'] ?? '');
$email   = clean_field($body['email'] ?? '');
$company = clean_field($body['companyName'] ?? '');
$phone   = clean_field($body['phone'] ?? '');
$country = clean_field($body['country'] ?? '');
$subject = clean_field($body['subject'] ?? '') ?: 'General Inquiry';
$message = clean_field($body['message'] ?? '');

if (!$name || !$email || !$message) {
  http_response_code(422);
  exit(json_encode(['error' => 'Name, email, and message are required.']));
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(422);
  exit(json_encode(['error' => 'Please provide a valid email address.']));
}
if (mb_strlen($message) < 8) {
  http_response_code(422);
  exit(json_encode(['error' => 'Message must be at least 8 characters.']));
}

// ── Compose admin email ─────────────────────────────────────────
function esc_html($s): string {
  return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
}
$when = (new DateTime('now', new DateTimeZone('Asia/Dhaka')))->format('D d M Y, H:i:s') . ' (Dhaka)';
$rows = '';
foreach ([
  'Name' => $name, 'Company' => $company ?: '—', 'Email' => $email,
  'Phone' => $phone ?: '—', 'Country' => $country ?: '—', 'Subject' => $subject,
  'IP' => $ip, 'Submitted' => $when, 'Served by' => 'Standby (Exonhost)',
] as $k => $v) {
  $rows .= "<tr><td style='padding:8px 14px;color:#64748b;font-size:12px;border-top:1px solid #e2e8f0;'>" . esc_html($k) . '</td>'
        . "<td style='padding:8px 14px;color:#0f172a;font-size:13px;border-top:1px solid #e2e8f0;'>" . esc_html($v) . '</td></tr>';
}
$adminHtml = "<!doctype html><html><body style='font-family:Arial,sans-serif;background:#f1f5f9;padding:24px;'>"
  . "<div style='max-width:620px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;'>"
  . "<div style='background:#0b192c;padding:22px 28px;'>"
  . "<p style='margin:0;color:#b08a4f;font-size:11px;letter-spacing:2px;text-transform:uppercase;'>" . SITE_NAME . " — standby form</p>"
  . "<h1 style='margin:6px 0 0;color:#f1f5f9;font-size:19px;'>New Inquiry Received</h1></div>"
  . "<table width='100%' cellpadding='0' cellspacing='0'>{$rows}</table>"
  . "<div style='padding:18px 28px 26px;'><p style='margin:0 0 6px;color:#64748b;font-size:11px;letter-spacing:2px;text-transform:uppercase;'>Message</p>"
  . "<div style='background:#f8fafc;border-left:3px solid #b08a4f;padding:14px 18px;color:#334155;font-size:14px;line-height:1.7;white-space:pre-wrap;'>"
  . esc_html($message)
  . '</div></div>'
  . "</div></body></html>";

$mailSubject = '[' . SITE_NAME . '] New Inquiry (standby): ' . $subject;

// ── Send: Brevo first, PHP mail() as backup ─────────────────────
function send_brevo(string $to, string $toName, string $subj, string $html, string $replyTo, string $replyName): bool {
  if (BREVO_API_KEY === '' || strpos(BREVO_API_KEY, 'PASTE-') === 0) return false;
  $payload = json_encode([
    'sender'      => ['name' => SITE_NAME, 'email' => 'noreply@' . SITE_DOMAIN],
    'to'          => [['email' => $to, 'name' => $toName]],
    'subject'     => $subj,
    'htmlContent' => $html,
    'replyTo'     => ['email' => $replyTo, 'name' => $replyName],
  ]);
  $ch = curl_init('https://api.brevo.com/v3/smtp/email');
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => ['accept: application/json', 'api-key: ' . BREVO_API_KEY, 'content-type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
  ]);
  $res = curl_exec($ch);
  curl_close($ch);
  return is_string($res) && strpos($res, 'messageId') !== false;
}

$sent = send_brevo(CONTACT_EMAIL, SITE_NAME, $mailSubject, $adminHtml, $email, $name);

if (!$sent) {
  $headers = "MIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n"
    . 'From: ' . SITE_NAME . ' <noreply@' . SITE_DOMAIN . ">\r\n"
    . "Reply-To: {$name} <{$email}>\r\n";
  $sent = @mail(CONTACT_EMAIL, $mailSubject, $adminHtml, $headers);
}

if (!$sent) {
  http_response_code(500);
  exit(json_encode(['error' => 'Delivery issue. Please email us directly at ' . CONTACT_EMAIL]));
}

exit(json_encode([
  'ok'      => true,
  'message' => "Thank you {$name}! Your inquiry has been received. We'll be in touch within 1–2 business days.",
]));
