<?php
/**
 * Turns an app's .env.php (DB_DSN / DB_USER / DB_PASS via putenv) into a MySQL client
 * option file, so the backup never keeps its own copy of a database password.
 *
 *   php db-cnf.php /home/<user>/<app>/.env.php /path/to/out.cnf    # prints the database name
 */
if (PHP_SAPI !== 'cli' || $argc !== 3) {
    fwrite(STDERR, "usage: php db-cnf.php <app .env.php> <out.cnf>\n");
    exit(2);
}
[, $envFile, $out] = $argv;
if (!is_readable($envFile)) {
    fwrite(STDERR, "cannot read $envFile\n");
    exit(1);
}
require $envFile;

$dsn = (string) getenv('DB_DSN');
$parts = [];
foreach (explode(';', (string) preg_replace('/^mysql:/', '', $dsn)) as $pair) {
    [$k, $v] = array_pad(explode('=', $pair, 2), 2, '');
    $parts[trim($k)] = trim($v);
}
if (($parts['dbname'] ?? '') === '' || getenv('DB_USER') === false) {
    fwrite(STDERR, "DB_DSN (with dbname) and DB_USER must be set in $envFile\n");
    exit(1);
}

// Option-file values in double quotes understand backslash escapes, so escape \ and ".
$q = static fn($s): string => '"' . addcslashes((string) $s, '\\"') . '"';
$cnf = "[client]\n"
    . 'host=' . $q($parts['host'] ?? 'localhost') . "\n"
    . (isset($parts['port']) ? 'port=' . (int) $parts['port'] . "\n" : '')
    . 'user=' . $q(getenv('DB_USER')) . "\n"
    . 'password=' . $q((string) getenv('DB_PASS')) . "\n";

umask(077);
if (file_put_contents($out, $cnf) === false) {
    fwrite(STDERR, "cannot write $out\n");
    exit(1);
}
chmod($out, 0600);
echo $parts['dbname'];
