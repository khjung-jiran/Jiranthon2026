<?php

declare(strict_types=1);

namespace Eum\Presenter;

final class CapsulePresenter
{
    /**
     * @param  array<string, mixed> $row
     * @return array<string, mixed>
     */
    public static function one(array $row): array
    {
        return [
            'id' => $row['id'],
            'family_id' => $row['family_id'],
            'from_member_id' => $row['from_member_id'],
            'to_member_id' => $row['to_member_id'],
            'title' => $row['title'],
            'audio_file_path' => $row['audio_file_path'],
            'open_date' => $row['open_date'],
            'status' => $row['status'],
            'duration' => $row['duration'],
            'created_at' => $row['created_at'],
        ];
    }

    /**
     * @param  list<array<string, mixed>> $rows
     * @return list<array<string, mixed>>
     */
    public static function collection(array $rows): array
    {
        return \array_map(self::one(...), $rows);
    }
}
