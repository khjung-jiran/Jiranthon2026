/**
 * 이음(Ieum) 디자인 토큰 — view/design/이음.dc.html 원본 인라인 스타일 값에서 그대로 이식.
 * 하드코딩 색 대신 이 토큰을 사용한다. color-mix()는 계산된 hex로 변환해 둠.
 *
 * 색 이름은 "역할 + 근접값"으로 정리했다. 원본에 등장한 모든 hex를 커버한다.
 */

// ── 색상 ─────────────────────────────────────────────────────────────
export const colors = {
  // 브랜드 강조 (테라코타)
  primary: '#AC5D3B',
  accent: '#AC5D3B',
  accentStrong: '#86452A', // color-mix(in srgb, #AC5D3B, black 24%) — a:hover 값
  // color-mix(in srgb, #AC5D3B 13%, #fff) = 실제 렌더 값. (design-map 근사표기 #F6E4D7)
  accentSoft: '#F4EAE6',

  // 배경 / 표면
  bgScreen: '#FAF3EA', // 화면 배경
  bgOuter: '#EAE0D2', // 폰 프레임 바깥
  surface: '#FFFFFF', // 카드 / 탭바
  surfaceSoft: '#F2E8DA', // 아이콘 버튼 배경(알림/기어)
  surfaceSoft2: '#F5EADA', // reveal 플레이어 배경
  surfaceSoft3: '#F3EADC', // 답변 질문 박스 / locked chip
  neutral: '#ECEAE4', // 자녀(블루) 계열 회색 카드/선택칩

  // 텍스트
  text: '#2E2318', // 본문(진한 갈색-검정)
  text2: '#3C2F22', // 약간 옅은 본문(큰 질문 텍스트)
  textMuted: '#8C7961',
  textMuted2: '#7C6A54',
  textMuted3: '#9A8873',
  textMuted4: '#5C4A36', // 아이콘/기어 전경
  textFaint: '#B5A48A',
  textFaint2: '#A8967E',
  textFaint3: '#C4B398',
  textFaint4: '#D1C0A6', // radio 미선택
  textFaint5: '#D3C3AA', // 캘린더 이전달 날짜 / dashed 보더

  // 올리브(보조/파형)
  olive: '#7C8A55',
  oliveDeep: '#5C6B3D',
  oliveSoft: '#ECEFDD',

  // 카테고리 / 브랜드 팔레트 (캡슐·알림·아바타)
  gold: '#9A7B3C',
  blue: '#5B7086',
  mauve: '#8C5F6E',

  // 경계선
  border: '#EEE2D1', // 탭바 상단보더 / 구분선
  border2: '#E9DBC9', // 카드/입력 보더(기본)
  border3: '#EBDECB', // 홈 카드 보더
  border4: '#E0D2BF', // 토글 off / dot
  borderCool: '#E4E2DB', // 푸시 배너 보더
  borderWarm: '#E7DAC6', // reveal 트랙
  borderDashed: '#D3C3AA', // 점선 보더
  divider: '#E3D4C0', // 점선 구분선(respond)

  // 상태색
  danger: '#C2453B', // 녹음중 / 안읽음 dot
  gold2: '#9A6B1E', // pending 배지 fg

  // 배지
  pendingBg: '#F6ECDA',
  pendingFg: '#9A6B1E',
  answeredBg: '#ECEFDD',
  answeredFg: '#5C6B3D',

  // 트랙 / 프로그레스
  track: '#ECDFCC',

  // 토스트
  toastBg: '#2E2318',
  toastText: '#FFFFFF',
  toastIcon: '#B4C77F',

  // 오버레이 스크림
  scrim: 'rgba(38,29,20,0.55)',
  scrimLight: 'rgba(38,29,20,0.5)',

  // 홈 인디케이터 바
  homeIndicator: '#2E2318',

  // 소책자 커버(진한 배경 위 밝은 글자) — 원본 인라인 리터럴, 다른 토큰과 값이 달라 별도 이름 부여
  coverText: '#F7EFE1', // BookletScreen 커버/QR, StorybookScreen TOC 헤더카드 글자색
  // 스토리북 본문 글자색(연대기 페이지) — 원본 인라인 리터럴
  storyBody: '#4C3C2B',
  // 자녀 대시보드 "답변 대기" 통계 숫자색 — 원본 인라인 리터럴(gold 계열이나 별도 값)
  statPendingFg: '#B87A2E',
  // 앨범 그리드 캡션 오버레이 — text(#2E2318) 55% 불투명도와 동일한 rgb
  textScrim: 'rgba(46,35,24,0.55)',

  // 소책자 정보카드 구분선 + 설정 가족 역할칩 배경 — 원본 #F4EADA (surfaceSoft2 #F5EADA와 1비트 다른 별도 값)
  chipMuted: '#F4EADA',

  // ImageSlot placeholder (RN 전용 대체물 — 원본에 대응 토큰 없음)
  placeholderBg: 'rgba(0,0,0,0.04)',
  placeholderBorder: 'rgba(0,0,0,0.25)',
  placeholderIcon: 'rgba(0,0,0,0.45)',
  placeholderText: 'rgba(0,0,0,0.55)',

  white: '#FFFFFF',
  black: '#000000',
} as const;

