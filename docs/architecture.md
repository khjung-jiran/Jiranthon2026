# 아키텍처 문서

## 시스템 구성도

```
┌─────────────────────┐  ┌──────────────┐  ┌─────────────────────┐
│    통합 앱 (app)     │  │    서버      │  │    통합 앱 (app)     │
│    [자식 모드]       │  │   server     │  │    [부모 모드]       │
│                      │  │              │  │                      │
│ - 질문 작성          │─▶│ - Q&A 저장   │─▶│ - 질문 수신          │
│ - 응답 확인          │  │ - API 제공   │  │ - TTS 발화           │
│ - 스토리북 열람      │◀─│ - DB 관리    │◀─│ - STT 응답           │
│                      │  │ - 스토리북   │  │ - 텍스트 입력         │
└─────────────────────┘  │   데이터 조회 │  └─────────────────────┘
                         └──────────────┘
                           │
                    ┌──────┴──────┐
                    │  Database   │
                    │  (SQLite /  │
                    │ PostgreSQL) │
                    └─────────────┘
```

## 데이터 모델 (제안)

### Family (가족)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 가족 고유 ID |
| name | String | 가족명 |
| created_at | DateTime | 생성 일시 |

### Member (구성원)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 구성원 ID |
| family_id | UUID | 소속 가족 ID |
| name | String | 이름 |
| role | Enum | parent / child |
| created_at | DateTime | 생성 일시 |

### Question (질문)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 질문 ID |
| family_id | UUID | 가족 ID |
| from_member_id | UUID | 질문한 구성원 ID |
| to_member_id | UUID | 질문 받는 구성원 ID |
| content | Text | 질문 내용 |
| source | Enum | manual / auto |
| category | String | 질문 카테고리 |
| created_at | DateTime | 생성 일시 |
| answered_at | DateTime | 응답 일시 (nullable) |

### Response (응답)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 응답 ID |
| question_id | UUID | 연결된 질문 ID |
| content | Text | 응답 내용 |
| input_method | Enum | stt / text |
| audio_file_path | String | 음성 파일 경로 (nullable) |
| created_at | DateTime | 생성 일시 |

### Storybook (스토리북)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 스토리북 ID |
| family_id | UUID | 가족 ID |
| parent_id | UUID | 부모 구성원 ID |
| title | String | 스토리북 제목 |
| status | Enum | draft / completed |
| created_at | DateTime | 생성 일시 |
| updated_at | DateTime | 수정 일시 |

### StorybookPage (스토리북 페이지)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 페이지 ID |
| storybook_id | UUID | 스토리북 ID |
| question_id | UUID | 연결된 질문 ID |
| response_id | UUID | 연결된 응답 ID |
| page_number | Integer | 페이지 순서 |
| image_url | String | 페이지 이미지 (nullable) |
| layout | String | 페이지 레이아웃 타입 |

## API 엔드포인트 (제안)

### 질문

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/questions` | 질문 생성 |
| GET | `/api/questions?to_member_id={id}` | 특정 구성원에게 온 질문 조회 |
| GET | `/api/questions/{id}` | 질문 상세 조회 |
| DELETE | `/api/questions/{id}` | 질문 삭제 |

### 응답

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/responses` | 응답 저장 |
| GET | `/api/responses?question_id={id}` | 특정 질문의 응답 조회 |

### 스토리북

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/storybooks` | 스토리북 생성 |
| GET | `/api/storybooks/{id}` | 스토리북 조회 |
| GET | `/api/storybooks?family_id={id}` | 가족별 스토리북 목록 |
| POST | `/api/storybooks/{id}/generate` | 스토리북 PDF/HTML 생성 |

### 가족/구성원

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/families` | 가족 생성 |
| GET | `/api/families/{id}` | 가족 정보 조회 |
| POST | `/api/members` | 구성원 추가 |
| GET | `/api/members?family_id={id}` | 가족 구성원 목록 |
