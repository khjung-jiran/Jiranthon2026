<?php

declare(strict_types=1);

namespace Eum\Service;

use Eum\Domain\Era;
use Eum\Domain\QuestionLibrary;
use Eum\Repository\QuestionRepository;
use Eum\Repository\ResponseRepository;
use Eum\Support\Logger;

/**
 * 스토리 품질이 부족한 시기에 꼬리 질문을 생성한다.
 *
 * 답변이 도착한 시기에서 가장 최근 답변의 질문을 부모로 삼아
 * 같은 시기 맥락의 후속 질문을 만든다. 이미 출제된 질문은 중복을 피한다.
 */
final class FollowUpService
{
    public function __construct(
        private readonly QuestionRepository $questions,
        private readonly ResponseRepository $responses,
        private readonly StoryQualityEvaluator $evaluator,
        private readonly Logger $logger,
    ) {
    }

    /**
     * 부족한 시기들에 대해 꼬리 질문을 생성한다.
     *
     * @param list<array{era: Era, question_id: string}> $deficient
     * @return int 생성된 꼬리 질문 총 수
     */
    public function generateForDeficientEras(string $familyId, string $toMemberId, array $deficient): int
    {
        $total = 0;

        foreach ($deficient as $item) {
            $era = $item['era'];
            $parentQuestionId = $item['question_id'];

            $existing = $this->questions->countFollowUps($parentQuestionId);

            if ($existing >= StoryQualityEvaluator::MAX_FOLLOW_UP_ROUNDS) {
                $this->logger->info(
                    "꼬리 질문 한도 도달: {$era->value} / 부모={$parentQuestionId} / {$existing}회"
                );
                continue;
            }

            $contents = $this->pickFollowUpContents($familyId, $era);

            if ($contents === []) {
                continue;
            }

            $created = $this->questions->createFollowUps(
                $familyId,
                $toMemberId,
                $contents,
                $parentQuestionId,
            );

            $total += $created;

            $this->logger->info(
                "꼬리 질문 생성: 가족={$familyId} / 시기={$era->value} / {$created}개 / 부모={$parentQuestionId}"
            );
        }

        return $total;
    }

    /**
     * 해당 시기의 미사용 질문을 우선으로 꼬리 질문 후보를 뽑는다.
     *
     * @return list<string>
     */
    private function pickFollowUpContents(string $familyId, Era $era): array
    {
        $exclude = $this->questions->existingContents($familyId);

        $picked = QuestionLibrary::pick(
            StoryQualityEvaluator::FOLLOW_UP_COUNT,
            $era,
            $exclude,
        );

        return $picked;
    }
}
