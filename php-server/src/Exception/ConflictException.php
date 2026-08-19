<?php

declare(strict_types=1);

namespace Eum\Exception;

final class ConflictException extends HttpException
{
    public function __construct(string $message)
    {
        parent::__construct($message, 409);
    }
}
