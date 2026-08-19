<?php

declare(strict_types=1);

namespace Eum\Service;

/**
 * 생성된 스토리 한 편 (제목 + 본문).
 */
final class StoryDraft
{
    public function __construct(
        public readonly string $title,
        public readonly string $body,
    ) {
    }

    public function isEmpty(): bool
    {
        return \trim($this->body) === '';
    }
}
