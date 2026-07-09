# Shared (공통 모듈)

## 역할

모든 모듈에서 공통으로 사용하는 타입 정의, 데이터 스키마, 유틸리티를 제공합니다.

## 구성해야 할 파일

| 파일/폴더 | 설명 |
|-----------|------|
| `types.py` | Python 공통 타입 (Pydantic 모델) |
| `types.ts` | TypeScript 공통 타입 |
| `constants.py` | 공통 상수 (질문 카테고리, 응답 방식 등) |
| `utils.py` | 공통 유틸리티 함수 |
| `config.py` | 공통 설정 (API URL, 환경변수) |

## 공통 데이터 타입

### QuestionType

```python
class QuestionSource(str, Enum):
    MANUAL = "manual"    # 자식이 직접 작성
    AUTO = "auto"        # 시스템 자동 생성
    AI = "ai"            # LLM 기반 생성 (Phase 2)
```

### ResponseInputMethod

```python
class ResponseInputMethod(str, Enum):
    STT = "stt"          # 음성 인식
    TEXT = "text"        # 직접 텍스트 입력
```

### StorybookStatus

```python
class StorybookStatus(str, Enum):
    DRAFT = "draft"          # 작성 중
    COMPLETED = "completed"  # 완성
    PUBLISHED = "published"  # 가족 공개
```

## 다른 모듈과의 관계

- **server**: 데이터베이스 모델 및 API 스키마의 기준
- **parent-app / child-app**: TypeScript 타입으로 API 응답 타입 정의
- **question-engine**: 질문 타입 및 카테고리 정의 참조
- **storybook**: 스토리북 데이터 구조 정의 참조

## 개발 시 구현해야 할 내용

- [ ] Python 공통 타입 정의 (Pydantic BaseModel)
- [ ] TypeScript 공통 타입 정의 (interface/type)
- [ ] 질문 카테고리 상수 정의
- [ ] API 응답 공통 포맷 정의 (success/error wrapper)
- [ ] 환경변수 관리 (API base URL, TTS/STT 엔진 설정)

## 확장 아이디어

- OpenAPI 스키마에서 TypeScript 타입 자동 생성
- 다국어 메시지 상수 (i18n)
- 공통 에러 코드 체계
