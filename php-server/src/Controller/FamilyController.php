<?php

declare(strict_types=1);

namespace Eum\Controller;

use Eum\Domain\MemberRole;
use Eum\Exception\ConflictException;
use Eum\Exception\NotFoundException;
use Eum\Http\ApiResponse;
use Eum\Http\Input;
use Eum\Presenter\FamilyPresenter;
use Eum\Presenter\MemberPresenter;
use Eum\Repository\FamilyRepository;
use Eum\Repository\MemberRepository;
use Eum\Service\AuthService;
use Eum\Service\NotificationService;
use Eum\Service\PasswordHasher;
use Eum\Service\QuestionService;
use Eum\Support\Logger;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class FamilyController
{
    public function __construct(
        private readonly FamilyRepository $families,
        private readonly MemberRepository $members,
        private readonly AuthService $auth,
        private readonly PasswordHasher $hasher,
        private readonly QuestionService $questions,
        private readonly Logger $logger,
        private readonly NotificationService $notificationService,
    ) {
    }

    public function createFamily(Request $req, Response $res): Response
    {
        $input = Input::from($req);
        $name = $input->required('name');

        $id = $this->families->create($name);
        $family = $this->families->find($id) ?? throw new NotFoundException('가족을 찾을 수 없습니다');

        $this->logger->info("가족 생성: {$id} / 이름={$name} / 초대코드={$family['invite_code']}");

        return ApiResponse::created($res, FamilyPresenter::one($family));
    }

    public function getFamily(Request $req, Response $res): Response
    {
        $family = $this->requireFamily(Input::from($req)->route('family_id'));

        return ApiResponse::json($res, FamilyPresenter::one($family));
    }

    public function getInviteCode(Request $req, Response $res): Response
    {
        $family = $this->requireFamily(Input::from($req)->route('family_id'));

        return ApiResponse::json($res, ['invite_code' => $family['invite_code']]);
    }

    /** 초대 코드로 가족을 조회한다 (합류 전 확인용). */
    public function joinFamily(Request $req, Response $res): Response
    {
        $code = Input::from($req)->requiredQuery('invite_code');
        $family = $this->families->findByInviteCode($code);

        if ($family === null) {
            throw new NotFoundException('잘못된 초대 코드입니다');
        }

        return ApiResponse::json($res, FamilyPresenter::one($family));
    }

    public function createMember(Request $req, Response $res): Response
    {
        $input = Input::from($req);

        $familyId = $input->required('family_id');
        $name = $input->required('name');
        $role = MemberRole::fromValue($input->optional('role'));
        $username = $input->optional('username');
        $password = $input->optional('password');

        $this->requireFamily($familyId);

        if ($username !== null && $this->members->usernameExists($username)) {
            throw new ConflictException('이미 사용 중인 아이디입니다');
        }

        $memberId = $this->members->create(
            $familyId,
            $name,
            $role,
            $input->optional('sub_role'),
            $username,
            $password === null ? null : $this->hasher->hash($password),
            $input->optional('birth_date'),
            $input->optional('profile_image'),
        );

        $this->logger->info(\sprintf(
            '멤버 생성: %s / 이름=%s / 아이디=%s / 역할=%s / 가족=%s',
            $memberId,
            $name,
            $username ?? '-',
            $role->value,
            $familyId,
        ));

        // 부모에게는 답할 질문을 미리 채워 줌 (이미 질문이 있으면 스킵 — 중복 방지)
        if ($role->isParent()) {
            $this->questions->seedDefaultsIfEmpty($familyId, $memberId);
        }

        $member = $this->members->find($memberId)
            ?? throw new NotFoundException('회원을 찾을 수 없습니다');

        return ApiResponse::created($res, MemberPresenter::one($member));
    }

    public function login(Request $req, Response $res): Response
    {
        $input = Input::from($req);

        $result = $this->auth->login(
            $input->required('username'),
            $input->required('password'),
        );

        $family = $result['family'];
        $member = $result['member'];

        return ApiResponse::json($res, [
            'member' => MemberPresenter::one($member),
            'family' => $family === null ? null : FamilyPresenter::one($family),
            'invite_code' => $family['invite_code'] ?? null,
        ]);
    }

    public function listMembers(Request $req, Response $res): Response
    {
        $familyId = Input::from($req)->route('family_id');

        return ApiResponse::json(
            $res,
            MemberPresenter::collection($this->members->listByFamily($familyId))
        );
    }

    public function joinFamilyByMember(Request $req, Response $res): Response
    {
        $input = Input::from($req);
        $memberId = $input->route('member_id');
        $code = $input->required('invite_code');

        $member = $this->members->find($memberId);
        if ($member === null) {
            throw new NotFoundException('회원을 찾을 수 없습니다');
        }

        $family = $this->families->findByInviteCode($code);

        if ($family === null) {
            throw new NotFoundException('잘못된 초대 코드입니다');
        }

        $familyId = (string) $family['id'];
        $this->members->moveToFamily($memberId, $familyId);

        $this->logger->info("가족 변경: 멤버={$memberId} / 새 가족={$familyId} / 초대코드={$code}");

        // 기존 가족 멤버에게 새 멤버 합류 푸시 (새 멤버 제외)
        $newMemberName = $member['name'] ?? '새 가족';
        $existingMembers = $this->members->listByFamily($familyId);
        foreach ($existingMembers as $existing) {
            if ($existing['id'] === $memberId) {
                continue;
            }
            $this->notificationService->notify(
                memberId: (string) $existing['id'],
                type: 'family_join',
                title: '새 가족이 합류했어요',
                body: "{$newMemberName}님이 가족에 참여했어요.",
                navTarget: '/settings',
                familyId: $familyId,
            );
        }

        return ApiResponse::ok($res, ['family' => FamilyPresenter::one($family)]);
    }

    public function deleteMember(Request $req, Response $res): Response
    {
        $memberId = Input::from($req)->route('member_id');
        $member = $this->members->find($memberId);

        if ($member === null) {
            throw new NotFoundException('회원을 찾을 수 없습니다');
        }

        $this->members->deleteWithRelations($memberId);

        $this->logger->info(\sprintf(
            '회원 탈퇴: %s / 이름=%s / 아이디=%s',
            $memberId,
            $member['name'],
            $member['username'] ?? '-',
        ));

        return ApiResponse::ok($res);
    }

    /**
     * 멤버의 FCM 토큰을 등록/갱신한다.
     * 앱 기기에서 발급받은 토큰을 서버에 저장해두면 푸시 알림을 보낼 수 있다.
     * 빈 토큰을 보내면 null 로 초기화한다 (로그아웃 시).
     */
    public function registerFcmToken(Request $req, Response $res): Response
    {
        $input = Input::from($req);
        $memberId = $input->route('member_id');

        if ($this->members->find($memberId) === null) {
            throw new NotFoundException('회원을 찾을 수 없습니다');
        }

        // 빈 문자열은 null 로 정규화한다.
        $token = $input->optional('token');

        $this->members->updateFcmToken($memberId, $token);

        $this->logger->info(\sprintf(
            'FCM 토큰 등록: 멤버=%s / 토큰=%s',
            $memberId,
            $token === null ? '(초기화)' : \substr($token, 0, 12) . '...',
        ));

        return ApiResponse::ok($res, ['member_id' => $memberId]);
    }

    /** @return array<string, mixed> */
    private function requireFamily(string $familyId): array
    {
        return $this->families->find($familyId)
            ?? throw new NotFoundException('가족을 찾을 수 없습니다');
    }
}
