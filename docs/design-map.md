# 이음(Ieum) 앱 — 구현 설계 계약서 (Design Map)

> 모든 에이전트는 이 문서를 **공유 계약**으로 삼는다. 디자인 원본(`view/design/`)은 **읽기 전용** — 절대 수정 금지.
> 목표: `view/design/이음.dc.html` 디자인을 **한 픽셀도 훼손하지 않고** iOS/Android(React Native/Expo) 앱으로 완전 이식.

## 소스 오브 트루스
- `view/design/이음.dc.html` (1367줄): 화면 마크업 (인라인 스타일). `<sc-if value="{{ sXxx }}">` = 화면, `<sc-for>` = 반복, `{{ ... }}` = 바인딩.
- `view/design/support.js` (1702줄): `DCLogic` 컴포넌트 = 상태 모델 + **목업 데이터**(capsules/notifs/pollVotes/target 등) + 화면 전환 로직. 목업 데이터는 여기서 그대로 가져온다.
- `view/design/image-slot.js`: 이미지 placeholder 컴포넌트 (RN에서는 회색 라운드 박스 + 안내문구로 대체).
- `view/design/uploads/family-voice-project-structure.md`: 기획/화면목록/디자인토큰/데이터모델 명세.

## 기술 스택 (확정)
- **Expo (React Native) + TypeScript** — iOS/Android 단일 코드베이스
- **네비게이션**: React Navigation (`@react-navigation/native`, `native-stack`, `bottom-tabs`) + `react-native-screens`, `react-native-safe-area-context`
- **상태관리**: Zustand
- **아이콘**: `@expo/vector-icons` (MaterialIcons) — 디자인의 `Material Symbols Outlined` 이름을 MaterialIcons 이름으로 매핑 (`src/icons.ts`에서 관리)
- **폰트**: `@expo-google-fonts/noto-sans-kr` + `expo-font` (400/500/700/800)
- **오디오**: `expo-av` (녹음/재생은 MVP에서 목업 동작 허용)
- **데이터**: 전부 목업 (프론트 MVP). 서버 연동은 추후.

## 화면 라인맵 (`이음.dc.html`)
| 상태키 | 화면 | 라인 | 담당 폴더 |
|--------|------|------|-----------|
| sLogin | 로그인/역할선택 | 47–76 | common |
| sNotif | 알림 | 646–664 | common |
| sPHome | 부모 홈 | 77–130 | parent |
| sPList | 부모 받은질문 목록 | 131–173 | parent |
| sPDetail | 부모 질문상세(TTS) | 174–200 | parent |
| sPRespond | 부모 응답(녹음) | 201–255 | parent |
| sCDash | 자식 대시보드 | 256–320 | child |
| sCCompose | 자식 질문작성(AI추천) | 321–354 | child |
| sCResp | 자식 응답확인(음성재생) | 355–382 | child |
| sCStory | 자식 스토리북 | 383–444 | child |
| sCal | 캘린더 | 445–515 | family |
| sAlbum | 앨범 | 516–565 | family |
| sCaps | 타임캡슐 목록 | 566–590 | family |
| sCapsNew | 타임캡슐 작성 | 591–645 | family |
| sPoll | 가족 투표 | 665–695 | family |
| sBooklet | 소책자(QR) | 696–724 | family |
| sSetting | 환경설정 | 725–801 | family |
| sSoon | 준비중 placeholder | 802–808 | family |
| showTabs | 하단 탭바(공통) | 812–824 | foundation |
| toast/push/revealCap/sentQuestion | 오버레이(공통) | 826–871 | foundation |

