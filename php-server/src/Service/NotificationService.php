<?php

declare(strict_types=1);

namespace Eum\Service;

use Eum\Repository\MemberRepository;
use Eum\Repository\NotificationRepository;
use Eum\Support\Logger;

/**
 * 알림 생성 + FCM 푸시 전송을 통합.
 *
 * 알림을 DB 에 저장하는 동시에, 대상 멤버의 FCM 토큰이 있으면
 * 푸시 알림을 함께 보낸다. FCM 설정이 없으면 DB 저장만 수행한다.
 */
final class NotificationService
{
    public function __construct(
        private readonly NotificationRepository $notifications,
        private readonly MemberRepository $members,
        private readonly FcmService $fcm,
        private readonly Logger $logger,
    ) {
    }

    /**
     * 알림을 생성하고 FCM 푸시를 전송한다.
     *
     * @param  string      $memberId   수신 멤버 ID
     * @param  string      $type       알림 타입 (예: 'response', 'question')
     * @param  string      $title      알림 제목
     * @param  string|null $body       푸시 본문 (null 이면 title 을 본문으로 사용)
     * @param  string|null $icon       알림 아이콘
     * @param  string|null $color      알림 색상
     * @param  string|null $navTarget  앱 내 이동 경로
     * @param  string|null $familyId   가족 ID
     * @return string                  생성된 알림 ID
     */
    public function notify(
        string $memberId,
        string $type,
        string $title,
        ?string $body = null,
        ?string $icon = null,
        ?string $color = null,
        ?string $navTarget = null,
        ?string $familyId = null,
    ): string {
        // 1. DB 에 알림 저장
        $id = $this->notifications->create(
            $memberId,
            $type,
            $title,
            $icon,
            $color,
            $navTarget,
            $familyId,
        );

        // 2. FCM 푸시 전송
        $this->sendPush($memberId, $title, $body ?? $title, $navTarget);

        return $id;
    }

    /**
     * 여러 멤버에게 같은 알림을 보낸다 (예: 가족 전체 알림).
     *
     * @param  list<string> $memberIds
     * @return list<string>  생성된 알림 ID 목록
     */
    public function notifyMany(
        array $memberIds,
        string $type,
        string $title,
        ?string $body = null,
        ?string $icon = null,
        ?string $color = null,
        ?string $navTarget = null,
        ?string $familyId = null,
    ): array {
        $ids = [];

        foreach ($memberIds as $memberId) {
            $ids[] = $this->notify(
                $memberId,
                $type,
                $title,
                $body,
                $icon,
                $color,
                $navTarget,
                $familyId,
            );
        }

        return $ids;
    }

    private function sendPush(string $memberId, string $title, string $body, ?string $navTarget): void
    {
        if (!$this->fcm->isConfigured()) {
            return;
        }

        $token = $this->members->fcmToken($memberId);

        if ($token === null || $token === '') {
            return;
        }

        $data = $navTarget !== null ? ['nav_target' => $navTarget] : [];

        $this->fcm->send($token, $title, $body, $data);
    }
}
