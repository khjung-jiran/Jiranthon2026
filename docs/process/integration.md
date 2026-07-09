# 프론트–백엔드 연동 (integration.md)

> 담당: 연동 엔지니어 에이전트 · 일자: 2026-07-09 · 브랜치: solji
> 원칙: **서버 우선, 실패 시 목업 폴백** — 서버가 안 떠 있어도 앱은 기존 목업으로 100% 동작.

## ① 한 일

### 생성 파일
| 파일 | 내용 |
|------|------|
| `eum-app/src/api/client.ts` | fetch 기반 경량 HTTP 클라이언트. `setApiBase()`/`getApiBase()`, AbortController 타임아웃(기본 5초), `ApiError`(status/body 포함) throw. 새 패키지 0개. |
| `eum-app/src/api/index.ts` | 도메인 함수(라우터에 실제 존재하는 엔드포인트만) + 서버 스키마(snake_case, string UUID) → 앱 타입(src/types, number id) 매핑 계층. ID 레지스트리(서버 UUID ↔ 앱 number id 양방향), 데모 세션 부트스트랩 + 최초 1회 목업 데이터 시드. |

### 수정 파일
| 파일 | 내용 |
|------|------|
| `eum-app/src/store/useStore.ts` | `serverOnline` 상태 + `hydrate()` 액션 추가. 쓰기 액션 9개에 best-effort 서버 동기화 병행(fire-and-forget, 실패 시 콘솔 경고만). **기존 액션 시그니처 전부 유지 — 화면(.tsx) 파일 무수정.** |
| `eum-app/App.tsx` | 마운트 시 `useStore.getState().hydrate()` 호출 1개(useEffect) 추가. |
| `server/routers/question.py` | **버그 수정**: `GET /questions/{qid}`가 `GET /questions/ai-suggestions`보다 먼저 등록되어 있어 ai-suggestions가 항상 qid로 매칭 → 404. 고정 경로를 동적 경로 앞으로 이동(로직 변경 없음). |
| `process.md` | "다음 단계"에 서버 연동 완료 반영. |

### 동작 흐름
1. **앱 시작 / 로그인 / 역할 전환** → `hydrate()`:
   - `GET /` 헬스체크(타임아웃 2.5초) → `serverOnline` 갱신. 실패하면 조용히 종료(목업 유지, 무한로딩 없음).
   - 데모 계정 로그인(`POST /api/auth/login`, `eum_parent`/`eum_child` + `eum-demo`). 계정이 없으면(401/404) 최초 1회: 가족 생성 → 구성원 4명 생성 → **목업과 동일한 데모 데이터 시드**(질문 4+답변 2, 캡슐 4, 알림 5×2계정, 투표 1 + 초기 득표 [2,1,0]). 이후 재시작해도 같은 계정으로 데이터 유지.
   - questions/capsules/notifs/pollVotes/settings 병렬 조회 → **비어있지 않을 때만** 스토어 교체(빈 화면 방지). 각 조회는 개별 catch(부분 실패 허용).
2. **쓰기 액션**: 로컬 낙관적 업데이트 즉시 반영 → 서버 호출 병행. 서버 매핑이 없는 항목(목업 전용/오프라인)은 조용히 skip.

## ② 매핑한 엔드포인트

| 스토어 액션 / hydrate | API 함수 (src/api/index.ts) | 서버 엔드포인트 | 비고 |
|---|---|---|---|
| hydrate(세션) | `bootstrapSession` | `POST /api/auth/login`, `POST /api/families`, `POST /api/members`, `GET /api/families/{id}/members` | 최초 1회 시드 포함. 동시 호출 직렬화(가족 중복 생성 방지) |
| hydrate(질문) | `fetchQuestions` | `GET /api/questions?family_id=`, `GET /api/responses?family_id=` | 질문별 최신 응답 1건을 인라인 병합(dur/era/transcript) |
| hydrate(캡슐) | `fetchCapsules` | `GET /api/capsules?family_id=` | open_date→'YYYY. M. D', locked면 D-day 계산, 발신자별 색 |
| hydrate(알림) | `fetchNotifs` | `GET /api/notifications?member_id=` | is_read→unread 반전, created_at→상대시간, nav_target 검증 |
| hydrate(투표) | `fetchPollVotes` | `GET /api/polls?family_id=` | 목업 제목과 같은 투표를 찾아 옵션을 pollLabels 순서로 정렬. 옵션 수가 다르면 미반영(화면이 라벨을 mock에서 직접 읽음) |
| hydrate(설정) | `fetchSettings` | `GET /api/settings?member_id=` | font_size는 서버도 한글값('보통/크게/아주 크게') — 그대로 통과 |
| `answerQuestion` | `pushAnswer` | `POST /api/responses` | input_method='stt', content=transcript. 서버가 질문 status를 answered로 자동 갱신 |
| `vote` | `pushVoteByIndex` | `POST /api/polls/{id}/vote` | 재투표는 서버가 기존 표 자동 이동. **취소(같은 항목 재탭)는 서버 미지원 → 로컬만** |
| `markNotifRead` | `pushNotifRead` | `POST /api/notifications/{id}/read` | |
| `readAllNotifs` | `pushAllNotifsRead` | `POST /api/notifications/read-all?member_id=` | |
| `sealCapsule` | `pushSealCapsule` | `POST /api/capsules` | 생성된 서버 id를 로컬 캡슐 id에 bind → 이후 열기 동기화 가능. '가족 모두' 등 비구성원 수신자는 라벨 문자열 그대로 저장(FK 미강제) |
| `markCapsuleOpen` | `pushCapsuleOpen` | `POST /api/capsules/{id}/open` | |
| `setFontSize`/`toggleVoiceGuide`/`toggleAutoTranslate` | `pushSettings` | `PUT /api/settings?member_id=` | member_id는 쿼리 파라미터(서버 시그니처 기준) |
| (제공만, 스토어 미사용) | `joinFamily`, `getFamily`, `getInviteCode`, `getQuestion`, `getAiSuggestions`, `responseStats`, `listReadyCapsules`, `getCapsule`, `unreadCount`, `createPoll`, `getPoll`, `createNotification` | 각 라우터 참조 | 라우터에 실제 존재하는 것만 노출. `joinFamily`의 invite_code는 **쿼리 파라미터** |

