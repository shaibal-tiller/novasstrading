<?php
// ============================================================
//  process_form.php  –  Novasstrading Contact Form Handler
//  Hardened Edition: Rate limiting, CSRF, metadata collection
// ============================================================

session_start();

// ── LOAD .ENV FILE ──────────────────────────────────────────
// Simple .env parser — returns an associative array.
// Does NOT rely on putenv/getenv (disabled on many cPanel hosts).
function load_env($path) {
    $vars = [];
    if (!file_exists($path)) return $vars;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;        // skip comments
        if (strpos($line, '=') === false) continue;            // skip malformed
        [$key, $value] = array_map('trim', explode('=', $line, 2));
        $value = trim($value, '"\'');                          // strip quotes
        $vars[$key] = $value;
    }
    return $vars;
}

$env = load_env(__DIR__ . '/.env');

// ── CONFIGURATION ───────────────────────────────────────────
$to            = $env['CONTACT_EMAIL'] ?? "info@novasstrading.com";
$site          = $env['SITE_NAME']     ?? "Nova SS Trading";
$domain        = $env['SITE_DOMAIN']   ?? "novasstrading.com";
$brevo_api_key = $env['BREVO_API_KEY'] ?? "";

// Rate limit config
$RATE_LIMIT_MAX      = 3;    // max submissions allowed
$RATE_LIMIT_WINDOW   = 3600; // per this many seconds (1 hour)
$BLOCK_DURATION      = 7200; // seconds to block after exceeding limit (2 hours)

// Allowed origins
$allowed_origins = [
    "https://novasstrading.com",
    "https://www.novasstrading.com",
    "http://novasstrading.com",
    "http://www.novasstrading.com",
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

header('Content-Type: application/json');

// ── HELPER: JSON exit ────────────────────────────────────────
function respond($success, $message, $code = 200) {
    http_response_code($code);
    echo json_encode(['success' => $success, 'message' => $message]);
    exit;
}

// ── REQUEST METHOD CHECK ─────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Method not allowed.', 405);
}

// ── HONEYPOT CHECK ───────────────────────────────────────────
if (!empty($_POST['fax_number'])) {
    // Silently pretend success to waste bot's time
    respond(true, 'Thank you! Your bulk inquiry has been successfully processed.');
}

// ── GET REAL CLIENT IP ───────────────────────────────────────
// Checks proxy headers in order of trust, falls back to REMOTE_ADDR
function get_client_ip() {
    $headers = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];
    foreach ($headers as $h) {
        if (!empty($_SERVER[$h])) {
            // X-Forwarded-For can be a comma-separated list; take first
            $ip = trim(explode(',', $_SERVER[$h])[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return $ip;
            }
        }
    }
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

$client_ip = get_client_ip();

// ── FILE-BASED RATE LIMITER ──────────────────────────────────
// Uses /tmp for storage — works on any shared host with no DB/Redis needed.
// Each IP gets a small JSON file tracking submission timestamps.
function check_rate_limit($ip, $max, $window, $block_duration) {
    $safe_ip  = preg_replace('/[^a-zA-Z0-9_\-.]/', '_', $ip);
    $log_file = sys_get_temp_dir() . "/rl_novas_{$safe_ip}.json";
    $now      = time();

    $data = ['blocked_until' => 0, 'timestamps' => []];

    if (file_exists($log_file)) {
        $raw = file_get_contents($log_file);
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            $data = $decoded;
        }
    }

    // Still in block period?
    if ($data['blocked_until'] > $now) {
        $wait = ceil(($data['blocked_until'] - $now) / 60);
        return "Too many submissions. You are temporarily blocked. Try again in {$wait} minutes.";
    }

    // Prune timestamps outside the rolling window
    $data['timestamps'] = array_filter($data['timestamps'], fn($t) => ($now - $t) < $window);
    $data['timestamps'] = array_values($data['timestamps']);

    if (count($data['timestamps']) >= $max) {
        // Exceeded — set block
        $data['blocked_until'] = $now + $block_duration;
        file_put_contents($log_file, json_encode($data), LOCK_EX);
        return "Too many submissions from your connection. Please try again in 2 hours or email us directly at info@novasstrading.com";
    }

    // Log this attempt
    $data['timestamps'][] = $now;
    file_put_contents($log_file, json_encode($data), LOCK_EX);
    return null; // null = allowed
}

$rate_error = check_rate_limit($client_ip, $RATE_LIMIT_MAX, $RATE_LIMIT_WINDOW, $BLOCK_DURATION);
if ($rate_error) {
    respond(false, $rate_error, 429);
}

