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
import { Platform } from 'react-native';
import { ApiError, apiGet, apiPost, apiPut, request, getApiBase } from './client';
import type {
  Capsule,
  CapsuleStatus,
  FontSizeOption,
  Notif,
  NotifNav,
  Question,
  Role,
} from '../types';

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
}): Promise<{ questions: Array<string | { content: string; [k: string]: unknown }> }> {
  return apiGet<{ questions: Array<string | { content: string; [k: string]: unknown }> }>('/api/questions/ai-suggestions', params);
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

// -- 스토리북 (routers/question.py) --
export interface StoryChapter {
  category: string;
  label: string;
  title: string;
  body: string;
  count: number;
  has_new: boolean;
}

export function getStorybook(familyId: string): Promise<{ chapters: StoryChapter[] }> {
  return apiGet<{ chapters: StoryChapter[] }>('/api/storybook', { family_id: familyId });
}

export function generateStorybook(familyId: string): Promise<{ chapters: StoryChapter[] }> {
  return request<{ chapters: StoryChapter[] }>('/api/storybook', { method: 'POST', body: { family_id: familyId }, timeoutMs: 120000 });
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

// -- 캘린더 (routers/calendar.py) --
export interface ServerCalendarEntry {
  id: string;
  family_id: string;
  date: string; // 'YYYY-MM-DD'
  title: string;
  created_by: string;
  tag: string | null;
  color: string | null;
  created_at: string;
}

export function listCalendarEntries(familyId: string, month?: string): Promise<ServerCalendarEntry[]> {
  return apiGet<ServerCalendarEntry[]>('/api/calendar/entries', { family_id: familyId, month });
}

export function createCalendarEntry(payload: {
  family_id: string;
  date: string;
  title: string;
  created_by: string;
  tag?: string;
  color?: string;
}): Promise<ServerCalendarEntry> {
  return apiPost<ServerCalendarEntry>('/api/calendar/entries', payload);
}

// -- 앨범 (routers/album.py) --
export interface ServerPhoto {
  id: string;
  family_id: string;
  url: string;
  label: string | null;
  who: string | null;
  created_at: string;
}

export function listPhotos(familyId: string, who?: string): Promise<ServerPhoto[]> {
  return apiGet<ServerPhoto[]>('/api/album', { family_id: familyId, who });
}

// -- STT/TTS (routers/voice.py) --
export function transcribeAudio(filePath: string, engine?: string): Promise<{ text: string; audio_file_path: string }> {
  return request<{ text: string; audio_file_path: string }>('/api/stt/transcribe', { method: 'POST', body: { file_path: filePath, engine: engine ?? 'whisper', language: 'ko' }, timeoutMs: 120000 });
}

export function synthesizeTTS(text: string): Promise<{ audio_url: string }> {
  return apiPost<{ audio_url: string }>('/api/tts/synthesize', { text });
}

export async function uploadAudioFile(uri: string): Promise<{ file_path: string; filename: string; url: string }> {
  const formData = new FormData();
  if (Platform.OS === 'web') {
    // 웹: blob URI → Blob 객체를 직접 FormData에 append
    const resp = await fetch(uri);
    const blob = await resp.blob();
    formData.append('file', blob, 'audio.webm');
  } else {
    // 네이티브: RN FormData가 {uri, name, type} 객체를 지원
    formData.append('file', {
      uri,
      name: 'audio.wav',
      type: 'audio/wav',
    } as any);
  }
  const res = await fetch(`${getApiBase()}/api/uploads/audio`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new ApiError(`오디오 업로드 실패: ${res.status}`, res.status);
  return res.json();
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
  return {
    id: questionIds.appId(sq.id),
    text: sq.content,
    from: isAi ? '이음' : memberLabel(sq.from_member_id),
    rel: isAi ? 'AI 질문' : relOf(sq.from_member_id),
    ago: relTime(sq.created_at),
    status: sq.status === 'answered' ? 'answered' : 'pending',
    ...(isAi ? { ai: true } : {}),
    category: sq.category ?? undefined,
    dur: resp?.duration ?? undefined,
    transcript: resp?.content ?? resp?.transcript ?? undefined,
    audioUrl: resp?.audio_file_path ?? undefined,
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

const SESSION_KEY = 'eum_session';

let session: ServerSession | null = null;

export function getSession(): ServerSession | null {
  if (session) return session;
  // 새로고침 후 메모리 세션이 비어있으면 localStorage에서 복원
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      session = JSON.parse(raw) as ServerSession;
      return session;
    }
  } catch { /* ignore */ }
  return null;
}

function saveSession(s: ServerSession): void {
  session = s;
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

/** 로그아웃 시 모듈 세션 초기화 (다음 로그인 시 새 세션 확보) */
export function clearSession(): void {
  session = null;
  try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
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
    saveSession({
      familyId: res.family.id,
      memberId: res.member.id,
      memberName: res.member.name,
      role,
    });
    return session!;
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
  saveSession({ familyId: family.id, memberId: me.id, memberName: me.name, role });

  return session!;
}

// ─────────────────────────────────────────────────────────────────────
// 실계정 가입/로그인 (AuthScreen)
// ─────────────────────────────────────────────────────────────────────

/** 가입/로그인 성공 결과 — 스토어 authLogin()에 그대로 전달한다. */
export interface AuthResult {
  session: ServerSession;
  member: ServerMember;
  family: ServerFamily;
  /** 가족 초대 코드 (가족 공유용) */
  inviteCode: string | null;
  /** 이번 가입에서 가족을 새로 만들었는지 (초대코드 안내 모달 노출 여부) */
  createdFamily: boolean;
}

/** 로그인 응답으로 모듈 세션을 확정하고 구성원 라벨 매핑을 등록한다. */
async function establishSession(res: ServerLoginResponse): Promise<ServerSession> {
  try {
    registerMembers(await listMembers(res.family.id));
  } catch {
    // 라벨 매핑 실패는 치명적이지 않음 (표시명이 원문으로 나올 뿐)
    registerMembers([res.member]);
  }
  const role: Role = res.member.role === 'parent' ? 'parent' : 'child';
  saveSession({
    familyId: res.family.id,
    memberId: res.member.id,
    memberName: res.member.name,
    role,
  });
  return session!;
}

/**
 * 회원가입 체인: 가족 생성 or 초대코드 참여 → 멤버 생성 → 로그인.
 * - inviteCode가 있으면 참여(404 = 잘못된 코드), 없으면 familyName으로 새 가족 생성.
 * - createMember는 아이디 중복 시 409를 throw한다.
 * - 성공 시 데모 bootstrapSession과 동일한 모듈 세션이 확보되어,
 *   이후 store.hydrate()의 bootstrapSession()이 이 세션을 재사용한다(데모 계정 미생성).
 */
export async function signup(input: {
  name: string;
  username: string;
  password: string;
  role: Role;
  familyName?: string;
  inviteCode?: string;
}): Promise<AuthResult> {
  let family: ServerFamily;
  let createdFamily = false;
  if (input.inviteCode) {
    family = await joinFamily(input.inviteCode);
  } else {
    family = await createFamily(input.familyName?.trim() || `${input.name}네 가족`);
    createdFamily = true;
  }

  await createMember({
    family_id: family.id,
    name: input.name,
    role: input.role,
    username: input.username,
    password: input.password,
  });

  const res = await loginMember(input.username, input.password);
  const sess = await establishSession(res);
  return {
    session: sess,
    member: res.member,
    family: res.family,
    inviteCode: res.invite_code ?? res.family.invite_code,
    createdFamily,
  };
}

/** 기존 계정 로그인 (401 = 아이디/비밀번호 불일치). */
export async function signin(input: {
  username: string;
  password: string;
}): Promise<AuthResult> {
  const res = await loginMember(input.username, input.password);
  const sess = await establishSession(res);
  return {
    session: sess,
    member: res.member,
    family: res.family,
    inviteCode: res.invite_code ?? res.family.invite_code,
    createdFamily: false,
  };
}

// ─────────────────────────────────────────────────────────────────────
// 스토어용 하이드레이트 함수 (서버 → 앱 타입)
// ─────────────────────────────────────────────────────────────────────

export async function fetchQuestions(familyId: string): Promise<Question[]> {
  const [qs, resps] = await Promise.all([
    listQuestions({ family_id: familyId }),
    listResponses({ family_id: familyId }),
    listMembers(familyId).then(registerMembers).catch(() => {}),
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

/** 현재 투표의 서버 매핑 캐시 — votePollByIndex에서 사용 */
let currentPoll: { serverId: string; optionIds: string[]; title: string; labels: string[] } | null = null;

/**
 * 서버에서 최신 투표를 찾아 옵션별 득표수와 라벨을 반환.
 */
export async function fetchPollVotes(familyId: string): Promise<{ votes: number[]; labels: string[]; title: string } | null> {
  const polls = await listPolls(familyId);
  const poll = polls[0];
  if (!poll || poll.options.length === 0) return null;

  const options = poll.options;
  currentPoll = { serverId: poll.id, optionIds: options.map((o) => o.id), title: poll.title, labels: options.map((o) => o.label) };
  return { votes: options.map((o) => o.vote_count), labels: options.map((o) => o.label), title: poll.title };
}

// ─────────────────────────────────────────────────────────────────────
// 쓰기 동기화 (스토어의 낙관적 업데이트 후 best-effort 호출)
// 서버 매핑이 없는 항목(목업 전용)은 조용히 건너뛴다.
// ─────────────────────────────────────────────────────────────────────

export async function pushAnswer(
  appQuestionId: number,
  patch: { dur: string; transcript: string; text?: string; from?: string; audioFilePath?: string }
): Promise<void> {
  if (!session) return;
  let sid = questionIds.serverId(appQuestionId);

  // 서버에 없는 질문(목업 등)이면 서버에 생성 후 매핑
  if (!sid) {
    if (!patch.text) return;
    const fromId = memberIdByLabel.get(patch.from ?? '') ?? session.memberId;
    // 부모에게 보낸 질문이면 to_member_id를 부모로, 아니면 현재 사용자
    const parentMember = [...membersById.values()].find((m) => m.role === 'parent');
    const toId = parentMember?.id ?? session.memberId;
    const sq = await createQuestion({
      family_id: session.familyId,
      content: patch.text,
      source: 'manual',
      from_member_id: fromId,
      to_member_id: toId,
    });
    sid = sq.id;
    questionIds.bind(appQuestionId, sid);
  }

  await createResponse({
    question_id: sid,
    member_id: session.memberId,
    content: patch.transcript,
    input_method: 'stt',
    transcript: patch.transcript,
    duration: patch.dur,
    audio_file_path: patch.audioFilePath,
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
