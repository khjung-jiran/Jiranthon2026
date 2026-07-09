import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { colors, fonts, sizes, radius } from '../theme';
import { Icon } from '../icons';

export interface HeaderProps {
  title?: string;
  /** 제공되면 좌측에 back 버튼(arrow_back) 표시 */
  onBack?: () => void;
  /** 우측 커스텀 노드 (아이콘 버튼 등) */
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * 상단 헤더. 원본 라인 203~206 패턴:
 *  back 버튼 52x52, radius16, bg surfaceSoft, arrow_back 28 / 제목 18/700.
 */
export function Header({ title, onBack, right, style }: HeaderProps) {
  return (
    <View style={[styles.row, style]}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={6}>
          <Icon name="arrow_back" size={28} color={colors.text} />
        </Pressable>
      ) : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.spacer} />
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backBtn: {
    width: sizes.iconButton,
    height: sizes.iconButton,
    borderRadius: radius.r16,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  spacer: { flex: 1 },
});
