/**
 * 이음 전역 스토어 (zustand).
 * support.js DCLogic.state의 "도메인/횡단" 상태를 담는다.
 * (녹음 중 초/재생 progress 등 화면 국소 UI 상태는 각 화면 로컬 state로 둘 것)
 *
 * 화면은 selector로 필요한 조각만 구독한다:
 *   const role = useStore(s => s.role);
 *   const showToast = useStore(s => s.showToast);
 */
import { create } from 'zustand';
import type {
  Role,
  User,
  Question,
  Capsule,
  Notif,
  Photo,
  FontSizeOption,
} from '../types';
import {
  questions as mockQuestions,
  capsules as mockCapsules,
  notifs as mockNotifs,
  pollVotesInit,
  defaultTarget,
  defaultAiGapDays,
  aiHomeQuestionText,
  capsuleWhenMap,
} from '../data/mock';

export type TabKey = 'home' | 'voice' | 'calendar' | 'album';

/** 역할별 "나" 프로필 (renderVals의 meName/meColor/meInitial 기반) */
function makeUser(role: Role): User {
  return role === 'parent'
    ? { id: 'u_parent', name: '김순자', role: 'parent', familyId: 'fam1', color: '#7C8A55' }
    : { id: 'u_child', name: '지훈', role: 'child', familyId: 'fam1', color: '#5B7086' };
}

interface Settings {
  autoTranslate: boolean;
  voiceGuide: boolean;
  fontSize: FontSizeOption;
}

interface StoreState {
  // 세션
  role: Role | null;
  currentUser: User | null;
  tab: TabKey;

  // 도메인 데이터
  questions: Question[];
  capsules: Capsule[];
  notifs: Notif[];
  pollVotes: number[];
  pollVoted: number | null;
  albumFilter: string;
  extraPhotos: Photo[];
  aiGapDays: number;
  translatedIds: number[];
  target: string;
  settings: Settings;

  // 오버레이(전역)
  toast: string | null;
  push: { qid: number; title: string } | null;

  // ── 세션 액션 ──
  login: (role: Role) => void;
  logout: () => void;
  switchRole: () => void;
  setTab: (tab: TabKey) => void;

  // ── 오버레이 액션 ──
  showToast: (message: string, ms?: number) => void;
  clearToast: () => void;
  setPush: (push: { qid: number; title: string } | null) => void;

  // ── 질문/응답 ──
  setTarget: (name: string) => void;
  answerQuestion: (id: number, patch: { dur: string; transcript: string; era?: string }) => void;
  /** AI 추천 홈 질문(id=99)을 목록에 추가하고 그 id를 반환 */
  ensureAiQuestion: () => number;
  toggleTranslate: (id: number) => void;

  // ── 투표 ──
  vote: (i: number) => void;

  // ── 알림 ──
  markNotifRead: (id: number) => void;
  readAllNotifs: () => void;

  // ── 앨범 ──
  setAlbumFilter: (f: string) => void;
  addPhoto: (photo?: Photo) => void;

  // ── 캡슐 ──
  markCapsuleOpen: (id: number) => void;
  sealCapsule: (input: { to: string; when: string; title: string; dur: string; from?: string }) => void;

  // ── 설정 ──
  setAiGapDays: (n: number) => void;
  toggleAutoTranslate: () => void;
  toggleVoiceGuide: () => void;
  setFontSize: (size: FontSizeOption) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useStore = create<StoreState>((set, get) => ({
  role: null,
  currentUser: null,
  tab: 'home',

  questions: mockQuestions,
  capsules: mockCapsules,
  notifs: mockNotifs,
  pollVotes: [...pollVotesInit],
  pollVoted: null,
  albumFilter: '전체',
  extraPhotos: [],
  aiGapDays: defaultAiGapDays,
  translatedIds: [],
  target: defaultTarget,
  settings: { autoTranslate: false, voiceGuide: true, fontSize: '보통' },

  toast: null,
  push: null,

  login: (role) => set({ role, currentUser: makeUser(role), tab: 'home' }),
  logout: () => set({ role: null, currentUser: null, tab: 'home', push: null }),
  switchRole: () => {
    const next: Role = get().role === 'parent' ? 'child' : 'parent';
    set({ role: next, currentUser: makeUser(next), tab: 'home' });
    get().showToast(next === 'parent' ? '부모님 모드로 전환했어요' : '자녀 모드로 전환했어요');
  },
  setTab: (tab) => set({ tab }),

  showToast: (message, ms = 2600) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: message });
    toastTimer = setTimeout(() => set({ toast: null }), ms);
  },
  clearToast: () => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: null });
  },
  setPush: (push) => set({ push }),

  setTarget: (name) => set({ target: name }),
  answerQuestion: (id, patch) =>
    set((s) => ({
      questions: s.questions.map((q) =>
        q.id === id
          ? { ...q, status: 'answered' as const, dur: patch.dur, transcript: patch.transcript, era: patch.era ?? '청년 시절' }
          : q
      ),
    })),
  ensureAiQuestion: () => {
    const exists = get().questions.some((q) => q.id === 99);
    if (!exists) {
      const q: Question = { id: 99, ai: true, text: aiHomeQuestionText, from: '이음', rel: 'AI 질문', ago: '지금', status: 'pending' };
      set((s) => ({ questions: [q, ...s.questions] }));
    }
    return 99;
  },
  toggleTranslate: (id) =>
    set((s) => ({
      translatedIds: s.translatedIds.includes(id) ? s.translatedIds.filter((x) => x !== id) : [...s.translatedIds, id],
    })),

  vote: (i) =>
    set((s) => {
      const votes = [...s.pollVotes];
      if (s.pollVoted !== null) votes[s.pollVoted] = Math.max(0, votes[s.pollVoted] - 1);
      if (s.pollVoted === i) return { pollVotes: votes, pollVoted: null };
      votes[i] += 1;
      return { pollVotes: votes, pollVoted: i };
    }),

  markNotifRead: (id) => set((s) => ({ notifs: s.notifs.map((n) => (n.id === id ? { ...n, unread: false } : n)) })),
  readAllNotifs: () => set((s) => ({ notifs: s.notifs.map((n) => ({ ...n, unread: false })) })),

  setAlbumFilter: (f) => set({ albumFilter: f }),
  addPhoto: (photo) =>
    set((s) => ({
      extraPhotos: [photo ?? { label: '방금 올린 사진', who: '지훈', tone: '#5B7086' }, ...s.extraPhotos],
      albumFilter: '전체',
    })),

  markCapsuleOpen: (id) => set((s) => ({ capsules: s.capsules.map((c) => (c.id === id ? { ...c, status: 'open' } : c)) })),
  sealCapsule: ({ to, when, title, dur, from }) => {
    const w = capsuleWhenMap[when] ?? capsuleWhenMap['1년 뒤'];
    const cap: Capsule = {
      id: Date.now(),
      from: from ?? (get().role === 'parent' ? '엄마' : '지훈'),
      to,
      title: title.trim() || '우리 가족에게',
      when: w.when,
      dday: w.dday,
      status: 'locked',
      color: '#8C5F6E',
      dur,
    };
    set((s) => ({ capsules: [cap, ...s.capsules] }));
  },

  setAiGapDays: (n) => set({ aiGapDays: n }),
  toggleAutoTranslate: () => set((s) => ({ settings: { ...s.settings, autoTranslate: !s.settings.autoTranslate } })),
  toggleVoiceGuide: () => set((s) => ({ settings: { ...s.settings, voiceGuide: !s.settings.voiceGuide } })),
  setFontSize: (size) => set((s) => ({ settings: { ...s.settings, fontSize: size } })),
}));
