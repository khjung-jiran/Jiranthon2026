<?php

declare(strict_types=1);

namespace Eum\Repository;

use Eum\Support\Uuid;

final class SettingsRepository extends Repository
{
    /** 허용되는 글자 크기. 임의 문자열이 저장되는 것을 막는다. */
    public const FONT_SIZES = ['작게', '보통', '크게', '아주 크게'];

    /**
     * 설정 행을 조회하고, 없으면 기본값으로 만들어 반환한다.
     *
     * @return array<string, mixed>
     */
    public function findOrCreate(string $memberId): array
    {
        $row = $this->fetchOne('SELECT * FROM member_settings WHERE member_id = ?', [$memberId]);

        if ($row !== null) {
            return $row;
        }

        $this->execute(
            'INSERT INTO member_settings (id, member_id) VALUES (?, ?)',
            [Uuid::v4(), $memberId]
        );

        return $this->fetchOne('SELECT * FROM member_settings WHERE member_id = ?', [$memberId])
            ?? throw new \RuntimeException('설정을 생성할 수 없습니다');
    }

    /**
     * 전달된 필드만 갱신한다.
     *
     * @param array<string, string|int> $changes 컬럼 => 값
     */
    public function update(string $memberId, array $changes): void
    {
        if ($changes === []) {
            return;
        }

        $assignments = \implode(', ', \array_map(
            static fn (string $column): string => "{$column} = ?",
            \array_keys($changes)
        ));

        $this->execute(
            "UPDATE member_settings SET {$assignments} WHERE member_id = ?",
            [...\array_values($changes), $memberId]
        );
    }
}