/** 브랜드 색상 선택지 (accent 후보) */
export const brandPalette = ['#AC5D3B', '#9A7B3C', '#7C8A55', '#8C5F6E'] as const;

/** 카테고리 색(캡슐/알림/아바타 등) */
export const categoryColors = {
  olive: '#7C8A55',
  gold: '#9A7B3C',
  blue: '#5B7086',
  mauve: '#8C5F6E',
} as const;

// ── 폰트 ─────────────────────────────────────────────────────────────
/**
 * Noto Sans KR. RN에서는 fontWeight 대신 반드시 fontFamily로 굵기를 지정한다.
 * (커스텀 폰트는 numeric weight가 무시되므로 family를 직접 써야 함)
 */
export const fonts = {
  regular: 'NotoSansKR_400Regular', // 400
  medium: 'NotoSansKR_500Medium', // 500
  bold: 'NotoSansKR_700Bold', // 700
  extraBold: 'NotoSansKR_800ExtraBold', // 800
} as const;

// ── 타이포 프리셋 ─────────────────────────────────────────────────────
// 원본 대표 스타일 모음. 화면에서 직접 fontSize/fontFamily를 써도 되지만,
// 반복되는 조합은 이 프리셋을 재사용한다. color는 화면에서 지정.
export const typography = {
  logo: { fontFamily: fonts.extraBold, fontSize: 38, letterSpacing: -1.5 },
  heading: { fontFamily: fonts.extraBold, fontSize: 28, letterSpacing: -0.5 },
  title: { fontFamily: fonts.extraBold, fontSize: 22 },
  titleSm: { fontFamily: fonts.extraBold, fontSize: 20 },
  question: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 33, letterSpacing: -0.3 }, // 부모 홈 질문
  h19: { fontFamily: fonts.bold, fontSize: 19 },
  h18: { fontFamily: fonts.bold, fontSize: 18 },
  h17: { fontFamily: fonts.bold, fontSize: 17 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 26 },
  bodyMd: { fontFamily: fonts.medium, fontSize: 15 },
  body15: { fontFamily: fonts.regular, fontSize: 15 },
  small: { fontFamily: fonts.regular, fontSize: 14 },
  label13: { fontFamily: fonts.bold, fontSize: 13 },
  caption: { fontFamily: fonts.medium, fontSize: 12 },
  tab: { fontFamily: fonts.bold, fontSize: 11 },
} as const;

// ── 라운드(반경) ─────────────────────────────────────────────────────
export const radius = {
  modal: 26,
  xl: 24,
  lg: 22,
  r20: 20,
  r18: 18,
  r16: 16,
  r14: 14,
  r13: 13,
  r12: 12,
  pill: 999,
  circle: 9999,
} as const;

// ── 간격 ─────────────────────────────────────────────────────────────
export const spacing = {
  screenX: 30, // 부모 화면 좌우 패딩
  cardX: 26, // 카드/콘텐츠 좌우
  gap: 14, // 기본 요소 간격(부모 버튼 사이 ≥14)
  gapSm: 8,
  gapLg: 20,
} as const;

// ── 터치/사이즈 ──────────────────────────────────────────────────────
export const sizes = {
  touchMin: 54, // 부모 버튼 최소 높이
  buttonMd: 56, // 표준 버튼(확인/간직 등)
  buttonLg: 60,
  buttonXl: 64, // 답변 보내기
  iconButton: 52, // 원형 아이콘 버튼(알림/기어/back)
  tabIcon: 26,
  tabLabel: 11,
  recordButton: 104, // 녹음 원형 버튼
  avatarSm: 38,
  homeIndicatorW: 132,
  homeIndicatorH: 5,
} as const;

// ── 그림자(원본 box-shadow 근사) ─────────────────────────────────────
export const shadow = {
  card: {
    shadowColor: '#2E2318',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  accentButton: {
    shadowColor: '#AC5D3B',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 6,
  },
  toast: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 10,
  },
  push: {
    shadowColor: '#2E2318',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 10,
  },
} as const;
