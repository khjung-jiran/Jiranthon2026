<?php

declare(strict_types=1);

namespace Eum\Presenter;

final class FamilyPresenter
{
    /**
     * @param  array<string, mixed> $row
     * @return array<string, mixed>
     */
    public static function one(array $row): array
    {
        return [
            'id' => $row['id'],
            'name' => $row['name'],
            'invite_code' => $row['invite_code'],
            'created_at' => $row['created_at'],
        ];
    }
}
