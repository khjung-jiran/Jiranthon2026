<?php

declare(strict_types=1);

namespace Eum\Repository;

use Eum\Support\Clock;
use Eum\Support\Uuid;

final class PollRepository extends Repository
{
    public function __construct(\PDO $db, private readonly Clock $clock)
    {
        parent::__construct($db);
    }

    /**
     * @param list<string> $options
     */
    public function create(
        string $familyId,
        string $title,
        string $createdBy,
        array $options,
        ?string $deadline = null,
    ): string {
        $id = Uuid::v4();

        $this->transaction(function () use ($id, $familyId, $title, $createdBy, $options, $deadline): void {
            $this->execute(
                'INSERT INTO polls (id, family_id, title, deadline, created_by, created_at)
                 VALUES (?, ?, ?, ?, ?, ?)',
                [$id, $familyId, $title, $deadline, $createdBy, $this->clock->now()]
            );

            $stmt = $this->db->prepare(
                'INSERT INTO poll_options (id, poll_id, label, vote_count) VALUES (?, ?, ?, 0)'
            );

            foreach ($options as $label) {
                $stmt->execute([Uuid::v4(), $id, $label]);
            }
        });

        return $id;
    }

    /** @return array<string, mixed>|null */
    public function find(string $id): ?array
    {
        return $this->fetchOne('SELECT * FROM polls WHERE id = ?', [$id]);
    }

    /** @return list<array<string, mixed>> */
    public function listByFamily(string $familyId): array
    {
        return $this->fetchAllRows(
            'SELECT * FROM polls WHERE family_id = ? ORDER BY created_at DESC',
            [$familyId]
        );
    }

    /** @return list<array<string, mixed>> */
    public function optionsFor(string $pollId): array
    {
        return $this->fetchAllRows('SELECT * FROM poll_options WHERE poll_id = ?', [$pollId]);
    }

    /**
     * 여러 투표의 선택지를 한 번에 조회한다. 목록 조회의 N+1 을 없앤다.
     *
     * @param  list<string> $pollIds
     * @return array<string, list<array<string, mixed>>> pollId => options
     */
    public function optionsForMany(array $pollIds): array
    {
        if ($pollIds === []) {
            return [];
        }

        $rows = $this->fetchAllRows(
            'SELECT * FROM poll_options WHERE poll_id IN (' . $this->placeholders(\count($pollIds)) . ')',
            $pollIds
        );

        $grouped = [];
        foreach ($rows as $row) {
            $grouped[(string) $row['poll_id']][] = $row;
        }

        return $grouped;
    }

    /** 선택지가 실제로 해당 투표에 속하는지 확인한다. */
    public function optionBelongsToPoll(string $optionId, string $pollId): bool
    {
        return $this->exists(
            'SELECT 1 FROM poll_options WHERE id = ? AND poll_id = ?',
            [$optionId, $pollId]
        );
    }

    /**
     * 표를 기록한다. 같은 멤버가 다시 투표하면 기존 표를 옮긴다.
     *
     * 이전 구현은 감소·삭제·삽입·증가 4개 문장을 트랜잭션 없이 실행해서,
     * 중간에 실패하면 집계가 영구히 어긋났다.
     */
    public function castVote(string $pollId, string $optionId, string $memberId): void
    {
        $this->transaction(function () use ($pollId, $optionId, $memberId): void {
            $existing = $this->fetchOne(
                'SELECT id, option_id FROM poll_votes WHERE poll_id = ? AND member_id = ?',
                [$pollId, $memberId]
            );

            if ($existing !== null) {
                if ($existing['option_id'] === $optionId) {
                    return; // 같은 선택지 재투표는 무시한다.
                }

                $this->execute(
                    'UPDATE poll_options SET vote_count = MAX(0, vote_count - 1) WHERE id = ?',
                    [$existing['option_id']]
                );
                $this->execute('DELETE FROM poll_votes WHERE id = ?', [$existing['id']]);
            }

            $this->execute(
                'INSERT INTO poll_votes (id, poll_id, option_id, member_id) VALUES (?, ?, ?, ?)',
                [Uuid::v4(), $pollId, $optionId, $memberId]
            );
            $this->execute(
                'UPDATE poll_options SET vote_count = vote_count + 1 WHERE id = ?',
                [$optionId]
            );
        });
    }

    /** 특정 멤버가 각 투표에서 고른 선택지. `option_id` 를 반환한다. */
    public function votesByMember(string $memberId, array $pollIds): array
    {
        if ($pollIds === []) {
            return [];
        }

        $rows = $this->fetchAllRows(
            'SELECT poll_id, option_id FROM poll_votes
             WHERE member_id = ? AND poll_id IN (' . $this->placeholders(\count($pollIds)) . ')',
            [$memberId, ...$pollIds]
        );

        return \array_column($rows, 'option_id', 'poll_id');
    }
}
