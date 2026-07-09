import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { ParentTabParamList } from './types';
import { commonTabNavigatorScreenOptions, makeTabScreenOptions } from './tabOptions';

import { HomeScreen } from '../screens/parent/HomeScreen';
import { QuestionListScreen } from '../screens/parent/QuestionListScreen';
import { CalendarScreen } from '../screens/family/CalendarScreen';
import { AlbumScreen } from '../screens/family/AlbumScreen';
import { useStore } from '../store/useStore';

const Tab = createBottomTabNavigator<ParentTabParamList>();

/** 부모 모드 하단 탭: 홈(p_home) / 이야기(p_list) / 달력(cal) / 사진(album) */
export function ParentTabs() {
  const hydrate = useStore((s) => s.hydrate);
  return (
    <Tab.Navigator
      screenOptions={commonTabNavigatorScreenOptions}
      screenListeners={{
        tabPress: () => { void hydrate(); },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={makeTabScreenOptions('Home')} />
      <Tab.Screen name="Voice" component={QuestionListScreen} options={makeTabScreenOptions('Voice')} />
      <Tab.Screen name="Calendar" component={CalendarScreen} options={makeTabScreenOptions('Calendar')} />
      <Tab.Screen name="Album" component={AlbumScreen} options={makeTabScreenOptions('Album')} />
    </Tab.Navigator>
  );
}
