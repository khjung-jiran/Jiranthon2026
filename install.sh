#!/bin/bash
#
# install.sh — 이음(EIUM) 서버 환경 구성 스크립트
#
# 클론 직후 실행하면 PHP 서버 + Python 모듈(STT/TTS/질문엔진) 구동에 필요한
# 모든 것을 로컬 경로에 맞춰 준비한다.
#
# 사용법:
#   git clone <repo> Jiranthon2026
#   cd Jiranthon2026
#   ./install.sh
#
# 옵션:
#   --skip-python   Python 가상환경/의존성 설치를 건너뛴다 (PHP 서버만 필요할 때)
#   --skip-ssl      자가 서명 SSL 인증서 생성을 건너뛴다
#   -h, --help      도움말
#

set -euo pipefail

# ── 경로 ──
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
PHP_SERVER_DIR="$PROJECT_ROOT/php-server"
CONFIG_DIR="$PHP_SERVER_DIR/config"
INIT_DIR="$PROJECT_ROOT/init.d"
SSL_DIR="$HOME/apache-ssl"

SKIP_PYTHON=0
SKIP_SSL=0

# ── 인자 파싱 ──
for arg in "$@"; do
    case "$arg" in
        --skip-python) SKIP_PYTHON=1 ;;
        --skip-ssl)    SKIP_SSL=1 ;;
        -h|--help)
            sed -n '2,18p' "$0" | sed 's/^# \?//'
            exit 0
            ;;
        *)
            echo "Unknown option: $arg" >&2
            exit 1
            ;;
    esac
done

# ── 유틸 ──
c_ok()    { printf "  \033[32m✓\033[0m %s\n" "$1"; }
c_fail()  { printf "  \033[31m✗\033[0m %s\n" "$1"; }
c_warn()  { printf "  \033[33m!\033[0m %s\n" "$1"; }
c_info()  { printf "  \033[36m→\033[0m %s\n" "$1"; }
section() { printf "\n\033[1m\033[36m[%s]\033[0m\n" "$1"; }

require_cmd() {
    if ! command -v "$1" >/dev/null 2>&1; then
        c_fail "$1 이(가) 설치되어 있지 않습니다"
        echo "    설치: $2" >&2
        return 1
    fi
    c_ok "$1"
}

# ── 시작 ──
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   이음(EIUM) 서버 환경 구성                  ║"
echo "╚══════════════════════════════════════════════╝"
echo "  프로젝트 경로: $PROJECT_ROOT"

# ── 1. 필수 명령 확인 ──
section "1/7  필수 명령 확인"
FAIL=0
require_cmd php    "brew install php@8.2 (또는 8.x)" || FAIL=1
require_cmd composer "brew install composer" || FAIL=1

# PHP 버전 확인 (8.2+)
if command -v php >/dev/null 2>&1; then
    PHP_VER=$(php -r 'echo PHP_MAJOR_VERSION . "." . PHP_MINOR_VERSION;')
    PHP_OK=$(php -r 'echo version_compare(PHP_VERSION, "8.2.0", ">=") ? "yes" : "no";')
    if [ "$PHP_OK" = "yes" ]; then
        c_ok "PHP $PHP_VER (>= 8.2)"
    else
        c_fail "PHP $PHP_VER — 8.2 이상이 필요합니다"
        FAIL=1
    fi
    # 필수 확장 (php -m | grep 조합은 pipefail + SIGPIPE 로 오작동할 수 있어
    # extension_loaded() 로 직접 확인한다)
    for ext in pdo_sqlite json mbstring curl; do
        if php -r "echo extension_loaded('$ext') ? '1' : '0';" | grep -q 1; then
            c_ok "ext-$ext"
        else
            c_fail "ext-$ext 미설치"
            FAIL=1
        fi
    done
fi

if [ "$SKIP_PYTHON" -eq 0 ]; then
    require_cmd python3 "brew install python@3.12" || FAIL=1
fi

if [ "$FAIL" -ne 0 ]; then
    echo ""
    c_fail "필수 명령이 부족합니다. 위 설치 안내를 참고해 주세요."
    exit 1
fi

# ── 2. PHP 의존성 ──
section "2/7  PHP 의존성 설치 (composer install)"
(
    cd "$PHP_SERVER_DIR"
    if [ -f composer.lock ]; then
        composer install --no-interaction --no-progress --optimize-autoloader
    else
        composer install --no-interaction --no-progress
    fi
)
c_ok "PHP 의존성 설치 완료"

