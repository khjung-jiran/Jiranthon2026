import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { ChildTabParamList } from './types';
import { commonTabNavigatorScreenOptions, makeTabScreenOptions } from './tabOptions';

import { DashboardScreen } from '../screens/child/DashboardScreen';
import { ResponseListScreen } from '../screens/child/ResponseListScreen';
import { CalendarScreen } from '../screens/family/CalendarScreen';
import { AlbumScreen } from '../screens/family/AlbumScreen';

const Tab = createBottomTabNavigator<ChildTabParamList>();

/** 자녀 모드 하단 탭: 홈(c_dash) / 이야기(c_resp) / 달력(cal) / 사진(album) */
export function ChildTabs() {
  return (
    <Tab.Navigator screenOptions={commonTabNavigatorScreenOptions}>
      <Tab.Screen name="Home" component={DashboardScreen} options={makeTabScreenOptions('Home')} />
      <Tab.Screen name="Voice" component={ResponseListScreen} options={makeTabScreenOptions('Voice')} />
      <Tab.Screen name="Calendar" component={CalendarScreen} options={makeTabScreenOptions('Calendar')} />
      <Tab.Screen name="Album" component={AlbumScreen} options={makeTabScreenOptions('Album')} />
    </Tab.Navigator>
  );
}
