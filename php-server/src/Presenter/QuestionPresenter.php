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
    /**
     * @param  array<string, mixed>  $row
     * @param  array<string, string> $memberNames id => name
     * @return array<string, mixed>
     */
    public static function one(array $row, array $memberNames = []): array
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
        ];
    }

    /**
     * @param  list<array<string, mixed>> $rows
     * @param  array<string, string>      $memberNames
     * @return list<array<string, mixed>>
     */
    public static function collection(array $rows, array $memberNames = []): array
    {
        return \array_map(
            static fn (array $row): array => self::one($row, $memberNames),
            $rows
        );
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
