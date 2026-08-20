<?php

declare(strict_types=1);

namespace Eum\Service;

use Eum\Domain\Era;
use Eum\Support\Logger;
use Eum\Support\Paths;

/**
 * 질문·답변 묶음을 1인칭 회상체 스토리로 만든다.
 *
 * 로컬 LLM(Ollama)을 먼저 시도하고, 사용할 수 없으면 답변을 그대로 엮는
 * 폴백으로 내려간다. 폴백이 있어야 LLM 없이도 앱이 동작한다.
 */
final class StoryGenerator
{
    private const LLM_TIMEOUT = 180;
    private const TITLE_PREFIX = '제목:';

    /**
     * 생성 재시도 횟수.
     *
     * 로컬 모델(qwen2.5)이 이따금 중국어로 흘러가거나, 머리말을 다시 뱉거나,
     * 문장 중간에서 끊긴 글을 내놓는다. 검증에 걸리면 다시 시도한다.
     */
    private const MAX_ATTEMPTS = 2;
    private const SYSTEM_PROMPT = '당신은 한국어로만 응답하는 이야기 작가입니다. '
        . '절대 영어, 중국어, 일본어 등 다른 언어를 섞지 마세요. '
        . '사고 과정, 추론, 메타 텍스트, <think> 태그 등을 출력에 포함하지 마세요. '
        . '오직 최종 결과물(한국어 스토리)만 출력하세요.';

    public function __construct(
        private readonly ProcessRunner $processes,
        private readonly Logger $logger,
    ) {
    }

    /**
     * @param list<array{question: string, answer: string}> $items
     */
    public function generate(Era $era, array $items): StoryDraft
    {
        if ($items === []) {
            return new StoryDraft($era->defaultTitle(), '');
        }

        for ($attempt = 1; $attempt <= self::MAX_ATTEMPTS; $attempt++) {
            $draft = $this->generateWithLlm($era, $items);

            if ($draft === null) {
                continue;
            }

            $problem = $this->findProblem($draft);

            if ($problem === null) {
                return $draft;
            }

            $this->logger->warning(
                "LLM 스토리 품질 미달 ({$era->value}) — {$attempt}회: {$problem}"
            );
        }

        $this->logger->warning("LLM 스토리 생성 실패 ({$era->value}) — 폴백 사용");

        return $this->generateFallback($era, $items);
    }

    /**
     * @param list<array{question: string, answer: string}> $items
     */
    private function generateWithLlm(Era $era, array $items): ?StoryDraft
    {
        $script = Paths::llmScript();

        if (!\is_file($script)) {
            return null;
        }

        $result = $this->processes->run(
            [Paths::pythonBinary(), $script, '--system', self::SYSTEM_PROMPT, '--prompt', $this->buildPrompt($era, $items)],
            self::LLM_TIMEOUT
        );

        if (!$result->successful || $result->stdout === '') {
            return null;
        }

        return $this->parseLlmOutput($era, $result->stdout);
    }

    /**
     * 쓸 수 없는 출력을 걸러낸다. 문제가 없으면 `null`.
     *
     * 사용자에게 보이는 글이므로, 어설픈 결과를 저장하는 것보다 답변을
     * 그대로 엮은 폴백을 쓰는 편이 낫다.
     */
    private function findProblem(StoryDraft $draft): ?string
    {
        $body = \trim($draft->body);

        if ($body === '') {
            return '본문이 비어 있음';
        }

        if (\preg_match('/\p{Hangul}/u', $body) !== 1) {
            return '한글이 없음';
        }

        if (\preg_match('/[\p{Han}\p{Hiragana}\p{Katakana}]/u', $body) === 1) {
            return '한자·가나가 섞임';
        }

        // 머리말을 다시 뱉으면 그 뒤로 글이 겹쳐 나온다.
        if (\str_contains($body, self::TITLE_PREFIX)) {
            return '본문에 머리말이 다시 나옴';
        }

        foreach (\preg_split('/\n\s*\n/u', $body) ?: [] as $paragraph) {
            $paragraph = \trim($paragraph);

            if ($paragraph === '') {
                continue;
            }

            // 문장 종결부호로 끝나지 않으면 중간에 끊긴 글이다.
            if (\preg_match('/[.!?…"”\']$/u', $paragraph) !== 1) {
                return '문단이 문장 중간에서 끊김: …' . \mb_substr($paragraph, -12);
            }
        }

        return null;
    }

