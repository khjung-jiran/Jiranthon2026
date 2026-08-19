<?php

declare(strict_types=1);

namespace Eum\Http;

/**
 * 확장자 → MIME 타입 매핑.
 *
 * `mime_content_type()` 은 JS 를 `text/plain` 으로, 오디오를 엉뚱한 타입으로
 * 판정하는 일이 있어 브라우저가 파일을 거부한다. 확장자 기반 매핑을 우선한다.
 */
final class MimeTypes
{
    private const MAP = [
        // 웹 에셋
        'js' => 'application/javascript',
        'mjs' => 'application/javascript',
        'css' => 'text/css',
        'html' => 'text/html; charset=utf-8',
        'json' => 'application/json',
        'map' => 'application/json',
        'txt' => 'text/plain; charset=utf-8',
        // 이미지
        'svg' => 'image/svg+xml',
        'ico' => 'image/x-icon',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'webp' => 'image/webp',
        'heic' => 'image/heic',
        // 폰트
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf' => 'font/ttf',
        'otf' => 'font/otf',
        // 오디오
        'mp3' => 'audio/mpeg',
        'wav' => 'audio/wav',
        'm4a' => 'audio/mp4',
        'aac' => 'audio/aac',
        'ogg' => 'audio/ogg',
        'webm' => 'audio/webm',
        'flac' => 'audio/flac',
    ];

    public static function forPath(string $path, string $fallback = 'application/octet-stream'): string
    {
        $extension = \strtolower(\pathinfo($path, \PATHINFO_EXTENSION));

        if (isset(self::MAP[$extension])) {
            return self::MAP[$extension];
        }

        $detected = \is_file($path) ? @\mime_content_type($path) : false;

        return $detected !== false ? $detected : $fallback;
    }
}
