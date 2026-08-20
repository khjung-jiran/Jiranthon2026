<?php

declare(strict_types=1);

namespace Eum\Domain;

/**
 * 일대기 챕터를 구성하는 인생 시기.
 *
 * 질문 생성 시점에는 시기를 지정하지 않는다 (`null`). 답변이 도착하면
 * {@see \Eum\Service\EraClassifier} 가 질문+답변 본문을 근거로 분류한다.
 */
enum Era: string
{
    case Childhood = 'childhood';
    case Youth = 'youth';
    case Twilight = 'twilight';

    public function label(): string
    {
        return match ($this) {
            self::Childhood => '유년기',
            self::Youth => '청년시절',
            self::Twilight => '황혼기',
        };
    }

    /** 스토리 제목 기본값 (예: `유년기의 기억`) */
    public function defaultTitle(): string
    {
        return $this->label() . '의 기억';
    }

    /**
     * 분류에 사용하는 키워드. 겹치는 단어가 없도록 선별했다.
     *
     * @return list<string>
     */
    public function keywords(): array
    {
        return match ($this) {
            self::Childhood => [
                '어린', '어릴', '꼬마', '초등', '학교', '놀이', '동네',
                '친구', '할머니', '할아버지', '간식',
            ],
            self::Youth => [
                '스무', '젊은', '청춘', '직장', '연애', '대학', '데이트',
                '프로포즈', '월급', '자취', '꿈', '열정',
                '20대', '30대', '결혼', '남편', '아내', '연인',
            ],
            self::Twilight => [
                '인생', '가치', '조언', '회고', '감사', '가족', '부모',
                '아이', '여행', '취미', '계절', '아침',
                '늙', '나이 먹', '돌아가', '그리워', '그립',
            ],
        };
    }

    /**
     * 일대기가 전개되는 순서. 화면 표시 순서와 같다.
     *
     * @return list<self>
     */
    public static function chronological(): array
    {
        return [self::Childhood, self::Youth, self::Twilight];
    }

    /**
     * 알 수 없는 값은 예외 대신 `null` 을 반환한다. 레거시 데이터에
     * `love`, `food` 같은 구버전 카테고리가 남아 있어 관용적으로 처리한다.
     */
    public static function tryFromValue(?string $value): ?self
    {
        return $value === null ? null : self::tryFrom($value);
    }
}
