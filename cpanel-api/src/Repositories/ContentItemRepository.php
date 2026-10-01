<?php
namespace App\Repositories;

use App\Db;

final class ContentItemRepository
{
    public function listBySection(string $sectionKey): array
    {
        $stmt = Db::connection()->prepare(
            'SELECT id, fields_json FROM content_items
             WHERE section_key = ? AND deleted_at IS NULL
             ORDER BY sort_order ASC, id ASC'
        );
        $stmt->execute([$sectionKey]);
        return array_map(
            fn(array $row) => ['id' => (int) $row['id'], 'fields' => json_decode($row['fields_json'], true)],
            $stmt->fetchAll()
        );
    }

    /**
     * Every live item grouped by section key, in display order — one query
     * instead of one per section. Backs the bulk GET /content endpoint.
     *
     * @return array<string, list<array{id:int, fields:array}>>
     */
    public function listAllGrouped(): array
    {
        $stmt = Db::connection()->query(
            'SELECT id, section_key, fields_json FROM content_items
             WHERE deleted_at IS NULL
             ORDER BY section_key ASC, sort_order ASC, id ASC'
        );
        $grouped = [];
        foreach ($stmt->fetchAll() as $row) {
            $grouped[$row['section_key']][] = [
                'id' => (int) $row['id'],
                'fields' => json_decode($row['fields_json'], true),
            ];
        }
        return $grouped;
    }

    public function create(string $sectionKey, array $fields): int
    {
        $db = Db::connection();
        $next = $db->prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM content_items WHERE section_key = ?');
        $next->execute([$sectionKey]);
        $sortOrder = (int) $next->fetch()['next'];

        $stmt = $db->prepare(
            'INSERT INTO content_items (section_key, sort_order, fields_json) VALUES (?, ?, ?)'
        );
        $stmt->execute([$sectionKey, $sortOrder, json_encode($fields)]);
        return (int) $db->lastInsertId();
    }

    /** Full REPLACE of fields_json — callers must send the complete merged object. */
    public function update(int $id, array $fields): void
    {
        $stmt = Db::connection()->prepare('UPDATE content_items SET fields_json = ? WHERE id = ?');
        $stmt->execute([json_encode($fields), $id]);
    }

    public function softDelete(int $id): void
    {
        $stmt = Db::connection()->prepare('UPDATE content_items SET deleted_at = NOW() WHERE id = ?');
        $stmt->execute([$id]);
    }

    public function reorder(string $sectionKey, array $orderedIds): void
    {
        $db = Db::connection();
        $stmt = $db->prepare('UPDATE content_items SET sort_order = ? WHERE id = ? AND section_key = ?');
        foreach ($orderedIds as $position => $id) {
            $stmt->execute([$position, $id, $sectionKey]);
        }
    }

    public function listDeleted(): array
    {
        $stmt = Db::connection()->query(
            'SELECT id, section_key, fields_json, deleted_at FROM content_items
             WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC'
        );
        return array_map(
            fn(array $row) => [
                'id' => (int) $row['id'],
                'section' => $row['section_key'],
                'fields' => json_decode($row['fields_json'], true),
                'deletedAt' => $row['deleted_at'],
            ],
            $stmt->fetchAll()
        );
    }

    public function restore(int $id): void
    {
        $stmt = Db::connection()->prepare('UPDATE content_items SET deleted_at = NULL WHERE id = ?');
        $stmt->execute([$id]);
    }
}