// ── CSRF TOKEN VALIDATION ────────────────────────────────────
// Your contact.html fetches a token from get_csrf.php on load and sends it back.
// If token is missing or mismatched, reject the request.
if (!empty($_POST['csrf_token'])) {
    if (empty($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'])) {
        respond(false, 'Security token mismatch. Please refresh the page and try again.', 403);
    }
}
// If no CSRF token sent at all, allow through BUT flag it in the email
// (Useful during transition — change to hard-reject after you update contact.html)
$csrf_verified = !empty($_POST['csrf_token']);

// Regenerate token after use (one-time use token)
$_SESSION['csrf_token'] = bin2hex(random_bytes(32));

// ── INPUT SANITATION ─────────────────────────────────────────
function clean($val) {
    return htmlspecialchars(strip_tags(trim($val ?? '')), ENT_QUOTES, 'UTF-8');
}

// ── COLLECT FORM DATA ────────────────────────────────────────
$name        = clean($_POST['name']);
$company     = clean($_POST['company']);
$email       = clean($_POST['email']);
$phone       = clean($_POST['phone']);
$country     = clean($_POST['country']);
$subject     = clean($_POST['subject'] ?: 'General Inquiry');
$message     = clean($_POST['message']);
$form_source = clean($_POST['form_source'] ?: 'Website Contact Page');

// ── COLLECT BACKGROUND METADATA ─────────────────────────────
// This data is invisible to the user — it enriches the admin email only.
$meta = [];

// 1. IP Address (already resolved above, handles Cloudflare + proxies)
$meta['IP Address']    = $client_ip;

// 2. User-Agent (browser + OS fingerprint)
$meta['User Agent']    = $_SERVER['HTTP_USER_AGENT'] ?? 'Not available';

// 3. Referrer (which page they came from before the contact page)
$meta['Referrer']      = $_SERVER['HTTP_REFERER'] ?? 'Direct / No referrer';

// 4. Submission timestamp in Dhaka timezone
date_default_timezone_set('Asia/Dhaka');
$meta['Submitted At']  = date('D, d M Y  H:i:s T');

// 5. Accept-Language (browser locale — useful to infer region)
$meta['Browser Locale'] = $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? 'Not available';

// 6. Geo-lookup from IP (uses free ip-api.com — no key needed, 45 req/min limit)
//    Skips if the IP is local/private.
$geo = [];
if (filter_var($client_ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
    $geo_raw = @file_get_contents("http://ip-api.com/json/{$client_ip}?fields=status,country,regionName,city,isp,org,timezone");
    if ($geo_raw) {
        $geo = json_decode($geo_raw, true) ?? [];
    }
}

if (!empty($geo) && ($geo['status'] ?? '') === 'success') {
    $meta['Geo: Country']  = $geo['country']     ?? '—';
    $meta['Geo: Region']   = $geo['regionName']  ?? '—';
    $meta['Geo: City']     = $geo['city']        ?? '—';
    $meta['Geo: ISP']      = $geo['isp']         ?? '—';
    $meta['Geo: Org']      = $geo['org']         ?? '—';
    $meta['Geo: Timezone'] = $geo['timezone']    ?? '—';
} else {
    $meta['Geo Lookup'] = 'Could not resolve (private IP or lookup failed)';
}

// 7. Simple bot signal score
$bot_signals = 0;
if (empty($_SERVER['HTTP_USER_AGENT']))       $bot_signals++; // No UA
if (empty($_SERVER['HTTP_ACCEPT_LANGUAGE']))  $bot_signals++; // No locale
if (!$csrf_verified)                          $bot_signals++; // No CSRF token
if (strlen($message) < 20)                   $bot_signals++; // Very short message
if (preg_match('/http[s]?:\/\//i', $message)) $bot_signals++; // URL in message

$bot_label = match(true) {
    $bot_signals === 0 => '✅ Likely human',
    $bot_signals === 1 => '⚠️  Low suspicion (score: 1)',
    $bot_signals === 2 => '🔶 Medium suspicion (score: 2)',
    default            => '🚨 High suspicion — possible bot/spam (score: ' . $bot_signals . ')',
};
$meta['Spam Score'] = $bot_label;

// ── VALIDATION ───────────────────────────────────────────────
$errors = [];
if (empty($name) || empty($email) || empty($message)) {
    $errors[] = "Please fill out all required fields.";
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = "Invalid email address.";
}
if (!empty($errors)) {
    respond(false, implode(' ', $errors), 400);
}

// ── BUILD ADMIN EMAIL (HTML) ─────────────────────────────────
$meta_rows = '';
foreach ($meta as $label => $value) {
    $meta_rows .= "<tr><td style='padding:6px 12px;color:#64748b;font-size:13px;white-space:nowrap;'>{$label}</td><td style='padding:6px 12px;color:#334155;font-size:13px;'>{$value}</td></tr>";
}

$admin_html = <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#0b192c,#1a365d);padding:28px 32px;">
    <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">📨 New Inquiry Received</h1>
    <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">via {$form_source} &nbsp;•&nbsp; {$meta['Submitted At']}</p>
  </td></tr>

  <!-- Contact Details -->
  <tr><td style="padding:28px 32px 0;">
    <h2 style="margin:0 0 16px;font-size:14px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Contact Details</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <tr style="background:#f8fafc;">
        <td style="padding:12px 16px;color:#64748b;font-size:13px;width:120px;">Name</td>
        <td style="padding:12px 16px;color:#0f172a;font-size:15px;font-weight:600;">{$name}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;color:#64748b;font-size:13px;border-top:1px solid #f1f5f9;">Company</td>
        <td style="padding:12px 16px;color:#334155;font-size:14px;border-top:1px solid #f1f5f9;">COMPANY_VAL</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="padding:12px 16px;color:#64748b;font-size:13px;">Email</td>
        <td style="padding:12px 16px;font-size:14px;"><a href="mailto:{$email}" style="color:#2563eb;text-decoration:none;">{$email}</a></td>
      </tr>
      <tr>
        <td style="padding:12px 16px;color:#64748b;font-size:13px;border-top:1px solid #f1f5f9;">Phone</td>
        <td style="padding:12px 16px;color:#334155;font-size:14px;border-top:1px solid #f1f5f9;">PHONE_VAL</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="padding:12px 16px;color:#64748b;font-size:13px;">Country</td>
        <td style="padding:12px 16px;color:#334155;font-size:14px;">COUNTRY_VAL</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;color:#64748b;font-size:13px;border-top:1px solid #f1f5f9;">Subject</td>
        <td style="padding:12px 16px;color:#0f172a;font-size:14px;font-weight:600;border-top:1px solid #f1f5f9;">{$subject}</td>
      </tr>
    </table>
  </td></tr>

  <!-- Message -->
  <tr><td style="padding:24px 32px 0;">
    <h2 style="margin:0 0 12px;font-size:14px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Message</h2>
    <div style="background:#f8fafc;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;padding:20px;color:#334155;font-size:14px;line-height:1.7;">
      MESSAGE_CONTENT
    </div>
  </td></tr>

  <!-- Quick Reply -->
  <tr><td style="padding:20px 32px 0;" align="center">
    <a href="mailto:{$email}?subject=Re: {$subject}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">↩ Reply to {$name}</a>
  </td></tr>

  <!-- Metadata -->
  <tr><td style="padding:28px 32px 0;">
    <details style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <summary style="padding:12px 16px;background:#f8fafc;color:#64748b;font-size:13px;cursor:pointer;font-weight:600;">🔍 Submission Metadata (internal)</summary>
      <table width="100%" cellpadding="0" cellspacing="0">
        {$meta_rows}
      </table>
    </details>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:24px 32px;border-top:1px solid #f1f5f9;margin-top:20px;">
    <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
      CSRF verified: CSRF_STATUS &nbsp;•&nbsp; Sent via Brevo API &nbsp;•&nbsp; {$site}
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>
HTML;

// Replace placeholders (avoids complex escaping in heredoc)
$admin_html = str_replace('COMPANY_VAL', $company ?: '—', $admin_html);
$admin_html = str_replace('PHONE_VAL', $phone ?: '—', $admin_html);
$admin_html = str_replace('COUNTRY_VAL', $country ?: '—', $admin_html);
$admin_html = str_replace('MESSAGE_CONTENT', nl2br(wordwrap($message, 80, "\n", true)), $admin_html);
$admin_html = str_replace('CSRF_STATUS', $csrf_verified ? 'Yes ✅' : 'No ⚠️', $admin_html);

// ── SEND ADMIN NOTIFICATION ──────────────────────────────────
$url = 'https://api.brevo.com/v3/smtp/email';

$admin_email_data = [
    'sender'      => ['name' => $site, 'email' => "noreply@{$domain}"],
    'to'          => [['email' => $to, 'name' => $site]],
    'subject'     => "📨 [{$site}] New Inquiry: {$subject}",
    'htmlContent' => $admin_html,
    'replyTo'     => ['email' => $email, 'name' => $name],
];

$ctx = stream_context_create(['http' => [
    'header'        => "Accept: application/json\r\nAPI-Key: {$brevo_api_key}\r\nContent-Type: application/json\r\n",
    'method'        => 'POST',
    'content'       => json_encode($admin_email_data),
    'ignore_errors' => true,
]]);
$admin_result = file_get_contents($url, false, $ctx);
$admin_status = json_decode($admin_result, true);

// ── SEND AUTO-REPLY TO CUSTOMER (HTML) ───────────────────────
$reply_html = <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#0b192c,#1a365d);padding:32px;text-align:center;">
    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">NOVA SS TRADING</h1>
    <p style="margin:8px 0 0;color:#60a5fa;font-size:13px;letter-spacing:2px;">PREMIUM SOURCING PARTNER</p>
  </td></tr>

  <!-- Greeting -->
  <tr><td style="padding:32px 32px 0;">
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;">Hi {$name},</h2>
    <p style="margin:0;color:#475569;font-size:15px;line-height:1.7;">
      Thank you for reaching out to us! We've received your inquiry and our sourcing team is already reviewing your details.
    </p>
  </td></tr>

  <!-- Inquiry Summary Card -->
  <tr><td style="padding:24px 32px 0;">
    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:20px;">
      <p style="margin:0 0 4px;color:#0369a1;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Your Inquiry</p>
      <p style="margin:0;color:#0c4a6e;font-size:16px;font-weight:600;">{$subject}</p>
    </div>
  </td></tr>

  <!-- Timeline -->
  <tr><td style="padding:24px 32px 0;">
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;text-align:center;">
      <p style="margin:0;color:#15803d;font-size:14px;font-weight:600;">⏱ Expected Response Time</p>
      <p style="margin:8px 0 0;color:#166534;font-size:22px;font-weight:700;">1–2 Business Days</p>
    </div>
  </td></tr>

  <!-- Contact Options -->
  <tr><td style="padding:24px 32px 0;">
    <p style="margin:0 0 16px;color:#475569;font-size:14px;">Need immediate assistance? Reach us directly:</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:12px 16px;background:#f8fafc;border-radius:8px 8px 0 0;border:1px solid #e2e8f0;border-bottom:none;">
          <span style="color:#64748b;font-size:13px;">📱 Phone / WhatsApp</span><br>
          <a href="https://wa.me/8801683809975" style="color:#2563eb;font-size:15px;font-weight:600;text-decoration:none;">+880 1683-809975</a>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;background:#ffffff;border-radius:0 0 8px 8px;border:1px solid #e2e8f0;">
          <span style="color:#64748b;font-size:13px;">✉️ Email</span><br>
          <a href="mailto:info@{$domain}" style="color:#2563eb;font-size:15px;font-weight:600;text-decoration:none;">info@{$domain}</a>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Sign-off -->
  <tr><td style="padding:28px 32px 0;">
    <p style="margin:0;color:#475569;font-size:14px;line-height:1.6;">
      Warm regards,<br>
      <strong style="color:#0f172a;">The Nova SS Trading Team</strong>
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:24px 32px;margin-top:16px;">
    <div style="border-top:1px solid #e2e8f0;padding-top:20px;text-align:center;">
      <p style="margin:0 0 4px;color:#94a3b8;font-size:12px;">
        Nova SS Trading &nbsp;•&nbsp; House 142, Road 11, Avenue 5, Mirpur DOHS, Dhaka-1216
      </p>
      <p style="margin:0;color:#94a3b8;font-size:12px;">
        <a href="https://www.{$domain}" style="color:#60a5fa;text-decoration:none;">www.{$domain}</a>
      </p>
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>
HTML;

$customer_email_data = [
    'sender'      => ['name' => $site, 'email' => "info@{$domain}"],
    'to'          => [['email' => $email, 'name' => $name]],
    'subject'     => "Re: Your Inquiry with Nova SS Trading – {$subject}",
    'htmlContent' => $reply_html,
];

$ctx2 = stream_context_create(['http' => [
    'header'        => "Accept: application/json\r\nAPI-Key: {$brevo_api_key}\r\nContent-Type: application/json\r\n",
    'method'        => 'POST',
    'content'       => json_encode($customer_email_data),
    'ignore_errors' => true,
]]);
file_get_contents($url, false, $ctx2);

// ── RESPOND TO FRONTEND ──────────────────────────────────────
$success = isset($admin_status['messageId']);

if ($success) {
    respond(true, "Thank you {$name}! Your inquiry has been received. We'll be in touch within 1–2 business days.");
} else {
    respond(false, "A delivery issue occurred. Please email us directly at info@novasstrading.com", 500);
}
