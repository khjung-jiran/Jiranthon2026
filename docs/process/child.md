# child 화면 폴더 — 진행 기록

담당: `eum-app/src/screens/child/` (DashboardScreen, ComposeScreen, ResponseListScreen, StorybookScreen)

## ① 한 일
- 작업 시작 시 `eum-app/src/screens/child/`의 4개 파일이 **이미 상당 수준으로 구현되어 있음**을 확인(동일 저장소에서 병렬로 진행 중인 다른 세션/이전 작업 산출물, `git status`상 미커밋 상태). 스텁 교체부터 시작하는 대신, 이 기존 구현을 **원본 대비 라인 단위로 정밀 검증**하는 감사(audit) 작업을 수행함.
- **중요 발견**: `view/design/support.js`는 범용 `dc-runtime` 빌드 산출물(파서/렌더러)일 뿐이며, 실제 화면별 상태모델·로직(`class Component extends DCLogic { state = {...}; renderVals(){...} }`)은 `view/design/이음.dc.html` **877~1365줄의 `<script type="text/x-dc" data-dc-script>` 안에 그대로 인라인**되어 있음. (common 담당 에이전트의 process.md에 "support.js가 컴파일/미니파이되어 renderVals 확인 불가"라는 기록이 있었는데, 이는 이 인라인 스크립트를 못 찾은 것으로 보임 — Manager/다른 화면 담당에게 공유 필요.) 이 스크립트에서 `sCDash`/`sCCompose`/`sCResp`/`sCStory`의 정확한 파생값 공식(예: `gearBg`/`qSendBg`/`ai[].bg,border,check`/`targets[].bg,border,fg`/`story.progPct,progText`/`dots[].w,bg`/`prevOp,nextOp`)을 모두 확인하고 기존 구현과 1:1 대조함.
- **DashboardScreen.tsx** (sCDash, 원본 256~320줄) 대조 결과: 헤더(자녀모드 라벨/인사말/서브카피), 알림·설정 아이콘 버튼(44×44/원형/`surfaceSoft`/`textMuted4`)+안읽음 dot, 답변대기/받은답변 통계 카드(라운드18/보더`border3`), 최근 도착 카드(`recent`=`answered[0]`, preview 42자 truncation), 질문보내기 버튼(accent+그림자), 이야기책/타임캡슐/가족투표 메뉴로우(`surfaceSoft3`, 아이콘박스 46×46 olive/mauve/gold), 우리 가족 아바타(이름 첫 글자 사용 — 라벨이 아니라 `name.slice(0,1)`이 맞음, 원본과 일치 확인) 전부 원본 수치·색·로직과 정확히 일치함을 확인. 수정 불필요.
- **ComposeScreen.tsx** (sCCompose, 321~354줄) 대조: 대상 선택 카드(on 상태 `blue`/`neutral`/`text2`), AI 추천 질문 리스트(`composeText===q`로 선택 판정 — textarea와 동일 state 공유하는 원본의 우아한 패턴 그대로 재현), 구분선, textarea, 하단 전송 버튼(`qSendBg/qSendFg` 동적색) 모두 원본과 일치. **버그 1건 발견 및 수정**: `sentQuestion` 모달(868줄)은 원본에서 스크림 `rgba(38,29,20,.5)`(=`scrimLight`)를 쓰는데, `revealCap` 모달과 달리 이 값이 `.55`(`scrim`, Overlay 기본값)가 아님 — 기존 코드가 `Overlay`에 `scrim` prop을 넘기지 않아 기본값(.55)이 적용되고 있었음. `scrim={colors.scrimLight}`를 명시적으로 추가해 수정함.
- **ResponseListScreen.tsx** (sCResp, 355~382줄) 대조: 응답 카드(질문/트랜스크립트/영어 토글/재생버튼+`EqBars`/이야기책 태그) 전부 원본과 일치. `showEn`/`showEnBtn`/`enLabel` 파생 로직(자동번역 or 개별 토글)도 `translatedIds` 스토어 상태 기반으로 원본 공식과 정확히 동일하게 구현되어 있음.
- **StorybookScreen.tsx** (sCStory, 383~444줄) 대조: 목차(TOC) 카드(`accentStrong` 배경, 챕터 카드 `tint(eraColor,12)`), 페이지 모드(`eraChip`=`tint(eraColor,13)`, 원본 그대로 `prNow=count||1, prTotal=3` 고정값으로 진행도 계산, 점 네비게이션 `dots`, 이전/다음 버튼 opacity `prevOp/nextOp`) 모두 원본 공식과 정확히 일치. `storyView`(toc/page) + `storyPage`(인덱스) 조합으로 원본의 `storyToc`/`storyPageMode`/`storyPage` 3개 상태를 동등하게 재현.
- 네비게이션 타입 검증: `DashboardScreen`은 `ChildTabParamList`(탭) 밖의 라우트(`Notification`/`Settings`/`Compose`/`Storybook`/`Capsule`/`Poll`)로 이동해야 하므로 `CompositeScreenProps<BottomTabScreenProps<ChildTabParamList,'Home'>, NativeStackScreenProps<RootStackParamList>>`로 타입 지정되어 있음을 확인 — 올바른 패턴(RootNavigator가 `ChildTabs`를 하나의 Stack.Screen으로 감싸고 그 옆에 `Compose`/`Storybook`/`Capsule`/`Poll` 등을 형제 스크린으로 등록한 구조와 일치).
- 색/폰트/라운드는 전부 `../theme` 토큰 사용, 하드코딩 없음(단 원본에 있으나 토큰에 없는 리터럴 3개는 화면 파일 상단에 로컬 상수로 유지하고 주석으로 병목 표시 — 아래 ③ 참고).

