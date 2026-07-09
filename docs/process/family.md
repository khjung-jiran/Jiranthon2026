# family 화면 폴더 — 작업 기록

담당: eum-app/src/screens/family/*.tsx (CalendarScreen 제외 — Foundation이 레퍼런스로 이미 구현해둠)

## ① 한 일

- `view/design/이음.dc.html`의 sCal(445~515)/sAlbum(516~565)/sCaps(566~590)/sCapsNew(591~645)/
  sPoll(665~695)/sBooklet(696~724)/sSetting(725~801)/sSoon(802~808) 마크업과, 대응하는
  `<script type="text/x-dc" data-dc-script>` 내 `DCLogic` 클래스(라인 883~ 이하, support.js가 아니라
  이음.dc.html 파일 하단에 실제 상태/로직이 있었음)를 정독하고 인라인 스타일 수치·상태 전환 로직을 그대로 이식.
- Foundation 계약(theme/components/store/types/data/icons/navigation)만 사용해 아래 7개 화면 파일을
  전체 교체 구현(export 이름 유지):
  - `src/screens/family/AlbumScreen.tsx` — 부모/자녀 분기, albumFilter 칩, 3열/2열 그리드,
    얼굴인식 배너, 업로드 FAB(addPhoto+showToast).
  - `src/screens/family/PollScreen.tsx` — pollVotes/pollVoted/vote, 진행바·퍼센트, 힌트 문구.
  - `src/screens/family/CapsuleScreen.tsx` — capsules 목록(ready/locked/open), reveal 모달(Overlay+EqBars),
    locked 넛지 토스트, open 상태 인라인 재생(로컬 타이머), CapsuleNew로 이동.
  - `src/screens/family/CapsuleNewScreen.tsx` — capTo/capWhen 칩, 캡슐 이름 입력, 녹음 3단계
    (idle/recording/recordDone, RecordingWave+PulseRing 로컬 구현), sealCapsule 스토어 액션 연동.
  - `src/screens/family/BookletScreen.tsx` — 소책자 커버 + QR + 정보 카드, 인쇄 주문 토스트.
  - `src/screens/family/SettingsScreen.tsx` — 프로필/역할전환, 글씨크기·음성안내·자동번역 토글,
    AI 질문 간격, 가족 관리, 구독 카드, 로그아웃.
  - `src/screens/family/ComingSoonScreen.tsx` — route.params.label 기반 placeholder, 아이콘 매핑.
- 원본 인라인 색상/폰트/라운드/여백 수치는 `src/theme` 토큰으로 그대로 매핑(신규 하드코딩 색 최소화).
- reveal 모달은 원본 마크업에 backdrop onClick이 없어 `dismissOnBackdrop={false}`로 설정(임의 닫힘 방지).
- Settings 화면은 원본에 back 버튼이 없음(홈 기어로 진입) — 그대로 재현(시스템 뒤로가기/스와이프 제스처에 의존).

## ② 잘못한 일 / 리스크 / 미완성

- **tsc/런타임 미검증**: 이 작업 환경(Bash/PowerShell 모두)에 `node`/`npm`이 설치되어 있지 않아
  `npx expo install`, `npx tsc --noEmit`, 앱 부팅 확인을 전혀 수행하지 못했다. 코드는 기존 구현
  (HomeScreen/QuestionListScreen/CalendarScreen/NotificationScreen)의 타입 패턴을 그대로 따라
  손으로 대조 검증했지만, 실제 컴파일/런타임 검증은 못했다. **다음 단계에서 반드시 tsc 재검증 필요**.
- 원본 픽셀값과 정확히 일치하지 않는 근사치가 몇 군데 있음:
  - `#F4EADA`(설정 가족관리 role칩 배경, 소책자 정보행 구분선) → 토큰에 정확한 값이 없어
    가장 가까운 `colors.surfaceSoft2`(#F5EADA)로 대체. 1스텝 오차.
  - 소책자 커버 텍스트 색 `#F7EFE1`은 theme에 대응 토큰이 없어 원본 hex를 그대로 하드코딩(토큰 미정의).
  - 앨범 그리드 타일의 `repeating-linear-gradient` 대각 스트라이프는 RN에서 구현 난도가 높아
    톤 단색 배경(`tint(tone,14)`)으로 단순화. 시각적으로 유사하나 스트라이프 패턴은 생략.
  - 앨범 사진 캡션 오버레이 `rgba(46,35,24,.55)`는 theme에 alpha 헬퍼가 없어 리터럴로 하드코딩
    (46,35,24 = colors.text #2E2318과 동일한 값이라 사실상 text 색의 55% 불투명도).
  - 소책자 커버 그림자는 원본 `0 24px 50px -22px rgba(46,35,24,.5)`을 정확히 재현할 토큰이 없어
    `shadow.push`로 근사.
- `revealId`/`revealPlaying`/`playingCap` 등은 화면 로컬 state로 구현(스토어 계약에 없는 필드라
  전역화하지 않음) — Foundation 계약과 일치하지만, 추후 다른 화면에서 캡슐 재생 상태를 공유해야
  한다면 스토어로 승격이 필요할 수 있음.
- 앨범 화면의 "4장" 얼굴인식 텍스트는 원본이 정적 문자열이라 그대로 하드코딩(동적 계산 아님) —
  실제 얼굴인식 로직과는 무관한 mock 문구임을 유의.
- PollScreen의 타이틀 문구는 `data/mock.ts`의 `pollTitle`("...언제가 좋을까요?")과 실제 html
  리터럴 마크업("...언제가 좋아요?")이 다름 — html 원본을 우선해 화면에 직접 하드코딩했고
  `mock.pollTitle`은 사용하지 않음. Foundation mock과 html 원문이 살짝 다른 사례.

## ③ 병목 (Manager가 처리할 것)

- **개발 환경에 Node.js/npm이 전혀 설치되어 있지 않음** — `npm`, `npx`, `node` 커맨드 자체가
  Bash/PowerShell 양쪽에서 모두 not found. Foundation todo(`npx expo install`, `npx tsc --noEmit`,
  앱 1회 부팅)를 어느 화면 에이전트도 수행할 수 없는 상태로 보인다. Manager 또는 별도 환경에서
  Node 설치 후 전체 타입체크·부팅 검증이 필요.
- theme 토큰에 `#F4EADA`, `#F7EFE1`, `rgba(text,55%)` 같은 원본에 등장하는 세부 색이 누락되어 있어
  근사치로 대체함. Foundation이 토큰을 보강하면 해당 화면들의 하드코딩 3~4곳을 토큰 참조로 교체 가능.
- `src/icons.ts`의 iconMap에 `person_add`가 없음(kebab 폴백으로 `person-add`가 되어 정상 동작하지만,
  Foundation의 "iconMap 교정 todo" 목록에 추가해두는 것을 권장).

## ④ 다음 단계 할 일

- Node.js 설치 후 `cd eum-app && npx expo install && npx tsc --noEmit` 실행, 본 7개 파일 포함 전체
  타입 에러 확인.
- 앱 1회 부팅해 Album 그리드 3/2열 레이아웃, Poll 진행바, Capsule reveal 모달, CapsuleNew 녹음
  3단계 애니메이션(RecordingWave/PulseRing), Settings 토글 스위치, ComingSoon 아이콘이 실제 폰트/
  아이콘으로 정상 렌더되는지 스크린샷 확인.
- theme 토큰에 `#F4EADA`(surfaceSoft4?), `#F7EFE1`(부스트/커버 텍스트) 추가 검토 후 근사치 대체
  구간(BookletScreen, SettingsScreen) 교체.
- 자녀 모드 ResponseListScreen/DashboardScreen 등에서 Capsule/Poll 진입 지점이 실제로
  `navigation.navigate('Capsule' | 'Poll' | 'Booklet')`을 호출하는지(자식 화면 담당 에이전트 쪽)
  확인 — family 화면 자체는 route 계약대로 구현 완료.
