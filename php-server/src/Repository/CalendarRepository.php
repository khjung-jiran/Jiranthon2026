<?php

declare(strict_types=1);

namespace Eum\Repository;

use Eum\Support\Clock;
use Eum\Support\Uuid;

final class CalendarRepository extends Repository
{
    public function __construct(\PDO $db, private readonly Clock $clock)
    {
        parent::__construct($db);
    }

    public function create(
        string $familyId,
        string $date,
        string $title,
        string $createdBy,
        ?string $tag = null,
        ?string $color = null,
    ): string {
        $id = Uuid::v4();

        $this->execute(
            'INSERT INTO calendar_entries (id, family_id, date, title, created_by, tag, color, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [$id, $familyId, $date, $title, $createdBy, $tag, $color, $this->clock->now()]
        );

        return $id;
    }

    /** @return array<string, mixed>|null */
    public function find(string $id): ?array
    {
        return $this->fetchOne('SELECT * FROM calendar_entries WHERE id = ?', [$id]);
    }

    /**
     * @param  string|null $month `YYYY-MM` 형식
     * @return list<array<string, mixed>>
     */
    public function search(string $familyId, ?string $month = null, bool $upcomingOnly = false): array
    {
        $sql = 'SELECT * FROM calendar_entries WHERE family_id = ?';
        $params = [$familyId];

        if ($month !== null && \preg_match('/^\d{4}-\d{2}$/', $month) === 1) {
            // 월 경계는 문자열 비교 대신 다음 달 1일 미만으로 판정한다.
            // 이전 구현은 `-31` 을 하드코딩해서 31일이 없는 달을 잘못 처리했다.
            $start = $month . '-01';
            $end = (new \DateTimeImmutable($start))->modify('+1 month')->format('Y-m-d');

            $sql .= ' AND date >= ? AND date < ?';
            $params[] = $start;
            $params[] = $end;
        }

        if ($upcomingOnly) {
            $sql .= ' AND date >= ?';
            $params[] = $this->clock->today();
        }

        return $this->fetchAllRows($sql . ' ORDER BY date ASC', $params);
    }

    public function delete(string $id): void
    {
        $this->execute('DELETE FROM calendar_entries WHERE id = ?', [$id]);
    }
}
