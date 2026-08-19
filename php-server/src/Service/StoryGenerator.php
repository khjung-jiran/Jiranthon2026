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

        $draft = $this->generateWithLlm($era, $items);

        if ($draft !== null && !$draft->isEmpty()) {
            return $draft;
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
            [Paths::pythonBinary(), $script, '--prompt', $this->buildPrompt($era, $items)],
            self::LLM_TIMEOUT
        );

        if (!$result->successful || $result->stdout === '') {
            return null;
        }

        return $this->parseLlmOutput($era, $result->stdout);
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
            '형식은 다음과 같습니다.',
            self::TITLE_PREFIX . ' [제목]',
            '[본문]',
            '',
            '본문은 200~300자로 쓰고, 마크다운 기호는 쓰지 마세요.',
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
