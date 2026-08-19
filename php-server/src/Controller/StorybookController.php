<?php

declare(strict_types=1);

namespace Eum\Controller;

use Eum\Http\ApiResponse;
use Eum\Http\Input;
use Eum\Service\StorybookService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class StorybookController
{
    public function __construct(private readonly StorybookService $storybook)
    {
    }

    /** 저장된 일대기를 반환한다. 갱신은 백그라운드로 예약된다. */
    public function show(Request $req, Response $res): Response
    {
        $familyId = Input::from($req)->requiredQuery('family_id');

        return ApiResponse::json($res, ['chapters' => $this->storybook->read($familyId)]);
    }

    /** 일대기를 지금 다시 생성한다 (LLM 호출이 끝날 때까지 대기). */
    public function regenerate(Request $req, Response $res): Response
    {
        $familyId = Input::from($req)->required('family_id');

        return ApiResponse::json($res, ['chapters' => $this->storybook->regenerate($familyId)]);
    }
}
