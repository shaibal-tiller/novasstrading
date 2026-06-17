<?php
// ============================================================
//  debug_check.php  –  Diagnostic Script
//  Upload to your server, visit it in browser, then DELETE it.
//  URL: https://novasstrading.com/debug_check.php
// ============================================================

header('Content-Type: text/plain; charset=utf-8');

echo "═══════════════════════════════════════════\n";
echo "  NOVASSTRADING DIAGNOSTIC CHECK\n";
echo "  " . date('Y-m-d H:i:s T') . "\n";
echo "═══════════════════════════════════════════\n\n";

// ── 1. PHP Version ──────────────────────────────────────────
echo "1. PHP VERSION\n";
echo "   Version: " . phpversion() . "\n";
echo "   Result:  " . (version_compare(PHP_VERSION, '8.0.0', '>=') ? '✅ OK (8.0+)' : '❌ NEEDS PHP 8.0+ for match() syntax') . "\n\n";

// ── 2. Check .env file exists ───────────────────────────────
echo "2. .ENV FILE\n";
$env_path = __DIR__ . '/.env';
echo "   Looking at: {$env_path}\n";
if (file_exists($env_path)) {
    echo "   Exists:    ✅ YES\n";
    echo "   Readable:  " . (is_readable($env_path) ? '✅ YES' : '❌ NO — check file permissions (should be 644)') . "\n";
    echo "   Size:      " . filesize($env_path) . " bytes\n";
    
    // Parse it
    $lines = file($env_path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $vars = [];
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (strpos($line, '=') === false) continue;
        [$key, $value] = array_map('trim', explode('=', $line, 2));
        $value = trim($value, '"\'');
        $vars[$key] = $value;
    }
    
    echo "   Variables found: " . count($vars) . "\n";
    foreach ($vars as $k => $v) {
        if ($k === 'BREVO_API_KEY') {
            // Show first 10 + last 5 chars only
            $masked = substr($v, 0, 10) . '...' . substr($v, -5);
            echo "   - {$k} = {$masked} (length: " . strlen($v) . ")\n";
        } else {
            echo "   - {$k} = {$v}\n";
        }
    }
} else {
    echo "   Exists: ❌ NO — .env file not found!\n";
    echo "   This is why emails fail. Upload .env to: " . __DIR__ . "/\n";
}
echo "\n";

// ── 3. Check key files exist ────────────────────────────────
echo "3. REQUIRED FILES\n";
$files = ['process_form.php', 'get_csrf.php', 'contact.html', '.env', '.htaccess'];
foreach ($files as $f) {
    $full = __DIR__ . '/' . $f;
    $exists = file_exists($full);
    echo "   " . ($exists ? '✅' : '❌') . " {$f}" . ($exists ? '' : ' — MISSING!') . "\n";
}
echo "\n";

// ── 4. Check disabled functions ─────────────────────────────
echo "4. DISABLED FUNCTIONS\n";
$disabled = ini_get('disable_functions');
$check_fns = ['putenv', 'getenv', 'file_get_contents', 'file_put_contents', 'session_start'];
foreach ($check_fns as $fn) {
    $is_disabled = (strpos($disabled, $fn) !== false);
    echo "   " . ($is_disabled ? '⚠️ ' : '✅') . " {$fn}" . ($is_disabled ? ' — DISABLED on this host!' : ' — available') . "\n";
}
echo "\n";

// ── 5. Sessions ─────────────────────────────────────────────
echo "5. SESSIONS\n";
$session_ok = false;
try {
    if (session_status() === PHP_SESSION_NONE) session_start();
    $_SESSION['_diag_test'] = 'ok';
    $session_ok = ($_SESSION['_diag_test'] === 'ok');
    unset($_SESSION['_diag_test']);
} catch (Exception $e) {
    echo "   Error: " . $e->getMessage() . "\n";
}
echo "   Sessions working: " . ($session_ok ? '✅ YES' : '❌ NO') . "\n";
echo "   Save path: " . session_save_path() . "\n\n";

// ── 6. Test Brevo API connection ────────────────────────────
echo "6. BREVO API TEST (no email sent)\n";
$api_key = $vars['BREVO_API_KEY'] ?? '';
if (empty($api_key)) {
    echo "   ❌ Cannot test — no API key loaded\n";
} else {
    // Hit Brevo account endpoint to verify key works
    $ctx = stream_context_create(['http' => [
        'header'        => "Accept: application/json\r\nAPI-Key: {$api_key}\r\n",
        'method'        => 'GET',
        'ignore_errors' => true,
        'timeout'       => 10,
    ]]);
    $result = @file_get_contents('https://api.brevo.com/v3/account', false, $ctx);
    
    if ($result === false) {
        echo "   ❌ Could not reach Brevo API (network issue or file_get_contents blocked)\n";
        echo "   allow_url_fopen: " . (ini_get('allow_url_fopen') ? 'ON' : '❌ OFF — this MUST be ON') . "\n";
    } else {
        $data = json_decode($result, true);
        if (isset($data['email'])) {
            echo "   ✅ API key valid! Account: {$data['email']}\n";
            echo "   Plan: " . ($data['plan'][0]['type'] ?? 'unknown') . "\n";
            
            // Check credits
            if (isset($data['plan'][0]['credits'])) {
                echo "   Credits remaining: {$data['plan'][0]['credits']}\n";
                if ($data['plan'][0]['credits'] <= 0) {
                    echo "   ⚠️  NO CREDITS LEFT — this is why emails aren't sending!\n";
                }
            }
        } else {
            echo "   ❌ API key rejected. Response:\n";
            echo "   " . substr($result, 0, 300) . "\n";
        }
    }
}
echo "\n";

// ── 7. Check /tmp write access (rate limiter) ───────────────
echo "7. RATE LIMITER (/tmp write access)\n";
$tmp = sys_get_temp_dir();
$test_file = $tmp . '/rl_novas_diag_test.json';
$write_ok = @file_put_contents($test_file, '{"test":true}');
echo "   Temp dir: {$tmp}\n";
echo "   Write access: " . ($write_ok ? '✅ YES' : '❌ NO') . "\n";
if ($write_ok) @unlink($test_file);

// Check if current IP is already rate-limited
$ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$safe_ip = preg_replace('/[^a-zA-Z0-9_\-.]/', '_', trim(explode(',', $ip)[0]));
$rl_file = $tmp . "/rl_novas_{$safe_ip}.json";
if (file_exists($rl_file)) {
    $rl_data = json_decode(file_get_contents($rl_file), true);
    echo "   Your IP ({$ip}) rate limit file exists:\n";
    echo "   - Submissions in window: " . count($rl_data['timestamps'] ?? []) . "/3\n";
    echo "   - Blocked until: " . ($rl_data['blocked_until'] > time() ? date('H:i:s', $rl_data['blocked_until']) . ' ⚠️  YOU ARE BLOCKED' : 'not blocked ✅') . "\n";
} else {
    echo "   Your IP ({$ip}): no rate limit file (clean) ✅\n";
}
echo "\n";

echo "═══════════════════════════════════════════\n";
echo "  ⚠️  DELETE THIS FILE AFTER DEBUGGING!\n";
echo "  It exposes server details.\n";
echo "═══════════════════════════════════════════\n";
