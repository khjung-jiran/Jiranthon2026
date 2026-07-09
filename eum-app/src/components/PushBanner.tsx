import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadow } from '../theme';
import { Icon } from '../icons';
import { useStore } from '../store/useStore';
import { navigate } from '../navigation/navRef';

export interface PushBannerProps {
  title: string;
  onPress?: () => void;
  /** 상단 오프셋(SafeArea 반영). 기본 12 */
  top?: number;
}

/**
 * 상단 푸시 배너 (원본 라인 832~840).
 * white bg, border 1.5 #E4E2DB, radius20, padding 14/16, slideDown.
 * 좌측 아이콘 박스 44x44 radius14 accentSoft + mic(accent 24),
 * "이음 · 지금" 12/700 textFaint, 제목 16/700, 우측 "듣기" accent pill.
 */
export function PushBanner({ title, onPress, top = 12 }: PushBannerProps) {
  const y = useRef(new Animated.Value(-90)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(y, { toValue: 0, duration: 450, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 450, useNativeDriver: true }),
    ]).start();
  }, [y, opacity]);

  return (
    <Animated.View style={[styles.wrap, { top, opacity, transform: [{ translateY: y }] }]}>
      <Pressable onPress={onPress} style={[styles.banner, shadow.push]}>
        <View style={styles.iconBox}>
          <Icon name="mic" size={24} color={colors.accent} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.eyebrow}>이음 · 지금</Text>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipText}>듣기</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/**
 * 전역 푸시 호스트. NavigationContainer 안쪽에 1회 마운트.
 * store.push를 구독해 표시하고, 탭하면 해당 질문 상세로 이동한다.
 */
export function PushHost() {
  const push = useStore((s) => s.push);
  const setPush = useStore((s) => s.setPush);
  const insets = useSafeAreaInsets();
  if (!push) return null;
  return (
    <PushBanner
      title={push.title}
      top={insets.top + 6}
      onPress={() => {
        setPush(null);
        navigate('QuestionDetail', { questionId: push.qid });
      }}
    />
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 14, right: 14, zIndex: 50 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderCool,
    borderRadius: radius.r20,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.r14,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1 },
  eyebrow: { fontFamily: fonts.bold, fontSize: 12, color: colors.textFaint },
  title: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, marginTop: 2 },
  chip: { backgroundColor: colors.accent, paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.pill },
  chipText: { fontFamily: fonts.extraBold, fontSize: 13, color: colors.white },
});
