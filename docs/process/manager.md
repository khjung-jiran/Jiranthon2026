# Manager (통합) 진행 기록

담당: 전체 통합 — `eum-app/` 전 영역 + `docs/design-map.md` 계약 보정.

## ① 통합/수정한 것

**사전 확인**: `docs/design-map.md`, `docs/process/{foundation,common,parent,child,family}.md` 전량과
`eum-app/` 전체(App.tsx, navigation/, components/, theme/, store/, data/, icons.ts, screens/ 18개 파일)를
라인 단위로 정독. 결론: **네비게이션은 이미 완전히 연결되어 있었다** — Foundation이 만든
`RootNavigator`/`ParentTabs`/`ChildTabs`에 stub이 하나도 남아있지 않고, 4개 화면 폴더 에이전트가 전부
실제 구현으로 교체를 완료한 상태였다(각 process.md의 "다음 단계"에 남아있던 항목은 대부분 Node 미설치로
인한 검증 누락이었고, 실제 코드 결함은 아니었음). 그래서 Manager 작업은 "빈 자리 연결"이 아니라
**정적 정합성 점검 + 중복 제거 + 토큰/계약 보정**에 집중했다.

1. **의존성 결함 수정(신규 발견)**: `eum-app/package.json`에 `babel-preset-expo`가 devDependencies에서
   누락되어 있었다. `babel.config.js`가 `babel-preset-expo` 프리셋을 요구하므로, 이 상태로는
   `npm install` 후에도 Metro/babel 빌드가 즉시 깨진다. 저장소에 남아있던(초기 `create-expo-app` 스캐폴드
   시절) `package-lock.json`에서 `babel-preset-expo: ~57.0.2` 참조를 근거로 devDependencies에 추가했다.
   (다른 5개 에이전트 모두 Node 미설치로 이 결함을 발견하지 못했음 — 이번 Manager 패스의 가장 실질적인
   수정.)
2. **테마 토큰 보강 + 하드코딩 제거**(child/family가 공통 보고한 토큰 누락 3~4건 해소):
   `src/theme/tokens.ts`에 `coverText`(#F7EFE1), `storyBody`(#4C3C2B), `statPendingFg`(#B87A2E),
   `textScrim`(rgba(46,35,24,.55)) 4개 토큰을 정식 추가하고, `DashboardScreen.tsx`(child)의
   `PENDING_COUNT_FG` 로컬 상수, `StorybookScreen.tsx`(child)의 `TOC_HEADER_FG`/`STORY_BODY_FG` 로컬 상수,
   `BookletScreen.tsx`(family)의 `'#F7EFE1'` 리터럴 5곳, `AlbumScreen.tsx`(family)의
   `'rgba(46,35,24,0.55)'` 리터럴 1곳을 모두 토큰 참조로 교체했다.
3. **아이콘 매핑 보완**: `src/icons.ts`의 `iconMap`에 `person_add`(family 담당이 보고한 누락 건)를 추가.
   전체 화면에서 쓰인 Material Symbols 글리프(약 55종)를 전부 grep으로 추출해 `iconMap`과 대조한 결과,
   이 건 외에는 전부 매핑돼 있음을 확인(나머지는 kebab 폴백으로도 정상 동작하는 이름들이었음).
4. **중복 로직 통합(§3 중복 제거)**:
   - `avColor(q)` (발신자 아바타 배경색 계산)가 `parent/HomeScreen.tsx`·`QuestionListScreen.tsx`·
     `QuestionDetailScreen.tsx` 3곳에 동일하게 정의돼 있던 것을 `src/utils/avatar.ts`의
     `avatarColorFor()`로 통합하고 3개 파일에서 로컬 정의를 제거했다.
   - `fmt(secs)` (mm:ss 포맷터)가 `parent/RespondScreen.tsx`·`family/CapsuleNewScreen.tsx` 2곳에
     동일하게 정의돼 있던 것을 `src/utils/time.ts`의 `formatDuration()`으로 통합했다.
   - **펄스링 애니메이션 불일치 발견 및 수정**: `RespondScreen`(부모)은 원본
     `@keyframes pulseRing`(scale .9→1.75, opacity .55→0, 1.5s ease-out — `이음.dc.html` 26번째 줄,
     202/625번째 줄에서 양쪽 화면에 동일하게 쓰임)을 정확히 재현했지만, `CapsuleNewScreen`(가족)의
     로컬 `PulseRing` 컴포넌트는 값이 달랐다(scale 1→1.7, opacity .5→0 — 원본과 다른 임의값).
     두 화면 모두 같은 원본 keyframe을 쓰므로, 공용 `src/components/PulseRing.tsx`(size prop으로
     104px/84px 겹쳐그리기 대응)를 신설해 원본 정확값으로 통일하고 두 화면 모두 이걸 쓰도록 교체했다.
     (family 에이전트가 만든 근사값 버전은 사소하지만 실제 원본-대비 시각 오차였음 — 이번에 잡은
     유일한 "픽셀 훼손" 사례.)
5. **스토어 죽은 API 제거**: `settings.scribe`/`toggleScribe()`는 parent·family 두 에이전트가 공통으로
   "용도 불명" 병목으로 보고한 항목. 원본 `이음.dc.html`을 재확인한 결과 sSetting(환경설정)에 대필 토글
   UI가 없고, 대필은 `sPRespond` 화면 로컬 상태(`scribe`)로만 존재함이 확실했다. 실제로 어떤 화면도
   store의 `toggleScribe`/`settings.scribe`를 참조하지 않는 죽은 코드였으므로 `useStore.ts`에서
   제거하고 `docs/design-map.md`의 스토어 계약에도 "제거함" 각주를 남겼다.
6. **문서 정정(`docs/design-map.md`)**:
   - Foundation 산출물 §1 colors 목록에 위 4개 신규 토큰 추가.
   - §0 기술세팅에 `babel-preset-expo` 결함 수정 내역 + "실제 화면별 로직은 `support.js`가 아니라
     `이음.dc.html` 877~1365줄 인라인 `<script data-dc-script>`에 있다"는 정정 사항(child 에이전트가
     최초 발견, common 에이전트가 이 지점에서 혼동했던 것)을 명시해 향후 회귀 방지.
   - §5 공통 컴포넌트 목록에 `PulseRing` 추가, 폴더 구조에 `src/utils/` 추가.
   - §4 스토어 액션에서 `toggleScribe`/`settings.scribe` 제거 및 이유 각주.

