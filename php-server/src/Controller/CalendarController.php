<?php

declare(strict_types=1);

namespace Eum\Controller;

use Eum\Exception\ForbiddenException;
use Eum\Exception\NotFoundException;
use Eum\Http\ApiResponse;
use Eum\Http\Input;
use Eum\Presenter\CalendarPresenter;
use Eum\Repository\CalendarRepository;
use Eum\Repository\MemberRepository;
use Eum\Service\NotificationService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class CalendarController
{
    public function __construct(
        private readonly CalendarRepository $entries,
        private readonly MemberRepository $members,
        private readonly NotificationService $notificationService,
    ) {
    }

    public function create(Request $req, Response $res): Response
    {
        $input = Input::from($req);

        $familyId = $input->required('family_id');
        $createdBy = $input->required('created_by');
        $date = $input->required('date');
        $title = $input->required('title');

        $id = $this->entries->create(
            familyId: $familyId,
            date: $date,
            title: $title,
            createdBy: $createdBy,
            tag: $input->optional('tag'),
            color: $input->optional('color'),
        );

        $entry = $this->entries->find($id)
            ?? throw new NotFoundException('일정을 찾을 수 없습니다');

        // 가족 전원에게 푸시 (작성자 제외)
        $creatorName = $this->members->find($createdBy)['name'] ?? '가족';
        $familyMembers = $this->members->listByFamily($familyId);
        foreach ($familyMembers as $member) {
            if ($member['id'] === $createdBy) {
                continue;
            }
            $this->notificationService->notify(
                memberId: (string) $member['id'],
                type: 'calendar',
                title: '새 일정이 추가됐어요',
                body: "{$creatorName}님이 추가한 일정: {$title} ({$date})",
                navTarget: '/calendar',
                familyId: $familyId,
            );
        }

        return ApiResponse::created($res, CalendarPresenter::one($entry));
    }

    public function index(Request $req, Response $res): Response
    {
        $input = Input::from($req);

        $rows = $this->entries->search(
            $input->requiredQuery('family_id'),
            $input->query('month'),
            $input->queryFlag('upcoming'),
        );

        return ApiResponse::json($res, CalendarPresenter::collection($rows));
    }

    public function destroy(Request $req, Response $res): Response
    {
        $input = Input::from($req);
        $id = $input->route('eid');
        $memberId = $input->requiredQuery('member_id');

        $entry = $this->entries->find($id);

        if ($entry === null) {
            throw new NotFoundException('일정을 찾을 수 없습니다');
        }

        if ($entry['created_by'] !== $memberId) {
            throw new ForbiddenException('본인이 작성한 일정만 삭제할 수 있습니다');
        }

        $this->entries->delete($id);

        return ApiResponse::ok($res);
    }
}
