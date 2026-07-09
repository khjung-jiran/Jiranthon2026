# 이음 (이음.dc.html) 백엔드 API 명세

## 개요

`view/project/이음.dc.html` 프로토타입 기반으로 필요한 백엔드 API 명세입니다.

## 데이터베이스 테이블 (17개)

| 테이블 | 주요 필드 |
|--------|-----------|
| `families` | id, name, invite_code, created_at |
| `members` | id, family_id, name, role, birth_date, profile_image |
| `questions` | id, family_id, content, category, source, from_member_id, to_member_id, status, created_at |
| `responses` | id, question_id, member_id, content, input_method, audio_file_path, era, transcript, transcript_en, duration, created_at |
| `storybooks` | id, family_id, parent_id, title, status, created_at |
| `storybook_chapters` | id, storybook_id, era, years, title, page_count, is_new |
| `storybook_pages` | id, chapter_id, response_id, body, audio_file_path, duration |
| `capsules` | id, family_id, from_member_id, to_member_id, title, audio_file_path, open_date, status, duration |
| `calendar_entries` | id, family_id, date, title, created_by, tag, color |
| `photos` | id, family_id, url, label, who, tone, created_at |
| `notifications` | id, member_id, type, title, icon, color, is_read, nav_target, created_at |
| `polls` | id, family_id, title, deadline, created_by |
| `poll_options` | id, poll_id, label, vote_count |
| `poll_votes` | id, poll_id, option_id, member_id |
| `booklets` | id, storybook_id, page_count, voice_qr_count, price, status |
| `settings` | id, member_id, font_size, voice_guide, auto_translate |
| `subscriptions` | id, family_id, plan, data_used, data_limit, status |

---

## 1. 인증/가족 (Auth & Family)

| Method | Path | 화면 | 설명 |
|--------|------|------|------|
| POST | `/api/auth/login` | 로그인 | 부모/자녀 역할 선택, 가족 초대 코드로 입장 |
| POST | `/api/families` | 설정 | 가족 생성 |
| GET | `/api/families/{id}` | 설정 | 가족 정보 조회 |
| POST | `/api/families/{id}/invite` | 설정 | 초대 링크 생성 |
| POST | `/api/families/join` | 로그인 | 초대 코드로 가족 참여 |
| GET | `/api/families/{id}/members` | 대시보드 | 가족 구성원 목록 |
| POST | `/api/members` | 설정 | 구성원 추가 (역할: parent/child) |

## 2. 질문/응답 (Question & Response)

| Method | Path | 화면 | 설명 |
|--------|------|------|------|
| POST | `/api/questions` | 자녀 질문 작성 | 질문 생성 (수동/AI추천 선택) |
| GET | `/api/questions?to_member_id={id}` | 부모 질문 목록 | 부모님에게 온 질문 목록 (상태: pending/answered) |
| GET | `/api/questions?from_member_id={id}` | 자녀 대시보드 | 내가 보낸 질문 목록 |
| GET | `/api/questions/{id}` | 부모 질문 상세 | 질문 상세 조회 |
| DELETE | `/api/questions/{id}` | - | 질문 삭제 |
| GET | `/api/questions/ai-suggestions` | 자녀 질문 작성 | AI 추천 질문 리스트 (카테고리 기반) |
| POST | `/api/responses` | 부모 답변하기 | 음성/텍스트 답변 저장 |
| GET | `/api/responses?question_id={id}` | 자녀 받은 이야기 | 특정 질문의 답변 조회 |
| GET | `/api/responses?family_id={id}&status=answered` | 자녀 대시보드 | 받은 답변 목록 (미리보기 포함) |
| GET | `/api/responses/stats?family_id={id}` | 자녀 대시보드 | 답변 대기/받은 답변 카운트 |

## 3. 음성 처리 (STT/TTS)

| Method | Path | 화면 | 설명 |
|--------|------|------|------|
| POST | `/api/stt/transcribe` | 부모 답변, 타임캡슐 | 업로드된 음성 → 텍스트 변환 (Whisper) |
| POST | `/api/tts/synthesize` | 부모 질문 상세, 이야기책 | 텍스트 → 음성 변환 (질문 TTS) |
| POST | `/api/uploads/audio` | 답변, 타임캡슐 | 음성 파일 업로드 (m4a/wav) |
| GET | `/api/audio/{filename}` | 답변 재생, 이야기책 | 음성 파일 스트리밍/다운로드 |

## 4. 이야기책 (Storybook)

| Method | Path | 화면 | 설명 |
|--------|------|------|------|
| POST | `/api/storybooks` | - | 스토리북 생성 (부모님 ID 기준) |
| GET | `/api/storybooks?family_id={id}` | 자녀 이야기책 | 가족 스토리북 목록 |
| GET | `/api/storybooks/{id}` | 자녀 이야기책 | 스토리북 상세 (목차/챕터) |
| GET | `/api/storybooks/{id}/chapters` | 자녀 이야기책 목차 | 챕터 목록 (시대별 분류: 유년기/청소년기/청년/부모) |
| GET | `/api/storybooks/{id}/chapters/{num}` | 자녀 이야기책 페이지 | 개별 챕터 페이지 (본문, 음성, 완성도) |
| POST | `/api/storybooks/{id}/generate` | - | 답변 모아서 스토리북 자동 생성 |
| GET | `/api/storybooks/{id}/progress` | 자녀 이야기책 | 챕터별 완성도 (n/total) |

