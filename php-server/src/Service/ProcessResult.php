<?php

declare(strict_types=1);

namespace Eum\Service;

/**
 * 외부 프로세스 실행 결과.
 */
final class ProcessResult
{
    public function __construct(
        public readonly int $exitCode,
        public readonly string $stdout,
        public readonly string $stderr,
        public readonly bool $successful,
    ) {
    }

    /**
     * 마지막 출력 줄을 JSON 으로 파싱한다.
     *
     * Python 스크립트가 진행 로그를 먼저 찍고 마지막 줄에 JSON 을 내보내는
     * 관례를 따른다.
     *
     * @return array<string, mixed>|null
     */
    public function lastLineAsJson(): ?array
    {
        if ($this->stdout === '') {
            return null;
        }

        $lines = \array_filter(
            \array_map('trim', \explode("\n", $this->stdout)),
            static fn (string $line): bool => $line !== ''
        );

        if ($lines === []) {
            return null;
        }

        $decoded = \json_decode((string) \end($lines), true);

        return \is_array($decoded) ? $decoded : null;
    }
}
