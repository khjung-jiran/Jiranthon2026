<?php

declare(strict_types=1);

use Eum\Container;
use Eum\Controller\ViewController;
use Eum\Database\Connection;
use Eum\Database\Migrator;
use Eum\Http\Middleware\CorsMiddleware;
use Eum\Support\Logger;
use Eum\Support\Paths;

require_once __DIR__ . '/../vendor/autoload.php';

// ── 부트스트랩 ──
date_default_timezone_set('Asia/Seoul');
$debug = true;

// 데이터베이스 마이그레이션 (요청당 1회, 내부에서 한 번만 실행)
$pdo = Connection::open();
(new Migrator($pdo, new Logger(Paths::logs())))->migrate();

// 업로드 디렉토리 보장
Paths::ensureDirectory(Paths::audioUploads());
Paths::ensureDirectory(Paths::imageUploads());

// ── 앱 + 컨테이너 ──
$app = Slim\Factory\AppFactory::create();
$container = new Container($app->getResponseFactory(), $debug);

// ── 미들웨어 (등록 역순으로 실행) ──
$app->addBodyParsingMiddleware();
$app->addRoutingMiddleware();

// CORS
$app->add(new CorsMiddleware());

// OPTIONS preflight
$app->options('/api/{routes:.+}', function ($req, $res): \Psr\Http\Message\ResponseInterface {
    return $res;
});

// 에러 핸들러
$errorMiddleware = $app->addErrorMiddleware($debug, true, true);
$errorMiddleware->setDefaultErrorHandler($container->errorHandler());

// ── API 라우트 ──
(require __DIR__ . '/../src/routes/api.php')($app, $container);

// ── View 라우트 ──
$views = $container->viewController();

$app->get('/', [$views, 'home']);
$app->get('/auth', [$views, 'auth']);
$app->get('/db', [$container->dbViewerController(), 'index']);

// 표에 정의된 페이지들
foreach (ViewController::PAGES as $path => $_) {
    $app->get($path, function ($req, $res) use ($views, $path) {
        return $views->show($req, $res, $path);
    });
}

// SPA 폴백
$app->get('[/{path:.*}]', [$views, 'notFound']);

$app->run();