## 디자인 토큰 (원본 색상 — 정확히 준수)
```
색상
  primary(accent)   #AC5D3B   // 테라코타 (강조/버튼/탭 활성)
  accentStrong      color-mix(#AC5D3B, black 24%)  ≈ #86452A
  accentSoft        #F6E4D7   // 강조 옅은 배경
  bgScreen          #FAF3EA   // 화면 배경
  bgOuter           #EAE0D2
  surface           #FFFFFF   // 카드/탭바
  text              #2E2318   // 본문(진한 갈색-검정)
  textMuted         #8C7961 / #7C6A54 / #9A8873
  textFaint         #B5A48A / #A8967E / #C4B398
  olive             #7C8A55   // 보조(파형/올리브)
  oliveDeep         #5C6B3D
  oliveSoft         #ECEFDD
  border            #EEE2D1 / #E4E2DB / #D3C3AA(dashed) / #E7DAC6
  surfaceSoft       #F2E8DA / #F5EADA
  // 카테고리 색(캡슐/알림): 올리브 #7C8A55, 골드 #9A7B3C, 블루 #5B7086, 모브 #8C5F6E
색상선택지(브랜드): #AC5D3B, #9A7B3C, #7C8A55, #8C5F6E

타이포 (Noto Sans KR)
  logo 38/800, heading 28/800, title 22~23/800, 19/700, 17/700, body 16, 15, 13, 12, 11
  line-height 1.5~1.65, letter-spacing 대제목 음수(-.3~-1.5px)
  ※ 부모 모드는 본문 크게(≥16, 버튼 큼), 자식 모드는 상대적으로 조밀

간격/모양
  radius: 26(모달), 20, 16, 14, 13, 12, 999(pill)
  touch(부모 버튼 높이): 54~60px, 간격 ≥14px
  화면 좌우 패딩: 부모 30px, 카드 라운드 큼
  하단 탭바: 흰 배경 + 상단보더 #EEE2D1, 아이콘 26px, 라벨 11/700, 홈 인디케이터 바
```

## 렌더링 규칙 (원본 훼손 방지)
- 원본은 400×848 폰 프레임 목업 → RN에서는 **프레임 chrome 제거**, `SafeAreaView`로 실제 노치/상태바 처리. 상단 가짜 상태바(9:41) 렌더 금지.
- 인라인 스타일 수치(패딩/폰트/색/라운드)는 **원본 값 그대로** `StyleSheet`로 옮긴다. 임의 변경 금지.
- `zoom`, `color-mix`, CSS 애니메이션(@keyframes)은 RN 대응: `color-mix`는 계산된 hex로, 애니메이션은 `Animated`/`react-native`의 간단 대체(파형 eqbar, pulseRing 등)로 구현하되 시각 결과 동일하게.
- 아이콘: `Material Symbols Outlined` 글리프명 → `src/icons.ts` 매핑 사용. 없는 아이콘은 가장 근접한 MaterialIcons로.
- 이미지 슬롯: 라운드 회색 박스 + placeholder 텍스트(원본 문구 유지).

## 폴더 구조 (eum-app, 새로 구축 — 기존 src 전면 교체)
```
eum-app/
  App.tsx                      # NavigationContainer + 역할분기 루트
  index.ts / app.json / tsconfig.json / babel.config.js / package.json
  src/
    theme/          tokens.ts, index.ts      # 위 디자인 토큰
    types/          index.ts                  # 데이터 모델(명세 8장)
    store/          useStore.ts               # zustand: user, role, tab 등
    data/           mock.ts                    # support.js의 목업 그대로 이식
    icons.ts                                   # Material Symbols→MaterialIcons 매핑
    utils/          avatar.ts, time.ts          # (Manager 추가) 화면 간 중복 로직 통합 — avatarColorFor(), formatDuration()
    components/     Header, Button, Card, BottomTab(네비용), VoiceBars, EqBars,
                    Toast, PushBanner, Overlay(Modal), ImageSlot, Pill, SectionLabel ...
    navigation/     RootNavigator.tsx, ParentTabs.tsx, ChildTabs.tsx
    screens/
      common/       LoginScreen.tsx, NotificationScreen.tsx
      parent/       HomeScreen, QuestionListScreen, QuestionDetailScreen, RespondScreen
      child/        DashboardScreen, ComposeScreen, ResponseListScreen, StorybookScreen
      family/       CalendarScreen, AlbumScreen, PollScreen, CapsuleScreen,
                    CapsuleNewScreen, BookletScreen, SettingsScreen, ComingSoonScreen
```

