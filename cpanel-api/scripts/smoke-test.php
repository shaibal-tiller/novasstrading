<?php
/**
 * End-to-end check of a deployed cpanel-api (staging or production).
 * Run on the server, from the app folder:
 *
 *   read -rsp "Admin password: " SMOKE_PASSWORD; echo; export SMOKE_PASSWORD
 *   php scripts/smoke-test.php https://content-api-staging.novasstrading.com
 *
 * Checks: health, API-key enforcement, login (right + wrong password), then a
 * real photo upload (a 3200x2400 JPEG made on the fly) and that it came back
 * optimized (rotated/downsized/WebP) and is served with long-lived cache headers.
 * Leaves one small test image in public/media/ (harmless).
 */
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$base = rtrim($argv[1] ?? '', '/');
if ($base === '') {
    fwrite(STDERR, "Usage: php scripts/smoke-test.php <base-url>\n");
    exit(1);
}
if (!function_exists('curl_init')) {
    fwrite(STDERR, "This PHP has no curl extension.\n");
    exit(1);
}

require __DIR__ . '/../.env.php';
$key = (string) getenv('API_KEY');
$password = (string) getenv('SMOKE_PASSWORD');
$email = 'it-support@novasstrading.com';
$failures = 0;

function check(string $label, bool $ok, string $detail = ''): void
{
    global $failures;
    echo ($ok ? '  PASS  ' : '  FAIL  ') . $label . ($detail !== '' ? "   ({$detail})" : '') . "\n";
    if (!$ok) {
        $failures++;
    }
}

function http(string $method, string $url, array $headers = [], $body = null): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTPHEADER => $headers,
    ]);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    curl_close($ch);
    if ($raw === false) {
        return ['status' => 0, 'headers' => '', 'body' => ''];
    }
    return ['status' => $status, 'headers' => substr($raw, 0, $headerSize), 'body' => substr($raw, $headerSize)];
}

echo "Smoke test: {$base}\n";

$r = http('GET', "{$base}/health");
check('GET /health', $r['status'] === 200 && str_contains($r['body'], '"ok":true'), (string) $r['status']);

$r = http('GET', "{$base}/content");
check('GET /content without API key is rejected', $r['status'] === 401, (string) $r['status']);

$r = http('GET', "{$base}/content", ["X-Api-Key: {$key}"]);
$j = json_decode($r['body'], true);
check('GET /content with API key', $r['status'] === 200 && is_array($j) && array_key_exists('sections', $j), (string) $r['status']);

if ($password === '') {
    echo "  (SMOKE_PASSWORD not set - skipping login and upload checks)\n";
    exit($failures > 0 ? 1 : 0);
}

$json = ["X-Api-Key: {$key}", 'Content-Type: application/json'];
$r = http('POST', "{$base}/auth/login", $json, json_encode(['email' => $email, 'password' => 'definitely-wrong-password']));
check('login with a wrong password is rejected', $r['status'] >= 400 && $r['status'] < 500, (string) $r['status']);

$r = http('POST', "{$base}/auth/login", $json, json_encode(['email' => $email, 'password' => $password]));
$token = (string) (json_decode($r['body'], true)['token'] ?? '');
check('login with the admin password returns a session token', $r['status'] === 200 && $token !== '', (string) $r['status']);
if ($token === '') {
    echo "  (no token - cannot continue with upload checks)\n";
    exit(1);
}

$r = http('GET', "{$base}/media", ["X-Api-Key: {$key}"]);
check('GET /media lists the library', $r['status'] === 200, (string) $r['status']);

if (!function_exists('imagecreatetruecolor') || !function_exists('imagejpeg')) {
    echo "  (this PHP has no GD - cannot generate the test image here)\n";
    exit($failures > 0 ? 1 : 0);
}

// A 3200x2400 striped JPEG: bigger than the 1600px limit, so a working optimizer must shrink it.
$img = imagecreatetruecolor(3200, 2400);
for ($i = 0; $i < 24; $i++) {
    $c = imagecolorallocate($img, ($i * 10) % 256, 255 - $i * 10, ($i * 37) % 256);
    imagefilledrectangle($img, 0, (int) ($i * 100), 3200, (int) (($i + 1) * 100), $c);
}
$tmp = tempnam(sys_get_temp_dir(), 'smk') . '.jpg';
imagejpeg($img, $tmp, 92);
imagedestroy($img);
$originalBytes = filesize($tmp);

$auth = ["X-Api-Key: {$key}", "Authorization: Bearer {$token}"];
$file = ['file' => new CURLFile($tmp, 'image/jpeg', 'smoke-test.jpg')];

$r = http('POST', "{$base}/media/upload-file", ["X-Api-Key: {$key}"], $file);
check('upload without a session token is rejected', $r['status'] === 401, (string) $r['status']);

$r = http('POST', "{$base}/media/upload-file", $auth, $file);
$up = json_decode($r['body'], true) ?: [];
check('upload of a photo is accepted', $r['status'] === 201 && isset($up['path']), (string) $r['status']);
@unlink($tmp);

if (isset($up['path'])) {
    $stored = (int) ($up['bytes'] ?? 0);
    echo sprintf(
        "        uploaded %s bytes (3200x2400 jpeg) -> stored %s bytes, %sx%s, %s\n",
        number_format($originalBytes),
        number_format($stored),
        $up['width'] ?? '?',
        $up['height'] ?? '?',
        $up['mime_type'] ?? '?'
    );
    check(
        'photo was optimized (WebP, max 1600px)',
        ($up['optimized'] ?? false) === true && ($up['mime_type'] ?? '') === 'image/webp' && max((int) $up['width'], (int) $up['height']) <= 1600,
        ($up['optimized'] ?? false) ? 'ok' : 'NOT optimized - the web PHP has no WebP encoder; enable GD or switch to PHP 8.2'
    );

    $r = http('GET', "{$base}/{$up['path']}");
    check('the uploaded file is publicly served', $r['status'] === 200, (string) $r['status']);
    check('served with long-lived immutable cache headers', (bool) preg_match('/cache-control:[^\r\n]*immutable/i', $r['headers']), 'public/media/.htaccess');
}

echo $failures === 0 ? "\nALL CHECKS PASSED\n" : "\n{$failures} CHECK(S) FAILED\n";
exit($failures > 0 ? 1 : 0);
