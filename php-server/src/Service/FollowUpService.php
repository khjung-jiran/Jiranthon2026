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
 * 답변이 도착한 시기에서 가장 최근 답변의 질문을 부모로 삼아, 그 답변
 * 내용을 파고드는 후속 질문을 만든다. LLM 을 쓸 수 없으면 시기별 질문
 * 라이브러리에서 뽑는다. 이미 출제된 질문은 중복을 피한다.
 */
final class FollowUpService
{
    public function __construct(
        private readonly QuestionRepository $questions,
        private readonly ResponseRepository $responses,
        private readonly StoryQualityEvaluator $evaluator,
        private readonly FollowUpQuestionGenerator $generator,
        private readonly Logger $logger,
    ) {
    }

    /**
     * 부족한 시기들에 대해 꼬리 질문을 생성한다.
     *
     * @param list<array{era: Era, question_id: string, response_id: string}> $deficient
     * @return int 생성된 꼬리 질문 총 수
     */
    public function generateForDeficientEras(string $familyId, string $toMemberId, array $deficient): int
    {
        $total = 0;

        foreach ($deficient as $item) {
            $era = $item['era'];
            $parentQuestionId = $item['question_id'];
            $parentResponseId = ($item['response_id'] ?? '') !== '' ? $item['response_id'] : null;

            $existing = $this->questions->countFollowUps($parentQuestionId);

            if ($existing >= StoryQualityEvaluator::MAX_FOLLOW_UP_ROUNDS) {
                $this->logger->info(
                    "꼬리 질문 한도 도달: {$era->value} / 부모={$parentQuestionId} / {$existing}회"
                );
                continue;
            }

            $contents = $this->buildFollowUpContents(
                $familyId,
                $era,
                $parentQuestionId,
                $parentResponseId,
            );

            if ($contents === []) {
                continue;
            }

            $created = $this->questions->createFollowUps(
                $familyId,
                $toMemberId,
                $contents,
                $parentQuestionId,
                $parentResponseId,
            );

            $total += $created;

            $this->logger->info(
                "꼬리 질문 생성: 가족={$familyId} / 시기={$era->value} / {$created}개 / 부모={$parentQuestionId}"
            );
        }

        return $total;
    }

    /**
     * 꼬리 질문 후보를 만든다.
     *
     * 근거 답변을 LLM 에 넘겨 그 이야기를 파고드는 질문을 우선 시도하고,
     * 실패하면 시기별 질문 라이브러리로 내려간다.
     *
     * @return list<string>
     */
    private function buildFollowUpContents(
        string $familyId,
        Era $era,
        string $parentQuestionId,
        ?string $parentResponseId,
    ): array {
        $exclude = $this->questions->existingContents($familyId);
        $answer = $this->findAnswerText($parentQuestionId, $parentResponseId);

        if ($answer !== null) {
            $question = (string) ($this->questions->find($parentQuestionId)['content'] ?? '');

            $generated = $this->generator->generate(
                $era,
                $question,
                $answer,
                StoryQualityEvaluator::FOLLOW_UP_COUNT,
                $exclude,
            );

            if ($generated !== null && $generated !== []) {
                $this->logger->info(
                    '꼬리 질문 LLM 생성: ' . \count($generated) . "개 / 시기={$era->value}"
                );

                return $generated;
            }
        }

        $this->logger->info("꼬리 질문 라이브러리 폴백: 시기={$era->value}");

        return QuestionLibrary::pick(
            StoryQualityEvaluator::FOLLOW_UP_COUNT,
            $era,
            $exclude,
        );
    }

    /**
     * 근거 답변 본문을 찾는다.
     *
     * 답변 ID 가 있으면 그것을, 없으면 원 질문의 최신 답변을 쓴다.
     * 텍스트가 비어 있으면 STT 전사본으로 대체한다.
     */
    private function findAnswerText(string $parentQuestionId, ?string $parentResponseId): ?string
    {
        $row = $parentResponseId !== null
            ? $this->responses->find($parentResponseId)
            : null;

        if ($row === null) {
            $rows = $this->responses->search(questionId: $parentQuestionId);
            $row = $rows[0] ?? null;
        }

        if ($row === null) {
            return null;
        }

        $answer = \trim((string) ($row['content'] ?? ''));

        if ($answer === '') {
            $answer = \trim((string) ($row['transcript'] ?? ''));
        }

        return $answer !== '' ? $answer : null;
    }
}
