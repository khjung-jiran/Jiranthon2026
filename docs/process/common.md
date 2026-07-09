# common 화면 폴더 — 진행 기록

담당: `eum-app/src/screens/common/` (LoginScreen, NotificationScreen)

## ① 한 일
- **LoginScreen.tsx** (sLogin, 원본 라인 47~76) 전면 구현. stub 교체, export 이름 유지(`LoginScreen` + `default`).
  - 로고 파형: 공통 `VoiceBars` 사용(원본 5막대 값 그대로 컴포넌트에 내장됨), marginBottom 30.
  - 타이틀 "이음" 38/800/-1.5, 서브카피 2줄 16/#7C6A54(textMuted2)/lineHeight 26/center.
  - 부모/자녀 선택 버튼: row/gap15/padding19/radius20/border1.5 #E9DBC9(border2)/bg #fff. 아이콘박스 56x56 radius16 (부모=accentSoft+elderly accent, 자녀=neutral #ECEAE4+family_restroom blue). 제목 19/700, 서브 14/#8C7961(textMuted), chevron_right 24 #C4B398(textFaint3).
  - 하단 안내 "가족 초대 코드로 함께 시작할 수 있어요" 13/#B5A48A(textFaint)/center.
  - 역할 진입은 `store.login(role)` 호출 → RootNavigator 자동 분기(별도 navigate 없음).
- **NotificationScreen.tsx** (sNotif, 원본 라인 646~664) 전면 구현. export 이름 유지.
  - 헤더는 원본 수치 그대로 인라인 구현(공통 Header 대신): back 48x48/radius15/bg surfaceSoft, 타이틀 19/800, "모두 읽음" 14/700 accent.
  - 리스트는 `FlatList` + `ItemSeparatorComponent(10px)`. 스토어 `notifs` 구독.
  - 항목: row/gap13/border1.5 #EBDECB(border3)/radius18/padding16. 아이콘박스 42x42 radius14 bg `tint(n.color,12)`(=color-mix 12% #fff), 아이콘 22/n.color. 제목 15/lineHeight22, 시간 12 #B5A48A, 안읽음 dot 9x9 danger.
  - 탭 시 `markNotifRead(id)` 후 `n.nav`로 이동: caps→Capsule, poll→Poll, album→(role별)Tabs{screen:'Album'}, c_resp→(role별)Tabs{screen:'Voice'}, null→이동 없음.
  - "모두 읽음"→`readAllNotifs()`.
- 색/폰트/여백/라운드 전부 theme 토큰 사용(하드코딩 색 없음). RN 폰트 규칙 준수(굵기는 fontFamily로).

## ② 잘못한 일 / 리스크 / 미완성
- **notif의 파생 뷰값(bg/weight/dotOp) 근거 부재**: 원본 support.js가 컴파일/미니파이되어 있어 `renderVals`의 실제 `n.bg`/`n.weight`/`n.dotOp` 산출식을 확인 불가. 합리적 해석으로 구현:
  - bg: 안읽음=surface(#fff), 읽음=bgScreen(#FAF3EA) → 안읽음 카드가 크림 배경 위로 떠 보이고 읽음은 배경에 묻힘.
  - weight: 안읽음=bold(700), 읽음=medium(500).
  - dotOp: 안읽음=1, 읽음=0.
  → 시각적으로 자연스럽고 원본 마크업(dot opacity 바인딩, weight 바인딩)과 일관되나, 원본 정확값과 다를 수 있음. Manager가 원본 렌더 확인 후 미세조정 필요할 수 있음.
- **타입체크/부팅 미검증**: 이 개발 머신에 Node/npm이 설치되어 있지 않고(`node`/`npm`/`npx` PATH 없음) `eum-app/node_modules`도 없어 `npx tsc --noEmit` 및 앱 부팅을 실행하지 못함. 코드는 Foundation 계약(컴포넌트/스토어/타입/네비 param) 대비 수동 정합 확인만 완료.

## ③ 병목 (Manager 처리 필요)
- **환경: Node/의존성 미설치**. `cd eum-app && npm i`(또는 `npx expo install`) 선행 후 `npx tsc --noEmit`로 전체 타입검증 필요. 현재 어떤 화면도 실기기/시뮬레이터 부팅·타입검증이 안 된 상태로 보임.
- **알림 nav → 탭 이동 계약 모호**: album/c_resp는 탭(ParentTabs/ChildTabs 하위) 화면이라 스택 화면(Notification)에서 `navigate('ParentTabs',{screen:'Album'})`로 진입하도록 role 분기 처리함. Foundation 계약에 "알림에서 탭으로 복귀" 표준 경로가 명시되면 그걸로 교체 권장. 또한 c_resp(자녀 응답확인)를 자녀 Voice 탭으로 매핑했는데, 부모 세션에서 이 알림을 탭할 때의 의도가 계약상 불명확(현재는 현재 role의 Voice 탭으로 이동).
- **notif 뷰 파생값 규칙 부재**(위 ② 참고): 원본 renderVals가 소스에 노출되지 않아 계약화 필요.

## ④ 다음 단계 할 일
- Manager: Node/deps 설치 후 `npx tsc --noEmit` 실행하여 common 화면 타입 확정.
- 앱 1회 부팅: 로그인 화면 폰트/아이콘(elderly, family_restroom, chevron_right) 렌더 및 부모/자녀 진입 분기 확인. 알림 화면 아이콘(mark_email_unread, graphic_eq, face, how_to_vote, help) 깨짐 여부 확인 → 필요 시 `src/icons.ts` iconMap 교정.
- 알림 탭 이동 4종(caps/poll/album/c_resp) 실제 네비 동작 확인 및 계약 확정.
- notif bg/weight/dot 원본 정확값 확정 시 반영.
