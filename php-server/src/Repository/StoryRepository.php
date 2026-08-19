<?php

declare(strict_types=1);

namespace Eum\Repository;

use Eum\Domain\Era;
use Eum\Support\Clock;
use Eum\Support\Uuid;

final class StoryRepository extends Repository
{
    public function __construct(\PDO $db, private readonly Clock $clock)
    {
        parent::__construct($db);
    }

    /**
     * 가족의 저장된 스토리를 시기별로 인덱싱해 반환한다.
     *
     * @return array<string, array<string, mixed>> era value => story row
     */
    public function mapByEra(string $familyId): array
    {
        $rows = $this->fetchAllRows('SELECT * FROM stories WHERE family_id = ?', [$familyId]);

        return \array_column($rows, null, 'category');
    }

    /** @return array<string, mixed>|null */
    public function findByEra(string $familyId, Era $era): ?array
    {
        return $this->fetchOne(
            'SELECT * FROM stories WHERE family_id = ? AND category = ?',
            [$familyId, $era->value]
        );
    }

    /**
     * 시기별 스토리를 저장한다. 있으면 갱신, 없으면 생성.
     */
    public function save(string $familyId, Era $era, string $title, string $body, int $responseCount): void
    {
        $now = $this->clock->now();
        $existing = $this->findByEra($familyId, $era);

        if ($existing !== null) {
            $this->execute(
                'UPDATE stories SET title = ?, body = ?, response_count = ?, updated_at = ? WHERE id = ?',
                [$title, $body, $responseCount, $now, $existing['id']]
            );

            return;
        }

        $this->execute(
            'INSERT INTO stories (id, family_id, category, title, body, response_count, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [Uuid::v4(), $familyId, $era->value, $title, $body, $responseCount, $now, $now]
        );
    }
}
