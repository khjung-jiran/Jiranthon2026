import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { useStore } from '../store/useStore';

import { ParentTabs } from './ParentTabs';
import { ChildTabs } from './ChildTabs';

import { LoginScreen } from '../screens/common/LoginScreen';
import { NotificationScreen } from '../screens/common/NotificationScreen';
import { QuestionDetailScreen } from '../screens/parent/QuestionDetailScreen';
import { RespondScreen } from '../screens/parent/RespondScreen';
import { SettingsScreen } from '../screens/family/SettingsScreen';
import { ComingSoonScreen } from '../screens/family/ComingSoonScreen';
import { ComposeScreen } from '../screens/child/ComposeScreen';
import { StorybookScreen } from '../screens/child/StorybookScreen';
import { BookletScreen } from '../screens/family/BookletScreen';
import { PollScreen } from '../screens/family/PollScreen';
import { CapsuleScreen } from '../screens/family/CapsuleScreen';
import { CapsuleNewScreen } from '../screens/family/CapsuleNewScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * 루트 스택. role에 따라 초기 진입을 로그인/부모탭/자녀탭으로 분기.
 * 상세/모달 화면은 탭 위로 push된다. (헤더는 각 화면이 자체 Header 컴포넌트로 렌더)
 */
export function RootNavigator() {
  const role = useStore((s) => s.role);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {role === null ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : role === 'parent' ? (
        <Stack.Screen name="ParentTabs" component={ParentTabs} />
      ) : (
        <Stack.Screen name="ChildTabs" component={ChildTabs} />
      )}

      {/* 공통/부모 스택 */}
      <Stack.Screen name="Notification" component={NotificationScreen} />
      <Stack.Screen name="QuestionDetail" component={QuestionDetailScreen} />
      <Stack.Screen name="Respond" component={RespondScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="ComingSoon" component={ComingSoonScreen} />

      {/* 자녀 스택 */}
      <Stack.Screen name="Compose" component={ComposeScreen} />
      <Stack.Screen name="Storybook" component={StorybookScreen} />
      <Stack.Screen name="Booklet" component={BookletScreen} />

      {/* 가족 스택 */}
      <Stack.Screen name="Poll" component={PollScreen} />
      <Stack.Screen name="Capsule" component={CapsuleScreen} />
      <Stack.Screen name="CapsuleNew" component={CapsuleNewScreen} />
    </Stack.Navigator>
  );
}
