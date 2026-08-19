<?php

declare(strict_types=1);

namespace Eum\Domain;

enum InputMethod: string
{
    case Text = 'text';
    case Voice = 'voice';

    public static function fromValue(?string $value): self
    {
        return self::tryFrom((string) $value) ?? self::Text;
    }
}
