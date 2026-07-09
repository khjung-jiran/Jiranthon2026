/**
 * 이음 API 도메인 함수 + 서버 응답 → 앱 타입 매핑 계층.
 *
 * - 서버 스키마: server/schemas.py 기준 (snake_case, string UUID id)
 * - 앱 타입:    src/types (number id, 표시용 한글 문자열) — 이 파일에서 변환한다.
 * - 원칙: "서버 우선, 실패 시 목업 폴백". 모든 함수는 실패 시 ApiError를
 *   throw하므로 호출부(store)는 best-effort(catch 후 경고)로 감싼다.
 *
 * ID 매핑: 서버는 string UUID, 앱 화면은 number id를 쓴다.
 * 레지스트리(makeIdRegistry)가 서버 id ↔ 앱 number id를 세션 동안 안정적으로
 * 양방향 매핑한다 (하이드레이트로 받은 항목에 대해 쓰기 액션 동기화 가능).
 */
import { ApiError, apiGet, apiPost, apiPut, request } from './client';
import type {
  Capsule,
  CapsuleStatus,
  FontSizeOption,
  Notif,
  NotifNav,
  Question,
  Role,
} from '../types';
import {
  questions as mockQuestions,
  capsules as mockCapsules,
  notifs as mockNotifs,
  pollTitle,
  pollLabels,
} from '../data/mock';

export { setApiBase, getApiBase, ApiError } from './client';

// ─────────────────────────────────────────────────────────────────────
// 서버 응답 타입 (server/schemas.py 1:1)
// ─────────────────────────────────────────────────────────────────────

export interface ServerFamily {
  id: string;
  name: string;
  invite_code: string | null;
  created_at: string;
}

export interface ServerMember {
  id: string;
  family_id: string;
  name: string;
  role: string; // 'parent' | 'child'
  username: string | null;
  birth_date: string | null;
  profile_image: string | null;
  created_at: string;
}

export interface ServerLoginResponse {
  member: ServerMember;
  family: ServerFamily;
  invite_code: string | null;
}

export interface ServerQuestion {
  id: string;
  family_id: string;
  content: string;
  category: string | null;
  source: string; // 'manual' | 'ai' | 'auto'
  from_member_id: string;
  to_member_id: string;
  status: string; // 'pending' | 'answered'
  created_at: string;
}

export interface ServerResponse {
  id: string;
  question_id: string;
  member_id: string;
  content: string;
  input_method: string;
  audio_file_path: string | null;
  transcript: string | null;
  era: string | null;
  duration: string | null;
  created_at: string;
}

export interface ServerCapsule {
  id: string;
  family_id: string;
  from_member_id: string;
  to_member_id: string;
  title: string;
  audio_file_path: string | null;
  open_date: string; // 'YYYY-MM-DD'
  status: string; // 'locked' | 'ready' | 'open'
  duration: string | null;
  created_at: string;
}

export interface ServerNotification {
  id: string;
  member_id: string;
  type: string;
  title: string;
  icon: string | null;
  color: string | null;
  is_read: boolean;
  nav_target: string | null;
  created_at: string;
}

export interface ServerPollOption {
  id: string;
  label: string;
  vote_count: number;
}

export interface ServerPoll {
  id: string;
  family_id: string;
  title: string;
  deadline: string | null;
  created_by: string;
  created_at: string;
  options: ServerPollOption[];
}

