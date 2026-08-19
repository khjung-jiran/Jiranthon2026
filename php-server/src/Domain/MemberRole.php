<?php

declare(strict_types=1);

namespace Eum\Domain;

enum MemberRole: string
{
    case Parent = 'parent';
    case Child = 'child';

    public function label(): string
    {
        return match ($this) {
            self::Parent => '부모',
            self::Child => '자녀',
        };
    }

    public function isParent(): bool
    {
        return $this === self::Parent;
    }

    public static function fromValue(?string $value, self $fallback = self::Child): self
    {
        return self::tryFrom((string) $value) ?? $fallback;
    }
}
