# FCM 푸시 알림 구현 현황

## 아키텍처

```
안드로이드 앱 로그인
  ↓
AndroidBridge.registerFcmToken(memberId)
  ↓
FirebaseMessaging.getInstance().token → FCM 토큰 발급
  ↓
POST /api/members/{id}/fcm-token → 서버 DB에 토큰 저장
  ↓
[사용자 액션 발생] NotificationService.notify()
  ↓
DB에 알림 저장 + FcmService.send() → FCM HTTP v1 API 호출
  ↓
안드로이드 기기에 푸시 도착
```

## 핵심 파일

| 파일 | 역할 |
|------|------|
| `php-server/migrations/schema.sql` | `members.fcm_token` 컬럼 정의 |
| `php-server/src/Database/Migrator.php` | 기존 DB용 ALTER TABLE 마이그레이션 |
| `php-server/src/Service/FcmService.php` | FCM HTTP v1 API 직접 호출 (JWT 서명 + OAuth 토큰 + 전송) |
| `php-server/src/Service/NotificationService.php` | 알림 DB 저장 + FCM 전송 통합 |
| `php-server/src/Repository/MemberRepository.php` | `updateFcmToken()`, `fcmToken()` |
| `php-server/config/firebase-service-account.json` | Firebase 서비스 계정 키 (.gitignore 제외) |

