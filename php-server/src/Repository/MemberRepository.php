<?php

declare(strict_types=1);

namespace Eum\Repository;

use Eum\Domain\MemberRole;
use Eum\Support\Clock;
use Eum\Support\Uuid;

final class MemberRepository extends Repository
{
    public function __construct(\PDO $db, private readonly Clock $clock)
    {
        parent::__construct($db);
    }

    /**
     * 멤버와 기본 설정 행을 한 트랜잭션으로 생성한다.
     * 이전에는 두 INSERT 가 분리되어 있어 중간 실패 시 설정 없는 멤버가 남았다.
     */
    public function create(
        string $familyId,
        string $name,
        MemberRole $role,
        ?string $subRole,
        ?string $username,
        ?string $passwordHash,
        ?string $birthDate,
        ?string $profileImage,
        ?string $provider = null,
        ?string $providerId = null,
    ): string {
        $id = Uuid::v4();

        $this->transaction(function () use (
            $id, $familyId, $name, $role, $subRole, $username, $passwordHash,
            $birthDate, $profileImage, $provider, $providerId
        ): void {
            $this->execute(
                'INSERT INTO members
                    (id, family_id, name, role, sub_role, username, password_hash, birth_date, profile_image,
                     provider, provider_id, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    $id, $familyId, $name, $role->value, $subRole,
                    $username, $passwordHash, $birthDate, $profileImage,
                    $provider, $providerId, $this->clock->now(),
                ]
            );

            $this->execute(
                'INSERT INTO member_settings (id, member_id) VALUES (?, ?)',
                [Uuid::v4(), $id]
            );
        });

        return $id;
    }

    /** @return array<string, mixed>|null */
    public function find(string $id): ?array
    {
        return $this->fetchOne('SELECT * FROM members WHERE id = ?', [$id]);
    }

    /** @return array<string, mixed>|null */
    public function findByUsername(string $username): ?array
    {
        return $this->fetchOne('SELECT * FROM members WHERE username = ?', [$username]);
    }

    /**
     * 소셜 계정(카카오 등) 식별자로 멤버를 찾는다.
     *
     * @return array<string, mixed>|null
     */
    public function findByProvider(string $provider, string $providerId): ?array
    {
        return $this->fetchOne(
            'SELECT * FROM members WHERE provider = ? AND provider_id = ?',
            [$provider, $providerId]
        );
    }

    public function usernameExists(string $username): bool
    {
        return $this->exists('SELECT 1 FROM members WHERE username = ?', [$username]);
    }

    /** @return list<array<string, mixed>> */
    public function listByFamily(string $familyId): array
    {
        return $this->fetchAllRows(
            'SELECT * FROM members WHERE family_id = ? ORDER BY created_at ASC',
            [$familyId]
        );
    }

    /** @return array<string, mixed>|null */
    public function findParentByFamily(string $familyId): ?array
    {
        return $this->fetchOne(
            'SELECT * FROM members WHERE family_id = ? AND role = ? ORDER BY created_at ASC LIMIT 1',
            [$familyId, MemberRole::Parent->value]
        );
    }

    /**
     * 여러 멤버의 이름을 한 번에 조회한다. 질문 목록의 N+1 쿼리를 없애는 핵심.
     *
     * @param  list<string> $ids
     * @return array<string, string> id => name
     */
    public function nameMap(array $ids): array
    {
        $ids = \array_values(\array_unique(\array_filter($ids)));

        if ($ids === []) {
            return [];
        }

        $rows = $this->fetchAllRows(
            'SELECT id, name FROM members WHERE id IN (' . $this->placeholders(\count($ids)) . ')',
            $ids
        );

        return \array_column($rows, 'name', 'id');
    }

    public function updatePasswordHash(string $id, string $hash): void
    {
        $this->execute('UPDATE members SET password_hash = ? WHERE id = ?', [$hash, $id]);
    }

    /**
     * 멤버의 FCM 토큰을 갱신한다.
     * 앱에서 새 토큰이 발급되거나 로그아웃 시 null 로 초기화한다.
     */
    public function updateFcmToken(string $id, ?string $token): void
    {
        $this->execute('UPDATE members SET fcm_token = ? WHERE id = ?', [$token, $id]);
    }

    /** 멤버의 현재 FCM 토큰을 조회한다. 푸시 알림 전송에 사용한다. */
    public function fcmToken(string $id): ?string
    {
        $row = $this->fetchOne('SELECT fcm_token FROM members WHERE id = ?', [$id]);

        return $row === null ? null : ($row['fcm_token'] ?? null);
    }

    /** 초대 코드로 다른 가족에 합류. 해당 멤버의 질문도 함께 이동시킨다. */
    public function moveToFamily(string $memberId, string $familyId): void
    {
        $this->transaction(function () use ($memberId, $familyId): void {
            $this->execute('UPDATE members SET family_id = ? WHERE id = ?', [$familyId, $memberId]);
            $this->execute(
                'UPDATE questions SET family_id = ? WHERE from_member_id = ? OR to_member_id = ?',
                [$familyId, $memberId, $memberId]
            );
        });
    }

    /**
     * 멤버와 연관 데이터를 모두 삭제한다.
     * 외래키 제약 위반을 피하려면 자식 행부터 지워야 한다.
     */
    public function deleteWithRelations(string $memberId): void
    {
        $this->transaction(function () use ($memberId): void {
            $this->execute('DELETE FROM member_settings WHERE member_id = ?', [$memberId]);
            $this->execute('DELETE FROM responses WHERE member_id = ?', [$memberId]);
            $this->execute('DELETE FROM poll_votes WHERE member_id = ?', [$memberId]);
            $this->execute('DELETE FROM calendar_entries WHERE created_by = ?', [$memberId]);
            $this->execute('DELETE FROM photos WHERE uploaded_by = ?', [$memberId]);
            $this->execute('DELETE FROM notifications WHERE member_id = ?', [$memberId]);
            $this->execute(
                'DELETE FROM responses WHERE question_id IN
                    (SELECT id FROM questions WHERE from_member_id = ? OR to_member_id = ?)',
                [$memberId, $memberId]
            );
            $this->execute(
                'DELETE FROM questions WHERE from_member_id = ? OR to_member_id = ?',
                [$memberId, $memberId]
            );
            $this->execute('DELETE FROM members WHERE id = ?', [$memberId]);
        });
    }
}
