<?php

declare(strict_types=1);

namespace Eum\Controller;

use Eum\Exception\NotFoundException;
use Eum\Exception\ValidationException;
use Eum\Http\ApiResponse;
use Eum\Http\Input;
use Eum\Presenter\PollPresenter;
use Eum\Repository\MemberRepository;
use Eum\Repository\PollRepository;
use Eum\Service\NotificationService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class PollController
{
    public function __construct(
        private readonly PollRepository $polls,
        private readonly MemberRepository $members,
        private readonly NotificationService $notificationService,
    ) {
    }

    public function create(Request $req, Response $res): Response
    {
        $input = Input::from($req);
        $options = $input->stringList('options');

        if (\count($options) < 2) {
            throw new ValidationException('선택지를 2개 이상 입력해 주세요');
        }

        $familyId = $input->required('family_id');
        $createdBy = $input->required('created_by');
        $title = $input->required('title');

        $id = $this->polls->create(
            familyId: $familyId,
            title: $title,
            createdBy: $createdBy,
            options: $options,
            deadline: $input->optional('deadline'),
        );

        // 가족 전원에게 푸시 (작성자 제외)
        $creatorName = $this->members->find($createdBy)['name'] ?? '가족';
        $familyMembers = $this->members->listByFamily($familyId);
        foreach ($familyMembers as $member) {
            if ($member['id'] === $createdBy) {
                continue;
            }
            $this->notificationService->notify(
                memberId: (string) $member['id'],
                type: 'poll',
                title: '새 투표가 시작됐어요',
                body: "{$creatorName}님이 만든 투표: {$title}",
                navTarget: '/home',
                familyId: $familyId,
            );
        }

        return ApiResponse::created($res, $this->present($id, null));
    }

    public function index(Request $req, Response $res): Response
    {
        $input = Input::from($req);
        $familyId = $input->requiredQuery('family_id');
        $memberId = $input->query('member_id');

        $polls = $this->polls->listByFamily($familyId);
        $pollIds = \array_column($polls, 'id');

        // 선택지와 내 투표 내역을 각각 한 번의 쿼리로 가져온다.
        $options = $this->polls->optionsForMany($pollIds);
        $myVotes = $memberId === null ? [] : $this->polls->votesByMember($memberId, $pollIds);

        return ApiResponse::json($res, PollPresenter::collection($polls, $options, $myVotes));
    }

    public function show(Request $req, Response $res): Response
    {
        $input = Input::from($req);

        return ApiResponse::json(
            $res,
            $this->present($input->route('pid'), $input->query('member_id'))
        );
    }

    public function vote(Request $req, Response $res): Response
    {
        $input = Input::from($req);
        $pollId = $input->route('pid');
        $optionId = $input->required('option_id');
        $memberId = $input->required('member_id');

        if ($this->polls->find($pollId) === null) {
            throw new NotFoundException('투표를 찾을 수 없습니다');
        }

        // 다른 투표의 선택지에 표를 넣는 것을 막는다.
        if (!$this->polls->optionBelongsToPoll($optionId, $pollId)) {
            throw new ValidationException('선택지가 이 투표에 속하지 않습니다');
        }

        $this->polls->castVote($pollId, $optionId, $memberId);

        return ApiResponse::ok($res, ['poll' => $this->present($pollId, $memberId)]);
    }

    /** @return array<string, mixed> */
    private function present(string $pollId, ?string $memberId): array
    {
        $poll = $this->polls->find($pollId)
            ?? throw new NotFoundException('투표를 찾을 수 없습니다');

        $myVote = $memberId === null
            ? null
            : ($this->polls->votesByMember($memberId, [$pollId])[$pollId] ?? null);

        return PollPresenter::one($poll, $this->polls->optionsFor($pollId), $myVote);
    }
}
