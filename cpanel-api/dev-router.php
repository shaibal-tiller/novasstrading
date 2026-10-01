<?php
// Local-dev router for PHP's built-in server ONLY:
//   php -S 127.0.0.1:8080 cpanel-api/dev-router.php
// Production uses Apache + public/.htaccess, which already does this.
// Serves real files under public/ (e.g. uploaded media) and routes
// everything else through the front controller.
//
// Static files are read and emitted manually (rather than `return false`,
// which hands off to PHP's built-in server's own static-file handler) —
// that handler intermittently fails on binary files like .webp on some
// PHP builds ("Invalid argument"). This local-only workaround avoids it.
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$file = __DIR__ . '/public' . $path;
if ($path !== '/' && is_file($file)) {
    $types = ['webp' => 'image/webp', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'pdf' => 'application/pdf'];
    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
    header('Content-Length: ' . filesize($file));
    readfile($file);
    return true;
}
require __DIR__ . '/public/index.php';