# ── 3. 디렉토리 구조 ──
section "3/7  디렉토리 구조 생성"
mkdir -p "$PROJECT_ROOT/logs"
mkdir -p "$PROJECT_ROOT/uploads/audio"
mkdir -p "$PROJECT_ROOT/uploads/images"
mkdir -p "$PHP_SERVER_DIR/cache/twig"
c_ok "logs/, uploads/{audio,images}/, cache/twig/"

# ── 4. 설정 파일 ──
section "4/7  설정 파일 준비"

# 카카오
if [ ! -f "$CONFIG_DIR/kakao.json" ]; then
    cp "$CONFIG_DIR/kakao.example.json" "$CONFIG_DIR/kakao.json"
    c_info "config/kakao.json 생성 (예시값 — 실제 REST API 키 입력 필요)"
else
    c_ok "config/kakao.json 이미 존재"
fi

# Firebase
if [ ! -f "$CONFIG_DIR/firebase-service-account.json" ]; then
    cp "$CONFIG_DIR/firebase-service-account.example.json" "$CONFIG_DIR/firebase-service-account.json"
    c_info "config/firebase-service-account.json 생성 (예시값 — FCM 미사용시 그대로 두면 됨)"
else
    c_ok "config/firebase-service-account.json 이미 존재"
fi

# ── 5. Python 가상환경 (옵션) ──
if [ "$SKIP_PYTHON" -eq 0 ]; then
    section "5/7  Python 가상환경 + 의존성"
    if [ ! -d "$PROJECT_ROOT/.venv" ]; then
        c_info "python3 -m venv .venv"
        python3 -m venv "$PROJECT_ROOT/.venv"
    else
        c_ok ".venv 이미 존재"
    fi

    # requirements.txt 가 있으면 설치
    if [ -f "$PROJECT_ROOT/requirements.txt" ]; then
        c_info "pip install -r requirements.txt"
        "$PROJECT_ROOT/.venv/bin/pip" install --upgrade pip >/dev/null 2>&1 || true
        "$PROJECT_ROOT/.venv/bin/pip" install -r "$PROJECT_ROOT/requirements.txt"
        c_ok "Python 의존성 설치 완료"
    else
        c_warn "requirements.txt 없음 — Python 의존성 설치 건너뜀"
    fi
else
    section "5/7  Python 가상환경 (건너뜀)"
    c_warn "--skip-python 옵션으로 Python 설치를 건너뛰었습니다"
fi

# ── 6. SSL 인증서 (옵션) ──
if [ "$SKIP_SSL" -eq 0 ]; then
    section "6/7  자가 서명 SSL 인증서 (stunnel용)"
    mkdir -p "$SSL_DIR"
    if [ -f "$SSL_DIR/server.crt" ] && [ -f "$SSL_DIR/server.key" ]; then
        c_ok "SSL 인증서 이미 존재 ($SSL_DIR/server.crt)"
    else
        if command -v openssl >/dev/null 2>&1; then
            c_info "openssl 로 자가 서명 인증서 생성"
            openssl req -x509 -newkey rsa:2048 -nodes \
                -keyout "$SSL_DIR/server.key" \
                -out "$SSL_DIR/server.crt" \
                -days 3650 \
                -subj "/CN=localhost" \
                >/dev/null 2>&1
            c_ok "SSL 인증서 생성 완료 ($SSL_DIR/server.crt, 10년 유효)"
        else
            c_warn "openssl 없음 — SSL 인증서 생성 건너뜀 (HTTPS 미사용 시 무방)"
        fi
    fi
else
    section "6/7  SSL 인증서 (건너뜀)"
fi

# ── 7. 시작 스크립트 / stunnel.conf 경로 보정 ──
section "7/7  시작 스크립트 경로 보정"

# stunnel.conf 를 현재 경로에 맞게 (재)생성
cat > "$INIT_DIR/stunnel.conf" <<EOF
; 이음 PHP 서버 HTTPS 래퍼 (stunnel)
; HTTPS 443 → PHP 내장 서버 8000
; install.sh 가 생성함 — 경로는 클론 위치에 맞춰 자동 설정됨

cert = $SSL_DIR/server.crt
key = $SSL_DIR/server.key
pid = $INIT_DIR/stunnel.pid
output = $INIT_DIR/stunnel.log
foreground = no
debug = info

[eum-https]
accept = 443
connect = 127.0.0.1:8000
EOF
c_ok "init.d/stunnel.conf 경로 보정"

