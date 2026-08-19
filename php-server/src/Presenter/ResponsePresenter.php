<?php

declare(strict_types=1);

namespace Eum\Presenter;

final class ResponsePresenter
{
    /**
     * @param  array<string, mixed> $row
     * @return array<string, mixed>
     */
    public static function one(array $row): array
    {
        $payload = [
            'id' => $row['id'],
            'question_id' => $row['question_id'],
            'member_id' => $row['member_id'],
            'content' => $row['content'],
            'input_method' => $row['input_method'],
            'audio_file_path' => $row['audio_file_path'],
            'transcript' => $row['transcript'],
            'era' => $row['era'],
            'duration' => $row['duration'],
            'created_at' => $row['created_at'],
        ];

        // 조인 조회에서만 존재하는 필드는 있을 때만 덧붙인다.
        foreach (['question_content', 'question_category', 'question_from_member_id'] as $key) {
            if (\array_key_exists($key, $row)) {
                $payload[$key] = $row[$key];
            }
        }

        return $payload;
    }

    /**
     * @param  list<array<string, mixed>> $rows
     * @return list<array<string, mixed>>
     */
    public static function collection(array $rows): array
    {
        return \array_map(self::one(...), $rows);
    }
}
