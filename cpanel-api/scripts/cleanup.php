<?php
/**
 * Scheduled housekeeping for uploaded media and the trash. CLI only.
 *
 *   php scripts/cleanup.php --dry-run              # report only, delete nothing
 *   php scripts/cleanup.php                        # do it
 *   php scripts/cleanup.php --trash-days=30 --min-age-hours=72
 *
 * What it does: permanently removes items that have been in the trash longer than
 * --trash-days, then deletes uploaded files that no content uses and that are older
 * than --min-age-hours (and loose files with no library entry). Files used by live
 * content or by items still in the trash are never touched.
 *
 * Schedule it weekly in cPanel -> Cron Jobs, e.g.
 *   0 3 * * 0  /opt/cpanel/ea-php81/root/usr/bin/php /home/<user>/<app>/scripts/cleanup.php
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

$opts = getopt('', ['dry-run', 'trash-days::', 'min-age-hours::']);
$dryRun = array_key_exists('dry-run', $opts);
$trashDays = isset($opts['trash-days']) ? max(1, (int) $opts['trash-days']) : 30;
$minAge = isset($opts['min-age-hours']) ? max(0, (int) $opts['min-age-hours']) : 72;

$cleaner = new App\Storage\MediaCleaner();
$before = $cleaner->usage();
$report = $cleaner->cleanup($trashDays, $minAge, $dryRun);

$mb = static fn(int $b): string => number_format($b / 1048576, 2) . ' MB';
echo ($dryRun ? "[dry run] " : "") . "trash older than {$trashDays}d, unused uploads older than {$minAge}h\n";
echo "uploads before: {$before['files']} files, " . $mb($before['bytes']) . " (unused: {$before['unused_files']} files, " . $mb($before['unused_bytes']) . ")\n";
echo "trashed items purged: {$report['purged_items']}\n";
foreach ($report['deleted'] as $d) {
    echo "  " . ($dryRun ? 'would delete ' : 'deleted ') . $d['path'] . ' (' . $mb($d['bytes']) . ') - ' . $d['why'] . "\n";
}
echo ($dryRun ? 'would free ' : 'freed ') . $mb($report['bytes_freed']) . "\n";
