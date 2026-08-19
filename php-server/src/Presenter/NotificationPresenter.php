<?php

declare(strict_types=1);

namespace Eum\Presenter;

final class NotificationPresenter
{
    /**
     * @param  array<string, mixed> $row
     * @return array<string, mixed>
     */
    public static function one(array $row): array
    {
        return [
            'id' => $row['id'],
            'member_id' => $row['member_id'],
            'type' => $row['type'],
            'title' => $row['title'],
            'icon' => $row['icon'],
            'color' => $row['color'],
            'is_read' => (bool) $row['is_read'],
            'nav_target' => $row['nav_target'],
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
