<?php

declare(strict_types=1);

namespace Eum\Repository;

use Eum\Domain\InputMethod;
use Eum\Support\Clock;
use Eum\Support\Uuid;

final class ResponseRepository extends Repository
{
    public function __construct(\PDO $db, private readonly Clock $clock)
    {
        parent::__construct($db);
    }

    public function create(
        string $questionId,
        string $memberId,
        string $content,
        InputMethod $inputMethod,
        ?string $audioFilePath = null,
        ?string $transcript = null,
        ?string $era = null,
        ?string $duration = null,
    ): string {
        $id = Uuid::v4();

        $this->execute(
            'INSERT INTO responses
                (id, question_id, member_id, content, input_method, audio_file_path, transcript, era, duration, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $id, $questionId, $memberId, $content, $inputMethod->value,
                $audioFilePath, $transcript, $era, $duration, $this->clock->now(),
            ]
        );

        return $id;
    }

    /** @return array<string, mixed>|null */
    public function find(string $id): ?array
    {
        return $this->fetchOne('SELECT * FROM responses WHERE id = ?', [$id]);
    }

    /**
     * 질문 정보를 조인해서 답변 목록을 조회한다.
     *
     * @return list<array<string, mixed>>
     */
    public function search(
        ?string $familyId = null,
        ?string $questionId = null,
        ?string $memberId = null,
    ): array {
        $conditions = [];
        $params = [];

        foreach ([
            'q.family_id' => $familyId,
            'r.question_id' => $questionId,
            'r.member_id' => $memberId,
        ] as $column => $value) {
            if ($value !== null && $value !== '') {
                $conditions[] = "{$column} = ?";
                $params[] = $value;
            }
        }

        $where = $conditions === [] ? '' : ' WHERE ' . \implode(' AND ', $conditions);

        return $this->fetchAllRows(
            "SELECT r.*,
                    q.content        AS question_content,
                    q.category       AS question_category,
                    q.from_member_id AS question_from_member_id
             FROM responses r
             JOIN questions q ON r.question_id = q.id
             {$where}
             ORDER BY r.created_at DESC",
            $params
        );
    }

    /**
     * 스토리 생성용 질문·답변 쌍. 시기 분류를 위해 카테고리도 함께 가져온다.
     *
     * @return list<array<string, mixed>>
     */
    public function answeredPairsForFamily(string $familyId): array
    {
        return $this->fetchAllRows(
            'SELECT q.id         AS question_id,
                    q.content   AS question,
                    q.category  AS era,
                    r.content   AS answer,
                    r.transcript,
                    r.created_at
             FROM responses r
             JOIN questions q ON r.question_id = q.id
             WHERE q.family_id = ?
             ORDER BY r.created_at ASC',
            [$familyId]
        );
    }
}
