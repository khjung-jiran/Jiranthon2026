<?php

declare(strict_types=1);

namespace Eum\Service;

use Eum\Exception\HttpException;
use Eum\Support\Logger;
use Eum\Support\Paths;
use Eum\Support\Uuid;

/**
 * 외부 Python 모듈을 통한 음성 인식(STT)·합성(TTS).
 *
 * 스크립트 경로는 {@see Paths} 로 통일했다. 이전에는 컨트롤러마다
 * `dirname(__DIR__, 2)` 와 `dirname(__DIR__, 3)` 이 뒤섞여, `/api/stt/transcribe`
 * 는 존재하지 않는 경로를 보며 항상 500 을 반환했다.
 */
final class SpeechService
{
    private const STT_TIMEOUT = 120;
    private const TTS_TIMEOUT = 60;

    public function __construct(
        private readonly ProcessRunner $processes,
        private readonly Logger $logger,
    ) {
    }

    /**
     * 음성 파일을 텍스트로 변환한다. 실패 시 예외 대신 `null` 을 반환해서
     * 호출자가 답변 저장을 계속할 수 있게 한다.
     */
    public function transcribe(string $audioPath, string $engine = 'whisper', string $language = 'ko'): ?string
    {
        $script = Paths::sttScript();

        if (!\is_file($script)) {
            $this->logger->error("STT 스크립트를 찾을 수 없습니다: {$script}");

            return null;
        }

        if (!\is_file($audioPath)) {
            $this->logger->error("STT 대상 파일이 없습니다: {$audioPath}");

            return null;
        }

        $result = $this->processes->run([
            Paths::pythonBinary(), $script,
            '--file', $audioPath,
            '--engine', $engine,
            '--language', $language,
            '--json',
        ], self::STT_TIMEOUT);

        $text = $result->lastLineAsJson()['text'] ?? null;

        if (!\is_string($text) || \trim($text) === '') {
            $this->logger->error('STT 변환 실패: ' . ($result->stderr ?: '출력 없음'));

            return null;
        }

        return \trim($text);
    }

    /**
     * 실패를 클라이언트에게 알려야 하는 STT 엔드포인트용.
     */
    public function transcribeOrFail(string $audioPath, string $engine, string $language): string
    {
        if (!\is_file(Paths::sttScript())) {
            throw new HttpException('STT 모듈을 찾을 수 없습니다', 503);
        }

        $text = $this->transcribe($audioPath, $engine, $language);

        if ($text === null) {
            throw new HttpException('STT 변환에 실패했습니다', 502);
        }

        return $text;
    }

    /**
     * 텍스트를 음성으로 합성하고, 재생 가능한 URL 을 반환한다.
     */
    public function synthesize(string $text, string $language = 'ko'): string
    {
        $script = Paths::ttsScript();

        if (!\is_file($script)) {
            throw new HttpException('TTS 모듈을 찾을 수 없습니다', 503);
        }

        Paths::ensureDirectory(Paths::audioUploads());

        $filename = 'tts_' . Uuid::slug() . '.mp3';
        $outputPath = Paths::audioUploads() . '/' . $filename;

        $this->processes->run([
            Paths::pythonBinary(), $script,
            '--text', $text,
            '--output', $outputPath,
            '--language', $language,
        ], self::TTS_TIMEOUT);

        if (!\is_file($outputPath) || \filesize($outputPath) === 0) {
            $this->logger->error('TTS 합성 실패: ' . \mb_substr($text, 0, 50));

            throw new HttpException('TTS 변환에 실패했습니다', 502);
        }

        $this->logger->info("TTS 합성: {$filename} / " . \mb_substr($text, 0, 50));

        return "/api/audio/{$filename}";
    }
}
