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
  capsuleWhenMap,
  defaultAiGapDays,
  defaultTarget,
} from '../data/mock';
import * as api from '../api';
import { navigate } from '../navigation/navRef';

/**
 * 서버 연동 원칙: "서버 우선, 실패 시 목업 폴백".
 * - hydrate(): 서버가 살아 있으면 questions/capsules/notifs/poll/settings를
 *   불러와 스토어를 채우고, 죽어 있으면 조용히 목업을 유지한다(오프라인 모드).
 * - 쓰기 액션: 기존 로컬 낙관적 업데이트를 그대로 유지하고, 서버 호출은
 *   best-effort(fire-and-forget, 실패 시 콘솔 경고만)로 병행한다.
 *   → 화면 코드의 액션 시그니처는 변경 없음.
 */
const syncWarn = (what: string) => (e: unknown) =>
  console.warn(`[eum] ${what} 서버 동기화 실패 (로컬은 반영됨):`, e);

/** 하이드레이트용: 실패해도 throw하지 않고 null 반환 (목업 유지) */
async function safe<T>(p: Promise<T>, what: string): Promise<T | null> {
  try {
    return await p;
  } catch (e) {
    console.warn(`[eum] ${what} 실패 — 목업 유지:`, e);
    return null;
  }
}

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
  /** 백엔드 생존 여부 (false면 목업만으로 오프라인 동작) */
  serverOnline: boolean;

  // 도메인 데이터
  questions: Question[];
  capsules: Capsule[];
  notifs: Notif[];
  pollVotes: number[];
  pollVoted: number | null;
  pollLabels: string[];
  pollTitle: string;
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
  /** 데모/오프라인용 진입 — 목업 프로필로 로그인 (기존 화면 계약 유지) */
  login: (role: Role) => void;
  /**
   * 실제 서버 계정 세션으로 로그인 (AuthScreen 가입/로그인 성공 시).
   * api.signup()/api.signin()의 결과를 그대로 받는다. 세션은 메모리 전용 —
   * 영속화 없음(MVP), 앱 재시작 시 재로그인 필요.
   */
  authLogin: (auth: api.AuthResult) => void;
  logout: () => void;
  /** 서버 헬스체크 + 데이터 하이드레이트. 실패해도 절대 throw하지 않는다(목업 폴백) */
  hydrate: () => Promise<void>;
  switchRole: () => void;
  setTab: (tab: TabKey) => void;

  // ── 오버레이 액션 ──
  showToast: (message: string, ms?: number) => void;
  clearToast: () => void;
  setPush: (push: { qid: number; title: string } | null) => void;

  // ── 질문/응답 ──
  setTarget: (name: string) => void;
  answerQuestion: (id: number, patch: { dur: string; transcript: string; audioFilePath?: string }) => void;
  /** AI 추천 홈 질문(id=99)을 목록에 추가하고 그 id를 반환 */
  ensureAiQuestion: () => Promise<number>;
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

// 새로고침 후에도 로그인 유지 — localStorage에서 세션 복원
function restoreSession(): { role: Role; user: User } | null {
  const sess = api.getSession();
  if (!sess) return null;
  return {
    role: sess.role,
    user: {
      id: sess.memberId,
      name: sess.memberName,
      role: sess.role,
      familyId: sess.familyId,
      color: sess.role === 'parent' ? '#7C8A55' : '#5B7086',
    },
  };
}

const restored = restoreSession();

