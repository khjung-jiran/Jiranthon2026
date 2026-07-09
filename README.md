# 보이스오브패밀리 (Voice of Family)

> 자식이 부모님에게 질문하고, 부모님이 음성/텍스트로 응답하며, 그 답변들을 모아 스토리북으로 만드는 프로젝트

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
├── app/                        # 통합 앱 (부모 모드 + 자식 모드, 역할 분기)
├── storybook/                  # 스토리북 생성 모듈
└── shared/                     # 공통 타입, 스키마, 유틸리티
```

## 기술 스택 (제안)

| 영역 | 기술 |
|------|------|
| 서버 | Python (FastAPI) |
| 데이터베이스 | SQLite (개발) → PostgreSQL (운영) |
| STT | Vosk (오프라인) / Google Speech API (온라인) |
| TTS | gTTS / Azure TTS / Naver Clova TTS |
| 통합 앱 | React + TypeScript (웹), 역할별 모드 분기 |
| 스토리북 | Python (Jinja2 템플릿) → PDF/HTML 생성 |

## 빠른 시작

```bash
# 1. 서버 실행
cd server
pip install -r requirements.txt
uvicorn main:app --reload

# 2. 통합 앱 실행
cd app
npm install && npm run dev
```

## 문서

- [개발 워크플로우](.devin/workflows/development.md)
- [아키텍처 문서](docs/architecture.md)
- [확장 가능 기능 로드맵](docs/roadmap.md)
