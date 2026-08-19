<?php

declare(strict_types=1);

namespace Eum\Presenter;

final class PhotoPresenter
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
            'url' => $row['url'],
            'label' => $row['label'],
            'who' => $row['who'],
            'tone' => $row['tone'],
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
