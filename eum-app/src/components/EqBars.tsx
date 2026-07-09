import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { colors } from '../theme';

export interface EqBarsProps {
  /** 막대 색 (기본 accent). TTS/답변 재생 이퀄라이저에 사용 */
  color?: string;
  /** 애니메이션 재생 여부 (기본 true). false면 최소 높이로 정지 */
  active?: boolean;
  /** 막대 개수 (기본 5) */
  count?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * 재생 이퀄라이저 (원본 getEq / @keyframes eqbar: height 7px↔22px, .9s, 각 막대 0.12s stagger).
 * 막대: width 4, radius 3, gap 4, align flex-end, 컨테이너 높이 22.
 */
export function EqBars({ color = colors.accent, active = true, count = 5, style }: EqBarsProps) {
  const anims = useRef(Array.from({ length: count }, () => new Animated.Value(0))).current;

  useEffect(() => {
    if (!active) {
      anims.forEach((a) => a.stopAnimation(() => a.setValue(0)));
      return;
    }
    const loops = anims.map((a, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 120),
          Animated.timing(a, { toValue: 1, duration: 450, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(a, { toValue: 0, duration: 450, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
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
          style={{
            width: 4,
            borderRadius: 3,
            backgroundColor: color,
            height: a.interpolate({ inputRange: [0, 1], outputRange: [7, 22] }),
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 22 },
});
