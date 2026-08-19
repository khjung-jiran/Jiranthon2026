<?php

declare(strict_types=1);

namespace Eum\Support;

/**
 * 시간 조회를 한 곳으로 모은다. 테스트에서 고정 시각을 주입할 수 있다.
 */
class Clock
{
    public const TIMESTAMP_FORMAT = 'Y-m-d H:i:s';
    public const DATE_FORMAT = 'Y-m-d';

    /** DB 저장용 타임스탬프 (`2026-08-12 07:38:00`) */
    public function now(): string
    {
        return $this->at()->format(self::TIMESTAMP_FORMAT);
    }

    /** DB 저장용 날짜 (`2026-08-12`) */
    public function today(): string
    {
        return $this->at()->format(self::DATE_FORMAT);
    }

    public function at(): \DateTimeImmutable
    {
        return new \DateTimeImmutable();
    }
}
