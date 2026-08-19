<?php

declare(strict_types=1);

namespace Eum\Controller;

use Eum\Domain\InputMethod;
use Eum\Exception\NotFoundException;
use Eum\Http\ApiResponse;
use Eum\Http\Input;
use Eum\Presenter\ResponsePresenter;
use Eum\Repository\MemberRepository;
use Eum\Repository\QuestionRepository;
use Eum\Repository\ResponseRepository;
use Eum\Service\NotificationService;
use Eum\Service\QuestionService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class ResponseController
{
    public function __construct(
        private readonly ResponseRepository $responses,
        private readonly QuestionRepository $questions,
        private readonly QuestionService $service,
        private readonly MemberRepository $members,
        private readonly NotificationService $notificationService,
    ) {
    }

    public function create(Request $req, Response $res): Response
    {
        $input = Input::from($req);
        $questionId = $input->required('question_id');
        $memberId = $input->required('member_id');

        // 존재하지 않는 질문에 답변이 매달리는 것을 막는다.
        $question = $this->questions->find($questionId)
            ?? throw new NotFoundException('질문을 찾을 수 없습니다');

        $response = $this->service->recordAnswer(
            questionId: $questionId,
            memberId: $memberId,
            content: (string) $input->optional('content', ''),
            inputMethod: InputMethod::fromValue($input->optional('input_method')),
            audioFilePath: $input->optional('audio_file_path'),
            transcript: $input->optional('transcript'),
            era: $input->optional('era'),
            duration: $input->optional('duration'),
        );

        // 질문 보낸 사람에게 답변 도착 푸시 (본인이 답한 경우 제외)
        $fromMemberId = $question['from_member_id'] ?? null;
        if ($fromMemberId !== null && $fromMemberId !== $memberId) {
            $answererName = $this->members->find($memberId)['name'] ?? '가족';
            $this->notificationService->notify(
                memberId: $fromMemberId,
                type: 'response',
                title: $answererName . '님의 답변이 도착했어요',
                body: \mb_substr((string) ($response['content'] ?? $question['content']), 0, 50),
                navTarget: '/home',
                familyId: $question['family_id'] ?? null,
            );
        }

        return ApiResponse::created($res, ResponsePresenter::one($response));
    }

    public function index(Request $req, Response $res): Response
    {
        $input = Input::from($req);

        $rows = $this->responses->search(
            familyId: $input->query('family_id'),
            questionId: $input->query('question_id'),
            memberId: $input->query('member_id'),
        );

        return ApiResponse::json($res, ResponsePresenter::collection($rows));
    }
}
