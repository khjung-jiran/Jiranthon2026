<?php

declare(strict_types=1);

namespace Eum\Database;

use Eum\Support\Paths;

/**
 * SQLite PDO 핸들 생성.
 *
 * WAL 모드를 켜서 백그라운드 스토리 생성 워커가 쓰는 동안에도
 * 웹 요청이 읽기를 계속할 수 있게 한다 (기존에는 `database is locked` 위험).
 */
final class Connection
{
    public static function open(?string $path = null): \PDO
    {
        $path ??= Paths::database();

        $pdo = new \PDO('sqlite:' . $path, null, null, [
            \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
            \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
            \PDO::ATTR_EMULATE_PREPARES => false,
            \PDO::ATTR_STRINGIFY_FETCHES => false,
        ]);

        $pdo->exec('PRAGMA journal_mode = WAL');
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec('PRAGMA busy_timeout = 5000');

        return $pdo;
    }
}
