import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import {
  useFonts,
  NotoSansKR_400Regular,
  NotoSansKR_500Medium,
  NotoSansKR_700Bold,
  NotoSansKR_800ExtraBold,
} from '@expo-google-fonts/noto-sans-kr';

import { RootNavigator } from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navRef';
import { ToastHost, PushHost } from './src/components';
import { colors } from './src/theme';

export default function App() {
  const [fontsLoaded] = useFonts({
    NotoSansKR_400Regular,
    NotoSansKR_500Medium,
    NotoSansKR_700Bold,
    NotoSansKR_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: colors.bgScreen }}>
        <StatusBar style="dark" />
        <NavigationContainer ref={navigationRef}>
          <RootNavigator />
          {/* 전역 오버레이 (탭/스택 위) */}
          <PushHost />
          <ToastHost />
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
}
