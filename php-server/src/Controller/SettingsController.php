<?php

declare(strict_types=1);

namespace Eum\Controller;

use Eum\Exception\ValidationException;
use Eum\Http\ApiResponse;
use Eum\Http\Input;
use Eum\Presenter\SettingsPresenter;
use Eum\Repository\SettingsRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class SettingsController
{
    public function __construct(private readonly SettingsRepository $settings)
    {
    }

    public function show(Request $req, Response $res): Response
    {
        $memberId = Input::from($req)->requiredQuery('member_id');

        return ApiResponse::json($res, SettingsPresenter::one($this->settings->findOrCreate($memberId)));
    }

    public function update(Request $req, Response $res): Response
    {
        $input = Input::from($req);
        $memberId = $input->requiredQuery('member_id');

        $this->settings->findOrCreate($memberId);

        $changes = [];

        if ($input->has('font_size')) {
            $fontSize = $input->required('font_size');

            if (!\in_array($fontSize, SettingsRepository::FONT_SIZES, true)) {
                throw new ValidationException(
                    'font_size는 다음 중 하나여야 합니다: ' . \implode(', ', SettingsRepository::FONT_SIZES)
                );
            }

            $changes['font_size'] = $fontSize;
        }

        if ($input->has('voice_guide')) {
            $changes['voice_guide'] = $input->boolean('voice_guide') ? 1 : 0;
        }

        if ($input->has('auto_translate')) {
            $changes['auto_translate'] = $input->boolean('auto_translate') ? 1 : 0;
        }

        $this->settings->update($memberId, $changes);

        // 갱신된 설정을 그대로 돌려줘서 클라이언트가 재조회하지 않아도 되게 한다.
        return ApiResponse::json($res, SettingsPresenter::one($this->settings->findOrCreate($memberId)));
    }
}
