<?php

declare(strict_types=1);

namespace Eum\Repository;

use Eum\Domain\Era;
use Eum\Domain\QuestionSource;
use Eum\Domain\QuestionStatus;
use Eum\Support\Clock;
use Eum\Support\Uuid;

final class QuestionRepository extends Repository
{
    public function __construct(\PDO $db, private readonly Clock $clock)
    {
        parent::__construct($db);
    }

    /**
     * 질문을 생성한다.
     *
     * `$era` 는 의도적으로 nullable 이다. 질문을 만들 때는 인생 시기를 정하지
     * 않고, 답변이 도착한 뒤 그 내용으로 분류한다.
     */
    public function create(
        string $familyId,
        string $content,
        string $toMemberId,
        ?string $fromMemberId = null,
        QuestionSource $source = QuestionSource::Manual,
        ?Era $era = null,
    ): string {
        $id = Uuid::v4();

        $this->execute(
            'INSERT INTO questions
                (id, family_id, content, category, source, from_member_id, to_member_id, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $id,
                $familyId,
                $content,
                $era?->value,
                $source->value,
                $fromMemberId ?: null,
                $toMemberId ?: null,
                QuestionStatus::Pending->value,
                $this->clock->now(),
            ]
        );

        return $id;
    }

    /**
     * 기본 질문 묶음을 한 트랜잭션으로 삽입한다.
     *
     * @param  list<string> $contents
     * @return int 삽입된 질문 수
     */
    public function createMany(string $familyId, string $toMemberId, array $contents): int
    {
        if ($contents === []) {
            return 0;
        }

        return $this->transaction(function () use ($familyId, $toMemberId, $contents): int {
            $stmt = $this->db->prepare(
                'INSERT INTO questions
                    (id, family_id, content, category, source, from_member_id, to_member_id, status, created_at)
                 VALUES (?, ?, ?, NULL, ?, NULL, ?, ?, ?)'
            );

            $now = $this->clock->now();

            foreach ($contents as $content) {
                $stmt->execute([
                    Uuid::v4(),
                    $familyId,
                    $content,
                    QuestionSource::Auto->value,
                    $toMemberId,
                    QuestionStatus::Pending->value,
                    $now,
                ]);
            }

            return \count($contents);
        });
    }

