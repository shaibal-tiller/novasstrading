<?php
namespace App\Repositories;

use App\Db;

/**
 * Metadata only. The image/PDF bytes live on disk under public/media/ — the
 * database stores just the relative path (e.g. "media/ab12cd.webp") and facts
 * about the file, never the file itself.
 */
final class MediaRepository
{
    public function all(): array
    {
        $stmt = Db::connection()->query(
            'SELECT id, path, original_filename, bytes, width, height, mime_type, used_by_count, created_at
             FROM media ORDER BY id DESC'
        );
        return array_map(
            fn(array $row) => [
                'id' => (int) $row['id'],
                'path' => $row['path'],
                'original_filename' => $row['original_filename'],
                'bytes' => (int) $row['bytes'],
                'width' => (int) $row['width'],
                'height' => (int) $row['height'],
                'mime_type' => $row['mime_type'],
                'used_by_count' => (int) $row['used_by_count'],
                'created_at' => $row['created_at'],
            ],
            $stmt->fetchAll()
        );
    }

    public function create(array $meta): int
    {
        $db = Db::connection();
        $stmt = $db->prepare(
            'INSERT INTO media (path, original_filename, bytes, width, height, mime_type)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $meta['path'],
            $meta['original_filename'],
            (int) $meta['bytes'],
            (int) ($meta['width'] ?? 0),
            (int) ($meta['height'] ?? 0),
            $meta['mime_type'],
        ]);
        return (int) $db->lastInsertId();
    }

    /** @return array{id:int, path:string}|null */
    public function find(int $id): ?array
    {
        $stmt = Db::connection()->prepare('SELECT id, path FROM media WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row === false ? null : ['id' => (int) $row['id'], 'path' => $row['path']];
    }

    /**
     * True if any content (live sections, live items AND soft-deleted items that
     * could still be restored from the trash) mentions this file. Matches on the
     * file name only, so it does not matter how the JSON escaped the slash.
     */
    public function isReferenced(string $path): bool
    {
        $needle = '%' . addcslashes(basename($path), '\\%_') . '%';
        $db = Db::connection();
        foreach (['content_sections', 'content_items'] as $table) {
            $stmt = $db->prepare("SELECT 1 FROM {$table} WHERE fields_json LIKE ? LIMIT 1");
            $stmt->execute([$needle]);
            if ($stmt->fetchColumn() !== false) {
                return true;
            }
        }
        return false;
    }

    public function delete(int $id): void
    {
        $stmt = Db::connection()->prepare('DELETE FROM media WHERE id = ?');
        $stmt->execute([$id]);
    }
}
