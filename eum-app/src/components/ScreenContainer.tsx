import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors } from '../theme';

export interface ScreenContainerProps {
  children: React.ReactNode;
  /** 배경색 (기본: bgScreen #FAF3EA) */
  backgroundColor?: string;
  /** SafeArea 적용 가장자리. 탭 화면은 ['top'] 권장(하단은 탭바가 처리). 기본 ['top','bottom'] */
  edges?: Edge[];
  /** true면 내용을 ScrollView로 감쌈 */
  scroll?: boolean;
  /** 바깥 컨테이너 스타일 */
  style?: StyleProp<ViewStyle>;
  /** scroll일 때 contentContainerStyle */
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * 화면 최상위 래퍼. 원본의 가짜 상태바(9:41)는 렌더하지 않고 SafeAreaView로 처리.
 * 원본 프레임 chrome(둥근 폰 프레임)도 렌더하지 않는다.
 */
export function ScreenContainer({
  children,
  backgroundColor = colors.bgScreen,
  edges = ['top', 'bottom'],
  scroll = false,
  style,
  contentContainerStyle,
}: ScreenContainerProps) {
  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor }, style]}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={contentContainerStyle}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
});
