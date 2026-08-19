<?php

declare(strict_types=1);

namespace Eum\Domain;

/**
 * 질문의 출처. 가족이 직접 보낸 질문을 AI 제안보다 먼저 노출하는
 * 정렬 규칙의 근거가 된다.
 */
enum QuestionSource: string
{
    case Manual = 'manual';
    case Auto = 'auto';
    case FollowUp = 'follow_up';
}
