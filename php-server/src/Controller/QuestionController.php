<?php

declare(strict_types=1);

namespace Eum\Controller;

use Eum\Domain\Era;
use Eum\Domain\QuestionSource;
use Eum\Domain\QuestionStatus;
use Eum\Exception\NotFoundException;
use Eum\Http\ApiResponse;
use Eum\Http\Input;
use Eum\Presenter\QuestionPresenter;
use Eum\Repository\MemberRepository;
use Eum\Repository\QuestionRepository;
use Eum\Service\NotificationService;
use Eum\Service\QuestionService;
use Eum\Support\Logger;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class QuestionController
{
    private const DEFAULT_SUGGESTION_COUNT = 4;
    private const MAX_SUGGESTION_COUNT = 20;

    public function __construct(
        private readonly QuestionRepository $questions,
        private readonly MemberRepository $members,
        private readonly QuestionService $service,
        private readonly Logger $logger,
        private readonly NotificationService $notificationService,
    ) {
    }

    public function create(Request $req, Response $res): Response
    {
        $input = Input::from($req);

        $content = $input->required('content');
        $familyId = $input->required('family_id');
        $toMemberId = $input->required('to_member_id');
        $fromMemberId = $input->optional('from_member_id');

        $questionId = $this->questions->create(
            familyId: $familyId,
            content: $content,
            toMemberId: $toMemberId,
            fromMemberId: $fromMemberId,
            source: QuestionSource::tryFrom((string) $input->optional('source')) ?? QuestionSource::Manual,
            // 시기는 답변을 받은 뒤 결정되므로 보통 비워 둔다.
            era: Era::tryFromValue($input->optional('category')),
        );

        $this->logger->info("질문 생성: {$questionId} / " . \mb_substr($content, 0, 30));

        // 질문 받는 사람에게 푸시 알림 (본인이 보낸 질문이 아닐 때만)
        if ($fromMemberId !== null && $fromMemberId !== $toMemberId) {
            $fromName = $this->members->find($fromMemberId)['name'] ?? '가족';
            $this->notificationService->notify(
                memberId: $toMemberId,
                type: 'question',
                title: $fromName . '님이 질문을 보냈어요',
                body: \mb_substr($content, 0, 50),
                navTarget: '/parent-answer',
                familyId: $familyId,
            );
        }

        return ApiResponse::created($res, $this->present($questionId));
    }

    public function index(Request $req, Response $res): Response
    {
        $input = Input::from($req);

        $rows = $this->questions->search(
            familyId: $input->query('family_id'),
            toMemberId: $input->query('to_member_id'),
            fromMemberId: $input->query('from_member_id'),
            status: QuestionStatus::tryFrom((string) $input->query('status')),
        );

        // 이름과 꼬리 질문 근거를 한 번에 조회한다 (행마다 조회하면 N+1 이 된다).
        $names = $this->members->nameMap(QuestionPresenter::memberIdsIn($rows));
        $origins = $this->questions->followUpOrigins(QuestionPresenter::followUpIdsIn($rows));

        return ApiResponse::json($res, QuestionPresenter::collection($rows, $names, $origins));
    }

    public function show(Request $req, Response $res): Response
    {
        $id = Input::from($req)->route('qid');

        if ($this->questions->find($id) === null) {
            throw new NotFoundException('질문을 찾을 수 없습니다');
        }

        return ApiResponse::json($res, $this->present($id));
    }

    public function destroy(Request $req, Response $res): Response
    {
        $id = Input::from($req)->route('qid');

        if ($this->questions->find($id) === null) {
            throw new NotFoundException('질문을 찾을 수 없습니다');
        }

        $this->questions->delete($id);
        $this->logger->info("질문 삭제: {$id}");

        return ApiResponse::ok($res);
    }

    /** 보낼 질문 후보를 제안한다. */
    public function suggestions(Request $req, Response $res): Response
    {
        $input = Input::from($req);
        $count = \min(
            \max($input->queryInt('count', self::DEFAULT_SUGGESTION_COUNT), 1),
            self::MAX_SUGGESTION_COUNT
        );

        $questions = $this->service->suggest(
            $count,
            Era::tryFromValue($input->query('category')),
            $input->query('family_id'),
            (string) $input->query('from_member_id', ''),
            (string) $input->query('to_member_id', ''),
        );

        return ApiResponse::json($res, ['questions' => $questions]);
    }

    /** 부모 멤버에게 기본 질문을 채운다. */
    public function seed(Request $req, Response $res): Response
    {
        $input = Input::from($req);
        $familyId = $input->required('family_id');
        $parentMemberId = $input->required('parent_member_id');

        $created = $this->service->seedDefaults($familyId, $parentMemberId);

        // 새 질문이 생성되었으면 부모에게 푸시
        if ($created > 0) {
            $this->notificationService->notify(
                memberId: $parentMemberId,
                type: 'question',
                title: '이음이 새 질문을 추천해요',
                body: "{$created}개의 새 질문이 도착했어요. 답변해 보세요!",
                navTarget: '/parent-answer',
                familyId: $familyId,
            );
        }

        return ApiResponse::json($res, ['seeded' => true, 'count' => $created]);
    }

    public function stats(Request $req, Response $res): Response
    {
        $familyId = Input::from($req)->requiredQuery('family_id');

        return ApiResponse::json($res, [
            'pending' => $this->questions->countByStatus($familyId, QuestionStatus::Pending),
            'answered' => $this->questions->countByStatus($familyId, QuestionStatus::Answered),
        ]);
    }

    /** @return array<string, mixed> */
    private function present(string $questionId): array
    {
        $row = $this->questions->find($questionId)
            ?? throw new NotFoundException('질문을 찾을 수 없습니다');

        return QuestionPresenter::one(
            $row,
            $this->members->nameMap(QuestionPresenter::memberIdsIn([$row])),
            $this->questions->followUpOrigins(QuestionPresenter::followUpIdsIn([$row])),
        );
    }
}
