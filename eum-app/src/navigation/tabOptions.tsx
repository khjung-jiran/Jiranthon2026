import React from 'react';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { colors, fonts, sizes } from '../theme';
import { Icon } from '../icons';
import { TAB_META } from './types';

type TabName = keyof typeof TAB_META;

/**
 * 하단 탭바 공통 옵션 (원본 라인 812~824).
 * 흰 배경 + 상단보더 #EEE2D1, 아이콘 26, 라벨 11/700, 활성 accent / 비활성 textFaint.
 * 홈 인디케이터 바는 SafeArea가 처리(가짜 렌더 금지).
 */
export function makeTabScreenOptions(routeName: TabName): BottomTabNavigationOptions {
  const meta = TAB_META[routeName];
  return {
    headerShown: false,
    tabBarLabel: meta.label,
    tabBarActiveTintColor: colors.accent,
    tabBarInactiveTintColor: colors.textFaint,
    tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: sizes.tabLabel },
    tabBarIcon: ({ color }) => <Icon name={meta.icon} size={sizes.tabIcon} color={color} />,
  };
}

export const commonTabBarStyle = {
  backgroundColor: colors.surface,
  borderTopColor: colors.border,
  borderTopWidth: 1,
  paddingTop: 9,
} as const;

export const commonTabNavigatorScreenOptions: BottomTabNavigationOptions = {
  headerShown: false,
  tabBarStyle: commonTabBarStyle,
};
