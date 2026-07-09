/**
 * 목업 데이터 — view/design/이음.dc.html 하단 <script>(DCLogic)의 state/필드를
 * 타입에 맞춰 그대로 이식. 값(문구/색/날짜)은 원본과 1:1로 유지한다.
 */
import type {
  Capsule,
  Notif,
  Question,
  StorybookPage,
  Photo,
  CalEvent,
  FamilyMember,
} from '../types';

// ── 캡슐 (state.capsules) ─────────────────────────────────────────────
export const capsules: Capsule[] = [
  { id: 1, from: '서연', to: '지훈', title: '오빠 생일에 열어봐', when: '2026. 7. 9', status: 'ready', dur: '1:26', color: '#7C8A55' },
  { id: 2, from: '엄마', to: '서연', title: '서연이 결혼하는 날에', when: '2027. 5. 10', dday: 'D-305', status: 'locked', color: '#8C5F6E' },
  { id: 3, from: '지훈', to: '엄마', title: '엄마 칠순 생신 아침에', when: '2026. 12. 3', dday: 'D-147', status: 'locked', color: '#5B7086' },
  { id: 4, from: '아빠', to: '가족 모두', title: '스무 해 전 어느 봄날', when: '2026. 3. 1', status: 'open', dur: '2:04', color: '#9A7B3C' },
];

// ── 알림 (state.notifs) ───────────────────────────────────────────────
export const notifs: Notif[] = [
  { id: 1, icon: 'mark_email_unread', color: '#7C8A55', title: '서연의 타임캡슐이 오늘 열렸어요', time: '오늘', unread: true, nav: 'caps' },
  { id: 2, icon: 'graphic_eq', color: '#AC5D3B', title: '엄마가 "학창 시절 친구" 질문에 답했어요', time: '어제', unread: true, nav: 'c_resp' },
  { id: 3, icon: 'face', color: '#5B7086', title: '얼굴 인식: 엄마가 나온 사진 4장이 모였어요', time: '2일 전', unread: false, nav: 'album' },
  { id: 4, icon: 'how_to_vote', color: '#8C5F6E', title: '새 투표: 추석 가족 모임 날짜 정하기', time: '3일 전', unread: false, nav: 'poll' },
  { id: 5, icon: 'help', color: '#9A7B3C', title: '지훈이 새 질문을 보냈어요', time: '4일 전', unread: false, nav: null },
];

// ── 질문 (state.questions) ────────────────────────────────────────────
export const questions: Question[] = [
  { id: 1, text: '어릴 적 살던 동네는 어떤 모습이었어요?', from: '지훈', rel: '아들', ago: '2일 전', status: 'pending' },
  { id: 2, text: '엄마가 아빠를 처음 만난 날, 기억나세요?', from: '서연', rel: '딸', ago: '4일 전', status: 'pending' },
  {
    id: 3,
    text: '학창 시절 제일 친했던 친구는 누구였어요?',
    from: '지훈',
    rel: '아들',
    ago: '지난주',
    status: 'answered',
    dur: '0:48',
    era: '청소년기',
    transcript: '영희라는 아이가 있었지. 학교만 끝나면 둘이 냇가에 가서 물장구치고 놀았어. 손 꼭 잡고 집에 오던 그 길이 아직도 눈에 선하다.',
    transcriptEn: 'There was a girl named Younghee. As soon as school ended, we would run to the stream and splash around. I can still see the road we walked home, hand in hand.',
  },
  {
    id: 4,
    text: '제가 태어난 날, 어떤 기분이었어요?',
    from: '서연',
    rel: '딸',
    ago: '2주 전',
    status: 'answered',
    dur: '0:32',
    era: '부모 시절',
    transcript: '새벽부터 눈이 펑펑 내렸어. 너를 처음 품에 안는 순간, 세상이 다 조용해지고 네 숨소리만 들리더라.',
    transcriptEn: 'It snowed heavily from dawn. The moment I first held you in my arms, the whole world went quiet, and all I could hear was your breathing.',
  },
];

// ── AI 추천 질문 (aiQ) ────────────────────────────────────────────────
export const aiQuestions: string[] = [
  '가장 자랑스러웠던 순간은 언제였나요?',
  '젊은 시절 이루고 싶던 꿈이 있었나요?',
  '우리 가족 첫 여행에서 기억나는 장면이 있어요?',
  '요즘 하루 중 가장 행복한 때는 언제예요?',
];

/** 홈 화면 상단 "이음이 준비한 질문" 문구 + openAI가 만드는 질문 */
export const aiHomeQuestionText = '요즘 하루 중 가장 마음이 편안해지는 순간은 언제인가요?';

// ── 스토리북 페이지 (pages) ───────────────────────────────────────────
export const storybookPages: StorybookPage[] = [
  { era: '유년기', years: '1955 – 1968', title: '골목 끝, 파란 대문 집', dur: '1:12', count: 2, isNew: false, body: '비가 오면 흙냄새가 온 골목에 퍼졌어. 대문 앞 평상에 앉아 어머니가 부쳐주던 부침개를 기다리던 그 시간이 제일 좋았지. 지금도 비 냄새를 맡으면 그 골목이 떠올라.' },
  { era: '청소년기', years: '1968 – 1974', title: '단짝 영희와의 여름', dur: '0:58', count: 3, isNew: true, body: '학교만 끝나면 영희랑 냇가로 달려갔어. 물장구치다 노을이 지면 손 꼭 잡고 집에 오던 그 길이 아직도 눈에 선하다.' },
  { era: '청년 시절', years: '1974 – 1983', title: '서울로 온 스무 살', dur: '1:04', count: 1, isNew: false, body: '보따리 하나 들고 완행열차를 탔어. 무섭기도 했지만, 그때만큼 가슴이 뛰던 적이 없었지. 낯선 도시의 불빛이 다 내 것 같았어.' },
  { era: '부모 시절', years: '1983 – 지금', title: '너를 처음 안던 날', dur: '0:46', count: 2, isNew: true, body: '새벽부터 눈이 펑펑 내렸어. 너를 처음 품에 안는 순간, 세상이 다 조용해지고 네 숨소리만 들리더라.' },
];

