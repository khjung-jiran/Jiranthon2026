<?php

declare(strict_types=1);

namespace Eum\Service;

use Eum\Domain\Era;
use Eum\Repository\MemberRepository;
use Eum\Repository\ResponseRepository;
use Eum\Repository\StoryRepository;
use Eum\Support\Logger;
use Eum\Support\Paths;

/**
 * 일대기(스토리북) 조립.
 *
 * 읽기 요청은 저장된 스토리를 즉시 반환하고, 새 답변이 쌓였으면
 * 백그라운드 생성을 예약한다. LLM 호출은 수십 초가 걸리므로
 * 사용자 요청을 붙잡아 두지 않는다.
 */
final class StorybookService
{
    public function __construct(
        private readonly ResponseRepository $responses,
        private readonly StoryRepository $stories,
        private readonly StoryGenerator $generator,
        private readonly EraClassifier $classifier,
        private readonly ProcessRunner $processes,
        private readonly Logger $logger,
        private readonly MemberRepository $members,
        private readonly StoryQualityEvaluator $qualityEvaluator,
        private readonly FollowUpService $followUp,
        private readonly NotificationService $notificationService,
    ) {
    }

    /**
     * 현재 일대기를 반환한다. 갱신이 필요하면 백그라운드 생성을 띄운다.
     *
     * @return list<array<string, mixed>>
     */
    public function read(string $familyId): array
    {
        $grouped = $this->groupAnswersByEra($familyId);
        $stored = $this->stories->mapByEra($familyId);

        if ($this->needsRegeneration($grouped, $stored)) {
            $this->spawnBackgroundGeneration($familyId);
        }

        $chapters = [];

        foreach (Era::chronological() as $era) {
            $items = $grouped[$era->value] ?? [];
            $story = $stored[$era->value] ?? null;

            // 답변도 없고 저장된 스토리도 없으면 챕터를 만들지 않는다.
            if ($items === [] && $story === null) {
                continue;
            }

            $chapters[] = $this->presentChapter($era, $items, $story);
        }

        return $chapters;
    }

    /**
     * 갱신이 필요한 시기를 지금 바로 생성한다 (동기).
     *
     * @return list<array<string, mixed>>
     */
    public function regenerate(string $familyId): array
    {
        $grouped = $this->groupAnswersByEra($familyId);
        $stored = $this->stories->mapByEra($familyId);
        $chapters = [];
        $newStoryTitles = [];

        foreach (Era::chronological() as $era) {
            $items = $grouped[$era->value] ?? [];

            if ($items === []) {
                continue;
            }

            $story = $stored[$era->value] ?? null;

            if ($this->isStale($items, $story)) {
                $draft = $this->generator->generate($era, $items);

                if (!$draft->isEmpty()) {
                    $this->stories->save($familyId, $era, $draft->title, $draft->body, \count($items));
                    $this->logger->info("스토리 생성: 가족={$familyId} / {$era->value} / " . \count($items) . '개 답변');
                    $newStoryTitles[] = $draft->title;
                }

                $story = $this->stories->findByEra($familyId, $era);
            }

            $chapters[] = $this->presentChapter($era, $items, $story);
        }

        // 스토리 본문이 1500자 미만인 시기에 꼬리 질문 자동 생성
        $this->generateFollowUpsIfNeeded($familyId, $grouped, $stored);

        // 새 스토리가 생성되었으면 가족 전원에게 푸시
        if ($newStoryTitles !== []) {
            $this->notifyStoryCreated($familyId, $newStoryTitles);
        }

        return $chapters;
    }

    /**
     * 새 스토리 생성 완료 시 가족 전원에게 푸시 알림.
     *
     * @param list<string> $titles
     */
    private function notifyStoryCreated(string $familyId, array $titles): void
    {
        $familyMembers = $this->members->listByFamily($familyId);
        $titleText = \implode(', ', $titles);

        foreach ($familyMembers as $member) {
            $this->notificationService->notify(
                memberId: (string) $member['id'],
                type: 'storybook',
                title: '새 이야기가 완성됐어요',
                body: $titleText,
                navTarget: '/story-child',
                familyId: $familyId,
            );
        }
    }