### 폴백 동작 (요약)
- 서버 다운: 헬스체크 2.5초 내 실패 → `serverOnline=false`, 목업 그대로. UI 깨짐/무한로딩 없음.
- 서버 살아있지만 일부 API 실패: 도메인별 개별 catch → 실패한 도메인만 목업 유지.
- 서버 응답이 빈 배열: 목업 유지(데모 UX 보존).
- 쓰기 실패: 로컬은 이미 반영됨, 콘솔 경고(`[eum] ... 서버 동기화 실패`)만.

## ③ 잘못한 / 불확실한 것
- **투표 취소 비대칭**: 서버 vote API는 "표 이동"만 지원, 취소는 미지원. 같은 항목 재탭(취소) 시 로컬만 반영되어 다음 hydrate에서 서버 수치로 되돌아감(득표 +1 차이).
- **알림 시각 드리프트**: 시드된 알림의 created_at이 "시드 시점"이라 목업의 '어제/2일 전' 대신 전부 '오늘'로 표시됨(하이드레이트 후).
- **transcript_en**: 서버 `ResponseCreate` 스키마에 transcript_en 필드가 없어 영문 번역을 서버에 저장 못 함. 매핑 시 같은 문구의 목업에서 재사용(신규 답변은 영문 없음 — 번역 API `POST /api/translate` 미구현 상태).
- **rel(관계) 표시**: 서버에 관계 정보가 없어 이름 기반 매핑(지훈→아들, 서연→딸), 그 외 role 기반('자녀'/'가족')으로 근사.
- **pollVoted(내가 찍은 항목)**: 서버 getPoll이 멤버별 투표를 안 주므로 하이드레이트로 복원 불가(세션 내 로컬 유지).
- **시드 데이터 중복 리스크**: 부트스트랩 로그인 401 시 가족을 새로 만드는데, DB가 부분적으로만 초기화된 경우(username 잔존) 멤버 생성 409로 시드가 중단될 수 있음 → 서버 `eum.db` 삭제 후 재기동하면 해결.
- 검증 한계: 이 머신에 node/python 실행 환경이 없어 tsc/실서버 왕복 테스트는 미수행(수동 타입 대조만). WSL에서 `npx tsc --noEmit` + `uvicorn main:app` 왕복 확인 필요.

## ④ 남은 일
- [ ] **실기기 테스트**: `src/api/client.ts` 상단 안내대로 `setApiBase('http://<PC-LAN-IP>:8000')` 적용 지점 결정(현재 기본 localhost). Android 에뮬레이터는 10.0.2.2.
- [ ] **음성 업로드**: `POST /api/uploads/audio`(multipart) + `audio_file_path` 연결 — 현재 답변/캡슐은 텍스트·메타만 동기화.
- [ ] STT/TTS(`/api/stt/transcribe`, `/api/tts/synthesize`) 연동 — 녹음 화면이 현재 시뮬레이션.
- [ ] 캘린더/앨범 하이드레이트 — 화면이 mock을 직접 import하므로 스토어 경유로 바꾼 뒤 연동 가능(화면 수정 필요 → 이번 범위 제외).
- [ ] 투표 취소 API(서버) 추가 검토, `POST /api/translate` 구현 시 toggleTranslate 연동.
- [ ] WSL에서 `npx tsc --noEmit` 타입 검증 + 서버 띄우고 왕복 스모크 테스트.
