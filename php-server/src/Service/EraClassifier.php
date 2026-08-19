<?php

declare(strict_types=1);

namespace Eum\Service;

use Eum\Domain\Era;

/**
 * 답변 본문으로 인생 시기를 추론한다.
 *
 * 질문을 만들 때는 시기를 정하지 않는다. 어떤 시기의 이야기인지는
 * 실제로 무엇을 말했는지에 달려 있기 때문이다.
 */
final class EraClassifier
{
    /** 근거가 없을 때 돌아갈 시기 */
    private const FALLBACK = Era::Twilight;

    /**
     * 질문과 답변을 함께 본다. 답변에 더 큰 가중치를 준다 —
     * 시기를 결정하는 건 답변자가 실제로 회상한 내용이다.
     */
    public function classify(string $question, string $answer): Era
    {
        $scores = [];

        foreach (Era::chronological() as $era) {
            $scores[$era->value] =
                $this->countMatches($answer, $era) * 2
                + $this->countMatches($question, $era);
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