export interface ServerSettings {
  member_id: string;
  font_size: string;
  voice_guide: boolean;
  auto_translate: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// 헬스체크
// ─────────────────────────────────────────────────────────────────────

/** GET / — 서버 생존 확인. 실패해도 throw하지 않고 false 반환. */
export async function checkHealth(timeoutMs = 2500): Promise<boolean> {
  try {
    await request<unknown>('/', { timeoutMs });
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────
// Raw 엔드포인트 (라우터에 실제 존재하는 것만)
// ─────────────────────────────────────────────────────────────────────

// -- 가족/구성원 (routers/family.py) --
export function createFamily(name: string): Promise<ServerFamily> {
  return apiPost<ServerFamily>('/api/families', { name });
}

export function getFamily(familyId: string): Promise<ServerFamily> {
  return apiGet<ServerFamily>(`/api/families/${familyId}`);
}

/** 초대 코드는 쿼리 파라미터 (server: join_family(invite_code: str)) */
export function joinFamily(inviteCode: string): Promise<ServerFamily> {
  return apiPost<ServerFamily>('/api/families/join', undefined, { invite_code: inviteCode });
}

export function getInviteCode(familyId: string): Promise<{ invite_code: string }> {
  return apiGet<{ invite_code: string }>(`/api/families/${familyId}/invite-code`);
}

export function listMembers(familyId: string): Promise<ServerMember[]> {
  return apiGet<ServerMember[]>(`/api/families/${familyId}/members`);
}

export function createMember(payload: {
  family_id: string;
  name: string;
  role: string;
  username?: string;
  password?: string;
  birth_date?: string;
  profile_image?: string;
}): Promise<ServerMember> {
  return apiPost<ServerMember>('/api/members', payload);
}

export function loginMember(username: string, password: string): Promise<ServerLoginResponse> {
  return apiPost<ServerLoginResponse>('/api/auth/login', { username, password });
}

// -- 질문/응답 (routers/question.py) --
export function createQuestion(payload: {
  family_id: string;
  content: string;
  category?: string;
  source?: string;
  from_member_id: string;
  to_member_id: string;
}): Promise<ServerQuestion> {
  return apiPost<ServerQuestion>('/api/questions', payload);
}

export function listQuestions(params: {
  to_member_id?: string;
  from_member_id?: string;
  family_id?: string;
}): Promise<ServerQuestion[]> {
  return apiGet<ServerQuestion[]>('/api/questions', params);
}

export function getQuestion(qid: string): Promise<ServerQuestion> {
  return apiGet<ServerQuestion>(`/api/questions/${qid}`);
}

export function getAiSuggestions(params?: {
  category?: string;
  count?: number;
  from_member_id?: string;
  to_member_id?: string;
}): Promise<{ questions: string[] }> {
  return apiGet<{ questions: string[] }>('/api/questions/ai-suggestions', params);
}

export function createResponse(payload: {
  question_id: string;
  member_id: string;
  content: string;
  input_method?: string;
  audio_file_path?: string;
  transcript?: string;
  era?: string;
  duration?: string;
}): Promise<ServerResponse> {
  return apiPost<ServerResponse>('/api/responses', payload);
}

export function listResponses(params: {
  question_id?: string;
  family_id?: string;
  member_id?: string;
}): Promise<ServerResponse[]> {
  return apiGet<ServerResponse[]>('/api/responses', params);
}

export function responseStats(familyId: string): Promise<{ pending: number; answered: number }> {
  return apiGet<{ pending: number; answered: number }>('/api/responses/stats', {
    family_id: familyId,
  });
}

// -- 타임캡슐 (routers/capsule.py) --
export function createCapsule(payload: {
  family_id: string;
  from_member_id: string;
  to_member_id: string;
  title: string;
  audio_file_path?: string;
  open_date: string; // 'YYYY-MM-DD'
  duration?: string;
}): Promise<ServerCapsule> {
  return apiPost<ServerCapsule>('/api/capsules', payload);
}

export function listCapsules(familyId: string): Promise<ServerCapsule[]> {
  return apiGet<ServerCapsule[]>('/api/capsules', { family_id: familyId });
}

export function listReadyCapsules(familyId: string): Promise<ServerCapsule[]> {
  return apiGet<ServerCapsule[]>('/api/capsules/ready', { family_id: familyId });
}

export function getCapsule(cid: string): Promise<ServerCapsule> {
  return apiGet<ServerCapsule>(`/api/capsules/${cid}`);
}

export function openCapsule(cid: string): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(`/api/capsules/${cid}/open`);
}

// -- 알림 (routers/notification.py) --
export function listNotifications(memberId: string): Promise<ServerNotification[]> {
  return apiGet<ServerNotification[]>('/api/notifications', { member_id: memberId });
}

export function unreadCount(memberId: string): Promise<{ count: number }> {
  return apiGet<{ count: number }>('/api/notifications/unread-count', { member_id: memberId });
}

export function markNotificationRead(nid: string): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(`/api/notifications/${nid}/read`);
}

export function markAllNotificationsRead(memberId: string): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>('/api/notifications/read-all', undefined, {
    member_id: memberId,
  });
}

