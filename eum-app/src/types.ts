// 공통 타입 정의 - 서버 스키마와 매칭

export type Role = 'parent' | 'child';

export interface Family {
  id: string;
  name: string;
  invite_code?: string;
  created_at: string;
}

export interface Member {
  id: string;
  family_id: string;
  name: string;
  role: Role;
  username?: string;
  birth_date?: string;
  profile_image?: string;
  created_at: string;
}

export interface LoginResult {
  member: Member;
  family: Family;
  invite_code?: string;
}

export interface Question {
  id: string;
  family_id: string;
  content: string;
  category?: string;
  source: string;
  from_member_id: string;
  to_member_id: string;
  status: 'pending' | 'answered';
  created_at: string;
}

export interface ResponseData {
  id: string;
  question_id: string;
  member_id: string;
  content: string;
  input_method: string;
  audio_file_path?: string;
  transcript?: string;
  era?: string;
  duration?: string;
  created_at: string;
}

export interface Capsule {
  id: string;
  family_id: string;
  from_member_id: string;
  to_member_id: string;
  title: string;
  audio_file_path?: string;
  open_date: string;
  status: 'locked' | 'ready' | 'open';
  duration?: string;
  created_at: string;
}

export interface CalendarEntry {
  id: string;
  family_id: string;
  date: string;
  title: string;
  created_by: string;
  tag?: string;
  color?: string;
  created_at: string;
}

export interface Photo {
  id: string;
  family_id: string;
  url: string;
  label?: string;
  who?: string;
  tone?: string;
  created_at: string;
}

export interface NotificationData {
  id: string;
  member_id: string;
  type: string;
  title: string;
  icon?: string;
  color?: string;
  is_read: boolean;
  nav_target?: string;
  created_at: string;
}

export interface PollOption {
  id: string;
  label: string;
  vote_count: number;
}

export interface Poll {
  id: string;
  family_id: string;
  title: string;
  deadline?: string;
  created_by: string;
  created_at: string;
  options: PollOption[];
}

export interface Settings {
  member_id: string;
  font_size: string;
  voice_guide: boolean;
  auto_translate: boolean;
}

export interface STTResult {
  text: string;
  audio_file_path: string;
}

export interface TTSResult {
  audio_url: string;
}

export interface AIQuestion {
  content: string;
  category: string;
  source: string;
  from_member_id: string;
  to_member_id: string;
}
