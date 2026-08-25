# 이음 (EIUM, Voice of Family)

> 자녀가 부모님께 질문하고, 부모님이 음성/텍스트로 응답하며, 그 답변들을 모아
> 스토리북으로 만드는 가족 소통 프로젝트

## 프로젝트 개요

```
[Android 앱 - 자녀 모드] ──질문 생성/전송──▶ [PHP 서버] ──질문 전달──▶ [Android 앱 - 부모 모드]
                                                                        │
                                                                   TTS 발화 / 텍스트 표시
                                                                        │
                                                                   STT 음답 / 텍스트 입력
                                                                        │
[스토리북] ◀──Q&A 데이터── [PHP 서버] ◀──응답 저장── [Android 앱 - 부모 모드]
```

### 핵심 플로우

1. **질문 생성**: 자녀가 직접 질문을 작성하거나, 시스템이 자동으로 질문을 생성
2. **질문 전달**: PHP 서버를 통해 부모 모드로 질문 전송 (FCM 푸시 알림)
3. **질문 발화**: 부모 모드에서 TTS로 질문을 음성 발화하거나 텍스트로 표시
4. **응답 수집**: 부모님이 STT(음성) 또는 직접 텍스트 입력으로 응답
5. **데이터 저장**: 서버에 Q&A 페어 저장
6. **스토리북 생성**: 저장된 Q&A를 바탕으로 부모님의 스토리북 생성
7. **가족 캘린더/앨범**: 사진과 함께 기록을 남기고, 부모/자녀 모두 음성 또는 텍스트로 댓글 작성

## 폴더 구조

```
Jiranthon2026/
├── README.md                   # 프로젝트 전체 개요 (이 파일)
├── install.sh                  # 환경 구성 스크립트 (PHP + Python + SSL 한 번에)
├── requirements.txt            # Python 전체 의존성 (STT/TTS/질문엔진)
├── eum.db                      # SQLite 데이터베이스 (실제 데이터)
│
├── php-server/                 # 백엔드 — PHP 8.x + Slim 4 + Twig 3
│   ├── AGENTS.md               # PHP 서버 개발 가이드 (템플릿/CSS 규칙)
│   ├── README.md               # PHP 서버 상세 문서
│   ├── composer.json
│   ├── apache-vhost.conf       # Apache 가상호스트 설정
│   ├── public/                 # DocumentRoot
│   │   ├── index.php           # Slim 부트스트랩
│   │   ├── router.php          # PHP 내장 서버용 라우터
│   │   └── css/                # 정적 스타일시트 (eium.css)
│   ├── src/
│   │   ├── Container.php       # DI 컨테이너
│   │   ├── Controller/         # 16개 컨트롤러 (API + View)
│   │   ├── Service/            # 비즈니스 로직 (Auth, FCM, Story, Speech ...)
│   │   ├── Repository/         # 데이터 접근 계층 (PDO SQLite)
│   │   ├── Presenter/          # API 응답 직렬화 계층
│   │   ├── Domain/             # 도메인 enum/값 객체
│   │   ├── Database/           # PDO 연결 + 마이그레이터
│   │   ├── Http/               # 미들웨어 (CORS 등)
│   │   ├── Support/            # Logger, Paths 유틸
│   │   ├── Exception/
│   │   └── routes/api.php      # API 라우트 정의
│   ├── templates/              # Twig 템플릿 (20개 화면)
│   ├── migrations/schema.sql   # SQLite 스키마
│   ├── config/                 # kakao.json, firebase-service-account.json (.gitignore)
│   └── data/eum.db             # 개발용 DB (루트 eum.db 와 별도)
│
├── mobile/                     # Android 네이티브 앱 (WebView 래퍼)
│   ├── README.md               # 앱 빌드 가이드
│   ├── app/                    # Android 모듈
│   │   └── src/main/java/jiranSecurity/eium_app/
│   │       ├── AppConfig.kt        # BASE_URL 등 설정
│   │       ├── MainActivity.kt     # WebView + 브릿지
│   │       ├── MyFirebaseMessagingService.kt  # FCM 수신
│   │       └── FcmApi.kt           # FCM 토큰 등록/해제
│   └── gradle/
│
├── stt/                        # 음성 → 텍스트 변환 (Speech-to-Text)
│   ├── README.md
│   ├── stt_runner.py           # CLI 진입점
│   ├── file_transcribe.py      # 파일 변환 (Whisper / Google)
│   ├── realtime_stt.py         # 실시간 마이크 인식
│   └── requirements.txt
│
├── tts/                        # 텍스트 → 음성 변환 (Text-to-Speech)
│   ├── README.md
│   ├── tts_engine.py           # edge-tts 엔진
│   ├── tts_runner.py           # CLI 진입점
│   └── requirements.txt
│
├── question-engine/            # 질문 생성 엔진 (수동 + 자동)
│   ├── README.md
│   ├── README.llm.md           # LLM 연동 가이드
│   ├── auto_question.py        # 자동 질문 생성
│   ├── local_llm.py            # Ollama 로컬 LLM 연동
│   ├── question_templates.py   # 카테고리별 템플릿
│   └── requirements.txt
│
├── init.d/                     # 서버 시작/중지 스크립트 + SSL 래퍼
│   ├── httpd                   # PHP 내장 서버 + stunnel 제어
│   ├── stunnel.conf            # HTTPS 443 → 8000 래핑 (install.sh 가 생성)
│   ├── httpd.{pid,log}         # 런타임 파일
│   └── stunnel.{pid,log}
│
├── tools/
│   └── plog                    # 로그 유틸
│
├── uploads/                    # 업로드 파일 (audio/, images/)
├── logs/                       # 애플리케이션 로그
│
└── docs/                       # 설계 문서
    ├── architecture.md
    ├── api-spec.md
    ├── design-map.md
    ├── roadmap.md
    └── process/                # 프로세스 정의 (auth, child, parent, family ...)
```

