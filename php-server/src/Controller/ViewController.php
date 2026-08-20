<?php

declare(strict_types=1);

namespace Eum\Controller;

use Eum\Domain\MemberRole;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Views\Twig;

/**
 * Twig 페이지 렌더링.
 *
 * 이전에는 페이지마다 거의 같은 메서드가 하나씩 있었다 (15개). 페이지 목록을
 * 표로 선언하고 렌더링 경로를 하나로 합쳤다. 새 페이지는 표에 한 줄만 추가한다.
 */
final class ViewController
{
    /**
     * 경로 → 템플릿 정의.
     *
     *  - `template`: 렌더링할 템플릿 (확장자 제외)
     *  - `byRole`:   역할별로 다른 템플릿을 쓰는 페이지
     *  - `withRole`: 템플릿에 `is_parent` 를 넘길지 여부
     *
     * @var array<string, array{template?: string, byRole?: array<string, string>, withRole?: bool}>
     */
    public const PAGES = [
        '/login' => ['template' => 'login'],
        '/signup' => ['template' => 'signup'],
        '/processing' => ['template' => 'processing'],
        '/parent-answer' => ['template' => 'parent_answer'],
        '/send-question' => ['template' => 'send_question'],
        '/home' => ['byRole' => ['parent' => 'home_parent', 'child' => 'home_child']],
        '/story-child' => ['byRole' => ['parent' => 'story_parent', 'child' => 'story_child']],
        '/story-detail' => ['template' => 'story_detail'],
        '/settings' => ['template' => 'settings', 'withRole' => true],
        '/album' => ['template' => 'album', 'withRole' => true],
        '/calendar' => ['template' => 'calendar', 'withRole' => true],
        '/debug' => ['template' => 'debug'],
        '/debug2' => ['template' => 'debug2'],
        '/debug3' => ['template' => 'debug3'],
    ];

    public function __construct(private readonly Twig $twig)
    {
    }

    /**
     * 표에 정의된 페이지를 렌더링한다.
     */
    public function show(Request $req, Response $res, string $path): Response
    {
        $spec = self::PAGES[$path] ?? null;

        if ($spec === null) {
            return $this->notFound($req, $res);
        }

        $role = $this->role($req);
        $template = $spec['byRole'][$role->value] ?? $spec['template'] ?? null;

        if ($template === null) {
            return $this->notFound($req, $res);
        }

        $data = ($spec['withRole'] ?? false) ? ['is_parent' => $role->isParent()] : [];

        return $this->twig->render($res, "{$template}.html.twig", $data);
    }

    /**
     * 인덱스 페이지. 클라이언트 저장소의 eum_auth 유무에 따라
     * /home 또는 /login 으로 리다이렉트한다.
     */
    public function home(Request $req, Response $res): Response
    {
        return $this->twig->render($res, 'index.html.twig');
    }

    public function auth(Request $req, Response $res): Response
    {
        $requested = $req->getQueryParams()['role'] ?? null;
        $role = MemberRole::tryFrom(\is_string($requested) ? $requested : '') ?? MemberRole::Parent;

        return $this->twig->render($res, 'auth.html.twig', [
            'role' => $role->value,
            'is_parent' => $role->isParent(),
        ]);
    }

    public function notFound(Request $req, Response $res): Response
    {
        return $this->error($res, 404, '요청하신 페이지를 찾을 수 없습니다.');
    }

    private function error(Response $res, int $status, string $message): Response
    {
        return $this->twig
            ->render($res, 'error.html.twig', ['status_code' => $status, 'message' => $message])
            ->withStatus($status);
    }

    /**
     * 역할 쿠키를 읽는다. 슈퍼글로벌 대신 요청 객체에서 읽어야 테스트가 가능하다.
     */
    private function role(Request $req): MemberRole
    {
        $cookie = $req->getCookieParams()['eum_role'] ?? null;

        return MemberRole::tryFrom(\is_string($cookie) ? $cookie : '') ?? MemberRole::Child;
    }

}
