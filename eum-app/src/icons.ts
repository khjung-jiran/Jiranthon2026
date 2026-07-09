/**
 * Material Symbols Outlined(원본 글리프명) → @expo/vector-icons MaterialIcons 이름 매핑.
 * 화면에서는 반드시 <Icon name="mic" .../> 형태로 "원본 글리프명"을 그대로 쓴다.
 * (아래 map이 MaterialIcons 이름으로 변환) — 매핑에 없으면 kebab-case로 폴백.
 *
 * 참고: play_circle / pause_circle 는 원본이 Outlined 스타일이라 -outline 변형으로 매핑.
 */
import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import type { StyleProp, TextStyle } from 'react-native';
import { colors } from './theme';

type MI = React.ComponentProps<typeof MaterialIcons>['name'];

/** 원본에서 사용된 글리프 전부 커버 */
export const iconMap: Record<string, MI> = {
  add: 'add',
  add_comment: 'add-comment',
  add_photo_alternate: 'add-photo-alternate',
  arrow_back: 'arrow-back',
  arrow_forward: 'arrow-forward',
  auto_awesome: 'auto-awesome',
  auto_stories: 'auto-stories',
  battery_full: 'battery-full',
  calendar_month: 'calendar-month',
  campaign: 'campaign',
  check: 'check',
  check_circle: 'check-circle',
  chevron_left: 'chevron-left',
  chevron_right: 'chevron-right',
  construction: 'construction',
  drafts: 'drafts',
  edit_note: 'edit-note',
  elderly: 'elderly',
  event_repeat: 'event-repeat',
  face: 'face',
  family_restroom: 'family-restroom',
  graphic_eq: 'graphic-eq',
  help: 'help',
  home: 'home',
  hourglass_top: 'hourglass-top',
  how_to_vote: 'how-to-vote',
  image: 'image',
  lock: 'lock',
  mark_email_unread: 'mark-email-unread',
  menu_book: 'menu-book',
  mic: 'mic',
  notifications: 'notifications',
  pause_circle: 'pause-circle-outline',
  person_add: 'person-add',
  photo_camera: 'photo-camera',
  photo_library: 'photo-library',
  play_circle: 'play-circle-outline',
  print: 'print',
  radio_button_unchecked: 'radio-button-unchecked',
  replay: 'replay',
  schedule: 'schedule',
  sell: 'sell',
  send: 'send',
  settings: 'settings',
  signal_cellular_alt: 'signal-cellular-alt',
  stop: 'stop',
  supervisor_account: 'supervisor-account',
  swap_horiz: 'swap-horiz',
  translate: 'translate',
  wifi: 'wifi',
};

export function resolveIcon(glyph: string): MI {
  return iconMap[glyph] ?? (glyph.replace(/_/g, '-') as MI);
}

export interface IconProps {
  /** 원본 Material Symbols 글리프명 (예: 'mic', 'play_circle') */
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

/**
 * 공통 아이콘 컴포넌트.
 *   <Icon name="mic" size={24} color={colors.accent} />
 */
export function Icon({ name, size = 24, color = colors.text, style }: IconProps) {
  return React.createElement(MaterialIcons, { name: resolveIcon(name), size, color, style });
}