## 공유 컴포넌트/테마 계약
- 모든 화면은 `src/theme`의 토큰만 사용(하드코딩 색 금지, 단 원본 카테고리 색은 토큰에 정의).
- 공통 컴포넌트 API는 Foundation 에이전트가 확정하여 이 문서 하단 "Foundation 산출물"에 추가 기록한다. 화면 에이전트는 그 API를 그대로 사용.

## 진행상황 기록 규칙 (process.md)
- 각 에이전트는 `docs/process/<unit>.md`에 **① 한 일 ② 잘못한 일/리스크 ③ 병목 ④ 다음 단계 할 일**을 기록.
- Manager가 병목을 취합·해소하고 통합. 최종 시니어 리뷰 후 루트 `process.md`로 통합 정리.

<!-- Foundation 산출물(컴포넌트/테마 API)은 아래에 append -->

---

# Foundation 산출물 (컴포넌트/테마/네비 API 계약)

> Foundation 에이전트가 확정. **화면 에이전트는 이 계약만 보고 작성 가능**해야 한다.
> 모든 앱 코드는 `eum-app/` 아래. 하드코딩 색/폰트weight 금지 — 아래 토큰/컴포넌트만 사용.
> **중요(RN 폰트 규칙)**: 커스텀 폰트는 `fontWeight`가 무시된다. 굵기는 반드시 `fontFamily`로 지정.

## 0. 기술 세팅
- 네비: React Navigation v7 (native-stack + bottom-tabs), `react-native-screens`, `react-native-safe-area-context`.
- 상태: zustand (`src/store/useStore.ts`).
- 폰트: `@expo-google-fonts/noto-sans-kr` (App.tsx에서 로드 완료 — 화면에서 별도 로드 불필요).
- 아이콘: `@expo/vector-icons/MaterialIcons` 래핑 `Icon`(원본 글리프명 그대로 사용). `iconMap`에 `person_add` 포함(Manager 추가, 기존엔 kebab 폴백으로만 동작).
- 설치: `cd eum-app && npx expo install` 로 버전 정합 후 실행. (Manager 확인: `package.json`에 `babel-preset-expo`가 devDependencies에서 누락되어 있어 `babel.config.js`의 `babel-preset-expo` 프리셋을 resolve할 수 없는 상태였음 — 저장소에 남아있던 초기 스캐폴드용 `package-lock.json`을 근거로 `~57.0.2`를 추가했다. 이 값은 `npx expo install` 실행 시 실제 SDK57 정합 버전으로 재확정 필요.)
- **중요(소스 위치 정정)**: 화면별 실제 상태모델/파생값 로직(`class Component extends DCLogic`, `renderVals()` 등)은 `support.js`가 아니라 **`view/design/이음.dc.html` 877~1365줄의 인라인 `<script type="text/x-dc" data-dc-script>`** 안에 있다. `support.js`는 그 스크립트를 파싱/렌더링하는 범용 `dc-runtime`일 뿐 화면별 로직을 담고 있지 않다(여러 화면 에이전트가 이 지점에서 혼동했었음 — child 담당이 최초 확인).

## 1. 테마 토큰 — `import { ... } from '../theme'`
`colors`, `brandPalette`, `categoryColors`, `fonts`, `typography`, `radius`, `spacing`, `sizes`, `shadow`, `tint()`, `shade()`.

