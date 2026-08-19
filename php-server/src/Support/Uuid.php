<?php

declare(strict_types=1);

namespace Eum\Support;

/**
 * RFC 4122 버전 4 UUID 및 사람이 읽을 수 있는 초대 코드 생성.
 */
final class Uuid
{
    public static function v4(): string
    {
        $bytes = \random_bytes(16);

        // 버전 (4) 과 variant (RFC 4122) 비트를 설정한다.
        $bytes[6] = \chr(\ord($bytes[6]) & 0x0F | 0x40);
        $bytes[8] = \chr(\ord($bytes[8]) & 0x3F | 0x80);

        return \vsprintf('%s%s-%s-%s-%s-%s%s%s', \str_split(\bin2hex($bytes), 4));
    }

    /** 가족 초대 코드 (예: `A3F9C2D1`) */
    public static function inviteCode(): string
    {
        return \strtoupper(\bin2hex(\random_bytes(4)));
    }

    /** 업로드 파일명 등에 쓰는 임의 슬러그 */
    public static function slug(int $bytes = 16): string
    {
        return \bin2hex(\random_bytes($bytes));
    }
}
