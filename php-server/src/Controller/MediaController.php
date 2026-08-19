<?php

declare(strict_types=1);

namespace Eum\Controller;

use Eum\Exception\NotFoundException;
use Eum\Http\Input;
use Eum\Http\MimeTypes;
use Eum\Support\Paths;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Psr7\Stream;

/**
 * 업로드된 오디오·이미지 서빙.
 *
 * 파일명은 `basename()` 으로 정규화한다. 이전 구현은 요청 파라미터를
 * 그대로 경로에 이어 붙여, 인코딩된 `..%2F` 로 업로드 디렉토리 밖의
 * 파일(예: `eum.db`)을 읽어낼 여지가 있었다.
 */
final class MediaController
{
    public function audio(Request $req, Response $res): Response
    {
        return $this->serve($res, Paths::audioUploads(), Input::from($req)->route('filename'));
    }

    public function image(Request $req, Response $res): Response
    {
        return $this->serve($res, Paths::imageUploads(), Input::from($req)->route('filename'));
    }

    private function serve(Response $res, string $directory, string $filename): Response
    {
        $safeName = \basename($filename);
        $path = $directory . '/' . $safeName;

        if ($safeName === '' || !\is_file($path)) {
            throw new NotFoundException('파일을 찾을 수 없습니다');
        }

        $handle = @\fopen($path, 'rb');

        if ($handle === false) {
            throw new NotFoundException('파일을 열 수 없습니다');
        }

        // 스트림으로 내보낸다. 큰 녹음 파일을 메모리에 모두 올리지 않는다.
        return $res
            ->withBody(new Stream($handle))
            ->withHeader('Content-Type', MimeTypes::forPath($path))
            ->withHeader('Content-Length', (string) \filesize($path))
            ->withHeader('Accept-Ranges', 'bytes')
            ->withHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
}
