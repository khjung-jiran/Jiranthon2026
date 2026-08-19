<?php

declare(strict_types=1);

namespace Eum\Repository;

use Eum\Support\Clock;
use Eum\Support\Uuid;

final class NotificationRepository extends Repository
{
    public function __construct(\PDO $db, private readonly Clock $clock)
    {
        parent::__construct($db);
    }

    public function create(
        string $memberId,
        string $type,
        string $title,
        ?string $icon = null,
        ?string $color = null,
        ?string $navTarget = null,
        ?string $familyId = null,
    ): string {
        $id = Uuid::v4();

        $this->execute(
            'INSERT INTO notifications
                (id, family_id, member_id, type, title, icon, color, nav_target, is_read, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)',
            [$id, $familyId, $memberId, $type, $title, $icon, $color, $navTarget, $this->clock->now()]
        );

        return $id;
    }

    /** @return array<string, mixed>|null */
    public function find(string $id): ?array
    {
        return $this->fetchOne('SELECT * FROM notifications WHERE id = ?', [$id]);
    }

    /** @return list<array<string, mixed>> */
    public function listByMember(string $memberId): array
    {
        return $this->fetchAllRows(
            'SELECT * FROM notifications WHERE member_id = ? ORDER BY created_at DESC',
            [$memberId]
        );
    }

    public function unreadCount(string $memberId): int
    {
        return $this->fetchCount(
            'SELECT COUNT(*) FROM notifications WHERE member_id = ? AND is_read = 0',
            [$memberId]
        );
    }

    public function has(string $id): bool
    {
        return $this->exists('SELECT 1 FROM notifications WHERE id = ?', [$id]);
    }

    /**
     * 특정 타입+제목 조합으로 이미 알림이 있는지 확인한다.
     * 캡슐 도착 등 중복 알림 방지에 사용한다.
     */
    public function existsByTypeAndTitle(string $memberId, string $type, string $title): bool
    {
        return $this->exists(
            'SELECT 1 FROM notifications WHERE member_id = ? AND type = ? AND title = ?',
            [$memberId, $type, $title]
        );
    }

    public function markRead(string $id): void
    {
        $this->execute('UPDATE notifications SET is_read = 1 WHERE id = ?', [$id]);
    }

    public function markAllRead(string $memberId): int
    {
        return $this->execute(
            'UPDATE notifications SET is_read = 1 WHERE member_id = ? AND is_read = 0',
            [$memberId]
        );
    }
}
