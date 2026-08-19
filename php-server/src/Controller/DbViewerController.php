<?php

declare(strict_types=1);

namespace Eum\Controller;

use Eum\Support\Paths;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Views\Twig;

/**
 * 개발용 DB 뷰어.
 *
 * 표시할 테이블과 정렬 기준을 코드에 고정해 둔다. 요청 값을 SQL 에 넣지
 * 않으므로 이 페이지를 통해 임의 쿼리를 실행할 수는 없다.
 */
final class DbViewerController
{
    private const ROW_LIMIT = 100;

    /** 테이블 → 정렬 기준 (값은 코드 상수이며 사용자 입력이 아니다) */
    private const TABLES = [
        'families' => 'created_at DESC',
        'members' => 'created_at DESC',
        'member_settings' => 'member_id',
        'questions' => 'created_at DESC',
        'responses' => 'created_at DESC',
        'capsules' => 'created_at DESC',
        'calendar_entries' => 'created_at DESC',
        'photos' => 'created_at DESC',
        'notifications' => 'created_at DESC',
        'polls' => 'created_at DESC',
        'poll_options' => 'vote_count DESC',
        'poll_votes' => 'poll_id',
        'stories' => 'updated_at DESC',
    ];

    /**
     * 이 페이지는 인증이 없다. 비밀번호 해시를 화면에 뿌리지 않는다.
     */
    private const REDACTED_COLUMNS = ['password_hash'];

    public function __construct(
        private readonly \PDO $db,
        private readonly Twig $twig,
    ) {
    }

    public function index(Request $req, Response $res): Response
    {
        $tables = [];

        foreach (self::TABLES as $table => $orderBy) {
            $tables[$table] = $this->readTable($table, $orderBy);
        }

        return $this->twig->render($res, 'db_viewer.html.twig', [
            'tables' => $tables,
            'db_path' => Paths::database(),
            'row_limit' => self::ROW_LIMIT,
            'redacted_columns' => self::REDACTED_COLUMNS,
        ]);
    }

    /**
     * @return array{count: int, columns: list<string>, rows: list<array<string, mixed>>}
     */
    private function readTable(string $table, string $orderBy): array
    {
        $count = (int) $this->db->query("SELECT COUNT(*) FROM {$table}")->fetchColumn();

        if ($count === 0) {
            return ['count' => 0, 'columns' => [], 'rows' => []];
        }

        $rows = $this->db
            ->query("SELECT * FROM {$table} ORDER BY {$orderBy} LIMIT " . self::ROW_LIMIT)
            ->fetchAll();

        return [
            'count' => $count,
            'columns' => $rows === [] ? [] : \array_keys($rows[0]),
            'rows' => $rows,
        ];
    }
}
