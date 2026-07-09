import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { colors, radius as radiusToken, shadow } from '../theme';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  /** 라운드 (기본 22 — 홈 카드) */
  radius?: number;
  /** 내부 패딩 (기본 22) */
  padding?: number;
  /** 보더 색 (기본 border3 #EBDECB). null이면 보더 없음 */
  borderColor?: string | null;
  borderWidth?: number;
  /** 점선 보더 */
  dashed?: boolean;
  backgroundColor?: string;
  /** 은은한 카드 그림자 */
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * 카드 컨테이너. 원본 홈 카드: 흰 배경, radius22, border 1.5 #EBDECB, padding 22.
 * onPress가 있으면 눌리는 카드(버튼형).
 */
export function Card({
  children,
  onPress,
  radius = radiusToken.lg,
  padding = 22,
  borderColor = colors.border3,
  borderWidth = 1.5,
  dashed = false,
  backgroundColor = colors.surface,
  elevated = false,
  style,
}: CardProps) {
  const cardStyle: StyleProp<ViewStyle> = [
    styles.base,
    {
      borderRadius: radius,
      padding,
      backgroundColor,
      borderWidth: borderColor ? borderWidth : 0,
      borderColor: borderColor ?? undefined,
      borderStyle: dashed ? 'dashed' : 'solid',
    },
    elevated ? shadow.card : null,
    style,
  ];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [cardStyle, pressed ? { opacity: 0.92 } : null]}>
        {children}
      </Pressable>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {},
});
