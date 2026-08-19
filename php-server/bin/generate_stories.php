<?php

/**
 * 백그라운드 스토리 생성 워커.
 * 사용법: php bin/generate_stories.php <family_id>
 */

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

date_default_timezone_set('Asia/Seoul');

use Eum\Container;
use Eum\Database\Connection;
use Eum\Database\Migrator;
use Eum\Support\Logger;
use Eum\Support\Paths;

$pdo = Connection::open();
(new Migrator($pdo, new Logger(Paths::logs())))->migrate();

if ($argc < 2) {
    fwrite(\STDERR, "Usage: php bin/generate_stories.php <family_id>\n");
    exit(1);
}

$familyId = $argv[1];

$container = new Container(
    new Slim\Psr7\Factory\ResponseFactory(),
    false,
);

$container->storybook()->regenerate($familyId);

fwrite(\STDOUT, "Story generation completed for family: {$familyId}\n");
exit(0);
