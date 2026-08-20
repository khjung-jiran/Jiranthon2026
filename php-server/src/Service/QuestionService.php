<?php

declare(strict_types=1);

namespace Eum\Service;

use Eum\Domain\Era;
use Eum\Domain\InputMethod;
use Eum\Domain\QuestionLibrary;
use Eum\Repository\QuestionRepository;
use Eum\Repository\ResponseRepository;
use Eum\Support\Logger;

final class QuestionService
{
    /** 부모 가입 시 자동 생성하는 질문 수 */
    private const SEED_COUNT = 9;

    public function __construct(
        private readonly QuestionRepository $questions,
        private readonly ResponseRepository $responses,
        private readonly EraClassifier $classifier,
        private readonly SpeechService $speech,
        private readonly Logger $logger,
    ) {
    }

    /**
     * 부모 멤버에게 기본 질문을 채워 넣는다.
     *
     * @return int 생성된 질문 수
     */
    public function seedDefaults(string $familyId, string $parentMemberId): int
    {
        $existing = $this->questions->existingContents($familyId);
        $picked = QuestionLibrary::pick(self::SEED_COUNT, exclude: $existing);
        $created = $this->questions->createMany($familyId, $parentMemberId, $picked);

        $this->logger->info(
            "기본 질문 생성: 가족={$familyId} / 부모={$parentMemberId} / {$created}개"
        );

        return $created;
    }

    /**
     * 가족에 질문이 없을 때만 기본 질문을 채워 넣는다 (중복 방지).
     *
     * @return int 생성된 질문 수
     */
    public function seedDefaultsIfEmpty(string $familyId, string $parentMemberId): int
    {
        $existing = $this->questions->existingContents($familyId);

        if (\count($existing) > 0) {
            $this->logger->info(
                "기본 질문 스킵: 가족={$familyId} / 이미 " . \count($existing) . "개 질문 존재"
            );
            return 0;
        }

        return $this->seedDefaults($familyId, $parentMemberId);
    }

    /**
     * 보낼 질문 후보를 제안한다. 이미 출제된 질문은 제외한다.
     *
     * @return list<array<string, mixed>>
     */
    public function suggest(
        int $count,
        ?Era $era,
        ?string $familyId,
        string $fromMemberId,
        string $toMemberId,
    ): array {
        $picked = QuestionLibrary::pick(
            $count,
            $era,
            $this->questions->existingContents($familyId)
        );

        return \array_map(
            static fn (string $content): array => [
                'content' => $content,
                // 시기는 답변을 받은 뒤에 정해진다.
                'category' => null,
                'source' => 'auto',
                'from_member_id' => $fromMemberId,
                'to_member_id' => $toMemberId,
            ],
            $picked
        );
    }

    /**
     * 답변을 기록한다.
     *
     * 음성만 도착하고 텍스트가 없으면 서버에서 STT 를 시도한다. 성공하든
     * 실패하든 답변 자체는 저장한다 — 녹음을 잃는 것이 최악이다.
     *
     * @return array<string, mixed> 저장된 답변 행
     */
    public function recordAnswer(
        string $questionId,
        string $memberId,
        string $content,
        InputMethod $inputMethod,
        ?string $audioFilePath,
        ?string $transcript,
        ?string $era,
        ?string $duration,
    ): array {
        if ($content === '' && $audioFilePath !== null) {
            $transcribed = $this->speech->transcribe($audioFilePath);

            if ($transcribed !== null && \trim($transcribed) !== '') {
                $content = $transcribed;
                $transcript ??= $transcribed;
                $this->logger->info('서버 STT 완료: ' . \mb_substr($transcribed, 0, 50));
            } else {
                // 서버 STT 실패: 클라이언트가 보낸 transcript 가 있으면 그것을 답변으로 쓴다.
                // 클라이언트 transcript 도 없으면 placeholder.
                $content = ($transcript !== null && \trim($transcript) !== '')
                    ? $transcript
                    : '음성 답변이 전달되었어요.';
                $transcript ??= $content;
            }
        }

        $responseId = $this->responses->create(
            $questionId,
            $memberId,
            $content,
            $inputMethod,
            $audioFilePath,
            $transcript,
            $era,
            $duration,
        );

        $this->questions->markAnswered($questionId);
        $this->assignEra($questionId, $content);

        $this->logger->info("답변 생성: {$responseId} / 질문={$questionId} / 방식={$inputMethod->value}");

        return $this->responses->find($responseId)
            ?? throw new \RuntimeException('저장한 답변을 조회할 수 없습니다');
    }

    /**
     * 아직 시기가 정해지지 않은 질문이라면, 질문과 답변 내용으로 분류한다.
     */
    private function assignEra(string $questionId, string $answer): void
    {
        $question = $this->questions->find($questionId);

        if ($question === null || $question['category'] !== null) {
            return;
        }

        $era = $this->classifier->classify((string) $question['content'], $answer);

        if ($this->questions->assignEraIfUnset($questionId, $era)) {
            $this->logger->info("시기 분류: {$questionId} -> {$era->value}");
        }
    }
}
