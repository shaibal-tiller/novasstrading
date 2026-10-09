<?php
namespace App\Repositories;

use App\Db;

final class ContentSectionRepository
{
    /** @return array<string, array> section_key => decoded fields */
    public function all(): array
    {
        $stmt = Db::connection()->query('SELECT section_key, fields_json FROM content_sections');
        $out = [];
        foreach ($stmt->fetchAll() as $row) {
            $out[$row['section_key']] = json_decode($row['fields_json'], true);
        }
        return $out;
    }

    public function get(string $sectionKey): ?array
    {
        $stmt = Db::connection()->prepare('SELECT fields_json FROM content_sections WHERE section_key = ?');
        $stmt->execute([$sectionKey]);
        $row = $stmt->fetch();
        return $row === false ? null : json_decode($row['fields_json'], true);
    }

    /** Full REPLACE of fields_json — callers must send the complete merged object. */
    public function upsert(string $sectionKey, array $fields): void
    {
        $stmt = Db::connection()->prepare(
            'INSERT INTO content_sections (section_key, fields_json) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE fields_json = VALUES(fields_json)'
        );
        $stmt->execute([$sectionKey, json_encode($fields)]);
    }
}
