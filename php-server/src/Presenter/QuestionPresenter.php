<?php

declare(strict_types=1);

namespace Eum\Presenter;

use Eum\Domain\Era;

/**
 * 질문 직렬화.
 *
 * 보낸/받는 사람 이름은 미리 조회한 맵에서 가져온다. 이전 구현은 행마다
 * 멤버 SELECT 를 두 번씩 실행해서, 질문 9개 목록에 쿼리가 19번 나갔다.
 */
final class QuestionPresenter
{
    /** 근거 답변 미리보기 길이 (자) */
    private const ORIGIN_PREVIEW_LENGTH = 80;

    /**
     * @param  array<string, mixed>                    $row
     * @param  array<string, string>                   $memberNames id => name
     * @param  array<string, array<string, mixed>>     $origins     꼬리 질문 ID => 생성 근거
     * @return array<string, mixed>
     */
    public static function one(array $row, array $memberNames = [], array $origins = []): array
    {
        $era = Era::tryFromValue($row['category'] ?? null);

        return [
            'id' => $row['id'],
            'family_id' => $row['family_id'],
            'content' => $row['content'],
            'category' => $row['category'],
            'category_label' => $era?->label(),
            'source' => $row['source'],
            'from_member_id' => $row['from_member_id'],
            'from_member_name' => ($row['from_member_id'] !== null)
                ? ($memberNames[$row['from_member_id']] ?? null)
                : null,
            'to_member_id' => $row['to_member_id'],
            'to_member_name' => ($row['to_member_id'] !== null)
                ? ($memberNames[$row['to_member_id']] ?? null)
                : null,
            'status' => $row['status'],
            'created_at' => $row['created_at'],
            'parent_question_id' => $row['parent_question_id'] ?? null,
            'parent_response_id' => $row['parent_response_id'] ?? null,
            'origin' => self::origin($row, $origins),
        ];
    }

    /**
     * 꼬리 질문이 어느 답변에서 나왔는지 정리한다. 근거가 없으면 `null`.
     *
     * @param  array<string, mixed>                $row
     * @param  array<string, array<string, mixed>> $origins
     * @return array<string, mixed>|null
     */
    private static function origin(array $row, array $origins): ?array
    {
        $found = $origins[(string) $row['id']] ?? null;

        if ($found === null) {
            return null;
        }

        $answer = \trim((string) ($found['answer'] ?? ''));

        return [
            'question_id' => $found['question_id'] ?? null,
            'question_content' => $found['question_content'] ?? null,
            'response_id' => $found['response_id'] ?? null,
            'answer' => $answer !== '' ? $answer : null,
            'answer_preview' => $answer !== '' ? self::preview($answer) : null,
            'answered_at' => $found['answered_at'] ?? null,
        ];
    }

    /** 답변 앞부분만 잘라 한 줄로 만든다. */
    private static function preview(string $answer): string
    {
        $oneLine = (string) \preg_replace('/\s+/u', ' ', $answer);

        return \mb_strlen($oneLine) > self::ORIGIN_PREVIEW_LENGTH
            ? \mb_substr($oneLine, 0, self::ORIGIN_PREVIEW_LENGTH) . '…'
            : $oneLine;
    }

    /**
     * @param  list<array<string, mixed>>          $rows
     * @param  array<string, string>               $memberNames
     * @param  array<string, array<string, mixed>> $origins
     * @return list<array<string, mixed>>
     */
    public static function collection(array $rows, array $memberNames = [], array $origins = []): array
    {
        return \array_map(
            static fn (array $row): array => self::one($row, $memberNames, $origins),
            $rows
        );
    }

    /**
     * 근거 조회가 필요한 꼬리 질문 ID 를 모아준다.
     *
     * @param  list<array<string, mixed>> $rows
     * @return list<string>
     */
    public static function followUpIdsIn(array $rows): array
    {
        $ids = [];

        foreach ($rows as $row) {
            if (!empty($row['parent_question_id'])) {
                $ids[] = (string) $row['id'];
            }
        }

        return $ids;
    }

    /**
     * 이름 조회가 필요한 멤버 ID 를 모아준다.
     *
     * @param  list<array<string, mixed>> $rows
     * @return list<string>
     */
    public static function memberIdsIn(array $rows): array
    {
        $ids = [];

        foreach ($rows as $row) {
            foreach (['from_member_id', 'to_member_id'] as $key) {
                if (!empty($row[$key])) {
                    $ids[] = (string) $row[$key];
                }
            }
        }

        return $ids;
    }
}
