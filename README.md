# 보이스오브패밀리 (Voice of Family)

> 자식이 부모님에게 질문하고, 부모님이 음성/텍스트로 응답하며, 그 답변들을 모아 스토리북으로 만드는 프로젝트

## 전체 진행률: 90% █████████████████████░

| 모듈 | 진행률 | 상태 |
|------|--------|------|
| `stt/` | 100% | Whisper + Google STT, 파일/실시간 변환, 앱 연동 완료 |
| `tts/` | 100% | edge-tts (Microsoft Edge TTS) 구현 완료 |
| `question-engine/` | 100% | 자동/수동 질문 생성, 카테고리 템플릿 완료 |
| `server/` | 100% | FastAPI + SQLite, 모든 API 라우터 + 로깅 구현 완료 |
| `eum-app/` | 95% | 14개 화면, 디자인 v2 반영, STT/TTS 연동, 소책자/모달 남음 |
| `calendar/` | 100% | 서버 API + 앱 캘린더 화면 완료 |
| `storybook/` | 60% | 스토리북 화면(목차+페이지) 구현, 소책자/생성 로직 일부 |
| `shared/` | 100% | 공통 타입, 상수, 유틸 완료 |
| `models/` | 100% | Whisper 모델 자동 다운로드 (~/.cache/whisper) |

## 프로젝트 개요

```
[통합 앱 - 자식 모드] ──질문 생성/전송──▶ [서버] ──질문 전달──▶ [통합 앱 - 부모 모드]
                                                                     │
                                                                TTS 발화 / 텍스트 표시
                                                                     │
                                                                STT 음답 / 텍스트 입력
                                                                     │
[스토리북] ◀──Q&A 데이터── [서버] ◀──응답 저장── [통합 앱 - 부모 모드]
```

### 핵심 플로우

1. **질문 생성**: 자식이 직접 질문을 작성하거나, 시스템이 자동으로 질문을 생성
2. **질문 전달**: 서버를 통해 부모 모드로 질문 전송
3. **질문 발화**: 부모 모드에서 TTS로 질문을 음성 발화하거나 텍스트로 표시
4. **응답 수집**: 부모님이 STT(음성) 또는 직접 텍스트 입력으로 응답
5. **데이터 저장**: 서버에 Q&A 페어 저장
6. **스토리북 생성**: 저장된 Q&A를 바탕으로 부모님의 스토리북 생성
7. **가족 캘린더**: 사진과 함께 기록을 남기고, 부모/자식 모두 음성 또는 텍스트로 댓글 작성

## 폴더 구조

```
Jiranthon2026/
├── README.md                   # 프로젝트 전체 개요 (이 파일)
├── .devin/
│   └── workflows/
│       └── development.md      # 개발 워크플로우
├── docs/
│   ├── architecture.md         # 아키텍처 문서
│   └── roadmap.md              # 확장 가능 기능 로드맵
├── stt/                        # 음성 → 텍스트 변환 (Speech-to-Text)
├── tts/                        # 텍스트 → 음성 변환 (Text-to-Speech)
├── question-engine/            # 질문 생성 엔진 (수동 + 자동)
├── server/                     # 백엔드 API 서버 및 데이터베이스
├── eum-app/                    # 통합 앱 (Expo React Native, 부모/자녀 모드 분기)
├── calendar/                   # 가족 공유 캘린더 (사진, 음성/텍스트 댓글)
├── storybook/                  # 스토리북 생성 모듈
├── shared/                     # 공통 타입, 스키마, 유틸리티
└── models/                     # AI/ML 모델 (Whisper 자동 다운로드, .gitignore 제외)
```

## 기술 스택 (제안)

| 영역 | 기술 |
|------|------|
| 서버 | Python (FastAPI) |
| 데이터베이스 | SQLite (개발) → PostgreSQL (운영) |
| STT | Whisper (오프라인) / Google Speech API (온라인) |
| TTS | edge-tts (Microsoft Edge TTS) |
| 통합 앱 | React Native + Expo (웹/iOS/Android), 역할별 모드 분기 |
| 스토리북 | Python (Jinja2 템플릿) → PDF/HTML 생성 |

## 빠른 시작

### 환경 설정

```bash
# 1. Python 의존성 한 번에 설치 (모든 Python 모듈 포함)
pip install -r requirements.txt

# 2. FFmpeg 설치 (오디오 변환용, m4a → wav 등)
#    Windows: winget install Gyan.FFmpeg
#    macOS:   brew install ffmpeg
#    Ubuntu:  sudo apt install ffmpeg

# 3. Whisper 모델은 최초 실행 시 자동 다운로드됩니다 (~/.cache/whisper/)

# 4. Node.js 의존성 (통합 앱)
cd eum-app && npm install
```

### 실행

```bash
# 서버 실행 (프로젝트 루트에서)
uvicorn server.main:app --reload --port 8000
# API 문서: http://localhost:8000/docs

# 통합 앱 실행
cd eum-app && npm run web   # 웹
# cd eum-app && npm run ios   # iOS 시뮬레이터
# cd eum-app && npm run android  # Android 에뮬레이터

# STT 파일 변환 (프로젝트 루트에서)
python stt/stt_runner.py file recording.m4a whisper
python stt/stt_runner.py file recording.m4a google
```

### 의존성 목록

전체 Python 의존성은 [requirements.txt](requirements.txt)에서 확인할 수 있습니다.

## 문서

- [개발 워크플로우](.devin/workflows/development.md)
- [아키텍처 문서](docs/architecture.md)
- [확장 가능 기능 로드맵](docs/roadmap.md)
