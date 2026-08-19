<?php

declare(strict_types=1);

namespace Eum\Repository;

use Eum\Domain\CapsuleStatus;
use Eum\Support\Clock;
use Eum\Support\Uuid;

final class CapsuleRepository extends Repository
{
    public function __construct(\PDO $db, private readonly Clock $clock)
    {
        parent::__construct($db);
    }

    public function create(
        string $familyId,
        string $title,
        string $openDate,
        ?string $fromMemberId,
        ?string $toMemberId,
        ?string $audioFilePath,
        ?string $duration,
    ): string {
        $id = Uuid::v4();
        $status = $openDate <= $this->clock->today() ? CapsuleStatus::Ready : CapsuleStatus::Locked;

        $this->execute(
            'INSERT INTO capsules
                (id, family_id, from_member_id, to_member_id, title, audio_file_path, open_date, status, duration, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $id, $familyId, $fromMemberId ?: null, $toMemberId ?: null, $title,
                $audioFilePath, $openDate, $status->value, $duration, $this->clock->now(),
            ]
        );

        return $id;
    }

    /** @return array<string, mixed>|null */
    public function find(string $id): ?array
    {
        return $this->fetchOne('SELECT * FROM capsules WHERE id = ?', [$id]);
    }

    /** @return list<array<string, mixed>> */
    public function listByFamily(string $familyId): array
    {
        return $this->fetchAllRows(
            'SELECT * FROM capsules WHERE family_id = ? ORDER BY open_date ASC',
            [$familyId]
        );
    }

    /** @return list<array<string, mixed>> */
    public function listReady(string $familyId): array
    {
        return $this->fetchAllRows(
            'SELECT * FROM capsules
             WHERE family_id = ? AND open_date <= ? AND status != ?
             ORDER BY open_date ASC',
            [$familyId, $this->clock->today(), CapsuleStatus::Opened->value]
        );
    }

    /**
     * 개봉일이 지난 잠긴 캡슐을 일괄 해제한다.
     *
     * 이전 구현은 행마다 UPDATE 를 실행했다 (읽기 요청에서 N번의 쓰기).
     * 이제 단일 문장으로 처리한다.
     */
    public function releaseDueCapsules(string $familyId): array
    {
        // 해제 대상을 먼저 조회 (푸시 알림에 사용)
        $released = $this->fetchAllRows(
            'SELECT * FROM capsules
             WHERE family_id = ? AND status = ? AND open_date <= ?',
            [$familyId, CapsuleStatus::Locked->value, $this->clock->today()]
        );

        $this->execute(
            'UPDATE capsules SET status = ?
             WHERE family_id = ? AND status = ? AND open_date <= ?',
            [
                CapsuleStatus::Ready->value,
                $familyId,
                CapsuleStatus::Locked->value,
                $this->clock->today(),
            ]
        );

        return $released;
    }

    public function markOpened(string $id): void
    {
        $this->execute(
            'UPDATE capsules SET status = ? WHERE id = ?',
            [CapsuleStatus::Opened->value, $id]
        );
    }
}