## ② 해소한 병목

- 5개 process.md가 공통으로 보고한 **"Node/npm/npx 미설치로 tsc·앱부팅 검증 불가"** 병목: 이 세션에서도
  `bash`/`PowerShell` 양쪽에서 `node`/`npm`/`npx` 전부 not found로 재확인됨(해소 불가 — 아래 남은 이슈
  참고). 대신 **코드 리딩 기반 정적 정합성 점검**(요청받은 대안)으로 전체 18개 화면·9개 공통
  컴포넌트·네비게이션 3파일·스토어·테마·아이콘·목업을 라인 단위로 대조하여 import 경로/props
  시그니처/타입/토큰명 불일치를 확인했고, 실질적 결함(babel-preset-expo 누락, PulseRing 값 오차,
  토큰 미정의 4건, 아이콘 매핑 1건, 중복 함수 2건, 죽은 스토어 API 1건)을 모두 수정했다.
- common 에이전트가 보고한 **"알림 nav→탭 이동 계약 모호(album/c_resp)"**: `NotificationScreen`의
  `navigate(role==='child'?'ChildTabs':'ParentTabs', {screen:...})` role 분기 구현을 검토한 결과,
  Notification 화면은 항상 로그인된 role 컨텍스트(ParentTabs/ChildTabs 내부)에서만 진입 가능하므로
  이 분기는 안전하고 타입도 일치한다. **원본에 이보다 더 명확한 대안 경로가 없어 이 구현을 그대로
  채택 확정**한다(추가 수정 없음).
- child 에이전트가 보고한 **"support.js vs 이음.dc.html 인라인 스크립트 혼동"**: design-map.md에
  정정 사항을 명문화해 family를 포함한 향후 어떤 에이전트도 같은 시행착오를 겪지 않도록 했다.