# httpd 시작 스크립트를 현재 경로에 맞게 (재)생성
cat > "$INIT_DIR/httpd" <<'SCRIPT'
#!/bin/bash
#
# httpd — 이음 PHP 서버 시작/중지/재시작 스크립트
# PHP 내장 서버(8000) + stunnel(443 HTTPS) 함께 구동
# install.sh 가 생성함 — PROJECT_ROOT 는 이 스크립트 위치 기준
#

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PHP_SERVER_DIR="$PROJECT_ROOT/php-server"
PORT=8000
HTTPS_PORT=443
PID_FILE="$SCRIPT_DIR/httpd.pid"
LOG_FILE="$SCRIPT_DIR/httpd.log"
STUNNEL_CONF="$SCRIPT_DIR/stunnel.conf"
STUNNEL_PID="$SCRIPT_DIR/stunnel.pid"
STUNNEL_LOG="$SCRIPT_DIR/stunnel.log"
STUNNEL_BIN="${STUNNEL_BIN:-/opt/homebrew/bin/stunnel}"

start() {
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        echo "httpd already running (PID $(cat "$PID_FILE"))"
        return 1
    fi
    echo "Starting httpd on port $PORT ..."
    cd "$PHP_SERVER_DIR"
    nohup php -S 0.0.0.0:$PORT -t public public/router.php > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    sleep 1
    if kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        echo "httpd started (PID $(cat "$PID_FILE"))"
    else
        echo "httpd failed to start — check $LOG_FILE"
        rm -f "$PID_FILE"
        return 1
    fi

    # stunnel HTTPS 래퍼 시작
    if [ -x "$STUNNEL_BIN" ] && [ -f "$STUNNEL_CONF" ]; then
        echo "Starting stunnel (HTTPS $HTTPS_PORT → $PORT) ..."
        "$STUNNEL_BIN" "$STUNNEL_CONF"
        sleep 1
        if [ -f "$STUNNEL_PID" ] && kill -0 "$(cat "$STUNNEL_PID")" 2>/dev/null; then
            echo "stunnel started (PID $(cat "$STUNNEL_PID")) — https://0.0.0.0:$HTTPS_PORT"
        else
            echo "stunnel failed to start — check $STUNNEL_LOG"
        fi
    else
        echo "stunnel not found — HTTPS disabled (HTTP only on port $PORT)"
    fi
}

stop() {
    if [ -f "$STUNNEL_PID" ]; then
        SPID=$(cat "$STUNNEL_PID")
        if kill -0 "$SPID" 2>/dev/null; then
            echo "Stopping stunnel (PID $SPID) ..."
            kill "$SPID"
            sleep 1
            if kill -0 "$SPID" 2>/dev/null; then kill -9 "$SPID"; fi
            echo "stunnel stopped"
        fi
        rm -f "$STUNNEL_PID"
    fi

    if [ ! -f "$PID_FILE" ]; then
        echo "httpd not running"
        return 0
    fi
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "Stopping httpd (PID $PID) ..."
        kill "$PID"
        sleep 1
        if kill -0 "$PID" 2>/dev/null; then kill -9 "$PID"; fi
        echo "httpd stopped"
    else
        echo "httpd not running (stale PID file)"
    fi
    rm -f "$PID_FILE"
}

restart() { stop; start; }

status() {
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        echo "httpd running (PID $(cat "$PID_FILE")) on port $PORT"
    else
        echo "httpd not running"
    fi
    if [ -f "$STUNNEL_PID" ] && kill -0 "$(cat "$STUNNEL_PID")" 2>/dev/null; then
        echo "stunnel running (PID $(cat "$STUNNEL_PID")) on port $HTTPS_PORT (HTTPS)"
    else
        echo "stunnel not running"
    fi
}

case "$1" in
    start)   start ;;
    stop)    stop ;;
    restart) restart ;;
    status)  status ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
SCRIPT
chmod +x "$INIT_DIR/httpd"
c_ok "init.d/httpd 경로 보정 + 실행 권한 부여"

# ── 완료 ──
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   설치 완료                                  ║"
echo "╚══════════════════════════════════════════════╝"

echo ""
echo "다음 단계:"
echo ""
echo "  1. 카카오 로그인을 사용하면"
echo "     php-server/config/kakao.json 에 REST API 키 입력"
echo ""
echo "  2. FCM 푸시를 사용하면"
echo "     php-server/config/firebase-service-account.json 에 서비스 계정 키 입력"
echo ""
echo "  3. 서버 시작"
echo "     ./init.d/httpd start"
echo ""
echo "  4. 접속 확인"
echo "     http://localhost:8000/login        (HTTP)"
echo "     https://localhost/login             (HTTPS, stunnel 설치 시)"
echo ""
echo "  5. 서버 중지"
echo "     ./init.d/httpd stop"
echo ""
echo "  옵션:"
echo "    --skip-python   Python(STT/TTS/질문엔진) 설치 건너뛰기"
echo "    --skip-ssl      SSL 인증서 생성 건너뛰기"
echo ""