## 기술 스택

| 영역 | 기술 |
|------|------|
| 백엔드 | PHP 8.2+ / Slim 4 / Twig 3 |
| 데이터베이스 | SQLite (PDO) |
| 프론트엔드 | 서버 사이드 렌더링 (Twig) + 통합 CSS (`eium.css`) |
| 모바일 앱 | Android (Kotlin) — WebView 래퍼 + FCM 푸시 |
| STT | OpenAI Whisper (오프라인) / Google Web Speech API (온라인) |
| TTS | edge-tts (Microsoft Edge TTS) |
| 질문 엔진 | Ollama 로컬 LLM + 카테고리 템플릿 |
| 인증 | 아이디/비밀번호 + 카카오 로그인 (OAuth) |
| 푸시 | Firebase Cloud Messaging (FCM) |
| HTTPS | stunnel (자가 서명 인증서, 개발용) |

## 빠른 시작

### 1. 환경 구성 (한 번에)

```bash
git clone <repo> Jiranthon2026
cd Jiranthon2026
./install.sh
```

`install.sh` 가 아래를 자동으로 처리합니다:

1. PHP 8.2+ / composer / 필수 확장 (`pdo_sqlite`, `json`, `mbstring`, `curl`) 확인
2. `composer install` (PHP 의존성)
3. `logs/`, `uploads/{audio,images}/`, `cache/twig/` 디렉토리 생성
4. `config/kakao.json`, `config/firebase-service-account.json` 예시 복사
5. Python 가상환경 (`.venv`) + `pip install -r requirements.txt`
6. 자가 서명 SSL 인증서 생성 (`~/apache-ssl/`)
7. `init.d/httpd`, `init.d/stunnel.conf` 경로 보정

옵션:

```bash
./install.sh --skip-python   # Python(STT/TTS/질문엔진) 설치 건너뛰기
./install.sh --skip-ssl      # SSL 인증서 생성 건너뛰기
```

### 2. 외부 의존성 (수동)

- **FFmpeg** (오디오 변환용, m4a → wav)
  - macOS: `brew install ffmpeg`
  - Ubuntu: `sudo apt install ffmpeg`
  - Windows: `winget install Gyan.FFmpeg`
- **Whisper 모델**: 최초 실행 시 자동 다운로드 (`~/.cache/whisper/`)
- **Ollama** (자동 질문 생성 사용 시): https://ollama.com

### 3. 서버 실행

```bash
./init.d/httpd start       # PHP 내장 서버(8000) + stunnel(443 HTTPS) 함께 구동
./init.d/httpd status      # 상태 확인
./init.d/httpd stop        # 중지
./init.d/httpd restart     # 재시작
```

접속 주소:

| 주소 | 설명 |
|------|------|
| `http://<IP>:8000/login` | 로그인 (HTTP) |
| `https://<IP>/login` | 로그인 (HTTPS, stunnel 설치 시) |
| `http://<IP>:8000/signup` | 회원가입 |
| `http://<IP>:8000/home` | 홈 (부모/자녀 역할 자동 분기) |
| `http://<IP>:8000/api/...` | REST API |

