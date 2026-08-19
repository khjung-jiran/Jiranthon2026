<?php

declare(strict_types=1);

namespace Eum\Exception;

final class ValidationException extends HttpException
{
    public function __construct(string $message)
    {
        parent::__construct($message, 400);
    }

    /** 필수 필드 누락 */
    public static function missing(string ...$fields): self
    {
        return new self(\implode(', ', $fields) . '가 필요합니다');
    }
}
