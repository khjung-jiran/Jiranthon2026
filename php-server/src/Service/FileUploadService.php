<?php

declare(strict_types=1);

namespace Eum\Service;

use Eum\Exception\ValidationException;
use Eum\Support\Logger;
use Eum\Support\Paths;
use Eum\Support\Uuid;
use Psr\Http\Message\UploadedFileInterface;

/**
 * 오디오·이미지 업로드 저장.
 *
 * 저장 위치는 {@see Paths} 로 통일했다. 이전에는 컨트롤러가
 * `php-server/uploads` 에 저장하는데 정적 파일 서빙은 프로젝트 루트의
 * `uploads` 를 보고 있어서, 업로드한 파일에 영구히 접근할 수 없었다.
 */
final class FileUploadService
{
    /** 확장자 화이트리스트. 임의 확장자로 저장되는 것을 막는다. */
    private const AUDIO_EXTENSIONS = ['wav', 'mp3', 'm4a', 'aac', 'ogg', 'webm', 'flac'];
    private const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'];

    private const MAX_AUDIO_BYTES = 50 * 1024 * 1024;
    private const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

    public function __construct(private readonly Logger $logger)
    {
    }

    /**
     * @return array{filename: string, path: string, url: string}
     */
    public function storeAudio(UploadedFileInterface $file): array
    {
        return $this->store(
            $file,
            Paths::audioUploads(),
            '/api/audio/',
            self::AUDIO_EXTENSIONS,
            'wav',
            self::MAX_AUDIO_BYTES,
        );
    }

    /**
     * @return array{filename: string, path: string, url: string}
     */
    public function storeImage(UploadedFileInterface $file): array
    {
        return $this->store(
            $file,
            Paths::imageUploads(),
            '/api/image/',
            self::IMAGE_EXTENSIONS,
            'jpg',
            self::MAX_IMAGE_BYTES,
        );
    }

    /**
     * @param  list<string> $allowedExtensions
     * @return array{filename: string, path: string, url: string}
     */
    private function store(
        UploadedFileInterface $file,
        string $directory,
        string $urlPrefix,
        array $allowedExtensions,
        string $defaultExtension,
        int $maxBytes,
    ): array {
        $size = $file->getSize();

        if ($size !== null && $size > $maxBytes) {
            throw new ValidationException(
                \sprintf('파일이 너무 큽니다 (최대 %dMB)', \intdiv($maxBytes, 1024 * 1024))
            );
        }

        $extension = $this->resolveExtension($file, $allowedExtensions, $defaultExtension);

        Paths::ensureDirectory($directory);

        // 파일명은 서버가 생성한다. 클라이언트 이름을 쓰면 경로 조작 위험이 있다.
        $filename = Uuid::slug() . '.' . $extension;
        $path = $directory . '/' . $filename;

        $file->moveTo($path);

        $this->logger->info(\sprintf('업로드: %s (%s bytes)', $filename, $size ?? '?'));

        return [
            'filename' => $filename,
            'path' => $path,
            'url' => $urlPrefix . $filename,
        ];
    }

    /**
     * @param list<string> $allowed
     */
    private function resolveExtension(
        UploadedFileInterface $file,
        array $allowed,
        string $default,
    ): string {
        $clientName = (string) $file->getClientFilename();
        $extension = \strtolower(\pathinfo($clientName, \PATHINFO_EXTENSION));

        return \in_array($extension, $allowed, true) ? $extension : $default;
    }
}