    /**
     * 부족한 시기를 찾아 꼬리 질문을 생성한다.
     *
     * @param array<string, list<array{question: string, answer: string, question_id: string, response_id: string}>> $grouped
     * @param array<string, array<string, mixed>>                                                                    $stored
     */
    private function generateFollowUpsIfNeeded(string $familyId, array $grouped, array $stored): void
    {
        // 각 시기의 대표 답변 (가장 최근 답변) — 꼬리 질문의 근거가 된다.
        $representatives = [];
        foreach ($grouped as $eraValue => $items) {
            $last = end($items);
            if ($last !== false) {
                $representatives[$eraValue] = [
                    'question_id' => $last['question_id'],
                    'response_id' => $last['response_id'],
                ];
            }
        }

        $deficient = $this->qualityEvaluator->findDeficientEras($grouped, $stored, $representatives);

        if ($deficient === []) {
            return;
        }

        // 부모 멤버를 찾아 꼬리 질문을 보낸다
        $parent = $this->members->findParentByFamily($familyId);

        if ($parent === null) {
            $this->logger->warning("꼬리 질문 생성 실패: 부모 멤버 없음 / 가족={$familyId}");
            return;
        }

        $created = $this->followUp->generateForDeficientEras(
            $familyId,
            (string) $parent['id'],
            $deficient,
        );

        if ($created > 0) {
            $this->logger->info("꼬리 질문 총 {$created}개 생성: 가족={$familyId}");
        }
    }

    /**
     * 답변을 시기별로 묶는다.
     *
     * 질문에 시기가 지정되지 않은 답변은 이 자리에서 분류한다 —
     * 표시를 위한 임시 분류이며 DB 를 수정하지는 않는다.
     *
     * @return array<string, list<array{question: string, answer: string, question_id: string, response_id: string}>>
     */
    private function groupAnswersByEra(string $familyId): array
    {
        $grouped = [];

        foreach ($this->responses->answeredPairsForFamily($familyId) as $row) {
            $question = (string) $row['question'];
            $answer = \trim((string) ($row['answer'] ?: $row['transcript'] ?: ''));

            if ($answer === '') {
                continue;
            }

            $era = Era::tryFromValue($row['era'] ?? null);

            if ($era === null) {
                // DB에 era가 없으면 LLM으로 분류한 뒤 캐싱 — 다음 요청부터는 LLM 호출을 건너뛴다.
                $era = $this->classifier->classify($question, $answer);
                $this->responses->updateEra((string) $row['response_id'], $era->value);
            }

            $grouped[$era->value][] = [
                'question' => $question,
                'answer' => $answer,
                'question_id' => (string) $row['question_id'],
                'response_id' => (string) $row['response_id'],
            ];
        }

        return $grouped;
    }

    /**
     * 저장된 스토리가 최신 답변 수를 반영하지 못하면 오래된 것으로 본다.
     *
     * @param list<array{question: string, answer: string}> $items
     * @param array<string, mixed>|null                     $story
     */
    private function isStale(array $items, ?array $story): bool
    {
        if ($story === null) {
            return true;
        }

        return \count($items) > (int) $story['response_count'];
    }

    /**
     * @param array<string, list<array{question: string, answer: string}>> $grouped
     * @param array<string, array<string, mixed>>                          $stored
     */
    private function needsRegeneration(array $grouped, array $stored): bool
    {
        foreach (Era::chronological() as $era) {
            $items = $grouped[$era->value] ?? [];

            if ($items !== [] && $this->isStale($items, $stored[$era->value] ?? null)) {
                return true;
            }
        }

        return false;
    }

    /**
     * 챕터 하나를 표현한다.
     *
     * 오래된 스토리는 본문을 비워 보낸다. 프론트엔드가 이를 "생성 중" 상태로
     * 표시하며, 새 답변이 반영되지 않은 낡은 글을 최신인 척 보여주지 않는다.
     *
     * @param  list<array{question: string, answer: string}> $items
     * @param  array<string, mixed>|null                     $story
     * @return array<string, mixed>
     */
    private function presentChapter(Era $era, array $items, ?array $story): array
    {
        $isStale = $this->isStale($items, $story);
        $body = $isStale ? '' : (string) $story['body'];

        return [
            'category' => $era->value,
            'label' => $era->label(),
            'title' => $isStale ? $era->defaultTitle() : (string) $story['title'],
            'body' => $body,
            'count' => $isStale ? 0 : (int) $story['response_count'],
            'answer_count' => \count($items),
            'has_new' => $isStale,
            // 진행률 표시용 — 설정된 목표 글자수 대비 현재 본문 길이
            'body_length' => \mb_strlen($body),
            'target_length' => StoryQualityEvaluator::MIN_BODY_LENGTH,
        ];
    }

    /**
     * 스토리 생성 워커를 분리 실행한다.
     */
    private function spawnBackgroundGeneration(string $familyId): void
    {
        $worker = Paths::storyWorker();

        if (!\is_file($worker)) {
            $this->logger->warning("스토리 생성 워커를 찾을 수 없습니다: {$worker}");

            return;
        }

        $this->processes->runDetached(
            [\PHP_BINARY, $worker, $familyId],
            \sys_get_temp_dir() . '/eum_story_worker.log'
        );
    }
}
