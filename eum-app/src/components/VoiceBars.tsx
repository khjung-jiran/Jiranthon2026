import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { colors } from '../theme';

export interface VoiceBarsProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * 로그인 화면 로고 파형 (원본 라인 50~56).
 * 정적 5개 막대: width 7, radius 4, height [26,52,36,58,30],
 * 색 [accent, accent, olive, accent, olive], gap 6, align flex-end, 컨테이너 높이 58.
 */
export function VoiceBars({ style }: VoiceBarsProps) {
  const bars: { h: number; c: string }[] = [
    { h: 26, c: colors.accent },
    { h: 52, c: colors.accent },
    { h: 36, c: colors.olive },
    { h: 58, c: colors.accent },
    { h: 30, c: colors.olive },
  ];
  return (
    <View style={[styles.row, style]}>
      {bars.map((b, i) => (
        <View key={i} style={{ width: 7, height: b.h, borderRadius: 4, backgroundColor: b.c }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 58 },
});
