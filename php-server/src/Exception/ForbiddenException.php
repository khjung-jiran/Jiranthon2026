<?php

declare(strict_types=1);

namespace Eum\Exception;

final class ForbiddenException extends HttpException
{
    public function __construct(string $message = '권한이 없습니다')
    {
        parent::__construct($message, 403);
    }
}
