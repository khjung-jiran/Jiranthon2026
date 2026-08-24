<?php

declare(strict_types=1);

namespace Eum\Support;

/**
 * 파일시스템 경로의 단일 진실 공급원.
 *
 * 이전에는 `dirname(__DIR__, 2)` 와 `dirname(__DIR__, 3)` 가 파일마다 뒤섞여
 * 업로드 디렉토리·STT 스크립트·venv 경로가 서로 다른 곳을 가리키는 버그가 있었다.
 * 모든 경로는 반드시 이 클래스를 거친다.
 */
final class Paths
{
    /** php-server/ 디렉토리 */
    public static function server(): string
    {
        return \dirname(__DIR__, 2);
    }

    /** 저장소 루트 (php-server 의 부모). python 모듈과 uploads 가 여기 있다. */
    public static function project(): string
    {
        return \dirname(__DIR__, 3);
    }

    // ── 애플리케이션 자원 ──

    public static function database(): string
    {
        return self::project() . '/eum.db';
    }

    public static function schema(): string
    {
        return self::server() . '/migrations/schema.sql';
    }

    /** Firebase 서비스 계정 키 (FCM 푸시 전송용). config/ 아래에 배치. */
    public static function firebaseServiceAccount(): string
    {
        return self::server() . '/config/firebase-service-account.json';
    }

    /** 카카오 로그인 설정 (REST API 키 등). config/ 아래에 배치. */
    public static function kakaoConfig(): string
    {
        return self::server() . '/config/kakao.json';
    }

    public static function templates(): string
    {
        return self::server() . '/templates';
    }

    public static function twigCache(): string
    {
        return self::server() . '/cache/twig';
    }

    public static function logs(): string
    {
        return self::project() . '/logs';
    }

    // ── 업로드 ──

    public static function uploads(): string
    {
        return self::project() . '/uploads';
    }

    public static function audioUploads(): string
    {
        return self::uploads() . '/audio';
    }

    public static function imageUploads(): string
    {
        return self::uploads() . '/images';
    }

    // ── 외부 Python 모듈 ──

    public static function sttScript(): string
    {
        return self::project() . '/stt/file_transcribe.py';
    }

    public static function ttsScript(): string
    {
        return self::project() . '/tts/tts_engine.py';
    }

    public static function llmScript(): string
    {
        return self::project() . '/question-engine/local_llm.py';
    }

    /** 백그라운드 스토리 생성 워커 */
    public static function storyWorker(): string
    {
        return self::server() . '/bin/generate_stories.php';
    }

    /**
     * venv 인터프리터가 있으면 그것을, 없으면 시스템 python3 를 반환.
     */
    public static function pythonBinary(): string
    {
        $venv = self::project() . '/.venv/bin/python';

        return \is_file($venv) ? $venv : 'python3';
    }

    /**
     * 디렉토리를 보장 생성한다. 이미 있으면 아무 일도 하지 않는다.
     */
    public static function ensureDirectory(string $path): void
    {
        if (!\is_dir($path)) {
            @\mkdir($path, 0775, true);
        }
    }
}
