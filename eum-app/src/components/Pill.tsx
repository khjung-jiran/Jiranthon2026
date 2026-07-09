import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';
import { colors, fonts, radius } from '../theme';
import { Icon } from '../icons';

export interface PillProps {
  label: string;
  onPress?: () => void;
  /** 선택 상태 (기본 스킴: 활성=accent 채움/흰 글자, 비활성=흰 배경/보더) */
  active?: boolean;
  /** 색 강제 지정 — 원본의 동적 bg/fg/border 값을 그대로 넘길 때 사용 */
  bg?: string;
  fg?: string;
  borderColor?: string;
  /** 좌측 아이콘 글리프명 */
  icon?: string;
  iconColor?: string;
  iconSize?: number;
  fontSize?: number;
  /** 세로 패딩(작은 배지=7, 큰 칩=10) */
  paddingV?: number;
  paddingH?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

/**
 * 알약형 칩/배지. 원본의 선택칩(aiGapChips/capToChips/albumChips 등),
 * 상태 배지(pending/answered), 소형 라벨에 두루 쓰인다.
 * 원본 색을 그대로 재현하려면 bg/fg/borderColor를 직접 넘기고,
 * 기본 토글 스킴만 필요하면 active만 넘긴다.
 */
export function Pill({
  label,
  onPress,
  active = false,
  bg,
  fg,
  borderColor,
  icon,
  iconColor,
  iconSize = 16,
  fontSize = 13,
  paddingV = 7,
  paddingH = 14,
  style,
  textStyle,
}: PillProps) {
  const resolvedBg = bg ?? (active ? colors.accent : colors.surface);
  const resolvedFg = fg ?? (active ? colors.white : colors.textMuted4);
  const resolvedBorder = borderColor ?? (active ? colors.accent : colors.border2);

  const content = (
    <View
      style={[
        styles.base,
        {
          backgroundColor: resolvedBg,
          borderColor: resolvedBorder,
          borderRadius: radius.pill,
          paddingVertical: paddingV,
          paddingHorizontal: paddingH,
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={iconSize} color={iconColor ?? resolvedFg} /> : null}
      <Text style={[{ fontFamily: fonts.extraBold, fontSize, color: resolvedFg }, textStyle]}>{label}</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => (pressed ? { opacity: 0.85 } : null)}>
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
  },
});
