<?php

declare(strict_types=1);

namespace Eum\Service;

use Eum\Support\Logger;
use Eum\Support\Paths;

/**
 * Firebase Cloud Messaging (FCM) 푸시 알림 전송.
 *
 * Firebase Admin SDK 없이 FCM HTTP v1 API 를 직접 호출한다.
 * 흐름:
 *   1. 서비스 계정 JSON 에서 private_key / client_email / project_id 를 읽는다.
 *   2. RS256 서명 JWT 를 만들어 Google OAuth2 토큰 엔드포인트에서 액세스 토큰을 받는다.
 *   3. 액세스 토큰으로 FCM 전송 API 를 호출한다.
 *
 * 액세스 토큰은 1시간 유효하므로 프로세스 내에 캐싱한다.
 * 서비스 계정 파일이 없으면 전송을 건너뛴다 (설정 전에는 조용히 무시).
 */
final class FcmService
{
    private const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
    private const FCM_SEND_URL = 'https://fcm.googleapis.com/v1/projects/%s/messages:send';

    /** @var array<string, mixed>|null 서비스 계정 JSON */
    private ?array $serviceAccount = null;

    /** @var array{token: string, expires_at: int}|null 캐싱된 액세스 토큰 */
    private ?array $accessToken = null;

    public function __construct(private readonly Logger $logger)
    {
    }