- child/family가 보고한 **테마 토큰 누락(#B87A2E/#F7EFE1/#4C3C2B/rgba(text,55%))**: 4건 전부 토큰화 완료.
- family가 보고한 **아이콘 매핑 누락(person_add)**: 매핑 추가 완료.
- parent/family가 공통 보고한 **`settings.scribe`/`toggleScribe()` 용도 불명**: 죽은 코드로 확인,
  제거로 결론.
- family가 보고한 **"자녀 화면이 실제로 navigate('Capsule'/'Poll'/'Booklet') 호출하는지"**:
  `DashboardScreen`(Capsule/Poll)·`StorybookScreen`(Booklet) 모두 확인 완료 — 이미 정상 연결돼 있었음.

## ③ 남은 이슈 (시니어 리�비/후속 세션 필요)

1. **Node.js/npm/npx가 이 실행 환경 전체(Bash·PowerShell)에 설치되어 있지 않음** — Foundation부터
   Manager까지 5개 세션 전원이 동일하게 보고한 근본 병목. `npx expo install` / `npx tsc --noEmit` /
   앱 1회 부팅은 **Node가 설치된 별도 환경(또는 CI)에서 반드시 수행**해야 한다. 이번 Manager 패스는
   코드 리딩만으로 잡을 수 있는 결함(누락 의존성·중복 함수·토큰·아이콘·죽은 API·애니메이션 값 오차)은
   모두 수정했지만, **실제 컴파일러가 잡는 타입 오류(예: 미세한 제네릭 불일치, 라이브러리 버전 간
   API 시그니처 차이)는 이 패스로 검증되지 않는다.**
2. **패키지 버전 재확정 필요**: `package.json`의 expo/react/react-native/typescript 및 오늘 추가한
   `babel-preset-expo` 버전은 Foundation의 추정치 + 이번에 스캐폴드 lockfile에서 역추적한 값이다.
   `npx expo install`로 실제 SDK 정합 버전으로 덮어써야 한다.
3. **아이콘 실물 렌더 미검증**: `iconMap`의 매핑 자체는 코드 리딩상 전 화면 커버 확인했으나(약 55개
   글리프 grep 대조 완료), 설치된 `@expo/vector-icons` 버전에서 실제로 해당 글리프가 존재하는지는
   앱을 1회 부팅해야 확정 가능하다.
4. **`sSoon`/`ComingSoonScreen` 경로는 원본에서도 실제로는 트리거되는 곳이 없는 vestigial
   placeholder임을 확인**(원본 스크립트에 `screen:'soon'`을 세팅하는 버튼이 전혀 없음 — grep으로
   확인). RN 포팅본도 동일하게 아무 화면에서도 `navigate('ComingSoon', ...)`을 호출하지 않는다.
   원본을 충실히 재현한 결과이므로 버그로 취급하지 않았으나, 향후 실제 사용처가 필요하면(예: 설정
   화면에서 "캘린더 고급 기능" 같은 준비중 배지) 그때 연결하면 된다.
5. **원본 `photosData`의 반복 대각 스트라이프 배경**(`AlbumScreen`), **소책자 커버 그림자의 정확한
   `rgba(46,35,24,.5)` 24px/-22px 오프셋**(`BookletScreen`)은 family 에이전트가 이미 문서화한 대로
   RN 근사치로 단순화돼 있다. 시각적으로 원본과 매우 유사하지만 100% 동일 재현은 아니므로, 디자인
   시니어 리뷰에서 허용 오차인지 최종 확인 필요.
6. **`expo-av`가 package.json에는 있으나 실제 코드 어디서도 import되지 않음**(오디오는 전부 `Animated`
   목업 타이머로 대체). MVP 목적상 문제는 없으나, 실제 오디오 재생을 붙이는 다음 단계에서
   `expo-av`(SDK57 deprecated 가능성 있음, Foundation이 이미 리스크로 기록) 대신 `expo-audio`로
   교체할지 여부는 시니어 판단 필요.
7. `src/screens/_Stub.tsx`는 이제 아무 화면에서도 참조하지 않는 죽은 파일(모든 stub이 실제 구현으로
   교체 완료). 컴파일에는 영향 없으나 정리 차원에서 삭제해도 무방.

## 파일 변경 목록(이번 패스)

- `eum-app/package.json` — `babel-preset-expo` devDependency 추가.
- `eum-app/src/theme/tokens.ts` — `coverText`/`storyBody`/`statPendingFg`/`textScrim` 토큰 추가.
- `eum-app/src/icons.ts` — `person_add` 매핑 추가.
- `eum-app/src/store/useStore.ts` — `settings.scribe`/`toggleScribe()` 제거.
- `eum-app/src/utils/avatar.ts` — 신규(공용 `avatarColorFor()`).
- `eum-app/src/utils/time.ts` — 신규(공용 `formatDuration()`).
- `eum-app/src/components/PulseRing.tsx` — 신규(공용 펄스링, 원본 keyframe 정확값).
- `eum-app/src/components/index.ts` — `PulseRing` 배럴 export 추가.
- `eum-app/src/screens/parent/HomeScreen.tsx` — 로컬 `avColor` 제거 → utils 사용.
- `eum-app/src/screens/parent/QuestionListScreen.tsx` — 로컬 `avColor` 제거 → utils 사용.
- `eum-app/src/screens/parent/QuestionDetailScreen.tsx` — 로컬 `avColor` 제거 → utils 사용.
- `eum-app/src/screens/parent/RespondScreen.tsx` — 로컬 `fmt`/펄스링 인라인 코드 제거 → utils/components 사용.
- `eum-app/src/screens/family/CapsuleNewScreen.tsx` — 로컬 `fmt`/`PulseRing`(오차값) 제거 → utils/components 사용.
- `eum-app/src/screens/child/DashboardScreen.tsx` — `#B87A2E` 로컬 상수 제거 → 토큰 사용.
- `eum-app/src/screens/child/StorybookScreen.tsx` — `#F7EFE1`/`#4C3C2B` 로컬 상수 제거 → 토큰 사용.
- `eum-app/src/screens/family/BookletScreen.tsx` — `#F7EFE1` 리터럴 5곳 → 토큰 사용.
- `eum-app/src/screens/family/AlbumScreen.tsx` — `rgba(46,35,24,.55)` 리터럴 → 토큰 사용.
- `docs/design-map.md` — Foundation 산출물 섹션에 신규 토큰/컴포넌트/폴더 반영, 스토어 계약에서
  `scribe` 제거 각주, support.js 관련 정정, babel-preset-expo 수정 내역 기록.
