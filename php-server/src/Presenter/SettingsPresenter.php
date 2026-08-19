<?php

declare(strict_types=1);

namespace Eum\Presenter;

final class SettingsPresenter
{
    /**
     * @param  array<string, mixed> $row
     * @return array<string, mixed>
     */
    public static function one(array $row): array
    {
        return [
            'member_id' => $row['member_id'],
            'font_size' => $row['font_size'],
            'voice_guide' => (bool) $row['voice_guide'],
            'auto_translate' => (bool) $row['auto_translate'],
        ];
    }
}