- **colors** (주요): `primary/accent`(#AC5D3B), `accentStrong`(#86452A), `accentSoft`(#F4EAE6, =color-mix accent 13% 계산값), `bgScreen`(#FAF3EA), `bgOuter`(#EAE0D2), `surface`(#fff), `surfaceSoft`(#F2E8DA), `surfaceSoft2`(#F5EADA), `surfaceSoft3`(#F3EADC), `neutral`(#ECEAE4), `text`(#2E2318), `text2`(#3C2F22), `textMuted`(#8C7961), `textMuted2`(#7C6A54), `textMuted3`(#9A8873), `textMuted4`(#5C4A36), `textFaint`(#B5A48A), `textFaint2`(#A8967E), `textFaint3`(#C4B398), `textFaint4`(#D1C0A6), `textFaint5`(#D3C3AA), `olive`(#7C8A55), `oliveDeep`(#5C6B3D), `oliveSoft`(#ECEFDD), `gold`(#9A7B3C), `blue`(#5B7086), `mauve`(#8C5F6E), `border`(#EEE2D1), `border2`(#E9DBC9), `border3`(#EBDECB), `border4`(#E0D2BF, 토글 off), `borderCool`(#E4E2DB), `borderWarm`(#E7DAC6), `borderDashed`(#D3C3AA), `divider`(#E3D4C0), `danger`(#C2453B), `pendingBg`(#F6ECDA)/`pendingFg`(#9A6B1E), `answeredBg`(#ECEFDD)/`answeredFg`(#5C6B3D), `track`(#ECDFCC), `toastBg`(#2E2318)/`toastText`(#fff)/`toastIcon`(#B4C77F), `scrim`(rgba(38,29,20,.55)), `scrimLight`, `white`, `black`.
  - (Manager 추가, 화면 에이전트가 보고한 토큰 미정의 리터럴 3~4건 정식 토큰화) `coverText`(#F7EFE1, 소책자 커버/QR·스토리북 TOC 헤더카드 밝은 글자색), `storyBody`(#4C3C2B, 스토리북 본문 글자색), `statPendingFg`(#B87A2E, 자녀 대시보드 "답변 대기" 숫자색), `textScrim`(rgba(46,35,24,.55), 앨범 그리드 캡션 오버레이 = text 55% 불투명도).
- **fonts**: `regular`(400), `medium`(500), `bold`(700), `extraBold`(800). → `{ fontFamily: fonts.extraBold }`.
- **typography** (프리셋, color는 직접): `logo`(38/800/-1.5), `heading`(28/800/-.5), `title`(22/800), `titleSm`(20/800), `question`(22/700/lh33/-.3), `h19`, `h18`, `h17`, `body`(16/lh26), `bodyMd`(15/500), `body15`, `small`(14), `label13`(13/700), `caption`(12/500), `tab`(11/700).
- **radius**: `modal`(26), `xl`(24), `lg`(22), `r20 r18 r16 r14 r13 r12`, `pill`(999).
- **spacing**: `screenX`(30, 부모 좌우), `cardX`(26), `gap`(14), `gapSm`(8), `gapLg`(20).
- **sizes**: `touchMin`(54), `buttonMd`(56), `buttonLg`(60), `buttonXl`(64), `iconButton`(52), `tabIcon`(26), `tabLabel`(11), `recordButton`(104), `avatarSm`(38).
- **shadow**: `card`, `accentButton`, `toast`, `push` (스프레드해서 style에).
- **tint(hex, %)**: `color-mix(hex %, #fff)` 계산. 예 `tint('#8C5F6E', 8)`(poll 선택 bg), `tint(color, 13)`(캡슐 reveal 원형 bg). **shade(hex, %)**: black 혼합.

## 2. 데이터 타입 — `import type { ... } from '../types'`
`Role`('parent'|'child'), `User`, `Family`, `FamilyMember`, `Question`(id,text,from,rel,ago,status,ai?,dur?,era?,transcript?,transcriptEn?), `QuestionStatus`('pending'|'answered'), `Answer`, `StorybookPage`(era,years,title,dur,count,isNew,body), `Photo`(label,who,tone), `Poll`, `Capsule`(id,from,to,title,when,status,dur?,dday?,color), `CapsuleStatus`('ready'|'locked'|'open'), `Notif`(id,icon,color,title,time,unread,nav), `CalEvent`, `FontSizeOption`.

## 3. 목업 데이터 — `import { ... } from '../data/mock'`
`capsules`, `notifs`, `questions`, `aiQuestions`, `aiHomeQuestionText`, `storybookPages`, `calendarEvents`, `calendarDotMap`, `todayDate`(9), `weekdays`, `photos`, `albumFilters`, `pollTitle`, `pollLabels`, `pollVotesInit`, `targets`, `family`, `eraTone`, `avatarPalette`, `capsuleToOptions`, `capsuleWhenOptions`, `capsuleWhenMap`, `fontSizeOptions`, `fontZoomMap`, `aiGapOptions`, `defaultTarget`, `defaultAiGapDays`.
※ 대부분의 가변 도메인 데이터는 **스토어**에도 들어있다(아래). 렌더시엔 스토어를 우선 구독.

## 4. 스토어 — `import { useStore } from '../store/useStore'`
selector 사용: `const role = useStore(s => s.role)`.
- **상태**: `role`(Role|null), `currentUser`(User|null), `tab`('home'|'voice'|'calendar'|'album'), `questions`, `capsules`, `notifs`, `pollVotes`, `pollVoted`, `albumFilter`, `extraPhotos`, `aiGapDays`, `translatedIds`, `target`, `settings`{autoTranslate,voiceGuide,fontSize}, `toast`(string|null), `push`({qid,title}|null).
- **액션**: `login(role)`, `logout()`, `switchRole()`, `setTab(tab)`, `showToast(msg, ms?)`, `clearToast()`, `setPush(p)`, `setTarget(name)`, `answerQuestion(id,{dur,transcript,era?})`, `ensureAiQuestion(): number`(id 99 보장), `toggleTranslate(id)`, `vote(i)`, `markNotifRead(id)`, `readAllNotifs()`, `setAlbumFilter(f)`, `addPhoto(photo?)`, `markCapsuleOpen(id)`, `sealCapsule({to,when,title,dur,from?})`, `setAiGapDays(n)`, `toggleAutoTranslate()`, `toggleVoiceGuide()`, `setFontSize(size)`.
  - (Manager 결정) 초기 계약에 있던 `settings.scribe`/`toggleScribe()`는 원본 HTML(sSetting, sPRespond)에 전역 대필 설정 UI가 없고, 대필(scribe)은 `RespondScreen` 로컬 상태로만 존재하는 것이 맞아 **스토어에서 제거**했다. 화면 코드 어디에서도 참조하지 않던 죽은 API였음(parent/family 에이전트가 공통으로 병목 보고).
- **역할 진입**: 로그인 화면에서 `login('parent'|'child')` 호출 → RootNavigator가 자동으로 부모/자녀 탭으로 전환(별도 navigate 불필요). `logout()`으로 로그인 복귀.

## 5. 공통 컴포넌트 — `import { ... } from '../components'`
- **`<ScreenContainer edges? scroll? backgroundColor? style? contentContainerStyle?>`** — SafeAreaView 래퍼. 가짜 상태바/프레임 렌더 안 함. 탭 화면은 `edges={['top']}` 권장(하단은 탭바). `scroll`이면 내부 ScrollView.
- **`<Header title? onBack? right? />`** — onBack 있으면 arrow_back 버튼(52/ radius16/ surfaceSoft), title 18/700, right 노드.
- **`<Button label onPress variant? icon? iconSize? disabled? height? radius? fontSize? bg? fg? fullWidth? style? textStyle? />`** — variant: `primary`(56/16/17·800, accent), `parentPrimary`(64/18/19·800 + 그림자), `secondary`(흰+보더), `ghost`. disabled 시 bg #E0D2BF/글자 textFaint. 원본 동적색은 `bg`/`fg`로 강제.
- **`<Card onPress? radius=22 padding=22 borderColor=#EBDECB borderWidth=1.5 dashed? backgroundColor=#fff elevated? style>`** — onPress 시 눌리는 카드.
- **`<Pill label onPress? active? bg? fg? borderColor? icon? iconColor? iconSize=16 fontSize=13 paddingV=7 paddingH=14 />`** — 칩/배지. 원본 동적색은 bg/fg/borderColor 직접 전달, 단순 토글은 `active`만.
- **`<SectionLabel color=textFaint2 fontSize=15>텍스트</SectionLabel>`** — 800·자간0.3 소제목.
- **`<VoiceBars />`** — 로그인 로고 파형(정적 5막대, 라인50~56).
- **`<EqBars color=accent active=true count=5 />`** — 재생 이퀄라이저(높이 7↔22 애니). TTS/답변재생용.
- **`<RecordingWave color=accent active=true count=30 />`** — 녹음중 파형(scaleY .28↔1).
- **`<PulseRing size color=danger />`** — 녹음중 정지버튼 뒤 펄스 링(원본 `@keyframes pulseRing`: scale .9→1.75, opacity .55→0, 1.5s ease-out). `size`는 겹쳐 그릴 버튼 지름(px)과 동일하게. (Manager 추가 — RespondScreen/CapsuleNewScreen에 중복·상이한 값으로 각각 구현돼 있던 것을 통합하며 원본 keyframe 값으로 통일.)
- **`<Toast message icon=check_circle />`** + **`<ToastHost/>`** — Host는 App에 이미 마운트됨. 화면에선 `showToast(msg)`만 호출하면 됨.
- **`<PushBanner title onPress? top? />`** + **`<PushHost/>`** — Host가 store.push 구독→탭 시 QuestionDetail로 이동. App에 이미 마운트됨.
- **`<Overlay visible onClose? scrim? dismissOnBackdrop? cardStyle? padding=32 >{내용}</Overlay>`** — 중앙 모달(흰 카드 radius26). revealCap/sentQuestion 등에 사용, 내용만 주입.
- **`<ImageSlot placeholder radius=12 shape='rounded'|'circle'|'pill'|'rect' width height aspectRatio=1.5 />`** — 회색 점선 박스 + 안내문구(원본 문구 유지).
- **`<Icon name size=24 color />`** — name은 **원본 Material Symbols 글리프명** 그대로(예: 'mic','play_circle','graphic_eq'). 매핑은 `src/icons.ts`.

## 6. 네비게이션 — `import type { RootStackParamList } from '../navigation/types'`
루트 스택(native-stack, 헤더 없음 — 화면이 자체 `Header` 렌더):
| route | 화면 파일 | params |
|-------|-----------|--------|
| `Login` | common/LoginScreen | — |
| `ParentTabs` / `ChildTabs` | 탭 컨테이너(자동 분기) | — |
| `Notification` | common/NotificationScreen | — |
| `QuestionDetail` | parent/QuestionDetailScreen | `{ questionId: number }` |
| `Respond` | parent/RespondScreen | `{ questionId: number }` |
| `Settings` | family/SettingsScreen | — |
| `ComingSoon` | family/ComingSoonScreen | `{ label: string }` |
| `Compose` | child/ComposeScreen | — |
| `Storybook` | child/StorybookScreen | — |
| `Booklet` | family/BookletScreen | — |
| `Poll` | family/PollScreen | — |
| `Capsule` | family/CapsuleScreen | — |
| `CapsuleNew` | family/CapsuleNewScreen | — |

하단 탭(부모/자녀 동일 구성, 라벨/아이콘 원본 tabs 배열):
`Home`(홈/home) · `Voice`(이야기/graphic_eq) · `Calendar`(달력/calendar_month) · `Album`(사진/photo_library).
- 부모 탭: Home→HomeScreen, Voice→QuestionListScreen, Calendar→CalendarScreen, Album→AlbumScreen.
- 자녀 탭: Home→DashboardScreen, Voice→ResponseListScreen, Calendar/Album 동일.
- **참고**: 원본 HTML의 실제 탭은 홈/이야기/달력/사진(설정은 탭이 아니라 홈 헤더 기어에서 `navigate('Settings')`). Task의 "보이스/캘린더/앨범/환경설정"과 다르며 **원본(HTML)을 따랐다**.
- 화면 내 이동: `navigation.navigate('QuestionDetail', { questionId })` 등. 탭 전환은 스토어 `setTab` 대신 tab navigator의 `navigation.navigate('Voice')` 사용. 화면 밖에서는 `import { navigate } from '../navigation/navRef'`.
- 화면 컴포넌트 타입: `NativeStackScreenProps<RootStackParamList, 'Respond'>` (params 있는 화면), 탭 화면은 `BottomTabScreenProps<ParentTabParamList,'Home'>`.

## 7. 화면 파일 규칙 (stub 교체)
`src/screens/{common|parent|child|family}/*.tsx` 에 **named export**로 stub이 존재. 화면 에이전트는 파일 전체를 교체하되 **export 이름 유지**(RootNavigator/탭이 그 이름으로 import). 이름 목록은 §6 표 참조(예: `export function HomeScreen(){...}`).

