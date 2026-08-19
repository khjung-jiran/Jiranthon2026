<?php

declare(strict_types=1);

namespace Eum\Controller;

use Eum\Domain\CapsuleStatus;
use Eum\Exception\NotFoundException;
use Eum\Exception\ValidationException;
use Eum\Http\ApiResponse;
use Eum\Http\Input;
use Eum\Presenter\CapsulePresenter;
use Eum\Repository\CapsuleRepository;
use Eum\Repository\MemberRepository;
use Eum\Repository\NotificationRepository;
use Eum\Service\NotificationService;
use Eum\Support\Logger;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class CapsuleController
{
    public function __construct(
        private readonly CapsuleRepository $capsules,
        private readonly Logger $logger,
        private readonly MemberRepository $members,
        private readonly NotificationRepository $notifications,
        private readonly NotificationService $notificationService,
    ) {
    }

    public function create(Request $req, Response $res): Response
    {
        $input = Input::from($req);
        $openDate = $input->required('open_date');

        if (\preg_match('/^\d{4}-\d{2}-\d{2}$/', $openDate) !== 1) {
            throw new ValidationException('open_date는 YYYY-MM-DD 형식이어야 합니다');
        }

        $id = $this->capsules->create(
            familyId: $input->required('family_id'),
            title: $input->required('title'),
            openDate: $openDate,
            fromMemberId: $input->optional('from_member_id'),
            toMemberId: $input->optional('to_member_id'),
            audioFilePath: $input->optional('audio_file_path'),
            duration: $input->optional('duration'),
        );

        $this->logger->info("캡슐 생성: {$id} / 개봉일={$openDate}");

        return ApiResponse::created($res, CapsulePresenter::one($this->requireCapsule($id)));
    }

    public function index(Request $req, Response $res): Response
    {
        $familyId = Input::from($req)->requiredQuery('family_id');

        // 개봉일이 지난 캡슐을 한 번의 UPDATE 로 해제한다.
        $this->notifyReleasedCapsules($this->capsules->releaseDueCapsules($familyId));

        return ApiResponse::json(
            $res,
            CapsulePresenter::collection($this->capsules->listByFamily($familyId))
        );
    }

    public function ready(Request $req, Response $res): Response
    {
        $familyId = Input::from($req)->requiredQuery('family_id');

        $this->notifyReleasedCapsules($this->capsules->releaseDueCapsules($familyId));

        return ApiResponse::json(
            $res,
            CapsulePresenter::collection($this->capsules->listReady($familyId))
        );
    }

    public function show(Request $req, Response $res): Response
    {
        $id = Input::from($req)->route('cid');
        $capsule = $this->requireCapsule($id);

        $this->notifyReleasedCapsules($this->capsules->releaseDueCapsules((string) $capsule['family_id']));

        return ApiResponse::json($res, CapsulePresenter::one($this->requireCapsule($id)));
    }

    /**
     * 해제된 캡슐의 수신자에게 푸시 알림을 보낸다.
     * 중복 방지: 같은 캡슐 제목으로 이미 알림을 보냈으면 스킵.
     *
     * @param list<array<string, mixed>> $releasedCapsules
     */
    private function notifyReleasedCapsules(array $releasedCapsules): void
    {
        foreach ($releasedCapsules as $capsule) {
            $toMemberId = $capsule['to_member_id'] ?? null;
            $title = (string) $capsule['title'];

            if ($toMemberId === null) {
                continue;
            }

            // 중복 알림 방지
            $notifTitle = "타임캡슐이 열렸어요: {$title}";
            if ($this->notifications->existsByTypeAndTitle($toMemberId, 'capsule', $notifTitle)) {
                continue;
            }

            $this->notificationService->notify(
                memberId: (string) $toMemberId,
                type: 'capsule',
                title: $notifTitle,
                body: '지금 열어보세요.',
                navTarget: '/home',
                familyId: (string) $capsule['family_id'],
            );
        }
    }

    public function open(Request $req, Response $res): Response
    {
        $id = Input::from($req)->route('cid');
        $capsule = $this->requireCapsule($id);

        // 조회 시점에 해제되지 않았을 수 있으므로 다시 판정한다.
        $this->capsules->releaseDueCapsules((string) $capsule['family_id']);
        $capsule = $this->requireCapsule($id);

        if ($capsule['status'] === CapsuleStatus::Locked->value) {
            throw new ValidationException('아직 열 수 없는 캡슐입니다');
        }

        $this->capsules->markOpened($id);
        $this->logger->info("캡슐 개봉: {$id}");

        return ApiResponse::ok($res);
    }

    /** @return array<string, mixed> */
    private function requireCapsule(string $id): array
    {
        return $this->capsules->find($id)
            ?? throw new NotFoundException('캡슐을 찾을 수 없습니다');
    }
}