export const useStore = create<StoreState>((set, get) => ({
  role: restored?.role ?? null,
  currentUser: restored?.user ?? null,
  tab: 'home',
  serverOnline: false,

  questions: [],
  capsules: [],
  notifs: [],
  pollVotes: [0, 0, 0],
  pollVoted: null,
  pollLabels: [],
  pollTitle: '',
  albumFilter: '전체',
  extraPhotos: [],
  aiGapDays: defaultAiGapDays,
  translatedIds: [],
  target: defaultTarget,
  settings: { autoTranslate: false, voiceGuide: true, fontSize: '보통' },

  toast: null,
  push: null,

  login: (role) => {
    set({ role, currentUser: makeUser(role), tab: 'home' });
    void get().hydrate(); // 서버 세션 확보 + 데이터 로드 (실패 시 목업 유지)
  },
  authLogin: (auth) => {
    const role: Role = auth.member.role === 'parent' ? 'parent' : 'child';
    set({
      role,
      currentUser: {
        id: auth.member.id,
        name: auth.member.name,
        role,
        familyId: auth.member.family_id,
        color: role === 'parent' ? '#7C8A55' : '#5B7086', // makeUser와 동일 팔레트
      },
      tab: 'home',
      serverOnline: true,
    });
    // api.signup/signin이 이미 모듈 세션을 확보했으므로 hydrate의
    // bootstrapSession()은 그 세션을 재사용한다 (데모 계정 생성 안 함).
    void get().hydrate();
  },
  logout: () => {
    api.clearSession();
    set({
      role: null,
      currentUser: null,
      tab: 'home',
      push: null,
      questions: [],
      capsules: [],
      notifs: [],
      pollVotes: [0, 0, 0],
      pollVoted: null,
    });
    // 루트 네비게이터가 role === null 조건으로 Login을 렌더링할 시간이 필요하므로
    // 약간 지연시켜 안전하게 네비게이션을 호출합니다.
    setTimeout(() => {
      try {
        navigate('Login');
      } catch {}
    }, 50);
  },
  switchRole: () => {
    const next: Role = get().role === 'parent' ? 'child' : 'parent';
    set({ role: next, currentUser: makeUser(next), tab: 'home' });
    get().showToast(next === 'parent' ? '부모님 모드로 전환했어요' : '자녀 모드로 전환했어요');
    void get().hydrate(); // 역할 전환 시 서버 세션/알림도 새 역할 기준으로 갱신
  },

  hydrate: async () => {
    const online = await api.checkHealth();
    set({ serverOnline: online });
    if (!online) {
      console.warn('[eum] 서버 미응답 — 목업 데이터로 오프라인 동작');
      return;
    }
    try {
      // authLogin()으로 이미 실제 세션이 있으면 bootstrapSession(데모 시드) 건너뛰기
      const sess = api.getSession() ?? await api.bootstrapSession(get().role ?? 'child');
      const [qs, caps, ns, pollData, settings] = await Promise.all([
        safe(api.fetchQuestions(sess.familyId), '질문 조회'),
        safe(api.fetchCapsules(sess.familyId), '캡슐 조회'),
        safe(api.fetchNotifs(sess.memberId), '알림 조회'),
        safe(api.fetchPollVotes(sess.familyId), '투표 조회'),
        safe(api.fetchSettings(sess.memberId), '설정 조회'),
      ]);
      // 서버 온라인이면 빈 배열이어도 덮어쓴다 (신규 가입자 = 빈 화면)
      if (qs) set({ questions: qs });
      if (caps) set({ capsules: caps });
      if (ns) set({ notifs: ns });
      if (pollData) set({ pollVotes: pollData.votes, pollLabels: pollData.labels, pollTitle: pollData.title });
      if (settings) set({ settings });
    } catch (e) {
      console.warn('[eum] 서버 하이드레이트 실패 — 목업 유지:', e);
    }
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
  answerQuestion: (id, patch) => {
    const q = get().questions.find((qq) => qq.id === id);
    set((s) => ({
      questions: s.questions.map((qq) =>
        qq.id === id
          ? { ...qq, status: 'answered' as const, dur: patch.dur, transcript: patch.transcript, audioUrl: patch.audioFilePath }
          : qq
      ),
    }));
    api.pushAnswer(id, { dur: patch.dur, transcript: patch.transcript, text: q?.text, from: q?.from, audioFilePath: patch.audioFilePath })
      .catch(syncWarn('답변'));
  },
  ensureAiQuestion: async () => {
    const exists = get().questions.some((q) => q.id === 99);
    if (exists) return 99;
    let text = '요즘 하루 중 가장 마음이 편안해지는 순간은 언제인가요?';
    try {
      const r = await api.getAiSuggestions({ count: 1 });
      const q = r.questions[0];
      if (q) text = typeof q === 'string' ? q : q.content;
    } catch {}
    const q: Question = { id: 99, ai: true, text, from: '이음', rel: 'AI 질문', ago: '지금', status: 'pending' };
    set((s) => ({ questions: [q, ...s.questions] }));
    return 99;
  },
  toggleTranslate: (id) =>
    set((s) => ({
      translatedIds: s.translatedIds.includes(id) ? s.translatedIds.filter((x) => x !== id) : [...s.translatedIds, id],
    })),

  vote: (i) => {
    const prev = get().pollVoted;
    set((s) => {
      const votes = [...s.pollVotes];
      if (s.pollVoted !== null) votes[s.pollVoted] = Math.max(0, votes[s.pollVoted] - 1);
      if (s.pollVoted === i) return { pollVotes: votes, pollVoted: null };
      votes[i] += 1;
      return { pollVotes: votes, pollVoted: i };
    });
    // 재투표는 서버가 기존 표를 자동 이동. 취소(같은 항목 재탭)는 서버 미지원 → 로컬만 반영
    if (prev !== i) api.pushVoteByIndex(i).catch(syncWarn('투표'));
  },

  markNotifRead: (id) => {
    set((s) => ({ notifs: s.notifs.map((n) => (n.id === id ? { ...n, unread: false } : n)) }));
    api.pushNotifRead(id).catch(syncWarn('알림 읽음'));
  },
  readAllNotifs: () => {
    set((s) => ({ notifs: s.notifs.map((n) => ({ ...n, unread: false })) }));
    api.pushAllNotifsRead().catch(syncWarn('알림 전체 읽음'));
  },

  setAlbumFilter: (f) => set({ albumFilter: f }),
  addPhoto: (photo) =>
    set((s) => ({
      extraPhotos: [photo ?? { label: '방금 올린 사진', who: '지훈', tone: '#5B7086' }, ...s.extraPhotos],
      albumFilter: '전체',
    })),

  markCapsuleOpen: (id) => {
    set((s) => ({ capsules: s.capsules.map((c) => (c.id === id ? { ...c, status: 'open' } : c)) }));
    api.pushCapsuleOpen(id).catch(syncWarn('캡슐 열기'));
  },
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
    api.pushSealCapsule({ id: cap.id, from: cap.from, to: cap.to, title: cap.title, when: cap.when, dur: cap.dur }).catch(syncWarn('캡슐 봉인'));
  },

  setAiGapDays: (n) => set({ aiGapDays: n }),
  toggleAutoTranslate: () => {
    const next = !get().settings.autoTranslate;
    set((s) => ({ settings: { ...s.settings, autoTranslate: next } }));
    api.pushSettings({ auto_translate: next }).catch(syncWarn('자동 번역 설정'));
  },
  toggleVoiceGuide: () => {
    const next = !get().settings.voiceGuide;
    set((s) => ({ settings: { ...s.settings, voiceGuide: next } }));
    api.pushSettings({ voice_guide: next }).catch(syncWarn('음성 안내 설정'));
  },
  setFontSize: (size) => {
    set((s) => ({ settings: { ...s.settings, fontSize: size } }));
    api.pushSettings({ font_size: size }).catch(syncWarn('글씨 크기 설정'));
  },
}));
