<?php

declare(strict_types=1);

namespace Eum\Exception;

final class UnauthorizedException extends HttpException
{
    public function __construct(string $message = '인증이 필요합니다')
    {
        parent::__construct($message, 401);
    }
}
