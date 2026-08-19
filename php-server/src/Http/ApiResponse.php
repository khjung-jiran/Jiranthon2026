<?php

declare(strict_types=1);

namespace Eum\Http;

use Psr\Http\Message\ResponseInterface;

/**
 * JSON 응답 작성. 한글이 `\uXXXX` 로 깨지지 않도록 인코딩 플래그를 고정한다.
 */
final class ApiResponse
{
    private const ENCODE_FLAGS = \JSON_UNESCAPED_UNICODE | \JSON_UNESCAPED_SLASHES;

    public static function json(ResponseInterface $response, mixed $data, int $status = 200): ResponseInterface
    {
        $response->getBody()->write((string) \json_encode($data, self::ENCODE_FLAGS));

        return $response
            ->withStatus($status)
            ->withHeader('Content-Type', 'application/json; charset=utf-8');
    }

    public static function created(ResponseInterface $response, mixed $data): ResponseInterface
    {
        return self::json($response, $data, 201);
    }

    /** 변경 성공만 알리면 되는 엔드포인트용. 기존 클라이언트 계약을 유지한다. */
    public static function ok(ResponseInterface $response, array $extra = []): ResponseInterface
    {
        return self::json($response, ['success' => true] + $extra);
    }

    public static function error(ResponseInterface $response, string $message, int $status = 400): ResponseInterface
    {
        return self::json($response, ['detail' => $message], $status);
    }

    public static function html(ResponseInterface $response, string $html): ResponseInterface
    {
        $response->getBody()->write($html);

        return $response->withHeader('Content-Type', 'text/html; charset=utf-8');
    }
}
