import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';
import { colors, fonts, radius, sizes, shadow } from '../theme';
import { Icon } from '../icons';

export type ButtonVariant = 'primary' | 'parentPrimary' | 'secondary' | 'ghost';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  /** 좌측 아이콘 글리프명 (예: 'mic', 'send') */
  icon?: string;
  iconSize?: number;
  disabled?: boolean;
  /** 높이 override (기본: primary 56 / parentPrimary 64) */
  height?: number;
  /** 라운드 override */
  radius?: number;
  /** 폰트 크기 override */
  fontSize?: number;
  /** 배경/글자색 강제 지정 (원본의 동적 색 대응) */
  bg?: string;
  fg?: string;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

/**
 * 공통 버튼.
 *  - primary        : 강조 채움, 높이 56, radius16, 17/800 (확인·간직 등)
 *  - parentPrimary  : 부모용 큰 버튼, 높이 64, radius18, 19/800 + 그림자 (답변 보내기)
 *  - secondary      : 흰 배경 + 보더 (선택형)
 *  - ghost          : 배경 없음 (텍스트 버튼)
 * disabled 시 배경 knobOff(#E0D2BF), 글자 textFaint.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconSize,
  disabled = false,
  height,
  radius: radiusProp,
  fontSize,
  bg,
  fg,
  fullWidth = true,
  style,
  textStyle,
}: ButtonProps) {
  const v = VARIANTS[variant];
  const resolvedBg = disabled ? colors.border4 : bg ?? v.bg;
  const resolvedFg = disabled ? colors.textFaint : fg ?? v.fg;
  const h = height ?? v.height;
  const r = radiusProp ?? v.radius;
  const fs = fontSize ?? v.fontSize;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          height: h,
          borderRadius: r,
          backgroundColor: resolvedBg,
          borderWidth: v.borderWidth,
          borderColor: v.borderColor,
          opacity: pressed && !disabled ? 0.9 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        variant === 'parentPrimary' && !disabled ? shadow.accentButton : null,
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={iconSize ?? v.iconSize} color={resolvedFg} /> : null}
      <Text style={[{ fontFamily: fonts.extraBold, fontSize: fs, color: resolvedFg }, textStyle]}>{label}</Text>
    </Pressable>
  );
}

const VARIANTS: Record<
  ButtonVariant,
  { bg: string; fg: string; height: number; radius: number; fontSize: number; iconSize: number; borderWidth: number; borderColor: string }
> = {
  primary: { bg: colors.accent, fg: colors.white, height: sizes.buttonMd, radius: radius.r16, fontSize: 17, iconSize: 22, borderWidth: 0, borderColor: 'transparent' },
  parentPrimary: { bg: colors.accent, fg: colors.white, height: sizes.buttonXl, radius: radius.r18, fontSize: 19, iconSize: 24, borderWidth: 0, borderColor: 'transparent' },
  secondary: { bg: colors.surface, fg: colors.text, height: sizes.buttonMd, radius: radius.r16, fontSize: 16, iconSize: 20, borderWidth: 1.5, borderColor: colors.border2 },
  ghost: { bg: 'transparent', fg: colors.textMuted, height: 44, radius: radius.r12, fontSize: 15, iconSize: 20, borderWidth: 0, borderColor: 'transparent' },
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
});
