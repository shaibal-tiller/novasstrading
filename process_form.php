<?php
// ============================================================
//  process_form.php  –  Novasstrading Contact Form Handler
//  Hardened Edition: Rate limiting, CSRF, metadata collection
// ============================================================

session_start();

// ── LOAD .ENV FILE ──────────────────────────────────────────
// Simple .env parser — no external dependencies needed.
function load_env($path) {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;        // skip comments
        if (strpos($line, '=') === false) continue;            // skip malformed
        [$key, $value] = array_map('trim', explode('=', $line, 2));
        $value = trim($value, '"\'');                          // strip quotes
        if (!array_key_exists($key, $_ENV)) {
            putenv("{$key}={$value}");
            $_ENV[$key] = $value;
        }
    }
}

load_env(__DIR__ . '/.env');

// ── CONFIGURATION ───────────────────────────────────────────
$to            = getenv('CONTACT_EMAIL') ?: "info@novasstrading.com";
$site          = getenv('SITE_NAME')     ?: "Nova SS Trading";
$domain        = getenv('SITE_DOMAIN')   ?: "novasstrading.com";
$brevo_api_key = getenv('BREVO_API_KEY') ?: "";

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

// ── BUILD ADMIN EMAIL BODY ───────────────────────────────────
$sep = str_repeat("─", 52);

$admin_body  = "New inquiry received via the {$site} website.\n";
$admin_body .= "Source : {$form_source}\n";
$admin_body .= "{$sep}\n\n";

$admin_body .= "CONTACT DETAILS\n";
$admin_body .= "Name         : {$name}\n";
$admin_body .= "Company      : " . ($company ?: "—") . "\n";
$admin_body .= "Email        : {$email}\n";
$admin_body .= "Phone        : " . ($phone   ?: "—") . "\n";
$admin_body .= "Country      : " . ($country ?: "—") . "\n";
$admin_body .= "Subject      : {$subject}\n\n";

$admin_body .= "MESSAGE\n";
$admin_body .= wordwrap($message, 72, "\n", true) . "\n\n";
$admin_body .= "{$sep}\n\n";

$admin_body .= "SUBMISSION METADATA  (internal — not shown to customer)\n";
foreach ($meta as $label => $value) {
    $admin_body .= sprintf("%-18s: %s\n", $label, $value);
}

$admin_body .= "\n{$sep}\n";
$admin_body .= "Sent via verified Brevo API  |  CSRF verified: " . ($csrf_verified ? 'Yes' : 'No') . "\n";

// ── SEND ADMIN NOTIFICATION ──────────────────────────────────
$url = 'https://api.brevo.com/v3/smtp/email';

$admin_email_data = [
    'sender'      => ['name' => $site, 'email' => "noreply@{$domain}"],
    'to'          => [['email' => $to, 'name' => $site]],
    'subject'     => "[{$site}] New Inquiry: {$subject} | {$client_ip}",
    'textContent' => $admin_body,
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

// ── SEND AUTO-REPLY TO CUSTOMER ──────────────────────────────
$reply_body  = "Hi {$name},\n\n";
$reply_body .= "Thank you for reaching out to Nova SS Trading. We have received your message regarding \"{$subject}\" and our sourcing team is reviewing your details now.\n\n";
$reply_body .= "We will follow up with you within 1–2 business days.\n\n";
$reply_body .= "If you need immediate assistance, feel free to reply to this email or reach us at:\n";
$reply_body .= "  Phone / WhatsApp : +880 1683-809975\n";
$reply_body .= "  Email            : info@{$domain}\n\n";
$reply_body .= "Warm regards,\n";
$reply_body .= "The Nova SS Trading Team\n";
$reply_body .= "www.{$domain}\n";

$customer_email_data = [
    'sender'      => ['name' => $site, 'email' => "info@{$domain}"],
    'to'          => [['email' => $email, 'name' => $name]],
    'subject'     => "Re: Your Inquiry with Nova SS Trading – {$subject}",
    'textContent' => $reply_body,
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