## 5. 타임캡슐 (Time Capsule)

| Method | Path | 화면 | 설명 |
|--------|------|------|------|
| POST | `/api/capsules` | 타임캡슐 만들기 | 캡슐 생성 (수신자, 열리는 날짜, 음성) |
| GET | `/api/capsules?family_id={id}` | 타임캡슐 목록 | 가족 캡슐 목록 (상태: locked/ready/open) |
| GET | `/api/capsules/{id}` | 캡슐 열기 | 개별 캡슐 조회 (locked면 메타데이터만) |
| POST | `/api/capsules/{id}/open` | 캡슐 열기 | 열리는 날 도달 시 캡슐 오픈 |
| GET | `/api/capsules/ready?family_id={id}` | 대시보드 | 오늘 열리는 캡슐 목록 |

## 6. 캘린더 (Calendar)

| Method | Path | 화면 | 설명 |
|--------|------|------|------|
| POST | `/api/calendar/entries` | 캘린더 일정 추가 | 일정 생성 (제목, 날짜, 등록자) |
| GET | `/api/calendar/entries?family_id={id}&month=YYYY-MM` | 캘린더 | 월별 일정 목록 |
| GET | `/api/calendar/entries?family_id={id}&upcoming=true` | 캘린더 | 다가오는 일정 목록 |
| DELETE | `/api/calendar/entries/{id}` | - | 일정 삭제 |
| POST | `/api/calendar/sync` | 캘린더 | 구글 캘린더 연동 (OAuth) |

## 7. 가족 앨범 (Album)

| Method | Path | 화면 | 설명 |
|--------|------|------|------|
| POST | `/api/uploads/image` | 앨범 사진 업로드 | 사진 업로드 |
| GET | `/api/album?family_id={id}` | 앨범 | 가족 사진 목록 (필터: 전체/엄마/아빠/지훈/서연) |
| GET | `/api/album?family_id={id}&who={name}` | 앨범 | 인물별 사진 필터 |
| POST | `/api/album/face-detect` | 앨범 | 얼굴 인식으로 인물별 자동 분류 |
| DELETE | `/api/album/{id}` | - | 사진 삭제 |

## 8. 알림 (Notification)

| Method | Path | 화면 | 설명 |
|--------|------|------|------|
| GET | `/api/notifications?member_id={id}` | 알림 | 알림 목록 (타입: 질문도착/답변완료/캡슐열림/투표/얼굴인식) |
| POST | `/api/notifications/{id}/read` | 알림 | 개별 알림 읽음 처리 |
| POST | `/api/notifications/read-all?member_id={id}` | 알림 | 전체 읽음 처리 |
| GET | `/api/notifications/unread-count?member_id={id}` | 대시보드 | 안 읽은 알림 카운트 (빨간 점) |
| POST | `/api/notifications/push` | 푸시 알림 | 실시간 푸시 알림 전송 (WebSocket/SSE) |

## 9. 가족 투표 (Poll)

| Method | Path | 화면 | 설명 |
|--------|------|------|------|
| POST | `/api/polls` | - | 투표 생성 (제목, 옵션, 마감일) |
| GET | `/api/polls?family_id={id}` | 가족 투표 | 가족 투표 목록 |
| GET | `/api/polls/{id}` | 가족 투표 | 투표 상세 (옵션별 득표수/퍼센트) |
| POST | `/api/polls/{id}/vote` | 가족 투표 | 투표 (옵션 선택, 변경 가능) |
| GET | `/api/polls/{id}/result` | 가족 투표 | 투표 결과 (참여자 수, 항목별 비율) |

## 10. 소책자 (Booklet)

| Method | Path | 화면 | 설명 |
|--------|------|------|------|
| POST | `/api/booklets` | 소책자 미리보기 | 소책자 생성 (스토리북 기반) |
| GET | `/api/booklets/{id}` | 소책자 미리보기 | 소책자 상세 (페이지 수, 음성 QR 수) |
| POST | `/api/booklets/{id}/order` | 소책자 주문 | 인쇄 주문 접수 |
| GET | `/api/booklets/{id}/pdf` | - | PDF 다운로드 |

## 11. 설정 (Settings)

| Method | Path | 화면 | 설명 |
|--------|------|------|------|
| GET | `/api/settings?member_id={id}` | 설정 | 사용자 설정 조회 (글씨크기, 음성안내, 자동번역) |
| PUT | `/api/settings` | 설정 | 설정 변경 (글씨크기, 음성안내, 자동번역) |
| POST | `/api/translate` | 받은 이야기 | 답변 텍스트 영어 번역 (자동 번역 토글) |

## 12. 구독 (Subscription)

| Method | Path | 화면 | 설명 |
|--------|------|------|------|
| GET | `/api/subscription?family_id={id}` | 설정 | 구독 상태 조회 (플랜, 데이터 사용량) |
| POST | `/api/subscription/upgrade` | 설정 | 플랜 업그레이드 |
| POST | `/api/subscription/cancel` | 설정 | 구독 해지 |

---

## 요약

- **테이블**: 17개
- **기능 도메인**: 12개
- **API 엔드포인트**: 약 50개
