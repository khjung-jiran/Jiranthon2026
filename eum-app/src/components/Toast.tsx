import React, { useEffect, useRef } from 'react';
import { Text, Animated, StyleSheet } from 'react-native';
import { colors, fonts, radius, shadow } from '../theme';
import { Icon } from '../icons';
import { useStore } from '../store/useStore';

export interface ToastProps {
  message: string;
  /** 좌측 아이콘 글리프명 (기본 check_circle) */
  icon?: string;
}

/**
 * 하단 토스트 (원본 라인 826~829).
 * absolute left22 right22 bottom100, bg #2E2318, 흰 글자 15/600, radius16,
 * check_circle 아이콘 색 #B4C77F. fadeUp 애니메이션.
 */
export function Toast({ message, icon = 'check_circle' }: ToastProps) {
  const y = useRef(new Animated.Value(14)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    y.setValue(14);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(y, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [message, y, opacity]);

  return (
    <Animated.View style={[styles.toast, shadow.toast, { opacity, transform: [{ translateY: y }] }]}>
      <Icon name={icon} size={24} color={colors.toastIcon} />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

/**
 * 전역 토스트 호스트. NavigationContainer 안쪽 최상위에 1회 마운트한다.
 * store.toast를 구독해 자동 표시/숨김.
 */
export function ToastHost() {
  const message = useStore((s) => s.toast);
  if (!message) return null;
  return <Toast message={message} />;
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: 100,
    backgroundColor: colors.toastBg,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: radius.r16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    zIndex: 30,
  },
  text: { flex: 1, color: colors.toastText, fontFamily: fonts.medium, fontSize: 15 },
});
