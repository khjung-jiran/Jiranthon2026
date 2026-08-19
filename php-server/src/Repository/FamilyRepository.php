<?php

declare(strict_types=1);

namespace Eum\Repository;

use Eum\Support\Clock;
use Eum\Support\Uuid;

final class FamilyRepository extends Repository
{
    public function __construct(\PDO $db, private readonly Clock $clock)
    {
        parent::__construct($db);
    }

    public function create(string $name): string
    {
        $id = Uuid::v4();

        $this->execute(
            'INSERT INTO families (id, name, invite_code, created_at) VALUES (?, ?, ?, ?)',
            [$id, $name, $this->generateUniqueInviteCode(), $this->clock->now()]
        );

        return $id;
    }

    /** @return array<string, mixed>|null */
    public function find(string $id): ?array
    {
        return $this->fetchOne('SELECT * FROM families WHERE id = ?', [$id]);
    }

    /** @return array<string, mixed>|null */
    public function findByInviteCode(string $inviteCode): ?array
    {
        return $this->fetchOne('SELECT * FROM families WHERE invite_code = ?', [$inviteCode]);
    }

    /**
     * 초대 코드는 UNIQUE 제약이 걸려 있다. 충돌 시 재시도해서
     * 가족 생성이 무작위로 실패하는 일을 막는다.
     */
    private function generateUniqueInviteCode(): string
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $code = Uuid::inviteCode();

            if (!$this->exists('SELECT 1 FROM families WHERE invite_code = ?', [$code])) {
                return $code;
            }
        }

        throw new \RuntimeException('초대 코드를 생성할 수 없습니다');
    }
}
