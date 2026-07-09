/**
 * 네비게이션 타입 계약. 화면은 이 타입으로 route.params / navigation.navigate를 타입세이프하게 쓴다.
 *
 *   import type { RootStackParamList } from '../navigation/types';
 *   import type { NativeStackScreenProps } from '@react-navigation/native-stack';
 *   type Props = NativeStackScreenProps<RootStackParamList, 'QuestionDetail'>;
 */
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Role } from '../types';

/** 부모/자녀 하단 탭 (라벨: 홈/이야기/달력/사진) */
export type ParentTabParamList = {
  Home: undefined; // p_home → parent/HomeScreen
  Voice: undefined; // p_list → parent/QuestionListScreen
  Calendar: undefined; // cal   → family/CalendarScreen
  Album: undefined; // album  → family/AlbumScreen
};

export type ChildTabParamList = {
  Home: undefined; // c_dash → child/DashboardScreen
  Voice: undefined; // c_resp → child/ResponseListScreen
  Calendar: undefined; // cal   → family/CalendarScreen
  Album: undefined; // album  → family/AlbumScreen
};

/** 루트 스택 (로그인 → 역할별 탭 → 위로 push되는 상세/모달 화면들) */
export type RootStackParamList = {
  Login: undefined; // common/LoginScreen
  Auth: { role: Role }; // common/AuthScreen (역할 선택 후 가입/로그인)
  ParentTabs: NavigatorScreenParams<ParentTabParamList>;
  ChildTabs: NavigatorScreenParams<ChildTabParamList>;

  // 공통/부모 스택
  Notification: undefined; // common/NotificationScreen
  QuestionDetail: { questionId: number }; // parent/QuestionDetailScreen (TTS)
  Respond: { questionId: number }; // parent/RespondScreen (녹음)
  Settings: undefined; // family/SettingsScreen
  ComingSoon: { label: string }; // family/ComingSoonScreen

  // 자녀 스택
  Compose: undefined; // child/ComposeScreen
  Storybook: undefined; // child/StorybookScreen
  Booklet: undefined; // family/BookletScreen

  // 가족 스택
  Poll: undefined; // family/PollScreen
  Capsule: undefined; // family/CapsuleScreen
  CapsuleNew: undefined; // family/CapsuleNewScreen
};

/** 탭 키 ↔ 라우트/라벨/아이콘 매핑 (원본 tabs 배열과 동일) */
export const TAB_META = {
  Home: { label: '홈', icon: 'home' },
  Voice: { label: '이야기', icon: 'graphic_eq' },
  Calendar: { label: '달력', icon: 'calendar_month' },
  Album: { label: '사진', icon: 'photo_library' },
} as const;
