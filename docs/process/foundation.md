# Foundation (기반) 진행 기록

## ① 한 일
- `docs/design-map.md` 계약 준수하에 `eum-app/` 뼈대 전면 재구축 (기존 `src` 전면 교체).
- **설정**: `package.json`(expo/react/react-native 버전 유지 + React Navigation v7·zustand·@expo/vector-icons·expo-font·@expo-google-fonts/noto-sans-kr·expo-av·safe-area-context·screens 추가, expo-router 제거), `app.json`(expo-router 플러그인 → expo-font), `babel.config.js`(babel-preset-expo), `index.ts` 유지.
- **테마**: `src/theme/tokens.ts`(원본 인라인 hex 전량 토큰화, color-mix→계산 hex), `src/theme/index.ts`(`tint()`/`shade()` 계산 헬퍼 + 배럴).
- **타입**: `src/types/index.ts`(명세 8장 User/Family/Question/Answer/Story/Photo/Poll + Capsule/Notif/CalEvent).
- **스토어**: `src/store/useStore.ts`(zustand — role/currentUser/tab/target + 도메인 데이터·액션 이식: login/switchRole/answerQuestion/vote/sealCapsule/toast/push 등).
- **목업**: `src/data/mock.ts`(support.js state/배열 1:1 이식 — capsules/notifs/questions/aiQ/pages/events/photos/poll/family/eraTone 등).
- **아이콘**: `src/icons.ts`(원본 글리프 40+개 → MaterialIcons 매핑 + `Icon` 컴포넌트, 미매핑 kebab 폴백).
- **공통 컴포넌트**: `src/components/` — ScreenContainer, Header, Button(parentPrimary 포함), Card, Pill, SectionLabel, VoiceBars(로그인), EqBars(재생), RecordingWave(녹음), Toast+ToastHost, PushBanner+PushHost, Overlay(모달), ImageSlot, + Icon 재노출. 원본 수치 준수.
- **네비**: `src/navigation/` — RootNavigator(native-stack, role 자동분기), ParentTabs/ChildTabs(bottom-tabs, 탭바 흰배경/상단보더#EEE2D1/아이콘26/라벨11·700/활성accent), tabOptions, types(ParamList+TAB_META), navRef(화면 밖 네비).
- **App**: `App.tsx`(Noto Sans KR 4종 로드 + SafeAreaProvider + NavigationContainer(navigationRef) + RootNavigator + 전역 PushHost/ToastHost).
- **stub 화면 18종**: `src/screens/{common,parent,child,family}/*.tsx` + `_Stub.tsx`. named export로 컴파일 일관성 확보(Manager/화면 에이전트가 파일 통째 교체).
- **계약 문서화**: `design-map.md` 하단 "Foundation 산출물" 섹션 append(토큰/컴포넌트 props/스토어 API/route+params/화면 파일 규칙).

## ② 잘못한 일 / 리스크
- **의존성 미설치**: `node_modules`가 없어 `tsc`/실행 검증 불가. 타입은 수동 검토만 함 → 설치 후 typecheck 필요.
- **아이콘 이름 리스크**: 일부 Material Symbols 글리프(elderly, mark_email_unread, how_to_vote, event_repeat, hourglass_top 등)가 설치된 MaterialIcons 버전에 없을 수 있음. 없으면 빈 박스 렌더. `iconMap`에서 개별 교정 필요.
- **play_circle/pause_circle**를 outline 변형(`-outline`)으로 매핑 — 원본 Outlined 감성 우선. 필요 시 filled로 조정.
- **accentSoft**: 원본 CSS 실렌더값(color-mix 계산) `#F4EAE6` 사용. design-map 표기 `#F6E4D7`(근사)와 다름 — 실제 픽셀 기준으로 계산값 채택(문서에 명시).
- **탭 구성**: 원본 HTML 탭(홈/이야기/달력/사진)을 따름. Task 문구("보이스/캘린더/앨범/환경설정")와 상이. 설정은 홈 헤더 기어에서 stack push. → Manager 확인 권장.
- **버전 핀**: 추가 패키지 버전은 합리적 추정치. 반드시 `npx expo install`로 SDK 57 정합 맞출 것.
- **expo-av**: SDK 57에서 deprecated 가능(권장 expo-audio). 계약대로 expo-av 유지했으나 오디오 담당 에이전트가 재검토 여지.

## ③ 병목
- 의존성 설치/버전 정합(`npx expo install`)이 선행돼야 전체 컴파일·실행 검증 가능.
- 아이콘 매핑 실물 검증은 앱 실행(또는 vector-icons 글리프 목록 확인) 필요.

## ④ 다음 단계 할 일
1. `cd eum-app && npx expo install` 로 의존성 설치·버전 정합 → `npx tsc --noEmit`로 타입 검증.
2. 앱 1회 부팅해 폰트 로드/탭바/토스트/푸시/모달 렌더 확인, 아이콘 깨짐 점검 후 `iconMap` 교정.
3. 화면 에이전트: `design-map.md` "Foundation 산출물" 계약대로 stub 18종을 실제 화면으로 교체(export 이름 유지).
   - 우선순위: 로그인(login)·부모 홈(HomeScreen)·QuestionDetail/Respond(핵심 보이스 플로우) → 자녀 대시보드/Compose/Storybook → 가족(Poll/Capsule/Calendar/Album/Settings).
4. 로그인 화면에서 `login(role)` 호출로 역할 진입, 홈 기어 → `navigate('Settings')`, 푸시 자동표시(부모 진입 후)는 필요 시 화면/스토어에서 `setPush` 트리거 로직 연결.