> Apache 사용 시 `php-server/apache-vhost.conf` 를 참고해 가상호스트를 설정합니다.

### 4. Android 앱 빌드

```bash
cd mobile
# app/google-services.json 배치 (Firebase 콘솔에서 다운로드)
# AppConfig.kt 의 BASE_URL 을 서버 주소로 맞춤
./gradlew assembleDebug
```

자세한 내용은 [mobile/README.md](mobile/README.md) 참고.

### 5. Python 모듈 단독 실행

```bash
# 가상환경 활성화
source .venv/bin/activate

# STT 파일 변환
python stt/stt_runner.py file recording.m4a whisper
python stt/stt_runner.py file recording.m4a google

# TTS 합성
python tts/tts_runner.py "안녕하세요" output.mp3
```

> PHP 서버는 `shell_exec` 로 위 Python 스크립트를 호출해 STT/TTS/질문생성을 수행합니다.

## 화면 목록 (Twig 템플릿)

| 경로 | 템플릿 | 설명 |
|------|--------|------|
| `/login` | `login.html.twig` | 로그인 (아이디/비밀번호 + 카카오) |
| `/signup` | `signup.html.twig` | 회원가입 + 약관 동의 |
| `/home` | `home_{parent,child}.html.twig` | 홈 (역할 자동 분기, 알림 벨) |
| `/story-child` | `story_{parent,child}.html.twig` | 이야기 목록 (역할 분기) |
| `/story-detail` | `story_detail.html.twig` | 이야기 상세 (글자 크기 조절, 페이징) |
| `/send-question` | `send_question.html.twig` | 자녀 질문 전송 |
| `/parent-answer` | `parent_answer.html.twig` | 부모 답변 작성 |
| `/album` | `album.html.twig` | 가족 앨범 (최근 사진 hero 표시) |
| `/calendar` | `calendar.html.twig` | 가족 캘린더 (월 이동, D+N 표시) |
| `/settings` | `settings.html.twig` | 설정 |
| `/processing` | `processing.html.twig` | 전송 중 풀스크린 오버레이 |
| `/auth` | `auth.html.twig` | 구버전 인증 (재작성 예정) |

## API 엔드포인트

전체 라우트는 `php-server/src/routes/api.php` 에 정의되어 있습니다.
상세 목록은 [php-server/README.md](php-server/README.md) 참고.

주요 그룹:

- **Family / Auth** — 가족 생성/참여, 멤버, 로그인, FCM 토큰, 카카오 OAuth
- **Questions** — 질문 CRUD, AI 추천, 시드, 통계
- **Responses** — 답변 생성/목록
- **Storybook** — 스토리북 조회/재생성
- **Capsule** — 타임캡슐 생성/열람
- **Calendar** — 일정 CRUD
- **Album** — 사진 목록/삭제
- **Notifications** — 알림 생성/조회/읽음/삭제
- **Polls** — 투표 생성/참여
- **Settings** — 설정 조회/수정
- **Voice** — STT 변환 / TTS 합성
- **Uploads / Media** — 오디오/이미지 업로드

## 설정 파일 (커밋 금지)

| 파일 | 용도 | 비고 |
|------|------|------|
| `php-server/config/kakao.json` | 카카오 로그인 REST API 키 | `.gitignore` — 없으면 카카오 버튼 비활성 |
| `php-server/config/firebase-service-account.json` | FCM 푸시 서비스 계정 키 | `.gitignore` — 없으면 푸시 미전송 |
| `mobile/app/google-services.json` | Android Firebase 설정 | 저장소 미포함 — 빌드 전 필수 |

각 파일은 `*.example.json` 템플릿을 복사해 작성합니다 (`install.sh` 가 자동 복사).

## 문서

- [PHP 서버 개발 가이드](php-server/AGENTS.md) — 템플릿/CSS 규칙, 모바일 WebView 대응
- [PHP 서버 README](php-server/README.md) — 구조, API 전체 목록
- [Android 앱 README](mobile/README.md) — 빌드, WebView 브릿지
- [STT 모듈](stt/README.md)
- [TTS 모듈](tts/README.md)
- [질문 엔진](question-engine/README.md) / [LLM 연동](question-engine/README.llm.md)
- [아키텍처 문서](docs/architecture.md)
- [API 명세](docs/api-spec.md)
- [디자인 맵](docs/design-map.md)
- [로드맵](docs/roadmap.md)
- [FCM 푸시 상태](FCM_PUSH_STATUS.md)
