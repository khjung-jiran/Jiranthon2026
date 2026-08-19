<?php

declare(strict_types=1);

namespace Eum\Http;

use Eum\Exception\ValidationException;
use Psr\Http\Message\ServerRequestInterface;

/**
 * 요청에서 값을 꺼내는 타입 안전 접근자.
 *
 * 이전 코드는 `$body['family_id']` 처럼 배열에 직접 접근해서, 필드가 빠지면
 * PHP 경고와 함께 500 이 나갔다. 여기서는 누락을 400 으로 정확히 보고한다.
 */
final class Input
{
    /** @param array<string, mixed> $body */
    private function __construct(
        private readonly array $body,
        private readonly ServerRequestInterface $request,
    ) {
    }

    public static function from(ServerRequestInterface $request): self
    {
        $parsed = $request->getParsedBody();

        return new self(\is_array($parsed) ? $parsed : [], $request);
    }

    // ── 본문 ──

    /** 없으면 400 을 던진다. */
    public function required(string $key): string
    {
        $value = $this->optional($key);

        if ($value === null || $value === '') {
            throw ValidationException::missing($key);
        }

        return $value;
    }

    /** 없거나 비어 있으면 `$default`. 빈 문자열은 누락으로 간주한다. */
    public function optional(string $key, ?string $default = null): ?string
    {
        $value = $this->body[$key] ?? null;

        if ($value === null || $value === '') {
            return $default;
        }

        return \is_scalar($value) ? \trim((string) $value) : $default;
    }

    public function integer(string $key, int $default = 0): int
    {
        $value = $this->body[$key] ?? null;

        return \is_numeric($value) ? (int) $value : $default;
    }

    /** `true`, `1`, `"1"`, `"true"` 를 모두 참으로 본다. */
    public function boolean(string $key, bool $default = false): bool
    {
        if (!\array_key_exists($key, $this->body)) {
            return $default;
        }

        return \filter_var($this->body[$key], \FILTER_VALIDATE_BOOL);
    }

    /** @return list<string> */
    public function stringList(string $key): array
    {
        $value = $this->body[$key] ?? null;

        if (!\is_array($value)) {
            return [];
        }

        $items = [];
        foreach ($value as $item) {
            if (\is_scalar($item) && \trim((string) $item) !== '') {
                $items[] = \trim((string) $item);
            }
        }

        return $items;
    }

    /** 본문에 해당 키가 실제로 전달되었는지. 부분 수정(PATCH 유사) 판별에 쓴다. */
    public function has(string $key): bool
    {
        return \array_key_exists($key, $this->body);
    }

    // ── 쿼리스트링 ──

    public function query(string $key, ?string $default = null): ?string
    {
        $value = $this->request->getQueryParams()[$key] ?? null;

        if ($value === null || $value === '') {
            return $default;
        }

        return \is_scalar($value) ? \trim((string) $value) : $default;
    }

    public function requiredQuery(string $key): string
    {
        $value = $this->query($key);

        if ($value === null) {
            throw ValidationException::missing($key);
        }

        return $value;
    }

    public function queryInt(string $key, int $default = 0): int
    {
        $value = $this->request->getQueryParams()[$key] ?? null;

        return \is_numeric($value) ? (int) $value : $default;
    }

    public function queryFlag(string $key): bool
    {
        $value = $this->request->getQueryParams()[$key] ?? null;

        return $value !== null && \filter_var($value, \FILTER_VALIDATE_BOOL);
    }

    // ── 경로 파라미터 ──

    public function route(string $key): string
    {
        $value = $this->request->getAttribute($key);

        if (!\is_string($value) || $value === '') {
            throw ValidationException::missing($key);
        }

        return $value;
    }

    // ── 업로드 ──

    public function file(string $key = 'file'): \Psr\Http\Message\UploadedFileInterface
    {
        $file = $this->request->getUploadedFiles()[$key] ?? null;

        if (!$file instanceof \Psr\Http\Message\UploadedFileInterface) {
            throw new ValidationException('파일이 업로드되지 않았습니다');
        }

        if ($file->getError() !== \UPLOAD_ERR_OK) {
            throw new ValidationException('파일 업로드에 실패했습니다');
        }

        return $file;
    }
}
