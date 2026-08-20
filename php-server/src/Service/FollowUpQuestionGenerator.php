<?php

declare(strict_types=1);

namespace Eum\Service;

use Eum\Domain\Era;
use Eum\Support\Logger;
use Eum\Support\Paths;

/**
 * 답변 내용을 읽고 파고드는 꼬리 질문을 만든다.
 *
 * 기존에는 시기별 질문 라이브러리에서 뽑아 썼기 때문에, "노래" 답변에
 * "영화" 질문이 따라붙는 식으로 맥락이 끊겼다. 여기서는 실제 답변을
 * 로컬 LLM 에 넘겨 그 이야기를 더 듣는 질문을 얻는다.
 *
 * LLM 을 쓸 수 없으면 `null` 을 돌려주고, 호출측이 라이브러리 폴백을 쓴다.
 */
final class FollowUpQuestionGenerator
{
    private const LLM_TIMEOUT = 60;

    /**
     * 생성 재시도 횟수.
     *
     * 로컬 모델(qwen2.5)이 한국어 지시를 무시하고 중국어로 흘러가는 일이
     * 잦다. 검증에서 전부 걸러지면 한 번 더 시도한다.
     */
    private const MAX_ATTEMPTS = 2;

    /**
     * 질문 한 줄의 허용 길이 (자).
     *
     * 모델이 "~했어요? 그때 어떤 이야기를 나눴는지 말씀해주실 수 있나요?" 처럼
     * 두 문장을 붙여 내놓는 일이 많다. 그 편이 이야기를 끌어내기 좋으므로
     * 자르지 않고, 상한만 넉넉히 둔다.
     */
    private const MIN_LENGTH = 6;
    private const MAX_LENGTH = 100;

    private const SYSTEM_PROMPT = '당신은 한국어로만 응답하는 인터뷰 질문 작성자입니다. '
        . '부모님의 이야기를 더 깊이 듣기 위한 질문을 만듭니다. '
        . '절대 영어, 중국어, 일본어 등 다른 언어를 섞지 마세요. '
        . '사고 과정, 추론, 설명, 번호, 머리말을 출력하지 마세요. '
        . '질문만 한 줄에 하나씩 출력하세요.';

    public function __construct(
        private readonly ProcessRunner $processes,
        private readonly Logger $logger,
    ) {
    }

    /**
     * 답변을 근거로 꼬리 질문을 만든다.
     *
     * @param  list<string> $exclude 이미 출제된 질문 (중복 방지)
     * @return list<string>|null     LLM 을 쓸 수 없으면 null
     */
    public function generate(
        Era $era,
        string $question,
        string $answer,
        int $count,
        array $exclude = [],
    ): ?array {
        $answer = \trim($answer);

        if ($answer === '' || $count < 1) {
            return null;
        }

        $script = Paths::llmScript();

        if (!\is_file($script)) {
            return null;
        }

        $command = [
            Paths::pythonBinary(),
            $script,
            '--system',
            self::SYSTEM_PROMPT,
            '--prompt',
            $this->buildPrompt($era, $question, $answer, $count),
        ];

        for ($attempt = 1; $attempt <= self::MAX_ATTEMPTS; $attempt++) {
            $result = $this->processes->run($command, self::LLM_TIMEOUT);

            if (!$result->successful || $result->stdout === '') {
                $this->logger->warning("꼬리 질문 LLM 생성 실패 ({$era->value}) — {$attempt}회");
                continue;
            }

            $questions = $this->parse($result->stdout, $exclude, $count);

            if ($questions !== []) {
                return $questions;
            }

            $this->logger->warning(
                "꼬리 질문 LLM 응답에 쓸 만한 한국어 질문이 없음 ({$era->value}) — {$attempt}회"
            );
        }

        return null;
    }

    private function buildPrompt(Era $era, string $question, string $answer, int $count): string
    {
        return \implode("\n", [
            "부모님께 여쭤본 질문과 그 답변입니다. 이 답변을 더 깊이 듣기 위한 후속 질문 {$count}개를 만들어 주세요.",
            '',
            "질문: {$question}",
            "답변: {$answer}",
            '',
            '규칙:',
            '- 반드시 한글로만 쓰세요. 중국어(한자), 일본어, 영어를 단 한 글자도 섞지 마세요.',
            '- 답변에서 실제로 언급된 사람, 장소, 시기, 사건을 붙잡아 구체적으로 물어보세요.',
            '- 답변에 없는 내용을 새로 가정하지 마세요.',
            '- 예/아니오로 끝나지 않고 이야기를 풀어놓게 하는 질문으로 만드세요.',
            '- 어르신께 여쭙는 공손한 말투(~셨어요?, ~신가요?)로 쓰세요.',
            '- 한 줄에 질문 하나만 쓰고, 번호나 기호(-, *, 1.)는 붙이지 마세요.',
            '- 질문은 한 문장으로 짧게 쓰세요.',
            '',
            "질문 {$count}개만 출력하세요.",
            '',
        ]);
    }

    /**
     * 한 줄 하나씩 온 질문을 정리한다. 번호·기호·중복·빈 줄을 걸러낸다.
     *
     * @param  list<string> $exclude
     * @return list<string>
     */
    private function parse(string $raw, array $exclude, int $count): array
    {
        $excludeMap = [];

        foreach ($exclude as $item) {
            $excludeMap[$this->normalize($item)] = true;
        }

        $questions = [];

        foreach (\explode("\n", $raw) as $line) {
            $line = $this->cleanLine($line);

            if ($line === '' || !\str_contains($line, '?') || !$this->isKorean($line)) {
                continue;
            }

            $length = \mb_strlen($line);

            if ($length < self::MIN_LENGTH || $length > self::MAX_LENGTH) {
                continue;
            }

            $key = $this->normalize($line);

            if (isset($excludeMap[$key])) {
                continue;
            }

            $excludeMap[$key] = true;
            $questions[] = $line;

            if (\count($questions) >= $count) {
                break;
            }
        }

        return $questions;
    }

    /** 목록 기호, 번호, 마크다운, 따옴표를 떼어낸다. 전각 물음표는 통일한다. */
    private function cleanLine(string $line): string
    {
        $line = \trim($line);
        $line = \str_replace(['**', '##', '#', '？'], ['', '', '', '?'], $line);
        $line = (string) \preg_replace('/^\s*(?:[-*•]|\d+[.)])\s*/u', '', $line);

        return \trim($line, " \t\"'“”‘’");
    }

    /**
     * 한국어 문장인지 검사한다.
     *
     * 로컬 모델이 중국어·일본어로 흘러가는 일이 잦아, 한글이 있고 한자나
     * 가나가 섞이지 않은 줄만 통과시킨다.
     */
    private function isKorean(string $line): bool
    {
        $hasHangul = \preg_match('/\p{Hangul}/u', $line) === 1;
        $hasOtherScript = \preg_match('/[\p{Han}\p{Hiragana}\p{Katakana}]/u', $line) === 1;

        return $hasHangul && !$hasOtherScript;
    }

    /** 중복 판정용 정규화 — 공백과 물음표 차이는 무시한다. */
    private function normalize(string $text): string
    {
        return (string) \preg_replace('/[\s?]+/u', '', $text);
    }
}
