<?php

declare(strict_types=1);

namespace Eum\Presenter;

final class PollPresenter
{
    /**
     * @param  array<string, mixed>       $poll
     * @param  list<array<string, mixed>> $options
     * @return array<string, mixed>
     */
    public static function one(array $poll, array $options = [], ?string $myOptionId = null): array
    {
        $totalVotes = 0;
        foreach ($options as $option) {
            $totalVotes += (int) $option['vote_count'];
        }

        return [
            'id' => $poll['id'],
            'family_id' => $poll['family_id'],
            'title' => $poll['title'],
            'deadline' => $poll['deadline'],
            'created_by' => $poll['created_by'],
            'created_at' => $poll['created_at'],
            'total_votes' => $totalVotes,
            'my_option_id' => $myOptionId,
            'options' => \array_map(
                static fn (array $option): array => [
                    'id' => $option['id'],
                    'label' => $option['label'],
                    'vote_count' => (int) $option['vote_count'],
                ],
                $options
            ),
        ];
    }

    /**
     * @param  list<array<string, mixed>>                   $polls
     * @param  array<string, list<array<string, mixed>>>    $optionsByPoll
     * @param  array<string, string>                        $myVotes pollId => optionId
     * @return list<array<string, mixed>>
     */
    public static function collection(array $polls, array $optionsByPoll, array $myVotes = []): array
    {
        return \array_map(
            static fn (array $poll): array => self::one(
                $poll,
                $optionsByPoll[$poll['id']] ?? [],
                $myVotes[$poll['id']] ?? null
            ),
            $polls
        );
    }
}
