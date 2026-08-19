<?php

declare(strict_types=1);

namespace Eum\Exception;

/**
 * 클라이언트에게 그대로 보여줘도 안전한 메시지를 담은 예외.
 *
 * 컨트롤러는 이 예외를 던지기만 하고, {@see \Eum\Http\ErrorHandler} 가
 * 단일 지점에서 JSON 응답으로 변환한다.
 */
class HttpException extends \RuntimeException
{
    public function __construct(
        string $message,
        private readonly int $statusCode = 400,
    ) {
        parent::__construct($message, $statusCode);
    }

    public function statusCode(): int
    {
        return $this->statusCode;
    }
}
