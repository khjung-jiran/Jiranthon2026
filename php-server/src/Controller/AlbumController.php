<?php

declare(strict_types=1);

namespace Eum\Controller;

use Eum\Exception\ForbiddenException;
use Eum\Exception\NotFoundException;
use Eum\Http\ApiResponse;
use Eum\Http\Input;
use Eum\Presenter\PhotoPresenter;
use Eum\Repository\PhotoRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class AlbumController
{
    public function __construct(private readonly PhotoRepository $photos)
    {
    }

    public function index(Request $req, Response $res): Response
    {
        $input = Input::from($req);

        $rows = $this->photos->search(
            $input->requiredQuery('family_id'),
            $input->query('who'),
        );

        return ApiResponse::json($res, PhotoPresenter::collection($rows));
    }

    public function destroy(Request $req, Response $res): Response
    {
        $input = Input::from($req);
        $id = $input->route('pid');
        $memberId = $input->requiredQuery('member_id');

        $photo = $this->photos->find($id);

        if ($photo === null) {
            throw new NotFoundException('사진을 찾을 수 없습니다');
        }

        if (($photo['uploaded_by'] ?? null) !== $memberId) {
            throw new ForbiddenException('사진은 올린 사람만 삭제할 수 있습니다');
        }

        $this->photos->delete($id);

        return ApiResponse::ok($res);
    }
}
