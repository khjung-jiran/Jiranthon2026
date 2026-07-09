// API 클라이언트 - FastAPI 서버와 통신

import {
  AIQuestion,
  CalendarEntry,
  Capsule,
  Family,
  LoginResult,
  Member,
  NotificationData,
  Photo,
  Poll,
  Question,
  ResponseData,
  Settings,
  STTResult,
  TTSResult,
} from './types';

const API_BASE = 'http://localhost:8000';

async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API Error: ${res.status}`);
  }
  return res.json();
}

// --- Family ---
export const api = {
  // Family
  createFamily: (name: string) =>
    fetchJSON<Family>('/api/families', { method: 'POST', body: JSON.stringify({ name }) }),
  getFamily: (id: string) => fetchJSON<Family>(`/api/families/${id}`),
  joinFamily: (inviteCode: string) =>
    fetchJSON<Family>(`/api/families/join?invite_code=${inviteCode}`, { method: 'POST' }),

  // Members
  createMember: (data: { family_id: string; name: string; role: string; username?: string; password?: string; birth_date?: string }) =>
    fetchJSON<Member>('/api/members', { method: 'POST', body: JSON.stringify(data) }),
  listMembers: (familyId: string) =>
    fetchJSON<Member[]>(`/api/families/${familyId}/members`),

  // Auth
  login: (username: string, password: string) =>
    fetchJSON<LoginResult>('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getInviteCode: (familyId: string) =>
    fetchJSON<{ invite_code: string }>(`/api/families/${familyId}/invite-code`),

  // Questions
  createQuestion: (data: { family_id: string; content: string; from_member_id: string; to_member_id: string; category?: string; source?: string }) =>
    fetchJSON<Question>('/api/questions', { method: 'POST', body: JSON.stringify(data) }),
  listQuestions: (params: { to_member_id?: string; from_member_id?: string; family_id?: string }) => {
    const qs = new URLSearchParams();
    if (params.to_member_id) qs.set('to_member_id', params.to_member_id);
    if (params.from_member_id) qs.set('from_member_id', params.from_member_id);
    if (params.family_id) qs.set('family_id', params.family_id);
    return fetchJSON<Question[]>(`/api/questions?${qs}`);
  },
  getQuestion: (id: string) => fetchJSON<Question>(`/api/questions/${id}`),
  deleteQuestion: (id: string) =>
    fetchJSON<{ success: boolean }>(`/api/questions/${id}`, { method: 'DELETE' }),
  getAIQuestions: (category?: string, count = 4) =>
    fetchJSON<{ questions: AIQuestion[] }>(`/api/questions/ai-suggestions?category=${category || ''}&count=${count}`),

  // Responses
  createResponse: (data: { question_id: string; member_id: string; content: string; input_method?: string; audio_file_path?: string; transcript?: string; era?: string; duration?: string }) =>
    fetchJSON<ResponseData>('/api/responses', { method: 'POST', body: JSON.stringify(data) }),
  listResponses: (params: { question_id?: string; family_id?: string; member_id?: string }) => {
    const qs = new URLSearchParams();
    if (params.question_id) qs.set('question_id', params.question_id);
    if (params.family_id) qs.set('family_id', params.family_id);
    if (params.member_id) qs.set('member_id', params.member_id);
    return fetchJSON<ResponseData[]>(`/api/responses?${qs}`);
  },
  responseStats: (familyId: string) =>
    fetchJSON<{ pending: number; answered: number }>(`/api/responses/stats?family_id=${familyId}`),

  // Capsules
  createCapsule: (data: { family_id: string; from_member_id: string; to_member_id: string; title: string; open_date: string; audio_file_path?: string; duration?: string }) =>
    fetchJSON<Capsule>('/api/capsules', { method: 'POST', body: JSON.stringify(data) }),
  listCapsules: (familyId: string) => fetchJSON<Capsule[]>(`/api/capsules?family_id=${familyId}`),
  readyCapsules: (familyId: string) => fetchJSON<Capsule[]>(`/api/capsules/ready?family_id=${familyId}`),
  getCapsule: (id: string) => fetchJSON<Capsule>(`/api/capsules/${id}`),
  openCapsule: (id: string) => fetchJSON<{ success: boolean }>(`/api/capsules/${id}/open`, { method: 'POST' }),

  // Calendar
  createCalendarEntry: (data: { family_id: string; date: string; title: string; created_by: string; tag?: string; color?: string }) =>
    fetchJSON<CalendarEntry>('/api/calendar/entries', { method: 'POST', body: JSON.stringify(data) }),
  listCalendarEntries: (familyId: string, month?: string) =>
    fetchJSON<CalendarEntry[]>(`/api/calendar/entries?family_id=${familyId}${month ? `&month=${month}` : ''}`),
  deleteCalendarEntry: (id: string) =>
    fetchJSON<{ success: boolean }>(`/api/calendar/entries/${id}`, { method: 'DELETE' }),

  // Album
  listPhotos: (familyId: string, who?: string) =>
    fetchJSON<Photo[]>(`/api/album?family_id=${familyId}${who ? `&who=${who}` : ''}`),
  deletePhoto: (id: string) => fetchJSON<{ success: boolean }>(`/api/album/${id}`, { method: 'DELETE' }),

  // Notifications
  listNotifications: (memberId: string) =>
    fetchJSON<NotificationData[]>(`/api/notifications?member_id=${memberId}`),
  unreadCount: (memberId: string) =>
    fetchJSON<{ count: number }>(`/api/notifications/unread-count?member_id=${memberId}`),
  markRead: (id: string) => fetchJSON<{ success: boolean }>(`/api/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: (memberId: string) =>
    fetchJSON<{ success: boolean }>(`/api/notifications/read-all?member_id=${memberId}`, { method: 'POST' }),

  // Polls
  createPoll: (data: { family_id: string; title: string; created_by: string; options: string[] }) =>
    fetchJSON<Poll>('/api/polls', { method: 'POST', body: JSON.stringify(data) }),
  listPolls: (familyId: string) => fetchJSON<Poll[]>(`/api/polls?family_id=${familyId}`),
  getPoll: (id: string) => fetchJSON<Poll>(`/api/polls/${id}`),
  vote: (pollId: string, memberId: string, optionId: string) =>
    fetchJSON<{ success: boolean }>(`/api/polls/${pollId}/vote`, { method: 'POST', body: JSON.stringify({ member_id: memberId, option_id: optionId }) }),

  // Settings
  getSettings: (memberId: string) => fetchJSON<Settings>(`/api/settings?member_id=${memberId}`),
  updateSettings: (memberId: string, data: { font_size?: string; voice_guide?: boolean; auto_translate?: boolean }) =>
    fetchJSON<{ success: boolean }>(`/api/settings?member_id=${memberId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // STT
  transcribe: (filePath: string, engine = 'whisper') =>
    fetchJSON<STTResult>('/api/stt/transcribe', { method: 'POST', body: JSON.stringify({ file_path: filePath, engine }) }),

  // TTS
  synthesize: (text: string) =>
    fetchJSON<TTSResult>('/api/tts/synthesize', { method: 'POST', body: JSON.stringify({ text }) }),

  // Upload
  uploadAudio: async (uri: string) => {
    const formData = new FormData();
    formData.append('file', { uri, type: 'audio/m4a', name: 'recording.m4a' } as any);
    const res = await fetch(`${API_BASE}/api/uploads/audio`, { method: 'POST', body: formData });
    return res.json();
  },
  uploadImage: async (uri: string, familyId: string, who?: string, label?: string) => {
    const formData = new FormData();
    formData.append('file', { uri, type: 'image/jpeg', name: 'photo.jpg' } as any);
    const res = await fetch(`${API_BASE}/api/uploads/image?family_id=${familyId}&who=${who || ''}&label=${label || ''}`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },
};
