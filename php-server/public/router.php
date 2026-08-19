<?php
// PHP 내장 서버용 라우터 스크립트
// - /api, / 경로는 index.php(Slim)로 위임
// - 그 외 정적 파일은 내장 서버가 직접 서빙

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// /api, / 루트는 항상 Slim 프론트 컨트롤러로
if (str_starts_with($uri, '/api') || $uri === '/') {
    require __DIR__ . '/index.php';
    return true;
}

// 정적 파일이 존재하면 내장 서버가 서빙하도록 false 반환
$filePath = __DIR__ . $uri;
if (file_exists($filePath) && is_file($filePath)) {
    return false; // PHP 내장 서버가 정적 파일 서빙
}

// 존재하지 않는 파일은 Slim 폴백으로
require __DIR__ . '/index.php';
return true;
