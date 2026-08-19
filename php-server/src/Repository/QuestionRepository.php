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
     * 꼬리 질문을 생성한다. parent_question_id로 원 질문과 연결한다.
     *
     * @param list<string> $contents
     * @return int 생성된 질문 수
     */
    public function createFollowUps(
        string $familyId,
        string $toMemberId,
        array $contents,
        string $parentQuestionId,
    ): int {
        if ($contents === []) {
            return 0;
        }

        return $this->transaction(function () use ($familyId, $toMemberId, $contents, $parentQuestionId): int {
            $stmt = $this->db->prepare(
                'INSERT INTO questions
                    (id, family_id, content, category, source, from_member_id, to_member_id, parent_question_id, status, created_at)
                 VALUES (?, ?, ?, NULL, ?, NULL, ?, ?, ?, ?)'
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
                    QuestionStatus::Pending->value,
                    $now,
                ]);
            }

            return \count($contents);
        });
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
