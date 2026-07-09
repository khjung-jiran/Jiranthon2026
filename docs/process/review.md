# 시니어 코드리뷰 (eum-app 전체)

리뷰어: 10년차+ React Native/Expo 시니어 관점. 대상: `eum-app/` 전체(App.tsx, src/theme, types, store, data,
components, navigation, screens/** 18개 화면) + `docs/design-map.md` 계약, 원본 `view/design/이음.dc.html` 대조.
검증 방법: Node/npm/npx가 이 실행 환경에 여전히 설치되어 있지 않아(5개 선행 세션과 동일하게 재확인됨)
`tsc`/`expo start` 실행은 불가했고, **원본 HTML 라인(로그인 47~76, 알림 646~664, 부모홈 77~130, 질문상세
174~200, 응답 201~255, 자녀대시보드 256~320, 질문작성 321~353, 응답목록 355~381, 캘린더 445~515,
앨범 516~565, 투표 665~695, 소책자 696~723, 설정 725~800)과 인라인 렌더 스크립트(877~1365, 특히
renderVals/vote/toggleEn/schedulePush/pZoom 등 실제 로직)를 RN 코드와 1:1 대조**하는 정적 리딩으로 검증했다.

## 종합 평가

전반적으로 **완성도가 매우 높다.** 18개 화면 전체가 스텁 없이 실구현으로 교체되어 있고, 네비게이션
(RootNavigator/ParentTabs/ChildTabs)·zustand 스토어·테마 토큰·공통 컴포넌트 계약이 `docs/design-map.md`와
정확히 일치한다. 특히 스토어의 파생 로직(`vote()`, `toggleTranslate`/`showEn`/`showEnBtn`/`enLabel` 계산,
알림 `nav==='c_resp'` role 분기, `answered[0]`을 최근 답변으로 쓰는 로직, `preview.slice(0,42)+'…'`,
poll 라벨/문구)을 원본 인라인 스크립트(1101~1330줄)와 문자 단위로 대조한 결과 **전부 정확히 일치**했다.
Manager 패스가 보고한 중복 제거(avatarColorFor/formatDuration/PulseRing 통합)와 토큰 보강도 실제로
반영되어 있음을 확인했다.

다만 접근성 관점에서 **핵심 기능 하나가 완전히 미구현 상태로 방치**되어 있다(아래 findings #1). 이 외에는
색 토큰 재사용 오차, 하드코딩 리터럴 잔존 등 경미한 이슈들이다. 빌드/런타임 검증(패키지 설치·tsc·앱 부팅)은
이번에도 Node 부재로 수행하지 못했으므로, 코드 리딩으로 잡을 수 없는 컴파일러/런타임 레벨 결함은
여전히 미검증 상태로 남아있다(선행 Manager 세션과 동일한 한계).

## 디자인 충실도

색상 hex, radius, padding, 폰트 크기/굵기, 문구가 원본 인라인 스타일과 거의 완벽히 일치한다. 표본 대조
(로그인/알림/부모홈/질문상세/응답/자녀대시보드/캘린더/앨범/캡슐/투표/소책자/설정 12개 화면 전체)에서
발견된 유일한 실제 색상 불일치는 `#F4EADA`(원본, 2곳에서 재사용) 대신 `surfaceSoft2`(#F5EADA, 1글자 차이)
토큰을 재사용한 것뿐이었다(findings #3). `PulseRing`은 원본 `@keyframes pulseRing`(scale .9→1.75,
opacity .55→0, 1.5s ease-out) 값을 정확히 재현했고, `EqBars`/`RecordingWave`도 원본 `eqbar`/`vbar`
keyframe 수치와 일치한다. 이미지 슬롯(`ImageSlot`)과 앨범 사진 타일의 반복 대각 스트라이프 배경은
문서화된 대로 RN 근사치(단색 tint)로 단순화되어 있다 — 시각적으로 원본과 매우 유사하며 이미 알려진
허용 범위의 근사치다.

## 크로스플랫폼(iOS/Android) 평가

- `shadow.*` 토큰이 iOS(`shadowColor/Offset/Opacity/Radius`)와 Android(`elevation`)를 모두 포함하도록
  일관되게 정의되어 있고 Button/Card/PulseRing 등 전체에서 스프레드해 사용 — 크로스플랫폼 그림자 처리가
  체계적이다.
- `ScreenContainer`가 `react-native-safe-area-context`의 `SafeAreaView edges`를 화면별로 올바르게
  선택(탭 화면은 `['top']`, 스택 화면은 기본 `['top','bottom']`)해 노치/홈 인디케이터를 원본의 가짜
  상태바 없이 정확히 대체했다. `PushBanner`도 `useSafeAreaInsets().top`을 top 오프셋에 더해 노치 기기에서
  잘리지 않도록 처리했다(`Toast`는 고정 `bottom:100`이라 상대적으로 안전하지만 기기별 안전영역을
  직접 반영하진 않는다 — 다만 100px 여유로 실제 문제가 될 가능성은 낮다).
- 커스텀 폰트(`fontFamily`)로 굵기를 지정하는 RN 규칙(`fontWeight` 무시됨)을 전 화면이 일관되게
  준수한다. `BookletScreen`의 QR 텍스트만 예외적으로 `fontWeight:'700'` + `fontFamily:'monospace'`를
  쓰는데, 이는 커스텀 폰트가 아닌 시스템 monospace 사용 의도이므로 그 자체는 문제 아니나 iOS에서
  'monospace' 제네릭 패밀리가 보장되지 않는 점은 findings #6에 기록.
- 터치 영역: 부모 모드 버튼(54~64px, 녹음 버튼 104px)과 자녀/공통 아이콘 버튼(44~52px)이 모두 원본
  수치를 그대로 따르며 iOS(44pt)/Android(48dp) 최소 터치 가이드라인을 충족한다.
- `expo-av`가 package.json에 있으나 실제로는 어디서도 import되지 않아(오디오는 전부 `Animated` 타이머
  목업) 권한 프롬프트나 플랫폼별 오디오 세션 이슈가 발생할 여지가 현재는 없다 — 다음 단계에서 실제
  오디오를 붙일 때 iOS 마이크 권한(Info.plist `NSMicrophoneUsageDescription`, app.json에 미설정)과
  Android `RECORD_AUDIO` 권한 설정을 함께 추가해야 한다(현재 app.json에는 두 항목 모두 없음 — MVP
  목업 단계라 당장 필요하진 않지만 리스크로 남겨둔다).

## Findings (심각도순)

1. **[High] 접근성 핵심 기능 미구현 — "글씨 크기"(부모 모드 확대) 설정이 아무 화면에도 적용되지 않음.**
   `src/data/mock.ts`의 `fontZoomMap`(보통:1, 크게:1.12, 아주 크게:1.25)은 원본 `이음.dc.html` 45번째 줄
   `zoom: {{ pZoom }}`(부모 모드 전체 화면 확대, 1312번째 줄에서 `state.fontSize`로부터 계산)에 대응하는
   값인데, RN 어느 화면에서도 import/적용되지 않는다. `src/screens/family/SettingsScreen.tsx`는
   `settings.fontSize`를 오직 71번째 줄(선택된 칩 강조 표시)에만 사용하고, 그 값을 실제 폰트
   크기/레이아웃에 반영하는 코드는 프로젝트 전체에 없다(grep 결과 `fontZoomMap` 사용처 0건). 결과적으로
   사용자가 "크게"/"아주 크게"를 선택해도 시각적으로 아무 변화가 없다 — 원본이 제공하던, 노인 사용자를
   위한 가장 직접적인 접근성 기능이 통째로 죽어있다.
   - 재현: 설정 화면에서 "아주 크게" 선택 → 부모 홈/질문상세/응답 등 어떤 화면으로 이동해도 텍스트 크기 불변.
   - 제안: RN에는 CSS `zoom` 대응이 없으므로, 부모 모드 화면 트리 최상단(예: `ParentTabs` 또는
     `ScreenContainer`)에서 `settings.fontSize`를 구독해 `fontZoomMap` 배율을 얻고, ① 간단하게는
     콘텐츠 영역을 `transform:[{scale}]`로 감싸거나, ② 정확하게는 `theme/typography` 프리셋의
     `fontSize`/`lineHeight`를 배율만큼 곱해 반환하는 훅(`useScaledTypography()`)을 만들어 부모 화면들이
     이를 통해 스타일을 계산하도록 리팩터링한다.

2. **[Medium] 색상 토큰 오차 — 원본 `#F4EADA`를 다른 값(`surfaceSoft2` #F5EADA)으로 대체한 2곳.**
   원본은 `#F4EADA`를 두 군데에서 재사용한다: `이음.dc.html` 714~715번째 줄(소책자 정보카드 구분선
   `border-bottom:1px solid #F4EADA`)과 780번째 줄(설정화면 가족 역할칩 배경 `background:#F4EADA`).
   RN 포팅본은 두 곳 모두 `colors.surfaceSoft2`(#F5EADA, R채널 1비트 차이)를 재사용했다 —
   `src/screens/family/BookletScreen.tsx`의 `infoRowBorder.borderBottomColor`, `src/screens/family/
   SettingsScreen.tsx`의 `familyChip.backgroundColor`. 시각적으로 거의 구분되지 않는 차이지만
   design-map의 "원본 인라인스타일 값을 그대로 옮겨라(임의 변경 금지)" 규칙을 벗어난 실제 값 오차다.
   - 제안: `theme/tokens.ts`에 `chipMuted`(또는 `divider2`) = `#F4EADA` 토큰을 새로 추가하고 두 파일에서
     `surfaceSoft2` 대신 이를 참조하도록 교체.

3. **[Low] 하드코딩 색 리터럴 — 토큰 미사용 지점 2건.**
   - `src/screens/parent/QuestionDetailScreen.tsx` 156번째 줄: `respondBtn` 스타일의
     `shadowColor: '#AC5D3B'`가 `colors.accent`를 쓰지 않고 리터럴로 하드코딩되어 있다(같은 파일의
     다른 그림자들과 `RespondScreen.tsx`의 동일 버튼은 모두 `colors.accent`/`shadow.accentButton`을
     사용). 현재는 값이 같아 시각적 문제는 없으나, design-map이 명시한 "하드코딩 색 대신 토큰 사용"
     규칙 위반이며 accent 색이 브랜드 팔레트(`brandPalette`)의 다른 값으로 바뀌는 순간 이 그림자만
     갱신되지 않는다.
   - `src/components/ImageSlot.tsx` 54~66번째 줄: placeholder 박스 배경/보더/아이콘/캡션 색이 모두
     `rgba(0,0,0,0.04~0.55)` 리터럴이다. 원본에 대응하는 정확한 토큰이 없다는 점은 이해되나(이미지
     슬롯은 RN 전용 대체물), 프로젝트 전역이 토큰만 쓰는 규칙을 지키는 와중에 유일하게 리터럴을 쓰는
     컴포넌트다.
   - 제안: `colors.accent`로 교체(전자), `theme/tokens.ts`에 `placeholderBg/placeholderBorder/
     placeholderIcon/placeholderText` 토큰을 추가해 후자를 참조하도록 정리.

4. **[Low] 크로스플랫폼 — `BookletScreen`의 QR 텍스트가 iOS에서 monospace로 보장되지 않음.**
   `src/screens/family/BookletScreen.tsx` 97번째 줄: `qrText`에 `fontFamily: 'monospace'`를 지정했다.
   Android는 시스템에 `monospace` 제네릭 폰트 패밀리가 있어 의도대로 렌더링되지만, iOS의 RN 폰트
   매칭은 웹과 달리 제네릭 패밀리명을 해석하지 않으므로 iOS에서는 존재하지 않는 폰트 이름으로 처리되어
   기본 시스템 폰트로 조용히 폴백될 수 있다(육안 영향은 "QR" 두 글자뿐이라 낮지만, 플랫폼 간 렌더링이
   달라지는 실제 지점이다).
   - 제안: `Platform.select({ ios: 'Courier', android: 'monospace', default: undefined })`로 명시하거나,
     그 정도 시각차가 무의미하다면 monospace 지정을 제거하고 기본 `fonts.bold`를 사용.

5. **[Low] 정리 필요 — 죽은 파일 `src/screens/_Stub.tsx`.**
   모든 18개 화면이 실구현으로 교체되어 이제 이 파일을 참조하는 곳이 전혀 없다(Manager도 동일하게
   확인). 컴파일에는 영향 없으나 저장소 정리 관점에서 삭제 대상.

## 확인했으나 문제가 아니었던 항목 (오탐 방지용 기록)

- `HomeScreen.tsx`의 세션당 1회 푸시 배너 스케줄링(`pushScheduled` 모듈 플래그)은 React Navigation의
  bottom-tabs가 기본적으로 비활성 탭 화면을 언마운트하지 않으므로(=`unmountOnBlur` 미설정),
  로그인 직후 1.4초 내 다른 탭으로 전환해도 `useEffect` cleanup이 실행되지 않아 원본과 동일하게
  8초 후 사라지는 푸시가 정상적으로 뜬다 — 버그 아님.
- `package.json`/`package-lock.json`의 `typescript: ~6.0.3`, `react-native: 0.86.0` 등은 처음엔 비현실적인
  버전으로 의심했으나, `package-lock.json`에 실제 `resolved`/`integrity` 해시가 포함된 정상 npm
  레지스트리 형식으로 존재해 실제 스캐폴딩 시점에 설치 가능했던 버전임을 확인했다 — 별도 findings로
  올리지 않음(다만 Manager가 이미 기록한 "npx expo install로 재확정 필요"라는 후속 조치는 여전히 유효).
- 알림 `nav==='c_resp'` role 분기, 투표 득표율 계산, 번역 토글 표시 조건(`showEn`/`showEnBtn`/`enLabel`),
  `recentAnswer=answered[0]`, `preview.slice(0,42)+'…'` 등 도메인 로직은 원본 인라인 스크립트와 전수
  대조 결과 전부 정확히 일치했다.
