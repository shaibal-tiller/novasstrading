<?php
namespace App\Storage;

use App\Db;

/**
 * Garbage control for uploaded media and trashed content - hosting disk is the
 * expensive resource, so nothing should linger once nothing uses it.
 *
 * What counts as "used": a file name that appears anywhere in the stored content -
 * live sections, live items AND trashed items (a trashed item can still be
 * restored, so its photo must survive until the item is purged).
 *
 * Safety rules, because deleting the wrong file breaks the live site:
 *  - only files directly inside the media folder with plain names are ever touched
 *    (never .htaccess, dotfiles, sub-folders or anything with odd characters);
 *  - automatic sweeps only remove things older than a minimum age, so a photo that
 *    was just uploaded but not yet "confirmed" in the editor is never taken away;
 *  - every operation supports a dry run that reports without deleting.
 */
final class MediaCleaner
{
    private string $mediaDir;

    public function __construct(?string $mediaDir = null)
    {
        $this->mediaDir = rtrim($mediaDir ?? __DIR__ . '/../../public/media', '/');
    }

    /** All stored content JSON in one string (sections + every item, trashed included). */
    public function haystack(): string
    {
        $db = Db::connection();
        $parts = [];
        foreach (['content_sections', 'content_items'] as $table) {
            foreach ($db->query("SELECT fields_json FROM {$table}") as $row) {
                $parts[] = $row['fields_json'];
            }
        }
        return implode("\n", $parts);
    }

    /** Matches on the bare file name, so it does not matter how the JSON escaped the slash. */
    public function isReferenced(string $path, ?string $haystack = null): bool
    {
        $name = basename($path);
        return $name !== '' && str_contains($haystack ?? $this->haystack(), $name);
    }

