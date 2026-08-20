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
     * 스토리 생성용 질문·답변 쌍.
     *
     * 답변의 era(r.era)를 우선 사용하고, 비어 있으면 StorybookService에서
     * EraClassifier 로 본문 기반 분류를 수행한다. 질문 카테고리는 답변
     * 내용과 무관할 수 있어 시기 분류 근거로 쓰지 않는다.
     *
     * @return list<array<string, mixed>>
     */
    public function answeredPairsForFamily(string $familyId): array
    {
        return $this->fetchAllRows(
            'SELECT q.id         AS question_id,
                    q.content   AS question,
                    r.id        AS response_id,
                    r.era       AS era,
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

    /** 분류된 시기를 DB에 캐싱 — 이후 요청에서 LLM 호출을 건너뛴다. */
    public function updateEra(string $responseId, string $era): void
    {
        $this->execute(
            'UPDATE responses SET era = ? WHERE id = ?',
            [$era, $responseId]
        );
    }
}
