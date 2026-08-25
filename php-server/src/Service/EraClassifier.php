<?php

declare(strict_types=1);

namespace Eum\Service;

use Eum\Domain\Era;
use Eum\Support\Logger;
use Eum\Support\Paths;

/**
 * 답변 본문으로 인생 시기를 추론한다.
 *
 * 로컬 LLM(Ollama) 에 질문+답변을 넘겨 시기를 분류한다.
 * LLM 을 사용할 수 없으면 키워드 기반 폴백으로 내려간다.
 */
final class EraClassifier
{
    /** LLM 분류 타임아웃 (초) */
    private const LLM_TIMEOUT = 30;

    /** 근거가 없을 때 돌아갈 시기 */
    private const FALLBACK = Era::Twilight;

    private const SYSTEM_PROMPT = '당신은 한국어로만 응답하는 분류 어시스턴트입니다. '
        . '주어진 질문과 답변을 읽고 화자(답변자) 본인의 인생 시기를 판단하세요. '
        . '반드시 다음 세 단어 중 하나만 출력하세요: childhood, youth, twilight. '
        . '다른 설명이나 텍스트는 절대 출력하지 마세요. '
        . '주의: 화자의 자녀·아이가 어렸을 때 이야기는 화자의 청년시절(youth)입니다. '
        . 'childhood는 화자 본인이 어린 시절이어야 합니다.';

    public function __construct(
        private readonly ProcessRunner $processes,
        private readonly Logger $logger,
    ) {
    }

    /**
     * 질문과 답변을 함께 본다. 답변에 더 큰 비중을 둔다 —
     * 시기를 결정하는 건 답변자가 실제로 회상한 내용이다.
     */
    public function classify(string $question, string $answer): Era
    {
        $answer = \trim($answer);
        $question = \trim($question);

        if ($answer === '' && $question === '') {
            return self::FALLBACK;
        }

        $era = $this->classifyWithLlm($question, $answer);

        if ($era !== null) {
            $this->logger->info("LLM 시기 분류: {$era->value}");
            return $era;
        }

        $this->logger->warning('LLM 시기 분류 실패 — 키워드 폴백 사용');
        return $this->classifyWithKeywords($question, $answer);
    }

    /**
     * LLM 에 질문+답변을 넘겨 시기를 분류한다.
     */
    private function classifyWithLlm(string $question, string $answer): ?Era
    {
        $script = Paths::llmScript();

        if (!\is_file($script)) {
            return null;
        }

        $prompt = $this->buildPrompt($question, $answer);

        $result = $this->processes->run(
            [Paths::pythonBinary(), $script, '--system', self::SYSTEM_PROMPT, '--prompt', $prompt],
            self::LLM_TIMEOUT
        );

        if (!$result->successful || $result->stdout === '') {
            return null;
        }

        $output = \trim(\strtolower($result->stdout));

        // LLM 이 추가 텍스트를 섞을 수 있으므로, 세 단어 중 첫 매칭을 취한다.
        foreach (Era::chronological() as $era) {
            if (\str_contains($output, $era->value)) {
                return $era;
            }
        }

        return null;
    }

    private function buildPrompt(string $question, string $answer): string
    {
        $desc = \implode("\n", [
            '다음은 부모님에게 한 질문과 그 답변입니다.',
            '답변에서 화자(답변자) 본인이 직접 겪은 인생 시기를 판단하세요.',
            '',
            "질문: {$question}",
            "답변: {$answer}",
            '',
            '기준:',
            '- childhood: 화자 본인의 어린 시절 (초등학교 이하, 10대 미만)',
            '- youth: 화자 본인의 청년시절 (20~40대, 결혼·직장·연애·대학·육아 등)',
            '- twilight: 화자 본인의 황혼기 (50대 이후, 인생 회고·조언·가족 관조 등)',
            '',
            '주의사항:',
            '- "아이들이 어릴 때", "자녀가 어렸을 때" 등은 화자가 성인/부모였던 시기이므로 youth입니다.',
            '- 화자 본인이 어렸을 때의 기억(내 어릴 적, 학교 다닐 때)만 childhood입니다.',
            '- 화자의 나이나 세대가 명시되지 않으면 답변의 핵심 사건으로 판단하세요.',
            '',
            '반드시 childhood, youth, twilight 중 하나만 출력하세요.',
        ]);

        return $desc;
    }

    /**
     * LLM 없이 키워드 매칭으로 분류한다 (폴백).
     */
    private function classifyWithKeywords(string $question, string $answer): Era
    {
        $scores = [];

        foreach (Era::chronological() as $era) {
            $scores[$era->value] =
                $this->countMatches($answer, $era) * 2
                + $this->countMatches($question, $era);
        }

        // "아이들이 어릴 때", "자녀가 어릴 때" 등은 화자가 부모였던 시기이므로
        // Childhood 키워드("어릴")가 걸려도 Youth로 보정한다.
        $childhoodSignals = ['아이들', '자녀', '애들', '우리 애', '아이가', '딸이', '아들이'];
        $haystack = \mb_strtolower($answer);
        $hasChildRef = false;
        foreach ($childhoodSignals as $sig) {
            if (\str_contains($haystack, \mb_strtolower($sig))) {
                $hasChildRef = true;
                break;
            }
        }
        if ($hasChildRef) {
            // 자녀 언급이 있으면 Childhood 점수를 깎고 Youth로 보정
            $scores['childhood'] = (int) \max(0, $scores['childhood'] - 2);
            $scores['youth'] = ($scores['youth'] ?? 0) + 2;
        }

        $best = \max($scores);

        if ($best === 0) {
            return self::FALLBACK;
        }

        // 동점이면 시간순으로 앞선 시기를 택한다 (유년기 → 청년시절 → 황혼기).
        foreach (Era::chronological() as $era) {
            if ($scores[$era->value] === $best) {
                return $era;
            }
        }

        return self::FALLBACK;
    }

    private function countMatches(string $text, Era $era): int
    {
        if ($text === '') {
            return 0;
        }

        $haystack = \mb_strtolower($text);
        $matches = 0;

        foreach ($era->keywords() as $keyword) {
            if (\str_contains($haystack, $keyword)) {
                $matches++;
            }
        }

        return $matches;
    }
}