## ② 잘못한 일 / 리스크 / 미완성
- **본 세션에서 새로 작성한 코드가 거의 없음**: 4개 파일이 이미 완성도 높게 구현되어 있어, 이번 턴의 실질 기여는 "정밀 대조 감사 + 버그 1건 수정 + 문서화"에 그침. 만약 이 기존 구현이 실제로는 다른 목적(예: 템플릿/스캐폴딩)으로 존재했던 것이라면 재작성이 필요할 수 있음 — Manager 확인 요망.
- **타입체크/실행 미검증**: 이 환경에 `node`/`npm`/`npx`가 PATH에 없어(`node_modules`도 미설치) `npx tsc --noEmit`도, 앱 부팅도 수행하지 못함. common 담당 에이전트도 동일 제약을 보고함 — 환경 전체의 공통 문제. 코드는 Foundation 계약(컴포넌트 props/스토어 셀렉터/타입/네비 파라미터) 대비 수동 대조만 완료.
- **아이콘 실물 미검증**: `add_comment`, `auto_stories`, `hourglass_top`, `how_to_vote`, `auto_awesome`, `check_circle`, `radio_button_unchecked`, `menu_book`, `chevron_left/right` 등이 실제 `@expo/vector-icons` MaterialIcons 버전에 존재하는지 실기기로 확인 못 함. `src/icons.ts`의 매핑 자체는 이미 이 글리프들을 커버하고 있으나 렌더 확인은 필요.
- **경미한 스타일 재사용 여지**: `ComposeScreen`의 대상/AI 선택 카드, `DashboardScreen`의 메뉴로우 등은 `Card`/`Pill` 공통 컴포넌트 대신 로컬 `StyleSheet`로 직접 구현되어 있음. 시각적으로는 원본과 정확히 일치하지만, "공통 컴포넌트 우선 재사용" 원칙 관점에서는 `Card`(비대칭 padding은 `style` override로 가능)로 리팩터링할 여지가 있음. 기능·시각 결과에 영향 없는 정리 성격의 개선이라 우선순위는 낮다고 판단해 그대로 둠.
- **원본에 있으나 테마 토큰에 없는 리터럴 3개**(RN 4-weight 폰트 제약과는 별개로 색상 자체가 토큰 목록에 누락): `DashboardScreen`의 `#B87A2E`(답변대기 숫자 색), `StorybookScreen`의 `#F7EFE1`(TOC 헤더 카드 글자색), `#4C3C2B`(스토리 본문 글자색). 각 파일 상단에 로컬 상수로 유지하고 출처를 주석으로 남김 — 임의 변경 아님, 원본 값 그대로.

## ③ 병목 (Manager 처리 필요)
- **환경: Node/의존성 미설치**가 전 화면 공통 병목(Foundation·common도 동일 보고). `cd eum-app && npx expo install` 실행 후 `npx tsc --noEmit`로 4개 파일 포함 전체 타입 최종 확인 필요.
- **`support.js` vs `이음.dc.html` 인라인 스크립트 혼동**: 다른 화면 담당 에이전트들이 "support.js가 실제 로직"이라고 오인했을 가능성이 있음(common.md에 해당 정황 기록 있음). 실제 상태모델/파생값 공식은 `이음.dc.html` 877~1365줄에 있다는 점을 design-map.md나 Manager 공지에 명시해 다른 화면(특히 family: Poll/Capsule/Calendar/Album/Settings) 담당이 동일 시행착오를 겪지 않도록 공유 필요.
- **테마 토큰 누락 3건**(`#B87A2E`, `#F7EFE1`, `#4C3C2B`) — 다른 화면에서도 재사용되는 색이면 `theme/tokens.ts`에 정식 토큰화 검토 요망(현재는 화면 파일 로컬 상수로 임시 처리).
- **아이콘 실물 렌더 미검증** — Foundation의 기존 병목과 동일 건, 앱 1회 부팅 시 함께 확인 필요.

## ④ 다음 단계 할 일
1. Manager: Node/deps 설치(`npx expo install`) 후 `npx tsc --noEmit`로 child 4개 파일 포함 전체 타입 검증.
2. 앱 1회 부팅 후 자녀 모드 진입(로그인 → 자녀 선택)해서 Dashboard → Compose(전송 모달 스크림 밝기 확인: `.5` vs 다른 모달의 `.55`) → ResponseListScreen(재생/번역 토글) → Storybook(목차↔페이지 전환, 페이지 넘김, 진행도 바) 순서로 실기기 확인.
3. 아이콘 깨짐 발견 시 `src/icons.ts`의 `iconMap` 교정.
4. (선택, 저우선) `ComposeScreen`/`DashboardScreen`의 카드형 로컬 스타일을 공통 `Card` 컴포넌트로 리팩터링해 스타일 중복 축소 검토.
5. `#B87A2E`/`#F7EFE1`/`#4C3C2B`가 다른 화면(가족 폴더 등)에서도 등장하면 정식 토큰으로 승격.
