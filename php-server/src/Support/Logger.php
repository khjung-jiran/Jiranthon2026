<?php

declare(strict_types=1);

namespace Eum\Support;

/**
 * 일자별 파일에 기록하는 최소 로거.
 *
 * 정적 전역이 아니라 주입 가능한 인스턴스다. 덕분에 테스트에서
 * 임시 디렉토리로 갈아끼울 수 있고, 로그 경로가 한 곳에서 결정된다.
 */
class Logger
{
    private bool $directoryReady = false;

    public function __construct(
        private readonly string $directory,
        private readonly Clock $clock = new Clock(),
    ) {
    }

    public static function default(): self
    {
        return new self(Paths::logs());
    }

    public function info(string $message): void
    {
        $this->write('INFO', $message);
    }

    public function warning(string $message): void
    {
        $this->write('WARNING', $message);
    }

    public function error(string $message): void
    {
        $this->write('ERROR', $message);
    }

    private function write(string $level, string $message): void
    {
        if (!$this->directoryReady) {
            Paths::ensureDirectory($this->directory);
            $this->directoryReady = true;
        }

        $at = $this->clock->at();
        $file = \sprintf('%s/server_%s.log', $this->directory, $at->format('Y-m-d'));
        $line = \sprintf("[%s] [%s] %s%s", $at->format(Clock::TIMESTAMP_FORMAT), $level, $message, \PHP_EOL);

        @\file_put_contents($file, $line, \FILE_APPEND | \LOCK_EX);
    }
}
