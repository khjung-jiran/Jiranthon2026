<?php

declare(strict_types=1);

namespace Eum\Repository;

/**
 * 모든 리포지토리가 공유하는 PDO 실행 헬퍼.
 *
 * 이전 컨트롤러들은 `prepare` → `execute` → `fetch` 3줄을 수백 번 반복했다.
 */
abstract class Repository
{
    public function __construct(protected readonly \PDO $db)
    {
    }

    /**
     * @param  list<mixed> $params
     * @return array<string, mixed>|null
     */
    protected function fetchOne(string $sql, array $params = []): ?array
    {
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch();

        return $row === false ? null : $row;
    }

    /**
     * @param  list<mixed> $params
     * @return list<array<string, mixed>>
     */
    protected function fetchAllRows(string $sql, array $params = []): array
    {
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    /** 단일 스칼라 값 조회 (COUNT 등). */
    protected function fetchValue(string $sql, array $params = []): mixed
    {
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchColumn();
    }

    protected function fetchCount(string $sql, array $params = []): int
    {
        return (int) $this->fetchValue($sql, $params);
    }

    /**
     * @param  list<mixed> $params
     * @return int 영향받은 행 수
     */
    protected function execute(string $sql, array $params = []): int
    {
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->rowCount();
    }

    protected function exists(string $sql, array $params = []): bool
    {
        return $this->fetchValue($sql, $params) !== false;
    }

    /**
     * 여러 쓰기를 하나의 트랜잭션으로 묶는다.
     *
     * @template T
     * @param  callable(): T $work
     * @return T
     */
    protected function transaction(callable $work): mixed
    {
        // 중첩 호출 시 이미 트랜잭션이 열려 있으면 그대로 참여한다.
        if ($this->db->inTransaction()) {
            return $work();
        }

        $this->db->beginTransaction();

        try {
            $result = $work();
            $this->db->commit();

            return $result;
        } catch (\Throwable $e) {
            $this->db->rollBack();

            throw $e;
        }
    }

    /**
     * `IN (?, ?, ?)` 자리표시자 생성.
     */
    protected function placeholders(int $count): string
    {
        return \implode(', ', \array_fill(0, \max($count, 1), '?'));
    }
}
