# Server (백엔드 API 서버)

## 역할

질문/응답/스토리북 데이터를 저장하고 관리하는 중앙 API 서버입니다.
자식 앱과 부모 앱 사이의 데이터 중계 역할을 합니다.

## 구성해야 할 파일

| 파일 | 설명 |
|------|------|
| `main.py` | FastAPI 앱 진입점 |
| `models.py` | SQLAlchemy 데이터베이스 모델 |
| `schemas.py` | Pydantic 요청/응답 스키마 |
| `database.py` | DB 연결 및 세션 관리 |
| `routers/` | API 라우터 (질문, 응답, 스토리북, 구성원) |
| `requirements.txt` | Python 의존성 |
| `.env.example` | 환경변수 예시 |

## 기술 스택

- **Framework**: FastAPI
- **Database**: SQLite (개발) → PostgreSQL (운영)
- **ORM**: SQLAlchemy
- **Validation**: Pydantic

## API 엔드포인트

자세한 내용은 [아키텍처 문서](../docs/architecture.md) 참조

### 핵심 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/questions` | 질문 생성/전송 |
| GET | `/api/questions?to_member_id={id}` | 부모님에게 온 질문 조회 |
| POST | `/api/responses` | 부모님 응답 저장 |
| GET | `/api/storybooks/{id}` | 스토리북 조회 |
| POST | `/api/storybooks/{id}/generate` | 스토리북 생성 |

## 다른 모듈과의 관계

- **question-engine**: 질문 생성 API 제공
- **parent-app**: 질문 전달 및 응답 수신 API 제공
- **child-app**: 질문 전송, 응답 조회, 스토리북 열람 API 제공
- **storybook**: 스토리북 생성용 Q&A 데이터 제공
- **shared**: 공통 스키마 기반으로 API 스키마 구현

## 개발 시 구현해야 할 내용

- [ ] FastAPI 프로젝트 초기화
- [ ] 데이터베이스 모델 정의 (Family, Member, Question, Response, Storybook, StorybookPage)
- [ ] CRUD API 구현 (질문, 응답, 스토리북, 구성원)
- [ ] 음성 파일 업로드/다운로드 엔드포인트
- [ ] 인증/인가 (가족별 데이터 격리)
- [ ] API 문서 (Swagger UI 자동 생성)
- [ ] 에러 핸들링 및 로깅
- [ ] 데이터베이스 마이그레이션 스크립트

## 실행

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# API 문서: http://localhost:8000/docs
```

## 확장 아이디어

- WebSocket 기반 실시간 질문/응답 알림
- 파일 스토리지 연동 (S3, Google Cloud Storage)
- 데이터 백업/복구 시스템
- 가족별 데이터 격식 및 프라이버시 보호 강화
