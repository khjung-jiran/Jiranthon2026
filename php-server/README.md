# 이음 API - Apache + PHP 서버

FastAPI(Python) 기반 서버를 Apache + PHP로 전환한 백엔드입니다.

## 구조

```
php-server/
├── apache-vhost.conf          # Apache 가상호스트 설정
├── composer.json
├── migrations/
│   └── schema.sql             # SQLite 스키마
├── public/                    # Apache DocumentRoot
│   ├── .htaccess              # URL 재작성 + CORS 헤더
│   └── index.php              # 프론트 컨트롤러
└── src/
    ├── Database.php           # PDO SQLite 연결 + 마이그레이션
    ├── Logger.php             # 파일 로깅
    ├── Helpers.php            # JSON 응답, UUID, 비밀번호 해시 등
    ├── Router.php             # 경로 매칭 라우터
    ├── QuestionTemplates.php  # 카테고리별 질문 템플릿
    └── Controllers/
        ├── RootController.php
        ├── FamilyController.php       # 가족/멤버/인증
        ├── QuestionController.php     # 질문/답변/AI추천/스토리북
        ├── CapsuleController.php      # 타임캡슐
        ├── CalendarController.php     # 캘린더
        ├── AlbumController.php        # 앨범
        ├── NotificationController.php # 알림
        ├── PollController.php         # 투표
        ├── SettingsController.php     # 설정
        └── VoiceController.php        # STT/TTS/업로드
```

## 설치 및 실행

### 1. PHP 의존성 확인

- PHP 8.1 이상
- 확장: `pdo_sqlite`, `json`, `mbstring`

### 2. Apache 설정

`apache-vhost.conf`를 Apache 설정에 추가:

```bash
# macOS Homebrew Apache 예시
cp apache-vhost.conf /opt/homebrew/etc/httpd/extra/httpd-vhosts.conf
# httpd.conf에서 vhosts 모듈 활성화
# mod_rewrite, mod_headers 활성화
```

### 3. hosts 파일에 도메인 추가

```
127.0.0.1 eum.local
```

### 4. Apache 재시작

```bash
brew services restart httpd
# 또는
sudo apachectl restart
```

### 5. 개발 서버 (Apache 없이 PHP 내장 서버 사용)

```bash
cd php-server
php -S localhost:8000 -t public
```

## API 엔드포인트

기존 FastAPI 서버와 동일한 경로를 제공합니다:

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/families` | 가족 생성 |
| GET | `/api/families/{id}` | 가족 조회 |
| GET | `/api/families/{id}/invite-code` | 초대코드 조회 |
| POST | `/api/families/join` | 초대코드로 가족 참여 |
| POST | `/api/members` | 멤버 생성 |
| POST | `/api/auth/login` | 로그인 |
| GET | `/api/families/{id}/members` | 멤버 목록 |
| POST | `/api/questions` | 질문 생성 |
| GET | `/api/questions` | 질문 목록 |
| GET | `/api/questions/ai-suggestions` | AI 추천 질문 |
| GET | `/api/questions/{id}` | 질문 조회 |
| DELETE | `/api/questions/{id}` | 질문 삭제 |
| POST | `/api/responses` | 답변 생성 |
| GET | `/api/responses` | 답변 목록 |
| GET | `/api/responses/stats` | 답변 통계 |
| GET | `/api/storybook` | 스토리북 조회 |
| POST | `/api/storybook` | 스토리북 생성 |
| POST | `/api/capsules` | 타임캡슐 생성 |
| GET | `/api/capsules` | 타임캡슐 목록 |
| GET | `/api/capsules/ready` | 열람 가능 캡슐 |
| GET | `/api/capsules/{id}` | 캡슐 조회 |
| POST | `/api/capsules/{id}/open` | 캡슐 열기 |
| POST | `/api/calendar/entries` | 일정 생성 |
| GET | `/api/calendar/entries` | 일정 목록 |
| DELETE | `/api/calendar/entries/{id}` | 일정 삭제 |
| GET | `/api/album` | 사진 목록 |
| DELETE | `/api/album/{id}` | 사진 삭제 |
| POST | `/api/notifications` | 알림 생성 |
| GET | `/api/notifications` | 알림 목록 |
| GET | `/api/notifications/unread-count` | 안읽은 알림 수 |
| POST | `/api/notifications/{id}/read` | 알림 읽음 처리 |
| POST | `/api/notifications/read-all` | 전체 읽음 처리 |
| POST | `/api/polls` | 투표 생성 |
| GET | `/api/polls` | 투표 목록 |
| GET | `/api/polls/{id}` | 투표 조회 |
| POST | `/api/polls/{id}/vote` | 투표하기 |
| GET | `/api/settings` | 설정 조회 |
| PUT | `/api/settings` | 설정 수정 |
| POST | `/api/stt/transcribe` | STT 변환 |
| POST | `/api/tts/synthesize` | TTS 합성 |
| POST | `/api/uploads/audio` | 오디오 업로드 |
| POST | `/api/uploads/image` | 이미지 업로드 |

## 기존 FastAPI 서버와의 차이점

- **라우팅**: FastAPI 데코레이터 → PHP 커스텀 라우터 (정규식 매칭)
- **ORM**: SQLAlchemy → PDO 직접 쿼리
- **스키마 검증**: Pydantic → 수동 JSON 파싱
- **LLM 연동**: Python `ollama` 직접 호출 → `shell_exec`로 Python 스크립트 호출
- **카테고리 분류**: LLM 기반 → 키워드 매칭 폴백
- **DB**: 기존 `eum.db` (SQLite) 그대로 사용
