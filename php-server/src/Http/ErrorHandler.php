<?php

declare(strict_types=1);

namespace Eum\Http;

use Eum\Exception\HttpException;
use Eum\Support\Logger;
use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Exception\HttpMethodNotAllowedException;
use Slim\Exception\HttpNotFoundException;

/**
 * 예외를 JSON 응답으로 변환하는 단일 지점.
 *
 * 도메인 예외({@see HttpException})는 메시지를 그대로 노출한다 — 사용자에게
 * 보여주기 위해 쓴 문장이기 때문이다. 그 밖의 예외는 내부 정보가 새지 않도록
 * 로그에만 상세를 남기고 일반적인 메시지를 반환한다.
 */
final class ErrorHandler
{
    public function __construct(
        private readonly ResponseFactoryInterface $responseFactory,
        private readonly Logger $logger,
        private readonly bool $debug = false,
    ) {
    }

    public function __invoke(
        ServerRequestInterface $request,
        \Throwable $exception,
        bool $displayErrorDetails,
        bool $logErrors,
        bool $logErrorDetails,
    ): ResponseInterface {
        [$status, $message] = $this->interpret($exception);

        if ($status >= 500) {
            $this->logger->error(\sprintf(
                '%s %s → %s: %s @ %s:%d',
                $request->getMethod(),
                $request->getUri()->getPath(),
                $exception::class,
                $exception->getMessage(),
                $exception->getFile(),
                $exception->getLine(),
            ));
        }

        $payload = ['detail' => $message];

        if ($this->debug && $status >= 500) {
            $payload['exception'] = $exception::class;
            $payload['trace'] = \explode("\n", $exception->getTraceAsString());
        }

        return ApiResponse::json($this->responseFactory->createResponse(), $payload, $status);
    }

    /**
     * @return array{int, string}
     */
    private function interpret(\Throwable $exception): array
    {
        return match (true) {
            $exception instanceof HttpException => [
                $exception->statusCode(),
                $exception->getMessage(),
            ],
            $exception instanceof HttpNotFoundException => [
                404,
                '요청한 경로를 찾을 수 없습니다',
            ],
            $exception instanceof HttpMethodNotAllowedException => [
                405,
                '허용되지 않은 메서드입니다',
            ],
            // 예상하지 못한 오류. 내부 메시지는 디버그 모드에서만 노출한다.
            default => [
                500,
                $this->debug ? $exception->getMessage() : '서버 오류가 발생했습니다',
            ],
        };
    }
}