    private static function safeName(string $name): bool
    {
        return (bool) preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]*$/', $name);
    }

    private function fileSize(string $name): int
    {
        $full = $this->mediaDir . '/' . $name;
        return is_file($full) ? (int) filesize($full) : 0;
    }

    private function removeFile(string $name): int
    {
        if (!self::safeName($name)) {
            return 0;
        }
        $full = $this->mediaDir . '/' . $name;
        if (!is_file($full)) {
            return 0;
        }
        $bytes = (int) filesize($full);
        return @unlink($full) ? $bytes : 0;
    }

    /**
     * What the uploads folder costs and how much of it is dead weight.
     *
     * @return array{files:int, bytes:int, unused_files:int, unused_bytes:int, trashed_items:int}
     */
    public function usage(): array
    {
        $hay = $this->haystack();
        $files = 0;
        $bytes = 0;
        $unusedFiles = 0;
        $unusedBytes = 0;
        foreach (is_dir($this->mediaDir) ? scandir($this->mediaDir) : [] as $name) {
            if (!self::safeName($name) || !is_file($this->mediaDir . '/' . $name)) {
                continue;
            }
            $size = $this->fileSize($name);
            $files++;
            $bytes += $size;
            if (!str_contains($hay, $name)) {
                $unusedFiles++;
                $unusedBytes += $size;
            }
        }
        $trashed = (int) Db::connection()->query('SELECT COUNT(*) FROM content_items WHERE deleted_at IS NOT NULL')->fetchColumn();
        return [
            'files' => $files,
            'bytes' => $bytes,
            'unused_files' => $unusedFiles,
            'unused_bytes' => $unusedBytes,
            'trashed_items' => $trashed,
        ];
    }

    /**
     * Permanently deletes ONE trashed item, then frees its photos if nothing else uses them.
     *
     * @return array{purged:bool, files:list<array{path:string,bytes:int}>, bytes:int}
     */
    public function purgeItem(int $id): array
    {
        $db = Db::connection();
        $stmt = $db->prepare('SELECT fields_json FROM content_items WHERE id = ? AND deleted_at IS NOT NULL');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if ($row === false) {
            return ['purged' => false, 'files' => [], 'bytes' => 0];
        }
        $db->prepare('DELETE FROM content_items WHERE id = ?')->execute([$id]);
        return ['purged' => true] + $this->release([$row['fields_json']]);
    }

    /**
     * Permanently deletes every trashed item.
     *
     * @return array{items:int, files:list<array{path:string,bytes:int}>, bytes:int}
     */
    public function emptyTrash(): array
    {
        $db = Db::connection();
        $jsons = [];
        foreach ($db->query('SELECT fields_json FROM content_items WHERE deleted_at IS NOT NULL') as $row) {
            $jsons[] = $row['fields_json'];
        }
        $db->exec('DELETE FROM content_items WHERE deleted_at IS NOT NULL');
        return ['items' => count($jsons)] + $this->release($jsons);
    }

    /**
     * Frees the media that the given (just-deleted) items' JSON pointed at, unless other
     * content still uses it. Ignores the age rule: a person explicitly removed it.
     *
     * @param list<string> $removedJson
     * @return array{files:list<array{path:string,bytes:int}>, bytes:int}
     */
    private function release(array $removedJson): array
    {
        $db = Db::connection();
        $hay = $this->haystack();
        $freed = [];
        $total = 0;
        foreach ($db->query('SELECT id, path FROM media') as $media) {
            $name = basename($media['path']);
            $mentioned = false;
            foreach ($removedJson as $json) {
                if (str_contains($json, $name)) {
                    $mentioned = true;
                    break;
                }
            }
            if (!$mentioned || str_contains($hay, $name)) {
                continue;
            }
            $bytes = $this->removeFile($name);
            $db->prepare('DELETE FROM media WHERE id = ?')->execute([(int) $media['id']]);
            $freed[] = ['path' => $media['path'], 'bytes' => $bytes];
            $total += $bytes;
        }
        return ['files' => $freed, 'bytes' => $total];
    }

    /**
     * The scheduled housekeeping: (1) permanently remove items that have sat in the
     * trash longer than $trashDays, then (2) delete uploaded files nothing uses and that
     * are older than $minAgeHours - both library entries with no references and loose
     * files with no entry at all.
     *
     * @return array{dry_run:bool, purged_items:int, deleted:list<array{path:string,bytes:int,why:string}>, bytes_freed:int}
     */
    public function cleanup(int $trashDays = 30, int $minAgeHours = 72, bool $dryRun = false): array
    {
        $db = Db::connection();
        $deleted = [];
        $freed = 0;

        // 1) Trash that outlived its 30 days.
        $stmt = $db->prepare('SELECT id FROM content_items WHERE deleted_at IS NOT NULL AND deleted_at < DATE_SUB(NOW(), INTERVAL ? DAY)');
        $stmt->execute([$trashDays]);
        $expired = array_map('intval', array_column($stmt->fetchAll(), 'id'));
        $purged = count($expired);
        if (!$dryRun) {
            foreach ($expired as $id) {
                // Row first, files after the sweep below (they are old enough by definition).
                $db->prepare('DELETE FROM content_items WHERE id = ?')->execute([$id]);
            }
        }

        // 2) Unused uploads. In a dry run the expired items above are still in the table, so
        //    exclude their text from the "used" haystack to report what a real run would free.
        $hay = $this->haystack();
        if ($dryRun && $expired) {
            $in = implode(',', array_fill(0, count($expired), '?'));
            $sel = $db->prepare("SELECT fields_json FROM content_items WHERE id IN ({$in})");
            $sel->execute($expired);
            foreach ($sel->fetchAll() as $row) {
                $hay = str_replace($row['fields_json'], '', $hay);
            }
        }

        $known = [];
        $old = $db->prepare('SELECT id, path FROM media WHERE created_at < DATE_SUB(NOW(), INTERVAL ? HOUR)');
        $old->execute([$minAgeHours]);
        $oldRows = $old->fetchAll();
        foreach ($db->query('SELECT path FROM media') as $row) {
            $known[basename($row['path'])] = true;
        }
        foreach ($oldRows as $row) {
            $name = basename($row['path']);
            if (str_contains($hay, $name)) {
                continue;
            }
            $bytes = $dryRun ? $this->fileSize($name) : $this->removeFile($name);
            if (!$dryRun) {
                $db->prepare('DELETE FROM media WHERE id = ?')->execute([(int) $row['id']]);
            }
            $deleted[] = ['path' => $row['path'], 'bytes' => $bytes, 'why' => 'unused upload'];
            $freed += $bytes;
        }

        // 3) Loose files with no library entry at all (failed/abandoned uploads, hand-copied files).
        $cutoff = time() - $minAgeHours * 3600;
        foreach (is_dir($this->mediaDir) ? scandir($this->mediaDir) : [] as $name) {
            $full = $this->mediaDir . '/' . $name;
            if (!self::safeName($name) || !is_file($full) || isset($known[$name]) || str_contains($hay, $name)) {
                continue;
            }
            if (filemtime($full) > $cutoff) {
                continue;
            }
            $bytes = $dryRun ? (int) filesize($full) : $this->removeFile($name);
            $deleted[] = ['path' => 'media/' . $name, 'bytes' => $bytes, 'why' => 'loose file, no library entry'];
            $freed += $bytes;
        }

        return ['dry_run' => $dryRun, 'purged_items' => $purged, 'deleted' => $deleted, 'bytes_freed' => $freed];
    }
}