## API

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/members/{member_id}/fcm-token` | FCM 토큰 등록/갱신 (body: `{"token":"..."}`) |
| POST | `/api/notifications` | 알림 생성 (자동으로 FCM 푸시 전송) |

## Firebase 설정

- 서비스 계정 키: `php-server/config/firebase-service-account.json`
- 예시 파일: `php-server/config/firebase-service-account.example.json`
- `.gitignore`에 키 파일 등록됨 (커밋 방지)
- Firebase 프로젝트: `device-streaming-50024e92`

---

## ✅ 완료된 기능

### 인프라
- [x] `members.fcm_token` 컬럼 추가 (schema.sql + 마이그레이션)
- [x] `FcmService` — Firebase 서비스 계정 키로 FCM HTTP v1 API 직접 호출
- [x] `NotificationService` — 알림 DB 저장 + FCM 전송 통합
- [x] FCM 토큰 등록 API (`POST /api/members/{id}/fcm-token`)
- [x] Firebase 서비스 계정 키 설정
- [x] `.gitignore`에 키 파일 등록

### 안드로이드 연동
- [x] `AndroidBridge.registerFcmToken(memberId)` — 로그인 시 FCM 토큰 발급 + 서버 등록
- [x] `MyFirebaseMessagingService` — 푸시 수신 시 알림 표시
- [x] `login.html.twig` — 로그인 성공 시 브릿지 호출 (200ms 지연으로 타이밍 이슈 해결)

### 푸시 알림 기능
- [x] **#1 질문 생성** — 자녀가 부모에게 질문 보낼 때, 질문 받는 사람에게 푸시
  - 트리거: `POST /api/questions`
  - 수신자: `to_member_id`
  - 알림: "{발신자}님이 질문을 보냈어요" + 질문 내용 미리보기
  - nav_target: `/questions`
- [x] **#2 답변 도착** — 부모가 질문에 답변할 때, 질문 보낸 사람에게 푸시
  - 트리거: `POST /api/responses`
  - 수신자: `question.from_member_id`
  - 알림: "{답변자}님의 답변이 도착했어요" + 답변 내용 미리보기
  - nav_target: `/responses`
- [x] **#3 타임캡슐 도착** — 개봉일이 지나 캡슐이 열릴 때, 받는 사람에게 푸시
  - 트리거: `CapsuleController::index` / `ready` / `show` 에서 `releaseDueCapsules()` 호출 시
  - 수신자: `capsule.to_member_id`
  - 알림: "타임캡슐이 열렸어요: {캡슐 제목}"
  - nav_target: `/capsules`
  - 중복 방지: `NotificationRepository::existsByTypeAndTitle()` 로 이미 보낸 알림인지 체크
- [x] **#4 새 투표 생성** — 가족이 투표를 만들 때, 가족 전원(작성자 제외)에게 푸시
  - 트리거: `POST /api/polls` (`PollController::create`)
  - 수신자: 가족 멤버 전원 - 작성자
  - 알림: "새 투표가 시작됐어요: {작성자}님이 만든 투표: {투표 제목}"
  - nav_target: `/polls`
- [x] **#5 캘린더 일정 추가** — 가족이 일정을 등록할 때, 가족 전원(작성자 제외)에게 푸시
  - 트리거: `POST /api/calendar/entries` (`CalendarController::create`)
  - 수신자: 가족 멤버 전원 - 작성자
  - 알림: "새 일정이 추가됐어요: {작성자}님이 추가한 일정: {제목} ({날짜})"
  - nav_target: `/calendar`
- [x] **#6 새 가족 합류** — 초대코드로 새 멤버 합류 시, 기존 가족에게 푸시
  - 트리거: `POST /api/members/{member_id}/join-family` (`FamilyController::joinFamilyByMember`)
  - 수신자: 기존 가족 멤버 전원 - 새 멤버
  - 알림: "새 가족이 합류했어요: {새 멤버 이름}님이 가족에 참여했어요."
  - nav_target: `/settings`

---

## ⬜ 구현 필요 기능

### 선택 (사용자 개인 알림)

- [x] **#7 AI 질문 추천** — 기본 질문 시드 시, 부모 멤버에게 푸시
  - 트리거: `POST /api/questions/seed` (`QuestionController::seed`)
  - 수신자: `parent_member_id`
  - 알림: "이음이 새 질문을 추천해요: {n}개의 새 질문이 도착했어요."
  - nav_target: `/parent-answer`

- [x] **#8 스토리북 생성 완료** — 스토리 재생성 시, 가족 전원에게 푸시
  - 트리거: `StorybookService::regenerate()`에서 새 스토리 생성 시
  - 수신자: 가족 멤버 전원
  - 알림: "새 이야기가 완성됐어요: {스토리 제목들}"
  - nav_target: `/story-child`

- [ ] **#9 투표 마감 임박** — 투표 마감 1일 전, 투표 안 한 가족에게 푸시
  - 트리거: 배치 작업 또는 조회 시 체크
  - 수신자: 투표 안 한 가족 멤버
  - 알림: "투표가 곧 마감돼요: 아직 투표 안 하셨어요"
  - nav_target: `/polls`
  - 참고: cron 또는 조회 시점 체크 필요

- [ ] **#10 캡슐 개봉 임박** — 캡슐 개봉 1일 전, 받는 사람에게 푸시
  - 트리거: 배치 작업 또는 조회 시 체크
  - 수신자: `capsule.to_member_id`
  - 알림: "내일 타임캡슐이 열려요: {캡슐 제목}"
  - nav_target: `/capsules`
  - 참고: cron 또는 조회 시점 체크 필요

---

## ❌ 푸시 불필요 (개인 설정/조회 액션)

| 기능 | 이유 |
|------|------|
| 로그인/회원가입 | 본인 액션 (현재 #0 테스트용으로만) |
| 설정 변경 (글씨 크기, 음성 안내) | 본인 설정 |
| 알림 읽음 처리 | 본인 액션 |
| 앨범 사진 삭제 | 본인 액션 |
| 질문 삭제 | 본인 액션 |
| 캘린더 일정 삭제 | 본인 액션 |
| STT/TTS | 음성 처리 (즉시 응답 필요) |
| 파일 업로드 | 처리 과정 |

---

## 마무리 작업

- [x] #0 로그인 테스트 알림 삭제 완료
  - `FamilyController::login()`에서 `sendLoginPushAsync()` 호출 제거됨
