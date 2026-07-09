import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { colors } from '../theme';

export interface RecordingWaveProps {
  /** 막대 색 (기본 accent) */
  color?: string;
  active?: boolean;
  /** 막대 개수 (원본 30) */
  count?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * 녹음 중 파형 (원본 getWave / @keyframes vbar: scaleY .28↔1, 1.1s, (i%9)*0.08s stagger).
 * 막대 30개: width 4, radius 4, gap 4, height 8, 컨테이너 높이 48.
 */
export function RecordingWave({ color = colors.accent, active = true, count = 30, style }: RecordingWaveProps) {
  const anims = useRef(Array.from({ length: count }, () => new Animated.Value(0.28))).current;

  useEffect(() => {
    if (!active) {
      anims.forEach((a) => a.stopAnimation(() => a.setValue(0.28)));
      return;
    }
    const loops = anims.map((a, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay((i % 9) * 80),
          Animated.timing(a, { toValue: 1, duration: 550, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(a, { toValue: 0.28, duration: 550, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [active, anims]);

  return (
    <View style={[styles.row, style]}>
      {anims.map((a, i) => (
        <Animated.View
          key={i}
          style={{ width: 4, height: 8, borderRadius: 4, backgroundColor: color, transform: [{ scaleY: a }] }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, height: 48 },
});
