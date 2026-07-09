import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { colors } from '../theme';

export interface PulseRingProps {
  /** 원 지름(px) — 녹음 버튼과 동일 크기로 겹쳐 그린다 */
  size: number;
  color?: string;
}

/**
 * 녹음중 정지 버튼 뒤 펄스 링 (원본 @keyframes pulseRing, 이음.dc.html 26줄:
 * scale(.9)→scale(1.75), opacity .55→0, 1.5s ease-out infinite).
 * RespondScreen(부모, 104px)·CapsuleNewScreen(가족, 84px)에서 공용으로 사용.
 */
export function PulseRing({ size, color = colors.danger }: PulseRingProps) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(v, { toValue: 1, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true })
    );
    loop.start();
    return () => {
      loop.stop();
      v.setValue(0);
    };
  }, [v]);

  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.75] });
  const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  return (
    <Animated.View
      style={[
        styles.ring,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color, transform: [{ scale }], opacity },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  ring: { position: 'absolute' },
});
