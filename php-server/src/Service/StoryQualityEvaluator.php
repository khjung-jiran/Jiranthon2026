<?php

declare(strict_types=1);

namespace Eum\Service;

use Eum\Domain\Era;

/**
 * 스토리 품질을 평가하여 부족한 시기를 찾아낸다.
 *
 * 꼬리 질문을 생성할지 결정하는 기준을 제공한다.
 * - 답변 수가 충분한가 (MIN_ANSWERS 이상)
 * - 스토리 본문이 충분한가 (MIN_BODY_LENGTH 자 이상)
 * - LLM으로 생성되었는가 (폴백이 아닌가)
 */
final class StoryQualityEvaluator
{
    /** 시기별 최소 답변 수 */
    public const MIN_ANSWERS = 3;

    /** 스토리 본문 최소 길이 (자) */
    public const MIN_BODY_LENGTH = 200;

    /** 시기당 최대 꼬리 질문 라운드 */
    public const MAX_FOLLOW_UP_ROUNDS = 3;

    /** 꼬리 질문 라운드당 생성 질문 수 */
    public const FOLLOW_UP_COUNT = 2;

    /**
     * @param list<array{question: string, answer: string}> $items
     * @param array<string, mixed>|null                      $story
     */
    public function isSufficient(Era $era, array $items, ?array $story): bool
    {
        if (\count($items) < self::MIN_ANSWERS) {
            return false;
        }

        if ($story === null) {
            return false;
        }

        $body = \trim((string) ($story['body'] ?? ''));

        return \mb_strlen($body) >= self::MIN_BODY_LENGTH;
    }

    /**
     * 부족한 시기와 그 시기의 대표 질문 ID를 반환한다.
     *
     * @param array<string, list<array{question: string, answer: string}>> $grouped
     * @param array<string, array<string, mixed>>                          $stored
     * @param array<string, string>                                        $representativeQuestionIds era->value => question_id
     * @return list<array{era: Era, question_id: string}>
     */
    public function findDeficientEras(array $grouped, array $stored, array $representativeQuestionIds): array
    {
        $deficient = [];

        foreach (Era::chronological() as $era) {
            $items = $grouped[$era->value] ?? [];

            if ($items === []) {
                continue;
            }

            if ($this->isSufficient($era, $items, $stored[$era->value] ?? null)) {
                continue;
            }

            $questionId = $representativeQuestionIds[$era->value] ?? null;

            if ($questionId === null) {
                continue;
            }

            $deficient[] = ['era' => $era, 'question_id' => $questionId];
        }

        return $deficient;
    }
}
