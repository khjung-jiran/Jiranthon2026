<?php

declare(strict_types=1);

namespace Eum\Database;

use Eum\Domain\Era;
use Eum\Support\Logger;
use Eum\Support\Paths;

/**
 * 스키마 생성과 일회성 데이터 마이그레이션.
 *
 * 이전 구현은 매 요청마다 questions 테이블 전체를 읽어 행 단위로 UPDATE 를
 * 실행했다. 더 심각한 건 `category IS NULL` 인 행을 모두 `twilight` 로
 * 덮어써서, "답변 내용으로 시기를 분류한다"는 규칙이 동작할 수 없었다는 점이다.
 * 이제 NULL 은 "아직 미분류" 라는 유효한 상태로 보존한다.
 */
final class Migrator
{
    /** 구버전 8분류 → 현행 3분류 대응표 */
    private const LEGACY_ERA_MAP = [
        'love' => Era::Youth,
        'life' => Era::Twilight,
        'values' => Era::Twilight,
        'family' => Era::Twilight,
        'food' => Era::Childhood,
        'seasonal' => Era::Twilight,
    ];

    public function __construct(
        private readonly \PDO $db,
        private readonly Logger $logger,
    ) {
    }

    public function migrate(): void
    {
        $this->createSchema();
        $this->createMigrationsTable();

        $this->runOnce('2026_08_remap_legacy_eras', $this->remapLegacyEras(...));
        $this->runOnce('2026_08_add_parent_question_id', $this->addParentQuestionId(...));
        $this->runOnce('2026_08_add_member_fcm_token', $this->addMemberFcmToken(...));
    }

    private function createSchema(): void
    {
        $schema = @\file_get_contents(Paths::schema());

        if ($schema === false) {
            throw new \RuntimeException('스키마 파일을 읽을 수 없습니다: ' . Paths::schema());
        }

        $this->db->exec($schema);
    }

    private function createMigrationsTable(): void
    {
        $this->db->exec(
            'CREATE TABLE IF NOT EXISTS schema_migrations (
                name TEXT PRIMARY KEY,
                applied_at DATETIME DEFAULT (datetime(\'now\'))
            )'
        );
    }

    /**
     * 이미 적용된 마이그레이션은 건너뛴다. 요청마다 재실행되지 않는다.
     */
    private function runOnce(string $name, callable $migration): void
    {
        $check = $this->db->prepare('SELECT 1 FROM schema_migrations WHERE name = ?');
        $check->execute([$name]);

        if ($check->fetchColumn() !== false) {
            return;
        }

        $affected = $migration();

        $this->db->prepare('INSERT INTO schema_migrations (name) VALUES (?)')->execute([$name]);

        if ($affected > 0) {
            $this->logger->info("마이그레이션 적용: {$name} / {$affected}건");
        }
    }

    /**
     * 구버전 카테고리를 3분류로 옮긴다.
     *
     * NULL 은 손대지 않는다 — 질문 생성 시점에는 시기를 정하지 않고,
     * 답변이 도착하면 분류하기 때문이다.
     */
    private function remapLegacyEras(): int
    {
        $valid = \array_map(static fn (Era $era): string => $era->value, Era::chronological());
        $placeholders = \implode(', ', \array_fill(0, \count($valid), '?'));

        $affected = 0;

        foreach (self::LEGACY_ERA_MAP as $legacy => $era) {
            $stmt = $this->db->prepare('UPDATE questions SET category = ? WHERE category = ?');
            $stmt->execute([$era->value, $legacy]);
            $affected += $stmt->rowCount();
        }

        // 대응표에 없는 미지의 값은 황혼기로 모은다. NULL 은 제외한다.
        $stmt = $this->db->prepare(
            "UPDATE questions SET category = ?
             WHERE category IS NOT NULL AND category NOT IN ({$placeholders})"
        );
        $stmt->execute([Era::Twilight->value, ...$valid]);

        return $affected + $stmt->rowCount();
    }

    /**
     * questions 테이블에 parent_question_id 컬럼을 추가한다.
     * 꼬리 질문이 어느 질문에서 파생했는지 추적한다.
     */
    private function addParentQuestionId(): int
    {
        $columns = $this->db->query('PRAGMA table_info(questions)')->fetchAll(\PDO::FETCH_ASSOC);
        $hasColumn = \in_array('parent_question_id', \array_column($columns, 'name'), true);

        if ($hasColumn) {
            return 0;
        }

        $this->db->exec('ALTER TABLE questions ADD COLUMN parent_question_id TEXT REFERENCES questions(id)');

        return 1;
    }

    /**
     * members 테이블에 fcm_token 컬럼을 추가한다.
     * 사용자별 앱 푸시 알림(Firebase Cloud Messaging) 전송에 필요하다.
     */
    private function addMemberFcmToken(): int
    {
        $columns = $this->db->query('PRAGMA table_info(members)')->fetchAll(\PDO::FETCH_ASSOC);
        $hasColumn = \in_array('fcm_token', \array_column($columns, 'name'), true);

        if ($hasColumn) {
            return 0;
        }

        $this->db->exec('ALTER TABLE members ADD COLUMN fcm_token TEXT');

        return 1;
    }
}
