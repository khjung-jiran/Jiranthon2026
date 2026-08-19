<?php

declare(strict_types=1);

namespace Eum\Presenter;

/**
 * 멤버 직렬화. `password_hash` 는 절대 노출하지 않는다.
 */
final class MemberPresenter
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
            'name' => $row['name'],
            'role' => $row['role'],
            'sub_role' => $row['sub_role'] ?? null,
            'username' => $row['username'],
            'birth_date' => $row['birth_date'],
            'profile_image' => $row['profile_image'],
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
