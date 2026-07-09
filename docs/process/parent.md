# parent 담당 진행 기록

## ① 한 일
- `docs/design-map.md`(Foundation 계약)와 `view/design/이음.dc.html`(라인 77~255), `view/design/support.js`(내장 `<script type="text/x-dc" data-dc-script>`의 `class Component extends DCLogic` — `renderVals()`/`startRec`/`stopRec`/`sendResp`/`toggleTTS`/`schedulePush`/`openAI` 등)를 정독하여 부모 4개 화면의 마크업·상태·목업 로직을 확인.
- `eum-app/src/screens/parent/HomeScreen.tsx`, `QuestionListScreen.tsx`, `QuestionDetailScreen.tsx`는 이미 실제 화면으로 구현되어 있어(스텁 아님) 원본(라인 77~130 / 131~173 / 174~200)·Foundation 계약과 대조 검증만 수행. 3개 파일 모두 색상/폰트/라운드/여백 수치, `homeSub`/`aiDue`/`badge`/`avColor`/`byline`/`ttsIcon`·`ttsLabel`/`ttsPct` 타이머 로직이 `renderVals()`와 1:1로 일치함을 확인 — 수정 불필요.
- `eum-app/src/screens/parent/RespondScreen.tsx`(sPRespond, 원본 201~255)를 스텁에서 전체 구현으로 교체:
  - `recIdle`/`recording`/`recordDone` 3단계 상태를 로컬 `useState`(recording/recordDone/recordSecs/scribe/scribeText)로 재현. `startRec`/`stopRec`는 원본과 동일하게 1초 간격 `recordSecs` 증가, 정지 시 `recordDone` 전환.
  - `RecordingWave`(파형), `pulseRing`(Animated scale .9→1.75 / opacity .55→0, 1.5s ease-out loop)로 원본 `@keyframes vbar`/`pulseRing` 시각 재현.
  - 녹음완료 화면: accentSoft 원형 체크, 정적 38% 재생바(원본과 동일하게 정적값), "다시 녹음하기".
  - 대필(scribe) 토글: `edit_note` 텍스트버튼 + 뱃지("대필 모드 · 지훈이 대신 입력해요", 원본 하드코딩 문구 그대로) + `TextInput` 대필 입력창.
  - `sendResp`: `canSend = recordDone || (scribe && scribeText.trim())` 동일 조건, `store.answerQuestion(id, {dur, transcript, era:'청년 시절'})` 호출 후 `showToast(...)` → `navigation.navigate('ParentTabs', { screen: 'Home' })`(원본의 `screen:'p_home', tab:'home'` 전환과 동일 목적지, 기존 `NotificationScreen.tsx`가 쓰는 동일 패턴 재사용으로 타입 안전성 확인).
  - 색/폰트/라운드/여백은 전부 `src/theme` 토큰(`colors.surfaceSoft3`, `colors.textMuted4`, `colors.divider`, `colors.track`, `colors.border4`, `colors.textFaint` 등)만 사용, 하드코딩 hex 없음.
- Foundation 산출물(테마/컴포넌트/스토어/타입/아이콘/네비 타입)을 그대로 사용, 신규 중복 정의 없음.

## ② 잘못한 일 / 리스크 / 미완성
- `npx expo install` / `npx tsc --noEmit` / 앱 부팅 확인을 **실행하지 못함** — 이 환경에 Node.js/npm/npx 자체가 설치되어 있지 않음(아래 병목 참고). 따라서 RespondScreen의 타입 정합성은 기존 완성 화면들(QuestionDetailScreen 등)의 패턴을 그대로 답습하는 방식으로만 교차 검증했고, 실제 `tsc` 컴파일 검증 및 실기기/시뮬레이터 렌더 확인은 못했다. 이 부분은 병목 해소 후 재검증 필요.
- `recTime`(녹음 mm:ss)에 `fontVariant:['tabular-nums']`를 적용했는데 Android에서는 무시될 수 있음(원본은 웹 `font-variant-numeric: tabular-nums`) — 시각적으로 큰 차이는 아니지만 완전한 동일 재현은 아님.
- 원본 `back()`은 화면 전환 시 `scribe:false` 등으로 상태를 리셋하는데, RN에서는 RespondScreen이 스택에서 pop되며 컴포넌트가 언마운트되어 로컬 state가 자연히 초기화되므로 동일 효과를 얻지만, 만약 향후 이 화면을 스택에 유지한 채(예: modal) 재사용하는 구조로 바뀐다면 별도 리셋 로직이 필요함.
- store의 `settings.scribe`/`toggleScribe()`(환경설정 전역 토글로 추정)와 RespondScreen 로컬 `scribe` state는 별개로 구현했다(원본 HTML의 `scribe`는 sPRespond 화면 로컬 상태이며 sSetting에는 대필 관련 UI가 없음을 확인). 계약서상 스토어 액션 `toggleScribe`가 있지만 이 화면에서는 쓰지 않았다 — 의도적 선택이나, Foundation/Manager가 다른 의도(전역 대필 기본값)로 설계했다면 충돌 가능성 있음.

## ③ 병목 (Manager가 처리할 것)
- **환경에 Node.js/npm/npx가 전혀 설치되어 있지 않음** (`node`, `npm`, `npx` 모두 command not found, 일반적 설치 경로에도 없음). Foundation이 남긴 todo(`npx expo install`, `npx tsc --noEmit`, 앱 부팅 확인)를 이 세션에서는 수행 불가. Manager 또는 별도 환경에서 Node 설치 후 `cd eum-app && npx expo install && npx tsc --noEmit`를 반드시 실행해 전체 화면(다른 담당 폴더 포함) 타입 정합성을 검증해야 함.
- 스토어 계약의 `settings.scribe`/`toggleScribe()` 용도가 design-map에 명확히 문서화되어 있지 않음(원본 HTML엔 설정 화면에 대필 토글 UI가 없음). family 담당(SettingsScreen)과 조율해 이 액션이 실제로 어디서 쓰이는지 확정 필요 — 안 쓰인다면 스토어에서 제거하거나 문서에 용도 명시 권장.

## ④ 다음 단계 할 일
- Node 설치 후 `eum-app`에서 `npx expo install` → `npx tsc --noEmit` 실행, parent 4개 화면 포함 전체 타입 오류 점검.
- 시뮬레이터/디바이스로 앱 1회 부팅해 HomeScreen(AI카드/빈상태)·QuestionListScreen(캡슐·투표 진입)·QuestionDetailScreen(TTS 진행바)·RespondScreen(녹음 3단계·대필·전송 토스트) 흐름을 직접 눌러보며 아이콘 깨짐(특히 `edit_note`, `supervisor_account`, `hourglass_top`, `how_to_vote`) 및 폰트 굵기 렌더를 확인.
- HomeScreen의 `schedulePush`(1.4s 후 푸시 배너)가 `PushHost`/`PushBanner`와 실제로 QuestionDetail(qid:2)까지 정상 연결되는지 통합 확인(현재는 각자 계약대로 구현되어 있으나 실기기 확인 전).
- family 담당과 함께 `settings.scribe` 액션의 실사용처 확정.
