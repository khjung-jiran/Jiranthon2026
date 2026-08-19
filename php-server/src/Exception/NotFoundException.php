<?php

declare(strict_types=1);

namespace Eum\Exception;

final class NotFoundException extends HttpException
{
    public function __construct(string $message = '요청한 자원을 찾을 수 없습니다')
    {
        parent::__construct($message, 404);
    }

    /** `가족을 찾을 수 없습니다` 처럼 도메인 이름을 붙여 생성한다. */
    public static function of(string $subject): self
    {
        return new self("{$subject}을 찾을 수 없습니다");
    }
}
