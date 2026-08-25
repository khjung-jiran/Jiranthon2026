<?php

declare(strict_types=1);

namespace Eum\Controller;

use Eum\Exception\NotFoundException;
use Eum\Http\ApiResponse;
use Eum\Http\Input;
use Eum\Presenter\NotificationPresenter;
use Eum\Repository\NotificationRepository;
use Eum\Service\NotificationService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class NotificationController
{
    public function __construct(
        private readonly NotificationRepository $notifications,
        private readonly NotificationService $notificationService,
    ) {
    }

    public function create(Request $req, Response $res): Response
    {
        $input = Input::from($req);

        $id = $this->notificationService->notify(
            memberId: $input->required('member_id'),
            type: $input->required('type'),
            title: $input->required('title'),
            body: $input->optional('body'),
            icon: $input->optional('icon'),
            color: $input->optional('color'),
            navTarget: $input->optional('nav_target'),
            familyId: $input->optional('family_id'),
        );

        $row = $this->notifications->find($id)
            ?? throw new NotFoundException('알림을 찾을 수 없습니다');

        return ApiResponse::created($res, NotificationPresenter::one($row));
    }

    public function index(Request $req, Response $res): Response
    {
        $memberId = Input::from($req)->requiredQuery('member_id');

        return ApiResponse::json(
            $res,
            NotificationPresenter::collection($this->notifications->listByMember($memberId))
        );
    }

    public function unreadCount(Request $req, Response $res): Response
    {
        $memberId = Input::from($req)->requiredQuery('member_id');

        return ApiResponse::json($res, ['count' => $this->notifications->unreadCount($memberId)]);
    }

    public function markRead(Request $req, Response $res): Response
    {
        $id = Input::from($req)->route('nid');

        if (!$this->notifications->has($id)) {
            throw new NotFoundException('알림을 찾을 수 없습니다');
        }

        $this->notifications->markRead($id);

        return ApiResponse::ok($res);
    }

    public function markAllRead(Request $req, Response $res): Response
    {
        $memberId = Input::from($req)->requiredQuery('member_id');
        $updated = $this->notifications->markAllRead($memberId);

        return ApiResponse::ok($res, ['updated' => $updated]);
    }

    public function destroy(Request $req, Response $res): Response
    {
        $id = Input::from($req)->route('nid');

        if (!$this->notifications->has($id)) {
            throw new NotFoundException('알림을 찾을 수 없습니다');
        }

        $this->notifications->delete($id);

        return ApiResponse::ok($res);
    }
}