    /** @return array<string, mixed>|null */
    public function find(string $id): ?array
    {
        return $this->fetchOne('SELECT * FROM questions WHERE id = ?', [$id]);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function search(
        ?string $familyId = null,
        ?string $toMemberId = null,
        ?string $fromMemberId = null,
        ?QuestionStatus $status = null,
    ): array {
        $conditions = [];
        $params = [];

        foreach ([
            'family_id' => $familyId,
            'to_member_id' => $toMemberId,
            'from_member_id' => $fromMemberId,
            'status' => $status?->value,
        ] as $column => $value) {
            if ($value !== null && $value !== '') {
                $conditions[] = "{$column} = ?";
                $params[] = $value;
            }
        }

        $where = $conditions === [] ? '' : ' WHERE ' . \implode(' AND ', $conditions);

        return $this->fetchAllRows(
            "SELECT * FROM questions{$where} ORDER BY created_at DESC",
            $params
        );
    }

    /** 이미 출제된 질문 본문. AI 제안이 중복을 피하는 데 쓴다. */
    public function existingContents(?string $familyId = null): array
    {
        $rows = $familyId === null
            ? $this->fetchAllRows('SELECT content FROM questions')
            : $this->fetchAllRows('SELECT content FROM questions WHERE family_id = ?', [$familyId]);

        return \array_column($rows, 'content');
    }

    public function markAnswered(string $id): void
    {
        $this->execute(
            'UPDATE questions SET status = ? WHERE id = ?',
            [QuestionStatus::Answered->value, $id]
        );
    }

    /** 아직 미분류인 질문에만 시기를 기록한다. 기존 분류는 덮어쓰지 않는다. */
    public function assignEraIfUnset(string $id, Era $era): bool
    {
        return $this->execute(
            'UPDATE questions SET category = ? WHERE id = ? AND category IS NULL',
            [$era->value, $id]
        ) > 0;
    }

    public function countByStatus(string $familyId, QuestionStatus $status): int
    {
        return $this->fetchCount(
            'SELECT COUNT(*) FROM questions WHERE family_id = ? AND status = ?',
            [$familyId, $status->value]
        );
    }

    public function hasPending(string $familyId, string $toMemberId): bool
    {
        return $this->exists(
            'SELECT 1 FROM questions WHERE family_id = ? AND to_member_id = ? AND status = ? LIMIT 1',
            [$familyId, $toMemberId, QuestionStatus::Pending->value]
        );
    }

    /** 질문과 그에 달린 답변을 함께 삭제한다. */
    public function delete(string $id): void
    {
        $this->transaction(function () use ($id): void {
            $this->execute('DELETE FROM responses WHERE question_id = ?', [$id]);
            $this->execute('DELETE FROM questions WHERE id = ?', [$id]);
        });
    }

    /**
     * 꼬리 질문을 생성한다.
     *
     * parent_question_id 로 원 질문과, parent_response_id 로 생성 근거가 된
     * 답변과 연결한다. 근거 답변을 알 수 없으면 후자는 NULL 로 남는다.
     *
     * @param list<string> $contents
     * @return int 생성된 질문 수
     */
    public function createFollowUps(
        string $familyId,
        string $toMemberId,
        array $contents,
        string $parentQuestionId,
        ?string $parentResponseId = null,
    ): int {
        if ($contents === []) {
            return 0;
        }

        return $this->transaction(function () use ($familyId, $toMemberId, $contents, $parentQuestionId, $parentResponseId): int {
            $stmt = $this->db->prepare(
                'INSERT INTO questions
                    (id, family_id, content, category, source, from_member_id, to_member_id, parent_question_id, parent_response_id, status, created_at)
                 VALUES (?, ?, ?, NULL, ?, NULL, ?, ?, ?, ?, ?)'
            );

            $now = $this->clock->now();

            foreach ($contents as $content) {
                $stmt->execute([
                    Uuid::v4(),
                    $familyId,
                    $content,
                    QuestionSource::FollowUp->value,
                    $toMemberId,
                    $parentQuestionId,
                    $parentResponseId,
                    QuestionStatus::Pending->value,
                    $now,
                ]);
            }

            return \count($contents);
        });
    }

    /**
     * 꼬리 질문들의 생성 근거(원 질문 + 그 답변)를 한 번에 조회한다.
     *
     * parent_response_id 가 비어 있는 예전 데이터는 원 질문의 최신 답변으로
     * 보정한다. 목록 화면에서 행마다 조회하면 N+1 이 되므로 한 번에 받는다.
     *
     * @param  list<string> $questionIds 꼬리 질문 ID
     * @return array<string, array<string, mixed>> 꼬리 질문 ID => 근거 정보
     */
    public function followUpOrigins(array $questionIds): array
    {
        $questionIds = \array_values(\array_unique(\array_filter($questionIds)));

        if ($questionIds === []) {
            return [];
        }

        $placeholders = \implode(', ', \array_fill(0, \count($questionIds), '?'));

        $rows = $this->fetchAllRows(
            "SELECT f.id                                        AS follow_up_id,
                    p.id                                        AS question_id,
                    p.content                                   AS question_content,
                    r.id                                        AS response_id,
                    COALESCE(NULLIF(TRIM(r.content), ''), r.transcript) AS answer,
                    r.created_at                                AS answered_at
             FROM questions f
             JOIN questions p ON f.parent_question_id = p.id
             LEFT JOIN responses r ON r.id = COALESCE(
                 f.parent_response_id,
                 (SELECT r2.id FROM responses r2
                   WHERE r2.question_id = p.id
                   ORDER BY r2.created_at DESC LIMIT 1)
             )
             WHERE f.id IN ({$placeholders})",
            $questionIds
        );

        $origins = [];

        foreach ($rows as $row) {
            $origins[(string) $row['follow_up_id']] = $row;
        }

        return $origins;
    }

    /**
     * 특정 질문에서 파생된 꼬리 질문 개수를 반환한다.
     */
    public function countFollowUps(string $questionId): int
    {
        return $this->fetchCount(
            'SELECT COUNT(*) FROM questions WHERE parent_question_id = ?',
            [$questionId]
        );
    }

    /**
     * 특정 가족의 특정 시기(era)에 출제된 질문 본문 목록.
     * 꼬리 질문 생성 시 중복을 피하는 데 쓴다.
     */
    public function existingContentsByEra(string $familyId, Era $era): array
    {
        $rows = $this->fetchAllRows(
            'SELECT content FROM questions WHERE family_id = ? AND category = ?',
            [$familyId, $era->value]
        );

        return \array_column($rows, 'content');
    }
}
