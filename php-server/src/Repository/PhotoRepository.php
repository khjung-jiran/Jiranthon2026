<?php

declare(strict_types=1);

namespace Eum\Repository;

use Eum\Support\Clock;
use Eum\Support\Uuid;

final class PhotoRepository extends Repository
{
    /** 앨범 필터에서 "전체" 를 뜻하는 값 */
    public const FILTER_ALL = '전체';

    public function __construct(\PDO $db, private readonly Clock $clock)
    {
        parent::__construct($db);
    }

    public function create(
        string $familyId,
        string $url,
        ?string $label = null,
        ?string $who = null,
        ?string $uploadedBy = null,
    ): string {
        $id = Uuid::v4();

        $this->execute(
            'INSERT INTO photos (id, family_id, url, label, who, uploaded_by, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)',
            [$id, $familyId, $url, $label, $who, $uploadedBy, $this->clock->now()]
        );

        return $id;
    }

    /** @return list<array<string, mixed>> */
    public function search(string $familyId, ?string $who = null): array
    {
        $sql = 'SELECT * FROM photos WHERE family_id = ?';
        $params = [$familyId];

        if ($who !== null && $who !== self::FILTER_ALL) {
            $sql .= ' AND who = ?';
            $params[] = $who;
        }

        return $this->fetchAllRows($sql . ' ORDER BY created_at DESC', $params);
    }

    /** @return array<string, mixed>|null */
    public function find(string $id): ?array
    {
        return $this->fetchOne('SELECT * FROM photos WHERE id = ?', [$id]);
    }

    public function has(string $id): bool
    {
        return $this->exists('SELECT 1 FROM photos WHERE id = ?', [$id]);
    }

    public function delete(string $id): void
    {
        $this->execute('DELETE FROM photos WHERE id = ?', [$id]);
    }
}
