<?php

declare(strict_types=1);

namespace Eum\Service;

use Eum\Support\Logger;
use Eum\Support\Paths;

/**
 * 카카오 로그인 (OAuth 2.0 인가 코드 흐름).
 *
 * SDK 없이 REST API 를 직접 호출한다. 흐름은 세 단계다.
 *   1. 사용자를 kauth.kakao.com 인가 페이지로 보낸다 (authorizeUrl).
 *   2. 돌아온 인가 코드를 액세스 토큰으로 바꾼다 (exchangeCode).
 *   3. 액세스 토큰으로 회원번호·닉네임을 읽는다 (profile).
 *
 * 브라우저와 앱 WebView 가 같은 경로를 타므로 앱에 별도 SDK 가 필요 없다.
 * 설정 파일이 없으면 미설정 상태로 두고, 컨트롤러가 안내 화면을 띄운다.
 */
final class KakaoOAuthService
{
    private const AUTHORIZE_URL = 'https://kauth.kakao.com/oauth/authorize';
    private const TOKEN_URL = 'https://kauth.kakao.com/oauth/token';
    private const PROFILE_URL = 'https://kapi.kakao.com/v2/user/me';

    /** @var array<string, mixed>|null|false 설정 JSON (false = 로딩 실패) */
    private array|null|false $config = null;

    public function __construct(private readonly Logger $logger)
    {
    }

    public function isConfigured(): bool
    {
        return $this->restApiKey() !== null;
    }

    /**
     * 인가 페이지 주소. `state` 는 CSRF 방지용 난수로, 콜백에서 되돌아온 값과
     * 쿠키에 심어둔 값을 비교한다.
     */
    public function authorizeUrl(string $redirectUri, string $state): string
    {
        return self::AUTHORIZE_URL . '?' . \http_build_query([
            'client_id' => (string) $this->restApiKey(),
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'state' => $state,
            // 닉네임·프로필 사진만 받는다. 콘솔에서 동의 항목을 켜둬야 한다.
            'scope' => 'profile_nickname profile_image',
        ]);
    }

    /**
     * 설정에 redirect_uri 가 있으면 그것을, 없으면 현재 요청에서 유추한 주소를
     * 쓴다. 토큰 교환 시 인가 요청 때와 완전히 같은 값을 보내야 한다.
     */
    public function redirectUri(string $fallback): string
    {
        $configured = $this->configValue('redirect_uri');

        return $configured ?? $fallback;
    }

    /** 인가 코드를 액세스 토큰으로 교환한다. */
    public function exchangeCode(string $code, string $redirectUri): ?string
    {
        $key = $this->restApiKey();

        if ($key === null) {
            return null;
        }

        $fields = [
            'grant_type' => 'authorization_code',
            'client_id' => $key,
            'redirect_uri' => $redirectUri,
            'code' => $code,
        ];

        $secret = $this->configValue('client_secret');

        if ($secret !== null) {
            $fields['client_secret'] = $secret;
        }

        $response = $this->httpPostForm(self::TOKEN_URL, $fields);
        $token = $response['access_token'] ?? null;

        if (!\is_string($token) || $token === '') {
            $this->logger->error('카카오: 액세스 토큰 발급 실패');

            return null;
        }

        return $token;
    }

    /**
     * 카카오 회원번호와 프로필을 조회한다.
     *
     * 닉네임 동의를 거부한 사용자도 있으므로 닉네임은 없을 수 있다.
     *
     * @return array{id: string, nickname: string|null, profile_image: string|null}|null
     */
    public function profile(string $accessToken): ?array
    {
        $me = $this->httpGet(self::PROFILE_URL, $accessToken);
        $id = $me['id'] ?? null;

        if ($me === null || (!\is_int($id) && !\is_string($id))) {
            $this->logger->error('카카오: 사용자 정보 조회 실패');

            return null;
        }

        $profile = $me['kakao_account']['profile'] ?? [];
        $nickname = \is_array($profile) ? ($profile['nickname'] ?? null) : null;
        $image = \is_array($profile) ? ($profile['profile_image_url'] ?? null) : null;

        return [
            'id' => (string) $id,
            'nickname' => \is_string($nickname) && $nickname !== '' ? $nickname : null,
            'profile_image' => \is_string($image) && $image !== '' ? $image : null,
        ];
    }

    // ── 설정 ──

    private function restApiKey(): ?string
    {
        return $this->configValue('rest_api_key');
    }

    /** 비어 있거나 예시 문구가 그대로인 값은 미설정으로 본다. */
    private function configValue(string $key): ?string
    {
        $config = $this->loadConfig();
        $value = $config[$key] ?? null;

        if (!\is_string($value)) {
            return null;
        }

        $value = \trim($value);

        return $value === '' || \str_contains($value, '카카오 개발자') || \str_starts_with($value, 'your-')
            ? null
            : $value;
    }

    /** @return array<string, mixed> */
    private function loadConfig(): array
    {
        if (\is_array($this->config)) {
            return $this->config;
        }

        if ($this->config === false) {
            return [];
        }

        $path = Paths::kakaoConfig();
        $contents = \is_file($path) ? @\file_get_contents($path) : false;

        if ($contents === false) {
            $this->config = false;

            return [];
        }

        $data = \json_decode($contents, true);

        if (!\is_array($data)) {
            $this->logger->error('카카오: 설정 JSON 형식이 올바르지 않습니다 — ' . $path);
            $this->config = false;

            return [];
        }

        return $this->config = $data;
    }

    // ── HTTP ──

    /**
     * @param  array<string, string> $fields
     * @return array<string, mixed>|null
     */
    private function httpPostForm(string $url, array $fields): ?array
    {
        $ch = \curl_init($url);
        \curl_setopt_array($ch, [
            \CURLOPT_POST => true,
            \CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded;charset=utf-8'],
            \CURLOPT_POSTFIELDS => \http_build_query($fields),
            \CURLOPT_RETURNTRANSFER => true,
            \CURLOPT_TIMEOUT => 10,
            \CURLOPT_SSL_VERIFYPEER => true,
        ]);

        return $this->send($ch);
    }

    /** @return array<string, mixed>|null */
    private function httpGet(string $url, string $bearer): ?array
    {
        $ch = \curl_init($url);
        \curl_setopt_array($ch, [
            \CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $bearer],
            \CURLOPT_RETURNTRANSFER => true,
            \CURLOPT_TIMEOUT => 10,
            \CURLOPT_SSL_VERIFYPEER => true,
        ]);

        return $this->send($ch);
    }

    /** @return array<string, mixed>|null */
    private function send(\CurlHandle $ch): ?array
    {
        $result = \curl_exec($ch);
        $status = (int) \curl_getinfo($ch, \CURLINFO_HTTP_CODE);
        $error = \curl_error($ch);
        // PHP 8.0 부터 핸들은 스코프를 벗어날 때 자동 해제된다.
        // curl_close() 는 8.5 에서 deprecated 이므로 호출하지 않는다.

        if ($error !== '') {
            $this->logger->error("카카오: HTTP 오류 — {$error}");

            return null;
        }

        if ($status >= 400) {
            $this->logger->error(\sprintf('카카오: HTTP %d — %s', $status, (string) $result));

            return null;
        }

        $decoded = \json_decode((string) $result, true);

        return \is_array($decoded) ? $decoded : null;
    }
}
