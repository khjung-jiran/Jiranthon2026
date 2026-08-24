<?php

declare(strict_types=1);

namespace Eum\Controller;

use Eum\Presenter\FamilyPresenter;
use Eum\Presenter\MemberPresenter;
use Eum\Service\AuthService;
use Eum\Service\KakaoOAuthService;
use Eum\Support\Logger;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Views\Twig;

/**
 * 카카오 로그인 화면 흐름.
 *
 *   GET /auth/kakao           → 카카오 인가 페이지로 리다이렉트
 *   GET /auth/kakao/callback  → 인가 코드를 받아 로그인 처리 후 /home 으로 이동
 *
 * 이 서버는 세션을 쓰지 않는다. 로그인 결과는 아이디·비밀번호 로그인과 똑같이
 * 클라이언트 저장소(eum_auth)에 담아야 하므로, 콜백은 JSON 대신 저장 스크립트가
 * 들어 있는 페이지를 렌더링한다.
 */
final class KakaoAuthController
{
    private const CALLBACK_PATH = '/auth/kakao/callback';
    private const STATE_COOKIE = 'eum_kakao_state';

    public function __construct(
        private readonly KakaoOAuthService $kakao,
        private readonly AuthService $auth,
        private readonly Twig $twig,
        private readonly Logger $logger,
    ) {
    }

    public function start(Request $req, Response $res): Response
    {
        if (!$this->kakao->isConfigured()) {
            return $this->fail($res, '카카오 로그인이 아직 설정되지 않았어요. 관리자에게 문의해 주세요.');
        }

        // CSRF 방지: 난수를 쿠키에 심어두고 콜백에서 되돌아온 값과 대조한다.
        $state = \bin2hex(\random_bytes(16));
        $url = $this->kakao->authorizeUrl($this->redirectUri($req), $state);

        return $res
            ->withHeader('Location', $url)
            ->withHeader('Set-Cookie', $this->stateCookie($state, 300))
            ->withStatus(302);
    }

    public function callback(Request $req, Response $res): Response
    {
        // 로그인 성공 여부와 무관하게 일회용 state 쿠키는 지운다.
        $res = $res->withHeader('Set-Cookie', $this->stateCookie('', -1));

        $query = $req->getQueryParams();
        $error = $query['error'] ?? null;

        if (\is_string($error) && $error !== '') {
            $this->logger->warning("카카오: 인가 거부 — {$error}");

            return $this->fail($res, '카카오 로그인이 취소되었어요.');
        }

        $code = $query['code'] ?? null;
        $state = $query['state'] ?? null;
        $expected = $req->getCookieParams()[self::STATE_COOKIE] ?? null;

        if (!\is_string($code) || $code === '') {
            return $this->fail($res, '카카오 인가 코드를 받지 못했어요.');
        }

        if (!\is_string($state) || !\is_string($expected) || !\hash_equals($expected, $state)) {
            $this->logger->warning('카카오: state 불일치 — 요청을 거부합니다');

            return $this->fail($res, '로그인 요청이 만료되었어요. 다시 시도해 주세요.');
        }

        $token = $this->kakao->exchangeCode($code, $this->redirectUri($req));

        if ($token === null) {
            return $this->fail($res, '카카오 인증에 실패했어요. 잠시 후 다시 시도해 주세요.');
        }

        $profile = $this->kakao->profile($token);

        if ($profile === null) {
            return $this->fail($res, '카카오 사용자 정보를 가져오지 못했어요.');
        }

        $result = $this->auth->loginWithKakao($profile['id']);

        // 이미 가입된 카카오 계정이면 바로 로그인 처리.
        if ($result !== null) {
            $family = $result['family'];

            return $this->twig->render($res, 'kakao_callback.html.twig', [
                'auth_json' => $this->json([
                    'member' => MemberPresenter::one($result['member']),
                    'family' => $family === null ? null : FamilyPresenter::one($family),
                    'invite_code' => $family['invite_code'] ?? null,
                ]),
            ]);
        }

        // 최초 로그인: 회원가입 페이지로 유도한다.
        // 카카오 식별 정보를 클라이언트에 임시 저장해 두고, 가입 폼 제출 시 함께 보낸다.
        $this->logger->info("카카오 최초 로그인: 가입 유도 — kakaoId={$profile['id']}");

        return $this->twig->render($res, 'kakao_callback.html.twig', [
            'pending_json' => $this->json([
                'provider' => AuthService::PROVIDER_KAKAO,
                'provider_id' => $profile['id'],
                'nickname' => $profile['nickname'],
                'profile_image' => $profile['profile_image'],
            ]),
        ]);
    }

    /**
     * 리다이렉트 URI. 카카오 콘솔에 등록한 값과 한 글자도 달라선 안 된다.
     * 설정 파일에 값이 있으면 그것을 쓰고, 없으면 현재 요청 주소에서 만든다.
     */
    private function redirectUri(Request $req): string
    {
        $uri = $req->getUri()->withPath(self::CALLBACK_PATH)->withQuery('')->withFragment('');

        return $this->kakao->redirectUri((string) $uri);
    }

    private function fail(Response $res, string $message): Response
    {
        return $this->twig->render($res, 'kakao_callback.html.twig', ['error' => $message]);
    }

    /** @param array<string, mixed> $data */
    private function json(array $data): string
    {
        // 닉네임 등 외부 문자열이 <script> 안으로 들어가므로 태그 문자를 이스케이프한다.
        return (string) \json_encode(
            $data,
            \JSON_UNESCAPED_UNICODE | \JSON_HEX_TAG | \JSON_HEX_AMP | \JSON_HEX_APOS | \JSON_HEX_QUOT,
        );
    }

    private function stateCookie(string $value, int $maxAge): string
    {
        return \sprintf(
            '%s=%s; Path=/; Max-Age=%d; HttpOnly; SameSite=Lax',
            self::STATE_COOKIE,
            $value,
            $maxAge,
        );
    }
}