export function createNotification(payload: {
  member_id: string;
  type: string;
  title: string;
  icon?: string;
  color?: string;
  nav_target?: string;
}): Promise<ServerNotification> {
  return apiPost<ServerNotification>('/api/notifications', payload);
}

// -- 투표 (routers/poll.py) --
export function createPoll(payload: {
  family_id: string;
  title: string;
  created_by: string;
  options: string[];
  deadline?: string;
}): Promise<ServerPoll> {
  return apiPost<ServerPoll>('/api/polls', payload);
}

export function listPolls(familyId: string): Promise<ServerPoll[]> {
  return apiGet<ServerPoll[]>('/api/polls', { family_id: familyId });
}

export function getPoll(pid: string): Promise<ServerPoll> {
  return apiGet<ServerPoll>(`/api/polls/${pid}`);
}

/** 재투표 시 서버가 기존 표를 자동으로 옮긴다 (취소는 미지원) */
export function votePoll(
  pid: string,
  payload: { member_id: string; option_id: string }
): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(`/api/polls/${pid}/vote`, payload);
}

// -- 설정 (routers/settings.py) --
export function getSettings(memberId: string): Promise<ServerSettings> {
  return apiGet<ServerSettings>('/api/settings', { member_id: memberId });
}

/** member_id는 쿼리 파라미터, 변경 내용은 body (server: update_settings) */
export function updateSettings(
  memberId: string,
  patch: { font_size?: string; voice_guide?: boolean; auto_translate?: boolean }
): Promise<{ success: boolean }> {
  return apiPut<{ success: boolean }>('/api/settings', patch, { member_id: memberId });
}

// ─────────────────────────────────────────────────────────────────────
// ID 레지스트리 — 서버 string id ↔ 앱 number id
// ─────────────────────────────────────────────────────────────────────

function makeIdRegistry(start: number) {
  const toApp = new Map<string, number>();
  const toServer = new Map<number, string>();
  let seq = start;
  return {
    /** 서버 id → 앱 number id (처음 보는 id면 새 번호 발급, 이후 안정적) */
    appId(serverId: string): number {
      let id = toApp.get(serverId);
      if (id === undefined) {
        id = seq++;
        toApp.set(serverId, id);
        toServer.set(id, serverId);
      }
      return id;
    },
    /** 앱 number id → 서버 id (매핑 없으면 undefined = 목업 전용 항목) */
    serverId(appId: number): string | undefined {
      return toServer.get(appId);
    },
    /** 로컬에서 먼저 만든 항목(낙관적 업데이트)을 서버 id와 결합 */
    bind(appId: number, serverId: string): void {
      toApp.set(serverId, appId);
      toServer.set(appId, serverId);
    },
  };
}

const questionIds = makeIdRegistry(1000);
const capsuleIds = makeIdRegistry(5000);
const notifIds = makeIdRegistry(9000);

// ─────────────────────────────────────────────────────────────────────
// 구성원 레지스트리 — member id → 표시명(라벨)
// ─────────────────────────────────────────────────────────────────────

const membersById = new Map<string, ServerMember>();
const memberIdByLabel = new Map<string, string>();

/** 데모 실명 → 화면 라벨 (mock family와 동일) */
const LABEL_BY_NAME: Record<string, string> = {
  김순자: '엄마',
  김영수: '아빠',
  지훈: '지훈',
  서연: '서연',
};

/** 질문 발신자 관계 표시 (mock questions와 동일) */
const REL_BY_NAME: Record<string, string> = { 지훈: '아들', 서연: '딸' };

