/**
 * 이음(Ieum) 데이터 모델 — 명세 8장 + support.js 목업 구조를 통합.
 * 화면/스토어/목업이 공유하는 타입. 목업 필드(색/뱃지 등 뷰 파생값)는
 * renderVals에서 계산하므로 여기엔 "원천 데이터" 위주로 둔다.
 */

// ── 역할 / 사용자 ─────────────────────────────────────────────────────
export type Role = 'parent' | 'child';

export interface User {
  id: string;
  name: string;
  role: Role;
  familyId: string;
  avatar?: string;
  color?: string; // 아바타 배경색
}

export interface FamilyMember {
  label: string; // '엄마' | '아빠' | '지훈' | '서연'
  name: string; // 실제 이름
  color: string; // 아바타/카테고리 색
  role?: Role;
}

export interface Family {
  id: string;
  name: string;
  members: FamilyMember[];
}

// ── 질문 / 응답 ───────────────────────────────────────────────────────
export type QuestionStatus = 'pending' | 'answered';
export type QuestionSource = 'manual' | 'ai';

export interface Question {
  id: number;
  text: string;
  from: string; // 보낸 사람 표시명 ('지훈' | '서연' | '이음')
  rel: string; // 관계 표시 ('아들' | '딸' | 'AI 질문')
  ago: string; // '2일 전' 등 표시용
  status: QuestionStatus;
  ai?: boolean; // AI 추천 질문 여부
  // 답변된 경우 채워짐 (인라인 응답 모델)
  dur?: string; // '0:48'
  era?: string; // '청소년기' 등
  transcript?: string;
  transcriptEn?: string;
}

export type AnswerType = 'voice' | 'text';

export interface Answer {
  id: number;
  questionId: number;
  type: AnswerType;
  audioUrl?: string;
  transcript?: string;
  dur?: string;
  createdAt?: string;
}

// ── 스토리북 ──────────────────────────────────────────────────────────
export interface StorybookPage {
  era: string; // '유년기' | '청소년기' | '청년 시절' | '부모 시절'
  years: string; // '1955 – 1968'
  title: string;
  dur: string;
  count: number; // 모인 이야기 수
  isNew: boolean;
  body: string;
  audioUrl?: string;
  sourceAnswerIds?: number[];
}

// ── 사진(앨범) ────────────────────────────────────────────────────────
export interface Photo {
  label: string;
  who: string; // 인물/업로더 ('엄마' | '아빠' | '지훈' | '서연')
  tone: string; // 카테고리 색
  faceTags?: string[];
  uploadedAt?: string;
}

// ── 투표 ──────────────────────────────────────────────────────────────
export interface Poll {
  id: number;
  question: string;
  options: string[];
  votes: number[];
}

// ── 타임캡슐 ──────────────────────────────────────────────────────────
export type CapsuleStatus = 'ready' | 'locked' | 'open';

export interface Capsule {
  id: number;
  from: string;
  to: string;
  title: string;
  when: string; // '2026. 7. 9'
  status: CapsuleStatus;
  dur?: string; // 재생 길이
  dday?: string; // 'D-305' (locked)
  color: string; // 카테고리 색
}

// ── 알림 ──────────────────────────────────────────────────────────────
export type NotifNav = 'caps' | 'poll' | 'album' | 'c_resp' | null;

export interface Notif {
  id: number;
  icon: string; // Material Symbols 글리프명
  color: string;
  title: string;
  time: string;
  unread: boolean;
  nav: NotifNav;
}

// ── 캘린더 이벤트 ─────────────────────────────────────────────────────
export interface CalEvent {
  d: string; // 날짜
  dow: string; // 요일
  title: string;
  by: string;
  tag: string;
  color: string;
}

// ── 폰트 크기 옵션 ────────────────────────────────────────────────────
export type FontSizeOption = '보통' | '크게' | '아주 크게';
