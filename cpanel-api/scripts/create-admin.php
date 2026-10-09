<?php
/**
 * Creates (or resets the password of) an admin account. CLI only.
 *
 *   php scripts/create-admin.php it-support@novasstrading.com
 *
 * The password is asked for with hidden input, so it never lands in shell
 * history or process lists. (A second argument is accepted for automation, but
 * avoid it on a shared server.) Re-running for an existing email replaces its
 * password, which doubles as "reset password".
 *
 * Reads DB_* settings from ../.env.php, exactly like public/index.php.
 */
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/../vendor/autoload.php';

$env = __DIR__ . '/../.env.php';
if (file_exists($env)) {
    require $env;
}

$email = $argv[1] ?? '';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "Usage: php scripts/create-admin.php <email> [password]\n");
    exit(1);
}

$password = $argv[2] ?? null;
if ($password === null) {
    fwrite(STDOUT, "Password for {$email} (hidden, min 12 chars): ");
    $interactive = function_exists('posix_isatty') ? posix_isatty(STDIN) : true;
    if ($interactive) {
        system('stty -echo');
    }
    $password = rtrim((string) fgets(STDIN), "\r\n");
    if ($interactive) {
        system('stty echo');
    }
    fwrite(STDOUT, "\n");
}

if (strlen($password) < 12) {
    fwrite(STDERR, "Password must be at least 12 characters.\n");
    exit(1);
}

$stmt = App\Db::connection()->prepare(
    'INSERT INTO admins (email, password_hash) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)'
);
$stmt->execute([$email, password_hash($password, PASSWORD_DEFAULT)]);

fwrite(STDOUT, "Admin account ready: {$email}\n");