function registerMembers(members: ServerMember[]): void {
  for (const m of members) {
    membersById.set(m.id, m);
    const label = LABEL_BY_NAME[m.name] ?? m.name;
    memberIdByLabel.set(label, m.id);
    memberIdByLabel.set(m.name, m.id);
  }
}

/** member id → 화면 표시명. 매핑 없으면 원본 문자열 그대로 ('가족 모두' 등) */
function memberLabel(memberId: string): string {
  const m = membersById.get(memberId);
  if (!m) return memberId;
  return LABEL_BY_NAME[m.name] ?? m.name;
}

function relOf(memberId: string): string {
  const m = membersById.get(memberId);
  if (!m) return '가족';
  return REL_BY_NAME[m.name] ?? (m.role === 'child' ? '자녀' : '가족');
}

// ─────────────────────────────────────────────────────────────────────
// 날짜/시간 헬퍼
// ─────────────────────────────────────────────────────────────────────

const DAY_MS = 86400000;

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** ISO datetime → '오늘' | '어제' | 'n일 전' | '지난주' | 'n주 전' */
function relTime(iso?: string | null): string {
  if (!iso) return '지금';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '지금';
  const days = Math.floor((startOfDay(new Date()) - startOfDay(d)) / DAY_MS);
  if (days <= 0) return '오늘';
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;
  if (days < 14) return '지난주';
  return `${Math.floor(days / 7)}주 전`;
}