    /**
     * @param list<array{question: string, answer: string}> $items
     */
    private function buildPrompt(Era $era, array $items): string
    {
        $transcript = \implode("\n", \array_map(
            static fn (array $item): string => "Q: {$item['question']}\nA: {$item['answer']}",
            $items
        ));

        return \implode("\n", [
            "부모님의 {$era->label()} 답변들을 바탕으로 한국어 1인칭 회상체 스토리를 작성하세요.",
            '반드시 한국어로만 작성하세요. 영어, 중국어, 일본어 등 다른 언어는 절대 사용하지 마세요.',
            '사고 과정, 추론, 메타 설명, <think> 태그 등을 출력에 포함하지 마세요.',
            '오직 최종 스토리만 출력하세요.',
            '형식은 다음과 같습니다.',
            self::TITLE_PREFIX . ' [제목]',
            '[본문]',
            '',
            '본문은 200~300자로 쓰고, 마크다운 기호는 쓰지 마세요.',
            '원본 답변의 구어체 말투(해요체/해체: ~했어, ~했지, ~이야)를 그대로 유지하세요. 문어체(~했다, ~이다)로 바꾸지 마세요.',
            '여러 답변이 있으면 자연스럽게 이어지도록 하나의 이야기로 엮으세요.',
            '',
            $transcript,
            '',
        ]);
    }

    /**
     * `제목: ...` 첫 줄을 제목으로, 이후를 본문으로 분리한다.
     */
    private function parseLlmOutput(Era $era, string $raw): StoryDraft
    {
        $lines = \explode("\n", \trim($raw));
        $title = $era->defaultTitle();
        $body = \trim($raw);

        foreach ($lines as $index => $line) {
            if (!\str_starts_with(\trim($line), self::TITLE_PREFIX)) {
                continue;
            }

            $parsedTitle = \trim(\substr(\trim($line), \strlen(self::TITLE_PREFIX)));

            if ($parsedTitle !== '') {
                $title = $parsedTitle;
            }

            $body = \trim(\implode("\n", \array_slice($lines, $index + 1)));
            break;
        }

        return new StoryDraft($title, $this->stripMarkdown($body));
    }

    private function stripMarkdown(string $text): string
    {
        return \trim(\str_replace(['**', '##', '#', '*'], '', $text));
    }

    /**
     * LLM 없이 답변들을 문단으로 엮는다.
     *
     * @param list<array{question: string, answer: string}> $items
     */
    private function generateFallback(Era $era, array $items): StoryDraft
    {
        $paragraphs = [];

        foreach ($items as $item) {
            $answer = \trim($item['answer']);

            if ($answer !== '') {
                $paragraphs[] = $answer;
            }
        }

        if ($paragraphs === []) {
            return new StoryDraft($era->defaultTitle(), '');
        }

        return new StoryDraft(
            $this->deriveTitle($era, $paragraphs[0]),
            \implode("\n\n", $paragraphs)
        );
    }

    /**
     * 첫 답변의 첫 문장이 제목으로 쓸 만한 길이면 그것을 쓴다.
     */
    private function deriveTitle(Era $era, string $firstAnswer): string
    {
        $sentences = \preg_split('/(?<=[.!?。])\s*/u', $firstAnswer, 2) ?: [];
        $candidate = \trim($sentences[0] ?? '');
        $candidate = \rtrim($candidate, '.!?。');
        $length = \mb_strlen($candidate);

        return ($length >= 4 && $length <= 30) ? $candidate : $era->defaultTitle();
    }
}
