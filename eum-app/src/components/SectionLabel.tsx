import React from 'react';
import { Text, StyleSheet } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import { colors, fonts } from '../theme';

export interface SectionLabelProps {
  children: React.ReactNode;
  color?: string;
  fontSize?: number;
  style?: StyleProp<TextStyle>;
}

/**
 * 섹션 소제목/라벨. 원본 패턴: 13~15px, 700~800, 자간 +0.3~0.4, textFaint2 계열.
 * 예) "오늘 답할 이야기 2건", "어떻게 시작할까요?"
 */
export function SectionLabel({ children, color = colors.textFaint2, fontSize = 15, style }: SectionLabelProps) {
  return <Text style={[{ fontFamily: fonts.extraBold, fontSize, color, letterSpacing: 0.3 }, style]}>{children}</Text>;
}

const styles = StyleSheet.create({});