    /**
     * 특정 기기(FCM 토큰)에 푸시 알림을 보낸다.
     *
     * @param  string      $fcmToken   수신자 FCM 등록 토큰
     * @param  string      $title      알림 제목
     * @param  string      $body       알림 본문
     * @param  array<string, string> $data  추가 데이터 (앱에서 처리, nav_target 등)
     * @return bool                    전송 성공 여부
     */
    public function send(string $fcmToken, string $title, string $body, array $data = []): bool
    {
        if ($fcmToken === '') {
            return false;
        }

        $account = $this->loadServiceAccount();

        if ($account === null) {
            // 서비스 계정이 설정되지 않음 — 푸시 없이 조용히 진행
            return false;
        }

        $accessToken = $this->getAccessToken($account);

        if ($accessToken === null) {
            $this->logger->error('FCM: 액세스 토큰 발급 실패, 푸시를 건너뜁니다');
            return false;
        }

        $projectId = $account['project_id'];
        $url = \sprintf(self::FCM_SEND_URL, $projectId);

        // FCM HTTP v1 메시지 포맷
        $message = [
            'message' => [
                'token' => $fcmToken,
                'notification' => [
                    'title' => $title,
                    'body' => $body,
                ],
                'data' => $this->stringifyData($data),
                'android' => [
                    'priority' => 'high',
                ],
                'apns' => [
                    'payload' => [
                        'aps' => [
                            'sound' => 'default',
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->httpPost($url, $message, $accessToken);

        if ($response === null) {
            $this->logger->error(\sprintf('FCM: 전송 실패 (토큰=%s...)', \substr($fcmToken, 0, 12)));
            return false;
        }

        $this->logger->info(\sprintf(
            'FCM: 전송 성공 (토큰=%s... / 제목=%s / data=%s)',
            \substr($fcmToken, 0, 12),
            $title,
            \json_encode($this->stringifyData($data), \JSON_UNESCAPED_UNICODE),
        ));

        return true;
    }

    /** 설정이 완료되어 푸시 전송이 가능한지 확인한다. */
    public function isConfigured(): bool
    {
        return $this->loadServiceAccount() !== null;
    }

    // ── 서비스 계정 로딩 ──

    /** @return array<string, mixed>|null */
    private function loadServiceAccount(): ?array
    {
        if ($this->serviceAccount !== null) {
            return $this->serviceAccount;
        }

        $path = Paths::firebaseServiceAccount();

        if (!\is_file($path)) {
            return null;
        }

        $contents = @\file_get_contents($path);

        if ($contents === false) {
            return null;
        }

        $data = \json_decode($contents, true);

        if (!\is_array($data) || !isset($data['project_id'], $data['private_key'], $data['client_email'])) {
            $this->logger->error('FCM: 서비스 계정 JSON 형식이 올바르지 않습니다');
            return null;
        }

        return $this->serviceAccount = $data;
    }

    // ── OAuth2 액세스 토큰 ──

    /**
     * 서비스 계정으로 Google OAuth2 액세스 토큰을 발급받는다.
     * 캐싱된 토큰이 유효하면 재사용한다.
     *
     * @param  array<string, mixed> $account
     * @return string|null
     */
    private function getAccessToken(array $account): ?string
    {
        // 캐싱된 토큰이 유효하면 재사용 (여유 5분)
        if ($this->accessToken !== null && $this->accessToken['expires_at'] > \time() + 300) {
            return $this->accessToken['token'];
        }

        $jwt = $this->buildJwt($account);

        if ($jwt === null) {
            return null;
        }

        $response = $this->httpPostForm(self::OAUTH_TOKEN_URL, [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt,
        ]);

        if ($response === null || !isset($response['access_token'])) {
            return null;
        }

        $this->accessToken = [
            'token' => $response['access_token'],
            'expires_at' => \time() + (int) ($response['expires_in'] ?? 3600),
        ];

        return $this->accessToken['token'];
    }

    /**
     * RS256 서명 JWT 를 생성한다.
     *
     * @param  array<string, mixed> $account
     */
    private function buildJwt(array $account): ?string
    {
        $now = \time();
        $header = ['alg' => 'RS256', 'typ' => 'JWT'];
        $claims = [
            'iss' => $account['client_email'],
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            'aud' => self::OAUTH_TOKEN_URL,
            'iat' => $now,
            'exp' => $now + 3600,
        ];

        $base64Header = $this->base64Url(\json_encode($header) ?: '');
        $base64Claims = $this->base64Url(\json_encode($claims) ?: '');
        $signingInput = $base64Header . '.' . $base64Claims;

        $signature = '';
        $ok = \openssl_sign(
            $signingInput,
            $signature,
            (string) $account['private_key'],
            \OPENSSL_ALGO_SHA256,
        );

        if (!$ok) {
            $this->logger->error('FCM: JWT 서명 실패 — private_key 가 올바른지 확인하세요');
            return null;
        }

        return $signingInput . '.' . $this->base64Url($signature);
    }

    // ── HTTP ──

    /**
     * JSON POST 요청 (Bearer 토큰 인증).
     *
     * @param  array<string, mixed> $body
     * @return array<string, mixed>|null
     */
    private function httpPost(string $url, array $body, string $bearer): ?array
    {
        $ch = \curl_init($url);
        \curl_setopt_array($ch, [
            \CURLOPT_POST => true,
            \CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $bearer,
            ],
            \CURLOPT_POSTFIELDS => \json_encode($body) ?: '',
            \CURLOPT_RETURNTRANSFER => true,
            \CURLOPT_TIMEOUT => 10,
            \CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $result = \curl_exec($ch);
        $status = (int) \curl_getinfo($ch, \CURLINFO_HTTP_CODE);
        $error = \curl_error($ch);
        \curl_close($ch);

        if ($error !== '') {
            $this->logger->error("FCM: HTTP 오류 — {$error}");
            return null;
        }

        if ($status >= 400) {
            $this->logger->error(\sprintf('FCM: HTTP %d — %s', $status, (string) $result));
            return null;
        }

        $decoded = \json_decode((string) $result, true);

        return \is_array($decoded) ? $decoded : null;
    }

    /**
     * form-urlencoded POST 요청 (OAuth 토큰 발급용).
     *
     * @param  array<string, string> $fields
     * @return array<string, mixed>|null
     */
    private function httpPostForm(string $url, array $fields): ?array
    {
        $ch = \curl_init($url);
        \curl_setopt_array($ch, [
            \CURLOPT_POST => true,
            \CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
            \CURLOPT_POSTFIELDS => \http_build_query($fields),
            \CURLOPT_RETURNTRANSFER => true,
            \CURLOPT_TIMEOUT => 10,
            \CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $result = \curl_exec($ch);
        $status = (int) \curl_getinfo($ch, \CURLINFO_HTTP_CODE);
        $error = \curl_error($ch);
        \curl_close($ch);

        if ($error !== '') {
            $this->logger->error("FCM OAuth: HTTP 오류 — {$error}");
            return null;
        }

        if ($status >= 400) {
            $this->logger->error(\sprintf('FCM OAuth: HTTP %d — %s', $status, (string) $result));
            return null;
        }

        $decoded = \json_decode((string) $result, true);

        return \is_array($decoded) ? $decoded : null;
    }

    // ── 유틸 ──

    private function base64Url(string $data): string
    {
        return \rtrim(\strtr(\base64_encode($data), '+/', '-_'), '=');
    }

    /** FCM data 필드는 모든 값이 string 이어야 한다. */
    private function stringifyData(array $data): array
    {
        $result = [];

        foreach ($data as $key => $value) {
            if ($value !== null) {
                $result[(string) $key] = (string) $value;
            }
        }

        return $result;
    }
}