// ── 캘린더 이벤트 (eventsData) ────────────────────────────────────────
export const calendarEvents: CalEvent[] = [
  { d: '12', dow: '일', title: '엄마 생신', by: '서연', tag: '생일', color: '#8C5F6E' },
  { d: '18', dow: '토', title: '가족 저녁 식사', by: '지훈', tag: '모임', color: '#5B7086' },
  { d: '25', dow: '토', title: '여름 가족 여행', by: '지훈', tag: '여행', color: '#7C8A55' },
];

/** 캘린더 날짜별 이벤트 dot 색 (dotMap) */
export const calendarDotMap: Record<number, string> = { 12: '#8C5F6E', 18: '#5B7086', 25: '#7C8A55', 26: '#7C8A55', 27: '#7C8A55' };
export const todayDate = 9; // 오늘(강조) 날짜
export const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

// ── 앨범 사진 (photosData) ────────────────────────────────────────────
export const photos: Photo[] = [
  { label: '냇가 나들이', who: '엄마', tone: '#7C8A55' },
  { label: '생신 잔치', who: '엄마', tone: '#8C5F6E' },
  { label: '첫 손주 서연', who: '서연', tone: '#5B7086' },
  { label: '김장하는 날', who: '엄마', tone: '#9A7B3C' },
  { label: '텃밭의 아빠', who: '아빠', tone: '#7C8A55' },
  { label: '가족 소풍', who: '지훈', tone: '#5B7086' },
  { label: '설날 아침', who: '엄마', tone: '#8C5F6E' },
  { label: '바다 여행', who: '서연', tone: '#5B7086' },
  { label: '아빠 낚시', who: '아빠', tone: '#9A7B3C' },
];

export const albumFilters = ['전체', '엄마', '아빠', '지훈', '서연'];

// ── 투표 (pollLabels / pollVotes) ─────────────────────────────────────
export const pollTitle = '추석 가족 모임, 언제가 좋을까요?';
export const pollLabels = ['10월 3일 (토) 점심', '10월 4일 (일) 점심', '10월 4일 (일) 저녁'];
export const pollVotesInit = [2, 1, 0];

// ── 질문 대상 (targets) ───────────────────────────────────────────────
export const targets: { name: string; rel: string }[] = [
  { name: '엄마 김순자', rel: '어머니' },
  { name: '아빠 김영수', rel: '아버지' },
];

// ── 가족 구성원 (family) ──────────────────────────────────────────────
export const family: FamilyMember[] = [
  { label: '엄마', name: '김순자', color: '#7C8A55', role: 'parent' },
  { label: '아빠', name: '김영수', color: '#9A7B3C', role: 'parent' },
  { label: '지훈', name: '지훈', color: '#5B7086', role: 'child' },
  { label: '서연', name: '서연', color: '#8C5F6E', role: 'child' },
];

// ── 색 매핑 ───────────────────────────────────────────────────────────
/** 연대(era) → 색 (eraTone) */
export const eraTone: Record<string, string> = {
  유년기: '#7C8A55',
  청소년기: '#5B7086',
  '청년 시절': '#9A7B3C',
  '부모 시절': '#8C5F6E',
};

/** 발신자 → 아바타 색 (avPal) */
export const avatarPalette: Record<string, string> = {
  지훈: '#5B7086',
  서연: '#8C5F6E',
};

// ── 타임캡슐 작성 옵션 ────────────────────────────────────────────────
export const capsuleToOptions = ['엄마', '아빠', '지훈', '서연', '가족 모두'];
export const capsuleWhenOptions = ['1년 뒤', '3년 뒤', '엄마 칠순', '서연 결혼식'];
/** 캡슐 봉인 시점 매핑 (sealCapsule의 whenMap) */
export const capsuleWhenMap: Record<string, { when: string; dday: string }> = {
  '1년 뒤': { when: '2027. 7. 9', dday: 'D-365' },
  '3년 뒤': { when: '2029. 7. 9', dday: 'D-1095' },
  '엄마 칠순': { when: '2026. 12. 3', dday: 'D-147' },
  '서연 결혼식': { when: '2027. 5. 10', dday: 'D-305' },
};

// ── 설정 옵션 ─────────────────────────────────────────────────────────
export const fontSizeOptions = ['보통', '크게', '아주 크게'] as const;
/** 부모 모드 폰트 배율 (pZoom) — RN에선 화면에서 필요 시 참조 */
export const fontZoomMap: Record<string, number> = { 보통: 1, 크게: 1.12, '아주 크게': 1.25 };
export const aiGapOptions = [1, 3, 5, 7]; // "질문 없는 일수" 옵션

// ── 기본값 ────────────────────────────────────────────────────────────
export const defaultTarget = '엄마 김순자';
export const defaultAiGapDays = 3;
