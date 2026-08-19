<?php

declare(strict_types=1);

namespace Eum\Service;

use Eum\Support\Logger;

/**
 * 외부 프로세스 실행.
 *
 * 기존 코드는 `shell_exec` 에 문자열을 이어 붙였다. 두 가지 문제가 있었다.
 *  1. 셸을 거치므로 인자 이스케이프에 계속 의존해야 한다.
 *  2. 타임아웃이 없다 — LLM 이 멈추면 웹 요청이 영원히 매달린다.
 *
 * 여기서는 셸 없이 인자 배열로 실행하고, 시간 제한을 강제한다.
 */
final class ProcessRunner
{
    public function __construct(private readonly Logger $logger)
    {
    }

    /**
     * 프로세스를 실행하고 결과를 반환한다.
     *
     * @param list<string> $command 실행 파일과 인자
     */
    public function run(array $command, int $timeoutSeconds = 60): ProcessResult
    {
        $descriptors = [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ];

        // 인자 배열을 넘기면 셸을 거치지 않는다 (인젝션 원천 차단).
        $process = @\proc_open($command, $descriptors, $pipes);

        if (!\is_resource($process)) {
            $this->logger->error('프로세스 실행 실패: ' . $command[0]);

            return new ProcessResult(-1, '', '프로세스를 시작할 수 없습니다', false);
        }

        \fclose($pipes[0]);
        \stream_set_blocking($pipes[1], false);
        \stream_set_blocking($pipes[2], false);

        $stdout = '';
        $stderr = '';
        $deadline = \microtime(true) + $timeoutSeconds;
        $timedOut = false;

        while (true) {
            $stdout .= (string) \stream_get_contents($pipes[1]);
            $stderr .= (string) \stream_get_contents($pipes[2]);

            $status = \proc_get_status($process);
            if (!$status['running']) {
                break;
            }

            if (\microtime(true) > $deadline) {
                $timedOut = true;
                // 9 = SIGKILL. 상수는 pcntl 확장이 있어야 정의되므로 숫자를 쓴다.
                \proc_terminate($process, 9);
                $this->logger->warning(
                    \sprintf('프로세스 타임아웃 (%d초): %s', $timeoutSeconds, $command[0])
                );
                break;
            }

            \usleep(20_000);
        }

        // 종료 후 파이프에 남은 내용을 회수한다.
        $stdout .= (string) \stream_get_contents($pipes[1]);
        $stderr .= (string) \stream_get_contents($pipes[2]);

        \fclose($pipes[1]);
        \fclose($pipes[2]);
        $exitCode = \proc_close($process);

        return new ProcessResult($exitCode, \trim($stdout), \trim($stderr), !$timedOut && $exitCode === 0);
    }

    /**
     * 프로세스를 띄우고 기다리지 않는다. 백그라운드 작업용.
     *
     * @param list<string> $command
     */
    public function runDetached(array $command, string $logFile): void
    {
        $quoted = \implode(' ', \array_map('escapeshellarg', $command));
        $redirect = '> ' . \escapeshellarg($logFile) . ' 2>&1 &';

        @\exec($quoted . ' ' . $redirect);
    }
}