/** '2027. 5. 10' → '2027-05-10' */
function dotsToIso(dots: string): string {
  const parts = dots.split('.').map((p) => p.trim()).filter(Boolean);
  const [y, m, d] = parts;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** '2027-05-10' → '2027. 5. 10' */
function isoToDots(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${y}. ${Number(m)}. ${Number(d)}`;
}

/** open_date(ISO) → 'D-n' */
function ddayFromIso(iso: string): string {
  const target = new Date(`${iso}T00:00:00`);
  const days = Math.max(0, Math.round((startOfDay(target) - startOfDay(new Date())) / DAY_MS));
  return `D-${days}`;
}

// ─────────────────────────────────────────────────────────────────────
// 서버 → 앱 타입 매핑
// ─────────────────────────────────────────────────────────────────────

export function mapQuestion(sq: ServerQuestion, resp?: ServerResponse): Question {
  const isAi = sq.source !== 'manual';
  // 서버 스키마에 transcript_en이 없으므로 동일 문구의 목업에서 영문 번역을 재사용
  const mockMatch = mockQuestions.find((m) => m.text === sq.content);
  return {
    id: questionIds.appId(sq.id),
    text: sq.content,
    from: isAi ? '이음' : memberLabel(sq.from_member_id),
    rel: isAi ? 'AI 질문' : relOf(sq.from_member_id),
    ago: relTime(sq.created_at),
    status: sq.status === 'answered' ? 'answered' : 'pending',
    ...(isAi ? { ai: true } : {}),
    dur: resp?.duration ?? undefined,
    era: resp?.era ?? undefined,
    transcript: resp?.content ?? resp?.transcript ?? undefined,
    transcriptEn: mockMatch?.transcriptEn,
  };
}

/** 발신자 라벨 → 캡슐 카테고리 색 (mock capsules와 동일 팔레트) */
const CAPSULE_TONE: Record<string, string> = {
  엄마: '#8C5F6E',
  아빠: '#9A7B3C',
  지훈: '#5B7086',
  서연: '#7C8A55',
};

export function mapCapsule(sc: ServerCapsule): Capsule {
  const status: CapsuleStatus =
    sc.status === 'ready' || sc.status === 'open' ? sc.status : 'locked';
  const from = memberLabel(sc.from_member_id);
  return {
    id: capsuleIds.appId(sc.id),
    from,
    to: memberLabel(sc.to_member_id),
    title: sc.title,
    when: isoToDots(sc.open_date),
    status,
    dur: sc.duration ?? undefined,
    ...(status === 'locked' ? { dday: ddayFromIso(sc.open_date) } : {}),
    color: CAPSULE_TONE[from] ?? '#8C5F6E',
  };
}

const NOTIF_NAVS: NotifNav[] = ['caps', 'poll', 'album', 'c_resp'];
const NOTIF_ICON_BY_TYPE: Record<string, string> = {
  question: 'help',
  response: 'graphic_eq',
  capsule: 'mark_email_unread',
  poll: 'how_to_vote',
  face: 'face',
};

export function mapNotif(sn: ServerNotification): Notif {
  const nav = NOTIF_NAVS.includes(sn.nav_target as NotifNav)
    ? (sn.nav_target as NotifNav)
    : null;
  return {
    id: notifIds.appId(sn.id),
    icon: sn.icon ?? NOTIF_ICON_BY_TYPE[sn.type] ?? 'notifications',
    color: sn.color ?? '#7C8A55',
    title: sn.title,
    time: relTime(sn.created_at),
    unread: !sn.is_read,
    nav,
  };
}

// ─────────────────────────────────────────────────────────────────────
// 서버 세션 (데모 계정) + 최초 부트스트랩/시드
// ─────────────────────────────────────────────────────────────────────

export interface ServerSession {
  familyId: string;
  memberId: string;
  memberName: string;
  role: Role;
}

let session: ServerSession | null = null;

export function getSession(): ServerSession | null {
  return session;
}

const DEMO_PASSWORD = 'eum-demo';
const DEMO_USERNAMES: Record<Role, string> = { parent: 'eum_parent', child: 'eum_child' };
const DEMO_FAMILY_NAME = '김순자네 가족';
const DEMO_MEMBERS: { name: string; role: Role; username?: string }[] = [
  { name: '김순자', role: 'parent', username: 'eum_parent' },
  { name: '김영수', role: 'parent' },
  { name: '지훈', role: 'child', username: 'eum_child' },
  { name: '서연', role: 'child' },
];

/**
 * 데모 계정으로 로그인해 서버 세션을 확보한다.
 * 최초 실행(계정 없음)이면 가족/구성원을 만들고 목업 데이터를 시드한다.
 * → 앱 재시작 후에도 같은 계정으로 이어져 데이터가 유지된다.
 *
 * 동시 호출(앱 시작 hydrate + 로그인 hydrate)이 겹치면 가족이 중복 생성될 수
 * 있으므로 체인으로 직렬화한다.
 */
let bootstrapChain: Promise<unknown> = Promise.resolve();

export function bootstrapSession(role: Role): Promise<ServerSession> {
  const run = bootstrapChain.then(() => doBootstrap(role));
  bootstrapChain = run.catch(() => undefined); // 실패해도 다음 호출은 진행
  return run;
}

async function doBootstrap(role: Role): Promise<ServerSession> {
  if (session && session.role === role) return session;

  const username = DEMO_USERNAMES[role];
  try {
    const res = await loginMember(username, DEMO_PASSWORD);
    registerMembers(await listMembers(res.family.id));
    session = {
      familyId: res.family.id,
      memberId: res.member.id,
      memberName: res.member.name,
      role,
    };
    return session;
  } catch (e) {
    // 401/404(계정 없음)일 때만 최초 생성 플로우로 진행, 그 외(네트워크 등)는 전파
    if (!(e instanceof ApiError) || (e.status !== 401 && e.status !== 404)) throw e;
  }

  const family = await createFamily(DEMO_FAMILY_NAME);
  const created: ServerMember[] = [];
  for (const m of DEMO_MEMBERS) {
    created.push(
      await createMember({
        family_id: family.id,
        name: m.name,
        role: m.role,
        username: m.username,
        password: m.username ? DEMO_PASSWORD : undefined,
      })
    );
  }
  registerMembers(created);

  const me =
    created.find((m) => m.role === role && m.username) ?? created[role === 'parent' ? 0 : 2];
  session = { familyId: family.id, memberId: me.id, memberName: me.name, role };

  try {
    await seedDemoData(family.id, created);
  } catch (err) {
    console.warn('[eum] 데모 데이터 시드 일부 실패 (앱 동작에는 영향 없음):', err);
  }
  return session;
}

/** 최초 1회: 목업(state)과 동일한 데모 데이터를 서버에 만들어 왕복 동기화를 가능하게 한다 */
async function seedDemoData(familyId: string, members: ServerMember[]): Promise<void> {
  const byName = (name: string) => members.find((m) => m.name === name);
  const mom = byName('김순자');
  const dad = byName('김영수');
  const jihun = byName('지훈');
  const seoyeon = byName('서연');
  if (!mom || !dad || !jihun || !seoyeon) return;

  // 질문 + 답변 (오래된 것부터 생성 → created_at desc 정렬이 목업 순서와 일치)
  for (const q of [...mockQuestions].reverse()) {
    const from = q.from === '서연' ? seoyeon : jihun;
    const sq = await createQuestion({
      family_id: familyId,
      content: q.text,
      source: 'manual',
      from_member_id: from.id,
      to_member_id: mom.id,
    });
    if (q.status === 'answered' && q.transcript) {
      await createResponse({
        question_id: sq.id,
        member_id: mom.id,
        content: q.transcript,
        input_method: 'stt',
        transcript: q.transcript,
        era: q.era,
        duration: q.dur,
      });
    }
  }

  // 타임캡슐 ('가족 모두' 등 비구성원 수신자는 라벨 문자열 그대로 저장)
  const idOf = (label: string) => memberIdByLabel.get(label) ?? label;
  for (const c of [...mockCapsules].reverse()) {
    const sc = await createCapsule({
      family_id: familyId,
      from_member_id: idOf(c.from),
      to_member_id: idOf(c.to),
      title: c.title,
      open_date: dotsToIso(c.when),
      duration: c.dur,
    });
    if (c.status === 'open') await openCapsule(sc.id);
  }

  // 알림 (로그인 가능한 두 계정 모두에게 시드, 목업의 읽음 상태 반영)
  const NAV_TYPE: Record<string, string> = {
    caps: 'capsule',
    poll: 'poll',
    album: 'face',
    c_resp: 'response',
  };
  for (const target of [mom, jihun]) {
    for (const n of [...mockNotifs].reverse()) {
      const sn = await createNotification({
        member_id: target.id,
        type: (n.nav && NAV_TYPE[n.nav]) || 'question',
        title: n.title,
        icon: n.icon,
        color: n.color,
        nav_target: n.nav ?? undefined,
      });
      if (!n.unread) await markNotificationRead(sn.id);
    }
  }

  // 투표 (초기 득표 [2,1,0]: 엄마·아빠 → 0번, 서연 → 1번)
  const poll = await createPoll({
    family_id: familyId,
    title: pollTitle,
    created_by: jihun.id,
    options: [...pollLabels],
  });
  const opt = (i: number) => poll.options[i]?.id;
  if (opt(0)) {
    await votePoll(poll.id, { member_id: mom.id, option_id: opt(0)! });
    await votePoll(poll.id, { member_id: dad.id, option_id: opt(0)! });
  }
  if (opt(1)) await votePoll(poll.id, { member_id: seoyeon.id, option_id: opt(1)! });
}

// ─────────────────────────────────────────────────────────────────────
// 스토어용 하이드레이트 함수 (서버 → 앱 타입)
// ─────────────────────────────────────────────────────────────────────

export async function fetchQuestions(familyId: string): Promise<Question[]> {
  const [qs, resps] = await Promise.all([
    listQuestions({ family_id: familyId }),
    listResponses({ family_id: familyId }),
  ]);
  // 응답은 created_at desc — 질문별 최신 응답 1건만 사용 (인라인 응답 모델)
  const respByQ = new Map<string, ServerResponse>();
  for (const r of resps) if (!respByQ.has(r.question_id)) respByQ.set(r.question_id, r);
  return qs.map((q) => mapQuestion(q, respByQ.get(q.id)));
}

export async function fetchCapsules(familyId: string): Promise<Capsule[]> {
  return (await listCapsules(familyId)).map(mapCapsule);
}

export async function fetchNotifs(memberId: string): Promise<Notif[]> {
  return (await listNotifications(memberId)).map(mapNotif);
}

export async function fetchSettings(memberId: string): Promise<{
  autoTranslate: boolean;
  voiceGuide: boolean;
  fontSize: FontSizeOption;
}> {
  const s = await getSettings(memberId);
  const FONT_SIZES: readonly FontSizeOption[] = ['보통', '크게', '아주 크게'];
  const fontSize = FONT_SIZES.includes(s.font_size as FontSizeOption)
    ? (s.font_size as FontSizeOption)
    : '보통';
  return { autoTranslate: s.auto_translate, voiceGuide: s.voice_guide, fontSize };
}

/** 현재(목업과 동일한) 투표의 서버 매핑 캐시 — votePollByIndex에서 사용 */
let currentPoll: { serverId: string; optionIds: string[] } | null = null;

/**
 * 목업과 같은 제목의 투표를 찾아 옵션별 득표수 반환.
 * 화면(PollScreen)이 라벨을 mock에서 직접 읽으므로, 옵션 순서를
 * pollLabels 순서로 정렬해 인덱스가 일치하도록 맞춘다.
 */
export async function fetchPollVotes(familyId: string): Promise<number[] | null> {
  const polls = await listPolls(familyId);
  const poll = polls.find((p) => p.title === pollTitle) ?? polls[0];
  if (!poll || poll.options.length === 0) return null;

  let options = poll.options;
  if (poll.title === pollTitle) {
    const ordered = pollLabels.map((label) => poll.options.find((o) => o.label === label));
    if (ordered.every((o): o is ServerPollOption => o !== undefined)) options = ordered;
  }
  currentPoll = { serverId: poll.id, optionIds: options.map((o) => o.id) };
  return options.map((o) => o.vote_count);
}

// ─────────────────────────────────────────────────────────────────────
// 쓰기 동기화 (스토어의 낙관적 업데이트 후 best-effort 호출)
// 서버 매핑이 없는 항목(목업 전용)은 조용히 건너뛴다.
// ─────────────────────────────────────────────────────────────────────

export async function pushAnswer(
  appQuestionId: number,
  patch: { dur: string; transcript: string; era?: string }
): Promise<void> {
  const sid = questionIds.serverId(appQuestionId);
  if (!sid || !session) return;
  await createResponse({
    question_id: sid,
    member_id: session.memberId,
    content: patch.transcript,
    input_method: 'stt',
    transcript: patch.transcript,
    era: patch.era,
    duration: patch.dur,
  });
}

export async function pushVoteByIndex(index: number): Promise<void> {
  if (!session || !currentPoll) return;
  const optionId = currentPoll.optionIds[index];
  if (!optionId) return;
  await votePoll(currentPoll.serverId, { member_id: session.memberId, option_id: optionId });
}

export async function pushNotifRead(appNotifId: number): Promise<void> {
  const sid = notifIds.serverId(appNotifId);
  if (!sid) return;
  await markNotificationRead(sid);
}

export async function pushAllNotifsRead(): Promise<void> {
  if (!session) return;
  await markAllNotificationsRead(session.memberId);
}

export async function pushCapsuleOpen(appCapsuleId: number): Promise<void> {
  const sid = capsuleIds.serverId(appCapsuleId);
  if (!sid) return;
  await openCapsule(sid);
}

/** 로컬에서 봉인한 캡슐을 서버에 생성하고 앱 id와 결합 */
export async function pushSealCapsule(cap: {
  id: number;
  from: string;
  to: string;
  title: string;
  when: string; // '2027. 7. 9'
  dur?: string;
}): Promise<void> {
  if (!session) return;
  const sc = await createCapsule({
    family_id: session.familyId,
    from_member_id: memberIdByLabel.get(cap.from) ?? session.memberId,
    to_member_id: memberIdByLabel.get(cap.to) ?? cap.to,
    title: cap.title,
    open_date: dotsToIso(cap.when),
    duration: cap.dur,
  });
  capsuleIds.bind(cap.id, sc.id);
}

export async function pushSettings(patch: {
  font_size?: string;
  voice_guide?: boolean;
  auto_translate?: boolean;
}): Promise<void> {
  if (!session) return;
  await updateSettings(session.memberId, patch);
}
