<?php

declare(strict_types=1);

namespace Eum\Controller;

use Eum\Exception\ValidationException;
use Eum\Http\ApiResponse;
use Eum\Http\Input;
use Eum\Repository\MemberRepository;
use Eum\Repository\PhotoRepository;
use Eum\Service\FileUploadService;
use Eum\Service\NotificationService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\UploadedFileInterface;

final class UploadController
{
    public function __construct(
        private readonly FileUploadService $uploads,
        private readonly PhotoRepository $photos,
        private readonly MemberRepository $members,
        private readonly NotificationService $notificationService,
    ) {
    }

    public function audio(Request $req, Response $res): Response
    {
        $stored = $this->uploads->storeAudio($this->requireFile($req));

        return ApiResponse::ok($res, [
            'file_path' => $stored['path'],
            'filename' => $stored['filename'],
            'url' => $stored['url'],
        ]);
    }

    public function image(Request $req, Response $res): Response
    {
        $stored = $this->uploads->storeImage($this->requireFile($req));

        $input = Input::from($req);
        $familyId = $input->optional('family_id');
        $photoId = null;

        // 가족이 지정되면 앨범에도 등록한다.
        if ($familyId !== null) {
            $photoId = $this->photos->create(
                familyId: $familyId,
                url: $stored['url'],
                label: $input->optional('label'),
                who: $input->optional('who'),
                uploadedBy: $input->optional('uploaded_by'),
            );

            // 가족 전원에게 푸시 (업로더 제외)
            $uploadedBy = $input->optional('uploaded_by');
            $uploaderName = $input->optional('who') ?? ($uploadedBy !== null ? ($this->members->find($uploadedBy)['name'] ?? '가족') : '가족');
            $label = $input->optional('label') ?? '새 사진';
            $familyMembers = $this->members->listByFamily($familyId);
            foreach ($familyMembers as $member) {
                if ($member['id'] === $uploadedBy) {
                    continue;
                }
                $this->notificationService->notify(
                    memberId: (string) $member['id'],
                    type: 'album',
                    title: '새 사진이 올라왔어요',
                    body: "{$uploaderName}님이 사진을 올렸어요: {$label}",
                    navTarget: '/album',
                    familyId: $familyId,
                );
            }
        }

        return ApiResponse::ok($res, [
            'url' => $stored['url'],
            'filename' => $stored['filename'],
            'photo_id' => $photoId,
        ]);
    }

    private function requireFile(Request $req): UploadedFileInterface
    {
        $file = $req->getUploadedFiles()['file'] ?? null;

        if (!$file instanceof UploadedFileInterface) {
            throw new ValidationException('파일이 업로드되지 않았습니다');
        }

        if ($file->getError() !== \UPLOAD_ERR_OK) {
            throw new ValidationException('파일 업로드에 실패했습니다');
        }

        return $file;
    }
}
