# AI/ML 모델 폴더

## 역할

프로젝트에서 사용하는 모델 파일들을 한 곳에 모아 관리합니다.
모델 파일은 용량이 크므로 Git에 커밋하지 않고 `.gitignore`로 제외합니다.

## 폴더 구조

```
models/
├── stt/                    # STT 모델 (필요 시)
├── tts/                    # TTS 모델 (필요 시)
└── question-engine/        # 질문 생성 엔진 모델 (Phase 2)
    └── (LLM 모델 등)
```

## STT 모델

### Whisper (기본 엔진)

- Whisper는 최초 실행 시 자동으로 모델을 다운로드합니다
- 저장 위치: `~/.cache/whisper/` (사용자 홈 디렉토리)
- 모델 크기 옵션: `tiny` (~75MB) ~ `large` (~2.9GB)
- 기본값: `small` (~466MB) - 한국어 인식률과 속도의 균형
- `stt/file_transcribe.py`의 `MODEL_SIZE`에서 변경 가능

### Google Web Speech API (대체 엔진)

- 별도 모델 다운로드 불필요 (온라인 API)
- 인터넷 연결 필수

## TTS 모델

- gTTS 사용 시 별도 모델 불필요 (온라인 API)
- 오프라인 TTS 엔진 사용 시 이 폴더에 모델 배치

## 질문 생성 LLM 모델 (Phase 2)

- Phase 2에서 LLM 기반 질문 생성 시 모델 파일을 `models/question-engine/`에 배치
- 예: 로컬 LLM (Ollama, GGUF 등) 또는 API 키만 사용하는 경우 불필요

## 주의사항

- 이 폴더의 모델 파일들은 `.gitignore`에 의해 Git에서 제외됩니다
- 팀원 간 모델 공유는 별도 스토리지 (Google Drive, S3 등) 사용 권장
- 모델 라이선스를 각각 확인하세요
